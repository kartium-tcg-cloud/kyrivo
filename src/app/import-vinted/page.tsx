"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getPurchases } from "@/lib/purchases";
import { getSales } from "@/lib/sales";
import { parseVintedEmails, type VintedDraft } from "@/lib/vintedEmailParser";
import { parseVintedExtensionCapture } from "@/lib/vintedExtensionCapture";
import {
  activateVintedDraft, addVintedDrafts, clearVintedQueue,
  readVintedQueue, type VintedQueueItem,
} from "@/lib/vintedImportSession";

const fmt = (n: number | null) =>
  n === null ? "À compléter" : n.toLocaleString("fr-BE", { style: "currency", currency: "EUR" });

export default function ImportVintedPage() {
  const router = useRouter();
  const [companyId, setCompanyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [items, setItems] = useState<VintedQueueItem[]>([]);
  const [existingKeys, setExistingKeys] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [extensionStatus, setExtensionStatus] = useState("");

  // Le transfert a lieu dans cet onglet uniquement après le clic sur l'extension.
  // Le site ne récupère jamais cookies, mots de passe ou session Vinted.
  useEffect(() => {
    if (!companyId || new URLSearchParams(window.location.search).get("extension") !== "1") return;

    let received = false;
    let attempts = 0;
    const origin = window.location.origin;
    const onExtensionMessage = (event: MessageEvent) => {
      if (event.source !== window || event.origin !== origin ||
          !event.data || event.data.type !== "KYRIVO_VINTED_CAPTURE_V1" || received) return;
      received = true;
      try {
        const { transferId, drafts } = parseVintedExtensionCapture(event.data.payload);
        const before = readVintedQueue(companyId).length;
        const queue = addVintedDrafts(companyId, drafts);
        setItems(queue);
        setExtensionStatus(
          (queue.length - before) + " commande(s) détectée(s) depuis l'extension. " +
          "Vérifiez les prix, les dates et les détails avant chaque enregistrement."
        );
        window.postMessage({ type: "KYRIVO_VINTED_ACCEPTED_V1", transferId }, origin);
        window.history.replaceState(window.history.state, "", "/import-vinted");
      } catch (error) {
        setExtensionStatus(error instanceof Error ? error.message : "Transfert de l'extension non reconnu.");
      }
    };

    window.addEventListener("message", onExtensionMessage);
    // Petit handshake : le script de l'extension peut se charger avant ou après React.
    const timer = window.setInterval(() => {
      if (received || ++attempts > 12) {
        window.clearInterval(timer);
        if (!received && attempts > 12)
          setExtensionStatus("Extension non détectée. Vérifiez qu'elle est installée et rechargez l'onglet depuis son bouton.");
        return;
      }
      window.postMessage({ type: "KYRIVO_VINTED_REQUEST_V1" }, origin);
    }, 500);
    window.postMessage({ type: "KYRIVO_VINTED_REQUEST_V1" }, origin);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("message", onExtensionMessage);
    };
  }, [companyId]);

  useEffect(() => {
    let canceled = false;
    async function load() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.replace("/login"); return; }
        const { data: membership } = await supabase.from("memberships")
          .select("company_id").eq("user_id", user.id).maybeSingle();
        if (!membership) throw new Error("Votre entreprise est introuvable.");
        const cid = membership.company_id as string;
        const [purchases, sales] = await Promise.all([getPurchases(cid), getSales(cid)]);
        if (canceled) return;
        const dbKeys = new Set<string>();
        for (const p of purchases) {
          const details = p.source_details as { importKey?: string; orderReference?: string } | null;
          if (details?.importKey) dbKeys.add(details.importKey);
          if (details?.orderReference) dbKeys.add("purchase:" + details.orderReference);
        }
        for (const sale of sales) {
          const detail = sale.source_details as { importKey?: string } | null;
          if (detail?.importKey) dbKeys.add(detail.importKey);
        }
        setExistingKeys(dbKeys);
        setCompanyId(cid);
        setItems(readVintedQueue(cid));
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Impossible de charger l'import Vinted.");
      } finally {
        if (!canceled) setLoading(false);
      }
    }
    void load();
    return () => { canceled = true; };
  }, [router]);

  async function analyze() {
    if (!companyId || busy) return;
    setBusy(true);
    setMessage("");
    try {
      if (files.length > 30) throw new Error("Maximum 30 fichiers par import.");
      const parts = [inputText];
      for (const file of files) {
        if (!/\.(?:txt|eml|html|htm|md)$/i.test(file.name) || file.size > 1024 * 1024) {
          throw new Error("Fichiers autorisés : .eml, .txt, .html, .md (1 Mo maximum par fichier).");
        }
        parts.push(await file.text());
      }
      const parsed = parts.flatMap(part => parseVintedEmails(part)).filter((v): v is VintedDraft => !!v);
      if (!parsed.length) throw new Error("Aucun email d'achat ou de vente Vinted reconnu.");
      const countBefore = readVintedQueue(companyId).length;
      const next = addVintedDrafts(companyId, parsed);
      setItems(next);
      setMessage(String(next.length - countBefore) + " nouvelle(s) transaction(s) ajoutée(s). Vérifiez chaque opération avant de l'enregistrer.");
      setInputText("");
      setFiles([]);
      const picker = document.getElementById("vinted-import-files") as HTMLInputElement | null;
      if (picker) picker.value = "";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erreur de lecture des documents.");
    } finally {
      setBusy(false);
    }
  }
  function openDraft(item: VintedQueueItem) {
    if (!companyId || item.state === "saved") return;
    if (existingKeys.has(item.draft.key)) {
      setMessage("Cette transaction semble déjà enregistrée dans Kyrivo. Vérifiez les opérations existantes pour éviter un doublon.");
      return;
    }
    activateVintedDraft(companyId, item.draft.key);
    router.push(item.draft.kind === "purchase" ? "/achats" : "/ventes");
  }

  if (loading) return <div className="p-8 text-neutral-400">Chargement de l'import Vinted…</div>;

  return (
    <div className="ky-marketing mx-auto max-w-5xl px-4 pb-16 pt-8 text-neutral-200 sm:px-8">
      <div className="mb-8">
        <Link href="/dashboard" className="text-xs text-amber-400 hover:underline">← Tableau de bord</Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Importer depuis Vinted</h1>
          <span className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[10px] font-extrabold uppercase tracking-widest text-amber-300">Bêta</span>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400">
          Collez les reçus Vinted ou déposez vos emails exportés. Kyrivo prépare les achats et les ventes :
          vous contrôlez chaque champ avant de l'enregistrer. Aucune opération n'est créée automatiquement.
        </p>
      </div>

      <aside aria-label="Outil en bêta" className="mb-7 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-4 sm:p-5">
        <p className="text-sm font-semibold text-amber-200">Outil en cours de développement (bêta)</p>
        <p className="mt-2 text-sm leading-6 text-neutral-300">
          Certaines informations peuvent être mal reconnues : vérifiez toujours les montants et les données avant tout enregistrement.
          Vous avez repéré un bug ou avez une suggestion ? Tous vos retours sont appréciés à{" "}
          <a href="mailto:contact@kartium-tcg.com?subject=Retour%20import%20Vinted%20b%C3%AAta"
            className="font-semibold text-amber-300 underline underline-offset-4 hover:text-amber-200">contact@kartium-tcg.com</a>.
        </p>
        <Link href="/nouveautes/import-vinted" className="mt-3 inline-flex text-xs font-semibold text-amber-300 hover:text-amber-200 hover:underline">
          Lire le guide de l&apos;import Vinted
        </Link>
      </aside>

      {/* La réception privée reste active ; aucune promotion visible avant validation. */}
      {extensionStatus && (
        <p role="status" className="mb-6 rounded-lg border border-teal-500/20 bg-neutral-900/40 p-3 text-sm text-teal-200">
          {extensionStatus}
        </p>
      )}

      <section className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 sm:p-6">
        <h2 className="font-semibold text-white">1. Copier les bons emails Vinted</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-300">
          Utilisez <strong className="text-white">exactement ces deux types d&apos;emails reçus de Vinted</strong>,
          selon que vous avez acheté ou vendu un article :
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-blue-500/25 bg-blue-500/[0.06] p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-300">Pour importer un achat</p>
            <p className="mt-2 text-base font-semibold text-white">« Ton reçu pour la commande »</p>
            <p className="mt-2 text-xs leading-5 text-neutral-300">
              Retrouvez ce mail de reçu d&apos;achat dans votre messagerie, ouvrez-le et copiez-en tout le contenu.
            </p>
          </div>
          <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-300">Pour importer une vente</p>
            <p className="mt-2 text-base font-semibold text-white">« Ton article s&apos;est vendu ! »</p>
            <p className="mt-2 text-xs leading-5 text-neutral-300">
              Retrouvez le mail annonçant votre vente, ouvrez-le et copiez-en tout le contenu.
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-neutral-300">
          <strong className="text-white">Copiez-collez le contenu entier de l&apos;email ci-dessous</strong> :
          le titre du mail seul ne suffit pas pour extraire la transaction.
          Pour plusieurs emails collés, séparez chaque message par une ligne contenant uniquement <code className="rounded bg-neutral-800 px-1.5 py-0.5 text-amber-200">---</code>.
          Vous pouvez aussi déposer chaque email enregistré dans un fichier compatible.
        </p>
        <label htmlFor="vinted-import-text" className="mt-5 block text-sm font-semibold text-white">Contenu des emails Vinted</label>
        <textarea
          id="vinted-import-text"
          rows={7} value={inputText} onChange={e => setInputText(e.target.value)}
          placeholder="Collez ici le contenu complet de l'email Vinted « Ton reçu pour la commande » (achat) ou « Ton article s'est vendu ! » (vente)…"
          className="mt-4 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-3 text-sm text-neutral-100 outline-none focus:border-amber-500/50"
        />
        <label className="mt-3 block text-sm text-neutral-300" htmlFor="vinted-import-files">
          Ou sélectionner des emails enregistrés (.eml, .txt, .html ou .md)
        </label>
        <input
          id="vinted-import-files" type="file" multiple accept=".eml,.txt,.html,.htm,.md"
          onChange={e => setFiles(Array.from(e.target.files ?? []))}
          className="mt-2 block w-full text-xs text-neutral-400 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-700 file:px-3 file:py-2 file:text-neutral-100"
        />
        {files.length > 0 && <p className="mt-2 text-xs text-neutral-500">{files.length} fichier(s) sélectionné(s)</p>}
        <button type="button" onClick={() => void analyze()} disabled={busy || !companyId || (!inputText.trim() && files.length === 0)}
          className="mt-5 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-bold text-neutral-950 hover:bg-amber-400 disabled:opacity-40">
          {busy ? "Analyse…" : "Analyser les documents"}
        </button>
        {message && <p role="status" className="mt-3 text-sm text-amber-200">{message}</p>}
        <p className="mt-3 text-xs leading-5 text-neutral-500">
          Cette bêta analyse le texte de ces emails sans connexion à votre compte Vinted.
          Les textes originaux et les coordonnées complètes des acheteurs ne sont pas conservés dans la file.
          Les PDF et images ne sont pas encore pris en charge. Les annulations et remboursements restent à encoder manuellement.
        </p>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">2. Vérifier et enregistrer</h2>
            <p className="text-sm text-neutral-400">
              {items.filter(i => i.state === "pending").length} à traiter · {items.filter(i => i.state === "saved").length} enregistrée(s) dans cette session
            </p>
          </div>
          {items.length > 0 && <button type="button" onClick={() => {
            if (window.confirm("Effacer la file locale Vinted ? Les achats/ventes déjà enregistrés restent dans Kyrivo.")) {
              clearVintedQueue(companyId); setItems([]);
            }
          }} className="rounded-lg border border-neutral-700 px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-800">
            Vider la file
          </button>}
        </div>
        {!items.length ? (
          <p className="rounded-xl border border-dashed border-neutral-800 p-8 text-center text-sm text-neutral-500">
            Aucune transaction importée. Commencez par fournir un ou plusieurs reçus Vinted.
          </p>
        ) : (
          <div className="space-y-3">
            {items.map(item => {
              const d = item.draft;
              const duplicate = existingKeys.has(d.key);
              return (
                <article key={d.key} className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={"rounded-md px-2 py-0.5 text-xs font-semibold " +
                          (d.kind === "purchase" ? "bg-blue-500/15 text-blue-300" : "bg-emerald-500/15 text-emerald-300")}>
                          {d.kind === "purchase" ? "Achat" : "Vente"}
                        </span>
                        <span className={"text-xs " + (item.state === "saved" ? "text-emerald-300" : duplicate ? "text-red-300" : "text-amber-300")}>
                          {item.state === "saved" ? "Enregistré" : duplicate ? "Doublon probable" : d.status === "review" ? "À vérifier" : "Prêt à vérifier"}
                        </span>
                      </div>
                      <h3 className="mt-2 font-semibold text-white">{d.title || "Article non identifié"}</h3>
                      <p className="mt-1 text-xs text-neutral-400">
                        {d.counterparty ? (d.kind === "purchase" ? "Vendeur : " : "Acheteur : ") + d.counterparty + " · " : ""}
                        {d.date ?? "Date à compléter"}{d.orderReference ? " · Réf. " + d.orderReference : ""}
                      </p>
                      {d.kind === "purchase" && <p className="mt-1 text-xs text-neutral-500">
                        Article : {fmt(d.sellerPrice)} · Port : {fmt(d.shippingFee)} · Frais Vinted : {fmt(d.vintedFee)}
                      </p>}
                      {d.warnings.length > 0 && <p className="mt-2 text-xs text-amber-300/80">{d.warnings[0]}{d.warnings.length > 1 ? " (+" + (d.warnings.length - 1) + " points)" : ""}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <strong className="text-xl text-white">{fmt(d.paidTotal)}</strong>
                      <button type="button" disabled={item.state === "saved" || duplicate}
                        onClick={() => openDraft(item)}
                        className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40">
                        Ouvrir le formulaire
                      </button>
                    </div>
                  </div>
                  {duplicate && item.state !== "saved" && (
                    <p className="mt-3 text-xs text-red-300">
                      Déjà présent dans les opérations de Kyrivo : évitez un second encodage.
                    </p>
                  )}

                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

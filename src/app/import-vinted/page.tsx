"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getPurchases } from "@/lib/purchases";
import { getSales } from "@/lib/sales";
import { parseVintedEmails, type VintedDraft } from "@/lib/vintedEmailParser";
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
        <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl">Importer depuis Vinted</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400">
          Collez les reçus Vinted ou déposez vos emails exportés. Kyrivo prépare les achats et les ventes :
          vous contrôlez chaque champ avant de l'enregistrer. Aucune opération n'est créée automatiquement.
        </p>
      </div>

      <section className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 sm:p-6">
        <h2 className="font-semibold text-white">1. Fournir les emails</h2>
        <p className="mt-1 text-xs text-neutral-400">Un email par fichier. Pour plusieurs emails collés, séparez-les par une ligne contenant ---.</p>
        <textarea
          rows={7} value={inputText} onChange={e => setInputText(e.target.value)}
          placeholder="Collez ici le contenu d'un email Vinted : « Ton reçu pour la commande » ou « Ton article s'est vendu ! »..."
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
        <p className="mt-3 text-xs text-neutral-500">
          Cette première version analyse le texte des emails, sans connexion à votre compte Vinted.
          Les textes originaux et les coordonnées complètes des acheteurs ne sont pas conservés dans la file.
          Les PDF et images ne sont pas encore pris en charge.
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
            Aucune transaction importée. Commencez par fournir un ou plusieurs emails Vinted.
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

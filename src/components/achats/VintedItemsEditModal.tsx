"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { createClient } from "@/lib/supabase/client";
import type { Achat } from "@/types/achat";

interface EditArticle {
  id: string;
  nom: string;
  info: string;
  notes: string;
}

interface Props {
  achat: Achat | null;
  onFermer: () => void;
  onSaved: () => Promise<void>;
}

const inputClass =
  "w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-base text-neutral-100 placeholder:text-neutral-500 focus:border-amber-500/60 focus:outline-none sm:text-sm";

export default function VintedItemsEditModal({ achat, onFermer, onSaved }: Props) {
  const [articles, setArticles] = useState<EditArticle[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setArticles((achat?.articles ?? []).map((item) => ({
      id: item.id,
      nom: item.nom,
      info: item.taille ?? "",
      notes: item.notes ?? "",
    })));
    setError("");
  }, [achat]);

  if (!achat) return null;

  function updateArticle(id: string, field: "nom" | "info" | "notes", value: string) {
    setError("");
    setArticles((current) =>
      current.map((item) => item.id === id ? { ...item, [field]: value } : item)
    );
  }

  async function save() {
    if (saving || !achat) return;

    if (articles.some((item) => !item.nom.trim() || item.nom.trim().length > 150)) {
      setError("Chaque article doit avoir un nom (150 caractères maximum).");
      return;
    }
    if (articles.some((item) => item.info.trim().length > 32 || item.notes.trim().length > 1000)) {
      setError("Info : 32 caractères maximum. Notes : 1 000 caractères maximum.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Session expirée.");
      const { data: membership, error: memberError } = await supabase
        .from("memberships")
        .select("company_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (memberError || !membership?.company_id) throw new Error("Société introuvable.");

      for (const article of articles) {
        const previous = achat.articles?.find((item) => item.id === article.id);
        if (!previous) throw new Error("Article introuvable dans cet achat.");

        const name = article.nom.trim();
        const info = article.info.trim();
        const notes = article.notes.trim();
        if (name === previous.nom &&
            info === (previous.taille ?? "") &&
            notes === (previous.notes ?? "")) continue;

        // Uniquement les informations descriptives : jamais les montants,
        // le prix fiscal, la quantité, le statut ni les ventes déjà enregistrées.
        const { data, error: updateError } = await supabase
          .from("purchase_items")
          .update({ item_name: name, item_size: info || null, notes: notes || "" })
          .eq("id", article.id)
          .eq("purchase_document_id", achat.id)
          .eq("company_id", membership.company_id)
          .select("id");
        if (updateError || !data?.length) {
          throw new Error(updateError?.message || "La modification de cet article n'a pas été enregistrée.");
        }
      }

      await onSaved();
      toast.success("Articles mis à jour.");
      onFermer();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible d'enregistrer les modifications.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      ouvert={true}
      onFermer={saving ? () => {} : onFermer}
      titre="Modifier les articles"
      maxWidthClassName="max-w-xl"
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onFermer} disabled={saving}
            className="rounded-lg border border-neutral-700 px-4 py-2.5 text-sm text-neutral-300 disabled:opacity-50">
            Annuler
          </button>
          <button type="button" onClick={save} disabled={saving}
            className="rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-amber-400 disabled:opacity-50">
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-neutral-400">
          Modifiez librement les informations de vos articles. Les montants de l'achat
          et les ventes déjà enregistrées restent inchangés.
        </p>

        {articles.length === 0 && (
          <p className="text-sm text-neutral-400">
            Cet achat ne contient aucun article en stock.
          </p>
        )}

        {articles.map((article) => (
          <div key={article.id} className="space-y-3 rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-neutral-300">Nom de l'article</span>
              <input type="text" value={article.nom} maxLength={150}
                onChange={(e) => updateArticle(article.id, "nom", e.target.value)}
                className={inputClass} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-neutral-300">Info (taille, pointure, couleur…)</span>
              <input type="text" value={article.info} maxLength={32}
                onChange={(e) => updateArticle(article.id, "info", e.target.value)}
                placeholder="Facultatif" className={inputClass} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-neutral-300">Notes (facultatif)</span>
              <textarea rows={2} value={article.notes} maxLength={1000}
                onChange={(e) => updateArticle(article.id, "notes", e.target.value)}
                className={inputClass} />
            </label>
          </div>
        ))}
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      </div>
    </Modal>
  );
}

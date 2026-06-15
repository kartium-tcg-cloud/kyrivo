"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  SortConfig,
  SortableTh,
  dateSortValue,
  sortRows,
  toggleSort,
} from "@/lib/tableSort";

interface StockItem {
  id: string;
  item_reference: string;
  item_name: string;
  category: string | null;
  quantity: number;
  stock_quantity: number;
  unit_cost: number;
  total_cost: number;
  status: string;
  notes: string | null;
  created_at: string;
  purchases: { purchase_date: string } | { purchase_date: string }[] | null;
}

function formatEuro(n: number) {
  return Number(n).toLocaleString("fr-BE", {
    style: "currency",
    currency: "EUR",
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-BE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type StockSortKey =
  | "item_reference"
  | "item_name"
  | "category"
  | "stock_quantity"
  | "unit_cost_ttc"
  | "valeur_stock"
  | "status"
  | "purchase_date";

function getStockUnitCostTTC(item: StockItem): number {
  const qty = Number(item.quantity);
  return qty > 0
    ? Math.round((Number(item.total_cost) / qty) * 100) / 100
    : Number(item.unit_cost ?? 0);
}

function getStockPurchaseDate(item: StockItem): string {
  const purchaseRelation = Array.isArray(item.purchases)
    ? item.purchases[0]
    : item.purchases;
  return purchaseRelation?.purchase_date ?? item.created_at;
}

function getStockSortValue(item: StockItem, key: StockSortKey) {
  switch (key) {
    case "item_reference":
      return item.item_reference;
    case "item_name":
      return item.item_name;
    case "category":
      return item.category;
    case "stock_quantity":
      return Number(item.stock_quantity ?? 0);
    case "unit_cost_ttc":
      return getStockUnitCostTTC(item);
    case "valeur_stock":
      return Number(item.stock_quantity ?? 0) * getStockUnitCostTTC(item);
    case "status":
      return Number(item.stock_quantity ?? 0) > 0 ? 1 : 0;
    case "purchase_date":
      return dateSortValue(getStockPurchaseDate(item));
    default:
      return null;
  }
}

export default function StockPage() {
  const router = useRouter();
  const [items, setItems] = useState<StockItem[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtres — showInStockOnly reset à true à chaque montage
  const [showInStockOnly, setShowInStockOnly] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // Tri d'affichage du tableau
  const [sortConfig, setSortConfig] = useState<SortConfig<StockSortKey>>({
    key: "item_reference",
    direction: "desc",
  });

  // Modal modification stock
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);

  // Modal génération PDF QR codes
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedQrIds, setSelectedQrIds] = useState<Set<string>>(new Set());
  const [generatingQrPdf, setGeneratingQrPdf] = useState(false);

  useEffect(() => {
    async function loadStock() {
      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError("Utilisateur non connecté.");
          return;
        }

        const { data: membership } = await supabase
          .from("memberships")
          .select("company_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!membership?.company_id) {
          setError("Aucune société associée à ce compte.");
          return;
        }

        setCompanyId(membership.company_id);

        const { data, error: dbError } = await supabase
          .from("purchase_items")
          .select(
            `id, item_reference, item_name, category,
             quantity, stock_quantity, unit_cost, total_cost,
             status, notes, created_at,
             purchases:purchase_document_id ( purchase_date )`
          )
          .eq("company_id", membership.company_id)
          .order("created_at", { ascending: false });

        if (dbError) throw dbError;

        setItems((data ?? []) as StockItem[]);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Erreur lors du chargement du stock."
        );
      } finally {
        setLoading(false);
      }
    }

    loadStock();
  }, []);

  const categories = useMemo(() => {
    const cats = items
      .map((item) => item.category)
      .filter((c): c is string => Boolean(c));
    return [...new Set(cats)].sort();
  }, [items]);

  // Articles en stock — base pour la génération des QR codes à imprimer
  const inStockItems = useMemo(
    () => items.filter((item) => Number(item.stock_quantity) > 0),
    [items]
  );

  const filteredItems = useMemo(() => {
    let result = items;

    if (showInStockOnly) {
      result = result.filter((item) => Number(item.stock_quantity) > 0);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((item) =>
        [item.item_reference, item.item_name, item.category ?? ""].some((s) =>
          s.toLowerCase().includes(q)
        )
      );
    }

    if (filterCategory) {
      result = result.filter((item) => item.category === filterCategory);
    }

    return result;
  }, [items, showInStockOnly, search, filterCategory]);

  const sortedItems = useMemo(
    () => sortRows(filteredItems, sortConfig, getStockSortValue),
    [filteredItems, sortConfig]
  );

  const handleSort = (key: StockSortKey) => {
    setSortConfig((current) => toggleSort(current, key));
  };

  const stats = useMemo(() => {
    const articlesEnStock = items.filter(
      (item) => Number(item.stock_quantity) > 0
    ).length;
    const quantiteTotale = items.reduce(
      (sum, item) => sum + Number(item.stock_quantity ?? 0),
      0
    );
    const argentImmobilise = items
      .filter((item) => Number(item.stock_quantity) > 0)
      .reduce((sum, item) => {
        const qty = Number(item.stock_quantity ?? 0);
        const unitTTC =
          Number(item.quantity) > 0
            ? Number(item.total_cost) / Number(item.quantity)
            : Number(item.unit_cost);
        return sum + qty * unitTTC;
      }, 0);
    return { articlesEnStock, quantiteTotale, argentImmobilise };
  }, [items]);

  function handleStockUpdated(itemId: string, newStock: number) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              stock_quantity: newStock,
              status: newStock > 0 ? "in_stock" : "sold",
            }
          : item
      )
    );
  }

  // ── Génération PDF QR codes ──────────────────────────────
  function openQrModal() {
    if (generatingQrPdf) return;
    setSelectedQrIds(new Set(inStockItems.map((item) => item.id)));
    setQrModalOpen(true);
  }

  function toggleQrSelection(itemId: string) {
    setSelectedQrIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }

  function toggleSelectAllQr() {
    setSelectedQrIds((prev) =>
      prev.size === inStockItems.length
        ? new Set()
        : new Set(inStockItems.map((item) => item.id))
    );
  }

  async function confirmGenerateQrPdf() {
    if (generatingQrPdf || selectedQrIds.size === 0) return;

    try {
      setGeneratingQrPdf(true);

      const response = await fetch("/api/stock/qr-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds: [...selectedQrIds] }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Erreur lors de la génération du PDF.");
      }

      const blob = await response.blob();
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      saveAs(blob, `kyrivo-qr-stock-${dateStr}.pdf`);

      setQrModalOpen(false);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Erreur lors de la génération du PDF."
      );
    } finally {
      setGeneratingQrPdf(false);
    }
  }

  // ── Loading ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-[1440px]">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-40 rounded bg-neutral-800" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-neutral-900/40" />
            ))}
          </div>
          <div className="h-32 rounded-xl bg-neutral-900/40" />
          <div className="h-96 rounded-xl bg-neutral-900/40" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8 max-w-[1440px]">
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  // ── Empty (aucun article du tout) ────────────────────────
  if (items.length === 0) {
    return (
      <div className="p-6 lg:p-8 max-w-[1440px] flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Stock
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Gérez et suivez vos articles en stock.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-800/60 bg-neutral-900/30 px-6 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900 mb-5">
            <BoxIcon className="h-7 w-7 text-neutral-600" />
          </div>

          <h3 className="text-base font-semibold text-white mb-2">
            Votre stock est vide.
          </h3>

          <p className="text-sm text-neutral-500 max-w-sm leading-relaxed mb-6">
            Encodez un achat avec des articles pour alimenter automatiquement
            votre stock.
          </p>

          <Link
            href="/achats"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/10"
          >
            Encoder un achat
          </Link>
        </div>
      </div>
    );
  }

  // ── Page principale ──────────────────────────────────────
  return (
    <>
      <div className="p-6 lg:p-8 max-w-[1440px] flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Stock
            </h1>
            <p className="mt-2 text-sm text-neutral-500">
              {stats.articlesEnStock} article
              {stats.articlesEnStock !== 1 ? "s" : ""} en stock &middot;{" "}
              {stats.quantiteTotale} unité
              {stats.quantiteTotale !== 1 ? "s" : ""} au total
            </p>
          </div>

          <button
            type="button"
            onClick={openQrModal}
            disabled={inStockItems.length === 0}
            title={
              inStockItems.length === 0
                ? "Aucun article en stock à imprimer."
                : undefined
            }
            className="
              inline-flex items-center justify-center gap-2 self-start
              rounded-lg border border-neutral-800 bg-neutral-900
              px-4 py-2.5 text-sm font-semibold text-neutral-300
              hover:bg-neutral-800 hover:text-amber-400
              transition-colors
              disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-neutral-900 disabled:hover:text-neutral-300
            "
          >
            <QrIcon className="h-4 w-4" />
            Imprimer les QR
          </button>
        </div>

        {/* Cartes résumé */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            label="Articles en stock"
            value={String(stats.articlesEnStock)}
            icon={<BoxIcon className="h-5 w-5" />}
            accent="emerald"
          />
          <StatCard
            label="Quantité totale"
            value={String(stats.quantiteTotale)}
            icon={<StackIcon className="h-5 w-5" />}
          />
          <StatCard
            label="Argent immobilisé TTC"
            value={formatEuro(stats.argentImmobilise)}
            icon={<EuroIcon className="h-5 w-5" />}
            accent="amber"
          />
        </div>

        {/* Barre de filtres */}
        <div className="rounded-xl border border-neutral-800/60 bg-neutral-800/20 p-4 flex flex-col gap-3">
          {/* Ligne 1 : toggle + compteur */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowInStockOnly((v) => !v)}
              className={`
                inline-flex items-center gap-2.5 rounded-lg px-3.5 py-2
                text-xs font-semibold transition-all duration-150
                ${
                  showInStockOnly
                    ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40"
                    : "bg-neutral-800/60 text-neutral-400 ring-1 ring-neutral-700/40 hover:text-neutral-200"
                }
              `}
            >
              <span
                className={`
                  relative flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center
                  rounded-full border transition-all
                  ${
                    showInStockOnly
                      ? "border-emerald-400 bg-emerald-400/20"
                      : "border-neutral-600 bg-transparent"
                  }
                `}
              >
                {showInStockOnly && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                )}
              </span>
              Articles en stock uniquement&nbsp;:&nbsp;
              <span
                className={
                  showInStockOnly ? "text-emerald-400" : "text-neutral-600"
                }
              >
                {showInStockOnly ? "activé" : "désactivé"}
              </span>
            </button>

            <span className="ml-auto text-xs text-neutral-600">
              {filteredItems.length} résultat
              {filteredItems.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Ligne 2 : recherche + catégorie */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_200px]">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="Référence, article, catégorie…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="
                  w-full rounded-lg border border-neutral-700/50
                  bg-neutral-800/60 py-2 pl-9 pr-3 text-sm text-neutral-200
                  placeholder:text-neutral-500
                  focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/20
                  transition-colors duration-200
                "
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="
                rounded-lg border border-neutral-700/50
                bg-neutral-800/60 px-3 py-2 text-sm text-neutral-200
                focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/20
                transition-colors duration-200
              "
            >
              <option value="">Toutes les catégories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Empty filtré */}
        {filteredItems.length === 0 && (
          <div className="rounded-xl border border-neutral-800/60 bg-neutral-800/20 p-16 text-center">
            <BoxIcon className="mx-auto h-10 w-10 text-neutral-700 mb-3" />
            <p className="font-medium text-white mb-1">Aucun résultat.</p>
            <p className="text-sm text-neutral-500">
              Modifiez vos filtres ou désactivez le filtre des articles en stock.
            </p>
          </div>
        )}

        {/* Tableau */}
        {filteredItems.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-neutral-800/60 bg-neutral-800/20">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-700/50">
                    <SortableTh
                      label="Référence"
                      sortKey="item_reference"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      className="px-4 py-3.5 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap"
                    />
                    <SortableTh
                      label="Article"
                      sortKey="item_name"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      className="px-4 py-3.5 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider"
                    />
                    <SortableTh
                      label="Catégorie"
                      sortKey="category"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      className="px-4 py-3.5 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider"
                    />
                    <SortableTh
                      label="Stock"
                      sortKey="stock_quantity"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      align="right"
                      className="px-4 py-3.5 text-right text-[11px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap"
                    />
                    <SortableTh
                      label="Coût unit. TTC"
                      sortKey="unit_cost_ttc"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      align="right"
                      className="px-4 py-3.5 text-right text-[11px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap"
                    />
                    <SortableTh
                      label="Valeur stock TTC"
                      sortKey="valeur_stock"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      align="right"
                      className="px-4 py-3.5 text-right text-[11px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap"
                    />
                    <SortableTh
                      label="Statut"
                      sortKey="status"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      className="px-4 py-3.5 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider"
                    />
                    <SortableTh
                      label="Date achat"
                      sortKey="purchase_date"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      className="px-4 py-3.5 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap"
                    />
                    <th className="px-4 py-3.5 text-center text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-neutral-800/40">
                  {sortedItems.map((item, index) => {
                    const stockQty = Number(item.stock_quantity ?? 0);
                    const unitCostTTC =
                      Number(item.quantity) > 0
                        ? Math.round(
                            (Number(item.total_cost) / Number(item.quantity)) *
                              100
                          ) / 100
                        : Number(item.unit_cost ?? 0);
                    const valeurStock = stockQty * unitCostTTC;
                    const purchaseRelation = Array.isArray(item.purchases)
                      ? item.purchases[0]
                      : item.purchases;
                    const purchaseDate =
                      purchaseRelation?.purchase_date ?? item.created_at;

                    return (
                      <tr
                        key={item.id}
                        className={`
                          group transition-colors duration-150 hover:bg-amber-500/[0.03]
                          ${index % 2 === 0 ? "bg-transparent" : "bg-neutral-800/10"}
                        `}
                      >
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <Link
                            href={`/items/${item.id}`}
                            className="font-mono text-xs text-amber-400/80 underline decoration-amber-400/30 underline-offset-2 hover:text-amber-300 hover:decoration-amber-400/60 transition-colors"
                          >
                            {item.item_reference}
                          </Link>
                        </td>

                        <td className="px-4 py-3.5 text-neutral-200 font-medium max-w-[200px] truncate">
                          {item.item_name}
                        </td>

                        <td className="px-4 py-3.5 text-neutral-500 max-w-[140px] truncate text-xs">
                          {item.category || (
                            <span className="text-neutral-700">—</span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-right tabular-nums whitespace-nowrap">
                          <span
                            className={
                              stockQty > 0
                                ? "text-emerald-400 font-semibold"
                                : "text-neutral-700"
                            }
                          >
                            {stockQty}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-right text-neutral-300 tabular-nums whitespace-nowrap">
                          {formatEuro(unitCostTTC)}
                        </td>

                        <td className="px-4 py-3.5 text-right text-white font-semibold tabular-nums whitespace-nowrap">
                          {formatEuro(valeurStock)}
                        </td>

                        <td className="px-4 py-3.5">
                          <StockAvailabilityBadge qty={stockQty} />
                        </td>

                        <td className="px-4 py-3.5 text-neutral-500 text-xs whitespace-nowrap">
                          {formatDate(purchaseDate)}
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-center gap-1 opacity-100 md:opacity-40 md:group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                            {stockQty > 0 ? (
                              <button
                                type="button"
                                onClick={() => router.push(`/ventes?itemId=${item.id}`)}
                                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold text-neutral-400 transition-colors hover:bg-emerald-500/10 hover:text-emerald-400"
                                title="Vendre cet article"
                              >
                                <SellIcon className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Vendre</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled
                                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold text-neutral-600 cursor-not-allowed"
                                title="Stock épuisé"
                              >
                                <SellIcon className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Stock épuisé</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setEditingItem(item)}
                              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold text-neutral-400 transition-colors hover:bg-neutral-700/50 hover:text-amber-400"
                              title="Modifier le stock"
                            >
                              <PencilIcon className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Modifier</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal modification stock */}
      {editingItem && companyId && (
        <StockEditModal
          item={editingItem}
          companyId={companyId}
          onClose={() => setEditingItem(null)}
          onSuccess={handleStockUpdated}
        />
      )}

      {/* Modal génération PDF QR codes */}
      {qrModalOpen && (
        <QrPrintModal
          items={inStockItems}
          selectedIds={selectedQrIds}
          generating={generatingQrPdf}
          onToggle={toggleQrSelection}
          onToggleAll={toggleSelectAllQr}
          onCancel={() => setQrModalOpen(false)}
          onConfirm={confirmGenerateQrPdf}
        />
      )}
    </>
  );
}

// ── Modal modification manuelle du stock ───────────────────

function StockEditModal({
  item,
  companyId,
  onClose,
  onSuccess,
}: {
  item: StockItem;
  companyId: string;
  onClose: () => void;
  onSuccess: (itemId: string, newStock: number) => void;
}) {
  const [newStock, setNewStock] = useState(
    String(Math.round(Number(item.stock_quantity)))
  );
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  async function handleConfirm() {
    const trimmed = newStock.trim();

    if (!trimmed) {
      setFieldError("La quantité est obligatoire.");
      return;
    }
    if (!/^\d+$/.test(trimmed)) {
      setFieldError("La quantité doit être un entier positif (sans décimale).");
      return;
    }

    const parsed = parseInt(trimmed, 10);

    if (parsed < 0) {
      setFieldError("La quantité ne peut pas être négative.");
      return;
    }

    try {
      setSaving(true);
      setFieldError(null);

      const supabase = createClient();

      const newStatus = parsed > 0 ? "in_stock" : "sold";

      const { error: dbError } = await supabase
        .from("purchase_items")
        .update({ stock_quantity: parsed, status: newStatus })
        .eq("id", item.id)
        .eq("company_id", companyId);

      if (dbError) throw dbError;

      onSuccess(item.id, parsed);
      onClose();
    } catch (e) {
      setFieldError(
        e instanceof Error ? e.message : "Erreur lors de la mise à jour."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        className="
          w-full max-w-md rounded-2xl border border-neutral-800
          bg-neutral-950 shadow-2xl shadow-black/50 overflow-hidden
        "
      >
        <div className="h-0.5 w-full bg-gradient-to-r from-amber-500 via-amber-400 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-amber-500/25 bg-amber-500/10 text-amber-400">
              <PencilIcon className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">
                Modifier le stock
              </h2>
              <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
                {item.item_reference}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-200"
          >
            <CrossIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Infos article */}
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 px-4 py-3 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-neutral-500 text-xs">Article</span>
              <span className="text-neutral-200 text-right truncate max-w-[200px]">
                {item.item_name}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-neutral-500 text-xs">Stock actuel</span>
              <span
                className={`font-semibold tabular-nums ${
                  Number(item.stock_quantity) > 0
                    ? "text-emerald-400"
                    : "text-neutral-700"
                }`}
              >
                {Math.round(Number(item.stock_quantity))}
              </span>
            </div>
          </div>

          {/* Avertissement */}
          <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <WarningIcon className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-200/70 leading-relaxed">
              Attention, modifier le stock manuellement peut créer un écart entre
              vos achats, vos ventes et vos marges. Cette action doit servir
              uniquement à corriger une erreur, une perte, un don ou un
              ajustement réel.
            </p>
          </div>

          {/* Champ nouvelle quantité */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-500 mb-2 uppercase tracking-wider">
              Nouvelle quantité en stock
            </label>
            <input
              ref={inputRef}
              type="number"
              min={0}
              step={1}
              value={newStock}
              onChange={(e) => {
                setNewStock(e.target.value);
                if (fieldError) setFieldError(null);
              }}
              onWheel={(e) => e.currentTarget.blur()}
              placeholder="0"
              className={`
                w-full rounded-lg px-3 py-2.5 text-sm
                bg-neutral-900/60 text-neutral-200
                border ${fieldError ? "border-red-500/50" : "border-neutral-800"}
                placeholder:text-neutral-600
                focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/15
                transition-colors duration-150
              `}
            />
            {fieldError && (
              <p className="mt-1.5 text-[11px] text-red-400">{fieldError}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-neutral-800 bg-neutral-950 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="
              rounded-lg px-4 py-2 text-sm font-medium text-neutral-400
              transition-colors hover:bg-neutral-800/60 hover:text-neutral-200
              disabled:opacity-50
            "
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving}
            className="
              inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2
              text-sm font-semibold text-neutral-950
              hover:bg-amber-400 active:scale-[0.97]
              transition-all duration-200 shadow-lg shadow-amber-500/10
              disabled:cursor-not-allowed disabled:opacity-60
            "
          >
            {saving ? (
              <>
                <SpinnerIcon className="h-3.5 w-3.5 animate-spin" />
                Enregistrement…
              </>
            ) : (
              "Confirmer l'ajustement"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal génération PDF QR codes ───────────────────────────

function QrPrintModal({
  items,
  selectedIds,
  generating,
  onToggle,
  onToggleAll,
  onCancel,
  onConfirm,
}: {
  items: StockItem[];
  selectedIds: Set<string>;
  generating: boolean;
  onToggle: (itemId: string) => void;
  onToggleAll: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape" && !generating) onCancel();
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [generating, onCancel]);

  const allSelected = selectedIds.size === items.length && items.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl shadow-black/50 overflow-hidden flex flex-col max-h-[85vh]">
        <div className="h-0.5 w-full bg-gradient-to-r from-amber-500 via-amber-400 to-transparent" />

        {/* Header */}
        <div className="flex items-start gap-3 border-b border-neutral-800 px-6 py-4">
          <span className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-amber-500/25 bg-amber-500/10 text-amber-400">
            <QrIcon className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-bold tracking-tight text-white">
              Générer les QR codes du stock
            </h2>
            <p className="mt-1 text-xs text-neutral-500 leading-relaxed">
              Tous les articles actuellement en stock sont sélectionnés par défaut.
            </p>
          </div>
        </div>

        {/* Compteur + sélection */}
        <div className="flex items-center justify-between gap-3 border-b border-neutral-800 px-6 py-3">
          <span className="text-xs font-semibold text-neutral-300">
            {selectedIds.size} article{selectedIds.size !== 1 ? "s" : ""} sélectionné
            {selectedIds.size !== 1 ? "s" : ""}
          </span>
          <button
            type="button"
            onClick={onToggleAll}
            disabled={generating}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {allSelected ? "Tout désélectionner" : "Tout sélectionner"}
          </button>
        </div>

        {/* Liste des articles */}
        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-1.5">
          {items.map((item) => {
            const checked = selectedIds.has(item.id);
            return (
              <label
                key={item.id}
                className={`
                  flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors
                  ${
                    checked
                      ? "border-amber-500/25 bg-amber-500/[0.04]"
                      : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-700"
                  }
                `}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(item.id)}
                  disabled={generating}
                  className="h-4 w-4 flex-shrink-0 rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-amber-500/30"
                />
                <span className="font-mono text-xs text-neutral-400 flex-shrink-0">
                  {item.item_reference}
                </span>
                <span className="flex-1 truncate text-sm text-neutral-200">
                  {item.item_name}
                </span>
                <span className="flex-shrink-0 text-xs font-semibold tabular-nums text-emerald-400">
                  {Number(item.stock_quantity)}
                </span>
              </label>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-neutral-800 bg-neutral-950 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={generating}
            className="
              rounded-lg px-4 py-2 text-sm font-medium text-neutral-400
              transition-colors hover:bg-neutral-800/60 hover:text-neutral-200
              disabled:opacity-50
            "
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={generating || selectedIds.size === 0}
            className="
              inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2
              text-sm font-semibold text-neutral-950
              hover:bg-amber-400 active:scale-[0.97]
              transition-all duration-200 shadow-lg shadow-amber-500/10
              disabled:cursor-not-allowed disabled:opacity-60
            "
          >
            {generating ? (
              <>
                <SpinnerIcon className="h-3.5 w-3.5 animate-spin" />
                Génération...
              </>
            ) : (
              "Générer le PDF"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Composants locaux ──────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: "amber" | "emerald";
}) {
  const styles =
    accent === "amber"
      ? {
          icon: "bg-amber-500/10 border-amber-500/25 text-amber-400",
          value: "text-amber-400",
        }
      : accent === "emerald"
        ? {
            icon: "bg-emerald-500/10 border-emerald-500/25 text-emerald-400",
            value: "text-emerald-400",
          }
        : {
            icon: "bg-neutral-800/60 border-neutral-700 text-neutral-300",
            value: "text-white",
          };

  return (
    <div className="flex items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 transition-colors hover:border-neutral-700">
      <span
        className={`inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border ${styles.icon}`}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
          {label}
        </p>
        <p className={`text-xl font-bold tabular-nums truncate ${styles.value}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function StockAvailabilityBadge({ qty }: { qty: number }) {
  if (qty > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400 ring-1 ring-emerald-500/25">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        En stock
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-400 ring-1 ring-blue-500/25">
      <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
      Vendu
    </span>
  );
}

function BoxIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  );
}

function StackIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
    </svg>
  );
}

function EuroIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 7.756a4.5 4.5 0 100 8.488M7.5 10.5h5.25m-5.25 3h5.25M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function SellIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.75V12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12v.75m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18.75v-6m18 0-2.51-5.022a1.875 1.875 0 0 0-1.677-1.038H5.187a1.875 1.875 0 0 0-1.677 1.038L1 12.75" />
    </svg>
  );
}

function QrIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h1.5v1.5h-1.5v-1.5ZM13.5 19.5h1.5v1.5h-1.5v-1.5ZM19.5 13.5h1.5v1.5h-1.5v-1.5ZM19.5 19.5h1.5v1.5h-1.5v-1.5ZM16.5 16.5h1.5v1.5h-1.5v-1.5Z" />
    </svg>
  );
}

function PencilIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
  );
}

function SearchIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}

function WarningIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  );
}

function CrossIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

function SpinnerIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

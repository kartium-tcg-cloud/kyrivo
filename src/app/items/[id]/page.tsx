import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isItemStatus } from "@/types/item";
import ItemStatusBadge from "@/components/items/ItemStatusBadge";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface PurchaseContext {
  id: string;
  purchase_date: string;
  supplier: string;
  product: string;
  document_url: string | null;
}

export default async function ItemDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: item, error } = await supabase
    .from("purchase_items")
    .select(
      `*,
       purchases:purchase_document_id (
         id, purchase_date, supplier, product, document_url
       )`
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !item) notFound();

  const purchase = item.purchases as PurchaseContext;
  const stockQuantity = Number(item.stock_quantity ?? item.quantity);
  const initialQuantity = Number(item.quantity);
  const status = isItemStatus(item.status) ? item.status : "in_stock";

  const formatEuro = (n: number) =>
    Number(n).toLocaleString("fr-BE", {
      style: "currency",
      currency: "EUR",
    });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-BE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  let signedDocumentUrl: string | null = null;

  if (purchase.document_url) {
    const { data: signed } = await supabase.storage
      .from("purchase-documents")
      .createSignedUrl(purchase.document_url, 60 * 10);

    if (signed) signedDocumentUrl = signed.signedUrl;
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <nav className="flex items-center gap-2 text-xs text-neutral-500 mb-6">
        <Link href="/achats" className="hover:text-amber-400 transition-colors">
          Achats
        </Link>

        <svg
          className="h-3 w-3 text-neutral-700"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m8.25 4.5 7.5 7.5-7.5 7.5"
          />
        </svg>

        <Link
          href="/achats"
          className="hover:text-amber-400 transition-colors truncate max-w-[200px]"
        >
          {purchase.supplier}
        </Link>

        <svg
          className="h-3 w-3 text-neutral-700"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m8.25 4.5 7.5 7.5-7.5 7.5"
          />
        </svg>

        <span className="text-neutral-300 font-mono">
          {item.item_reference}
        </span>
      </nav>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 overflow-hidden mb-6">
        <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-amber-400 to-transparent" />

        <div className="p-6 flex items-start justify-between gap-6">
          <div className="space-y-3 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-sm text-neutral-500 tracking-wider">
                {item.item_reference}
              </span>

              <ItemStatusBadge status={status} size="md" />
            </div>

            <h1 className="text-2xl font-bold text-white tracking-tight">
              {item.item_name}
            </h1>

            {item.category && (
              <p className="text-sm text-neutral-500">
                Catégorie · {item.category}
              </p>
            )}
          </div>

          <div className="text-right flex-shrink-0">
            <p className="text-[11px] text-neutral-500 uppercase tracking-wider mb-1">
              Coût unitaire
            </p>

            <p className="text-2xl font-bold text-amber-400 tabular-nums">
              {formatEuro(Number(item.unit_cost))}
            </p>

            <p className="text-xs text-neutral-600 mt-1">
              Stock restant : {stockQuantity} / {initialQuantity}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
          <SectionTitle>Informations</SectionTitle>

          <div className="space-y-0 text-sm mt-4">
            <DetailRow label="Référence" value={item.item_reference} mono />
            <DetailRow label="Quantité initiale" value={String(initialQuantity)} />
            <DetailRow label="Stock restant" value={String(stockQuantity)} />
            <DetailRow label="Coût HT" value={formatEuro(Number(item.unit_cost))} />
            <DetailRow label="Coût total" value={formatEuro(Number(item.total_cost))} />
            <DetailRow label="Type TVA" value={item.vat_type ?? "—"} />
            <DetailRow
              label="Marge éligible"
              value={item.margin_eligible ? "Oui" : "Non"}
            />
            <DetailRow label="Entrée en stock" value={formatDate(item.created_at)} />
          </div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
          <SectionTitle>Historique d&apos;achat</SectionTitle>

          <div className="space-y-0 text-sm mt-4">
            <DetailRow label="Fournisseur" value={purchase.supplier} />
            <DetailRow
              label="Date d&apos;achat"
              value={formatDate(purchase.purchase_date)}
            />
            <DetailRow label="Produit / Lot" value={purchase.product} />
          </div>

          <Link
            href="/achats"
            className="
              mt-4 inline-flex items-center gap-2
              text-xs font-semibold text-amber-400 hover:text-amber-300
              transition-colors
            "
          >
            Voir l&apos;achat dans la liste
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
              />
            </svg>
          </Link>
        </div>
      </div>

      {(item.notes || signedDocumentUrl) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          {item.notes && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
              <SectionTitle>Notes</SectionTitle>
              <p className="text-sm text-amber-200/70 italic mt-3">
                {item.notes}
              </p>
            </div>
          )}

          {signedDocumentUrl && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
              <SectionTitle>Document associé</SectionTitle>

              <a
                href={signedDocumentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  mt-3 inline-flex items-center gap-2
                  rounded-lg px-4 py-2
                  text-sm font-semibold
                  bg-amber-500 text-neutral-950
                  hover:bg-amber-400
                  transition-colors
                "
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15M9 12l3 3m0 0 3-3m-3 3V2.25"
                  />
                </svg>
                Ouvrir le document
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-semibold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
      <span className="inline-block h-px w-3 bg-amber-500" />
      {children}
    </h2>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-neutral-800/40 last:border-0">
      <span className="text-xs text-neutral-500">{label}</span>
      <span
        className={`text-neutral-200 text-right ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
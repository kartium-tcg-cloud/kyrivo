import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
  params: Promise<{ id: string }>;
}

type ContactType = "client" | "supplier";

interface ContactRow {
  id: string;
  company_id: string;
  created_at: string;
  updated_at?: string | null;
  type: ContactType;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  vat_number: string | null;
  notes: string | null;
}

export default async function ContactDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("memberships")
    .select("company_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership?.company_id) redirect("/login");

  const { data: contact, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .eq("company_id", membership.company_id)
    .maybeSingle();

  if (error || !contact) notFound();

  const c = contact as ContactRow;
  const isClient = c.type === "client";

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-BE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <nav className="flex items-center gap-2 text-xs text-neutral-500 mb-6">
        <Link
          href="/contacts"
          className="hover:text-amber-400 transition-colors"
        >
          Contacts
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

        <span className="text-neutral-300 truncate max-w-[200px]">
          {c.name}
        </span>
      </nav>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 overflow-hidden mb-6">
        <div
          className={`h-1 w-full ${
            isClient
              ? "bg-gradient-to-r from-amber-500 via-amber-400 to-transparent"
              : "bg-gradient-to-r from-blue-500 via-blue-400 to-transparent"
          }`}
        />

        <div className="p-6 flex items-start justify-between gap-6">
          <div className="space-y-3 min-w-0">
            <ContactTypeBadge type={c.type} />

            <h1 className="text-2xl font-bold text-white tracking-tight">
              {c.name}
            </h1>

            {c.email && (
              <p className="text-sm text-neutral-500">{c.email}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
          <SectionTitle>Coordonnées</SectionTitle>

          <div className="space-y-0 text-sm mt-4">
            <DetailRow label="Nom" value={c.name} />
            <DetailRow label="Email" value={c.email ?? ""} />
            <DetailRow label="Téléphone" value={c.phone ?? ""} />
            <DetailRow label="Adresse" value={c.address ?? ""} multiline />
          </div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
          <SectionTitle>Informations</SectionTitle>

          <div className="space-y-0 text-sm mt-4">
            <DetailRow label="Type" value={isClient ? "Client" : "Fournisseur"} />
            <DetailRow label="N° TVA" value={c.vat_number ?? ""} mono />
            <DetailRow label="Créé le" value={formatDate(c.created_at)} />
            {c.updated_at && (
              <DetailRow
                label="Modifié le"
                value={formatDate(c.updated_at)}
              />
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
        <SectionTitle>Notes</SectionTitle>

        <p className="text-sm mt-3">
          {c.notes ? (
            <span className="text-amber-200/70 italic">{c.notes}</span>
          ) : (
            <span className="text-neutral-700">—</span>
          )}
        </p>
      </div>

      <div className="mt-6">
        <Link
          href="/contacts"
          className="
            inline-flex items-center gap-2
            text-xs font-semibold text-neutral-500 hover:text-amber-400
            transition-colors
          "
        >
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
              d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
            />
          </svg>
          Retour aux contacts
        </Link>
      </div>
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
  multiline = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  multiline?: boolean;
}) {
  const isEmpty = !value;

  if (multiline) {
    return (
      <div className="flex flex-col gap-1 py-2.5 border-b border-neutral-800/40 last:border-0">
        <span className="text-xs text-neutral-500">{label}</span>
        <span
          className={`whitespace-pre-line text-sm ${
            isEmpty ? "text-neutral-700" : "text-neutral-200"
          }`}
        >
          {isEmpty ? "—" : value}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-neutral-800/40 last:border-0">
      <span className="text-xs text-neutral-500 shrink-0">{label}</span>
      <span
        className={`text-right ${mono ? "font-mono text-xs" : ""} ${
          isEmpty ? "text-neutral-700" : "text-neutral-200"
        }`}
      >
        {isEmpty ? "—" : value}
      </span>
    </div>
  );
}

function ContactTypeBadge({ type }: { type: ContactType }) {
  if (type === "client") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-400 ring-1 ring-amber-500/25">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        Client
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-400 ring-1 ring-blue-500/25">
      <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
      Fournisseur
    </span>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/auth/LogoutButton";
import PeriodStats from "@/components/dashboard/PeriodStats";

type ActivityItem = {
  type: "achat" | "vente";
  label: string;
  amount: number;
  date: string;
};

function formatDateFr(iso: string): string {
  if (!iso) return "—";
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatEuro(amount: number): string {
  return amount.toLocaleString("fr-BE", { style: "currency", currency: "EUR" });
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("memberships")
    .select("role, company_id")
    .eq("user_id", user.id);

  const firstMembership = memberships?.[0] ?? null;
  const companyId = firstMembership?.company_id ?? null;

  let company = null;
  if (companyId) {
    const { data } = await supabase
      .from("companies")
      .select("id, name")
      .eq("id", companyId)
      .maybeSingle();
    company = data;
  }

  const email = user.email ?? "";
  const initiales = email.slice(0, 2).toUpperCase();
  const companyName = company?.name ?? "—";

  // ── Abonnement ───────────────────────────────────────────────
  let planLabel = "Aucun abonnement";
  let planStatus: "trial" | "active" | "none" = "none";
  let usedLines = 0;
  let monthlyLimit = 0;
  let resetDateText = "—";
  let subscriptionEndText = "—";
  let isPastDue = false;

  // ── Compteurs ────────────────────────────────────────────────
  let purchasesCount = 0;
  let salesCount = 0;
  let stockCount = 0;
  let stockImmobilise = 0;
  let recentActivity: ActivityItem[] = [];

  if (companyId) {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];

    // Abonnement
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select(
        "plan, status, monthly_line_limit, current_period_start, current_period_end, trial_ends_at, subscription_ends_at"
      )
      .eq("company_id", companyId)
      .maybeSingle();

    const trialEndsAt = subscription?.trial_ends_at
      ? new Date(subscription.trial_ends_at)
      : null;
    const periodEndsAt = subscription?.current_period_end
      ? new Date(subscription.current_period_end)
      : null;
    const subscriptionEndsAt = subscription?.subscription_ends_at
      ? new Date(subscription.subscription_ends_at)
      : null;

    const isTrialActive =
      subscription?.status === "trialing" &&
      trialEndsAt !== null &&
      trialEndsAt > now;
    const isPaidActive =
      (subscription?.status === "active" || subscription?.status === "canceled") &&
      subscriptionEndsAt !== null &&
      subscriptionEndsAt > now;
    isPastDue = subscription?.status === "past_due";

    monthlyLimit =
      isTrialActive || isPaidActive
        ? Number(subscription?.monthly_line_limit ?? 0)
        : 0;

    const usageStartIso = subscription?.current_period_start ?? null;
    if (usageStartIso) {
      const { data: usageEvents } = await supabase
        .from("usage_events")
        .select("lines_used")
        .eq("company_id", companyId)
        .gte("created_at", usageStartIso);
      usedLines = (usageEvents || []).reduce(
        (t, e) => t + Number(e.lines_used || 0),
        0
      );
    }

    planLabel = isTrialActive
      ? "Essai"
      : isPaidActive && subscription?.plan
      ? subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)
      : "Aucun abonnement";

    planStatus = isTrialActive ? "trial" : isPaidActive ? "active" : "none";

    resetDateText =
      isTrialActive && trialEndsAt
        ? trialEndsAt.toLocaleDateString("fr-BE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        : isPaidActive && periodEndsAt
        ? periodEndsAt.toLocaleDateString("fr-BE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        : "—";

    subscriptionEndText =
      isTrialActive && trialEndsAt
        ? trialEndsAt.toLocaleDateString("fr-BE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        : isPaidActive && subscriptionEndsAt
        ? subscriptionEndsAt.toLocaleDateString("fr-BE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        : "—";

    // ── Compteurs mensuels + valeur stock ────────────────────
    const [
      { count: pCount },
      { count: sCount },
      { count: stCount },
      { data: stockItems },
    ] = await Promise.all([
      supabase
        .from("purchases")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId)
        .gte("purchase_date", firstDayOfMonth),
      supabase
        .from("sales")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId)
        .gte("sale_date", firstDayOfMonth),
      supabase
        .from("purchase_items")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("status", "in_stock"),
      supabase
        .from("purchase_items")
        .select("stock_quantity, unit_cost")
        .eq("company_id", companyId)
        .eq("status", "in_stock"),
    ]);

    purchasesCount = pCount ?? 0;
    salesCount = sCount ?? 0;
    stockCount = stCount ?? 0;
    stockImmobilise = Math.round(
      (stockItems ?? []).reduce(
        (sum, item) =>
          sum + Number(item.stock_quantity ?? 0) * Number(item.unit_cost ?? 0),
        0
      ) * 100
    ) / 100;

    // ── Activité récente ──────────────────────────────────────
    const [{ data: recentPurchases }, { data: recentSales }] =
      await Promise.all([
        supabase
          .from("purchases")
          .select("supplier, amount_ttc, purchase_date")
          .eq("company_id", companyId)
          .order("purchase_date", { ascending: false })
          .limit(5),
        supabase
          .from("sales")
          .select("customer_name, total_ttc, sale_date")
          .eq("company_id", companyId)
          .order("sale_date", { ascending: false })
          .limit(5),
      ]);

    recentActivity = [
      ...(recentPurchases || []).map((p) => ({
        type: "achat" as const,
        label: p.supplier ?? "—",
        amount: Number(p.amount_ttc ?? 0),
        date: p.purchase_date ?? "",
      })),
      ...(recentSales || []).map((s) => ({
        type: "vente" as const,
        label: s.customer_name ?? "—",
        amount: Number(s.total_ttc ?? 0),
        date: s.sale_date ?? "",
      })),
    ]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 6);
  }

  const usagePercent =
    monthlyLimit > 0
      ? Math.min(100, Math.round((usedLines / monthlyLimit) * 100))
      : 0;

  // ── Rendu ─────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-5xl p-4 sm:p-6 lg:p-8 space-y-8">

      {/* ── BANNIÈRE PAST_DUE ────────────────────────────────── */}
      {isPastDue && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/8 px-4 py-3.5">
          <svg className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-300">Paiement échoué</p>
            <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
              Votre paiement a échoué. Mettez à jour votre moyen de paiement pour éviter l'interruption de votre accès.
            </p>
          </div>
          <Link
            href="/abonnements"
            className="flex-shrink-0 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/20 transition-colors"
          >
            Gérer mon abonnement
          </Link>
        </div>
      )}

      {/* ── HEADER ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-neutral-800">
        <div className="flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl flex items-center justify-center text-sm font-black text-neutral-950 flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)" }}
          >
            {initiales}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-white tracking-tight truncate">
                {companyName}
              </h1>
              {planStatus !== "none" && (
                <span className={`
                  inline-flex items-center rounded-full px-2 py-0.5
                  text-[10px] font-bold uppercase tracking-wider border
                  ${planStatus === "trial"
                    ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                    : "bg-amber-500/10 border-amber-500/20 text-amber-400"}
                `}>
                  {planLabel}
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-500 mt-0.5 truncate">{email}</p>
          </div>
        </div>
        <LogoutButton />
      </div>

      {/* ── STATS ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

        <StatTile
          label="Achats ce mois"
          value={String(purchasesCount)}
          icon={<CartIcon />}
          accent="blue"
        />

        <StatTile
          label="Ventes ce mois"
          value={String(salesCount)}
          icon={<SalesIcon />}
          accent="emerald"
        />

        <StatTile
          label="Articles en stock"
          value={String(stockCount)}
          icon={<StockIcon />}
          accent="amber"
        />

        {/* Quota avec progress bar */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 transition-colors hover:border-neutral-700">
          <div className="flex items-center gap-3 mb-3">
            <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border bg-neutral-800/60 border-neutral-700 text-neutral-400">
              <QuotaIcon />
            </span>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
              Quota lignes
            </p>
          </div>
          <p className="text-2xl font-bold text-white tabular-nums leading-none mb-1">
            {monthlyLimit > 0 ? usedLines : "—"}
          </p>
          {monthlyLimit > 0 && (
            <p className="text-xs text-neutral-600 mb-3">
              sur {monthlyLimit} ce mois
            </p>
          )}
          {monthlyLimit > 0 ? (
            <>
              <div className="h-1 rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    usagePercent >= 90
                      ? "bg-red-500"
                      : usagePercent >= 70
                      ? "bg-amber-400"
                      : "bg-amber-500"
                  }`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              <p className="text-[10px] text-neutral-600 mt-2">
                Réinit. {resetDateText}
              </p>
            </>
          ) : (
            <p className="text-xs text-neutral-600">Aucun quota actif</p>
          )}
        </div>

      </div>

      {/* ── Stock immobilisé ────────────────────────────────── */}
      <div className="card-amber-glow rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-400">
            <LockStockIcon />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
              Argent immobilisé en stock
            </p>
            <p className="text-[10px] text-neutral-700 mt-0.5">
              Valeur d'achat des articles encore en stock
            </p>
          </div>
        </div>
        <p className="text-lg font-bold tabular-nums text-white flex-shrink-0">
          {formatEuro(stockImmobilise)}
        </p>
      </div>

      {/* ── Lien vers analyse ───────────────────────────────── */}
      <p className="text-[11px] text-neutral-600 text-right -mt-4">
        Besoin d'une période précise ?{" "}
        <a href="#analyse-periode" className="text-neutral-500 hover:text-amber-400 transition-colors underline-offset-2 underline decoration-neutral-700 hover:decoration-amber-400">
          Accéder à l'analyse
        </a>
      </p>

      {/* ── MAIN GRID ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">

        {/* Activité récente */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 overflow-hidden transition-colors hover:border-neutral-700/80">
          <div className="px-5 py-4 border-b border-neutral-800">
            <h2 className="text-sm font-semibold text-white">Activité récente</h2>
          </div>

          {recentActivity.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <p className="text-sm text-neutral-600">
                Aucune opération enregistrée pour le moment.
              </p>
              <div className="flex items-center justify-center gap-3 mt-4">
                <Link
                  href="/achats"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-neutral-950 hover:bg-amber-400 transition-colors"
                >
                  Ajouter un achat
                </Link>
                <Link
                  href="/ventes"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2 text-xs font-semibold text-neutral-300 hover:border-neutral-600 transition-colors"
                >
                  Ajouter une vente
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-neutral-800/50">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                  <span className={`
                    inline-flex h-7 w-7 flex-shrink-0 items-center justify-center
                    rounded-lg text-[10px] font-bold uppercase tracking-wider
                    ${item.type === "achat"
                      ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}
                  `}>
                    {item.type === "achat" ? "A" : "V"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-200 truncate font-medium">
                      {item.label || "—"}
                    </p>
                    <p className="text-xs text-neutral-600 mt-0.5">
                      {item.type === "achat" ? "Achat" : "Vente"} · {formatDateFr(item.date)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums text-neutral-300 flex-shrink-0">
                    {formatEuro(item.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-neutral-800 px-5 py-3 flex items-center gap-4">
            <Link
              href="/achats"
              className="text-xs text-neutral-500 hover:text-amber-400 transition-colors"
            >
              Tous les achats →
            </Link>
            <Link
              href="/ventes"
              className="text-xs text-neutral-500 hover:text-amber-400 transition-colors"
            >
              Toutes les ventes →
            </Link>
          </div>
        </div>

        {/* Accès rapide + infos abonnement */}
        <div className="space-y-4">

          {/* Accès rapide */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 overflow-hidden transition-colors hover:border-neutral-700/80">
            <div className="px-5 py-4 border-b border-neutral-800">
              <h2 className="text-sm font-semibold text-white">Accès rapide</h2>
            </div>
            <div className="p-3 space-y-1">
              <QuickLink href="/achats" label="Achats" icon={<CartIcon />} />
              <QuickLink href="/ventes" label="Ventes" icon={<SalesIcon />} />
              <QuickLink href="/contacts" label="Contacts" icon={<ContactsIcon />} />
              <QuickLink href="/factures" label="Factures" icon={<InvoiceIcon />} />
              <QuickLink href="/preferences" label="Préférences" icon={<SettingsIcon />} />
            </div>
          </div>

          {/* Abonnement */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 overflow-hidden transition-colors hover:border-neutral-700/80">
            <div className="px-5 py-4 border-b border-neutral-800">
              <h2 className="text-sm font-semibold text-white">Abonnement</h2>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-600 mb-1">Plan</p>
                <p className="text-sm text-neutral-200 font-medium">{planLabel}</p>
              </div>
              {subscriptionEndText !== "—" && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                    {planStatus === "trial" ? "Fin de l'essai" : "Accès jusqu'au"}
                  </p>
                  <p className="text-sm text-neutral-200 font-medium">{subscriptionEndText}</p>
                </div>
              )}
              <Link
                href="/abonnements"
                className="mt-1 flex items-center justify-between w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-xs font-semibold text-neutral-400 hover:border-amber-500/30 hover:text-amber-400 transition-colors"
              >
                <span>{planStatus === "none" ? "Souscrire un abonnement" : "Gérer l'abonnement"}</span>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Support */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 flex items-center gap-3">
            <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-neutral-500">
              <MailIcon />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-neutral-400">Besoin d'aide ?</p>
              <a
                href="mailto:contact@kartium-tcg.com"
                className="text-[11px] text-neutral-600 hover:text-amber-400 transition-colors truncate block"
              >
                contact@kartium-tcg.com
              </a>
            </div>
          </div>

        </div>

      </div>

      {/* ── Analyse par période ──────────────────────────────── */}
      {companyId && (
        <div id="analyse-periode" className="scroll-mt-10">
          <PeriodStats companyId={companyId} />
        </div>
      )}

    </div>
  );
}

// ── Composants ─────────────────────────────────────────────────

function StatTile({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: "amber" | "emerald" | "blue";
}) {
  const styles =
    accent === "amber"
      ? { icon: "bg-amber-500/10 border-amber-500/20 text-amber-400", value: "text-amber-400" }
      : accent === "emerald"
        ? { icon: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400", value: "text-emerald-400" }
        : accent === "blue"
          ? { icon: "bg-blue-500/10 border-blue-500/20 text-blue-400", value: "text-blue-400" }
          : { icon: "bg-neutral-800/60 border-neutral-700 text-neutral-400", value: "text-white" };

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 transition-colors hover:border-neutral-700">
      <div className="flex items-center gap-3 mb-3">
        <span
          className={`inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border ${styles.icon}`}
        >
          {icon}
        </span>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 leading-tight">
          {label}
        </p>
      </div>
      <p className={`text-2xl font-bold tabular-nums leading-none ${styles.value}`}>
        {value}
      </p>
    </div>
  );
}

function QuickLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="
        flex items-center gap-3 rounded-lg px-3 py-2.5
        text-sm font-medium text-neutral-400
        hover:bg-neutral-800/60 hover:text-neutral-200
        transition-colors group
      "
    >
      <span className="text-neutral-600 group-hover:text-neutral-400 transition-colors flex-shrink-0">
        {icon}
      </span>
      {label}
    </Link>
  );
}

// ── Icônes ─────────────────────────────────────────────────────

function CartIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
    </svg>
  );
}

function SalesIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
    </svg>
  );
}

function StockIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
  );
}

function QuotaIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5" />
    </svg>
  );
}

function ContactsIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}

function InvoiceIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  );
}

function LockStockIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
    </svg>
  );
}

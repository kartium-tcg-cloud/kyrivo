import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import AdBudgetCalculator from "@/components/marketing/AdBudgetCalculator";

export const metadata: Metadata = {
  title: "Campagnes ChatGPT Ads — Administration Kyrivo",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function fromChatGPT(source: unknown): boolean {
  return typeof source === "string" &&
    ["chatgpt", "chatgpt_ads", "openai", "openai_ads"].includes(source.trim().toLowerCase());
}

export default async function MarketingReportPage() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) notFound();
  // Seul le propriétaire du compte interne Kartium TCG peut lire les résultats.
  // Vérification serveur contre un identifiant de société immuable (pas son nom).
  const { data: internalCompany } = await supabaseAdmin
    .from("companies")
    .select("created_by")
    .eq("id", "9ce7f9e0-101a-4a8b-9861-670702881812")
    .maybeSingle();
  if (!internalCompany?.created_by || user.id !== internalCompany.created_by) notFound();

  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const [eventsQuery, companiesQuery, subscriptionsQuery, usersQuery] = await Promise.all([
    supabaseAdmin.from("funnel_events").select("event_name,utm_source,utm_campaign,created_at")
      .gte("created_at", since).order("created_at", { ascending: false }).limit(5000),
    supabaseAdmin.from("companies").select("id,created_by").limit(2000),
    supabaseAdmin.from("subscriptions").select("company_id,plan,status").limit(2000),
    supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);
  if (eventsQuery.error || companiesQuery.error || subscriptionsQuery.error || usersQuery.error) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-3xl font-bold text-white">Mesure des campagnes</h1>
        <p className="mt-4 text-amber-300">
          Les statistiques sont momentanément indisponibles. Les événements continuent à être enregistrés.
        </p>
      </main>
    );
  }

  const events = (eventsQuery.data ?? []).filter((e) => fromChatGPT(e.utm_source));
  const visitors = events.filter((e) => e.event_name === "landing_view").length;
  const signupEvents = events.filter((e) => e.event_name === "registration_success").length;
  const ctaClicks = events.filter((e) => e.event_name === "cta_register_click").length;

  // Attribution sauvegardée lors de la création du compte, indépendante du nombre
  // de pages consultées / rechargées et conservée pour la conversion Stripe.
  const attributedUsers = (usersQuery.data?.users ?? []).filter((u) => {
    if (u.created_at < since) return false;
    const a = u.user_metadata?.kyrivo_campaign_attribution;
    return fromChatGPT(a?.utm_source) || (a?.marketing_consent === true && !!a?.oppref);
  });
  const attributedIds = new Set(attributedUsers.map((u) => u.id));
  const companyIds = new Set(
    (companiesQuery.data ?? []).filter((c) => c.created_by && attributedIds.has(c.created_by)).map((c) => c.id)
  );
  const subscribers = (subscriptionsQuery.data ?? []).filter(
    (s) => companyIds.has(s.company_id) && s.status === "active" && s.plan !== "trial"
  ).length;
  const registrations = attributedUsers.length;

  const grouped = new Map<string, { source: string; campaign: string; visits: number; clicks: number; registrations: number }>();
  for (const e of events) {
    const source = e.utm_source || "non renseignée";
    const campaign = e.utm_campaign || "(non renseignée)";
    const key = source + "|" + campaign;
    const row = grouped.get(key) ?? { source, campaign, visits: 0, clicks: 0, registrations: 0 };
    if (e.event_name === "landing_view") row.visits++;
    if (e.event_name === "cta_register_click") row.clicks++;
    if (e.event_name === "registration_success") row.registrations++;
    grouped.set(key, row);
  }
  const rows = [...grouped.values()].sort((a,b) => b.visits - a.visits);

  return (
    <main className="ky-marketing mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 lg:py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-400">Privé · Administration</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">Campagnes ChatGPT Ads</h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-300">
        Tableau de bord interne des 30 derniers jours : trafic identifié par UTM,
        inscriptions et abonnements actifs attribués à ces nouvelles inscriptions.
        Les clients et comptes historiques ne sont pas comptés comme de nouvelles conversions.
      </p>

      <section className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Entonnoir des conversions">
        {[
          ["Visites attribuées", visitors],
          ["Clics CTA observés", ctaClicks],
          ["Comptes créés", registrations],
          ["Abonnés actifs", subscribers],
        ].map(([name, value]) => (
          <div key={name} className="rounded-2xl border border-neutral-700 bg-neutral-900/60 p-5">
            <p className="text-xs text-neutral-400">{name}</p>
            <p className="mt-2 text-3xl font-bold text-white">{value}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 overflow-x-auto rounded-2xl border border-neutral-700 bg-neutral-900/60 p-5">
        <h2 className="mb-4 text-xl font-semibold text-white">Trafic et inscriptions par campagne</h2>
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="border-b border-neutral-700 text-neutral-400">
            <tr><th className="pb-3">Source</th><th>Campagne</th><th>Visites</th><th>Clics CTA</th><th>Événements d&apos;inscription</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.source + "/" + r.campaign} className="border-b border-neutral-800 text-neutral-200">
                <td className="py-3">{r.source}</td><td className="py-3">{r.campaign}</td>
                <td>{r.visits}</td><td>{r.clicks}</td><td>{r.registrations}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="py-6 text-neutral-400">
                Aucune visite ChatGPT Ads identifiée. Utilisez une URL de publicité avec utm_source=chatgpt.
              </td></tr>
            )}
          </tbody>
        </table>
      </section>

      <div className="mt-8">
        <AdBudgetCalculator visitors={visitors} registrations={registrations} subscribers={subscribers} />
      </div>
      <p className="mt-5 text-xs leading-6 text-neutral-500">
        Vérification interne : {signupEvents} événements d&apos;inscription reçus sur la période.
        Les comptes créés sont dédupliqués par identifiant utilisateur.
        Les visites ne sont pas des visiteurs uniques. Les résultats peuvent différer
        de l&apos;attribution et des dépenses déclarées dans OpenAI Ads Manager.
      </p>
      <p className="mt-4 text-sm text-neutral-300">
        Support : <a href="mailto:contact@kartium-tcg.com" className="text-amber-300 underline">contact@kartium-tcg.com</a>
      </p>
    </main>
  );
}

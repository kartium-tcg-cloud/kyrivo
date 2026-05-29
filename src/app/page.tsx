import Link from "next/link";

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">

      {/* ═══ GLOW BACKGROUND ═══════════════════════════════ */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[1100px] rounded-full opacity-[0.18] blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(245,158,11,1) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative px-6 lg:px-10 py-10 lg:py-14 mx-auto max-w-6xl">

        {/* ═══════════════════════════════════════════════════ */}
        {/* HERO                                                */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="flex flex-col items-center text-center pt-6 pb-24">

          {/* ─── LOGO BLOCK ─────────────────────────────── */}
          <KyrivoLogo />

          {/* Badge version */}
          <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-amber-400 tracking-widest uppercase">
              Kyrivo · Gestion &amp; facturation
            </span>
          </div>

          {/* Title */}
          <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.05] max-w-4xl">
            Pilotez votre activité.
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)",
              }}
            >
              Oubliez Excel.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg text-neutral-400 max-w-2xl leading-relaxed mx-auto">
            Kyrivo centralise vos{" "}
            <strong className="text-neutral-200">achats</strong>, vos{" "}
            <strong className="text-neutral-200">ventes</strong> et votre{" "}
            <strong className="text-neutral-200">stock</strong> dans une seule interface.
            TVA sur marge, facturation, suivi des marges — tout est calculé pour vous,
            que vous soyez en France ou en Belgique.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row gap-3 items-center justify-center">

            <Link
              href="/abonnements"
              className="
                group inline-flex items-center justify-center gap-2
                rounded-lg px-6 py-3
                bg-amber-500 text-neutral-950
                text-sm font-semibold
                hover:bg-amber-400 active:scale-[0.98]
                transition-all duration-200
                shadow-lg shadow-amber-500/20
              "
            >
              Voir les abonnements
              <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>

            <Link
              href="/achats"
              className="
                inline-flex items-center justify-center gap-2
                rounded-lg px-6 py-3
                bg-neutral-900/60 text-neutral-200
                text-sm font-semibold
                border border-neutral-800
                hover:border-neutral-700 hover:bg-neutral-900
                transition-all duration-200
              "
            >
              Commencer
            </Link>

          </div>

          {/* Feature badges */}
          <div className="mt-10 flex flex-wrap gap-2 justify-center">
            <FeatureBadge>
              <img src="https://flagcdn.com/16x12/fr.png" srcSet="https://flagcdn.com/32x24/fr.png 2x" width={16} height={12} alt="France" className="inline-block flex-shrink-0" />
              TVA marge française
            </FeatureBadge>
            <FeatureBadge>
              <img src="https://flagcdn.com/16x12/be.png" srcSet="https://flagcdn.com/32x24/be.png 2x" width={16} height={12} alt="Belgique" className="inline-block flex-shrink-0" />
              TVA marge belge
            </FeatureBadge>
            <FeatureBadge>Multi-plateforme</FeatureBadge>
            <FeatureBadge>Factures PDF</FeatureBadge>
            <FeatureBadge>Export Excel</FeatureBadge>
            <FeatureBadge>Stock temps réel</FeatureBadge>
          </div>

        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* STATS / VALUE PROPS                                 */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-24 max-w-4xl mx-auto">

          <StatBlock value="TVA marge" label="Intégrée nativement" accent />
          <StatBlock value="FR · BE" label="Conformité fiscale" />
          <StatBlock value="PDF" label="Factures auto" />
          <StatBlock value="Excel" label="Export comptable" accent />


        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* FEATURES                                            */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="mb-28">

          <SectionHeader
            label="Fonctionnalités"
            title="Tout ce qu'il vous faut"
            description="Conçu pour les revendeurs français et belges qui gèrent du stock, vendent sur plusieurs plateformes et veulent garder le contrôle de leurs marges."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">

            <FeatureCard
              icon={<CartIcon />}
              title="Gestion achats"
              description="Enregistrez vos achats PRO et particuliers, joignez les factures, suivez l'historique complet."
            />

            <FeatureCard
              icon={<SalesIcon />}
              title="Gestion ventes"
              description="Suivez vos ventes par plateforme — Cardmarket, Vinted, Shopify — avec marge calculée automatiquement."
            />

            <FeatureCard
              icon={<CalcIcon />}
              title="TVA sur marge"
              description="Régime des biens d'occasion intégré nativement. Conforme aux directives européennes — France 20 %, Belgique 21 %."
            />

            <FeatureCard
              icon={<StockIcon />}
              title="Stock intelligent"
              description="Chaque article référencé automatiquement. Statuts en temps réel : en stock, réservé, vendu, retourné."
            />

            <FeatureCard
              icon={<InvoiceIcon />}
              title="Facturation"
              description="Génération automatique de factures PDF conformes. Numérotation séquentielle, mentions légales incluses."
            />

            <FeatureCard
              icon={<ExportIcon />}
              title="Export comptable"
              description="Exports Excel et CSV prêts pour votre comptable, en France comme en Belgique."
            />

          </div>
        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* WORKFLOW                                            */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="mb-28">

          <SectionHeader
            label="Workflow"
            title="Le cycle complet"
            description="De l'achat à la marge nette, Kyrivo suit chaque étape automatiquement."
          />

          <div className="mt-12">

            {/* Pipeline desktop */}
            <div className="hidden lg:grid grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-stretch gap-0 max-w-5xl mx-auto">

              <WorkflowStep step={1} icon={<CartIcon />} title="Achat" description="Vous enregistrez un achat avec sa facture." state="completed" />
              <Arrow />
              <WorkflowStep step={2} icon={<StockIcon />} title="Stock" description="Référence générée, article ajouté au stock." state="active" />
              <Arrow />
              <WorkflowStep step={3} icon={<SalesIcon />} title="Vente" description="L'article passe en vendu, lié à une vente." state="pending" />
              <Arrow />
              <WorkflowStep step={4} icon={<TrendIcon />} title="Marge" description="Marge nette calculée automatiquement." state="pending" />

            </div>

            {/* Pipeline mobile/tablet */}
            <div className="lg:hidden space-y-3 max-w-md mx-auto">
              <WorkflowStep step={1} icon={<CartIcon />} title="Achat" description="Vous enregistrez un achat avec sa facture." state="completed" />
              <WorkflowStep step={2} icon={<StockIcon />} title="Stock" description="Référence générée, article ajouté au stock." state="active" />
              <WorkflowStep step={3} icon={<SalesIcon />} title="Vente" description="L'article passe en vendu, lié à une vente." state="pending" />
              <WorkflowStep step={4} icon={<TrendIcon />} title="Marge" description="Marge nette calculée automatiquement." state="pending" />
            </div>

          </div>
        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* BÉNÉFICES                                           */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="mb-28">

          <SectionHeader
            label="Bénéfices"
            title="Pourquoi passer à Kyrivo"
            description="Pensé pour les revendeurs qui veulent du temps, de la clarté et de la conformité fiscale."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12 max-w-4xl mx-auto">

            <BenefitCard
              icon={<ClockIcon />}
              title="Temps gagné"
              description="Plus besoin de jongler entre Excel, calculatrices et factures manuelles. Les opérations prennent quelques secondes."
            />

            <BenefitCard
              icon={<LayersIcon />}
              title="Centralisation"
              description="Toutes vos plateformes, tous vos clients, tous vos articles — un seul endroit, une seule source de vérité."
            />

            <BenefitCard
              icon={<TrendIcon />}
              title="Suivi rentabilité"
              description="Marge nette en temps réel sur chaque vente. Identifiez vos meilleurs produits et plateformes en un coup d'œil."
            />

            <BenefitCard
              icon={<ShieldIcon />}
              title="Conformité fiscale"
              description="TVA sur marge calculée selon les normes françaises et belges. Factures prêtes pour votre comptable."
            />

          </div>

        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* FINAL CTA                                           */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="mb-10">

          <div
            className="
              relative rounded-2xl overflow-hidden
              border border-amber-500/20
              px-6 py-12 lg:px-12 lg:py-16
              text-center
            "
            style={{
              background:
                "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(23,23,23,0.4) 50%, rgba(245,158,11,0.05) 100%)",
            }}
          >

            {/* Glow décoratifs */}
            <div
              className="absolute -top-24 -right-24 h-72 w-72 rounded-full opacity-30 blur-3xl pointer-events-none"
              style={{
                background: "radial-gradient(circle, rgba(245,158,11,0.6) 0%, transparent 70%)",
              }}
            />
            <div
              className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full opacity-20 blur-3xl pointer-events-none"
              style={{
                background: "radial-gradient(circle, rgba(245,158,11,0.6) 0%, transparent 70%)",
              }}
            />

            {/* Ligne dorée haut */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

            <div className="relative flex flex-col items-center">

              <div className="inline-flex items-center gap-2 rounded-full bg-neutral-950/40 border border-neutral-700 px-3 py-1 mb-6 backdrop-blur-sm">
                <SparkleIcon className="h-3 w-3 text-amber-400" />
                <span className="text-[11px] font-semibold text-neutral-300 tracking-widest uppercase">
                  Prêt à démarrer
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight max-w-2xl leading-tight">
                Reprenez le contrôle de votre activité dès aujourd'hui.
              </h2>

              <p className="mt-4 text-neutral-400 max-w-xl mx-auto">
                Découvrez les abonnements Kyrivo et choisissez la formule adaptée à votre volume.
                Démarrez en quelques minutes.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 items-center justify-center">

                <Link
                  href="/abonnements"
                  className="
                    group inline-flex items-center justify-center gap-2
                    rounded-lg px-6 py-3
                    bg-amber-500 text-neutral-950
                    text-sm font-semibold
                    hover:bg-amber-400 active:scale-[0.98]
                    transition-all duration-200
                    shadow-lg shadow-amber-500/30
                  "
                >
                  Voir les abonnements
                  <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Link>

                <Link
                  href="/achats"
                  className="
                    inline-flex items-center justify-center gap-2
                    rounded-lg px-6 py-3
                    bg-neutral-900/60 text-neutral-200
                    text-sm font-semibold
                    border border-neutral-800
                    hover:border-neutral-700 hover:bg-neutral-900
                    transition-all duration-200
                    backdrop-blur-sm
                  "
                >
                  Explorer la démo
                </Link>

              </div>

            </div>
          </div>

        </section>

        {/* Footer mini */}
        <div className="pt-6 mt-6 border-t border-neutral-800/60">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] text-neutral-600 tracking-wider uppercase">
              Kyrivo · Gestion &amp; facturation
            </p>
            <p className="flex items-center gap-1.5 text-[11px] text-neutral-600">
              <img src="https://flagcdn.com/16x12/fr.png" srcSet="https://flagcdn.com/32x24/fr.png 2x" width={16} height={12} alt="France" />
              <img src="https://flagcdn.com/16x12/be.png" srcSet="https://flagcdn.com/32x24/be.png 2x" width={16} height={12} alt="Belgique" />
              <img src="https://flagcdn.com/16x12/lu.png" srcSet="https://flagcdn.com/32x24/lu.png 2x" width={16} height={12} alt="Luxembourg" />
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Liens légaux">
            {[
              { href: "/mentions-legales", label: "Mentions légales" },
              { href: "/conditions-generales", label: "CGU / CGV" },
              { href: "/politique-confidentialite", label: "Confidentialité" },
              { href: "/cookies", label: "Cookies" },
              { href: "/donnees-personnelles", label: "Données personnelles" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-[10px] text-neutral-600 hover:text-neutral-400 transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// LOGO BLOCK — Kyrivo by Kartium TCG
// ═══════════════════════════════════════════════════════════

function KyrivoLogo() {
  return (
    <div className="flex flex-col items-center">

      {/* Lockup principal */}
      <div className="flex items-center gap-4">

        {/* Mark : V doré */}
        <div className="relative">
          {/* Glow derrière le V */}
          <div
            className="absolute inset-0 blur-2xl opacity-60"
            style={{
              background:
                "radial-gradient(circle, rgba(245,158,11,0.7) 0%, transparent 70%)",
            }}
          />

          <div
            className="
              relative flex items-center justify-center
              h-14 w-14 sm:h-16 sm:w-16
              rounded-2xl
              border border-amber-400/40
              shadow-2xl
            "
            style={{
              background:
                "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)",
              boxShadow:
                "0 10px 40px -10px rgba(245,158,11,0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
            }}
          >
            <span className="text-2xl sm:text-3xl font-black text-neutral-950 tracking-tighter">
              K
            </span>
          </div>
        </div>

        {/* Wordmark */}
        <div className="text-left">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Kyrivo
            </span>
            <span className="text-[10px] font-bold text-amber-400/80 uppercase tracking-[0.2em] hidden sm:inline">
              SaaS
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 tracking-wider mt-0.5">
            by{" "}
            <span className="text-neutral-300 font-semibold">Kartium TCG</span>
          </p>
        </div>

      </div>

    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SOUS-COMPOSANTS
// ═══════════════════════════════════════════════════════════

function FeatureBadge({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="
        inline-flex items-center gap-1.5
        rounded-full
        bg-neutral-900/60 border border-neutral-800
        px-3 py-1.5
        text-[11px] font-medium text-neutral-400
      "
    >
      {children}
    </span>
  );
}

function StatBlock({
  value,
  label,
  accent = false,
}: {
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`
        rounded-xl p-5 text-center
        border transition-colors duration-200
        ${
          accent
            ? "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40"
            : "bg-neutral-900/40 border-neutral-800 hover:border-neutral-700"
        }
      `}
    >
      <p
        className={`text-2xl sm:text-3xl font-bold tabular-nums ${
          accent ? "text-amber-400" : "text-white"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-[10px] sm:text-xs text-neutral-500 uppercase tracking-wider font-medium">
        {label}
      </p>
    </div>
  );
}

function SectionHeader({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center max-w-3xl mx-auto">
      <div className="inline-flex items-center gap-2 mb-3 justify-center">
        <span className="inline-block h-px w-6 bg-amber-500" />
        <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-widest">
          {label}
        </span>
        <span className="inline-block h-px w-6 bg-amber-500" />
      </div>
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
        {title}
      </h2>
      <p className="mt-4 text-neutral-400 leading-relaxed mx-auto">
        {description}
      </p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div
      className="
        group relative rounded-xl
        bg-neutral-900/40 border border-neutral-800
        p-6
        hover:border-amber-500/30
        transition-all duration-300
        overflow-hidden
        text-center
      "
    >
      {/* Glow hover */}
      <div
        className="
          absolute -top-12 left-1/2 -translate-x-1/2 h-32 w-32 rounded-full
          opacity-0 group-hover:opacity-100
          blur-3xl transition-opacity duration-500
          pointer-events-none
        "
        style={{
          background:
            "radial-gradient(circle, rgba(245,158,11,0.3) 0%, transparent 70%)",
        }}
      />

      <div className="relative flex flex-col items-center">

        <span
          className="
            inline-flex items-center justify-center
            h-11 w-11 rounded-lg
            bg-amber-500/10 border border-amber-500/20
            text-amber-400
            group-hover:bg-amber-500/15 group-hover:border-amber-500/40
            transition-colors duration-200
          "
        >
          {icon}
        </span>

        <h3 className="mt-4 text-base font-semibold text-white tracking-tight">
          {title}
        </h3>

        <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
          {description}
        </p>

      </div>
    </div>
  );
}

function WorkflowStep({
  step,
  icon,
  title,
  description,
  state,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  state: "completed" | "active" | "pending";
}) {
  const styles =
    state === "completed"
      ? {
          ring: "border-emerald-500/30",
          bg: "bg-emerald-500/5",
          iconBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
          stepText: "text-emerald-400",
        }
      : state === "active"
      ? {
          ring: "border-amber-500/40",
          bg: "bg-amber-500/5",
          iconBg: "bg-amber-500/15 border-amber-500/30 text-amber-400",
          stepText: "text-amber-400",
        }
      : {
          ring: "border-neutral-800",
          bg: "bg-neutral-900/40",
          iconBg: "bg-neutral-800/60 border-neutral-700 text-neutral-500",
          stepText: "text-neutral-600",
        };

  return (
    <div
      className={`
        rounded-xl border p-5 text-center
        ${styles.ring} ${styles.bg}
        transition-all duration-200
      `}
    >
      <div className="flex flex-col items-center">

        <span
          className={`inline-flex items-center justify-center h-11 w-11 rounded-lg border ${styles.iconBg}`}
        >
          {icon}
        </span>

        <span
          className={`mt-3 text-[10px] font-bold uppercase tracking-widest ${styles.stepText}`}
        >
          Étape {step}
        </span>

        <h3 className="mt-2 text-sm font-semibold text-white">{title}</h3>

        <p className="mt-1.5 text-xs text-neutral-500 leading-relaxed">
          {description}
        </p>

      </div>
    </div>
  );
}

function Arrow() {
  return (
    <div className="flex items-center justify-center px-2">
      <svg
        className="h-4 w-4 text-neutral-700"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
      </svg>
    </div>
  );
}

function BenefitCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div
      className="
        flex flex-col items-center text-center
        rounded-xl bg-neutral-900/40 border border-neutral-800
        p-6
        hover:border-neutral-700 hover:bg-neutral-900/60
        transition-all duration-200
      "
    >
      <span
        className="
          inline-flex items-center justify-center
          h-11 w-11 rounded-lg flex-shrink-0
          bg-amber-500/10 border border-amber-500/20
          text-amber-400
        "
      >
        {icon}
      </span>

      <h3 className="mt-4 text-sm font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
        {description}
      </p>

    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ICÔNES (Heroicons outline)
// ═══════════════════════════════════════════════════════════

function CartIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
    </svg>
  );
}

function SalesIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
    </svg>
  );
}

function CalcIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V13.5Zm0 2.25h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V18Zm2.498-6.75h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V13.5Zm0 2.25h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V18Zm2.504-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5ZM8.25 6h7.5v2.25h-7.5V6ZM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 0 0 2.25 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0 0 12 2.25Z" />
    </svg>
  );
}

function StockIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
  );
}

function InvoiceIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0 4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0-5.571 3-5.571-3" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
    </svg>
  );
}
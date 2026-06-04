import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://kyrivo.kartium-tcg.com/",
  },
};

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const primaryCta = user ? "/dashboard" : "/register";
  const primaryLabel = user ? "Accéder à mon espace" : "Essayer gratuitement";
  const finalCta = user ? "/dashboard" : "/register";
  const finalLabel = user ? "Accéder à mon espace" : "Essayer gratuitement";

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Kyrivo",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: "https://kyrivo.kartium-tcg.com",
      description:
        "Outil de gestion des achats, ventes, stock, marges et TVA pour revendeurs de biens physiques en France et en Belgique.",
      inLanguage: "fr",
      featureList: [
        "Gestion des achats",
        "Gestion des ventes",
        "Suivi du stock en temps réel",
        "Calcul des marges",
        "TVA sur marge",
        "Facturation PDF",
        "Export Excel et CSV",
      ],
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "EUR",
        description: "Essai gratuit 7 jours sans carte bancaire",
      },
      creator: {
        "@type": "Organization",
        name: "Kartium TCG",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Kartium TCG",
      url: "https://kyrivo.kartium-tcg.com",
      brand: {
        "@type": "Brand",
        name: "Kyrivo",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "À qui s'adresse Kyrivo ?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Kyrivo s'adresse aux revendeurs de biens physiques : cartes Pokémon et TCG, Vinted, Lego, sneakers, figurines, mangas, brocante et autres objets de collection.",
          },
        },
        {
          "@type": "Question",
          name: "Kyrivo remplace-t-il Excel ?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Kyrivo aide à remplacer les fichiers Excel compliqués en centralisant les achats, ventes, stock, marges, TVA et exports dans un seul outil.",
          },
        },
        {
          "@type": "Question",
          name: "Kyrivo gère-t-il la TVA ?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Kyrivo permet de suivre la TVA standard et la TVA sur marge selon les informations encodées. L'outil aide au suivi, mais ne remplace pas un accompagnement comptable professionnel.",
          },
        },
        {
          "@type": "Question",
          name: "Puis-je suivre mon stock avec Kyrivo ?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Oui. Les achats de stock créent des articles suivis avec quantités restantes, références et coûts d'achat.",
          },
        },
        {
          "@type": "Question",
          name: "Kyrivo est-il adapté aux vendeurs de cartes Pokémon ?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Oui. Kyrivo a été pensé au départ pour des revendeurs TCG et cartes Pokémon, puis élargi aux autres revendeurs de biens physiques.",
          },
        },
        {
          "@type": "Question",
          name: "Puis-je exporter mes données ?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Oui. Kyrivo permet d'exporter les achats et ventes pour faciliter le suivi et la préparation des informations utiles au comptable.",
          },
        },
      ],
    },
  ];

  return (
    <div className="relative overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

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
        <section className="flex flex-col items-center text-center pt-6 pb-16">

          {/* ─── LOGO BLOCK ─────────────────────────────── */}
          <KyrivoLogo />

          {/* Eyebrow — pour qui */}
          <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-amber-400 tracking-widest uppercase">
              Pour revendeurs · France &amp; Belgique
            </span>
          </div>

          {/* Title */}
          <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1] max-w-3xl">
            Tu sais{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)",
              }}
            >
              vraiment
            </span>
            {" "}ce que tu gagnes&nbsp;?
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-base sm:text-lg text-neutral-400 max-w-xl leading-relaxed mx-auto">
            Quand tu revends régulièrement, Excel devient vite ingérable. Kyrivo centralise tes{" "}
            <strong className="text-neutral-200">achats, ventes, stock, marges et TVA</strong>{" "}
            dans un outil simple — pour la France et la Belgique.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-center w-full max-w-sm sm:max-w-none">

            <Link
              href={primaryCta}
              className="
                group inline-flex items-center justify-center gap-2
                rounded-lg px-6 py-3.5
                bg-amber-500 text-neutral-950
                text-sm font-semibold
                hover:bg-amber-400 active:scale-[0.98]
                transition-all duration-200
                shadow-lg shadow-amber-500/20
              "
            >
              {primaryLabel}
              <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>

            <Link
              href="/abonnements"
              className="
                inline-flex items-center justify-center gap-2
                rounded-lg px-6 py-3.5
                bg-neutral-900/60 text-neutral-200
                text-sm font-semibold
                border border-neutral-800
                hover:border-neutral-700 hover:bg-neutral-900
                transition-all duration-200
              "
            >
              Voir les tarifs
            </Link>

          </div>

          {/* Réassurance sous les CTA */}
          <p className="mt-3.5 text-[12px] text-neutral-600">
            Aucune carte bancaire requise · Sans engagement · Annulable à tout moment
          </p>

          {/* Feature badges */}
          <div className="mt-8 flex flex-wrap gap-2 justify-center">
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

          {/* App screenshot */}
          <div className="mt-6 md:mt-10 mx-auto w-full max-w-full md:max-w-[900px] md:[transform:perspective(1000px)_rotateX(3deg)]">
            <Image
              src="/app-screenshot.png"
              alt="Interface Kyrivo — Gestion des achats pour revendeurs"
              width={900}
              height={506}
              className="w-full h-auto rounded-[12px]"
              style={{
                border: "1px solid rgba(212, 134, 42, 0.2)",
                boxShadow: "0 0 60px rgba(212, 134, 42, 0.12), 0 20px 60px rgba(0,0,0,0.4)",
              }}
              priority
            />
          </div>

        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* STATS / VALUE PROPS                                 */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-20 max-w-4xl mx-auto">

          <StatBlock value="TVA marge" label="Intégrée nativement" accent />
          <StatBlock value="FR · BE" label="Conformité fiscale" />
          <StatBlock value="PDF" label="Factures auto" />
          <StatBlock value="Excel" label="Export comptable" accent />

        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* COMMENT KYRIVO T'AIDE                               */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="mb-24">

          <SectionHeader
            label="Comment ça marche"
            title="Comment Kyrivo t'aide"
            description="De l'achat à la marge — en trois étapes simples."
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 max-w-4xl mx-auto">

            <HowItWorksCard
              step="Étape 1"
              icon={<CartIcon />}
              title="Encode tes achats"
              description="Produit, coût, fournisseur, TVA. Tu gardes une trace propre de chaque acquisition."
            />

            <HowItWorksCard
              step="Étape 2"
              icon={<StockIcon />}
              title="Suis ton stock et tes marges"
              description="Kyrivo calcule tes quantités disponibles, tes coûts et tes marges en temps réel."
            />

            <HowItWorksCard
              step="Étape 3"
              icon={<ExportIcon />}
              title="Prépare tes exports"
              description="Achats, ventes, TVA et données utiles pour ton suivi ou ton comptable."
            />

          </div>

        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* FEATURES                                            */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="mb-28">

          <SectionHeader
            label="Fonctionnalités"
            title="Un outil de gestion pour revendeurs de biens physiques"
            description="Conçu pour les revendeurs français et belges qui gèrent du stock, vendent sur plusieurs plateformes et veulent garder le contrôle de leurs marges."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">

            <FeatureCard
              icon={<CartIcon />}
              title="Gestion achats"
              description="Enregistre tes achats PRO et particuliers, joins les factures, suis l'historique complet."
            />

            <FeatureCard
              icon={<SalesIcon />}
              title="Gestion ventes"
              description="Suis tes ventes par plateforme — Cardmarket, Vinted, Shopify — avec marge calculée automatiquement."
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
              description="Exports Excel et CSV prêts pour ton comptable, en France comme en Belgique."
            />

          </div>
        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* WORKFLOW                                            */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="mb-28">

          <SectionHeader
            label="Workflow"
            title="Suis tes achats, ventes, stock et marges"
            description="De l'achat à la marge nette, Kyrivo suit chaque étape automatiquement."
          />

          <div className="mt-12">

            {/* Pipeline desktop */}
            <div className="hidden lg:grid grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-stretch gap-0 max-w-5xl mx-auto">

              <WorkflowStep step={1} icon={<CartIcon />} title="Achat" description="Tu enregistres un achat avec sa facture." state="completed" />
              <Arrow />
              <WorkflowStep step={2} icon={<StockIcon />} title="Stock" description="Référence générée, article ajouté au stock." state="active" />
              <Arrow />
              <WorkflowStep step={3} icon={<SalesIcon />} title="Vente" description="L'article passe en vendu, lié à une vente." state="pending" />
              <Arrow />
              <WorkflowStep step={4} icon={<TrendIcon />} title="Marge" description="Marge nette calculée automatiquement." state="pending" />

            </div>

            {/* Pipeline mobile/tablet */}
            <div className="lg:hidden space-y-3 max-w-md mx-auto">
              <WorkflowStep step={1} icon={<CartIcon />} title="Achat" description="Tu enregistres un achat avec sa facture." state="completed" />
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
            title="Remplace ton fichier Excel de revente"
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
              description="Toutes tes plateformes, tous tes clients, tous tes articles — un seul endroit, une seule source de vérité."
            />

            <BenefitCard
              icon={<TrendIcon />}
              title="Suivi rentabilité"
              description="Marge nette en temps réel sur chaque vente. Identifie tes meilleurs produits et plateformes en un coup d'œil."
            />

            <BenefitCard
              icon={<ShieldIcon />}
              title="Conformité fiscale"
              description="TVA sur marge calculée selon les normes françaises et belges. Factures prêtes pour ton comptable."
            />

          </div>

        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* FAQ                                                  */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="mb-28" aria-labelledby="faq-heading">

          <SectionHeader
            label="FAQ"
            title="Questions fréquentes"
            description="Tout ce que tu veux savoir sur Kyrivo avant de commencer."
          />

          <div className="mt-12 max-w-3xl mx-auto space-y-3">

            <FAQItem
              question="À qui s'adresse Kyrivo ?"
              answer="Kyrivo s'adresse aux revendeurs de biens physiques : cartes Pokémon et TCG, Vinted, Lego, sneakers, figurines, mangas, brocante et autres objets de collection."
            />

            <FAQItem
              question="Kyrivo remplace-t-il Excel ?"
              answer="Kyrivo aide à remplacer les fichiers Excel compliqués en centralisant les achats, ventes, stock, marges, TVA et exports dans un seul outil."
            />

            <FAQItem
              question="Kyrivo gère-t-il la TVA ?"
              answer="Kyrivo permet de suivre la TVA standard et la TVA sur marge selon les informations encodées. L'outil aide au suivi, mais ne remplace pas un accompagnement comptable professionnel."
            />

            <FAQItem
              question="Puis-je suivre mon stock avec Kyrivo ?"
              answer="Oui. Les achats de stock créent des articles suivis avec quantités restantes, références et coûts d'achat."
            />

            <FAQItem
              question="Kyrivo est-il adapté aux vendeurs de cartes Pokémon ?"
              answer="Oui. Kyrivo a été pensé au départ pour des revendeurs TCG et cartes Pokémon, puis élargi aux autres revendeurs de biens physiques."
            />

            <FAQItem
              question="Puis-je exporter mes données ?"
              answer="Oui. Kyrivo permet d'exporter les achats et ventes pour faciliter le suivi et la préparation des informations utiles au comptable."
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
                Reprends le contrôle de ton activité.
              </h2>

              <p className="mt-4 text-neutral-400 max-w-xl mx-auto">
                7 jours gratuits pour voir si Kyrivo correspond à ta façon de vendre.
                Sans carte bancaire. Sans engagement.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-center w-full max-w-sm sm:max-w-none">

                <Link
                  href={finalCta}
                  className="
                    group inline-flex items-center justify-center gap-2
                    rounded-lg px-6 py-3.5
                    bg-amber-500 text-neutral-950
                    text-sm font-semibold
                    hover:bg-amber-400 active:scale-[0.98]
                    transition-all duration-200
                    shadow-lg shadow-amber-500/30
                  "
                >
                  {finalLabel}
                  <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Link>

                <Link
                  href="/abonnements"
                  className="
                    inline-flex items-center justify-center gap-2
                    rounded-lg px-6 py-3.5
                    bg-neutral-900/60 text-neutral-200
                    text-sm font-semibold
                    border border-neutral-800
                    hover:border-neutral-700 hover:bg-neutral-900
                    transition-all duration-200
                    backdrop-blur-sm
                  "
                >
                  Voir les tarifs
                </Link>

              </div>

              <p className="mt-3.5 text-[12px] text-neutral-600">
                Aucune carte bancaire requise · Sans engagement · Annulable à tout moment
              </p>

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
                prefetch={false}
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

        {/* Mark : K doré */}
        <div className="relative">
          {/* Glow derrière le K */}
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

function HowItWorksCard({
  step,
  icon,
  title,
  description,
}: {
  step: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl bg-neutral-900/40 border border-neutral-800 p-6 hover:border-amber-500/20 transition-colors duration-200">
      <div className="flex items-start gap-4">
        <span className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex-shrink-0">
          {icon}
        </span>
        <div>
          <p className="text-[10px] font-bold text-amber-400/60 uppercase tracking-widest mb-1">
            {step}
          </p>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="mt-1.5 text-sm text-neutral-400 leading-relaxed">{description}</p>
        </div>
      </div>
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

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="rounded-xl bg-neutral-900/40 border border-neutral-800 px-6 py-5 hover:border-neutral-700 transition-colors duration-200">
      <h3 className="text-sm font-semibold text-white mb-2">{question}</h3>
      <p className="text-sm text-neutral-400 leading-relaxed">{answer}</p>
    </div>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
    </svg>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LandingAnalytics from "@/components/LandingAnalytics";
import RegisterCTA from "@/components/RegisterCTA";
import Reveal from "@/components/ui/Reveal";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://kyrivo.fr/",
  },
};

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Kyrivo",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: "https://kyrivo.fr",
      description:
        "Outil de gestion des achats, ventes, stock, marges, TVA et factures pour revendeurs de biens physiques en France et en Belgique.",
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
      url: "https://kyrivo.fr",
      brand: { "@type": "Brand", name: "Kyrivo" },
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
            text: "Kyrivo s'adresse aux revendeurs de biens physiques : Vinted, brocante, cartes Pokémon et TCG, objets de collection, LEGO, figurines, mangas, lots d'occasion et autres articles revendables.",
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
          name: "Kyrivo est-il réservé aux cartes Pokémon ?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Non. Kyrivo a été pensé au départ pour des revendeurs de cartes et de TCG, mais l'outil convient aussi aux revendeurs Vinted, brocante, collection et seconde main.",
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
        {
          "@type": "Question",
          name: "Que puis-je encore faire après expiration de mon abonnement ?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Si vous ne souhaitez pas renouveler votre abonnement, vous conservez l'accès aux données déjà encodées. Vous pouvez toujours les consulter, les exporter vers Excel et générer les factures liées aux ventes déjà enregistrées. Les nouvelles créations peuvent toutefois nécessiter un abonnement actif.",
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
      <noscript>
        <style>{`.reveal { opacity: 1 !important; transform: none !important; }`}</style>
      </noscript>
      <LandingAnalytics />

      {/* ── Background ambient ─────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 h-[700px] w-[1200px] rounded-full opacity-[0.13] blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(245,158,11,1) 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-1/3 -right-40 h-[400px] w-[400px] rounded-full opacity-[0.06] blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(245,158,11,1) 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative px-5 sm:px-6 lg:px-10 py-8 lg:py-14 mx-auto max-w-6xl">

        {/* ═══════════════════════════════════════════════════ */}
        {/* HERO — deux colonnes desktop, pile mobile          */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="pt-2 sm:pt-6 pb-16 sm:pb-24">

          <div className="flex flex-col lg:flex-row lg:items-center lg:gap-14 lg:justify-between">

            {/* ── COLONNE GAUCHE : copy + CTA ─────────────── */}
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left lg:max-w-[520px]">

              {/* Eyebrow */}
              <Reveal delay={0} className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/25 px-3 py-1.5 mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                <span className="text-[11px] font-semibold text-amber-400 tracking-widest uppercase">
                  Vinted · Brocante · TCG · Collection · Lots d’occasion
                </span>
              </Reveal>

              {/* H1 */}
              <Reveal delay={80} className="w-full">
                <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-bold text-white tracking-tight leading-[1.12] mb-5">
                  Tu fais de l’achat-revente&nbsp;?{" "}
                  <span
                    className="block bg-clip-text text-transparent pb-2"
                    style={{ backgroundImage: "linear-gradient(135deg, #fcd34d 0%, #f59e0b 45%, #d97706 100%)" }}
                  >
                    Tu sais vraiment ce que tu gagnes&nbsp;?
                  </span>
                </h1>
              </Reveal>

              {/* Subtitle desktop */}
              <Reveal delay={160} className="w-full">
                <p className="text-base sm:text-lg text-neutral-400 leading-relaxed mb-8 max-w-[440px] mx-auto lg:mx-0">
                  Kyrivo centralise tes{" "}
                  <strong className="text-neutral-200 font-semibold">achats, ventes, stock, marges, TVA et factures</strong>{" "}
                  dans un seul outil — sans Excel compliqué.
                </p>
              </Reveal>

              {/* CTA buttons */}
              <Reveal delay={240} className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mb-4">
                {user ? (
                  <Link
                    href="/dashboard"
                    className="group inline-flex items-center justify-center gap-2 rounded-xl px-7 py-4 bg-amber-500 text-neutral-950 text-sm font-bold hover:bg-amber-400 hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200 shadow-lg shadow-amber-500/25"
                  >
                    Accéder à mon espace
                    <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                ) : (
                  <RegisterCTA
                    label="Essai gratuit 7 jours"
                    className="group inline-flex items-center justify-center gap-2 rounded-xl px-7 py-4 bg-amber-500 text-neutral-950 text-sm font-bold hover:bg-amber-400 hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200 shadow-lg shadow-amber-500/25"
                  />
                )}
                <Link
                  href="/abonnements"
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-4 bg-neutral-900/60 text-neutral-200 text-sm font-semibold border border-neutral-700/60 hover:border-neutral-600 hover:bg-neutral-900 transition-all duration-200"
                >
                  Voir les tarifs
                </Link>
              </Reveal>

              {/* Reassurance */}
              <Reveal delay={320} className="w-full">
                <p className="text-[12px] text-neutral-600 font-medium tracking-wide mb-8 lg:mb-0">
                  Sans carte bancaire · Sans engagement · Données exportables
                </p>
              </Reveal>

              {/* Badges fonctionnalités — desktop */}
              <Reveal delay={400} className="hidden lg:flex flex-wrap gap-2 mt-6">
                {["Stock temps réel", "Factures PDF", "Export Excel", "TVA sur marge", "France · Belgique"].map((b) => (
                  <span key={b} className="inline-flex items-center rounded-full bg-neutral-900/60 border border-neutral-800 px-3 py-1 text-[11px] font-medium text-neutral-400">
                    {b}
                  </span>
                ))}
              </Reveal>

            </div>

            {/* ── COLONNE DROITE : mockup produit ─────────── */}
            <Reveal
              delay={200}
              direction="right"
              className="mt-10 lg:mt-0 w-full max-w-sm sm:max-w-md mx-auto lg:mx-0 lg:max-w-[460px] flex-shrink-0"
            >
              <ProductMockup />
            </Reveal>

          </div>

        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* PREUVE SOCIALE / STATS                              */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-24 max-w-4xl mx-auto">
          <Reveal delay={0}><StatBlock value="TVA marge" label="Intégrée nativement" accent /></Reveal>
          <Reveal delay={80}><StatBlock value="FR · BE" label="Suivi adapté" /></Reveal>
          <Reveal delay={160}><StatBlock value="PDF" label="Factures auto" /></Reveal>
          <Reveal delay={240}><StatBlock value="Excel" label="Export comptable" accent /></Reveal>
        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* PROBLÈME                                            */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="mb-24">
          <div className="relative rounded-2xl overflow-hidden border border-neutral-800/50">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse 70% 80% at 50% 0%, rgba(239,68,68,0.06) 0%, transparent 60%)" }}
            />

            <div className="relative p-8 lg:p-12">
              <Reveal delay={0} className="text-center mb-10 max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-2 rounded-full bg-red-500/8 border border-red-500/15 px-3 py-1.5 mb-4">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400 flex-shrink-0" />
                  <span className="text-[11px] font-semibold text-red-400/80 uppercase tracking-widest">Le problème</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Excel, c&apos;est bien pour débuter.<br className="hidden sm:block" /> Pas pour gérer une vraie activité.
                </h2>
                <p className="mt-3 text-neutral-500 text-sm leading-relaxed">
                  La plupart des revendeurs commencent avec un fichier simple. Puis les ventes se multiplient, le stock bouge, les marges deviennent floues et les erreurs s&apos;accumulent.
                </p>
              </Reveal>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
                <Reveal delay={0}>
                  <ProblemCard
                    icon={<CalcIcon />}
                    title="Marges floues"
                    description="Tu revends un article 25 €. Tu l’avais payé combien ? Avec les frais, la marge réelle n’est pas toujours celle que tu imagines."
                  />
                </Reveal>
                <Reveal delay={100}>
                  <ProblemCard
                    icon={<StockIcon />}
                    title="Stock dispersé"
                    description="Tes articles sont sur Vinted, en brocante, en réserve ou dans plusieurs fichiers. Retrouver ce qu’il te reste prend trop de temps."
                  />
                </Reveal>
                <Reveal delay={200}>
                  <ProblemCard
                    icon={<InvoiceIcon />}
                    title="Factures manuelles"
                    description="Chaque facture faite à la main augmente le risque d’erreur : numérotation, TVA, mentions, client, total à payer."
                  />
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* FONCTIONNALITÉS                                      */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="mb-28">

          <Reveal delay={0}>
            <SectionHeader
              label="Fonctionnalités"
              title="Tout ce qu'il te faut pour gérer ta revente"
              description="De l'achat au comptable, en passant par le stock, les marges et la facturation — un seul outil."
            />
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
            <Reveal delay={0}><FeatureCard icon={<CartIcon />} title="Gestion achats" description="Enregistre tes achats professionnels ou particuliers, ajoute tes justificatifs et garde un historique clair." /></Reveal>
            <Reveal delay={70}><FeatureCard icon={<SalesIcon />} title="Gestion ventes" description="Suis tes ventes par canal : Vinted, brocante, boutique, Cardmarket ou autre — avec marge calculée automatiquement." /></Reveal>
            <Reveal delay={140}><FeatureCard icon={<CalcIcon />} title="TVA sur marge" description="Pensé pour les biens d'occasion avec suivi TVA standard et TVA sur marge. L'outil aide au suivi, sans remplacer ton comptable." /></Reveal>
            <Reveal delay={210}><FeatureCard icon={<StockIcon />} title="Stock intelligent" description="Chaque article peut être suivi avec sa référence, sa quantité, son coût d'achat et son statut." /></Reveal>
            <Reveal delay={280}><FeatureCard icon={<InvoiceIcon />} title="Facturation PDF" description="Génère des factures propres avec numérotation, coordonnées client et mentions utiles." /></Reveal>
            <Reveal delay={350}><FeatureCard icon={<ExportIcon />} title="Export comptable" description="Exporte tes achats et ventes vers Excel pour ton suivi ou pour préparer les informations à transmettre à ton comptable." /></Reveal>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* WORKFLOW                                            */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="mb-28">

          <Reveal delay={0}>
            <SectionHeader
              label="Workflow"
              title="De l'achat à la marge, tout reste lié"
              description="Tu encodes un achat, ton stock se met à jour, tu ajoutes une vente et Kyrivo t'aide à voir ta marge réelle."
            />
          </Reveal>

          <div className="mt-12">
            {/* Pipeline desktop */}
            <div className="hidden lg:grid grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-stretch gap-0 max-w-5xl mx-auto">
              <Reveal delay={0} direction="left" className="h-full"><WorkflowStep step={1} icon={<CartIcon />} title="Achat" description="Tu enregistres un achat avec son coût et son fournisseur." state="completed" /></Reveal>
              <Arrow />
              <Reveal delay={120} direction="left" className="h-full"><WorkflowStep step={2} icon={<StockIcon />} title="Stock" description="L'article rejoint ton stock avec une quantité et une référence." state="active" /></Reveal>
              <Arrow />
              <Reveal delay={240} direction="left" className="h-full"><WorkflowStep step={3} icon={<SalesIcon />} title="Vente" description="Tu enregistres la vente, liée à l'article vendu." state="pending" /></Reveal>
              <Arrow />
              <Reveal delay={360} direction="left" className="h-full"><WorkflowStep step={4} icon={<TrendIcon />} title="Marge" description="Kyrivo t'aide à suivre le résultat réel de l'opération." state="pending" /></Reveal>
            </div>

            {/* Pipeline mobile/tablet */}
            <div className="lg:hidden space-y-3 max-w-md mx-auto">
              <Reveal delay={0}><WorkflowStep step={1} icon={<CartIcon />} title="Achat" description="Tu enregistres un achat avec son coût et son fournisseur." state="completed" /></Reveal>
              <Reveal delay={80}><WorkflowStep step={2} icon={<StockIcon />} title="Stock" description="L'article rejoint ton stock avec une quantité et une référence." state="active" /></Reveal>
              <Reveal delay={160}><WorkflowStep step={3} icon={<SalesIcon />} title="Vente" description="Tu enregistres la vente, liée à l'article vendu." state="pending" /></Reveal>
              <Reveal delay={240}><WorkflowStep step={4} icon={<TrendIcon />} title="Marge" description="Kyrivo t'aide à suivre le résultat réel de l'opération." state="pending" /></Reveal>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* POUR QUI — achat-revente & seconde main             */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="mb-28">

          <Reveal delay={0}>
            <SectionHeader
              label="Conçu pour"
              title="Pensé pour les revendeurs de biens physiques"
              description="Kyrivo a été créé au départ pour l’achat-revente de cartes, puis élargi aux revendeurs Vinted, brocante, collection et seconde main."
            />
          </Reveal>

          <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 max-w-5xl mx-auto">
            <Reveal delay={0} direction="scale"><TCGCard name="Vinted" detail="Vêtements, objets, lots, seconde main" color="teal" /></Reveal>
            <Reveal delay={60} direction="scale"><TCGCard name="Brocante" detail="Lots, vintage, occasion, revente" color="neutral" /></Reveal>
            <Reveal delay={120} direction="scale"><TCGCard name="Cartes & TCG" detail="Pokémon, One Piece, Magic, Yu-Gi-Oh!" color="amber" /></Reveal>
            <Reveal delay={180} direction="scale"><TCGCard name="Collection" detail="Figurines, mangas, objets rares" color="violet" /></Reveal>
            <Reveal delay={240} direction="scale"><TCGCard name="Lego & jouets" detail="Sets, pièces, lots, revente" color="blue" /></Reveal>
            <Reveal delay={300} direction="scale"><TCGCard name="Petits revendeurs" detail="Stock, marges, factures, exports" color="red" /></Reveal>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* BÉNÉFICES                                           */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="mb-28">

          <Reveal delay={0}>
            <SectionHeader
              label="Bénéfices"
              title="Remplace ton fichier Excel de revente"
              description="Pensé pour les revendeurs qui veulent gagner du temps, suivre leurs chiffres et préparer des données propres."
            />
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12 max-w-4xl mx-auto">
            <Reveal delay={0}><BenefitCard icon={<ClockIcon />} title="Temps gagné" description="Moins d’allers-retours entre Excel, messages, plateformes et factures. Tes opérations sont centralisées." /></Reveal>
            <Reveal delay={80}><BenefitCard icon={<LayersIcon />} title="Centralisation" description="Achats, ventes, stock, contacts, marges et factures au même endroit." /></Reveal>
            <Reveal delay={160}><BenefitCard icon={<TrendIcon />} title="Suivi rentabilité" description="Suis tes marges sur chaque vente et comprends ce qui te rapporte vraiment." /></Reveal>
            <Reveal delay={240}><BenefitCard icon={<ShieldIcon />} title="Données propres" description="Exports, factures et historiques clairs pour ton suivi ou ton comptable." /></Reveal>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* FAQ                                                  */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="mb-28" aria-labelledby="faq-heading">

          <Reveal delay={0}>
            <SectionHeader
              label="FAQ"
              title="Questions fréquentes"
              description="Tout ce que tu veux savoir sur Kyrivo avant de commencer."
            />
          </Reveal>

          <div className="mt-12 max-w-3xl mx-auto space-y-3">
            <Reveal delay={0}><FAQItem question="À qui s'adresse Kyrivo ?" answer="Kyrivo s'adresse aux revendeurs de biens physiques : Vinted, brocante, cartes Pokémon et TCG, objets de collection, LEGO, figurines, mangas, lots d'occasion et autres articles revendables." /></Reveal>
            <Reveal delay={50}><FAQItem question="Kyrivo remplace-t-il Excel ?" answer="Kyrivo aide à remplacer les fichiers Excel compliqués en centralisant les achats, ventes, stock, marges, TVA et exports dans un seul outil." /></Reveal>
            <Reveal delay={100}><FAQItem question="Kyrivo gère-t-il la TVA ?" answer="Kyrivo permet de suivre la TVA standard et la TVA sur marge selon les informations encodées. L'outil aide au suivi, mais ne remplace pas un accompagnement comptable professionnel." /></Reveal>
            <Reveal delay={150}><FAQItem question="Puis-je suivre mon stock avec Kyrivo ?" answer="Oui. Les achats de stock créent des articles suivis avec quantités restantes, références et coûts d'achat." /></Reveal>
            <Reveal delay={200}><FAQItem question="Kyrivo est-il réservé aux cartes Pokémon ?" answer="Non. Kyrivo a été pensé au départ pour des revendeurs de cartes et de TCG, mais l'outil convient aussi aux revendeurs Vinted, brocante, collection et seconde main." /></Reveal>
            <Reveal delay={250}><FAQItem question="Puis-je exporter mes données ?" answer="Oui. Kyrivo permet d'exporter les achats et ventes pour faciliter le suivi et la préparation des informations utiles au comptable." /></Reveal>
            <Reveal delay={300}><FAQItem question="Que puis-je encore faire après expiration de mon abonnement ?" answer="Si vous ne souhaitez pas renouveler votre abonnement, vous conservez l'accès aux données déjà encodées. Vous pouvez toujours les consulter, les exporter vers Excel et générer les factures liées aux ventes déjà enregistrées. Les nouvelles créations peuvent toutefois nécessiter un abonnement actif." /></Reveal>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* FINAL CTA                                           */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="mb-10">
          <Reveal delay={0} direction="scale" className="block">
          <div
            className="relative rounded-2xl overflow-hidden border border-amber-500/20 px-6 py-14 lg:px-12 lg:py-20 text-center"
            style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(10,10,10,0.5) 50%, rgba(245,158,11,0.05) 100%)" }}
          >
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full opacity-30 blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle, rgba(245,158,11,0.6) 0%, transparent 70%)" }} />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle, rgba(245,158,11,0.6) 0%, transparent 70%)" }} />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

            <div className="relative flex flex-col items-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-neutral-950/40 border border-neutral-700 px-3 py-1 mb-6 backdrop-blur-sm">
                <SparkleIcon className="h-3 w-3 text-amber-400" />
                <span className="text-[11px] font-semibold text-neutral-300 tracking-widest uppercase">Prêt à démarrer</span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight max-w-2xl leading-tight">
                Arrête de gérer ton activité au feeling.
              </h2>
              <p className="mt-4 text-lg font-semibold text-amber-400/80">
                Teste Kyrivo gratuitement pendant 7 jours.
              </p>
              <p className="mt-2 text-neutral-400 max-w-xl mx-auto text-sm">
                Sans carte bancaire. Sans engagement. Données exportables.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-center w-full max-w-sm sm:max-w-none">
                {user ? (
                  <Link
                    href="/dashboard"
                    className="group inline-flex items-center justify-center gap-2 rounded-xl px-7 py-4 bg-amber-500 text-neutral-950 text-sm font-bold hover:bg-amber-400 hover:-translate-y-px active:scale-[0.98] transition-all duration-200 shadow-lg shadow-amber-500/30"
                  >
                    Accéder à mon espace
                    <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                ) : (
                  <RegisterCTA
                    label="Essayer gratuitement"
                    className="group inline-flex items-center justify-center gap-2 rounded-xl px-7 py-4 bg-amber-500 text-neutral-950 text-sm font-bold hover:bg-amber-400 hover:-translate-y-px active:scale-[0.98] transition-all duration-200 shadow-lg shadow-amber-500/30"
                  />
                )}
                <Link
                  href="/abonnements"
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-4 bg-neutral-900/60 text-neutral-200 text-sm font-semibold border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900 transition-all duration-200 backdrop-blur-sm"
                >
                  Voir les tarifs
                </Link>
              </div>
            </div>
          </div>
          </Reveal>
        </section>

        {/* Crédibilité — Kartium TCG */}
        <Reveal delay={0} direction="up" className="mb-10 text-center">
          <p className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white leading-snug">
            Développé par <span className="text-amber-400">Kartium TCG</span>, boutique e-commerce professionnelle
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-4 py-1.5 text-xs sm:text-sm text-neutral-300">
              <ReviewStars />
              <span className="font-semibold text-neutral-200">Vinted</span>
              <span className="text-neutral-600">·</span>
              24 avis
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-4 py-1.5 text-xs sm:text-sm text-neutral-300">
              <ReviewStars />
              <span className="font-semibold text-neutral-200">Google</span>
              <span className="text-neutral-600">·</span>
              7 avis
            </span>
          </div>

          <p className="mt-6 text-sm text-neutral-500 italic max-w-md mx-auto leading-relaxed">
            « Une expérience réelle de l’achat-revente derrière Kyrivo »
          </p>
        </Reveal>

        {/* Footer mini */}
        <div className="pt-6 mt-6 border-t border-neutral-800/60">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] text-neutral-600 tracking-wider uppercase">
              Kyrivo · Gestion achat-revente
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
              <Link key={href} href={href} prefetch={false} className="text-[10px] text-neutral-600 hover:text-neutral-400 transition-colors">
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
// PRODUCT MOCKUP — faux dashboard Kyrivo
// ═══════════════════════════════════════════════════════════

function ProductMockup() {
  return (
    <div className="relative">
      {/* Outer ambient glow */}
      <div
        className="absolute -inset-3 rounded-3xl opacity-40 blur-2xl pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(245,158,11,0.25) 0%, transparent 70%)" }}
      />

      <div
        className="relative rounded-2xl overflow-hidden border shadow-2xl shadow-black/60"
        style={{
          background: "linear-gradient(160deg, #0d0d0f 0%, #090909 100%)",
          borderColor: "rgba(245,158,11,0.18)",
          boxShadow: "0 0 0 1px rgba(245,158,11,0.08), 0 24px 60px rgba(0,0,0,0.7)",
        }}
      >
        {/* Amber top bar */}
        <div className="h-0.5 w-full bg-gradient-to-r from-amber-500 via-amber-400/80 to-transparent" />

        {/* Topbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800/60">
          <div className="flex items-center gap-2.5">
            <div
              className="h-6 w-6 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)" }}
            >
              <span className="text-[10px] font-black text-neutral-950">K</span>
            </div>
            <span className="text-xs font-bold text-white">Kyrivo</span>
            <span className="text-[10px] text-neutral-600">/ Dashboard</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] text-neutral-500">En ligne</span>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-4 border-b border-neutral-800/50">
          <KPICard label="Achats" value="872 €" sub="-" color="blue" />
          <KPICard label="Ventes" value="1 240 €" sub="+30%" color="emerald" />
          <KPICard label="Stock" value="58" sub="articles" color="amber" />
          <KPICard label="Marge" value="+367 €" sub="net" color="green" positive />
        </div>

        {/* Activity feed */}
        <div className="p-4">
          <p className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest mb-3">
            Activité récente
          </p>
          <div className="space-y-2">
            <ActivityRow
              type="vente"
              label="Lot Vinted — vêtements"
              amount="+48,00 €"
              positive
            />
            <ActivityRow
              type="achat"
              label="Lot brocante — objets vintage"
              amount="-120,00 €"
              positive={false}
            />
            <ActivityRow
              type="vente"
              label="Cartes Pokémon — collection"
              amount="+85,00 €"
              positive
            />
          </div>
        </div>

        {/* Mini progress bar / quota */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] text-neutral-600 uppercase tracking-widest font-semibold">Quota lignes</span>
            <span className="text-[9px] text-neutral-500 tabular-nums">47 / 500</span>
          </div>
          <div className="h-1 rounded-full bg-neutral-800 overflow-hidden">
            <div className="h-full rounded-full bg-amber-500 w-[9%]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({
  label,
  value,
  sub,
  color,
  positive = false,
}: {
  label: string;
  value: string;
  sub: string;
  color: "blue" | "emerald" | "amber" | "green";
  positive?: boolean;
}) {
  const textColor =
    color === "blue" ? "text-blue-400" :
    color === "emerald" ? "text-emerald-400" :
    color === "amber" ? "text-amber-400" :
    positive ? "text-lime-400" : "text-white";

  return (
    <div className="flex flex-col items-center justify-center px-2 py-3 border-r border-neutral-800/50 last:border-r-0">
      <span className="text-[8px] font-semibold text-neutral-600 uppercase tracking-widest mb-1">{label}</span>
      <span className={`text-sm sm:text-base font-bold tabular-nums ${textColor}`}>{value}</span>
      <span className="text-[8px] text-neutral-700 mt-0.5">{sub}</span>
    </div>
  );
}

function ActivityRow({
  type,
  label,
  amount,
  positive,
}: {
  type: "vente" | "achat";
  label: string;
  amount: string;
  positive: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md text-[8px] font-bold uppercase ${
          type === "vente"
            ? "bg-emerald-500/12 text-emerald-400 border border-emerald-500/20"
            : "bg-blue-500/12 text-blue-400 border border-blue-500/20"
        }`}
      >
        {type === "vente" ? "V" : "A"}
      </span>
      <span className="flex-1 text-[10px] text-neutral-400 truncate">{label}</span>
      <span className={`text-[10px] font-semibold tabular-nums flex-shrink-0 ${positive ? "text-emerald-400" : "text-blue-400"}`}>
        {amount}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PROBLEM CARD
// ═══════════════════════════════════════════════════════════

function ProblemCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-red-500/10 bg-red-500/[0.04] p-5 hover:border-red-500/20 transition-colors duration-200">
      <span className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-red-500/10 border border-red-500/15 text-red-400 mb-3">
        {icon}
      </span>
      <h3 className="text-sm font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-neutral-500 leading-relaxed">{description}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TCG TARGET CARD
// ═══════════════════════════════════════════════════════════

function TCGCard({
  name,
  detail,
  color,
}: {
  name: string;
  detail: string;
  color: "amber" | "red" | "violet" | "blue" | "teal" | "neutral";
}) {
  const styles: Record<typeof color, { dot: string; border: string; bg: string; text: string }> = {
    amber:   { dot: "bg-amber-400",   border: "border-amber-500/20",   bg: "bg-amber-500/5",   text: "text-amber-400" },
    red:     { dot: "bg-red-400",     border: "border-red-500/20",     bg: "bg-red-500/5",     text: "text-red-400" },
    violet:  { dot: "bg-violet-400",  border: "border-violet-500/20",  bg: "bg-violet-500/5",  text: "text-violet-400" },
    blue:    { dot: "bg-blue-400",    border: "border-blue-500/20",    bg: "bg-blue-500/5",    text: "text-blue-400" },
    teal:    { dot: "bg-teal-400",    border: "border-teal-500/20",    bg: "bg-teal-500/5",    text: "text-teal-400" },
    neutral: { dot: "bg-neutral-400", border: "border-neutral-700",    bg: "bg-neutral-900/40", text: "text-neutral-400" },
  };

  const s = styles[color];

  return (
    <div className={`rounded-xl border p-4 text-center hover:scale-[1.02] transition-transform duration-200 ${s.border} ${s.bg}`}>
      <span className={`inline-block h-2 w-2 rounded-full ${s.dot} mb-2`} />
      <p className={`text-xs font-semibold ${s.text}`}>{name}</p>
      <p className="text-[10px] text-neutral-600 mt-1 leading-snug">{detail}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SOUS-COMPOSANTS EXISTANTS
// ═══════════════════════════════════════════════════════════

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
      className={`rounded-xl p-5 text-center border transition-colors duration-200 ${
        accent
          ? "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40"
          : "bg-neutral-900/40 border-neutral-800 hover:border-neutral-700"
      }`}
    >
      <p className={`text-2xl sm:text-3xl font-bold tabular-nums ${accent ? "text-amber-400" : "text-white"}`}>
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
        <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-widest">{label}</span>
        <span className="inline-block h-px w-6 bg-amber-500" />
      </div>
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">{title}</h2>
      <p className="mt-4 text-neutral-400 leading-relaxed mx-auto">{description}</p>
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
    <div className="group relative rounded-xl bg-neutral-900/40 border border-neutral-800 p-6 hover:border-amber-500/25 transition-all duration-300 overflow-hidden">
      {/* Hover glow */}
      <div
        className="absolute -top-10 left-1/2 -translate-x-1/2 h-28 w-28 rounded-full opacity-0 group-hover:opacity-100 blur-3xl transition-opacity duration-500 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(245,158,11,0.25) 0%, transparent 70%)" }}
      />

      <div className="relative flex flex-col items-center text-center">
        <span className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:bg-amber-500/15 group-hover:border-amber-500/35 transition-colors duration-200 mb-4">
          {icon}
        </span>
        <h3 className="text-sm font-semibold text-white tracking-tight">{title}</h3>
        <p className="mt-2 text-sm text-neutral-400 leading-relaxed">{description}</p>
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
      ? { ring: "border-emerald-500/30", bg: "bg-emerald-500/5", iconBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400", stepText: "text-emerald-400" }
      : state === "active"
      ? { ring: "border-amber-500/40", bg: "bg-amber-500/5", iconBg: "bg-amber-500/15 border-amber-500/30 text-amber-400", stepText: "text-amber-400" }
      : { ring: "border-neutral-800", bg: "bg-neutral-900/40", iconBg: "bg-neutral-800/60 border-neutral-700 text-neutral-500", stepText: "text-neutral-600" };

  return (
    <div className={`h-full rounded-xl border p-5 text-center ${styles.ring} ${styles.bg} transition-all duration-200`}>
      <div className="flex flex-col items-center">
        <span className={`inline-flex items-center justify-center h-11 w-11 rounded-lg border ${styles.iconBg}`}>
          {icon}
        </span>
        <span className={`mt-3 text-[10px] font-bold uppercase tracking-widest ${styles.stepText}`}>Étape {step}</span>
        <h3 className="mt-2 text-sm font-semibold text-white">{title}</h3>
        <p className="mt-1.5 text-xs text-neutral-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <div className="flex items-center justify-center px-2">
      <svg className="h-4 w-4 text-neutral-700" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
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
    <div className="flex flex-col items-center text-center rounded-xl bg-neutral-900/40 border border-neutral-800 p-6 hover:border-neutral-700 hover:bg-neutral-900/60 transition-all duration-200">
      <span className="inline-flex items-center justify-center h-11 w-11 rounded-xl flex-shrink-0 bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-4">
        {icon}
      </span>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-neutral-400 leading-relaxed">{description}</p>
    </div>
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

// ═══════════════════════════════════════════════════════════
// ICÔNES
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

function ReviewStars() {
  return (
    <span className="flex items-center gap-0.5" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-400">
          <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.78L10 14.9l-5.2 2.6.99-5.78-4.21-4.1 5.82-.85L10 1.5z" />
        </svg>
      ))}
    </span>
  );
}
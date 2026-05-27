// src/components/Sidebar.tsx
// Sidebar Kyrivo — navigation principale
// Position fixe, scrollable, design premium amber
// Navigation adaptée selon l'état d'authentification

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Sections de navigation pour utilisateur CONNECTÉ uniquement */
const authenticatedNavSections = [
  {
    label: "Principal",
    items: [
      {
        label: "Accueil",
        href: "/",
        icon: (
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Opérations",
    items: [
      {
        label: "Achats",
        href: "/achats",
        icon: (
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
          </svg>
        ),
      },
      {
        label: "Ventes",
        href: "/ventes",
        icon: (
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Gestion",
    items: [
      {
        label: "Contacts",
        href: "/contacts",
        icon: (
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
          </svg>
        ),
      },
      {
        label: "Factures",
        href: "/factures",
        icon: (
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
        ),
      },
      {
        label: "Préférences",
        href: "/preferences",
        icon: (
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
        ),
      },
    ],
  },
];

/** Sections de navigation pour utilisateur DÉCONNECTÉ */
const publicNavSections = [
  {
    label: "Navigation",
    items: [
      {
        label: "Accueil",
        href: "/",
        icon: (
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
        ),
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // ─── Récupération état auth Supabase ───────────────────
  useEffect(() => {
    const supabase = createClient();

    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      setUserEmail(user?.email ?? null);
    }

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsAuthenticated(!!session?.user);
        setUserEmail(session?.user?.email ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
  setMobileOpen(false);
}, [pathname]);

  // ─── Handler déconnexion ───────────────────────────────
  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  /** Vérifie si un lien est actif */
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  // Choix des sections selon état auth
  const navSections = isAuthenticated ? authenticatedNavSections : publicNavSections;

return (
  <>
    <header className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center justify-between border-b border-neutral-800/60 bg-neutral-950/95 px-4 backdrop-blur lg:hidden">
      <Link href="/" className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-400/40 bg-amber-500">
          <span className="text-base font-black text-neutral-950">K</span>
        </div>

        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-white">Kyrivo</span>
            <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-amber-400/80">
              SaaS
            </span>
          </div>
          <p className="text-[10px] text-neutral-500">by Kartium TCG</p>
        </div>
      </Link>

      <button
        type="button"
        onClick={() => setMobileOpen((v) => !v)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-300"
        aria-label="Ouvrir le menu"
      >
        {mobileOpen ? "×" : "☰"}
      </button>
    </header>

{mobileOpen && (
  <button
    type="button"
    onClick={() => setMobileOpen(false)}
    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
    aria-label="Fermer le menu"
  />
)}

    <aside
className={`
  fixed top-0 left-0 z-50
  flex flex-col
  h-screen
  w-[82vw] max-w-72 lg:w-64 lg:max-w-none
  bg-neutral-950
  border-r border-neutral-800/60
  transition-transform duration-200
  lg:translate-x-0
  ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
`}
    >

      {/* ═══ HEADER LOGO ═══════════════════════════════════ */}
      <div className="flex-shrink-0 px-5 pt-6 pb-5 border-b border-neutral-800/40">

        <Link href="/" className="flex items-center gap-3 group">

          <div className="relative flex-shrink-0">
            <div
              className="absolute inset-0 blur-md opacity-60"
              style={{
                background:
                  "radial-gradient(circle, rgba(245,158,11,0.5) 0%, transparent 70%)",
              }}
            />

            <div
              className="
                relative flex items-center justify-center
                h-9 w-9 rounded-lg
                border border-amber-400/40
                transition-transform duration-200
                group-hover:scale-105
              "
              style={{
                background:
                  "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)",
                boxShadow:
                  "0 4px 16px -4px rgba(245,158,11,0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
            >
              <span className="text-base font-black text-neutral-950 tracking-tighter">
                K
              </span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1.5">
              <h1 className="text-lg font-bold tracking-tight text-white">
                Kyrivo
              </h1>
              <span className="text-[8px] font-bold text-amber-400/80 uppercase tracking-[0.18em]">
                SaaS
              </span>
            </div>
            <p className="text-[10px] text-neutral-500 tracking-wider mt-0.5 truncate">
              by{" "}
              <span className="text-neutral-400 font-semibold">
                Kartium TCG
              </span>
            </p>
          </div>

        </Link>

      </div>

      {/* ═══ NAVIGATION SCROLLABLE ═════════════════════════ */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 sidebar-scroll">

        {/* État loading initial — placeholder shimmer */}
        {isAuthenticated === null && (
          <div className="space-y-2 px-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-8 bg-neutral-900/60 rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {/* Sections principales (dépend de l'état auth) */}
        {isAuthenticated !== null && navSections.map((section, sectionIdx) => (
          <div key={section.label} className={sectionIdx > 0 ? "mt-5" : ""}>

            <h2 className="px-3 mb-2 text-[10px] font-semibold text-neutral-600 uppercase tracking-widest">
              {section.label}
            </h2>

            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      relative flex items-center gap-3
                      rounded-lg px-3 py-2
                      text-sm font-medium
                      transition-all duration-150
                      group
                      ${
                        active
                          ? "bg-amber-500/10 text-amber-400"
                          : "text-neutral-400 hover:bg-neutral-900/60 hover:text-neutral-200"
                      }
                    `}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-amber-400" />
                    )}

                    <span
                      className={`
                        flex-shrink-0 transition-colors
                        ${
                          active
                            ? "text-amber-400"
                            : "text-neutral-500 group-hover:text-neutral-300"
                        }
                      `}
                    >
                      {item.icon}
                    </span>

                    <span className="flex-1">{item.label}</span>

                    {active && (
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* ═══ SECTION COMPTE — toujours visible ═════════════ */}
        {isAuthenticated !== null && (
          <div className="mt-5">

            <h2 className="px-3 mb-2 text-[10px] font-semibold text-neutral-600 uppercase tracking-widest">
              Compte
            </h2>

            <div className="flex flex-col gap-0.5">

              {/* Mon compte — uniquement si connecté */}
              {isAuthenticated && (
                <Link
                  href="/dashboard"
                  className={`
                    relative flex items-center gap-3
                    rounded-lg px-3 py-2
                    text-sm font-medium
                    transition-all duration-150
                    group
                    ${
                      isActive("/dashboard")
                        ? "bg-amber-500/10 text-amber-400"
                        : "text-neutral-400 hover:bg-neutral-900/60 hover:text-neutral-200"
                    }
                  `}
                >
                  {isActive("/dashboard") && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-amber-400" />
                  )}

                  <span
                    className={`
                      flex-shrink-0 transition-colors
                      ${
                        isActive("/dashboard")
                          ? "text-amber-400"
                          : "text-neutral-500 group-hover:text-neutral-300"
                      }
                    `}
                  >
                    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  </span>

                  <span className="flex-1">Mon compte</span>

                  {isActive("/dashboard") && (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </Link>
              )}

              {/* Abonnement — toujours visible */}
              <Link
                href="/abonnements"
                className={`
                  relative flex items-center gap-3
                  rounded-lg px-3 py-2
                  text-sm font-medium
                  transition-all duration-150
                  group
                  ${
                    isActive("/abonnements")
                      ? "bg-amber-500/10 text-amber-400"
                      : "text-neutral-400 hover:bg-neutral-900/60 hover:text-neutral-200"
                  }
                `}
              >
                {isActive("/abonnements") && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-amber-400" />
                )}

                <span
                  className={`
                    flex-shrink-0 transition-colors
                    ${
                      isActive("/abonnements")
                        ? "text-amber-400"
                        : "text-neutral-500 group-hover:text-neutral-300"
                    }
                  `}
                >
                  <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
                  </svg>
                </span>

                <span className="flex-1">Abonnement</span>

                {!isActive("/abonnements") && (
                  <span className="inline-flex items-center rounded-full bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-amber-400/80">
                    Pro
                  </span>
                )}

                {isActive("/abonnements") && (
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                )}
              </Link>

              {/* Se connecter / Se déconnecter */}
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="
                    relative flex items-center gap-3 w-full
                    rounded-lg px-3 py-2
                    text-sm font-medium text-left
                    transition-all duration-150
                    group
                    text-neutral-400
                    hover:bg-red-500/5 hover:text-red-400
                  "
                >
                  <span className="flex-shrink-0 text-neutral-500 transition-colors group-hover:text-red-400">
                    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                    </svg>
                  </span>

                  <span className="flex-1">Se déconnecter</span>
                </button>
              ) : (
                <Link
                  href="/login"
                  className="
                    relative flex items-center gap-3
                    rounded-lg px-3 py-2
                    text-sm font-medium
                    transition-all duration-150
                    group
                    text-amber-400
                    bg-amber-500/5
                    hover:bg-amber-500/10
                  "
                >
                  <span className="flex-shrink-0 text-amber-400">
                    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
                    </svg>
                  </span>

                  <span className="flex-1">Se connecter</span>
                </Link>
              )}

            </div>

          </div>
        )}

      </nav>

      {/* ═══ FOOTER ═══════════════════════════════════════ */}
      <div className="flex-shrink-0 border-t border-neutral-800/40 px-5 py-3">

        {/* Email user (uniquement si connecté) */}
        {isAuthenticated && userEmail && (
          <p className="text-[10px] text-neutral-500 truncate mb-2" title={userEmail}>
            {userEmail}
          </p>
        )}

        {/* Version + status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span
              className={`
                h-1.5 w-1.5 rounded-full animate-pulse
                ${isAuthenticated ? "bg-emerald-400" : "bg-neutral-600"}
              `}
            />
            <span className="text-[10px] text-neutral-600 font-medium">
              {isAuthenticated ? "Opérationnel" : "Visiteur"}
            </span>
          </div>
          <span className="text-[10px] text-neutral-700 font-mono">
            v0.1.0
          </span>
        </div>
      </div>

     </aside>
  </>
  );
}
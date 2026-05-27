import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/auth/LogoutButton";

export default async function DashboardPage() {

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

const { data: memberships } = await supabase
  .from("memberships")
  .select("role, company_id")
  .eq("user_id", user.id);

const firstMembership = memberships?.[0] ?? null;

let company = null;

if (firstMembership?.company_id) {
  const { data, error } = await supabase
    .from("companies")
    .select("id, name")
    .eq("id", firstMembership.company_id)
    .maybeSingle();

  if (error) {
    console.error(
      "Erreur chargement company dashboard:",
      error
    );
  }

  company = data;
}

const email = user.email ?? "";
  const initiales = email.slice(0, 2).toUpperCase();
  const nbSocietes = memberships?.length ?? 0;

const companyId = firstMembership?.company_id ?? null;
const companyName = company?.name ?? "—";

let planLabel = "Essai";
let usageText = "—";
let resetDateText = "—";
let subscriptionEndText = "—";

if (companyId) {
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan, status, monthly_line_limit, current_period_end, trial_ends_at")
    .eq("company_id", companyId)
    .maybeSingle();

const now = new Date();

const trialEndsAt = subscription?.trial_ends_at
  ? new Date(subscription.trial_ends_at)
  : null;

const periodEndsAt = subscription?.current_period_end
  ? new Date(subscription.current_period_end)
  : null;

const isTrialActive =
  subscription?.status === "trialing" &&
  trialEndsAt !== null &&
  trialEndsAt > now;

const isPaidActive =
  subscription?.status === "active" &&
  periodEndsAt !== null &&
  periodEndsAt > now;

const monthlyLimit =
  isTrialActive || isPaidActive
    ? subscription?.monthly_line_limit ?? 0
    : 0;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const monthStartIso = monthStart.toISOString();

const { data: usageEvents, error: usageError } = await supabase
  .from("usage_events")
  .select("lines_used")
  .eq("company_id", companyId)
  .gte("created_at", monthStartIso);

if (usageError) {
  console.error("Erreur compteur usage dashboard:", usageError);
}

const usedLines = (usageEvents || []).reduce(
  (total, event) => total + Number(event.lines_used || 0),
  0
);

  planLabel =
    isTrialActive
      ? "Essai 7 jours"
      : isPaidActive && subscription?.plan
        ? subscription.plan.toUpperCase()
        : "Aucun abonnement";

    usageText = `${monthlyLimit > 0 ? usedLines : 0}/${monthlyLimit}`;

  subscriptionEndText =
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
    }

const nextReset = new Date();

nextReset.setMonth(
  nextReset.getMonth() + 1
);

nextReset.setDate(1);

resetDateText =
  nextReset.toLocaleDateString("fr-BE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const cardStyle: React.CSSProperties = {
    background: "#171717",
    border: "1px solid #262626",
    borderRadius: "14px",
  };

  return (

    <div
      className="p-6 lg:p-8"
      style={{
        maxWidth: "1120px",
      }}
    >

      {/* HERO */}
      <div
        className="flex items-center justify-between mb-8"
        style={{
          paddingBottom: "24px",
          borderBottom: "1px solid #1f1f1f",
        }}
      >

        <div>

          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-3"
            style={{
              background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.2)",
            }}
          >

            <span
              className="h-1.5 w-1.5 rounded-full animate-pulse"
              style={{
                background: "#f59e0b",
              }}
            />

            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#f59e0b",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              Kyrivo v0.1
            </span>

          </div>

          <h1
            style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}
          >
            Tableau de bord
          </h1>

          <p
            style={{
              fontSize: "13px",
              color: "#666666",
              marginTop: "6px",
            }}
          >
            {email}
          </p>

        </div>

        <div className="flex items-center gap-3">

          <div className="relative">

            <div
              className="flex items-center justify-center text-xs font-black"
              style={{
                height: "34px",
                width: "34px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                color: "#140800",
              }}
            >
              {initiales}
            </div>

            <span
              className="absolute"
              style={{
                bottom: "-1px",
                right: "-1px",
                height: "10px",
                width: "10px",
                borderRadius: "50%",
                background: "#22c55e",
                border: "2px solid #111111",
              }}
            />

          </div>

          <LogoutButton />

        </div>

      </div>

      {/* STATS */}
      <div
        className="grid gap-4 mb-6"
        style={{
          gridTemplateColumns: "repeat(6, 1fr)",
        }}
      >

        <StatCard label="Sociétés" value={nbSocietes.toString()} />

        <StatCard
          label="Statut"
          value="Actif"
          color="#4ade80"
        />

        <StatCard
          label="Plan"
          value={planLabel}
          color="#f59e0b"
        />

        <StatCard
          label="Lignes utilisées"
          value={usageText}
        />


              <StatCard
  label="Réinitialisation"
  value={resetDateText}
  color="#60a5fa"
/>

<StatCard
  label="Fin abonnement"
  value={subscriptionEndText}
  color="#f59e0b"
/>


      </div>


      {/* GRID */}
      <div
        className="grid gap-4 mb-6"
        style={{
          gridTemplateColumns: "300px 1fr",
        }}
      >

        {/* PROFIL */}
        <div style={cardStyle}>

          <div
            style={{
              height: "2px",
              background: "linear-gradient(90deg, #f59e0b, transparent)",
            }}
          />

          <div className="p-5">

            <div className="flex items-center gap-3 mb-5">

              <div
                className="flex items-center justify-center font-black flex-shrink-0"
                style={{
                  height: "42px",
                  width: "42px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  color: "#140800",
                  fontSize: "14px",
                }}
              >
                {initiales}
              </div>

              <div style={{ minWidth: 0 }}>

                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#ffffff",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {email}
                </p>

                <p
                  style={{
                    fontSize: "11px",
                    color: "#666666",
                    marginTop: "2px",
                  }}
                >
                  Utilisateur Kyrivo
                </p>

              </div>

            </div>

            <div
              style={{
                borderTop: "1px solid #232323",
                marginBottom: "16px",
              }}
            />

            <MiniField
              label="Email"
value={email}
            />

            <div style={{ marginTop: "14px" }}>

              <MiniField
                label="User ID"
                value={user.id}
                mono
              />

            </div>

          </div>

        </div>

        {/* SOCIÉTÉS */}
        <div style={cardStyle}>

          <div
            className="flex items-center justify-between"
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid #232323",
            }}
          >

            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#777777",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Sociétés
            </span>

            <span
              style={{
                fontSize: "10px",
                color: "#4a4a4a",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 700,
              }}
            >
              {nbSocietes} au total
            </span>

          </div>

          <div className="p-5">

            {(!memberships || memberships.length === 0) && (

              <div className="flex flex-col items-center justify-center py-12">

                <div
                  className="flex items-center justify-center mb-4"
                  style={{
                    height: "48px",
                    width: "48px",
                    borderRadius: "14px",
                    background: "#1f1f1f",
                    border: "1px solid #2a2a2a",
                  }}
                >

                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    style={{
                      color: "#555555",
                    }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 21h19.5"
                    />
                  </svg>

                </div>

                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#777777",
                    marginBottom: "4px",
                  }}
                >
                  Aucune société associée
                </p>

                <p
                  style={{
                    fontSize: "12px",
                    color: "#4a4a4a",
                    textAlign: "center",
                    maxWidth: "240px",
                    lineHeight: 1.6,
                  }}
                >
                  Créez ou rejoignez une société pour commencer à utiliser Kyrivo.
                </p>

              </div>

            )}

            {memberships && memberships.length > 0 && (
  <div className="space-y-3">
    <MiniField
      label="Société active"
      value={companyName}
    />

    <MiniField
      label="Rôle"
      value={firstMembership?.role ?? "—"}
    />

    <MiniField
      label="Company ID"
      value={companyId ?? "—"}
      mono
    />
  </div>
)}

          </div>

        </div>

      </div>

      {/* PLACEHOLDERS */}
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: "1fr 1fr",
        }}
      >

        <PlaceholderSection label="Derniers achats" />

        <PlaceholderSection label="Dernières ventes" />

      </div>

      {/* FOOTER */}
      <div
        className="flex items-center justify-between mt-8"
        style={{
          paddingTop: "18px",
          borderTop: "1px solid #1f1f1f",
        }}
      >

        <p
          style={{
            fontSize: "10px",
            color: "#444444",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
          }}
        >
          Kyrivo MVP · Gestion opérationnelle
        </p>

        <p
          style={{
            fontSize: "10px",
            color: "#444444",
          }}
        >
          v0.1.0
        </p>

      </div>

    </div>
  );
}

function StatCard({
  label,
  value,
  color = "#f5f5f5",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (

    <div
      style={{
        background: "#171717",
        border: "1px solid #262626",
        borderRadius: "14px",
        overflow: "hidden",
      }}
    >

      <div
        style={{
          height: "2px",
          background: "linear-gradient(90deg, #f59e0b, transparent)",
        }}
      />

      <div className="p-4">

        <p
          style={{
            fontSize: "10px",
            fontWeight: 700,
            color: "#555555",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: "10px",
          }}
        >
          {label}
        </p>

        <p
          style={{
            fontSize: "22px",
            fontWeight: 800,
            color,
            letterSpacing: "-0.03em",
          }}
        >
          {value}
        </p>

      </div>

    </div>
  );
}

function MiniField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (

    <div>

      <p
        style={{
          fontSize: "10px",
          fontWeight: 700,
          color: "#555555",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: "4px",
        }}
      >
        {label}
      </p>

      <p
        style={{
          fontSize: mono ? "11px" : "13px",
          color: "#b0b0b0",
          fontFamily: mono ? "monospace" : "inherit",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {value || "—"}
      </p>

    </div>
  );
}

function PlaceholderSection({
  label,
}: {
  label: string;
}) {
  return (

    <div
      style={{
        background: "#161616",
        border: "1px dashed #262626",
        borderRadius: "14px",
        padding: "22px",
      }}
    >

      <p
        style={{
          fontSize: "13px",
          fontWeight: 600,
          color: "#666666",
          marginBottom: "6px",
        }}
      >
        {label}
      </p>

      <p
        style={{
          fontSize: "11px",
          color: "#444444",
        }}
      >
        Disponible prochainement
      </p>

    </div>
  );
}
import { createClient } from "@/lib/supabase/client";

import {
  CompanySubscription,
  PLAN_LINE_LIMITS,
  SubscriptionPlan,
} from "@/types/subscription";

const supabase = createClient();

function mapSubscription(row: any): CompanySubscription {
  return {
    id: row.id,
    companyId: row.company_id,
    plan: row.plan,
    status: row.status,
    monthlyLineLimit: Number(row.monthly_line_limit || 0),
    currentPeriodStart: row.current_period_start,
    currentPeriodEnd: row.current_period_end,
    trialEndsAt: row.trial_ends_at,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getCompanySubscription(
  companyId: string
): Promise<CompanySubscription | null> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("company_id", companyId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapSubscription(data);
}

export async function ensureTrialSubscription(
  companyId: string
): Promise<CompanySubscription> {
  const existing = await getCompanySubscription(companyId);

  if (existing) {
    return existing;
  }

  const now = new Date();

  const trialEnds = new Date(now);
  trialEnds.setDate(trialEnds.getDate() + 7);

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      company_id: companyId,
      plan: "trial",
      status: "trialing",
      monthly_line_limit: PLAN_LINE_LIMITS.trial,
      current_period_start: now.toISOString(),
      current_period_end: trialEnds.toISOString(),
      trial_ends_at: trialEnds.toISOString(),
      updated_at: now.toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  return mapSubscription(data);
}

export async function updateSubscriptionPlan(params: {
  companyId: string;
  plan: SubscriptionPlan;
}) {
  const { companyId, plan } = params;

  const { data, error } = await supabase
    .from("subscriptions")
    .update({
      plan,
      status: "active",
      monthly_line_limit: PLAN_LINE_LIMITS[plan],
      updated_at: new Date().toISOString(),
    })
    .eq("company_id", companyId)
    .select()
    .single();

  if (error) throw error;

  return mapSubscription(data);
}

export async function getLineUsageForPeriod(params: {
  companyId: string;
  periodStart: string;
  periodEnd?: string | null;
}): Promise<number> {
  const { companyId, periodStart, periodEnd } = params;

  let query = supabase
    .from("usage_events")
    .select("lines_used")
    .eq("company_id", companyId)
    .gte("created_at", periodStart);

  if (periodEnd) {
    query = query.lt("created_at", periodEnd);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).reduce(
    (total, event) => total + Number(event.lines_used || 0),
    0
  );
}

export async function canCreateLines(params: {
  companyId: string;
  linesToCreate?: number;
}) {
  const { companyId } = params;
  const linesToCreate = params.linesToCreate || 1;

  const subscription = await getCompanySubscription(companyId);
  const now = new Date();

  if (!subscription) {
    return {
      allowed: false,
      reason: "no_subscription" as const,
      used: 0,
      remaining: 0,
      limit: 0,
      subscription: null,
    };
  }

  const periodEnd = subscription.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd)
    : null;

  const isExpired = periodEnd ? periodEnd <= now : true;

  const isActive =
    subscription.status === "active" || subscription.status === "trialing";

  if (!isActive || isExpired) {
    return {
      allowed: false,
      reason: "inactive_or_expired" as const,
      used: 0,
      remaining: 0,
      limit: 0,
      subscription,
    };
  }

  const limit = Number(subscription.monthlyLineLimit || 0);

  if (limit <= 0) {
    return {
      allowed: false,
      reason: "no_quota" as const,
      used: 0,
      remaining: 0,
      limit: 0,
      subscription,
    };
  }

  const used = await getLineUsageForPeriod({
    companyId,
    periodStart: subscription.currentPeriodStart,
    periodEnd: subscription.currentPeriodEnd,
  });

  const remaining = Math.max(0, limit - used);

  return {
    allowed: remaining >= linesToCreate,
    reason:
      remaining >= linesToCreate ? ("allowed" as const) : ("quota_exceeded" as const),
    used,
    remaining,
    limit,
    subscription,
  };
}
/**
 * Trustpilot's Automatic Feedback Service (AFS) mailbox for Kyrivo.
 * This address was supplied by Trustpilot during domain setup.
 *
 * Add a hidden copy to the EXISTING welcome email (J0) only:
 * - no additional outbound email,
 * - no condition on recorded purchases or sales,
 * - the existing email_logs deduplication and unsubscribe rules still apply.
 *
 * Do not copy this address to J3 or the last-day email: that would trigger multiple
 * Trustpilot invitations for the same trial.
 */
export const TRUSTPILOT_AFS_BCC = "kyrivo.fr+7c93e07014@invite.trustpilot.com";

export type TrialEmailType = "trial_welcome_j0" | "trial_activation_j3" | "trial_last_day";

/** Returns undefined for non-invitation emails, so no CCI is sent. */
export function trustpilotBccForTrialEmail(emailType: TrialEmailType): string | undefined {
  return emailType === "trial_welcome_j0" ? TRUSTPILOT_AFS_BCC : undefined;
}

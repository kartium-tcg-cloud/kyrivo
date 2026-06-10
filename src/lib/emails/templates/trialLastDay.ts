import { APP_URL } from "../mailer";

interface Params {
  unsubscribeUrl: string;
}

export function trialLastDay({ unsubscribeUrl }: Params) {
  const loginUrl = `${APP_URL}/login`;
  const pricingUrl = `${APP_URL}/abonnements`;

  const subject = "Dernier jour pour tester Kyrivo gratuitement";

  const text = `Ton essai Kyrivo arrive à sa fin — il te reste moins de 24 heures.

Si tu veux continuer à suivre tes achats, ventes, stock et marges, voici les plans disponibles :

• Pro — 9,90 €/mois — 500 lignes/mois
  Pour les petits revendeurs : Vinted, brocante, cartes en volume limité.

• Business — 24,90 €/mois — 5 000 lignes/mois
  Pour un volume plus soutenu ou plusieurs catégories d'articles.

• Entreprise — 79,90 €/mois — 50 000 lignes/mois
  Pour les revendeurs professionnels à fort volume.

Pour la majorité des petits revendeurs, le plan Pro suffit largement pour commencer.

---
Note de Pierre :
Kyrivo est un outil à échelle humaine. Si une fonctionnalité te manque ou si tu as une idée pour améliorer le site, tu peux simplement répondre à ce mail. Les retours des utilisateurs influencent réellement les prochaines améliorations.
---

→ Voir les abonnements : ${pricingUrl}
→ Me connecter à Kyrivo : ${loginUrl}

À bientôt,
Pierre — Kyrivo

---
Tu reçois cet email car ton essai Kyrivo arrive à sa fin.
Se désinscrire : ${unsubscribeUrl}`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Dernier jour pour tester Kyrivo gratuitement</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0a0a0a;padding:32px 16px;">
  <tr>
    <td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

        <!-- Logo -->
        <tr>
          <td align="center" style="padding-bottom:28px;">
            <img src="${APP_URL}/brand/kyrivo-logo-primary-dark.svg" alt="Kyrivo" height="36" style="display:block;height:36px;" />
          </td>
        </tr>

        <!-- Card -->
        <tr>
          <td style="background:#141414;border:1px solid #262626;border-radius:12px;overflow:hidden;">

            <!-- Amber top bar -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="height:3px;background:linear-gradient(90deg,#f59e0b 0%,#d97706 100%);font-size:0;line-height:0;">&nbsp;</td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding:36px 32px 32px;">

                  <!-- Badge -->
                  <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
                    <tr>
                      <td style="background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.25);border-radius:20px;padding:4px 12px;">
                        <span style="font-size:11px;font-weight:700;color:#f59e0b;text-transform:uppercase;letter-spacing:0.1em;">
                          Essai actif — moins de 24h restantes
                        </span>
                      </td>
                    </tr>
                  </table>

                  <!-- Heading -->
                  <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">
                    Ton essai gratuit arrive à sa fin.
                  </h1>
                  <p style="margin:0 0 32px;font-size:15px;color:#a3a3a3;line-height:1.65;">
                    Il te reste moins de 24 heures. Si tu veux continuer à suivre tes achats, ventes, stock et marges, voici les plans disponibles.
                  </p>

                  <!-- Plans -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;border:1px solid #262626;border-radius:8px;overflow:hidden;">

                    <!-- Pro -->
                    <tr>
                      <td style="padding:16px 20px;border-bottom:1px solid #1e1e1e;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td>
                              <span style="font-size:15px;font-weight:700;color:#ffffff;">Pro</span>
                              <span style="display:inline-block;margin-left:8px;background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.3);border-radius:4px;padding:1px 8px;font-size:11px;font-weight:600;color:#f59e0b;">Recommandé</span>
                            </td>
                            <td align="right">
                              <span style="font-size:18px;font-weight:700;color:#ffffff;">9,90&nbsp;€</span>
                              <span style="font-size:12px;color:#525252;">/mois</span>
                            </td>
                          </tr>
                          <tr>
                            <td colspan="2" style="padding-top:4px;">
                              <span style="font-size:13px;color:#737373;">500 lignes/mois — Vinted, brocante, cartes en volume limité</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Business -->
                    <tr>
                      <td style="padding:16px 20px;border-bottom:1px solid #1e1e1e;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td><span style="font-size:15px;font-weight:700;color:#ffffff;">Business</span></td>
                            <td align="right">
                              <span style="font-size:18px;font-weight:700;color:#ffffff;">24,90&nbsp;€</span>
                              <span style="font-size:12px;color:#525252;">/mois</span>
                            </td>
                          </tr>
                          <tr>
                            <td colspan="2" style="padding-top:4px;">
                              <span style="font-size:13px;color:#737373;">5 000 lignes/mois — Volume soutenu ou plusieurs catégories</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Entreprise -->
                    <tr>
                      <td style="padding:16px 20px;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td><span style="font-size:15px;font-weight:700;color:#ffffff;">Entreprise</span></td>
                            <td align="right">
                              <span style="font-size:18px;font-weight:700;color:#ffffff;">79,90&nbsp;€</span>
                              <span style="font-size:12px;color:#525252;">/mois</span>
                            </td>
                          </tr>
                          <tr>
                            <td colspan="2" style="padding-top:4px;">
                              <span style="font-size:13px;color:#737373;">50 000 lignes/mois — Revendeurs professionnels à fort volume</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                  </table>

                  <!-- Hint Pro -->
                  <p style="margin:0 0 28px;font-size:13px;color:#525252;line-height:1.6;">
                    Pour la majorité des petits revendeurs, le plan Pro suffit largement pour commencer.
                  </p>

                  <!-- CTA principal -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;">
                    <tr>
                      <td align="center">
                        <a href="${pricingUrl}"
                           style="display:inline-block;background:#f59e0b;color:#0a0a0a;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:8px;">
                          Voir les abonnements
                        </a>
                      </td>
                    </tr>
                  </table>

                  <!-- CTA secondaire -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
                    <tr>
                      <td align="center">
                        <a href="${loginUrl}"
                           style="display:inline-block;color:#737373;font-size:14px;text-decoration:none;padding:8px 0;">
                          Me connecter à Kyrivo →
                        </a>
                      </td>
                    </tr>
                  </table>

                  <!-- Note de Pierre -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="background:#1a1a1a;border:1px solid #262626;border-left:3px solid #f59e0b;border-radius:0 8px 8px 0;padding:16px 20px;">
                        <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#f59e0b;text-transform:uppercase;letter-spacing:0.1em;">
                          Note de Pierre
                        </p>
                        <p style="margin:0;font-size:14px;color:#a3a3a3;line-height:1.7;">
                          Kyrivo est un outil à échelle humaine. Si une fonctionnalité te manque ou si tu as une idée pour améliorer le site, tu peux simplement répondre à ce mail. Les retours des utilisateurs influencent réellement les prochaines améliorations.
                        </p>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding-top:24px;text-align:center;">
            <p style="margin:0 0 8px;font-size:12px;color:#404040;line-height:1.6;">
              Tu reçois cet email car ton essai Kyrivo arrive à sa fin.
            </p>
            <p style="margin:0;font-size:12px;color:#404040;">
              <a href="${unsubscribeUrl}" style="color:#525252;text-decoration:underline;">Se désinscrire</a>
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>`;

  return { subject, text, html };
}

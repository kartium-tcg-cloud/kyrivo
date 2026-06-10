import { APP_URL } from "../mailer";

interface Params {
  unsubscribeUrl: string;
}

export function trialActivationJ3({ unsubscribeUrl }: Params) {
  const loginUrl = `${APP_URL}/login`;

  const subject = "Il te reste 4 jours pour tester Kyrivo";

  const text = `Ton essai Kyrivo — il te reste 4 jours.

Voici une checklist rapide de ce que tu peux tester avant la fin :

✓ Encoder un achat
✓ Ajouter une vente
✓ Consulter le stock en temps réel
✓ Regarder tes marges dans le dashboard
✓ Générer une facture de test

Chaque étape prend moins de 2 minutes. Tu n'as pas besoin de données réelles pour tester — quelques exemples suffisent.

→ Tester Kyrivo maintenant : ${loginUrl}

À bientôt,
Pierre — Kyrivo

---
Tu reçois cet email car tu as un essai Kyrivo actif.
Se désinscrire : ${unsubscribeUrl}`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Il te reste 4 jours — Kyrivo</title>
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

            <!-- Body -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding:36px 32px 32px;">

                  <!-- Badge -->
                  <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
                    <tr>
                      <td style="background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.25);border-radius:20px;padding:4px 12px;">
                        <span style="font-size:11px;font-weight:700;color:#f59e0b;text-transform:uppercase;letter-spacing:0.1em;">
                          Essai actif — 4 jours restants
                        </span>
                      </td>
                    </tr>
                  </table>

                  <!-- Heading -->
                  <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">
                    Tu as démarré l'essai.<br />As-tu eu le temps de tout tester&nbsp;?
                  </h1>

                  <p style="margin:0 0 28px;font-size:15px;color:#a3a3a3;line-height:1.65;">
                    Voici les 5 choses à essayer avant la fin — chaque étape prend moins de 2 minutes. Tu n'as pas besoin de données réelles pour tester.
                  </p>

                  <!-- Checklist -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;background:#1a1a1a;border:1px solid #262626;border-radius:8px;">
                    <tr>
                      <td style="padding:20px 20px;">
                        <p style="margin:0 0 14px;font-size:11px;font-weight:700;color:#f59e0b;text-transform:uppercase;letter-spacing:0.1em;">
                          Checklist essai
                        </p>

                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr><td style="padding:7px 0;border-bottom:1px solid #222;">
                            <table cellpadding="0" cellspacing="0" border="0"><tr>
                              <td style="width:24px;font-size:14px;color:#f59e0b;">✓</td>
                              <td style="font-size:14px;color:#d4d4d4;"><strong style="color:#ffffff;">Encoder un achat</strong> — article, lot ou stock</td>
                            </tr></table>
                          </td></tr>
                          <tr><td style="padding:7px 0;border-bottom:1px solid #222;">
                            <table cellpadding="0" cellspacing="0" border="0"><tr>
                              <td style="width:24px;font-size:14px;color:#f59e0b;">✓</td>
                              <td style="font-size:14px;color:#d4d4d4;"><strong style="color:#ffffff;">Ajouter une vente</strong> — liée ou non à un achat</td>
                            </tr></table>
                          </td></tr>
                          <tr><td style="padding:7px 0;border-bottom:1px solid #222;">
                            <table cellpadding="0" cellspacing="0" border="0"><tr>
                              <td style="width:24px;font-size:14px;color:#f59e0b;">✓</td>
                              <td style="font-size:14px;color:#d4d4d4;"><strong style="color:#ffffff;">Regarder le stock</strong> — articles disponibles, quantités</td>
                            </tr></table>
                          </td></tr>
                          <tr><td style="padding:7px 0;border-bottom:1px solid #222;">
                            <table cellpadding="0" cellspacing="0" border="0"><tr>
                              <td style="width:24px;font-size:14px;color:#f59e0b;">✓</td>
                              <td style="font-size:14px;color:#d4d4d4;"><strong style="color:#ffffff;">Consulter les marges</strong> — dashboard et résultat réel</td>
                            </tr></table>
                          </td></tr>
                          <tr><td style="padding:7px 0;">
                            <table cellpadding="0" cellspacing="0" border="0"><tr>
                              <td style="width:24px;font-size:14px;color:#f59e0b;">✓</td>
                              <td style="font-size:14px;color:#d4d4d4;"><strong style="color:#ffffff;">Générer une facture de test</strong> — section Factures</td>
                            </tr></table>
                          </td></tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- CTA -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:0;">
                    <tr>
                      <td align="center">
                        <a href="${loginUrl}"
                           style="display:inline-block;background:#f59e0b;color:#0a0a0a;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:8px;">
                          Tester Kyrivo maintenant
                        </a>
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
              Tu reçois cet email car tu as un essai Kyrivo actif.
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

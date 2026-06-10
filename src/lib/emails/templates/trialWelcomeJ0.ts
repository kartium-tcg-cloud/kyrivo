import { APP_URL } from "../mailer";

interface Params {
  unsubscribeUrl: string;
}

export function trialWelcomeJ0({ unsubscribeUrl }: Params) {
  const loginUrl = `${APP_URL}/login`;

  const subject = "Bienvenue sur Kyrivo — commence par un achat";

  const text = `Bienvenue sur Kyrivo !

Ton essai de 7 jours est actif. Pas de carte bancaire requise.

Pour bien démarrer, la première chose à faire est d'encoder un achat.
C'est ça le point de départ : une fois que tu as des achats, tu peux ajouter des ventes, suivre ton stock et voir ta marge réelle.

→ Commencer avec Kyrivo : ${loginUrl}

Tes données sont exportables à tout moment vers Excel — tu ne perds rien si tu décides de ne pas continuer.

À bientôt,
Pierre — Kyrivo

---
Tu reçois cet email car tu viens de créer un compte Kyrivo.
Se désinscrire : ${unsubscribeUrl}`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Bienvenue sur Kyrivo</title>
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
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:36px 32px 32px;">
              <tr>
                <td>

                  <!-- Heading -->
                  <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">
                    Bienvenue sur Kyrivo&nbsp;👋
                  </h1>
                  <p style="margin:0 0 28px;font-size:13px;color:#737373;">
                    Ton essai de 7 jours est actif — sans carte bancaire.
                  </p>

                  <!-- Intro -->
                  <p style="margin:0 0 20px;font-size:15px;color:#d4d4d4;line-height:1.65;">
                    Pour bien démarrer, la première chose à faire est d'<strong style="color:#ffffff;">encoder un achat</strong>.
                  </p>
                  <p style="margin:0 0 28px;font-size:15px;color:#a3a3a3;line-height:1.65;">
                    C'est le point de départ : une fois que tu as des achats dans l'outil, tu peux ajouter des ventes, consulter ton stock en temps réel et voir ta marge réelle — sans fichier Excel compliqué.
                  </p>

                  <!-- Steps -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;background:#1a1a1a;border:1px solid #262626;border-radius:8px;padding:20px 20px;">
                    <tr>
                      <td style="padding:20px 20px;">
                        <p style="margin:0 0 14px;font-size:11px;font-weight:700;color:#f59e0b;text-transform:uppercase;letter-spacing:0.1em;">
                          Par où commencer
                        </p>
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="padding:6px 0;">
                              <table cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                  <td style="width:22px;vertical-align:top;">
                                    <span style="display:inline-block;width:18px;height:18px;background:#f59e0b;border-radius:50%;font-size:10px;font-weight:700;color:#0a0a0a;text-align:center;line-height:18px;">1</span>
                                  </td>
                                  <td style="font-size:14px;color:#d4d4d4;padding-left:10px;">
                                    <strong style="color:#ffffff;">Achats</strong> — encode ton premier achat (article, lot ou stock)
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:6px 0;">
                              <table cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                  <td style="width:22px;vertical-align:top;">
                                    <span style="display:inline-block;width:18px;height:18px;background:#f59e0b;border-radius:50%;font-size:10px;font-weight:700;color:#0a0a0a;text-align:center;line-height:18px;">2</span>
                                  </td>
                                  <td style="font-size:14px;color:#d4d4d4;padding-left:10px;">
                                    <strong style="color:#ffffff;">Ventes</strong> — ajoute une vente liée à cet article
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:6px 0;">
                              <table cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                  <td style="width:22px;vertical-align:top;">
                                    <span style="display:inline-block;width:18px;height:18px;background:#f59e0b;border-radius:50%;font-size:10px;font-weight:700;color:#0a0a0a;text-align:center;line-height:18px;">3</span>
                                  </td>
                                  <td style="font-size:14px;color:#d4d4d4;padding-left:10px;">
                                    <strong style="color:#ffffff;">Marge</strong> — consulte le dashboard pour voir ta marge réelle
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- CTA -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                    <tr>
                      <td align="center">
                        <a href="${loginUrl}"
                           style="display:inline-block;background:#f59e0b;color:#0a0a0a;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:8px;">
                          Commencer avec Kyrivo
                        </a>
                      </td>
                    </tr>
                  </table>

                  <!-- Reassurance -->
                  <p style="margin:0;font-size:13px;color:#525252;line-height:1.6;text-align:center;">
                    Tes données sont exportables à tout moment vers Excel — tu ne perds rien.
                  </p>

                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding-top:24px;text-align:center;">
            <p style="margin:0 0 8px;font-size:12px;color:#404040;line-height:1.6;">
              Tu reçois cet email car tu viens de créer un compte Kyrivo.
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

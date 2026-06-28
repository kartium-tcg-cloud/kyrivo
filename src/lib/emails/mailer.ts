import nodemailer from "nodemailer";

export const APP_URL =
  process.env.APP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://kyrivo.fr";

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("[mailer] SMTP_HOST, SMTP_USER ou SMTP_PASS manquant");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
  unsubscribeUrl?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<string> {
  const { to, subject, html, text, unsubscribeUrl } = params;

  const fromName = process.env.FROM_NAME || "Kyrivo";
  const fromEmail = process.env.FROM_EMAIL;
  if (!fromEmail) throw new Error("[mailer] FROM_EMAIL manquant");

  const transporter = createTransporter();

  const extraHeaders: Record<string, string> = {};
  if (unsubscribeUrl) {
    extraHeaders["List-Unsubscribe"] = `<${unsubscribeUrl}>`;
    extraHeaders["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }

  const info = await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    html,
    text,
    headers: extraHeaders,
  });

  return (info.messageId as string) ?? "";
}

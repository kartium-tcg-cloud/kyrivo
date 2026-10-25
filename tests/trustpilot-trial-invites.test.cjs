const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function source(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}
function compile(file, mockRequire) {
  const transpiled = ts.transpileModule(source(file), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(transpiled, {
    module: mod, exports: mod.exports, require: mockRequire, process: { env: {} }, console,
  });
  return mod.exports;
}

const AFS = "kyrivo.fr+7c93e07014@invite.trustpilot.com";

test("Trustpilot AFS is copied on welcome J0 only, not J3 or end of trial", () => {
  const m = compile("src/lib/emails/trustpilot.ts", () => { throw Error("No dependencies expected"); });
  assert.equal(m.trustpilotBccForTrialEmail("trial_welcome_j0"), AFS);
  assert.equal(m.trustpilotBccForTrialEmail("trial_activation_j3"), undefined);
  assert.equal(m.trustpilotBccForTrialEmail("trial_last_day"), undefined);
});

test("SMTP sends hidden copy without changing the visible recipient", async () => {
  let call;
  const transport = { sendMail: async (options) => {
    call = options;
    return { messageId: "test-message" };
  } };
  const nodeMailer = {
    createTransport: () => transport,
  };
  const tsSource = source("src/lib/emails/mailer.ts");
  const transpiled = ts.transpileModule(tsSource, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const mod = { exports: {} };
  const stubEnv = {
    SMTP_HOST: "smtp.invalid", SMTP_USER: "test-user", SMTP_PASS: "test-password",
    FROM_EMAIL: "contact@kartium-tcg.com",
  };
  vm.runInNewContext(transpiled, {
    module: mod, exports: mod.exports,
    require: id => {
      if (id === "nodemailer") return nodeMailer;
      throw Error("Unexpected module " + id);
    },
    process: { env: stubEnv }, console,
  });
  const id = await mod.exports.sendEmail({
    to: "customer@example.net", bcc: AFS,
    subject: "Bienvenue sur Kyrivo", html: "<p>Bienvenue</p>", text: "Bienvenue",
  });
  assert.equal(id, "test-message");
  assert.equal(call.to, "customer@example.net");
  assert.equal(call.bcc, AFS);
  assert.equal(call.from, '"Kyrivo" <contact@kartium-tcg.com>');
});

test("SMTP normal messages do not carry an AFS copy", () => {
  const mail = source("src/lib/emails/mailer.ts");
  assert.match(mail, /\.\.\.\(bcc \? \{ bcc \} : \{\}\)/);
});

test("Existing trial email filtering/deduplication and opt-out are preserved", () => {
  const code = source("src/app/api/cron/trial-emails/route.ts");
  assert.match(code, /const alreadySent = await isAlreadySent\(userId, email, emailType\)/);
  assert.match(code, /const unsubscribed = await isUnsubscribed\(email\)/);
  assert.match(code, /if \(dryRun\)/);
  assert.match(code, /bcc: trustpilotBccForTrialEmail\(emailType\)/);
  assert.match(code, /emailType: "trial_welcome_j0"/);
  // The candidate selector must never require a purchase or a sale.
  assert.doesNotMatch(code, /\.from\("purchases"\)|\.from\("sales"\)/);
});

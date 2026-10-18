"use client";

import { useState } from "react";

export default function AdBudgetCalculator({ visitors, registrations, subscribers }: {
  visitors: number;
  registrations: number;
  subscribers: number;
}) {
  const [spendInput, setSpendInput] = useState("");
  const spend = Number(spendInput.replace(",", "."));
  const valid = spendInput.trim() !== "" && Number.isFinite(spend) && spend >= 0;
  const format = (amount: number) => amount.toLocaleString("fr-BE", {
    style: "currency", currency: "EUR", maximumFractionDigits: 2,
  });
  return (
    <section className="rounded-2xl border border-neutral-700 bg-neutral-900/60 p-5 sm:p-7">
      <h2 className="text-xl font-semibold text-white">Coût d&apos;acquisition estimé</h2>
      <p className="mt-2 text-sm text-neutral-400">
        Renseignez les dépenses réellement affichées dans ChatGPT Ads Manager sur la
        même période. Ce calcul reste interne et ne modifie aucun budget publicitaire.
      </p>
      <label className="mt-5 block text-sm font-medium text-neutral-200" htmlFor="ads-spend">
        Dépenses ChatGPT Ads des 30 derniers jours (€)
      </label>
      <input
        id="ads-spend"
        type="text"
        inputMode="decimal"
        value={spendInput}
        onChange={(e) => setSpendInput(e.target.value)}
        placeholder="Ex. : 105,00"
        className="mt-2 w-full max-w-xs rounded-xl border border-neutral-600 bg-neutral-950 px-4 py-3 text-white outline-none focus:border-amber-400"
      />
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Coût / visite", value: valid && visitors > 0 ? format(spend / visitors) : "—" },
          { label: "Coût / inscription", value: valid && registrations > 0 ? format(spend / registrations) : "—" },
          { label: "Coût / abonné actif", value: valid && subscribers > 0 ? format(spend / subscribers) : "—" },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-neutral-700/70 bg-neutral-950/60 p-4">
            <p className="text-xs text-neutral-400">{m.label}</p>
            <p className="mt-2 text-xl font-bold text-amber-300">{m.value}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs leading-5 text-neutral-500">
        Les visites sont des événements internes, pas les clics facturés par OpenAI.
        Les abonnés représentent les conversions attribuées en interne, pas
        nécessairement les conversions validées par la fenêtre d&apos;attribution d&apos;OpenAI.
        Pour les dépenses exactes et les conversions reconnues par OpenAI, consultez Ads Manager.
      </p>
    </section>
  );
}

"use client";

import { useState } from "react";

export const PAYMENT_METHOD_PRESETS = [
  "Virement", "PayPal", "Bancontact", "Cash",
  "Vinted", "Shopify", "CardMarket", "Voggt",
] as const;

export const MAX_CUSTOM_PAYMENT_METHODS = 10;
export const MAX_PAYMENT_METHODS = PAYMENT_METHOD_PRESETS.length + MAX_CUSTOM_PAYMENT_METHODS;

const isPreset = (name: string) =>
  PAYMENT_METHOD_PRESETS.some((preset) => preset.toLowerCase() === name.toLowerCase());

export function validatePaymentMethods(selected: string[]): string | null {
  if (selected.length > MAX_PAYMENT_METHODS) return "Maximum 18 modes de paiement.";
  if (selected.some((method) => !method.trim() || method.length > 40)) {
    return "Chaque mode de paiement doit comporter entre 1 et 40 caractères.";
  }
  if (new Set(selected.map((method) => method.trim().toLowerCase())).size !== selected.length) {
    return "Un mode de paiement est présent plusieurs fois.";
  }
  if (selected.filter((method) => !isPreset(method)).length > MAX_CUSTOM_PAYMENT_METHODS) {
    return "Maximum 10 modes de paiement personnalisés.";
  }
  return null;
}

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
};

export default function PaymentMethodsPicker({ value, onChange }: Props) {
  const [newMethod, setNewMethod] = useState("");
  const [error, setError] = useState("");
  const customMethods = value.filter((method) => !isPreset(method));

  function toggle(method: string) {
    setError("");
    onChange(
      value.some((current) => current.toLowerCase() === method.toLowerCase())
        ? value.filter((current) => current.toLowerCase() !== method.toLowerCase())
        : [...value, method]
    );
  }

  function add() {
    const name = newMethod.trim();
    if (!name) return;
    if (name.length > 40) return setError("40 caractères maximum par mode.");
    if (value.some((method) => method.toLowerCase() === name.toLowerCase())) {
      setNewMethod("");
      return setError("Ce mode de paiement est déjà présent.");
    }
    if (isPreset(name)) {
      const preset = PAYMENT_METHOD_PRESETS.find((m) => m.toLowerCase() === name.toLowerCase())!;
      toggle(preset);
      setNewMethod("");
      return;
    }
    if (customMethods.length >= MAX_CUSTOM_PAYMENT_METHODS) {
      return setError("Vous pouvez ajouter au maximum 10 modes personnalisés.");
    }
    onChange([...value, name]);
    setNewMethod("");
    setError("");
  }

  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed text-neutral-400">
        Les huit propositions sont cochées par défaut. Décochez celles que vous n&apos;utilisez pas.
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PAYMENT_METHOD_PRESETS.map((method) => {
          const checked = value.some((item) => item.toLowerCase() === method.toLowerCase());
          return (
            <label key={method} className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${checked ? "border-amber-500/40 bg-amber-500/10 text-amber-300" : "border-neutral-700 bg-neutral-900/60 text-neutral-300"}`}>
              <input type="checkbox" checked={checked} onChange={() => toggle(method)} className="h-4 w-4 accent-amber-500" />
              <span className="min-w-0 break-words">{method}</span>
            </label>
          );
        })}
      </div>
      {customMethods.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-neutral-400">Modes personnalisés ({customMethods.length}/10)</p>
          <div className="flex flex-wrap gap-2">
            {customMethods.map((method) => (
              <button key={method} type="button" onClick={() => toggle(method)}
                className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300 hover:border-red-500/40 hover:text-red-300"
                aria-label={`Retirer ${method}`}>
                {method} <span aria-hidden="true" className="ml-1">×</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <input type="text" value={newMethod} maxLength={40}
          disabled={customMethods.length >= MAX_CUSTOM_PAYMENT_METHODS}
          onChange={(e) => { setNewMethod(e.target.value); setError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Ajouter un mode de paiement"
          className="min-w-0 flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-base text-white outline-none focus:border-amber-500 disabled:opacity-50" />
        <button type="button" onClick={add} disabled={customMethods.length >= MAX_CUSTOM_PAYMENT_METHODS || !newMethod.trim()}
          className="rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40">
          Ajouter
        </button>
      </div>
      <p className="text-xs text-neutral-500">Maximum 10 ajouts personnalisés, soit 18 modes au total.</p>
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
    </div>
  );
}

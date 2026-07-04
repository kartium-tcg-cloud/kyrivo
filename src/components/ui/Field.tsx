// Label + input + erreur — reprend le motif déjà en place dans
// login/page.tsx et register/page.tsx (label uppercase neutral-500, erreur rouge)

import type { InputHTMLAttributes, ReactNode } from "react";
import Input from "./Input";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  action?: ReactNode; // ex : lien "Mot de passe oublié ?" à côté du label
}

export default function Field({ label, error, action, id, className, ...inputProps }: FieldProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor={id} className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
          {label}
        </label>
        {action}
      </div>
      <Input id={id} className={className} {...inputProps} />
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}

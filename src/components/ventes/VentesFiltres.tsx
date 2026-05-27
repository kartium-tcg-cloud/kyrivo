import { SaleFiltres } from "@/types/sale";

interface VentesFiltresProps {
  filtres: SaleFiltres;
  onChangeFiltres: (filtres: SaleFiltres) => void;
}

export default function VentesFiltres({
  filtres,
  onChangeFiltres,
}: VentesFiltresProps) {
  const update = (champ: Partial<SaleFiltres>) => {
    onChangeFiltres({ ...filtres, ...champ });
  };

  const inputBase = `
    w-full rounded-lg px-3 py-2 text-sm
    bg-neutral-800/60 text-neutral-200
    border border-neutral-700/50
    placeholder:text-neutral-500
    focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20
    transition-colors duration-200
  `;

  return (
    <div className="rounded-xl border border-neutral-800/60 bg-neutral-800/20 p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>

          <input
            type="text"
            placeholder="Rechercher une vente..."
            value={filtres.recherche}
            onChange={(e) => update({ recherche: e.target.value })}
            className={`${inputBase} pl-9`}
          />
        </div>

        <select
          value={filtres.vatMode}
          onChange={(e) =>
            update({
              vatMode: e.target.value as SaleFiltres["vatMode"],
            })
          }
          className={inputBase}
        >
          <option value="tous">Tous les régimes</option>
          <option value="standard_vat">TVA standard</option>
          <option value="margin_vat">TVA sur marge</option>
        </select>

        <div className="relative">
          <label className="absolute -top-2 left-2.5 px-1 text-[10px] text-neutral-500 bg-neutral-900 rounded">
            Du
          </label>

          <input
            type="date"
            value={filtres.dateDebut}
            onChange={(e) => update({ dateDebut: e.target.value })}
            className={inputBase}
          />
        </div>

        <div className="relative">
          <label className="absolute -top-2 left-2.5 px-1 text-[10px] text-neutral-500 bg-neutral-900 rounded">
            Au
          </label>

          <input
            type="date"
            value={filtres.dateFin}
            onChange={(e) => update({ dateFin: e.target.value })}
            className={inputBase}
          />
        </div>
      </div>
    </div>
  );
}
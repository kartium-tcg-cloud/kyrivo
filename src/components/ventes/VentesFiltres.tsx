import { SaleFiltres } from "@/types/sale";

interface VentesFiltresProps {
  filtres: SaleFiltres;
  onChangeFiltres: (filtres: SaleFiltres) => void;
  onExporter?: () => void;
  exportDisabled?: boolean;
}

export default function VentesFiltres({
  filtres,
  onChangeFiltres,
  onExporter,
  exportDisabled,
}: VentesFiltresProps) {
  const update = (champ: Partial<SaleFiltres>) => {
    onChangeFiltres({ ...filtres, ...champ });
  };

  const inputBase = `
    w-full rounded-lg px-3 py-1.5 text-sm
    bg-zinc-900/60 text-zinc-200
    border border-zinc-800
    placeholder:text-zinc-500
    focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20
    transition-colors duration-200
  `;

  return (
    <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 shadow-sm shadow-black/20 p-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center">
        <div className="relative flex-1 lg:min-w-[180px]">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none"
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
          className={`${inputBase} lg:w-44`}
        >
          <option value="tous">Tous les régimes</option>
          <option value="standard_vat">TVA standard</option>
          <option value="margin_vat">TVA sur marge</option>
        </select>

        <div className="flex gap-2">
          <div className="relative flex-1 lg:w-36 lg:flex-none">
            <label className="absolute -top-2 left-2.5 px-1 text-[10px] text-zinc-500 bg-zinc-950 rounded">
              Du
            </label>

            <input
              type="date"
              value={filtres.dateDebut}
              onChange={(e) => update({ dateDebut: e.target.value })}
              className={inputBase}
            />
          </div>

          <div className="relative flex-1 lg:w-36 lg:flex-none">
            <label className="absolute -top-2 left-2.5 px-1 text-[10px] text-zinc-500 bg-zinc-950 rounded">
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

        {onExporter && (
          <button
            type="button"
            onClick={onExporter}
            disabled={exportDisabled}
            className="
              inline-flex items-center justify-center gap-2 rounded-lg border border-amber-500/30
              bg-amber-500/10 px-4 py-1.5 lg:ml-auto
              text-sm font-semibold text-amber-400 whitespace-nowrap
              transition-all duration-200
              hover:bg-amber-500/15 hover:border-amber-500/40
              disabled:cursor-not-allowed disabled:opacity-40
            "
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Exporter en Excel
          </button>
        )}
      </div>
    </div>
  );
}
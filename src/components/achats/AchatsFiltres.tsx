// Barre de filtres pour la liste des achats
// Recherche textuelle + filtre type + filtre dates

import { AchatFiltres } from "@/types/achat";

interface AchatsFiltresProps {
  filtres: AchatFiltres;
  onChangeFiltres: (filtres: AchatFiltres) => void;
  onExporter?: () => void;
  exportDisabled?: boolean;
}

export default function AchatsFiltres({
  filtres,
  onChangeFiltres,
  onExporter,
  exportDisabled,
}: AchatsFiltresProps) {
  /** Met à jour un seul champ sans écraser les autres */
  const update = (champ: Partial<AchatFiltres>) => {
    onChangeFiltres({ ...filtres, ...champ });
  };

  // Classes partagées pour tous les inputs
  const inputBase = `
    w-full rounded-lg px-3 py-1.5 text-sm
    bg-neutral-900/60 text-neutral-200
    border border-neutral-800
    placeholder:text-neutral-500
    focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20
    transition-colors duration-200
  `;

  return (
    <div className="rounded-xl border border-neutral-800/60 bg-neutral-900/40 shadow-sm shadow-black/20 p-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center">
        {/* Recherche textuelle */}
        <div className="relative flex-1 lg:min-w-[180px]">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher..."
            value={filtres.recherche}
            onChange={(e) => update({ recherche: e.target.value })}
            className={`${inputBase} pl-9`}
          />
        </div>

        {/* Filtre par type */}
        <select
          value={filtres.type}
          onChange={(e) => update({ type: e.target.value as AchatFiltres["type"] })}
          className={`${inputBase} lg:w-44`}
        >
          <option value="tous">Tous les types</option>
          <option value="pro">Professionnel</option>
          <option value="particulier">Particulier</option>
        </select>

        <div className="flex gap-2">
          {/* Date début */}
          <div className="relative flex-1 lg:w-36 lg:flex-none">
            <label className="absolute -top-2 left-2.5 px-1 text-[10px] text-neutral-500 bg-neutral-950 rounded">
              Du
            </label>
            <input
              type="date"
              value={filtres.dateDebut}
              onChange={(e) => update({ dateDebut: e.target.value })}
              className={inputBase}
            />
          </div>

          {/* Date fin */}
          <div className="relative flex-1 lg:w-36 lg:flex-none">
            <label className="absolute -top-2 left-2.5 px-1 text-[10px] text-neutral-500 bg-neutral-950 rounded">
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
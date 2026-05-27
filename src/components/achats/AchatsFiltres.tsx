// Barre de filtres pour la liste des achats
// Recherche textuelle + filtre type + filtre dates

import { AchatFiltres } from "@/types/achat";

interface AchatsFiltresProps {
  filtres: AchatFiltres;
  onChangeFiltres: (filtres: AchatFiltres) => void;
}

export default function AchatsFiltres({
  filtres,
  onChangeFiltres,
}: AchatsFiltresProps) {
  /** Met à jour un seul champ sans écraser les autres */
  const update = (champ: Partial<AchatFiltres>) => {
    onChangeFiltres({ ...filtres, ...champ });
  };

  // Classes partagées pour tous les inputs
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
        {/* Recherche textuelle */}
        <div className="relative">
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
          className={inputBase}
        >
          <option value="tous">Tous les types</option>
          <option value="pro">Professionnel</option>
          <option value="particulier">Particulier</option>
        </select>

        {/* Date début */}
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

        {/* Date fin */}
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
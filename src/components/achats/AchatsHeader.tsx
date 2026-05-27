// Header de la page Achats
// Titre, compteur, total et bouton d'ajout
// Le bouton déclenche onAjouter (ouvre la modal dans la page parente)

interface AchatsHeaderProps {
  totalAchats: number;
  totalMontant: number;
  onAjouter: () => void;
}

export default function AchatsHeader({
  totalAchats,
  totalMontant,
  onAjouter,
}: AchatsHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      {/* Titre + stats */}
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">
          Achats
        </h1>
        <div className="mt-2 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center h-6 min-w-[1.5rem] rounded-md bg-neutral-800 px-2 text-xs font-medium text-neutral-300">
              {totalAchats}
            </span>
            <span className="text-sm text-neutral-500">
              opération{totalAchats > 1 ? "s" : ""}
            </span>
          </div>
          <span className="text-neutral-700">·</span>
          <span className="text-sm text-neutral-400">
            Total{" "}
            <span className="text-amber-400 font-semibold">
              {totalMontant.toLocaleString("fr-BE", {
                style: "currency",
                currency: "EUR",
              })}
            </span>
          </span>
        </div>
      </div>

      {/* Bouton ajouter — déclenche la modal */}
      <button
        onClick={onAjouter}
        className="
          inline-flex items-center gap-2
          rounded-lg px-4 py-2
          bg-amber-500 text-neutral-950
          text-sm font-semibold
          transition-all duration-200
          hover:bg-amber-400
          active:scale-[0.97]
          shadow-lg shadow-amber-500/10
        "
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Ajouter un achat
      </button>
    </div>
  );
}
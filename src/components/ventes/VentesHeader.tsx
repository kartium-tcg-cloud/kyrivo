interface VentesHeaderProps {
  totalVentes: number;
  totalMontant: number;
  onAjouter: () => void;
}

export default function VentesHeader({
  totalVentes,
  totalMontant,
  onAjouter,
}: VentesHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">
          Ventes
        </h1>

        <div className="mt-2 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center h-6 min-w-[1.5rem] rounded-md bg-zinc-800/70 border border-zinc-700/40 px-2 text-xs font-medium text-zinc-300">
              {totalVentes}
            </span>

            <span className="text-sm text-zinc-500">
              vente{totalVentes > 1 ? "s" : ""}
            </span>
          </div>

          <span className="text-zinc-700">·</span>

          <span className="text-sm text-zinc-400">
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

      <div className="flex items-center gap-2">
        <button
          disabled
          title="Bientôt disponible"
          className="
            inline-flex items-center gap-2
            rounded-lg px-4 py-2
            border border-zinc-800 bg-zinc-900/40 text-zinc-600
            text-sm font-semibold
            cursor-not-allowed opacity-50
          "
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.8}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
            />
          </svg>
          Importer depuis Vinted
        </button>

        <button
          onClick={onAjouter}
          className="
            inline-flex items-center gap-2
            rounded-lg px-4 py-2
            bg-amber-500 text-zinc-950
            text-sm font-semibold
            transition-all duration-200
            hover:bg-amber-400 hover:-translate-y-0.5 hover:shadow-amber-500/20
            active:scale-[0.97] active:translate-y-0
            shadow-lg shadow-amber-500/10
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40
          "
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Ajouter une vente
        </button>
      </div>
    </div>
  );
}
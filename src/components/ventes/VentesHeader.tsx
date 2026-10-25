import VintedImportCTA from "@/components/vinted/VintedImportCTA";

interface VentesHeaderProps {
  totalVentes: number;
  totalMontant: number;
  totalTVA?: number;
  totalMarge?: number;
  onAjouter: () => void;
}

export default function VentesHeader({
  totalVentes,
  totalMontant,
  totalTVA,
  totalMarge,
  onAjouter,
}: VentesHeaderProps) {
  return (
    <div className="ky-page-heading flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">
          Ventes
        </h1>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center h-6 min-w-[1.5rem] rounded-md bg-neutral-800/70 border border-neutral-700/40 px-2 text-xs font-medium text-neutral-300">
              {totalVentes}
            </span>

            <span className="text-sm text-neutral-500">
              vente{totalVentes > 1 ? "s" : ""}
            </span>
          </div>

          <span className="text-neutral-700">·</span>

          <span className="text-sm text-neutral-400">
            Total TTC{" "}
            <span className="text-amber-400 font-semibold">
              {totalMontant.toLocaleString("fr-BE", {
                style: "currency",
                currency: "EUR",
              })}
            </span>
          </span>

          {typeof totalTVA === "number" && totalTVA > 0 && (
            <>
              <span className="text-neutral-700">·</span>
              <span className="text-sm text-neutral-400">
                TVA collectée{" "}
                <span className="text-cyan-400 font-semibold">
                  {totalTVA.toLocaleString("fr-BE", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </span>
              </span>
            </>
          )}

          {typeof totalMarge === "number" && totalMarge !== 0 && (
            <>
              <span className="text-neutral-700">·</span>
              <span className="text-sm text-neutral-400">
                Marge{" "}
                <span className="text-emerald-400 font-semibold">
                  {totalMarge.toLocaleString("fr-BE", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </span>
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-stretch lg:w-auto">
        <VintedImportCTA />
        <button
          onClick={onAjouter}
          className="
            ky-button-primary inline-flex min-h-[60px] w-full items-center justify-center gap-2 sm:w-auto
            rounded-lg px-4 py-2
            bg-amber-500 text-neutral-950
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
"use client";

import { useState } from "react";
import Link from "next/link";
import { Sale, SALE_VAT_MODE_CONFIG } from "@/types/sale";

interface VentesTableauProps {
  ventes: Sale[];
  onModifier: (vente: Sale) => void;
  onSupprimer: (id: string) => void;
}

function formatEuro(montant: number): string {
  return montant.toLocaleString("fr-BE", {
    style: "currency",
    currency: "EUR",
  });
}

function formatDate(dateISO: string): string {
  return new Date(dateISO).toLocaleDateString("fr-BE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function VentesTableau({
  ventes,
  onModifier,
  onSupprimer,
}: VentesTableauProps) {
  const [ligneOuverte, setLigneOuverte] = useState<string | null>(null);

  const toggleDetails = (id: string) => {
    setLigneOuverte(ligneOuverte === id ? null : id);
  };

  if (ventes.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 shadow-sm shadow-black/20 p-16 text-center">
        <svg
          className="mx-auto h-10 w-10 text-zinc-700 mb-3"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008Zm0 3h.008v.008H8.25v-.008Zm0 3h.008v.008H8.25v-.008Zm3-6h.008v.008H11.25v-.008Zm0 3h.008v.008H11.25v-.008Zm0 3h.008v.008H11.25v-.008Zm3-6h.008v.008H14.25v-.008Zm0 3h.008v.008H14.25v-.008ZM6.75 3h10.5A2.25 2.25 0 0 1 19.5 5.25v13.5A2.25 2.25 0 0 1 17.25 21H6.75A2.25 2.25 0 0 1 4.5 18.75V5.25A2.25 2.25 0 0 1 6.75 3Z"
          />
        </svg>

        <p className="text-zinc-500 text-sm">
          Aucune vente ne correspond à vos filtres.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 shadow-sm shadow-black/20 overflow-hidden">
      <div className="relative">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-950/40">
              <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Date
              </th>
              <th className="hidden sm:table-cell px-4 py-3.5 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                N°
              </th>
              <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Client
              </th>
              <th className="hidden sm:table-cell px-4 py-3.5 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Régime
              </th>
              <th className="px-4 py-3.5 text-right text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                HT
              </th>
              <th className="px-4 py-3.5 text-right text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                TVA
              </th>
              <th className="px-4 py-3.5 text-right text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                TTC
              </th>
              <th className="px-4 py-3.5 text-right text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Marge
              </th>
              <th className="px-4 py-3.5 text-center text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-800/60">
            {ventes.map((vente) => {
              const config = SALE_VAT_MODE_CONFIG[vente.vatMode];

              return [
                <tr
                  key={vente.id}
                  className={`
                    group cursor-pointer
                    transition-colors duration-200 ease-out
                    hover:bg-zinc-800/40
                    ${ligneOuverte === vente.id ? "bg-amber-500/[0.06]" : ""}
                  `}
                  onClick={() => toggleDetails(vente.id)}
                >
                  <td
                    className={`px-4 py-3.5 text-zinc-400 whitespace-nowrap transition-shadow duration-200 ${
                      ligneOuverte === vente.id
                        ? "shadow-[inset_3px_0_0_0_rgba(251,191,36,0.7)]"
                        : ""
                    }`}
                  >
                    {formatDate(vente.date)}
                  </td>

                  <td className="hidden sm:table-cell px-4 py-3.5 font-mono text-xs text-zinc-500">
                    {vente.numInterne}
                  </td>

                  <td className="px-4 py-3.5 font-medium max-w-[220px] truncate">
                    {vente.contactId ? (
                      <Link
                        href={`/contacts/${vente.contactId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-white underline decoration-amber-400/30 underline-offset-2 hover:text-amber-400 hover:decoration-amber-400/60 transition-colors"
                      >
                        {vente.customerName}
                      </Link>
                    ) : (
                      <span className="text-white">{vente.customerName}</span>
                    )}
                  </td>

                  <td className="hidden sm:table-cell px-4 py-3.5">
                    <span
                      className={`
                        inline-flex items-center rounded-full border
                        px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide
                        ${config.bg}
                        ${config.text}
                        ${config.border}
                      `}
                    >
                      {config.shortLabel}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 text-right text-zinc-300 whitespace-nowrap tabular-nums">
                    {formatEuro(vente.subtotalHT)}
                  </td>

                  <td className="px-4 py-3.5 text-right whitespace-nowrap tabular-nums">
                    <span
                      className={
                        vente.vatAmount > 0
                          ? "text-cyan-400"
                          : "text-zinc-700"
                      }
                    >
                      {vente.vatAmount > 0 ? formatEuro(vente.vatAmount) : "—"}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 text-right text-white font-semibold whitespace-nowrap tabular-nums">
                    {formatEuro(vente.totalTTC)}
                  </td>

                  <td className="px-4 py-3.5 text-right whitespace-nowrap tabular-nums">
                    <span
                      className={
                        vente.marginAmount !== 0
                          ? vente.marginAmount > 0
                            ? "text-emerald-400 font-semibold"
                            : "text-red-400 font-semibold"
                          : "text-zinc-700"
                      }
                    >
                      {vente.marginAmount !== 0
                        ? formatEuro(vente.marginAmount)
                        : "—"}
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-center gap-0.5 opacity-100 md:opacity-0 md:translate-x-1 md:group-hover:opacity-100 md:group-hover:translate-x-0 focus-within:opacity-100 focus-within:translate-x-0 transition-all duration-200 ease-out">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDetails(vente.id);
                        }}
                        className="rounded-md p-2 hover:bg-zinc-800 hover:text-amber-400 text-zinc-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
                        title="Détails"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0Z"
                          />
                        </svg>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onModifier(vente);
                        }}
                        className="rounded-md p-2 hover:bg-zinc-800 hover:text-blue-400 text-zinc-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                        title="Modifier"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m16.862 4.487 1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                          />
                        </svg>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();

                          const confirmed = window.confirm(
                            "Supprimer cette vente ? Le stock lié sera restauré."
                          );

                          if (!confirmed) return;

                          onSupprimer(vente.id);
                        }}
                        className="rounded-md p-2 hover:bg-red-500/10 hover:text-red-400 text-zinc-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
                        title="Supprimer"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>,

                ligneOuverte === vente.id ? (
                  <tr key={`${vente.id}-details`}>
                    <td
                      colSpan={9}
                      className="px-4 py-5 bg-zinc-950/50 border-b border-zinc-800/60"
                    >
                      <div className="animate-detail-reveal grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                        <div className="sm:hidden rounded-lg border border-zinc-800/60 bg-zinc-900/40 p-3">
                          <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">
                            N° interne
                          </span>
                          <p className="text-zinc-200 mt-1 font-mono text-xs">
                            {vente.numInterne}
                          </p>
                        </div>

                        <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/40 p-3">
                          <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">
                            Client
                          </span>
                          <p className="text-zinc-200 mt-1">
                            {vente.contactId ? (
                              <Link
                                href={`/contacts/${vente.contactId}`}
                                className="text-zinc-200 underline decoration-amber-400/30 underline-offset-2 hover:text-amber-400 hover:decoration-amber-400/60 transition-colors"
                              >
                                {vente.customerName}
                              </Link>
                            ) : (
                              vente.customerName
                            )}
                          </p>
                        </div>

                        <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/40 p-3">
                          <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">
                            Paiement
                          </span>
                          <p className="text-zinc-200 mt-1">
                            {vente.paymentMethod}
                          </p>
                        </div>

                        <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/40 p-3">
                          <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">
                            Régime TVA
                          </span>
                          <p className="text-zinc-200 mt-1">
                            {SALE_VAT_MODE_CONFIG[vente.vatMode].label}
                          </p>
                        </div>

                        <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/40 p-3">
                          <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">
                            Lignes
                          </span>
                          <p className="text-zinc-200 mt-1">
                            {vente.lines?.length || 0}
                          </p>
                        </div>

                        {vente.notes && (
                          <div className="sm:col-span-2 lg:col-span-4 rounded-lg border border-zinc-800/60 bg-zinc-900/40 p-3">
                            <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">
                              Notes
                            </span>
                            <p className="text-zinc-400 mt-1 italic text-[13px]">
                              {vente.notes}
                            </p>
                          </div>
                        )}

                        {vente.lines && vente.lines.length > 0 && (
                          <div className="sm:col-span-2 lg:col-span-4 mt-1 pt-4 border-t border-zinc-800/60">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                                Lignes de vente
                                <span className="inline-flex items-center justify-center h-5 min-w-[1.25rem] rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-bold px-1.5">
                                  {vente.lines.length}
                                </span>
                              </span>
                            </div>

                            <div className="space-y-2">
                              {vente.lines.map((line) => (
                                <div
                                  key={line.id}
                                  className="
                                    flex flex-col gap-1.5
                                    sm:grid sm:grid-cols-[120px_1fr_70px_110px_110px] sm:items-center sm:gap-3
                                    rounded-lg bg-zinc-950/60 border border-zinc-800/60
                                    px-3 py-2.5 text-sm
                                  "
                                >
                                  {line.purchaseItemId && line.itemReference ? (
                                    <Link
                                      href={`/items/${line.purchaseItemId}`}
                                      className="inline-flex items-center w-fit rounded-md border border-amber-500/20 bg-amber-500/5 px-1.5 py-0.5 font-mono text-[11px] text-amber-400/90 hover:text-amber-300 hover:border-amber-500/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
                                    >
                                      {line.itemReference}
                                    </Link>
                                  ) : (
                                    <span className="font-mono text-xs text-zinc-600">
                                      {line.itemReference || "—"}
                                    </span>
                                  )}

                                  <span className="text-zinc-200 sm:truncate">
                                    {line.itemName}
                                  </span>

                                  <span className="text-zinc-400 tabular-nums sm:text-right">
                                    ×{line.quantity}
                                  </span>

                                  <span className="text-white font-semibold tabular-nums sm:text-right">
                                    {formatEuro(line.totalPrice)}
                                  </span>

                                  <span className="text-zinc-500 tabular-nums sm:text-right">
                                    TVA {line.vatRate}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : null,
              ];
            })}
          </tbody>
        </table>
        </div>

        {/* Indicateur discret de scroll horizontal sur petits écrans */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-zinc-950/80 to-transparent lg:hidden" />
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";
import Link from "next/link";
import { Achat } from "@/types/achat";
import { getPurchaseDocumentSignedUrl } from "@/lib/purchases";
import ItemStatusBadge from "@/components/items/ItemStatusBadge";

interface AchatsTableauProps {
  achats: Achat[];
  onModifier: (achat: Achat) => void;
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

export default function AchatsTableau({
  achats,
  onModifier,
  onSupprimer,
}: AchatsTableauProps) {
  const [ligneOuverte, setLigneOuverte] = useState<string | null>(null);

  const toggleDetails = (id: string) => {
    setLigneOuverte(ligneOuverte === id ? null : id);
  };

  if (achats.length === 0) {
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
            d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
          />
        </svg>

        <p className="text-zinc-500 text-sm">
          Aucun achat ne correspond à vos filtres.
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
              <th className="px-2 sm:px-4 py-3.5 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Date
              </th>
              <th className="hidden sm:table-cell px-2 sm:px-4 py-3.5 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                N°
              </th>
              <th className="px-2 sm:px-4 py-3.5 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Fournisseur
              </th>
              <th className="px-2 sm:px-4 py-3.5 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Produit
              </th>
              <th className="hidden sm:table-cell px-2 sm:px-4 py-3.5 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Type
              </th>
              <th className="px-2 sm:px-4 py-3.5 text-right text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                HT
              </th>
              <th className="px-2 sm:px-4 py-3.5 text-right text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                TVA
              </th>
              <th className="px-2 sm:px-4 py-3.5 text-right text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                TTC
              </th>
              <th className="px-2 sm:px-4 py-3.5 text-center text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-800/60">
            {achats.map((achat) => [
              <tr
                key={achat.id}
                className={`
                  group cursor-pointer
                  transition-colors duration-200 ease-out
                  hover:bg-zinc-800/40
                  ${ligneOuverte === achat.id ? "bg-amber-500/[0.06]" : ""}
                `}
                onClick={() => toggleDetails(achat.id)}
              >
                <td
                  className={`px-2 sm:px-4 py-3.5 text-zinc-400 whitespace-nowrap transition-shadow duration-200 ${
                    ligneOuverte === achat.id
                      ? "shadow-[inset_3px_0_0_0_rgba(251,191,36,0.7)]"
                      : ""
                  }`}
                >
                  {formatDate(achat.date)}
                </td>

                <td className="hidden sm:table-cell px-2 sm:px-4 py-3.5 font-mono text-xs text-zinc-500">
                  {achat.numInterne}
                </td>

                <td className="px-2 sm:px-4 py-3.5 font-medium max-w-[110px] sm:max-w-[200px] truncate">
                  {achat.supplierContactId ? (
                    <Link
                      href={`/contacts/${achat.supplierContactId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-white underline decoration-amber-400/30 underline-offset-2 hover:text-amber-400 hover:decoration-amber-400/60 transition-colors"
                    >
                      {achat.fournisseur}
                    </Link>
                  ) : (
                    <span className="text-white">{achat.fournisseur}</span>
                  )}
                </td>

                <td className="px-2 sm:px-4 py-3.5 text-zinc-400 max-w-[100px] sm:max-w-[180px] truncate">
                  {achat.produit}
                </td>

                <td className="hidden sm:table-cell px-2 sm:px-4 py-3.5">
                  <span
                    className={`
                      inline-flex items-center rounded-full border
                      px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide
                      ${
                        achat.type === "pro"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/25"
                          : "bg-zinc-700/30 text-zinc-400 border-zinc-600/40"
                      }
                    `}
                  >
                    {achat.type === "pro" ? "PRO" : "Particulier"}
                  </span>
                </td>

                <td className="px-2 sm:px-4 py-3.5 text-right text-zinc-300 whitespace-nowrap tabular-nums">
                  {formatEuro(achat.prixHT)}
                </td>

                <td className="px-2 sm:px-4 py-3.5 text-right whitespace-nowrap tabular-nums">
                  <span
                    className={
                      achat.prixTVA > 0 ? "text-cyan-400" : "text-zinc-700"
                    }
                  >
                    {achat.prixTVA > 0 ? formatEuro(achat.prixTVA) : "—"}
                  </span>
                </td>

                <td className="px-2 sm:px-4 py-3.5 text-right text-white font-semibold whitespace-nowrap tabular-nums">
                  {formatEuro(achat.prixTTC)}
                </td>

                <td className="px-2 sm:px-4 py-3.5">
                  <div className="flex items-center justify-center gap-0.5 opacity-100 md:opacity-0 md:translate-x-1 md:group-hover:opacity-100 md:group-hover:translate-x-0 focus-within:opacity-100 focus-within:translate-x-0 transition-all duration-200 ease-out">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDetails(achat.id);
                      }}
                      className="rounded-md p-1.5 sm:p-2 hover:bg-zinc-800 hover:text-amber-400 text-zinc-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
                      title="Détails"
                    >
                      <svg
                        className="h-3.5 w-3.5 sm:h-4 sm:w-4"
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
                        onModifier(achat);
                      }}
                      className="rounded-md p-1.5 sm:p-2 hover:bg-zinc-800 hover:text-blue-400 text-zinc-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                      title="Modifier"
                    >
                      <svg
                        className="h-3.5 w-3.5 sm:h-4 sm:w-4"
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
                        onSupprimer(achat.id);
                      }}
                      className="rounded-md p-1.5 sm:p-2 hover:bg-red-500/10 hover:text-red-400 text-zinc-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
                      title="Supprimer"
                    >
                      <svg
                        className="h-3.5 w-3.5 sm:h-4 sm:w-4"
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

              ligneOuverte === achat.id ? (
                <tr key={`${achat.id}-details`}>
                  <td
                    colSpan={9}
                    className="px-4 py-5 bg-zinc-950/50 border-b border-zinc-800/60"
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm animate-detail-reveal">
                      <div className="sm:hidden rounded-lg border border-zinc-800/60 bg-zinc-900/40 p-3">
                        <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">
                          N° interne
                        </span>
                        <p className="text-zinc-200 mt-1 font-mono text-xs">
                          {achat.numInterne}
                        </p>
                      </div>

                      <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/40 p-3">
                        <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">
                          Paiement
                        </span>
                        <p className="text-zinc-200 mt-1">{achat.paiement}</p>
                      </div>

                      <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/40 p-3">
                        <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">
                          Réf. facture
                        </span>
                        <p className="text-zinc-200 mt-1 font-mono text-xs">
                          {achat.numFacture || "—"}
                        </p>
                      </div>

                      <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/40 p-3">
                        <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">
                          Document
                        </span>
                        {achat.documentUrl ? (
                          <button
                            onClick={async () => {
                              const signedUrl =
                                await getPurchaseDocumentSignedUrl(
                                  achat.documentUrl!
                                );
                              window.open(signedUrl, "_blank");
                            }}
                            className="mt-1 flex w-fit items-center gap-1.5 text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 rounded"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6 12.75-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                            Ouvrir / télécharger
                          </button>
                        ) : (
                          <p className="text-zinc-200 mt-1">—</p>
                        )}
                      </div>

                      <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/40 p-3">
                        <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">
                          Régime TVA
                        </span>
                        <p className="text-zinc-200 mt-1">
                          {achat.type === "pro"
                            ? "TVA déductible"
                            : "Pas de TVA (particulier)"}
                        </p>
                      </div>

                      {achat.commentaire && (
                        <div className="sm:col-span-2 lg:col-span-4 rounded-lg border border-zinc-800/60 bg-zinc-900/40 p-3">
                          <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">
                            Commentaire
                          </span>
                          <p className="text-zinc-400 mt-1 italic text-[13px]">
                            {achat.commentaire}
                          </p>
                        </div>
                      )}

                      {achat.articles && achat.articles.length > 0 && (
                        <div className="sm:col-span-2 lg:col-span-4 mt-1 pt-4 border-t border-zinc-800/60">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                              Articles détaillés
                              <span className="inline-flex items-center justify-center h-5 min-w-[1.25rem] rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-bold px-1.5">
                                {achat.articles.length}
                              </span>
                            </span>
                          </div>

                          <div className="space-y-2">
                            {achat.articles.map((article) => (
                              <Link
                                key={article.id}
                                href={`/items/${article.id}`}
                                className="
                                  flex flex-col gap-1.5
                                  sm:grid sm:grid-cols-[120px_1fr_90px_100px_100px] sm:items-center sm:gap-3
                                  rounded-lg bg-zinc-950/60 border border-zinc-800/60
                                  px-3 py-2.5 text-sm
                                  hover:border-amber-500/30 hover:bg-zinc-900/80
                                  transition-all duration-200 ease-out
                                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40
                                  group/article
                                "
                              >
                                <span className="inline-flex items-center w-fit rounded-md border border-amber-500/20 bg-amber-500/5 px-1.5 py-0.5 font-mono text-[11px] text-amber-400/90 group-hover/article:text-amber-300 group-hover/article:border-amber-500/30 transition-colors">
                                  {article.reference}
                                </span>

                                <span className="text-zinc-200 sm:truncate">
                                  {article.nom}
                                </span>

                                <span className="text-zinc-500 text-xs sm:text-right">
                                  Stock {article.stockRestant}/{article.quantite}
                                </span>

                                <ItemStatusBadge status={article.statut} />

                                <span className="sm:text-right text-white font-semibold tabular-nums sm:min-w-[80px]">
                                  {formatEuro(article.coutHT)}
                                </span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : null,
            ])}
          </tbody>
        </table>
        </div>

        {/* Indicateur discret de scroll horizontal sur petits écrans */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-zinc-950/80 to-transparent lg:hidden" />
      </div>
    </div>
  );
}
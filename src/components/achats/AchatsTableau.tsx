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
      <div className="rounded-xl border border-neutral-800/60 bg-neutral-800/20 p-16 text-center">
        <svg
          className="mx-auto h-10 w-10 text-neutral-700 mb-3"
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

        <p className="text-neutral-500 text-sm">
          Aucun achat ne correspond à vos filtres.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-800/60 bg-neutral-800/20 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-700/50">
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                N°
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                Fournisseur
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                Produit
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                HT
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                TVA
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                TTC
              </th>
              <th className="px-4 py-3 text-center text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-800/40">
            {achats.map((achat, index) => [
              <tr
                key={achat.id}
                className={`
                  group cursor-pointer
                  transition-colors duration-150
                  hover:bg-amber-500/[0.03]
                  ${index % 2 === 0 ? "bg-transparent" : "bg-neutral-800/10"}
                  ${ligneOuverte === achat.id ? "bg-amber-500/[0.05]" : ""}
                `}
                onClick={() => toggleDetails(achat.id)}
              >
                <td className="px-4 py-3 text-neutral-400 whitespace-nowrap">
                  {formatDate(achat.date)}
                </td>

                <td className="px-4 py-3 font-mono text-xs text-neutral-600">
                  {achat.numInterne}
                </td>

                <td className="px-4 py-3 text-white font-medium max-w-[200px] truncate">
                  {achat.fournisseur}
                </td>

                <td className="px-4 py-3 text-neutral-400 max-w-[180px] truncate">
                  {achat.produit}
                </td>

                <td className="px-4 py-3">
                  <span
                    className={`
                      inline-flex items-center rounded-full
                      px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide
                      ${
                        achat.type === "pro"
                          ? "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25"
                          : "bg-neutral-700/40 text-neutral-400 ring-1 ring-neutral-600/40"
                      }
                    `}
                  >
                    {achat.type === "pro" ? "PRO" : "Particulier"}
                  </span>
                </td>

                <td className="px-4 py-3 text-right text-neutral-300 whitespace-nowrap tabular-nums">
                  {formatEuro(achat.prixHT)}
                </td>

                <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums">
                  <span
                    className={
                      achat.prixTVA > 0 ? "text-amber-400" : "text-neutral-700"
                    }
                  >
                    {achat.prixTVA > 0 ? formatEuro(achat.prixTVA) : "—"}
                  </span>
                </td>

                <td className="px-4 py-3 text-right text-white font-semibold whitespace-nowrap tabular-nums">
                  {formatEuro(achat.prixTTC)}
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDetails(achat.id);
                      }}
                      className="rounded-md p-1.5 hover:bg-neutral-700/50 hover:text-amber-400 text-neutral-500 transition-colors"
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
                        onModifier(achat);
                      }}
                      className="rounded-md p-1.5 hover:bg-neutral-700/50 hover:text-blue-400 text-neutral-500 transition-colors"
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
                        onSupprimer(achat.id);
                      }}
                      className="rounded-md p-1.5 hover:bg-red-500/10 hover:text-red-400 text-neutral-500 transition-colors"
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

              ligneOuverte === achat.id ? (
                <tr key={`${achat.id}-details`}>
                  <td
                    colSpan={9}
                    className="px-4 py-4 bg-neutral-800/30 border-b border-amber-500/10"
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                      <div>
                        <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium">
                          Paiement
                        </span>
                        <p className="text-neutral-200 mt-1">{achat.paiement}</p>
                      </div>

                      <div>
                        <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium">
                          Réf. facture
                        </span>
                        <p className="text-neutral-200 mt-1 font-mono text-xs">
                          {achat.numFacture || "—"}
                        </p>
                      </div>

                      <div>
                        <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium">
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
                            className="block mt-1 text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors"
                          >
                            Ouvrir / télécharger
                          </button>
                        ) : (
                          <p className="text-neutral-200 mt-1">—</p>
                        )}
                      </div>

                      <div>
                        <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium">
                          Régime TVA
                        </span>
                        <p className="text-neutral-200 mt-1">
                          {achat.type === "pro"
                            ? "TVA déductible"
                            : "Pas de TVA (particulier)"}
                        </p>
                      </div>

                      {achat.commentaire && (
                        <div className="sm:col-span-2 lg:col-span-4">
                          <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium">
                            Commentaire
                          </span>
                          <p className="text-amber-200/70 mt-1 italic text-[13px]">
                            {achat.commentaire}
                          </p>
                        </div>
                      )}

                      {achat.articles && achat.articles.length > 0 && (
                        <div className="sm:col-span-2 lg:col-span-4 mt-4 pt-4 border-t border-neutral-700/40">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium flex items-center gap-2">
                              Articles détaillés
                              <span className="inline-flex items-center justify-center h-5 min-w-[1.25rem] rounded-full bg-neutral-700/50 text-neutral-300 text-[10px] font-bold px-1.5">
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
                                  grid grid-cols-[120px_1fr_90px_100px_100px] items-center gap-3
                                  rounded-lg bg-neutral-900/60 border border-neutral-700/40
                                  px-3 py-2.5 text-sm
                                  hover:border-amber-500/30 hover:bg-neutral-900/80
                                  transition-all duration-150
                                  group/article
                                "
                              >
                                <span className="font-mono text-xs text-amber-400/80 group-hover/article:text-amber-300 transition-colors">
                                  {article.reference}
                                </span>

                                <span className="text-neutral-200 truncate">
                                  {article.nom}
                                </span>

                                <span className="text-neutral-500 text-xs text-right">
                                  Stock {article.stockRestant}/{article.quantite}
                                </span>

                                <ItemStatusBadge status={article.statut} />

                                <span className="text-right text-white font-semibold tabular-nums min-w-[80px]">
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
    </div>
  );
}
/** Historique public des versions Kyrivo. Pas de logique métier ici. */
export const releases = [
  {
    version: "1.1",
    dateISO: "2026-10-17",
    dateLabel: "17 octobre 2026",
    title: "Une interface repensée et un suivi des frais intégré",
    summary:
      "Refonte visuelle de Kyrivo, frais directement intégrés aux achats et ventes, suivi de rentabilité enrichi et fiabilisation du passage de l’essai aux abonnements.",
    sections: [
      {
        id: "evolutions-majeures",
        title: "Évolutions majeures",
        intro: "Les nouveautés qui améliorent directement le travail quotidien.",
        items: [
          {
            title: "Refonte de l’interface et de la navigation",
            description:
              "Nouvelle identité visuelle graphite et ambre, navigation latérale harmonisée, tableau de bord et pages Achats, Ventes, Stock, Contacts, Factures et Préférences plus cohérents. Les tableaux, filtres, boutons et fenêtres de saisie partagent les mêmes règles de présentation, y compris sur les petits écrans.",
          },
          {
            title: "Gestion des frais directement dans les achats et les ventes",
            description:
              "Les formulaires proposent désormais un bloc Frais sans activation dans les préférences. Plusieurs frais peuvent être saisis par opération : transport, commission de plateforme, paiement, emballage, assurance ou autres dépenses. La nature du frais, les montants HT et TTC, la TVA et les éventuels montants déjà inclus peuvent être renseignés. L’enregistrement reste possible sans frais.",
          },
          {
            title: "Suivi de rentabilité après frais",
            description:
              "Les dépenses liées aux opérations sont suivies séparément. Leurs effets sont repris dans les estimations de rentabilité, les vues de suivi et les exports prévus à cet effet. Lorsqu’un coût d’achat manque, Kyrivo le signale plutôt que de présenter une marge nette comme certaine. La saisie d’un frais ne modifie pas automatiquement les montants de facture.",
          },
        ],
      },
      {
        id: "corrections-bugs",
        title: "Corrections de bugs",
        intro: "Les anomalies corrigées dans le fonctionnement des abonnements et des écrans.",
        items: [
          {
            title: "Fin de l’essai gratuit lors de l’activation payante",
            description:
              "Le passage de l’essai de 7 jours à une offre payante n’ajoute plus les jours d’essai restants au mois ou au trimestre acheté. Les dates de début et de fin des droits sont alignées sur la période de facturation communiquée par Stripe.",
          },
          {
            title: "Protection contre la double souscription",
            description:
              "Pour un forfait déjà actif, le bouton de paiement est remplacé par un état « Abonnement actif ». Une vérification serveur bloque également une seconde souscription au même forfait, même si l’utilisateur passe de l’affichage mensuel à trimestriel. La gestion du renouvellement et des paiements s’effectue via l’espace abonnement.",
          },
          {
            title: "Traitement des événements de paiement plus fiable",
            description:
              "Le traitement des événements Stripe a été renforcé pour éviter qu’une notification reçue plusieurs fois prolonge les droits plusieurs fois. Les périodes de quotas mensuels et les dates d’échéance sont suivies distinctement lorsque nécessaire.",
          },
          {
            title: "Accès à l’import Vinted non finalisé",
            description:
              "L’interface d’import Vinted expérimental reste désactivée tant que son fonctionnement n’est pas suffisamment fiable. Le suivi manuel des achats et ventes issus de Vinted reste disponible.",
          },
        ],
      },
      {
        id: "ameliorations-mineures",
        title: "Améliorations mineures",
        intro: "Les finitions qui rendent Kyrivo plus clair et plus agréable.",
        items: [
          {
            title: "Lisibilité des tableaux et des formulaires",
            description:
              "Meilleur contraste des textes, espacement des champs, présentation des filtres, visibilité des actions sur les lignes et affichage plus homogène des fenêtres de saisie.",
          },
          {
            title: "Identité et icônes harmonisées",
            description:
              "Adoption du nouveau symbole carte et flèches dans la navigation, les pages de connexion et les icônes du navigateur, à la place de l’ancien monogramme « K ».",
          },
          {
            title: "Informations publiques actualisées",
            description:
              "La page d’accueil et les éléments de réassurance partagent désormais les mêmes compteurs d’avis communiqués par Kartium TCG : 38 avis Vinted et 8 avis Google.",
          },
        ],
      },
    ],
  },
] as const;

export const latestRelease = releases[0];

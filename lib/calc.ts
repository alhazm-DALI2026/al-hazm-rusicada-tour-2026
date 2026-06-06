import type { CoutInclus, MoteurCout, Offre, RepasType } from '@/types';

// ─── helpers internes ────────────────────────────────────────────────────────

function trouverMontant(
  moteurCouts: MoteurCout[],
  categorie: MoteurCout['categorie'],
): number {
  return moteurCouts.find(c => c.categorie === categorie && c.actif)?.montant ?? 0;
}

function calculerRepas(
  montantRepas: number,
  repasType: RepasType,
  taux: number,
): number {
  if (repasType === 'sans')  return 0;
  if (repasType === 'demi')  return calculerDemiPension(montantRepas, taux);
  return montantRepas; // complet
}

// ─── fonctions exportées ─────────────────────────────────────────────────────

/**
 * Réduction demi-pension : montantRepas × (1 - taux/100)
 */
export function calculerDemiPension(montantRepas: number, taux: number): number {
  return montantRepas * (1 - taux / 100);
}

/**
 * CDR d'une offre : utilise les montants embarqués dans chaque CoutInclus.
 * Applique la réduction demi-pension sur la catégorie "repas".
 * Rétrocompat : les anciens enregistrements avec des IDs string sont ignorés.
 */
export function calculerCoutOffre(offre: Offre, tauxDemiPension = 35): number {
  return (offre.couts_inclus as unknown as (CoutInclus | string)[])
    .reduce<number>((total, item) => {
      if (typeof item === 'string') return total;

      let v: number;
      switch (item.type) {
        case 'par_nuit':     v = item.montant * offre.nombre_nuits; break;
        case 'par_jour':     v = item.montant * offre.nombre_jours; break;
        case 'par_personne': v = item.montant;                      break;
        default:             return total;
      }

      if (item.categorie === 'repas') {
        if (offre.repas_type === 'sans') return total;
        if (offre.repas_type === 'demi') return total + calculerDemiPension(v, tauxDemiPension);
      }

      return total + v;
    }, 0);
}

/**
 * Supplément transport pour une offre (transport_optionnel).
 * Lit le montant depuis couts_inclus embarqués, applique le type de calcul.
 */
export function getTransportSupplement(offre: Offre): number {
  const raw = offre.couts_inclus as unknown as (CoutInclus | string)[]
  const tc  = raw.find((item): item is CoutInclus =>
    typeof item !== 'string' && item.categorie === 'transport'
  )
  if (!tc) return 0
  switch (tc.type) {
    case 'par_nuit': return tc.montant * offre.nombre_nuits
    case 'par_jour': return tc.montant * offre.nombre_jours
    default:         return tc.montant
  }
}

// ─── Grille famille ──────────────────────────────────────────────────────────

export type FamilleGrille = {
  id:           string
  libelle:      string
  categorie:    string
  type_chambre: string | null
  montant:      number
  actif:        boolean
}

export function calculerFamille(
  grille: FamilleGrille[],
  choix: {
    nbAdultes:         number
    nbEnfants:         number
    nbBebes:           number
    nombreNuits:       number
    typeChambreAdulte: 'Single' | 'Double'
    transport:         boolean
    repas:             'sans' | 'demi' | 'complet'
  },
  tauxDemiPension: number,
  tauxMarge: number,
): {
  cdrAdulte: number
  cdrEnfant: number
  cdrBebe:   number
  cdrTotal:  number
  pvTotal:   number
  marge:     number
} {
  const g = (cat: string, chambre?: string) =>
    grille.find(x =>
      x.actif &&
      x.categorie === cat &&
      (!chambre || x.type_chambre === chambre),
    )?.montant ?? 0

  const repasBase = g('repas')
  const repasMontant =
    choix.repas === 'sans' ? 0 :
    choix.repas === 'demi' ? repasBase * (1 - tauxDemiPension / 100) :
    repasBase

  const supplements = grille
    .filter(x => x.actif && x.categorie === 'supplement')
    .reduce((s, x) => s + x.montant, 0)

  const cdrAdulte =
    g('chambre_adulte', choix.typeChambreAdulte) * choix.nombreNuits +
    (choix.transport ? g('transport_adulte') : 0) +
    repasMontant * choix.nombreNuits +
    supplements

  const cdrEnfant =
    g('chambre_enfant', 'Triple') * choix.nombreNuits +
    (choix.transport ? g('transport_enfant') : 0) +
    repasMontant * choix.nombreNuits +
    supplements

  const cdrBebe = choix.transport ? g('transport_bebe') : 0

  const cdrTotal =
    cdrAdulte * choix.nbAdultes +
    cdrEnfant * choix.nbEnfants +
    cdrBebe   * choix.nbBebes

  const pvTotal = Math.round(cdrTotal * (1 + tauxMarge / 100))

  return { cdrAdulte, cdrEnfant, cdrBebe, cdrTotal, pvTotal, marge: pvTotal - cdrTotal }
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * CDR total d'une réservation famille.
 * Chaque type de chambre porte son propre tarif hébergement :
 *   Triple → enfant, Double → adulte double, Single → adulte single.
 */
export function calculerCoutFamille(
  offreAdulte: Offre,
  offreEnfant: Offre,
  moteurCouts: MoteurCout[],
  nbAdultes: number,
  nbEnfants: number,
  avecTransport: boolean,
  repasType: RepasType,
  taux_demi_pension: number,
): number {
  const montantTransport = avecTransport ? trouverMontant(moteurCouts, 'transport') : 0;
  const montantRepas     = trouverMontant(moteurCouts, 'repas');
  const repas            = calculerRepas(montantRepas, repasType, taux_demi_pension);

  const cdrAdulte = calculerCoutOffre(offreAdulte) + montantTransport + repas;
  const cdrEnfant = calculerCoutOffre(offreEnfant) + montantTransport + repas;

  return cdrAdulte * nbAdultes + cdrEnfant * nbEnfants;
}

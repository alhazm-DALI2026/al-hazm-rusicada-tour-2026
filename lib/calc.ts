import type { CoutInclus, MoteurCout, Offre, Parametres, RepasType } from '@/types';

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

// ─── Grille famille (type conservé pour rétrocompat DB, plus utilisé en calcul) ─

export type FamilleGrille = {
  id:           string
  libelle:      string
  categorie:    string
  type_chambre: string | null
  montant:      number
  actif:        boolean
}

// ─── Calcul chambres hôtelières ──────────────────────────────────────────────

type ChambreItem = { type: string; occupants: string }

function calculerChambres(
  nbAdultes: number,
  nbEnfants: number,
): {
  liste:        ChambreItem[]
  nbSingle:     number
  nbDouble:     number
  nbTriple:     number
  nbQuadruple:  number
} {
  const liste: ChambreItem[] = []
  let adultsRestants  = nbAdultes
  let enfantsRestants = nbEnfants

  // Adults in pairs, absorb up to 2 kids per room
  while (adultsRestants >= 2) {
    const kids = Math.min(enfantsRestants, 2)
    enfantsRestants -= kids
    adultsRestants  -= 2
    const total = 2 + kids
    liste.push({
      type: total === 2 ? 'Double' : total === 3 ? 'Triple' : 'Quadruple',
      occupants: kids > 0 ? `2 adultes + ${kids} enfant${kids > 1 ? 's' : ''}` : '2 adultes',
    })
  }

  // Remaining single adult
  if (adultsRestants === 1) {
    if (enfantsRestants === 0) {
      liste.push({ type: 'Single', occupants: '1 adulte' })
    } else {
      const kids = Math.min(enfantsRestants, 2)
      enfantsRestants -= kids
      const total = 1 + kids
      liste.push({
        type: total === 1 ? 'Single' : total === 2 ? 'Double' : 'Triple',
        occupants: `1 adulte + ${kids} enfant${kids > 1 ? 's' : ''}`,
      })
    }
  }

  // Remaining kids in their own rooms (up to 3 per room)
  while (enfantsRestants > 0) {
    const n = Math.min(enfantsRestants, 3)
    enfantsRestants -= n
    liste.push({
      type: n === 1 ? 'Single' : n === 2 ? 'Double' : 'Triple',
      occupants: `${n} enfant${n > 1 ? 's' : ''}`,
    })
  }

  return {
    liste,
    nbSingle:    liste.filter(c => c.type === 'Single').length,
    nbDouble:    liste.filter(c => c.type === 'Double').length,
    nbTriple:    liste.filter(c => c.type === 'Triple').length,
    nbQuadruple: liste.filter(c => c.type === 'Quadruple').length,
  }
}

// ─── Calcul pack famille ─────────────────────────────────────────────────────

/**
 * SYSTÈME 2 — Réservation famille
 * Source : parametres uniquement
 * Indépendant des offres standard
 */
export function calculerFamille(
  params: Parametres,
  choix: {
    nbAdultes:    number
    nbEnfants:    number
    nbBebes:      number
    nombreNuits:  number
    transport:    boolean
    repas:        'sans' | 'demi' | 'complet'
  },
): {
  chambres:  ChambreItem[]
  cdrAdulte: number
  cdrEnfant: number
  cdrBebe:   number
  cdrTotal:  number
  pvTotal:   number
  marge:     number
  detail: {
    hebergement_cdr: number
    hebergement_pv:  number
    repas_cdr:       number
    repas_pv:        number
    transport_cdr:   number
    transport_pv:    number
  }
} {
  const ch = calculerChambres(choix.nbAdultes, choix.nbEnfants)

  // Hébergement
  const cdrHeberg =
    ch.nbSingle    * params.cdr_single    * choix.nombreNuits +
    ch.nbDouble    * params.cdr_double    * choix.nombreNuits +
    ch.nbTriple    * params.cdr_triple    * choix.nombreNuits +
    ch.nbQuadruple * params.cdr_quadruple * choix.nombreNuits

  const pvHeberg =
    ch.nbSingle    * params.pv_single    * choix.nombreNuits +
    ch.nbDouble    * params.pv_double    * choix.nombreNuits +
    ch.nbTriple    * params.pv_triple    * choix.nombreNuits +
    ch.nbQuadruple * params.pv_quadruple * choix.nombreNuits

  // Repas — par jour (nuits + 1) par personne
  const nbPersonnes = choix.nbAdultes + choix.nbEnfants
  const nbJours     = choix.nombreNuits + 1
  const facteurRepas =
    choix.repas === 'sans' ? 0 :
    choix.repas === 'demi' ? (1 - params.taux_demi_pension / 100) : 1

  const cdrRepas = params.cdr_repas_complet * facteurRepas * nbPersonnes * nbJours
  const pvRepas  = params.pv_repas_complet  * facteurRepas * nbPersonnes * nbJours

  // Transport
  const cdrTransport = choix.transport ? (
    params.cdr_transport_adulte * choix.nbAdultes +
    params.cdr_transport_enfant * choix.nbEnfants +
    params.cdr_transport_bebe   * choix.nbBebes
  ) : 0

  const pvTransport = choix.transport ? (
    params.pv_transport_adulte * choix.nbAdultes +
    params.pv_transport_enfant * choix.nbEnfants +
    params.pv_transport_bebe   * choix.nbBebes
  ) : 0

  const cdrTotal = cdrHeberg + cdrRepas + cdrTransport
  const pvTotal  = pvHeberg  + pvRepas  + pvTransport
  const marge    = pvTotal - cdrTotal

  return {
    chambres: ch.liste,
    cdrAdulte: 0,
    cdrEnfant: 0,
    cdrBebe:   0,
    cdrTotal,
    pvTotal,
    marge,
    detail: {
      hebergement_cdr: cdrHeberg,
      hebergement_pv:  pvHeberg,
      repas_cdr:       cdrRepas,
      repas_pv:        pvRepas,
      transport_cdr:   cdrTransport,
      transport_pv:    pvTransport,
    },
  }
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

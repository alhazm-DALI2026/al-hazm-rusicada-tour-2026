import type { ChargeStaff, CoutInclus, MoteurCout, Offre, Parametres, RepasType, TypeChambre } from '@/types';

export function calculerPV(cdr: number, taux: number): number {
  return Math.round(cdr * (1 + taux / 100))
}

export const CAPACITE: Record<string, number> = {
  single: 1, double: 2, triple: 3, quadruple: 4,
}

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
    hebergement_par_pers_nuit: { cdr: number; pv: number }
    repas_par_pers_jour:       { cdr: number; pv: number }
    transport_par_pers:        { cdr: number; pv: number }
  }
} {
  const ch = calculerChambres(choix.nbAdultes, choix.nbEnfants)

  // Hébergement
  const cdrHeberg =
    ch.nbSingle    * params.cdr_single    * choix.nombreNuits +
    ch.nbDouble    * params.cdr_double    * choix.nombreNuits +
    ch.nbTriple    * params.cdr_triple    * choix.nombreNuits +
    ch.nbQuadruple * params.cdr_quadruple * choix.nombreNuits

  // Repas — par jour (nuits + 1) par personne
  const nbPersonnes = choix.nbAdultes + choix.nbEnfants
  const nbJours     = choix.nombreNuits + 1
  const facteurRepas =
    choix.repas === 'sans' ? 0 :
    choix.repas === 'demi' ? (1 - params.taux_demi_pension / 100) : 1

  const cdrRepas = params.cdr_repas_complet * facteurRepas * nbPersonnes * nbJours

  // Transport
  const cdrTransport = choix.transport ? (
    params.cdr_transport_adulte * choix.nbAdultes +
    params.cdr_transport_enfant * choix.nbEnfants +
    params.cdr_transport_bebe   * choix.nbBebes
  ) : 0

  const cdrTotal = cdrHeberg + cdrRepas + cdrTransport
  const tauxMarge = params.taux_marge_famille ?? 23
  const pvTotal   = calculerPV(cdrTotal, tauxMarge)
  const marge     = pvTotal - cdrTotal

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
      hebergement_pv:  Math.round(cdrHeberg * (1 + tauxMarge / 100)),
      repas_cdr:       cdrRepas,
      repas_pv:        Math.round(cdrRepas   * (1 + tauxMarge / 100)),
      transport_cdr:   cdrTransport,
      transport_pv:    Math.round(cdrTransport * (1 + tauxMarge / 100)),
      hebergement_par_pers_nuit: {
        cdr: params.cdr_triple / 3,
        pv:  params.pv_triple  / 3,
      },
      repas_par_pers_jour: {
        cdr: params.cdr_repas_complet,
        pv:  params.pv_repas_complet,
      },
      transport_par_pers: {
        cdr: params.cdr_transport_adulte,
        pv:  Math.round(params.cdr_transport_adulte * (1 + params.taux_marge_famille / 100)),
      },
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────

// ─── Calcul charges staff (SYSTÈME 3) ───────────────────────────────────────

export function calculerCDRStaff(
  charges: ChargeStaff[],
  nombreNuits: number,
): {
  total:  number
  detail: { libelle: string; montant: number; calcul: string; categorie: string }[]
} {
  const nombreJours = nombreNuits + 1
  const detail: { libelle: string; montant: number; calcul: string; categorie: string }[] = []
  let total = 0

  charges
    .filter(c => c.actif)
    .forEach(c => {
      let montantCalcule = 0
      let calcul = ''

      switch (c.type) {
        case 'par_nuit':
          montantCalcule = c.montant * nombreNuits
          calcul = `${c.montant.toLocaleString('fr-DZ')} × ${nombreNuits} nuits`
          break
        case 'par_jour':
          montantCalcule = c.montant * nombreJours
          calcul = `${c.montant.toLocaleString('fr-DZ')} × ${nombreJours} jours`
          break
        case 'par_personne':
        case 'fixe_global':
          montantCalcule = c.montant
          calcul = `${c.montant.toLocaleString('fr-DZ')} (forfait)`
          break
      }

      detail.push({ libelle: c.libelle, montant: montantCalcule, calcul, categorie: c.categorie })
      total += montantCalcule
    })

  return { total, detail }
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

// ─── Logique C — grille charges_famille ──────────────────────────────────────

export interface ChargeFamille {
  id:     string
  nom:    string
  type:   'hebergement' | 'repas' | 'transport' | 'custom'
  cdr:    number
  pv:     number
  unite:  'par_pers_nuit' | 'par_pers_jour' | 'par_personne' | 'fixe'
  actif:  boolean
}

export function calculerFamilleV2(
  charges: ChargeFamille[],
  choix: {
    nbAdultes:   number
    nbEnfants:   number
    nbBebes:     number
    nombreNuits: number
    repas:       'complet' | 'demi' | 'sans'
    transport:   boolean
  },
): {
  cdrTotal: number
  pvTotal:  number
  marge:    number
  margeP:   number
  detail:   { nom: string; cdr: number; pv: number }[]
} {
  const nbPersonnes  = choix.nbAdultes + choix.nbEnfants
  const nbTotal      = choix.nbAdultes + choix.nbEnfants + choix.nbBebes
  const nbJours      = choix.nombreNuits + 1
  const facteurRepas = choix.repas === 'sans' ? 0
                     : choix.repas === 'demi' ? 0.6
                     : 1.0

  let cdrTotal = 0
  let pvTotal  = 0
  const detail: { nom: string; cdr: number; pv: number }[] = []

  for (const charge of charges.filter(c => c.actif)) {
    if (charge.type === 'transport' && !choix.transport) continue
    if (charge.type === 'repas'     && choix.repas === 'sans') continue

    let cdr = 0, pv = 0
    switch (charge.unite) {
      case 'par_pers_nuit':
        cdr = charge.cdr * nbPersonnes * choix.nombreNuits
        pv  = charge.pv  * nbPersonnes * choix.nombreNuits
        if (charge.type === 'repas') { cdr *= facteurRepas; pv *= facteurRepas }
        break
      case 'par_pers_jour':
        cdr = charge.cdr * nbPersonnes * nbJours
        pv  = charge.pv  * nbPersonnes * nbJours
        if (charge.type === 'repas') { cdr *= facteurRepas; pv *= facteurRepas }
        break
      case 'par_personne':
        cdr = charge.cdr * nbTotal
        pv  = charge.pv  * nbTotal
        break
      case 'fixe':
        cdr = charge.cdr
        pv  = charge.pv
        break
    }

    cdr = Math.round(cdr)
    pv  = Math.round(pv)
    cdrTotal += cdr
    pvTotal  += pv
    detail.push({ nom: charge.nom, cdr, pv })
  }

  const marge  = pvTotal - cdrTotal
  const margeP = pvTotal > 0 ? Math.round((marge / pvTotal) * 100) : 0
  return { cdrTotal, pvTotal, marge, margeP, detail }
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcule CDR et PV d'une offre famille.
 * CDR : paramètres (cdr_*)
 * PV  : CDR × (1 + taux_marge_famille / 100)
 */
export function calculerOffreFamille(
  typeChambre:   TypeChambre,
  nbAdultes:     number,
  nbEnfants:     number,
  nombreNuits:   number,
  repasType:     'sans' | 'demi' | 'complet',
  avecTransport: boolean,
  params:        Parametres,
): {
  cdrHeberg:    number
  cdrRepas:     number
  cdrTransport: number
  cdrTotal:     number
  pvTotal:      number
  marge:        number
  taux:         number
} {
  const nbJours     = nombreNuits + 1
  const nbPersonnes = nbAdultes + nbEnfants

  const cdrParChambre: Record<TypeChambre, number> = {
    Single:    params.cdr_single,
    Double:    params.cdr_double,
    Triple:    params.cdr_triple,
    Quadruple: params.cdr_quadruple,
  }
  const cdrHeberg = cdrParChambre[typeChambre] * nombreNuits

  const facteurRepas =
    repasType === 'sans' ? 0 :
    repasType === 'demi' ? (1 - params.taux_demi_pension / 100) : 1

  const cdrRepas = params.cdr_repas_complet * facteurRepas * nbPersonnes * nbJours

  const cdrTransport = avecTransport
    ? params.cdr_transport_adulte * nbAdultes + params.cdr_transport_enfant * nbEnfants
    : 0

  const cdrTotal = Math.round(cdrHeberg + cdrRepas + cdrTransport)
  const taux     = 1 + params.taux_marge_famille / 100
  const pvTotal  = calculerPV(cdrTotal, params.taux_marge_famille)
  const marge    = pvTotal - cdrTotal

  return { cdrHeberg, cdrRepas, cdrTransport, cdrTotal, pvTotal, marge, taux }
}

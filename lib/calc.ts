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
 * Rétrocompat : les anciens enregistrements avec des IDs string sont ignorés.
 */
export function calculerCoutOffre(offre: Offre): number {
  return (offre.couts_inclus as unknown as (CoutInclus | string)[])
    .reduce<number>((total, item) => {
      if (typeof item === 'string') return total;
      switch (item.type) {
        case 'par_nuit':     return total + item.montant * offre.nombre_nuits;
        case 'par_jour':     return total + item.montant * offre.nombre_jours;
        case 'par_personne': return total + item.montant;
        default:             return total;
      }
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

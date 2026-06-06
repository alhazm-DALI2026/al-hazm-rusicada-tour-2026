import type { MoteurCout, Offre, RepasType } from '@/types';

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
 * CDR d'une offre : somme des coûts inclus selon leur type de calcul.
 * couts_inclus contient des IDs de moteur_cout.
 */
export function calculerCoutOffre(
  offre: Offre,
  moteurCouts: MoteurCout[],
): number {
  const coutsMap = new Map(moteurCouts.map(c => [c.id, c]));

  return offre.couts_inclus.reduce<number>((total, id) => {
    const cout = coutsMap.get(id);
    if (!cout?.actif) return total;

    switch (cout.type) {
      case 'par_nuit':
        return total + cout.montant * offre.nombre_nuits;
      case 'par_jour':
        return total + cout.montant * offre.nombre_jours;
      case 'par_personne':
        return total + cout.montant;
      default:
        return total;
    }
  }, 0);
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

  const cdrAdulte = calculerCoutOffre(offreAdulte, moteurCouts) + montantTransport + repas;
  const cdrEnfant = calculerCoutOffre(offreEnfant, moteurCouts) + montantTransport + repas;

  return cdrAdulte * nbAdultes + cdrEnfant * nbEnfants;
}

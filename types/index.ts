export type MoteurCoutType     = 'par_nuit' | 'par_jour' | 'par_personne' | 'fixe_global';
export type MoteurCoutCategorie = 'hebergement' | 'repas' | 'transport' | 'assurance' | 'medical' | 'media' | 'autre';
export type TypePublic          = 'enfant' | 'adulte' | 'famille';
export type TypeChambre         = 'Single' | 'Double' | 'Triple' | 'Quadruple';
export type RepasType           = 'complet' | 'demi' | 'sans';
export type StatutReservation   = 'en_attente' | 'confirmee' | 'annulee';
export type SourceReservation   = 'admin' | 'client';
export type TypeReservation     = 'standard' | 'famille';

export interface MoteurCout {
  id:         string;
  libelle:    string;
  type:       MoteurCoutType;
  categorie:  MoteurCoutCategorie;
  montant:    number;
  actif:      boolean;
  ordre:      number;
  created_at: string;
}

export interface CoutInclus {
  id:        string;
  libelle:   string;
  montant:   number;
  type:      MoteurCoutType;
  categorie: MoteurCoutCategorie;
}

export interface Offre {
  id:                  string;
  nom:                 string;
  description:         string | null;
  type_public:         TypePublic;
  type_chambre:        TypeChambre;
  nombre_nuits:        number;
  nombre_jours:        number;
  transport_inclus:    boolean;
  transport_optionnel: boolean;
  repas_type:          RepasType;
  couts_inclus:        CoutInclus[];
  cout_revient:        number;
  prix_vente:          number;
  marge:               number;
  places_total:        number;
  places_restantes:    number;
  actif:               boolean;
  ordre_affichage:     number;
  options_custom:      Record<string, unknown> | null;
  image_url:           string | null;
  created_at:          string;
}

export interface Reservation {
  id:                         string;
  reference:                  string;
  offre_id:                   string | null;
  nom:                        string;
  prenom:                     string;
  telephone:                  string;
  email:                      string | null;
  type:                       TypeReservation;
  source:                     SourceReservation;
  statut:                     StatutReservation;
  nb_adultes:                 number;
  nb_enfants:                 number;
  nombre_nuits:               number;
  transport:                  boolean;
  repas_type:                 RepasType;
  cout_revient:               number;
  prix_vente:                 number;
  marge:                      number;
  notif_soumission_envoyee:   boolean;
  notif_confirmation_envoyee: boolean;
  options_custom:             Record<string, unknown> | null;
  created_at:                 string;
  confirmed_at:               string | null;
}

export interface ChargeStaff {
  id:        string;
  libelle:   string;
  categorie: string;
  type:      'par_nuit' | 'par_jour' | 'par_personne' | 'fixe_global';
  montant:   number;
  actif:     boolean;
  custom:    boolean;
}

export interface Staff {
  id:             string;
  nom:            string;
  fonction:       string;
  type_chambre:   TypeChambre | null;
  cout_revient:   number;
  prime:          number;
  charges_custom: ChargeStaff[];
  created_at:     string;
}

export interface Parametres {
  id:                   string;
  nom_evenement:        string;
  date_depart:          string | null;
  date_retour:          string | null;
  whatsapp_numero:      string | null;
  callmebot_apikey:     string | null;
  lien_groupe_whatsapp: string | null;
  taux_demi_pension:    number;
  taux_marge_famille:   number;
  cdr_single:           number;
  cdr_double:           number;
  cdr_triple:           number;
  cdr_quadruple:        number;
  pv_single:            number;
  pv_double:            number;
  pv_triple:            number;
  pv_quadruple:         number;
  cdr_repas_complet:    number;
  pv_repas_complet:     number;
  cdr_transport_adulte: number;
  cdr_transport_enfant: number;
  cdr_transport_bebe:   number;
  pv_transport_adulte:  number;
  pv_transport_enfant:  number;
  pv_transport_bebe:    number;
  updated_at:           string;
}

export interface ChoixFamille {
  nbAdultes:    number;
  nbEnfants:    number;
  nbBebes:      number;
  nombreNuits:  number;
  transport:    boolean;
  repas:        RepasType;
}

-- =============================================================
-- Al Hazm Academy — Rusicada Park 2026
-- Schema v2
-- =============================================================

-- =============================================================
-- 1. TABLE moteur_cout
-- =============================================================
CREATE TABLE IF NOT EXISTS moteur_cout (
  id        UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  libelle   TEXT          NOT NULL,
  type      TEXT          NOT NULL
              CHECK (type IN ('par_nuit','par_jour','par_personne','fixe_global')),
  categorie TEXT          NOT NULL
              CHECK (categorie IN ('hebergement','repas','transport','assurance',
                                   'medical','media','autre')),
  montant   NUMERIC(12,2) NOT NULL DEFAULT 0,
  actif     BOOLEAN       NOT NULL DEFAULT true,
  ordre     INTEGER       NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- =============================================================
-- 2. TABLE offre
-- =============================================================
CREATE TABLE IF NOT EXISTS offre (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  nom                 TEXT          NOT NULL,
  description         TEXT,
  type_public         TEXT          NOT NULL
                        CHECK (type_public IN ('enfant','adulte','famille')),
  type_chambre        TEXT          NOT NULL
                        CHECK (type_chambre IN ('Single','Double','Triple','Quadruple')),
  nombre_nuits        INTEGER       NOT NULL DEFAULT 1,
  nombre_jours        INTEGER       NOT NULL DEFAULT 2,
  transport_inclus    BOOLEAN       NOT NULL DEFAULT false,
  transport_optionnel BOOLEAN       NOT NULL DEFAULT false,
  repas_type          TEXT          NOT NULL
                        CHECK (repas_type IN ('complet','demi','sans')),
  couts_inclus        JSONB         NOT NULL DEFAULT '[]',
  cout_revient        NUMERIC(12,2) NOT NULL DEFAULT 0,
  prix_vente          NUMERIC(12,2) NOT NULL DEFAULT 0,
  marge               NUMERIC(12,2) GENERATED ALWAYS AS (prix_vente - cout_revient) STORED,
  places_total        INTEGER       NOT NULL DEFAULT 0,
  places_restantes    INTEGER       NOT NULL DEFAULT 0,
  actif               BOOLEAN       NOT NULL DEFAULT true,
  ordre_affichage     INTEGER       NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- =============================================================
-- 3. SEQUENCE + TRIGGER référence auto
-- =============================================================
CREATE SEQUENCE IF NOT EXISTS reservation_ref_seq START 1;

CREATE OR REPLACE FUNCTION set_reservation_reference()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.reference IS NULL THEN
    NEW.reference := 'ACT-' || LPAD(nextval('reservation_ref_seq')::TEXT, 3, '0');
  END IF;
  RETURN NEW;
END;
$$;

-- =============================================================
-- 4. TABLE reservation
-- =============================================================
CREATE TABLE IF NOT EXISTS reservation (
  id                         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  reference                  TEXT          UNIQUE,
  offre_id                   UUID          REFERENCES offre(id) ON DELETE SET NULL,
  nom                        TEXT          NOT NULL,
  prenom                     TEXT          NOT NULL,
  telephone                  TEXT          NOT NULL,
  email                      TEXT,
  type                       TEXT          NOT NULL DEFAULT 'standard'
                               CHECK (type IN ('standard','famille')),
  source                     TEXT          NOT NULL DEFAULT 'client'
                               CHECK (source IN ('admin','client')),
  statut                     TEXT          NOT NULL DEFAULT 'en_attente'
                               CHECK (statut IN ('en_attente','confirmee','annulee')),
  nb_adultes                 INTEGER       NOT NULL DEFAULT 1,
  nb_enfants                 INTEGER       NOT NULL DEFAULT 0,
  nombre_nuits               INTEGER       NOT NULL DEFAULT 1,
  transport                  BOOLEAN       NOT NULL DEFAULT false,
  repas_type                 TEXT          NOT NULL DEFAULT 'sans'
                               CHECK (repas_type IN ('complet','demi','sans')),
  cout_revient               NUMERIC(12,2) NOT NULL DEFAULT 0,
  prix_vente                 NUMERIC(12,2) NOT NULL DEFAULT 0,
  marge                      NUMERIC(12,2) GENERATED ALWAYS AS (prix_vente - cout_revient) STORED,
  notif_soumission_envoyee   BOOLEAN       NOT NULL DEFAULT false,
  notif_confirmation_envoyee BOOLEAN       NOT NULL DEFAULT false,
  created_at                 TIMESTAMPTZ   NOT NULL DEFAULT now(),
  confirmed_at               TIMESTAMPTZ
);

CREATE TRIGGER trg_reservation_reference
  BEFORE INSERT ON reservation
  FOR EACH ROW EXECUTE FUNCTION set_reservation_reference();

-- =============================================================
-- 5. TABLE staff
-- =============================================================
CREATE TABLE IF NOT EXISTS staff (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  nom          TEXT          NOT NULL,
  fonction     TEXT          NOT NULL,
  type_chambre TEXT
                 CHECK (type_chambre IN ('Single','Double','Triple','Quadruple')),
  cout_revient NUMERIC(12,2) NOT NULL DEFAULT 0,
  prime           NUMERIC(12,2) NOT NULL DEFAULT 0,
  charges_custom  JSONB         NOT NULL DEFAULT '[]'::jsonb,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- =============================================================
-- 6. TABLE parametres
-- =============================================================
CREATE TABLE IF NOT EXISTS parametres (
  id                   TEXT        PRIMARY KEY DEFAULT 'default',
  nom_evenement        TEXT        NOT NULL DEFAULT 'Rusicada Park 2026',
  date_depart          DATE,
  date_retour          DATE,
  whatsapp_numero      TEXT        DEFAULT '+213781608480',
  callmebot_apikey     TEXT,
  lien_groupe_whatsapp TEXT,
  taux_demi_pension    NUMERIC(5,2) NOT NULL DEFAULT 35,
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- =============================================================
-- 7. RLS
-- =============================================================
ALTER TABLE moteur_cout ENABLE ROW LEVEL SECURITY;
ALTER TABLE offre        ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation  ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff        ENABLE ROW LEVEL SECURITY;
ALTER TABLE parametres   ENABLE ROW LEVEL SECURITY;

-- offre : lecture publique si actif = true
CREATE POLICY "offre_public_read"
  ON offre FOR SELECT
  TO anon, authenticated
  USING (actif = true);

-- reservation : insert public
CREATE POLICY "reservation_public_insert"
  ON reservation FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- moteur_cout : service_role uniquement
CREATE POLICY "moteur_cout_service_role"
  ON moteur_cout FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- offre : accès complet service_role
CREATE POLICY "offre_service_role"
  ON offre FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- reservation : accès complet service_role
CREATE POLICY "reservation_service_role"
  ON reservation FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- staff : service_role uniquement
CREATE POLICY "staff_service_role"
  ON staff FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- parametres : service_role uniquement
CREATE POLICY "parametres_service_role"
  ON parametres FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- =============================================================
-- 8. Données de test
-- =============================================================

-- 3 lignes moteur_cout
INSERT INTO moteur_cout (libelle, type, categorie, montant, actif, ordre) VALUES
  ('Hébergement chambre double par nuit',   'par_nuit',     'hebergement', 4500.00, true, 1),
  ('Repas demi-pension par personne',        'par_personne', 'repas',       1200.00, true, 2),
  ('Transport aller-retour forfait global',  'fixe_global',  'transport',   3000.00, true, 3);

-- 1 ligne parametres default
INSERT INTO parametres (
  id, nom_evenement, date_depart, date_retour,
  whatsapp_numero, taux_demi_pension
) VALUES (
  'default', 'Rusicada Park 2026', '2026-07-10', '2026-07-14',
  '+213781608480', 35
) ON CONFLICT (id) DO NOTHING;

-- 2 offres de test
INSERT INTO offre (
  nom, description, type_public, type_chambre,
  nombre_nuits, nombre_jours,
  transport_inclus, transport_optionnel, repas_type,
  cout_revient, prix_vente,
  places_total, places_restantes,
  actif, ordre_affichage
) VALUES
  (
    'Pack Adulte Double',
    'Séjour 4 nuits en chambre double, demi-pension incluse',
    'adulte', 'Double', 4, 5,
    false, true, 'demi',
    19200.00, 25000.00,
    40, 40, true, 1
  ),
  (
    'Pack Famille Quadruple',
    'Séjour 4 nuits en chambre quadruple, pension complète, transport inclus',
    'famille', 'Quadruple', 4, 5,
    true, false, 'complet',
    38000.00, 48000.00,
    20, 20, true, 2
  );

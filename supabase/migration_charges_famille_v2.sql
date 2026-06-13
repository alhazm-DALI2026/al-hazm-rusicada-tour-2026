-- Migration : table charges_famille (Logique C)
-- CDR et PV saisis séparément par charge
-- Exécuter dans Supabase SQL Editor

CREATE TABLE IF NOT EXISTS charges_famille (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom         TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'custom',
  -- 'hebergement' | 'repas' | 'transport' | 'custom'
  cdr         NUMERIC(12,2) NOT NULL DEFAULT 0,
  pv          NUMERIC(12,2) NOT NULL DEFAULT 0,
  unite       TEXT NOT NULL DEFAULT 'par_pers_nuit',
  -- 'par_pers_nuit' | 'par_pers_jour' | 'par_personne' | 'fixe'
  actif       BOOLEAN DEFAULT true,
  ordre       INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO charges_famille
  (nom, type, cdr, pv, unite, actif, ordre)
VALUES
  ('Hébergement',  'hebergement', 9000, 11000, 'par_pers_nuit', true,  1),
  ('Repas complet','repas',       2200,  3000, 'par_pers_jour', true,  2),
  ('Transport',    'transport',   5000,  7000, 'par_personne',  false, 3);

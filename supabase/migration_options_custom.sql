-- Migration : ajouter la colonne options_custom à la table offre
-- À exécuter dans : Supabase Dashboard > SQL Editor

ALTER TABLE offre
  ADD COLUMN IF NOT EXISTS options_custom JSONB DEFAULT NULL;

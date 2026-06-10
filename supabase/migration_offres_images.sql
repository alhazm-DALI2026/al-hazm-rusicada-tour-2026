-- Étape 2 : Ajout de la colonne image_url à la table offres
-- Exécuter dans Supabase Dashboard → SQL Editor

ALTER TABLE offre ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL;

-- Ajoute l'année de naissance du client sur une réservation (admin only).
ALTER TABLE reservation ADD COLUMN IF NOT EXISTS annee_naissance INTEGER;

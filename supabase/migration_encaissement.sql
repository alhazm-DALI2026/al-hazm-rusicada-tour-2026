-- Ajoute le suivi de l'encaissement (montant réellement reçu en DA) sur une réservation.
-- Une réservation confirmée doit être validée par un encaissement > 0.
ALTER TABLE reservation ADD COLUMN IF NOT EXISTS encaissement NUMERIC(12,2) NOT NULL DEFAULT 0;

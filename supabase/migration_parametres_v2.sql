-- =============================================================
-- Al Hazm Academy — Migration parametres v2
-- Centralise tous les tarifs CDR+PV dans la table parametres
-- =============================================================

ALTER TABLE parametres
  ADD COLUMN IF NOT EXISTS taux_demi_pension
    NUMERIC(5,2) DEFAULT 35,
  ADD COLUMN IF NOT EXISTS taux_marge_famille
    NUMERIC(5,2) DEFAULT 23,
  ADD COLUMN IF NOT EXISTS cdr_single
    NUMERIC(12,2) DEFAULT 8000,
  ADD COLUMN IF NOT EXISTS cdr_double
    NUMERIC(12,2) DEFAULT 9000,
  ADD COLUMN IF NOT EXISTS cdr_triple
    NUMERIC(12,2) DEFAULT 6000,
  ADD COLUMN IF NOT EXISTS cdr_quadruple
    NUMERIC(12,2) DEFAULT 11000,
  ADD COLUMN IF NOT EXISTS pv_single
    NUMERIC(12,2) DEFAULT 10000,
  ADD COLUMN IF NOT EXISTS pv_double
    NUMERIC(12,2) DEFAULT 11500,
  ADD COLUMN IF NOT EXISTS pv_triple
    NUMERIC(12,2) DEFAULT 7500,
  ADD COLUMN IF NOT EXISTS pv_quadruple
    NUMERIC(12,2) DEFAULT 14000,
  ADD COLUMN IF NOT EXISTS cdr_repas_complet
    NUMERIC(12,2) DEFAULT 2700,
  ADD COLUMN IF NOT EXISTS pv_repas_complet
    NUMERIC(12,2) DEFAULT 3500,
  ADD COLUMN IF NOT EXISTS cdr_transport_adulte
    NUMERIC(12,2) DEFAULT 7000,
  ADD COLUMN IF NOT EXISTS cdr_transport_enfant
    NUMERIC(12,2) DEFAULT 7000,
  ADD COLUMN IF NOT EXISTS cdr_transport_bebe
    NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pv_transport_adulte
    NUMERIC(12,2) DEFAULT 8500,
  ADD COLUMN IF NOT EXISTS pv_transport_enfant
    NUMERIC(12,2) DEFAULT 8500,
  ADD COLUMN IF NOT EXISTS pv_transport_bebe
    NUMERIC(12,2) DEFAULT 0;

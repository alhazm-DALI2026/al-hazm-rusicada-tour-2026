/**
 * Correction CDR hébergement offre "Rafiq Al Hazm"
 *
 * Bug : montant hébergement = 12 000 (= pv_nuit/2 = 24 000/2)
 * Fix  : montant hébergement = 9 000  (= cdr_nuit/2 = 18 000/2)
 *
 * Usage : npx tsx scripts/fix-rafiq-cdr-hebergement.ts
 */

import { createClient } from '@supabase/supabase-js'

const OFFRE_ID        = 'f0ddac7f-1c0e-4e1f-b919-32b01b006fee'
const HEBERGEMENT_ID  = '401abd03-38bc-4457-83ef-01eaeea2ab3e'
const CDR_NUIT_CORR   = 9000   // cdr_nuit / 2 = 18 000 / 2
const CDR_TOTAL_CORR  = 52000  // 9 000×4 + 1 000 + 14 000 + 1 000

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

type CoutInclus = { id: string; libelle: string; montant: number; type: string; categorie: string }

async function main() {
  // 1. Lire l'offre actuelle
  const { data: offre, error: readErr } = await supabase
    .from('offre')
    .select('id, nom, couts_inclus, cout_revient, prix_vente, marge')
    .eq('id', OFFRE_ID)
    .single()

  if (readErr || !offre) {
    console.error('Lecture impossible :', readErr?.message); process.exit(1)
  }

  console.log('\n── AVANT ───────────────────────────────────────')
  console.log(`Nom         : ${offre.nom}`)
  console.log(`cout_revient: ${Number(offre.cout_revient).toLocaleString('fr-DZ')} DA`)
  console.log(`prix_vente  : ${Number(offre.prix_vente).toLocaleString('fr-DZ')} DA`)
  console.log(`marge       : ${Number(offre.marge).toLocaleString('fr-DZ')} DA`)

  const couts = offre.couts_inclus as CoutInclus[]
  const heberg = couts.find(c => c.id === HEBERGEMENT_ID)
  if (!heberg) {
    console.error('Item hébergement introuvable dans couts_inclus.'); process.exit(1)
  }
  console.log(`\nHébergement (montant/nuit) actuel : ${heberg.montant.toLocaleString('fr-DZ')} DA  ← FAUX (pv_nuit/2)`)

  // 2. Construire les couts_inclus corrigés
  const coutsCorr = couts.map(c =>
    c.id === HEBERGEMENT_ID ? { ...c, montant: CDR_NUIT_CORR } : c
  )

  // 3. Appliquer la correction
  const { data: updated, error: updErr } = await supabase
    .from('offre')
    .update({
      couts_inclus: coutsCorr,
      cout_revient: CDR_TOTAL_CORR,
    })
    .eq('id', OFFRE_ID)
    .select('id, nom, couts_inclus, cout_revient, prix_vente, marge')
    .single()

  if (updErr || !updated) {
    console.error('Mise à jour impossible :', updErr?.message); process.exit(1)
  }

  const coutsUp = updated.couts_inclus as CoutInclus[]
  const marge   = Number(updated.prix_vente) - Number(updated.cout_revient)
  const margeP  = Math.round((marge / Number(updated.prix_vente)) * 100)

  console.log('\n── APRÈS ────────────────────────────────────────')
  console.log(`cout_revient: ${Number(updated.cout_revient).toLocaleString('fr-DZ')} DA`)
  console.log(`prix_vente  : ${Number(updated.prix_vente).toLocaleString('fr-DZ')} DA`)
  console.log(`marge       : ${marge.toLocaleString('fr-DZ')} DA  (${margeP}%)`)

  const hebUp = coutsUp.find(c => c.id === HEBERGEMENT_ID)
  console.log(`\nHébergement (montant/nuit) corrigé : ${hebUp?.montant.toLocaleString('fr-DZ')} DA  ✅ (cdr_nuit/2)`)

  console.log('\n── DÉTAIL CDR ───────────────────────────────────')
  for (const c of coutsUp) {
    const label = `[${c.categorie}] ${c.libelle}`.padEnd(38)
    console.log(`  ${label} montant: ${String(c.montant).padStart(7)} DA  (${c.type})`)
  }
  console.log('\n  CDR total calculé :')
  const cdrDetail = coutsUp.map(c => {
    if (c.type === 'par_nuit')     return c.montant * 4  // nombre_nuits
    if (c.type === 'par_personne') return c.montant
    return 0
  })
  coutsUp.forEach((c, i) => {
    const libelle = c.libelle.padEnd(30)
    console.log(`    ${libelle} = ${cdrDetail[i].toLocaleString('fr-DZ')} DA`)
  })
  const total = cdrDetail.reduce((a, b) => a + b, 0)
  console.log(`    ${'TOTAL'.padEnd(30)} = ${total.toLocaleString('fr-DZ')} DA`)

  if (total !== CDR_TOTAL_CORR) {
    console.warn(`\n⚠️  Incohérence : total calculé ${total} ≠ ${CDR_TOTAL_CORR}`)
  } else {
    console.log('\n✅  CDR total cohérent.')
  }

  console.log('\n── CORRECTION APPLIQUÉE AVEC SUCCÈS ────────────\n')
}

main().catch(err => { console.error(err); process.exit(1) })

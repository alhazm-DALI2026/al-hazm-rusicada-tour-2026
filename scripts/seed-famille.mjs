// node --env-file=.env.local scripts/seed-famille.mjs
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

// ── calculerChambres (logique identique à lib/calc.ts) ───────────────────────
function calculerChambres(nbAdultes, nbEnfants) {
  const liste = []
  let adultsRestants  = nbAdultes
  let enfantsRestants = nbEnfants

  while (adultsRestants >= 2) {
    const kids = Math.min(enfantsRestants, 2)
    enfantsRestants -= kids
    adultsRestants  -= 2
    const total = 2 + kids
    liste.push({
      type: total === 2 ? 'Double' : total === 3 ? 'Triple' : 'Quadruple',
      occupants: kids > 0 ? `2 adultes + ${kids} enfant${kids > 1 ? 's' : ''}` : '2 adultes',
    })
  }
  if (adultsRestants === 1) {
    if (enfantsRestants === 0) {
      liste.push({ type: 'Single', occupants: '1 adulte' })
    } else {
      const kids = Math.min(enfantsRestants, 2)
      enfantsRestants -= kids
      const total = 1 + kids
      liste.push({
        type: total === 1 ? 'Single' : total === 2 ? 'Double' : 'Triple',
        occupants: `1 adulte + ${kids} enfant${kids > 1 ? 's' : ''}`,
      })
    }
  }
  while (enfantsRestants > 0) {
    const n = Math.min(enfantsRestants, 3)
    enfantsRestants -= n
    liste.push({
      type: n === 1 ? 'Single' : n === 2 ? 'Double' : 'Triple',
      occupants: `${n} enfant${n > 1 ? 's' : ''}`,
    })
  }
  return {
    liste,
    nbSingle:    liste.filter(c => c.type === 'Single').length,
    nbDouble:    liste.filter(c => c.type === 'Double').length,
    nbTriple:    liste.filter(c => c.type === 'Triple').length,
    nbQuadruple: liste.filter(c => c.type === 'Quadruple').length,
  }
}

function calculerPV(cdr, taux) {
  return Math.round(cdr * (1 + taux / 100))
}

function calculerFamille(params, choix) {
  const ch = calculerChambres(choix.nbAdultes, choix.nbEnfants)

  const cdrHeberg =
    ch.nbSingle    * params.cdr_single    * choix.nombreNuits +
    ch.nbDouble    * params.cdr_double    * choix.nombreNuits +
    ch.nbTriple    * params.cdr_triple    * choix.nombreNuits +
    ch.nbQuadruple * params.cdr_quadruple * choix.nombreNuits

  const nbPersonnes  = choix.nbAdultes + choix.nbEnfants
  const nbJours      = choix.nombreNuits + 1
  const facteurRepas =
    choix.repas === 'sans' ? 0 :
    choix.repas === 'demi' ? (1 - params.taux_demi_pension / 100) : 1

  const cdrRepas = params.cdr_repas_complet * facteurRepas * nbPersonnes * nbJours

  const cdrTransport = choix.transport
    ? params.cdr_transport_adulte * choix.nbAdultes
      + params.cdr_transport_enfant * choix.nbEnfants
      + params.cdr_transport_bebe   * choix.nbBebes
    : 0

  const cdrTotal  = cdrHeberg + cdrRepas + cdrTransport
  const tauxMarge = params.taux_marge_famille ?? 23
  const pvTotal   = calculerPV(cdrTotal, tauxMarge)

  return {
    chambres: ch.liste,
    cdrTotal,
    pvTotal,
    marge: pvTotal - cdrTotal,
    detail: {
      hebergement_cdr: cdrHeberg,
      hebergement_pv:  Math.round(cdrHeberg * (1 + tauxMarge / 100)),
      repas_cdr:       cdrRepas,
      repas_pv:        Math.round(cdrRepas   * (1 + tauxMarge / 100)),
      transport_cdr:   cdrTransport,
      transport_pv:    0,
      taux_marge:      tauxMarge,
    },
  }
}

// ── Lecture parametres ───────────────────────────────────────────────────────
const { data: params, error: paramsErr } = await supabase
  .from('parametres')
  .select('*')
  .single()

if (paramsErr || !params) {
  console.error('❌ Erreur lecture parametres:', paramsErr?.message)
  process.exit(1)
}

console.log('\n📋 Paramètres lus :')
console.log(`  cdr_single        = ${params.cdr_single}`)
console.log(`  cdr_double        = ${params.cdr_double}`)
console.log(`  cdr_triple        = ${params.cdr_triple}`)
console.log(`  cdr_quadruple     = ${params.cdr_quadruple}`)
console.log(`  cdr_repas_complet = ${params.cdr_repas_complet}`)
console.log(`  taux_marge_famille= ${params.taux_marge_famille}`)

// ── Calculs ──────────────────────────────────────────────────────────────────
const choix1 = { nbAdultes: 2, nbEnfants: 2, nbBebes: 0, nombreNuits: 5, repas: 'complet', transport: false }
const calc1  = calculerFamille(params, choix1)

console.log('\n✅ HAZM FAMILY Standard (2A + 2E, 5N, pension complète, sans transport)')
console.log('  Chambres :', calc1.chambres.map(c => `${c.type} (${c.occupants})`).join(' + '))
console.log(`  CDR      : ${calc1.cdrTotal.toLocaleString('fr-DZ')} DA`)
console.log(`  PV       : ${calc1.pvTotal.toLocaleString('fr-DZ')} DA`)
console.log(`  Marge    : ${calc1.marge.toLocaleString('fr-DZ')} DA`)

const choix2 = { nbAdultes: 2, nbEnfants: 3, nbBebes: 0, nombreNuits: 5, repas: 'complet', transport: false }
const calc2  = calculerFamille(params, choix2)

console.log('\n✅ HAZM FAMILY Plus (2A + 3E, 5N, pension complète, sans transport)')
console.log('  Chambres :', calc2.chambres.map(c => `${c.type} (${c.occupants})`).join(' + '))
console.log(`  CDR      : ${calc2.cdrTotal.toLocaleString('fr-DZ')} DA`)
console.log(`  PV       : ${calc2.pvTotal.toLocaleString('fr-DZ')} DA`)
console.log(`  Marge    : ${calc2.marge.toLocaleString('fr-DZ')} DA`)

// ── Insertion ─────────────────────────────────────────────────────────────────
const DESCRIPTION = 'Pack famille tout inclus — hébergement + pension complète. 5 nuits / 6 jours.'

const offres = [
  {
    nom:              'HAZM FAMILY Standard',
    description:      DESCRIPTION,
    type_public:      'famille',
    actif:            true,
    places_total:     10,
    places_restantes: 10,
    nombre_nuits:     5,
    nombre_jours:     6,
    type_chambre:     'Triple',
    repas_type:       'complet',
    transport_inclus: false,
    transport_optionnel: false,
    couts_inclus:     [],
    cout_revient:     calc1.cdrTotal,
    prix_vente:       calc1.pvTotal,
    options_custom:   {
      nb_adultes: 2,
      nb_enfants: 2,
      nb_bebes:   0,
      chambres:   calc1.chambres,
      detail_cdr: calc1.detail,
    },
  },
  {
    nom:              'HAZM FAMILY Plus',
    description:      DESCRIPTION,
    type_public:      'famille',
    actif:            true,
    places_total:     10,
    places_restantes: 10,
    nombre_nuits:     5,
    nombre_jours:     6,
    type_chambre:     'Triple',
    repas_type:       'complet',
    transport_inclus: false,
    transport_optionnel: false,
    couts_inclus:     [],
    cout_revient:     calc2.cdrTotal,
    prix_vente:       calc2.pvTotal,
    options_custom:   {
      nb_adultes: 2,
      nb_enfants: 3,
      nb_bebes:   0,
      chambres:   calc2.chambres,
      detail_cdr: calc2.detail,
    },
  },
]

console.log('\n🚀 Insertion des 2 offres famille...')
for (const offre of offres) {
  const { data, error } = await supabase
    .from('offre')
    .insert(offre)
    .select('id, nom, cout_revient, prix_vente')
    .single()

  if (error) {
    console.error(`❌ Erreur insertion "${offre.nom}" :`, error.message)
    process.exit(1)
  }
  console.log(`✅ Inséré : ${data.nom}`)
  console.log(`   ID  : ${data.id}`)
  console.log(`   CDR : ${Number(data.cout_revient).toLocaleString('fr-DZ')} DA`)
  console.log(`   PV  : ${Number(data.prix_vente).toLocaleString('fr-DZ')} DA`)
}
console.log('\n🎉 Étape 1 terminée.')

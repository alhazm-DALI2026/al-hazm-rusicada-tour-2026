/**
 * Recalcule CDR/PV de toutes les offres famille avec calculerFamilleV2.
 * Usage : npx tsx scripts/recalcul-offres-famille.ts
 */

import { createClient } from '@supabase/supabase-js'
import { calculerFamilleV2 } from '../lib/calc'
import type { ChargeFamille } from '../lib/calc'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function main() {
  const { data: offres, error: e1 } = await supabase
    .from('offre')
    .select('*')
    .eq('type_public', 'famille')

  if (e1) { console.error('Erreur lecture offres:', e1.message); process.exit(1) }

  const { data: charges, error: e2 } = await supabase
    .from('charges_famille')
    .select('*')
    .order('ordre')

  if (e2) { console.error('Erreur lecture charges:', e2.message); process.exit(1) }
  if (!charges || charges.length === 0) { console.error('Aucune charge_famille trouvée.'); process.exit(1) }

  console.log(`\n  Offres famille : ${offres?.length ?? 0} | Charges : ${charges.length}\n`)
  console.log('  ' + '─'.repeat(72))

  for (const offre of offres ?? []) {
    const oc = (offre.options_custom ?? {}) as Record<string, unknown>

    const result = calculerFamilleV2(charges as ChargeFamille[], {
      nbAdultes:   Number(oc.nb_adultes   ?? offre.nb_adultes   ?? 2),
      nbEnfants:   Number(oc.nb_enfants   ?? offre.nb_enfants   ?? 0),
      nbBebes:     Number(oc.nb_bebes     ?? 0),
      nombreNuits: Number(offre.nombre_nuits ?? 5),
      repas:       (offre.repas_type ?? 'complet') as 'complet' | 'demi' | 'sans',
      transport:   Boolean(offre.transport_inclus ?? false),
    })

    const { error } = await supabase
      .from('offre')
      .update({
        cout_revient:   result.cdrTotal,
        prix_vente:     result.pvTotal,
        options_custom: { ...oc, detail_cdr: result.detail },
      })
      .eq('id', offre.id)

    if (error) {
      console.error(`  ✗ ${offre.nom} — ${error.message}`)
    } else {
      console.log(`  ✅ ${String(offre.nom).padEnd(32)} CDR: ${String(result.cdrTotal).padStart(10)} DA   PV: ${String(result.pvTotal).padStart(10)} DA   Marge: ${result.margeP}%`)
    }
  }

  console.log('  ' + '─'.repeat(72))
  console.log('  Recalcul terminé.\n')
}

main().catch(err => { console.error(err); process.exit(1) })

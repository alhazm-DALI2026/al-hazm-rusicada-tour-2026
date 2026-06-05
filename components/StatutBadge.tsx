import type { StatutReservation } from '@/types'

const CONFIG: Record<StatutReservation, { label: string; className: string }> = {
  en_attente: { label: 'En attente', className: 'bg-orange-100 text-orange-700 border-orange-300' },
  confirmee:  { label: 'Confirmée',  className: 'bg-green-100  text-green-700  border-green-300'  },
  annulee:    { label: 'Annulée',    className: 'bg-red-100    text-red-700    border-red-300'    },
}

export default function StatutBadge({ statut }: { statut: StatutReservation }) {
  const { label, className } = CONFIG[statut]
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      {label}
    </span>
  )
}

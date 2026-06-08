import type { StatutReservation } from '@/types'

const CONFIG: Record<StatutReservation, { label: string; className: string }> = {
  en_attente: { label: 'En attente', className: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/30' },
  confirmee:  { label: 'Confirmée',  className: 'bg-green-100  text-green-700  border-green-300  dark:bg-green-500/10  dark:text-green-400  dark:border-green-500/30'  },
  annulee:    { label: 'Annulée',    className: 'bg-red-100    text-red-700    border-red-300    dark:bg-red-500/10    dark:text-red-400    dark:border-red-500/30'    },
}

export default function StatutBadge({ statut }: { statut: StatutReservation }) {
  const { label, className } = CONFIG[statut]
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      {label}
    </span>
  )
}

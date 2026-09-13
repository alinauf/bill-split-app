'use client'

import { personColor, type Person } from '@/lib/bill'

interface NameChipProps {
  person: Person
  /** Filled with the person's colour when true, outlined when false. */
  on?: boolean
  size?: 'sm' | 'md'
  className?: string
}

const SIZES = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-1 text-xs',
}

/** A person's name on a coloured pill. */
export default function NameChip({ person, on = true, size = 'md', className = '' }: NameChipProps) {
  const color = personColor(person)
  return (
    <span
      title={person.name}
      className={`inline-flex items-center rounded-full font-medium select-none truncate max-w-[9rem] ${SIZES[size]} ${
        on
          ? `${color.bg} text-white`
          : `bg-white dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400`
      } ${className}`}
    >
      {person.name}
    </span>
  )
}

/** Small colour swatch used next to a name that is already written out. */
export function ColorDot({ person, className = '' }: { person: Person; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${personColor(person).bg} ${className}`}
    />
  )
}

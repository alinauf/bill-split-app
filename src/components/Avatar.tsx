'use client'

import { initials, personColor, type Person } from '@/lib/bill'

interface AvatarProps {
  person: Person
  size?: 'sm' | 'md' | 'lg'
  /** Dimmed outline style for "not included". */
  off?: boolean
  label?: string
  className?: string
}

const SIZES = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-7 h-7 text-[11px]',
  lg: 'w-9 h-9 text-xs',
}

export default function Avatar({ person, size = 'md', off = false, label, className = '' }: AvatarProps) {
  const color = personColor(person)
  return (
    <span
      title={person.name}
      aria-label={label ?? person.name}
      className={`inline-flex items-center justify-center rounded-full font-semibold select-none flex-shrink-0 ${SIZES[size]} ${
        off
          ? 'border border-dashed border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800'
          : `${color.bg} text-white`
      } ${className}`}
    >
      {initials(person.name)}
    </span>
  )
}

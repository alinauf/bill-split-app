'use client'

import React, { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { personColor, type Person } from '@/lib/bill'

interface PeopleBarProps {
  people: Person[]
  savedNames: string[]
  onAdd: (name: string) => void
  onRemove: (personId: number) => void
  onRename: (personId: number, name: string) => void
}

export default function PeopleBar({ people, savedNames, onAdd, onRemove, onRename }: PeopleBarProps) {
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')

  const suggestions = savedNames.filter((n) => !people.some((p) => p.name === n)).slice(0, 8)

  const submit = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setName('')
  }

  const commitRename = () => {
    if (editingId !== null && editingName.trim()) onRename(editingId, editingName.trim())
    setEditingId(null)
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {people.map((person) => {
          const color = personColor(person)
          if (editingId === person.id) {
            return (
              <form
                key={person.id}
                onSubmit={(e) => {
                  e.preventDefault()
                  commitRename()
                }}
                className="flex items-center gap-1"
              >
                <input
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => e.key === 'Escape' && setEditingId(null)}
                  aria-label="Rename person"
                  className="w-28 px-2 py-1 text-sm rounded-md border border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </form>
            )
          }
          return (
            <span
              key={person.id}
              className={`inline-flex items-center gap-1 pl-3 pr-1 py-1 rounded-full text-sm font-medium ${color.bg} text-white`}
            >
              <button
                type="button"
                onClick={() => {
                  setEditingId(person.id)
                  setEditingName(person.name)
                }}
                className="max-w-[9rem] truncate hover:underline"
                title="Rename"
              >
                {person.name}
              </button>
              <button
                type="button"
                onClick={() => onRemove(person.id)}
                aria-label={`Remove ${person.name}`}
                className="w-5 h-5 inline-flex items-center justify-center rounded-full hover:bg-white/25"
              >
                <X size={12} />
              </button>
            </span>
          )
        })}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
          className="flex items-center gap-1 flex-1 min-w-[10rem]"
        >
          <input
            id="new-person-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={people.length === 0 ? "Who's splitting? Add a name" : 'Add a name'}
            aria-label="Add a person"
            autoComplete="off"
            className="flex-1 min-w-0 px-3 py-1.5 text-sm rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            aria-label="Add person"
            className="w-8 h-8 inline-flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
          </button>
        </form>
      </div>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-gray-400 dark:text-gray-500">Recent:</span>
          {suggestions.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onAdd(n)}
              className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              + {n}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'

/** Returns `undefined` until mounted so server and first client render agree. */
export function useMediaQuery(query: string): boolean | undefined {
  const [matches, setMatches] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const update = () => setMatches(mql.matches)
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [query])

  return matches
}

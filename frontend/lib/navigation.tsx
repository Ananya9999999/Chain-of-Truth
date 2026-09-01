'use client'

/**
 * Workspace navigation context.
 *
 * Lets any card, button or search result move the workspace without threading
 * an `onNavigate` callback through every intermediate component — and without
 * resorting to window events, which are invisible to TypeScript and impossible
 * to trace.
 */

import { createContext, useContext } from 'react'
import type { PageKey } from '@/lib/nav'

const NavigationContext = createContext<(page: PageKey) => void>(() => {})

export const NavigationProvider = NavigationContext.Provider

export function useNavigate(): (page: PageKey) => void {
  return useContext(NavigationContext)
}

'use client'

/**
 * Theme: dark (default), light, or follow the system.
 *
 * The choice is applied by toggling `theme-light` on <html>, which flips the
 * CSS custom properties in globals.css. It is persisted per browser and, when
 * set to "system", tracks `prefers-color-scheme` live.
 *
 * A tiny blocking script (see `themeInitScript`) runs before first paint so a
 * light-theme user never sees a dark flash — that flash is the usual reason
 * theme switching feels cheap.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type ThemeChoice = 'dark' | 'light' | 'system'

const STORAGE_KEY = 'cot_theme'

/**
 * Inlined into <head>. Deliberately dependency-free and defensive: private
 * browsing can make localStorage throw, and a theme script must never be the
 * thing that stops a page rendering.
 */
export const themeInitScript = `
(function(){
  try {
    var c = localStorage.getItem('${STORAGE_KEY}') || 'dark';
    var m = window.matchMedia('(prefers-color-scheme: light)').matches;
    if (c === 'light' || (c === 'system' && m)) {
      document.documentElement.classList.add('theme-light');
    }
  } catch (e) {}
})();
`

interface ThemeValue {
  choice: ThemeChoice
  /** What is actually on screen once "system" is resolved. */
  resolved: 'dark' | 'light'
  setChoice: (c: ThemeChoice) => void
  toggle: () => void
}

const ThemeContext = createContext<ThemeValue | null>(null)

function systemPrefersLight() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: light)').matches
}

function apply(choice: ThemeChoice): 'dark' | 'light' {
  const light = choice === 'light' || (choice === 'system' && systemPrefersLight())
  document.documentElement.classList.toggle('theme-light', light)
  return light ? 'light' : 'dark'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [choice, setChoiceState] = useState<ThemeChoice>('dark')
  const [resolved, setResolved] = useState<'dark' | 'light'>('dark')

  // Adopt whatever the pre-paint script already decided.
  useEffect(() => {
    let stored: ThemeChoice = 'dark'
    try {
      stored = (localStorage.getItem(STORAGE_KEY) as ThemeChoice) || 'dark'
    } catch {
      /* storage unavailable — fall back to the default */
    }
    setChoiceState(stored)
    setResolved(apply(stored))
  }, [])

  // Only follow the OS while the user has actually asked for "system".
  useEffect(() => {
    if (choice !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = () => setResolved(apply('system'))
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [choice])

  const setChoice = useCallback((next: ThemeChoice) => {
    setChoiceState(next)
    setResolved(apply(next))
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* non-fatal: the theme still applies for this session */
    }
  }, [])

  const toggle = useCallback(() => {
    setChoice(resolved === 'dark' ? 'light' : 'dark')
  }, [resolved, setChoice])

  const value = useMemo(
    () => ({ choice, resolved, setChoice, toggle }),
    [choice, resolved, setChoice, toggle],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext)
  // A safe no-op outside the provider keeps a stray consumer from crashing the
  // page over something as cosmetic as a colour scheme.
  return (
    ctx ?? {
      choice: 'dark',
      resolved: 'dark',
      setChoice: () => {},
      toggle: () => {},
    }
  )
}

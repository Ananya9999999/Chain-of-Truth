'use client'

/**
 * Small data-fetching hooks.
 *
 * Deliberately not TanStack Query: the app needs fetch-on-mount, manual refetch
 * and a shared invalidation signal, and that is ~80 lines. Adding a cache layer
 * with its own mental model to save those lines would be a bad trade here.
 *
 * The `useCaseRefresh` broadcast is what makes one upload visibly change five
 * panels at once — confirming a contradiction bumps a counter that every
 * subscribed hook is watching, so the timeline, review queue and readiness
 * score all reload together.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

/* ------------------------------------------------------- refresh broadcast */

const RefreshContext = createContext<{ token: number; refresh: () => void }>({
  token: 0,
  refresh: () => {},
})

export function useCaseRefresh() {
  return useContext(RefreshContext)
}

export { RefreshContext }

/* ------------------------------------------------------------- async state */

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: unknown
  refetch: () => void
}

/**
 * Run `fn` on mount, whenever `deps` change, and whenever the case-wide
 * refresh token increments.
 */
export function useAsync<T>(
  fn: () => Promise<T>,
  deps: unknown[] = [],
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [local, setLocal] = useState(0)
  const { token } = useCaseRefresh()

  // Keeps a stale response from a superseded request overwriting a fresh one.
  const requestId = useRef(0)
  const fnRef = useRef(fn)
  fnRef.current = fn

  useEffect(() => {
    const id = ++requestId.current
    let cancelled = false
    setLoading(true)
    setError(null)

    fnRef
      .current()
      .then((result) => {
        if (cancelled || id !== requestId.current) return
        setData(result)
      })
      .catch((err) => {
        if (cancelled || id !== requestId.current) return
        setError(err)
      })
      .finally(() => {
        if (cancelled || id !== requestId.current) return
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, local, token])

  const refetch = useCallback(() => setLocal((n) => n + 1), [])
  return { data, loading, error, refetch }
}

/* --------------------------------------------------------------- mutations */

export interface MutationState<TArgs extends unknown[], TResult> {
  run: (...args: TArgs) => Promise<TResult | null>
  pending: boolean
  error: unknown
  result: TResult | null
  reset: () => void
}

/**
 * A write that refreshes the whole case on success.
 *
 * Every verification decision changes the timeline, the review queue and the
 * readiness score at once, so a successful mutation broadcasts rather than
 * updating one list in place.
 */
export function useMutation<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options?: { refreshCase?: boolean },
): MutationState<TArgs, TResult> {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [result, setResult] = useState<TResult | null>(null)
  const { refresh } = useCaseRefresh()

  const run = useCallback(
    async (...args: TArgs) => {
      setPending(true)
      setError(null)
      try {
        const value = await fn(...args)
        setResult(value)
        if (options?.refreshCase !== false) refresh()
        return value
      } catch (err) {
        setError(err)
        return null
      } finally {
        setPending(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fn, refresh, options?.refreshCase],
  )

  const reset = useCallback(() => {
    setError(null)
    setResult(null)
  }, [])

  return { run, pending, error, result, reset }
}

/* ----------------------------------------------------------------- polling */

/** Poll while `active`. Used to follow a running analysis job. */
export function usePolling(
  callback: () => void,
  intervalMs: number,
  active: boolean,
) {
  const cbRef = useRef(callback)
  cbRef.current = callback

  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => cbRef.current(), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs, active])
}

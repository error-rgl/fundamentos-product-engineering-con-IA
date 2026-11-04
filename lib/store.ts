'use client'

import { useCallback, useState, useSyncExternalStore } from 'react'
import { emptyState, localDate, parseBackup, type BankState, type OpResult } from './bank'

const KEY = 'banco-alimentos:v1'
const listeners = new Set<() => void>()
let cache: BankState | null = null
let loaded = false

function read(): BankState {
  if (!loaded) {
    loaded = true
    try {
      const raw = window.localStorage.getItem(KEY)
      if (raw) {
        const parsed = parseBackup(raw)
        cache = parsed.ok ? parsed.state : emptyState()
      } else cache = emptyState()
    } catch {
      cache = emptyState()
    }
  }
  return cache!
}

function emit() {
  for (const l of listeners) l()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return
    loaded = false
    read()
    emit()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

function save(next: BankState): string | null {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next))
    cache = next
    emit()
    return null
  } catch {
    return 'No se pudo guardar en este dispositivo (memoria llena o navegación privada). Exporte una copia de seguridad.'
  }
}

/** Aplica una operación sobre el estado más reciente y la guarda de forma atómica. */
export function commit(op: (state: BankState) => OpResult): OpResult {
  loaded = false
  const current = read()
  const result = op(current)
  if (!result.ok || result.duplicate) return result
  const err = save(result.state)
  if (err) return { ok: false, error: err }
  return result
}

export function replaceAll(state: BankState): string | null {
  return save(state)
}

export function useBank(): BankState | null {
  return useSyncExternalStore(subscribe, read, () => null)
}

export function useToday(): string {
  return useSyncExternalStore(
    subscribe,
    () => localDate(new Date()),
    () => '',
  )
}

/** Identificador único por intento de operación: evita duplicados por doble clic o reintentos. */
export function useOperationId(): [string, () => void] {
  const make = () =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const [id, setId] = useState(make)
  const renew = useCallback(() => setId(make()), [])
  return [id, renew]
}

export function exportBackup(state: BankState) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `banco-alimentos-respaldo-${localDate(new Date())}.json`
  a.click()
  URL.revokeObjectURL(url)
  window.localStorage.setItem(`${KEY}:lastBackup`, new Date().toISOString())
}

export function lastBackupDate(): string | null {
  try {
    return window.localStorage.getItem(`${KEY}:lastBackup`)
  } catch {
    return null
  }
}

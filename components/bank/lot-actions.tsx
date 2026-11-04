'use client'

import { useState } from 'react'
import { adjustLot, reviewLot, type Lot, type LotStatus } from '@/lib/bank'
import { commit, useOperationId } from '@/lib/store'
import { Alert, Btn, Field, TextInput } from './ui'

type Mode = null | 'review' | 'adjust'

export function LotActions({ lot, status }: { lot: Lot; status: LotStatus }) {
  const [mode, setMode] = useState<Mode>(null)
  const [reason, setReason] = useState('')
  const [user, setUser] = useState('')
  const [qty, setQty] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [opId, renew] = useOperationId()

  const needsReview = status === 'vencido' || status === 'revision'
  const close = () => {
    setMode(null)
    setError(null)
    setReason('')
    setQty('')
  }
  const finish = (r: ReturnType<typeof commit>, msg: string) => {
    if (!r.ok) return setError(r.error)
    renew()
    close()
    setDone(msg)
  }

  if (mode === null)
    return (
      <div className="flex flex-col gap-2">
        {done ? <Alert tone="success">{done}</Alert> : null}
        <div className="flex flex-wrap gap-2">
          {needsReview ? (
            <Btn onClick={() => { setDone(null); setMode('review') }}>Revisar</Btn>
          ) : null}
          <Btn variant="outline" onClick={() => { setDone(null); setQty(String(lot.quantity)); setMode('adjust') }}>
            Corregir cantidad
          </Btn>
          {!needsReview ? (
            <Btn variant="outline" onClick={() => { setDone(null); setMode('review') }}>
              Dar de baja
            </Btn>
          ) : null}
        </div>
      </div>
    )

  return (
    <div className="flex flex-col gap-3 rounded-lg border-2 bg-muted/50 p-4">
      {mode === 'review' ? (
        <p className="font-bold">
          {status === 'vencido'
            ? 'Este lote está vencido. No puede entregarse: confirme la baja para sacarlo del inventario.'
            : status === 'revision'
              ? 'Revise el producto (envase, olor, aspecto, fecha). Indique si es apto o si se da de baja.'
              : 'Dar de baja: el producto sale del inventario por estar dañado o no ser seguro.'}
        </p>
      ) : (
        <Field label="Cantidad contada ahora" hint="Escriba lo que hay realmente. Quedará registrado en el historial.">
          {(p) => <TextInput {...p} inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} />}
        </Field>
      )}
      <Field label={mode === 'review' ? '¿Qué se revisó o por qué se da de baja?' : 'Motivo de la corrección'}>
        {(p) => (
          <TextInput
            {...p}
            placeholder={mode === 'review' ? 'Ej.: envase hinchado' : 'Ej.: conteo semanal'}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        )}
      </Field>
      <Field label="Su nombre">{(p) => <TextInput {...p} value={user} onChange={(e) => setUser(e.target.value)} />}</Field>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <div className="flex flex-wrap gap-2">
        {mode === 'review' ? (
          <>
            {status === 'revision' ? (
              <Btn onClick={() => finish(commit((s) => reviewLot(s, lot.id, 'apto', reason, user, opId, new Date())), 'Lote marcado como apto.')}>
                Es apto para entregar
              </Btn>
            ) : null}
            <Btn
              variant="danger"
              onClick={() => finish(commit((s) => reviewLot(s, lot.id, 'baja', reason, user, opId, new Date())), 'Lote dado de baja y registrado.')}
            >
              Dar de baja
            </Btn>
          </>
        ) : (
          <Btn
            onClick={() =>
              finish(
                commit((s) => adjustLot(s, lot.id, Number(qty.replace(',', '.')), reason, user, opId, new Date())),
                'Cantidad corregida y registrada en el historial.',
              )
            }
          >
            Guardar corrección
          </Btn>
        )}
        <Btn variant="outline" onClick={close}>
          Cancelar
        </Btn>
      </div>
    </div>
  )
}

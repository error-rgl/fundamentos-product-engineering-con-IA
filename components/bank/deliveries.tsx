'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CheckCircle2, Plus, Trash2, Truck } from 'lucide-react'
import {
  formatDate,
  formatQty,
  getProduct,
  isoToDay,
  planDelivery,
  productLots,
  productName,
  productSummaries,
  recentDeliveryCheck,
  registerDelivery,
  isDistributable,
  STATUS_LABEL,
} from '@/lib/bank'
import { commit, useBank, useOperationId, useToday } from '@/lib/store'
import { Alert, Btn, BtnLink, Card, CardTitle, Empty, Field, PageHeader, SelectInput, TextArea, TextInput } from './ui'

interface LineDraft {
  key: string
  productId: string
  quantity: string
  lotId: string
}
let n = 0
const newLine = (p: Partial<LineDraft> = {}): LineDraft => ({ key: `l${++n}`, productId: '', quantity: '', lotId: '', ...p })

export function DeliveryForm({ initialFamily, initialItems }: { initialFamily?: string; initialItems?: string }) {
  const s = useBank()!
  const today = useToday()
  const [familyId, setFamilyId] = useState(initialFamily ?? '')
  const [volunteer, setVolunteer] = useState('')
  const [lines, setLines] = useState<LineDraft[]>(() => {
    const parsed = (initialItems ?? '')
      .split(',')
      .map((x) => x.split(':'))
      .filter(([id, q]) => id && q)
      .map(([productId, quantity]) => newLine({ productId, quantity }))
    return parsed.length ? parsed : [newLine()]
  })
  const [exceptionReason, setExceptionReason] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [doneId, setDoneId] = useState<string | null>(null)
  const [opId, renew] = useOperationId()

  if (!today) return null
  const family = s.families.find((f) => f.id === familyId)
  const check = family ? recentDeliveryCheck(s, family.id, today) : null
  const summaries = productSummaries(s, today).filter((x) => x.available > 0)
  const update = (key: string, patch: Partial<LineDraft>) => setLines(lines.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  const requestLines = lines
    .filter((l) => l.productId || l.quantity)
    .map((l) => ({ productId: l.productId, quantity: Number(l.quantity.replace(',', '.')), lotId: l.lotId || null }))
  const plan = requestLines.length ? planDelivery(s, requestLines, today) : null
  const done = doneId ? s.deliveries.find((d) => d.id === doneId) : null

  if (done) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <Alert tone="success" title={`Entrega ${done.id} registrada a la familia ${done.familyId}`}>
          <p>Se descontó del inventario:</p>
          <ul className="mt-2 list-inside list-disc">
            {done.lines.map((l, i) => (
              <li key={i}>
                {productName(s, l.productId)}: {formatQty(l.quantity, getProduct(s, l.productId)?.unit)} (lote{' '}
                {s.lots.find((x) => x.id === l.lotId)?.code})
              </li>
            ))}
          </ul>
        </Alert>
        <div className="flex flex-wrap gap-3">
          <Btn
            onClick={() => {
              renew()
              setDoneId(null)
              setFamilyId('')
              setLines([newLine()])
              setExceptionReason('')
              setNotes('')
            }}
          >
            Registrar otra entrega
          </Btn>
          <BtnLink href={`/familias/${done.familyId}`} variant="outline">
            Ver ficha de la familia
          </BtnLink>
          <BtnLink href="/" variant="outline">
            Volver al inicio
          </BtnLink>
        </div>
      </div>
    )
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    const r = commit((st) =>
      registerDelivery(st, { familyId, volunteer, lines: requestLines, exceptionReason, notes }, opId, new Date()),
    )
    setSaving(false)
    if (!r.ok) return setError(r.error)
    setError(null)
    setDoneId(r.ref)
  }

  const activeFamilies = s.families.filter((f) => f.active)

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Registrar una entrega" description="El sistema elige automáticamente los lotes que vencen antes." />
      <form onSubmit={submit} noValidate className="flex flex-col gap-6">
        <Card className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="¿Qué familia recibe?" hint="Si no aparece, regístrela primero en Familias.">
              {(p) => (
                <SelectInput {...p} value={familyId} onChange={(e) => setFamilyId(e.target.value)}>
                  <option value="">Elija una familia…</option>
                  {activeFamilies.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.id} · {f.headName} ({f.members} pers.)
                    </option>
                  ))}
                </SelectInput>
              )}
            </Field>
            <Field label="Su nombre (voluntario/a responsable)">
              {(p) => <TextInput {...p} autoComplete="name" value={volunteer} onChange={(e) => setVolunteer(e.target.value)} />}
            </Field>
          </div>
          {family && check ? (
            check.withinPeriod ? (
              <Alert tone="warning" title="Esta familia ya recibió ayuda hace poco">
                <p>
                  Última entrega: {formatDate(isoToDay(check.last!.date))} (hace {check.daysAgo} día(s)). Solo se puede entregar de nuevo
                  si hay una necesidad que lo justifique.
                </p>
                <Field label="¿Por qué necesita otra entrega ahora?" className="mt-3">
                  {(p) => (
                    <TextInput
                      {...p}
                      placeholder="Ej.: se sumó un familiar enfermo"
                      value={exceptionReason}
                      onChange={(e) => setExceptionReason(e.target.value)}
                    />
                  )}
                </Field>
              </Alert>
            ) : (
              <p className="text-muted-foreground">
                {check.last
                  ? `Última entrega: ${formatDate(isoToDay(check.last.date))} (hace ${check.daysAgo} días).`
                  : 'Esta familia nunca ha recibido ayuda.'}
              </p>
            )
          ) : null}
        </Card>

        <Card className="flex flex-col gap-4">
          <CardTitle>¿Qué se entrega?</CardTitle>
          {summaries.length === 0 ? <Alert tone="warning">No hay productos aptos disponibles para entregar.</Alert> : null}
          {lines.map((l, i) => {
            const prod = getProduct(s, l.productId)
            const available = summaries.find((x) => x.product.id === l.productId)?.available ?? 0
            const lots = l.productId ? productLots(s, l.productId, today).filter((x) => x.lot.quantity > 0) : []
            return (
              <fieldset key={l.key} className="flex flex-col gap-3 rounded-lg border-2 bg-muted/50 p-4">
                <legend className="px-2 font-bold">Producto {i + 1}</legend>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
                  <Field label="Producto">
                    {(p) => (
                      <SelectInput {...p} value={l.productId} onChange={(e) => update(l.key, { productId: e.target.value, lotId: '' })}>
                        <option value="">Elija…</option>
                        {summaries.map((x) => (
                          <option key={x.product.id} value={x.product.id}>
                            {x.product.name} (hay {formatQty(x.available, x.product.unit)})
                          </option>
                        ))}
                      </SelectInput>
                    )}
                  </Field>
                  <Field label={`Cantidad${prod ? ` (${prod.unit})` : ''}`} hint={prod ? `Máximo ${formatQty(available)}` : undefined}>
                    {(p) => (
                      <TextInput {...p} inputMode="decimal" value={l.quantity} onChange={(e) => update(l.key, { quantity: e.target.value })} />
                    )}
                  </Field>
                </div>
                {lots.length > 1 ? (
                  <Field label="Lote" hint="Déjelo en automático: sale primero lo que vence antes.">
                    {(p) => (
                      <SelectInput {...p} value={l.lotId} onChange={(e) => update(l.key, { lotId: e.target.value })}>
                        <option value="">Automático (recomendado)</option>
                        {lots.map(({ lot, status }) => (
                          <option key={lot.id} value={lot.id} disabled={!isDistributable(status)}>
                            Lote {lot.code} · {formatQty(lot.quantity)} · vence {lot.expiry ? formatDate(lot.expiry) : 'sin fecha'}
                            {!isDistributable(status) ? ` · ${STATUS_LABEL[status]}: no se puede entregar` : ''}
                          </option>
                        ))}
                      </SelectInput>
                    )}
                  </Field>
                ) : null}
                {lines.length > 1 ? (
                  <Btn variant="outline" className="self-start" onClick={() => setLines(lines.filter((x) => x.key !== l.key))}>
                    <Trash2 aria-hidden="true" />
                    Quitar
                  </Btn>
                ) : null}
              </fieldset>
            )
          })}
          <Btn variant="outline" className="self-start" onClick={() => setLines([...lines, newLine()])}>
            <Plus aria-hidden="true" />
            Agregar otro producto
          </Btn>
          {plan?.ok ? (
            <div className="rounded-lg border-2 border-primary/40 bg-secondary p-4">
              <p className="font-bold">Se sacará de estos lotes:</p>
              <ul className="mt-1 list-inside list-disc">
                {plan.lines.map((pl, i) => {
                  const lot = s.lots.find((x) => x.id === pl.lotId)!
                  return (
                    <li key={i}>
                      {productName(s, pl.productId)}: {formatQty(pl.quantity, getProduct(s, pl.productId)?.unit)} del lote {lot.code}
                      {lot.expiry ? ` (vence ${formatDate(lot.expiry)})` : ''}
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : plan && requestLines.every((r) => r.productId && r.quantity) ? (
            <Alert tone="warning">{plan.error}</Alert>
          ) : null}
        </Card>

        <Field label="Notas (opcional)">{(p) => <TextArea {...p} value={notes} onChange={(e) => setNotes(e.target.value)} />}</Field>

        {error ? <Alert tone="error" title="No se pudo registrar">{error}</Alert> : null}

        <div className="sticky bottom-0 -mx-4 flex flex-wrap gap-3 border-t-2 bg-background/95 px-4 py-4">
          <Btn type="submit" disabled={saving} className="min-h-14 flex-1 text-lg sm:flex-none">
            <CheckCircle2 aria-hidden="true" />
            {saving ? 'Guardando…' : 'Confirmar entrega'}
          </Btn>
          <BtnLink href="/entregas" variant="outline" className="min-h-14">
            Cancelar
          </BtnLink>
        </div>
      </form>
    </div>
  )
}

export function DeliveriesList() {
  const s = useBank()!
  const list = [...s.deliveries].sort((a, b) => (a.date < b.date ? 1 : -1))
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Entregas"
        description="Historial de todo lo entregado, con familia, lotes y responsable."
        actions={
          <BtnLink href="/entregas/nueva">
            <Truck aria-hidden="true" />
            Registrar una entrega
          </BtnLink>
        }
      />
      {list.length === 0 ? (
        <Empty>Todavía no se registró ninguna entrega.</Empty>
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((d) => {
            const f = s.families.find((x) => x.id === d.familyId)
            return (
              <li key={d.id}>
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h2 className="text-lg font-bold">
                      <Link href={`/familias/${d.familyId}`} className="underline-offset-4 hover:underline">
                        {d.familyId} · {f?.headName ?? 'Familia'}
                      </Link>
                    </h2>
                    <span className="text-muted-foreground">
                      {formatDate(d.date)} · {d.id}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Responsable: {d.volunteer}</p>
                  <ul className="mt-2 list-inside list-disc">
                    {d.lines.map((l, i) => (
                      <li key={i}>
                        {productName(s, l.productId)}: {formatQty(l.quantity, getProduct(s, l.productId)?.unit)}{' '}
                        <span className="text-muted-foreground">(lote {s.lots.find((x) => x.id === l.lotId)?.code})</span>
                      </li>
                    ))}
                  </ul>
                  {d.exceptionReason ? <p className="mt-2 font-bold text-warning">Excepción: {d.exceptionReason}</p> : null}
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

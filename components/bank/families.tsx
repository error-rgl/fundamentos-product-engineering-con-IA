'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Search, Truck, UserPlus } from 'lucide-react'
import {
  addFamily,
  familyDeliveries,
  findSimilarFamilies,
  formatDate,
  formatQty,
  getProduct,
  isoToDay,
  productName,
  recentDeliveryCheck,
  searchFamilies,
  updateFamily,
  type Family,
} from '@/lib/bank'
import { commit, useBank, useOperationId, useToday } from '@/lib/store'
import { Alert, Btn, BtnLink, Card, CardTitle, Empty, Field, PageHeader, TextArea, TextInput } from './ui'

export function FamiliesList() {
  const s = useBank()!
  const today = useToday()
  const [query, setQuery] = useState('')
  if (!today) return null
  const results = searchFamilies(s, query)
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Familias"
        description="Busque por número de familia (ej.: F001) o por nombre."
        actions={
          <BtnLink href="/familias/nueva">
            <UserPlus aria-hidden="true" />
            Registrar familia
          </BtnLink>
        }
      />
      <div role="search" className="flex flex-col gap-1.5">
        <label htmlFor="buscar" className="text-lg font-bold">
          Buscar una familia
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-6 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <TextInput
            id="buscar"
            type="search"
            autoFocus
            placeholder="F001 o María"
            className="min-h-14 pl-12 text-lg"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>
      <p aria-live="polite" className="text-muted-foreground">
        {results.length} familia(s) encontrada(s)
      </p>
      {results.length === 0 ? (
        <Empty>No se encontró ninguna familia. Revise lo escrito o regístrela.</Empty>
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {results.map((f) => {
            const check = recentDeliveryCheck(s, f.id, today)
            return (
              <li key={f.id}>
                <Card className="flex h-full flex-col gap-3">
                  <Link href={`/familias/${f.id}`} className="underline-offset-4 hover:underline">
                    <span className="text-xl font-bold">
                      {f.id} · {f.headName}
                    </span>
                  </Link>
                  <p>
                    {f.members} integrante(s){!f.active ? ' · Inactiva' : ''}
                    {f.priorityNeed ? ` · Necesidad: ${f.priorityNeed}` : ''}
                  </p>
                  <p className={check.withinPeriod ? 'font-bold text-warning' : 'text-muted-foreground'}>
                    {check.last
                      ? `Última ayuda: ${formatDate(isoToDay(check.last.date))} (hace ${check.daysAgo} días)`
                      : 'Nunca ha recibido ayuda'}
                  </p>
                  {f.active ? (
                    <BtnLink href={`/entregas/nueva?familia=${f.id}`} variant="outline" className="mt-auto self-start">
                      <Truck aria-hidden="true" />
                      Registrar entrega
                    </BtnLink>
                  ) : null}
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function FamilyFields({
  value,
  onChange,
}: {
  value: { headName: string; members: string; contact: string; priorityNeed: string; notes: string }
  onChange: (patch: Partial<typeof value>) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Field label="Nombre de la persona responsable">
        {(p) => <TextInput {...p} value={value.headName} onChange={(e) => onChange({ headName: e.target.value })} />}
      </Field>
      <Field label="¿Cuántas personas viven en el hogar?">
        {(p) => (
          <TextInput {...p} inputMode="numeric" value={value.members} onChange={(e) => onChange({ members: e.target.value })} />
        )}
      </Field>
      <Field label="Teléfono o forma de contacto (opcional)" hint="Solo si hace falta avisarles.">
        {(p) => <TextInput {...p} value={value.contact} onChange={(e) => onChange({ contact: e.target.value })} />}
      </Field>
      <Field
        label="Necesidad justificada (opcional)"
        hint="Ej.: bebé, enfermedad, sin ingresos. Da prioridad en el reparto. Solo lo necesario."
      >
        {(p) => <TextInput {...p} value={value.priorityNeed} onChange={(e) => onChange({ priorityNeed: e.target.value })} />}
      </Field>
      <Field label="Observaciones (opcional)" className="md:col-span-2">
        {(p) => <TextArea {...p} value={value.notes} onChange={(e) => onChange({ notes: e.target.value })} />}
      </Field>
    </div>
  )
}

export function NewFamilyForm() {
  const s = useBank()!
  const router = useRouter()
  const [v, setV] = useState({ headName: '', members: '', contact: '', priorityNeed: '', notes: '' })
  const [error, setError] = useState<string | null>(null)
  const [confirmDup, setConfirmDup] = useState(false)
  const [saving, setSaving] = useState(false)
  const [opId] = useOperationId()
  const similar = findSimilarFamilies(s, v.headName)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (saving) return
    if (similar.length && !confirmDup) {
      setError(null)
      return
    }
    setSaving(true)
    const r = commit((st) =>
      addFamily(st, { ...v, members: Number(v.members) }, opId, new Date()),
    )
    if (!r.ok) {
      setSaving(false)
      return setError(r.error)
    }
    router.push(`/familias/${r.ref}?nueva=1`)
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Registrar una familia"
        description="Se le asignará un número (ej.: F007). Anote solo los datos necesarios para organizar la ayuda."
      />
      <form onSubmit={submit} noValidate className="flex flex-col gap-6">
        <Card>
          <FamilyFields value={v} onChange={(patch) => { setV({ ...v, ...patch }); setConfirmDup(false) }} />
        </Card>
        {similar.length ? (
          <Alert tone="warning" title="Ya hay una familia con ese nombre">
            <p>
              {similar.map((f) => (
                <Link key={f.id} href={`/familias/${f.id}`} className="mr-2 font-bold underline">
                  {f.id} · {f.headName}
                </Link>
              ))}
            </p>
            <label className="mt-2 flex min-h-11 cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                className="size-6 accent-[var(--primary)]"
                checked={confirmDup}
                onChange={(e) => setConfirmDup(e.target.checked)}
              />
              Es otra familia distinta, registrarla igualmente
            </label>
          </Alert>
        ) : null}
        {error ? <Alert tone="error">{error}</Alert> : null}
        <div className="flex flex-wrap gap-3">
          <Btn type="submit" className="min-h-14 text-lg" disabled={saving || (similar.length > 0 && !confirmDup)}>
            {saving ? 'Guardando…' : 'Guardar familia'}
          </Btn>
          <BtnLink href="/familias" variant="outline" className="min-h-14">
            Cancelar
          </BtnLink>
        </div>
      </form>
    </div>
  )
}

export function FamilyDetail({ familyId, isNew }: { familyId: string; isNew: boolean }) {
  const s = useBank()!
  const today = useToday()
  const family = s.families.find((f) => f.id === familyId)
  if (!today) return null
  if (!family)
    return (
      <Alert tone="error" title="Familia no encontrada">
        <Link href="/familias" className="underline">
          Volver a familias
        </Link>
      </Alert>
    )
  const deliveries = familyDeliveries(s, family.id)
  const check = recentDeliveryCheck(s, family.id, today)
  return (
    <div className="flex flex-col gap-6">
      {isNew ? (
        <Alert tone="success" title={`Familia registrada con el número ${family.id}`}>
          Anote este número en la tarjeta de la familia.
        </Alert>
      ) : null}
      <PageHeader
        title={`${family.id} · ${family.headName}`}
        description={`${family.members} integrante(s) · registrada el ${formatDate(family.registeredAt)}${family.active ? '' : ' · Inactiva'}`}
        actions={
          family.active ? (
            <BtnLink href={`/entregas/nueva?familia=${family.id}`}>
              <Truck aria-hidden="true" />
              Registrar entrega
            </BtnLink>
          ) : undefined
        }
      />
      {check.withinPeriod ? (
        <Alert tone="warning" title="Recibió ayuda recientemente">
          Última entrega el {formatDate(isoToDay(check.last!.date))}, hace {check.daysAgo} día(s). El periodo de referencia es de{' '}
          {s.settings.recentPeriodDays} días.
        </Alert>
      ) : null}
      <FamilyEditor family={family} />
      <Card>
        <CardTitle>Historial de entregas ({deliveries.length})</CardTitle>
        {deliveries.length === 0 ? (
          <Empty>Esta familia todavía no ha recibido ninguna entrega.</Empty>
        ) : (
          <ul className="flex flex-col gap-3">
            {deliveries.map((d) => (
              <li key={d.id} className="rounded-lg border-2 p-4">
                <p className="font-bold">
                  {formatDate(d.date)} · entrega {d.id} · voluntario/a: {d.volunteer}
                </p>
                <ul className="mt-1 list-inside list-disc">
                  {d.lines.map((l, i) => (
                    <li key={i}>
                      {productName(s, l.productId)}: {formatQty(l.quantity, getProduct(s, l.productId)?.unit)}{' '}
                      <span className="text-muted-foreground">(lote {s.lots.find((x) => x.id === l.lotId)?.code})</span>
                    </li>
                  ))}
                </ul>
                {d.exceptionReason ? <p className="mt-1 font-bold text-warning">Excepción justificada: {d.exceptionReason}</p> : null}
                {d.notes ? <p className="mt-1 text-muted-foreground">Notas: {d.notes}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

function FamilyEditor({ family }: { family: Family }) {
  const [open, setOpen] = useState(false)
  const [v, setV] = useState({
    headName: family.headName,
    members: String(family.members),
    contact: family.contact,
    priorityNeed: family.priorityNeed,
    notes: family.notes,
  })
  const [active, setActive] = useState(family.active)
  const [error, setError] = useState<string | null>(null)

  if (!open)
    return (
      <Card>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-sm font-bold text-muted-foreground">Contacto</dt>
            <dd>{family.contact || '—'}</dd>
          </div>
          <div>
            <dt className="text-sm font-bold text-muted-foreground">Necesidad justificada</dt>
            <dd>{family.priorityNeed || '—'}</dd>
          </div>
          <div>
            <dt className="text-sm font-bold text-muted-foreground">Observaciones</dt>
            <dd>{family.notes || '—'}</dd>
          </div>
        </dl>
        <Btn variant="outline" className="mt-4" onClick={() => setOpen(true)}>
          Editar datos
        </Btn>
      </Card>
    )

  const save = () => {
    const r = commit((s) => updateFamily(s, family.id, { ...v, members: Number(v.members), active }))
    if (!r.ok) return setError(r.error)
    setError(null)
    setOpen(false)
  }
  return (
    <Card className="flex flex-col gap-4">
      <FamilyFields value={v} onChange={(patch) => setV({ ...v, ...patch })} />
      <label className="flex min-h-11 cursor-pointer items-center gap-3">
        <input type="checkbox" className="size-6 accent-[var(--primary)]" checked={active} onChange={(e) => setActive(e.target.checked)} />
        Familia activa (desmarque si ya no necesita ayuda o se mudó)
      </label>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <div className="flex flex-wrap gap-3">
        <Btn onClick={save}>Guardar cambios</Btn>
        <Btn variant="outline" onClick={() => setOpen(false)}>
          Cancelar
        </Btn>
      </div>
    </Card>
  )
}

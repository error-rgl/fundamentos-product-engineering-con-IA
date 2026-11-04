'use client'

import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { formatQty, productName, registerDonation, getProduct } from '@/lib/bank'
import { commit, useBank, useOperationId } from '@/lib/store'
import { Alert, Btn, BtnLink, Card, Field, PageHeader, TextArea, TextInput } from './ui'
import { DonationItemsEditor, draftToItem, missingExpiry, newItemDraft, type ItemDraft } from './donation-items-editor'

export function DonationForm() {
  const s = useBank()!
  const [status, setStatus] = useState<'recibida' | 'prevista'>('recibida')
  const [donor, setDonor] = useState('')
  const [receivedBy, setReceivedBy] = useState('')
  const [expectedDate, setExpectedDate] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<ItemDraft[]>(() => [newItemDraft()])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [opId, renewOp] = useOperationId()

  const saved = savedId ? s.donations.find((d) => d.id === savedId) : null

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    const missing = status === 'recibida' ? missingExpiry(items) : null
    if (missing) {
      setError(missing)
      setSaving(false)
      return
    }
    const r = commit((st) =>
      registerDonation(
        st,
        {
          donor,
          status,
          expectedDate: expectedDate || null,
          receivedBy,
          items: items.map(draftToItem),
          notes,
        },
        opId,
        new Date(),
      ),
    )
    setSaving(false)
    if (!r.ok) {
      setError(r.error)
      return
    }
    setError(null)
    setSavedId(r.ref)
  }

  const reset = () => {
    renewOp()
    setSavedId(null)
    setDonor('')
    setNotes('')
    setExpectedDate('')
    setItems([newItemDraft()])
  }

  if (saved) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <Alert tone="success" title={saved.status === 'recibida' ? 'Donación guardada y sumada al inventario' : 'Donación prevista guardada'}>
          <p>
            {saved.status === 'recibida'
              ? 'Estos productos ya cuentan en el inventario:'
              : 'Cuando llegue, confírmela en la lista de donaciones para sumarla al inventario.'}
          </p>
          <ul className="mt-2 list-inside list-disc">
            {saved.items.map((i, idx) => (
              <li key={idx}>
                {productName(s, i.productId)}: {formatQty(i.quantity, getProduct(s, i.productId)?.unit)}
                {i.condition === 'no_apto' ? ' (dañado: no se sumó)' : i.condition === 'revision' ? ' (pendiente de revisión)' : ''}
              </li>
            ))}
          </ul>
        </Alert>
        <div className="flex flex-wrap gap-3">
          <Btn onClick={reset}>Registrar otra donación</Btn>
          <BtnLink href="/" variant="outline">
            Volver al inicio
          </BtnLink>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Registrar una donación" description="Complete los datos y pulse «Guardar donación» al final." />
      <form onSubmit={submit} className="flex flex-col gap-6" noValidate>
        <Card className="flex flex-col gap-5">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-base font-bold">¿La donación ya llegó?</legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(
                [
                  ['recibida', 'Sí, la tengo aquí', 'Se suma al inventario al guardar.'],
                  ['prevista', 'No, va a llegar', 'Se anota como prevista. No suma hasta confirmarla.'],
                ] as const
              ).map(([value, label, hint]) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 has-[:checked]:border-primary has-[:checked]:bg-secondary"
                >
                  <input
                    type="radio"
                    name="status"
                    value={value}
                    checked={status === value}
                    onChange={() => setStatus(value)}
                    className="mt-1 size-5 accent-[var(--primary)]"
                  />
                  <span>
                    <span className="block font-bold">{label}</span>
                    <span className="text-sm text-muted-foreground">{hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="¿Quién dona? (opcional)">
              {(p) => <TextInput {...p} placeholder="Ej.: Panadería Sol" value={donor} onChange={(e) => setDonor(e.target.value)} />}
            </Field>
            {status === 'recibida' ? (
              <Field label="Su nombre (quien recibe)">
                {(p) => <TextInput {...p} autoComplete="name" value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} />}
              </Field>
            ) : (
              <Field label="¿Cuándo se espera? (opcional)">
                {(p) => <TextInput {...p} type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />}
              </Field>
            )}
          </div>
        </Card>

        <DonationItemsEditor items={items} onChange={setItems} requireExpiry={status === 'recibida'} />

        <Field label="Notas generales (opcional)">
          {(p) => <TextArea {...p} value={notes} onChange={(e) => setNotes(e.target.value)} />}
        </Field>

        {error ? <Alert tone="error" title="Falta corregir algo">{error}</Alert> : null}

        <div className="sticky bottom-0 -mx-4 flex flex-wrap gap-3 border-t-2 bg-background/95 px-4 py-4">
          <Btn type="submit" disabled={saving} className="min-h-14 flex-1 text-lg sm:flex-none">
            <CheckCircle2 aria-hidden="true" />
            {saving ? 'Guardando…' : 'Guardar donación'}
          </Btn>
          <BtnLink href="/donaciones" variant="outline" className="min-h-14">
            Cancelar
          </BtnLink>
        </div>
      </form>
    </div>
  )
}

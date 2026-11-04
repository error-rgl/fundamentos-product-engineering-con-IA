'use client'

import { useState } from 'react'
import { PackagePlus } from 'lucide-react'
import { cancelDonation, confirmDonation, formatDate, formatQty, getProduct, productName, type Donation } from '@/lib/bank'
import { commit, useBank, useOperationId } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Alert, Btn, BtnLink, Card, Empty, Field, PageHeader, TextInput } from './ui'
import { DonationItemsEditor, draftToItem, missingExpiry, newItemDraft, type ItemDraft } from './donation-items-editor'

export function DonationsList() {
  const s = useBank()!
  const pending = s.donations.filter((d) => d.status === 'prevista')
  const received = s.donations.filter((d) => d.status === 'recibida').sort((a, b) => (a.receivedAt! < b.receivedAt! ? 1 : -1))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Donaciones"
        description="Las donaciones previstas no suman al inventario hasta que se confirma su llegada."
        actions={
          <BtnLink href="/donaciones/nueva">
            <PackagePlus aria-hidden="true" />
            Registrar una donación
          </BtnLink>
        }
      />
      <section aria-labelledby="previstas" className="flex flex-col gap-3">
        <h2 id="previstas" className="text-2xl font-bold">
          Previstas ({pending.length})
        </h2>
        {pending.length === 0 ? <Empty>No hay donaciones previstas.</Empty> : pending.map((d) => <PendingDonation key={d.id} donation={d} />)}
      </section>
      <section aria-labelledby="recibidas" className="flex flex-col gap-3">
        <h2 id="recibidas" className="text-2xl font-bold">
          Recibidas ({received.length})
        </h2>
        {received.length === 0 ? (
          <Empty>Aún no se ha recibido ninguna donación.</Empty>
        ) : (
          received.map((d) => <DonationCard key={d.id} donation={d} />)
        )}
      </section>
    </div>
  )
}

function DonationCard({ donation: d, children }: { donation: Donation; children?: React.ReactNode }) {
  const s = useBank()!
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">
            {d.donor || 'Donante anónimo'} <span className="font-normal text-muted-foreground">· {d.id}</span>
          </h3>
          <p className="text-sm text-muted-foreground">
            {d.status === 'recibida'
              ? `Recibida el ${formatDate(d.receivedAt)}${d.receivedBy ? ` por ${d.receivedBy}` : ''}`
              : `Anotada el ${formatDate(d.createdAt)}${d.expectedDate ? ` · se espera el ${formatDate(d.expectedDate)}` : ''}`}
          </p>
        </div>
        <span
          className={cn(
            'rounded-md border px-2 py-0.5 text-sm font-bold',
            d.status === 'recibida' ? 'border-success/40 bg-success-soft text-success' : 'border-warning/50 bg-warning-soft text-warning',
          )}
        >
          {d.status === 'recibida' ? 'Recibida' : 'Prevista'}
        </span>
      </div>
      <ul className="mt-3 flex flex-col gap-1">
        {d.items.map((i, idx) => (
          <li key={idx}>
            <span className="font-bold">{productName(s, i.productId)}</span>: {formatQty(i.quantity, getProduct(s, i.productId)?.unit)}
            {d.status === 'recibida' ? (
              <span className="text-muted-foreground">
                {' '}
                · vence {i.expiry ? formatDate(i.expiry) : 'sin fecha'}
                {i.condition === 'no_apto' ? ' · dañado, no se sumó' : i.condition === 'revision' ? ' · en revisión' : ''}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      {d.notes ? <p className="mt-2 text-muted-foreground">Notas: {d.notes}</p> : null}
      {children}
    </Card>
  )
}

function PendingDonation({ donation }: { donation: Donation }) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<ItemDraft[]>([])
  const [receivedBy, setReceivedBy] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [opId] = useOperationId()

  const start = () => {
    setItems(
      donation.items.map((i) =>
        newItemDraft({ productId: i.productId, quantity: String(i.quantity), lotCode: i.lotCode, notes: i.notes }),
      ),
    )
    setOpen(true)
  }

  const confirm = () => {
    if (saving) return
    const missing = missingExpiry(items)
    if (missing) return setError(missing)
    setSaving(true)
    const r = commit((st) => confirmDonation(st, donation.id, { items: items.map(draftToItem), receivedBy }, opId, new Date()))
    setSaving(false)
    if (!r.ok) setError(r.error)
  }

  return (
    <DonationCard donation={donation}>
      {!open ? (
        <div className="mt-4 flex flex-wrap gap-3">
          <Btn onClick={start}>Ya llegó: confirmar recepción</Btn>
          <Btn
            variant="outline"
            onClick={() => {
              if (window.confirm('¿Eliminar esta donación prevista? No llegó o fue un error.')) commit((st) => cancelDonation(st, donation.id))
            }}
          >
            No llegó: eliminar
          </Btn>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-4 border-t-2 pt-4">
          <p className="font-bold">Revise lo que realmente llegó y corrija las cantidades si hace falta.</p>
          <DonationItemsEditor items={items} onChange={setItems} requireExpiry />
          <Field label="Su nombre (quien recibe)">
            {(p) => <TextInput {...p} value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} />}
          </Field>
          {error ? <Alert tone="error">{error}</Alert> : null}
          <div className="flex flex-wrap gap-3">
            <Btn onClick={confirm} disabled={saving}>
              {saving ? 'Guardando…' : 'Confirmar y sumar al inventario'}
            </Btn>
            <Btn variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Btn>
          </div>
        </div>
      )}
    </DonationCard>
  )
}

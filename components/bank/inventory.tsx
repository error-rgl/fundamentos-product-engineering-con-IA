'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CalendarClock, PackagePlus } from 'lucide-react'
import {
  attentionLots,
  CATEGORIES,
  daysBetween,
  formatDate,
  formatQty,
  getProduct,
  productLots,
  productName,
  productSummaries,
  updateProduct,
  type MovementType,
} from '@/lib/bank'
import { commit, useBank, useToday } from '@/lib/store'
import { Alert, Btn, BtnLink, Card, CardTitle, Empty, Field, PageHeader, SelectInput, StatusBadge, TextInput } from './ui'
import { QuickAddProduct } from './donation-items-editor'
import { LotActions } from './lot-actions'

function expiryText(expiry: string | null, today: string) {
  if (!expiry) return 'Sin fecha conocida'
  const d = daysBetween(today, expiry)
  if (d < 0) return `Venció el ${formatDate(expiry)} (hace ${-d} días)`
  if (d === 0) return `Vence hoy (${formatDate(expiry)})`
  return `Vence el ${formatDate(expiry)} (en ${d} días)`
}

export function InventoryList() {
  const s = useBank()!
  const today = useToday()
  if (!today) return null
  const summaries = productSummaries(s, today)
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Inventario"
        description="Los lotes aparecen en el orden en que deben salir: primero el que vence antes."
        actions={
          <>
            <BtnLink href="/inventario/vencimientos" variant="outline">
              <CalendarClock aria-hidden="true" />
              Por vencer y revisión
            </BtnLink>
            <BtnLink href="/donaciones/nueva">
              <PackagePlus aria-hidden="true" />
              Registrar donación
            </BtnLink>
          </>
        }
      />
      <QuickAddProduct />
      {summaries.length === 0 ? (
        <Empty>No hay productos. Registre una donación para empezar.</Empty>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {summaries.map((x) => (
            <Card key={x.product.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">
                    <Link href={`/inventario/${x.product.id}`} className="underline-offset-4 hover:underline">
                      {x.product.name}
                    </Link>
                  </h2>
                  <p className="text-sm text-muted-foreground">{x.product.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold tabular-nums">{formatQty(x.available)}</p>
                  <p className="text-sm text-muted-foreground">{x.product.unit} para entregar</p>
                </div>
              </div>
              {x.product.minStock > 0 && x.available < x.product.minStock ? (
                <p className="mt-2 font-bold text-destructive">
                  Escaso: se desean al menos {formatQty(x.product.minStock, x.product.unit)}
                </p>
              ) : null}
              {x.lots.length === 0 ? (
                <p className="mt-3 text-muted-foreground">Sin existencias.</p>
              ) : (
                <ol className="mt-3 flex flex-col divide-y border-t">
                  {x.lots.map(({ lot, status }, i) => (
                    <li key={lot.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <span>
                        <span className="font-bold">
                          {i + 1}. Lote {lot.code}
                        </span>{' '}
                        · {formatQty(lot.quantity, x.product.unit)}
                        <span className="block text-sm text-muted-foreground">{expiryText(lot.expiry, today)}</span>
                      </span>
                      <StatusBadge status={status} />
                    </li>
                  ))}
                </ol>
              )}
              <Link href={`/inventario/${x.product.id}`} className="mt-3 inline-block font-bold text-primary underline">
                Ver detalle e historial
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export function ExpiryView() {
  const s = useBank()!
  const today = useToday()
  if (!today) return null
  const items = attentionLots(s, today)
  const groups = [
    { title: 'Vencidos: no entregar', items: items.filter((x) => x.status === 'vencido') },
    { title: 'Pendientes de revisión', items: items.filter((x) => x.status === 'revision') },
    { title: `Vencen en los próximos ${s.settings.nearExpiryDays} días: entregar primero`, items: items.filter((x) => x.status === 'por_vencer') },
  ]
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Alimentos por vencer y revisión"
        description="Los vencidos y dudosos quedan fuera de las entregas hasta que se revisen."
      />
      {groups.map((g) => (
        <section key={g.title} className="flex flex-col gap-3">
          <h2 className="text-2xl font-bold">
            {g.title} ({g.items.length})
          </h2>
          {g.items.length === 0 ? (
            <Empty>Nada en este grupo.</Empty>
          ) : (
            g.items.map(({ lot, status }) => (
              <Card key={lot.id} className="flex flex-col gap-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold">
                      {productName(s, lot.productId)} · lote {lot.code}
                    </h3>
                    <p>
                      {formatQty(lot.quantity, getProduct(s, lot.productId)?.unit)} · {expiryText(lot.expiry, today)}
                    </p>
                    {lot.notes ? <p className="text-sm text-muted-foreground">Notas: {lot.notes}</p> : null}
                  </div>
                  <StatusBadge status={status} />
                </div>
                <LotActions lot={lot} status={status} />
              </Card>
            ))
          )}
        </section>
      ))}
    </div>
  )
}

const MOVE_LABEL: Record<MovementType, string> = {
  entrada: 'Entrada',
  salida: 'Salida',
  ajuste: 'Corrección',
  baja: 'Baja',
  revision: 'Revisión',
}

export function ProductDetail({ productId }: { productId: string }) {
  const s = useBank()!
  const today = useToday()
  const product = getProduct(s, productId)
  if (!today) return null
  if (!product)
    return (
      <Alert tone="error" title="Producto no encontrado">
        <Link href="/inventario" className="underline">
          Volver al inventario
        </Link>
      </Alert>
    )
  const lots = productLots(s, productId, today)
  const moves = s.movements.filter((m) => m.productId === productId).sort((a, b) => (a.date < b.date ? 1 : -1))
  const lotCode = (id: string | null) => s.lots.find((l) => l.id === id)?.code ?? '—'

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={product.name} description={`${product.category} · medido en ${product.unit}`} />
      <ProductEditor productId={productId} />
      <Card>
        <CardTitle>Lotes en orden de salida (vence primero, sale primero)</CardTitle>
        {lots.length === 0 ? (
          <Empty>No hay existencias de este producto.</Empty>
        ) : (
          <ol className="flex flex-col gap-4">
            {lots.map(({ lot, status }, i) => (
              <li key={lot.id} className="flex flex-col gap-3 rounded-lg border-2 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-lg font-bold">
                      {i + 1}. Lote {lot.code} · {formatQty(lot.quantity, product.unit)}
                    </p>
                    <p>{expiryText(lot.expiry, today)}</p>
                    <p className="text-sm text-muted-foreground">Recibido el {formatDate(lot.receivedAt)}</p>
                  </div>
                  <StatusBadge status={status} />
                </div>
                <LotActions lot={lot} status={status} />
              </li>
            ))}
          </ol>
        )}
      </Card>
      <Card>
        <CardTitle>Historial de movimientos</CardTitle>
        {moves.length === 0 ? (
          <Empty>Sin movimientos.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b-2 text-sm text-muted-foreground">
                  <th className="py-2 pr-3 font-bold">Fecha</th>
                  <th className="py-2 pr-3 font-bold">Tipo</th>
                  <th className="py-2 pr-3 font-bold">Lote</th>
                  <th className="py-2 pr-3 text-right font-bold">Cantidad</th>
                  <th className="py-2 pr-3 text-right font-bold">Queda</th>
                  <th className="py-2 font-bold">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {moves.map((m) => (
                  <tr key={m.id} className="border-b align-top last:border-0">
                    <td className="py-2 pr-3 whitespace-nowrap">{formatDate(m.date)}</td>
                    <td className="py-2 pr-3 font-bold">{MOVE_LABEL[m.type]}</td>
                    <td className="py-2 pr-3">{lotCode(m.lotId)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{m.quantity > 0 ? `+${formatQty(m.quantity)}` : formatQty(m.quantity)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{formatQty(m.balance)}</td>
                    <td className="py-2 text-sm">
                      {m.reason}
                      {m.user ? <span className="text-muted-foreground"> · {m.user}</span> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

function ProductEditor({ productId }: { productId: string }) {
  const s = useBank()!
  const p = getProduct(s, productId)!
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(p.name)
  const [category, setCategory] = useState(p.category)
  const [unit, setUnit] = useState(p.unit)
  const [minStock, setMinStock] = useState(String(p.minStock))
  const [error, setError] = useState<string | null>(null)

  if (!open)
    return (
      <Btn variant="outline" className="self-start" onClick={() => setOpen(true)}>
        Editar producto (nombre, unidad, mínimo deseado: {formatQty(p.minStock, p.unit)})
      </Btn>
    )
  const save = () => {
    const r = commit((st) => updateProduct(st, productId, { name, category, unit, minStock: Number(minStock.replace(',', '.')) }))
    if (!r.ok) return setError(r.error)
    setError(null)
    setOpen(false)
  }
  return (
    <Card className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Nombre">{(pr) => <TextInput {...pr} value={name} onChange={(e) => setName(e.target.value)} />}</Field>
        <Field label="Categoría">
          {(pr) => (
            <SelectInput {...pr} value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </SelectInput>
          )}
        </Field>
        <Field label="Unidad de medida">{(pr) => <TextInput {...pr} value={unit} onChange={(e) => setUnit(e.target.value)} />}</Field>
        <Field label="Cantidad mínima deseada" hint="Por debajo de esto se marca como escaso y aparece en la lista de necesidades.">
          {(pr) => <TextInput {...pr} inputMode="decimal" value={minStock} onChange={(e) => setMinStock(e.target.value)} />}
        </Field>
      </div>
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

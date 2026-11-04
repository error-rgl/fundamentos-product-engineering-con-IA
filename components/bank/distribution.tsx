'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { formatQty, proposeDistribution, productSummaries, getProduct } from '@/lib/bank'
import { useBank, useToday } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Alert, Btn, BtnLink, Card, CardTitle, Empty, Field, PageHeader, SelectInput, TextInput } from './ui'

interface Row {
  key: string
  productId: string
  quantity: string
}
let k = 0

export function Distribution() {
  const s = useBank()!
  const today = useToday()
  const [rows, setRows] = useState<Row[]>([{ key: `r${++k}`, productId: '', quantity: '' }])
  if (!today) return null
  const summaries = productSummaries(s, today).filter((x) => x.available > 0)
  const basket = rows
    .filter((r) => r.productId && Number(r.quantity.replace(',', '.')) > 0)
    .map((r) => ({ productId: r.productId, quantity: Number(r.quantity.replace(',', '.')) }))
  const proposal = proposeDistribution(s, basket, today)
  const items = basket.map((b) => `${b.productId}:${b.quantity}`).join(',')
  const update = (key: string, patch: Partial<Row>) => setRows(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reparto justo"
        description="Arme la canasta que recibirá cada familia y vea a quién le corresponde primero. Es una propuesta: usted confirma cada entrega."
      />
      <Card className="flex flex-col gap-4">
        <CardTitle>1. ¿Qué lleva cada canasta?</CardTitle>
        {rows.map((r) => (
          <div key={r.key} className="grid grid-cols-1 items-end gap-3 md:grid-cols-[2fr_1fr_auto]">
            <Field label="Producto">
              {(p) => (
                <SelectInput {...p} value={r.productId} onChange={(e) => update(r.key, { productId: e.target.value })}>
                  <option value="">Elija…</option>
                  {summaries.map((x) => (
                    <option key={x.product.id} value={x.product.id}>
                      {x.product.name} (hay {formatQty(x.available, x.product.unit)})
                    </option>
                  ))}
                </SelectInput>
              )}
            </Field>
            <Field label="Por familia">
              {(p) => (
                <TextInput {...p} inputMode="decimal" placeholder="Ej.: 2" value={r.quantity} onChange={(e) => update(r.key, { quantity: e.target.value })} />
              )}
            </Field>
            {rows.length > 1 ? (
              <Btn variant="outline" aria-label="Quitar producto" onClick={() => setRows(rows.filter((x) => x.key !== r.key))}>
                <Trash2 aria-hidden="true" />
              </Btn>
            ) : (
              <span />
            )}
          </div>
        ))}
        <Btn variant="outline" className="self-start" onClick={() => setRows([...rows, { key: `r${++k}`, productId: '', quantity: '' }])}>
          <Plus aria-hidden="true" />
          Agregar producto a la canasta
        </Btn>
      </Card>

      <Card>
        <CardTitle>2. Propuesta de reparto</CardTitle>
        {proposal.error ? (
          <Empty>{proposal.error}</Empty>
        ) : (
          <div className="flex flex-col gap-4">
            <Alert tone={proposal.capacity > 0 ? 'info' : 'warning'} title={`Alcanza para ${proposal.capacity} familia(s)`}>
              {proposal.limitingProduct ? `El producto que más limita es: ${proposal.limitingProduct}.` : null}
            </Alert>
            {proposal.ranking.length === 0 ? (
              <Empty>No hay familias activas registradas.</Empty>
            ) : (
              <ol className="flex flex-col gap-3">
                {proposal.ranking.map((r) => (
                  <li
                    key={r.family.id}
                    className={cn(
                      'flex flex-col gap-2 rounded-lg border-2 p-4 md:flex-row md:items-center md:justify-between',
                      r.selected ? 'border-primary/50 bg-secondary' : 'bg-muted/40',
                    )}
                  >
                    <div>
                      <p className="text-lg font-bold">
                        {r.position}. {r.family.id} · {r.family.headName}{' '}
                        <span className="font-normal text-muted-foreground">({r.family.members} pers.)</span>
                      </p>
                      <p className="text-pretty">{r.reason}</p>
                      {r.withinPeriod ? (
                        <p className="text-sm font-bold text-warning">Recibió ayuda hace menos de {s.settings.recentPeriodDays} días.</p>
                      ) : null}
                    </div>
                    {r.selected ? (
                      <BtnLink href={`/entregas/nueva?familia=${r.family.id}&items=${encodeURIComponent(items)}`} className="shrink-0">
                        Preparar entrega
                      </BtnLink>
                    ) : (
                      <span className="shrink-0 font-bold text-muted-foreground">En espera</span>
                    )}
                  </li>
                ))}
              </ol>
            )}
            <p className="text-sm text-muted-foreground">
              Canasta:{' '}
              {basket.map((b) => `${getProduct(s, b.productId)?.name} ${formatQty(b.quantity, getProduct(s, b.productId)?.unit)}`).join(' · ')}
            </p>
          </div>
        )}
      </Card>

      <Card>
        <CardTitle>¿Cómo se decide el orden?</CardTitle>
        <ul className="flex list-inside list-disc flex-col gap-1">
          {proposal.criteria.map((c) => (
            <li key={c} className="text-pretty">
              {c}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

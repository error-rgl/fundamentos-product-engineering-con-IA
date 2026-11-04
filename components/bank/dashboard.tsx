'use client'

import Link from 'next/link'
import { AlertTriangle, CalendarClock, Clock, PackagePlus, Search, Truck, Users } from 'lucide-react'
import {
  attentionLots,
  demoState,
  familyOverview,
  formatDate,
  formatQty,
  isoToDay,
  daysBetween,
  priorityActions,
  productName,
  productSummaries,
  getProduct,
} from '@/lib/bank'
import { replaceAll, useBank, useToday } from '@/lib/store'
import { Alert, Btn, Card, CardTitle, Empty, StatusBadge } from './ui'
import { cn } from '@/lib/utils'

const MAIN_ACTIONS = [
  { href: '/donaciones/nueva', label: 'Registrar una donación', icon: PackagePlus },
  { href: '/inventario/vencimientos', label: 'Ver alimentos por vencer', icon: CalendarClock },
  { href: '/familias', label: 'Buscar una familia', icon: Search },
  { href: '/entregas/nueva', label: 'Registrar una entrega', icon: Truck },
]

export function Dashboard() {
  const s = useBank()!
  const today = useToday()
  if (!today) return null

  const isEmpty = s.products.length === 0 && s.families.length === 0
  const actions = priorityActions(s, today)
  const summaries = productSummaries(s, today)
  const attention = attentionLots(s, today)
  const nearExpiry = attention.filter((x) => x.status === 'por_vencer')
  const toReview = attention.filter((x) => x.status === 'vencido' || x.status === 'revision')
  const recentDonations = [...s.donations].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 5)
  const overview = familyOverview(s, today)
  const recentlyServed = overview
    .filter((x) => x.daysSince !== null && x.daysSince < s.settings.recentPeriodDays)
    .sort((a, b) => a.daysSince! - b.daysSince!)
  const longestWaiting = [...overview]
    .sort((a, b) => (b.daysSince ?? 9999) - (a.daysSince ?? 9999))
    .slice(0, 5)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Panel de hoy</h1>
        <p className="text-muted-foreground">{formatDate(today)} · ¿Qué necesita hacer?</p>
      </div>

      <nav aria-label="Acciones principales" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {MAIN_ACTIONS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex min-h-24 items-center gap-4 rounded-xl border-2 border-primary bg-primary p-5 text-lg font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Icon className="size-8 shrink-0" aria-hidden="true" />
            {label}
          </Link>
        ))}
      </nav>

      {isEmpty ? (
        <Alert tone="info" title="Todavía no hay datos">
          <div className="flex flex-col gap-3">
            <p>
              Puede empezar registrando una donación o una familia. Si quiere practicar primero, cargue datos de ejemplo
              (podrá borrarlos desde Ajustes).
            </p>
            <Btn variant="outline" className="self-start" onClick={() => replaceAll(demoState(new Date()))}>
              Cargar datos de ejemplo
            </Btn>
          </div>
        </Alert>
      ) : null}

      <Card aria-labelledby="alertas">
        <CardTitle icon={<AlertTriangle className="size-6 text-warning" aria-hidden="true" />}>
          <span id="alertas">Alertas y acciones prioritarias</span>
        </CardTitle>
        {actions.length === 0 ? (
          <Empty>No hay alertas. Todo está en orden.</Empty>
        ) : (
          <ul className="flex flex-col gap-2">
            {actions.map((a, i) => (
              <li key={i}>
                <Link
                  href={a.href}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border-2 p-3 hover:bg-muted',
                    a.level === 'alta' ? 'border-destructive/50 bg-destructive-soft' : 'border-warning/50 bg-warning-soft',
                  )}
                >
                  <span
                    className={cn(
                      'shrink-0 rounded-md px-2 py-0.5 text-sm font-bold text-primary-foreground',
                      a.level === 'alta' ? 'bg-destructive' : 'bg-warning',
                    )}
                  >
                    {a.level === 'alta' ? 'Urgente' : 'Pendiente'}
                  </span>
                  <span className="text-pretty">{a.text}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle action={<Link href="/inventario" className="font-bold text-primary underline">Ver todo</Link>}>
            Productos disponibles
          </CardTitle>
          {summaries.length === 0 ? (
            <Empty>No hay productos registrados.</Empty>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 text-sm text-muted-foreground">
                  <th className="py-2 font-bold">Producto</th>
                  <th className="py-2 text-right font-bold">Para entregar</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((x) => (
                  <tr key={x.product.id} className="border-b last:border-0">
                    <td className="py-2">
                      <Link href={`/inventario/${x.product.id}`} className="font-bold underline-offset-4 hover:underline">
                        {x.product.name}
                      </Link>
                      {x.product.minStock > 0 && x.available < x.product.minStock ? (
                        <span className="ml-2 text-sm font-bold text-destructive">Escaso</span>
                      ) : null}
                    </td>
                    <td className="py-2 text-right tabular-nums">{formatQty(x.available, x.product.unit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardTitle action={<Link href="/inventario/vencimientos" className="font-bold text-primary underline">Revisar</Link>}>
              Próximos a vencer
            </CardTitle>
            {nearExpiry.length === 0 ? (
              <Empty>Nada vence en los próximos {s.settings.nearExpiryDays} días.</Empty>
            ) : (
              <LotList s={s} items={nearExpiry} today={today} />
            )}
          </Card>
          <Card>
            <CardTitle>Vencidos o pendientes de revisión</CardTitle>
            {toReview.length === 0 ? <Empty>No hay lotes pendientes de revisión.</Empty> : <LotList s={s} items={toReview} today={today} />}
          </Card>
        </div>

        <Card>
          <CardTitle action={<Link href="/donaciones" className="font-bold text-primary underline">Ver todas</Link>}>
            Donaciones recientes
          </CardTitle>
          {recentDonations.length === 0 ? (
            <Empty>Aún no hay donaciones.</Empty>
          ) : (
            <ul className="flex flex-col divide-y">
              {recentDonations.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 py-2">
                  <span>
                    <span className="font-bold">{d.donor || 'Donante anónimo'}</span>
                    <span className="block text-sm text-muted-foreground">
                      {d.items.length} producto(s) · {formatDate(d.receivedAt ?? d.expectedDate ?? d.createdAt)}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'rounded-md border px-2 py-0.5 text-sm font-bold',
                      d.status === 'recibida' ? 'border-success/40 bg-success-soft text-success' : 'border-warning/50 bg-warning-soft text-warning',
                    )}
                  >
                    {d.status === 'recibida' ? 'Recibida' : 'Prevista'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardTitle icon={<Clock className="size-6 text-warning" aria-hidden="true" />}>Más tiempo sin ayuda</CardTitle>
            {longestWaiting.length === 0 ? (
              <Empty>No hay familias registradas.</Empty>
            ) : (
              <FamilyList items={longestWaiting} />
            )}
          </Card>
          <Card>
            <CardTitle icon={<Users className="size-6 text-primary" aria-hidden="true" />}>
              Atendidas en los últimos {s.settings.recentPeriodDays} días
            </CardTitle>
            {recentlyServed.length === 0 ? <Empty>Ninguna familia atendida recientemente.</Empty> : <FamilyList items={recentlyServed} />}
          </Card>
        </div>
      </div>
    </div>
  )
}

function LotList({
  s,
  items,
  today,
}: {
  s: NonNullable<ReturnType<typeof useBank>>
  items: ReturnType<typeof attentionLots>
  today: string
}) {
  return (
    <ul className="flex flex-col divide-y">
      {items.slice(0, 6).map(({ lot, status }) => {
        const days = lot.expiry ? daysBetween(today, lot.expiry) : null
        return (
          <li key={lot.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <Link href={`/inventario/${lot.productId}`} className="underline-offset-4 hover:underline">
              <span className="font-bold">{productName(s, lot.productId)}</span>{' '}
              <span className="text-muted-foreground">
                · lote {lot.code} · {formatQty(lot.quantity, getProduct(s, lot.productId)?.unit)}
              </span>
              <span className="block text-sm text-muted-foreground">
                {lot.expiry
                  ? days! < 0
                    ? `Venció hace ${-days!} día(s)`
                    : days === 0
                      ? 'Vence hoy'
                      : `Vence en ${days} día(s) · ${formatDate(lot.expiry)}`
                  : 'Sin fecha de vencimiento conocida'}
              </span>
            </Link>
            <StatusBadge status={status} />
          </li>
        )
      })}
    </ul>
  )
}

function FamilyList({ items }: { items: ReturnType<typeof familyOverview> }) {
  return (
    <ul className="flex flex-col divide-y">
      {items.map(({ family, last, daysSince }) => (
        <li key={family.id} className="flex items-center justify-between gap-3 py-2">
          <Link href={`/familias/${family.id}`} className="underline-offset-4 hover:underline">
            <span className="font-bold">
              {family.id} · {family.headName}
            </span>
            <span className="block text-sm text-muted-foreground">
              {family.members} integrante(s) · {last ? `última entrega ${formatDate(isoToDay(last.date))}` : 'nunca ha recibido'}
            </span>
          </Link>
          <span className="shrink-0 text-right font-bold tabular-nums">
            {daysSince === null ? 'Nunca' : daysSince === 0 ? 'Hoy' : `${daysSince} días`}
          </span>
        </li>
      ))}
    </ul>
  )
}

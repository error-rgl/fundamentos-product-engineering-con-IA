'use client'

import { useRef, useState } from 'react'
import { Copy, Download, Upload } from 'lucide-react'
import {
  DEFAULT_SETTINGS,
  demoState,
  emptyState,
  formatDate,
  formatQty,
  indicators,
  isoToDay,
  needsMessage,
  parseBackup,
  stockInsights,
  type Settings,
} from '@/lib/bank'
import { commit, exportBackup, lastBackupDate, replaceAll, useBank, useToday } from '@/lib/store'
import { Alert, Btn, Card, CardTitle, Empty, Field, PageHeader, TextInput } from './ui'

export function Needs() {
  const s = useBank()!
  const today = useToday()
  const [copied, setCopied] = useState(false)
  if (!today) return null
  const { scarce, surplus, atRisk } = stockInsights(s, today)
  const message = needsMessage(s, today)
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Necesidades" description="Qué falta, qué sobra y un mensaje listo para compartir con donantes." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Faltan</CardTitle>
          {scarce.length === 0 ? (
            <Empty>Ningún producto está por debajo de su mínimo deseado.</Empty>
          ) : (
            <ul className="flex flex-col divide-y">
              {scarce.map((x) => (
                <li key={x.product.id} className="flex justify-between gap-3 py-2">
                  <span className="font-bold">{x.product.name}</span>
                  <span className="text-right">
                    hay {formatQty(x.available, x.product.unit)} · faltan {formatQty(x.missing, x.product.unit)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <CardTitle>Sobran (no pedir por ahora)</CardTitle>
          {surplus.length === 0 ? (
            <Empty>No hay excedentes.</Empty>
          ) : (
            <ul className="flex flex-col divide-y">
              {surplus.map((x) => (
                <li key={x.product.id} className="flex justify-between gap-3 py-2">
                  <span className="font-bold">{x.product.name}</span>
                  <span>{formatQty(x.available, x.product.unit)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      {atRisk.length ? (
        <Alert tone="warning" title="Podrían vencer antes de repartirse">
          <ul className="list-inside list-disc">
            {atRisk.map((r) => (
              <li key={r.lot.id}>
                {r.product.name}, lote {r.lot.code}: unos {formatQty(r.excess, r.product.unit)} (vence en {r.daysLeft} día(s); al ritmo
                actual se entregarían {formatQty(r.expectedOut)}).
              </li>
            ))}
          </ul>
        </Alert>
      ) : null}
      <Card className="flex flex-col gap-3">
        <CardTitle>Mensaje para donantes</CardTitle>
        <label htmlFor="mensaje" className="sr-only">
          Mensaje para donantes
        </label>
        <textarea
          id="mensaje"
          readOnly
          value={message}
          rows={Math.min(14, message.split('\n').length + 1)}
          className="w-full rounded-lg border-2 bg-muted/50 p-3 font-sans text-base"
        />
        <Btn
          className="self-start"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(message)
              setCopied(true)
              setTimeout(() => setCopied(false), 2500)
            } catch {
              setCopied(false)
            }
          }}
        >
          <Copy aria-hidden="true" />
          {copied ? 'Copiado' : 'Copiar mensaje'}
        </Btn>
        <p aria-live="polite" className="sr-only">
          {copied ? 'Mensaje copiado' : ''}
        </p>
      </Card>
    </div>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="flex flex-col gap-1">
      <p className="text-sm font-bold text-muted-foreground">{label}</p>
      <p className="text-3xl font-bold tabular-nums">{value}</p>
      {hint ? <p className="text-sm text-muted-foreground text-pretty">{hint}</p> : null}
    </Card>
  )
}

export function Indicators() {
  const s = useBank()!
  const today = useToday()
  const [days, setDays] = useState(30)
  if (!today) return null
  const ind = indicators(s, today, days)
  const pct = (v: number | null) => (v === null ? 'Sin datos' : `${v}%`)
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Indicadores"
        description={`Resultados de los últimos ${days} días. Cantidades sumadas en las unidades de cada producto.`}
        actions={
          <div className="flex gap-2" role="group" aria-label="Periodo">
            {[7, 30, 90].map((d) => (
              <Btn key={d} variant={d === days ? 'primary' : 'outline'} aria-pressed={d === days} onClick={() => setDays(d)}>
                {d} días
              </Btn>
            ))}
          </div>
        }
      />
      <section aria-labelledby="ind-desp" className="flex flex-col gap-3">
        <h2 id="ind-desp" className="text-2xl font-bold">
          Desperdicio
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Desperdicio" value={pct(ind.wastePct)} hint="Bajas + donaciones rechazadas sobre todo lo recibido." />
          <Stat label="Dado de baja" value={formatQty(ind.discarded)} hint="Vencidos o no aptos tras revisión." />
          <Stat label="Rechazado al recibir" value={formatQty(ind.rejected)} />
          <Stat label="Recibido" value={formatQty(ind.received)} />
        </div>
      </section>
      <section aria-labelledby="ind-cob" className="flex flex-col gap-3">
        <h2 id="ind-cob" className="text-2xl font-bold">
          Cobertura de familias
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Familias atendidas" value={pct(ind.coveragePct)} hint={`${ind.servedActive} de ${ind.activeFamilies} familias activas.`} />
          <Stat label="Nunca recibieron" value={String(ind.neverServed)} />
          <Stat label="Entregas" value={String(ind.deliveries)} />
          <Stat label="Entregas por excepción" value={String(ind.exceptions)} hint="Antes del periodo, con motivo justificado." />
        </div>
      </section>
      <section aria-labelledby="ind-prec" className="flex flex-col gap-3">
        <h2 id="ind-prec" className="text-2xl font-bold">
          Precisión del inventario
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Precisión" value={pct(ind.accuracyPct)} hint="Cuanto menos haya que corregir al contar, mejor." />
          <Stat label="Correcciones" value={String(ind.adjustmentsCount)} />
          <Stat label="Cantidad corregida" value={formatQty(ind.adjustedQty)} />
          <Stat label="Entregado" value={formatQty(ind.delivered)} />
        </div>
      </section>
    </div>
  )
}

export function SettingsScreen() {
  const s = useBank()!
  const [v, setV] = useState({
    bankName: s.settings.bankName,
    recentPeriodDays: String(s.settings.recentPeriodDays),
    nearExpiryDays: String(s.settings.nearExpiryDays),
    needBonusDays: String(s.settings.needBonusDays),
  })
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const last = lastBackupDate()

  const saveSettings = () => {
    const nums = [v.recentPeriodDays, v.nearExpiryDays, v.needBonusDays].map(Number)
    if (!v.bankName.trim() || nums.some((x) => !Number.isInteger(x) || x < 0 || x > 365))
      return setMsg({ tone: 'error', text: 'Revise los valores: escriba un nombre y días entre 0 y 365.' })
    const settings: Settings = {
      bankName: v.bankName.trim(),
      recentPeriodDays: nums[0],
      nearExpiryDays: nums[1],
      needBonusDays: nums[2],
    }
    const r = commit((st) => ({ ok: true, state: { ...st, settings }, ref: 'settings' }))
    setMsg(r.ok ? { tone: 'success', text: 'Ajustes guardados.' } : { tone: 'error', text: r.error })
  }

  const importFile = async (file: File) => {
    const parsed = parseBackup(await file.text())
    if (!parsed.ok) return setMsg({ tone: 'error', text: parsed.error })
    if (!window.confirm('Se reemplazarán TODOS los datos de este dispositivo por los de la copia. ¿Continuar?')) return
    const err = replaceAll(parsed.state)
    setMsg(err ? { tone: 'error', text: err } : { tone: 'success', text: 'Copia restaurada correctamente.' })
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader title="Ajustes" description="Reglas del reparto y copias de seguridad." />
      {msg ? <Alert tone={msg.tone}>{msg.text}</Alert> : null}
      <Card className="flex flex-col gap-4">
        <CardTitle>Reglas</CardTitle>
        <Field label="Nombre del banco de alimentos">
          {(p) => <TextInput {...p} value={v.bankName} onChange={(e) => setV({ ...v, bankName: e.target.value })} />}
        </Field>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Periodo entre entregas (días)" hint={`Antes de esto se pide justificar. Por defecto ${DEFAULT_SETTINGS.recentPeriodDays}.`}>
            {(p) => (
              <TextInput {...p} inputMode="numeric" value={v.recentPeriodDays} onChange={(e) => setV({ ...v, recentPeriodDays: e.target.value })} />
            )}
          </Field>
          <Field label="Aviso de vencimiento (días)" hint="Se marca «por vencer» con esta anticipación.">
            {(p) => (
              <TextInput {...p} inputMode="numeric" value={v.nearExpiryDays} onChange={(e) => setV({ ...v, nearExpiryDays: e.target.value })} />
            )}
          </Field>
          <Field label="Puntos por necesidad justificada" hint="Suma al orden del reparto justo.">
            {(p) => (
              <TextInput {...p} inputMode="numeric" value={v.needBonusDays} onChange={(e) => setV({ ...v, needBonusDays: e.target.value })} />
            )}
          </Field>
        </div>
        <Btn className="self-start" onClick={saveSettings}>
          Guardar ajustes
        </Btn>
      </Card>

      <Card className="flex flex-col gap-4">
        <CardTitle>Copia de seguridad</CardTitle>
        <p className="text-pretty">
          Los datos viven en este dispositivo. Descargue una copia con frecuencia y guárdela en otro lugar (correo, pendrive). Con ella puede
          pasar los datos a otro equipo.
        </p>
        <p className="font-bold">Última copia: {last ? formatDate(isoToDay(last)) : 'nunca'}</p>
        <div className="flex flex-wrap gap-3">
          <Btn
            onClick={() => {
              exportBackup(s)
              setMsg({ tone: 'success', text: 'Copia descargada.' })
            }}
          >
            <Download aria-hidden="true" />
            Descargar copia
          </Btn>
          <Btn variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload aria-hidden="true" />
            Restaurar desde archivo
          </Btn>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label="Archivo de copia de seguridad"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) importFile(f)
              e.target.value = ''
            }}
          />
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <CardTitle>Datos de práctica</CardTitle>
        <div className="flex flex-wrap gap-3">
          <Btn
            variant="outline"
            onClick={() => {
              if (window.confirm('Se reemplazarán los datos actuales por datos de ejemplo. ¿Continuar?')) {
                replaceAll(demoState(new Date()))
                setMsg({ tone: 'success', text: 'Datos de ejemplo cargados.' })
              }
            }}
          >
            Cargar datos de ejemplo
          </Btn>
          <Btn
            variant="danger"
            onClick={() => {
              if (window.confirm('¿Borrar TODOS los datos de este dispositivo? Descargue antes una copia si los necesita.')) {
                replaceAll(emptyState())
                setMsg({ tone: 'success', text: 'Todos los datos fueron borrados.' })
              }
            }}
          >
            Borrar todos los datos
          </Btn>
        </div>
      </Card>
    </div>
  )
}

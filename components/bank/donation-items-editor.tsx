'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { addProduct, CATEGORIES, type Condition } from '@/lib/bank'
import { commit, useBank, useOperationId } from '@/lib/store'
import { Alert, Btn, Field, SelectInput, TextArea, TextInput } from './ui'

export interface ItemDraft {
  key: string
  productId: string
  quantity: string
  lotCode: string
  expiry: string
  noExpiry: boolean
  condition: Condition
  notes: string
}

let counter = 0
export function newItemDraft(partial: Partial<ItemDraft> = {}): ItemDraft {
  counter += 1
  return {
    key: `item-${counter}`,
    productId: '',
    quantity: '',
    lotCode: '',
    expiry: '',
    noExpiry: false,
    condition: 'apto',
    notes: '',
    ...partial,
  }
}

export function draftToItem(d: ItemDraft) {
  return {
    productId: d.productId,
    quantity: Number(d.quantity.replace(',', '.')),
    lotCode: d.lotCode,
    expiry: d.noExpiry || !d.expiry ? null : d.expiry,
    condition: d.condition,
    notes: d.notes,
  }
}

/** Devuelve un mensaje si falta la fecha y no se marcó "sin fecha": nunca se inventa una fecha. */
export function missingExpiry(items: ItemDraft[]): string | null {
  const i = items.findIndex((d) => !d.noExpiry && !d.expiry && d.condition !== 'no_apto')
  return i >= 0
    ? `Producto ${i + 1}: escriba la fecha de vencimiento o marque "No tiene fecha o no se conoce".`
    : null
}

export function DonationItemsEditor({
  items,
  onChange,
  requireExpiry,
}: {
  items: ItemDraft[]
  onChange: (items: ItemDraft[]) => void
  requireExpiry: boolean
}) {
  const s = useBank()!
  const update = (key: string, patch: Partial<ItemDraft>) =>
    onChange(items.map((it) => (it.key === key ? { ...it, ...patch } : it)))
  const products = [...s.products].sort((a, b) => a.name.localeCompare(b.name, 'es'))

  return (
    <div className="flex flex-col gap-4">
      {items.map((it, index) => {
        const unit = s.products.find((p) => p.id === it.productId)?.unit
        return (
          <fieldset key={it.key} className="flex flex-col gap-4 rounded-xl border-2 bg-muted/50 p-4">
            <legend className="px-2 text-lg font-bold">Producto {index + 1}</legend>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="¿Qué producto es?">
                {(p) => (
                  <SelectInput {...p} value={it.productId} onChange={(e) => update(it.key, { productId: e.target.value })}>
                    <option value="">Elija un producto…</option>
                    {products.map((pr) => (
                      <option key={pr.id} value={pr.id}>
                        {pr.name} ({pr.unit})
                      </option>
                    ))}
                  </SelectInput>
                )}
              </Field>
              <Field label={`Cantidad${unit ? ` (en ${unit})` : ''}`}>
                {(p) => (
                  <TextInput
                    {...p}
                    inputMode="decimal"
                    placeholder="Ej.: 12"
                    value={it.quantity}
                    onChange={(e) => update(it.key, { quantity: e.target.value })}
                  />
                )}
              </Field>
              {requireExpiry ? (
                <div className="flex flex-col gap-2">
                  <Field label="Fecha de vencimiento" hint="Mírela en el envase.">
                    {(p) => (
                      <TextInput
                        {...p}
                        type="date"
                        disabled={it.noExpiry}
                        value={it.noExpiry ? '' : it.expiry}
                        onChange={(e) => update(it.key, { expiry: e.target.value })}
                      />
                    )}
                  </Field>
                  <label className="flex min-h-11 cursor-pointer items-center gap-3 text-base">
                    <input
                      type="checkbox"
                      className="size-6 accent-[var(--primary)]"
                      checked={it.noExpiry}
                      onChange={(e) =>
                        update(it.key, {
                          noExpiry: e.target.checked,
                          condition: e.target.checked && it.condition === 'apto' ? 'revision' : it.condition,
                        })
                      }
                    />
                    No tiene fecha o no se conoce
                  </label>
                </div>
              ) : null}
              <Field
                label="¿En qué estado llegó?"
                hint={it.noExpiry ? 'Sin fecha conocida: quedará pendiente de revisión hasta que alguien lo revise.' : undefined}
              >
                {(p) => (
                  <SelectInput
                    {...p}
                    value={it.condition}
                    onChange={(e) => update(it.key, { condition: e.target.value as Condition })}
                  >
                    <option value="apto">Bueno: se puede entregar</option>
                    <option value="revision">Dudoso: revisar antes de entregar</option>
                    <option value="no_apto">Dañado: no se acepta</option>
                  </SelectInput>
                )}
              </Field>
              <Field label="Lote (opcional)" hint="Código del envase. Si lo deja vacío, se asigna uno.">
                {(p) => (
                  <TextInput {...p} value={it.lotCode} onChange={(e) => update(it.key, { lotCode: e.target.value })} />
                )}
              </Field>
              <Field label="Observaciones (opcional)">
                {(p) => <TextInput {...p} value={it.notes} onChange={(e) => update(it.key, { notes: e.target.value })} />}
              </Field>
            </div>
            {items.length > 1 ? (
              <Btn variant="outline" className="self-start" onClick={() => onChange(items.filter((x) => x.key !== it.key))}>
                <Trash2 aria-hidden="true" />
                Quitar este producto
              </Btn>
            ) : null}
          </fieldset>
        )
      })}
      <div className="flex flex-wrap gap-3">
        <Btn variant="outline" onClick={() => onChange([...items, newItemDraft()])}>
          <Plus aria-hidden="true" />
          Agregar otro producto
        </Btn>
      </div>
      <QuickAddProduct
        onAdded={(id) => {
          const empty = items.find((x) => !x.productId)
          if (empty) update(empty.key, { productId: id })
          else onChange([...items, newItemDraft({ productId: id })])
        }}
      />
    </div>
  )
}

export function QuickAddProduct({ onAdded }: { onAdded?: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [unit, setUnit] = useState('unidades')
  const [minStock, setMinStock] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [opId, renew] = useOperationId()

  if (!open)
    return (
      <Btn variant="ghost" className="self-start px-0" onClick={() => setOpen(true)}>
        ¿El producto no está en la lista? Agréguelo aquí
      </Btn>
    )

  const save = () => {
    const r = commit((st) =>
      addProduct(st, { name, category, unit, minStock: minStock ? Number(minStock.replace(',', '.')) : 0 }, opId),
    )
    if (!r.ok) return setError(r.error)
    renew()
    setError(null)
    setName('')
    setMinStock('')
    setOpen(false)
    onAdded?.(r.ref)
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border-2 border-primary/40 bg-secondary/60 p-4">
      <h3 className="text-lg font-bold">Nuevo producto</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Nombre">
          {(p) => <TextInput {...p} placeholder="Ej.: Lentejas" value={name} onChange={(e) => setName(e.target.value)} />}
        </Field>
        <Field label="Categoría">
          {(p) => (
            <SelectInput {...p} value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </SelectInput>
          )}
        </Field>
        <Field label="Unidad de medida" hint="Ej.: unidades, kg, litros, latas, paquetes">
          {(p) => <TextInput {...p} value={unit} onChange={(e) => setUnit(e.target.value)} />}
        </Field>
        <Field label="Cantidad mínima deseada (opcional)" hint="Si hay menos, se marcará como escaso.">
          {(p) => <TextInput {...p} inputMode="decimal" value={minStock} onChange={(e) => setMinStock(e.target.value)} />}
        </Field>
      </div>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <div className="flex flex-wrap gap-3">
        <Btn onClick={save}>Guardar producto</Btn>
        <Btn variant="outline" onClick={() => setOpen(false)}>
          Cancelar
        </Btn>
      </div>
    </div>
  )
}

export { TextArea }

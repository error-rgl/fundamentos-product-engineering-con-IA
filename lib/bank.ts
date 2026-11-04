// Lógica de negocio pura del banco de alimentos.
// Sin dependencias para poder probarla con `node --test` (ver tests/).

export type Condition = 'apto' | 'revision' | 'no_apto'
export type LotStatus = 'disponible' | 'por_vencer' | 'vencido' | 'revision' | 'no_apto' | 'agotado'
export type MovementType = 'entrada' | 'salida' | 'ajuste' | 'baja' | 'revision'

export interface Product {
  id: string
  name: string
  category: string
  unit: string
  minStock: number
}

export interface Lot {
  id: string
  productId: string
  code: string
  quantity: number
  expiry: string | null
  condition: Condition
  receivedAt: string
  donationId: string | null
  notes: string
}

export interface DonationItem {
  productId: string
  quantity: number
  lotCode: string
  expiry: string | null
  condition: Condition
  notes: string
}

export interface Donation {
  id: string
  donor: string
  status: 'prevista' | 'recibida'
  createdAt: string
  expectedDate: string | null
  receivedAt: string | null
  receivedBy: string
  items: DonationItem[]
  notes: string
}

export interface Movement {
  id: string
  date: string
  type: MovementType
  productId: string
  lotId: string | null
  quantity: number
  balance: number
  reason: string
  refId: string | null
  user: string
}

export interface Family {
  id: string
  headName: string
  members: number
  registeredAt: string
  contact: string
  priorityNeed: string
  notes: string
  active: boolean
}

export interface DeliveryLine {
  productId: string
  lotId: string
  quantity: number
}

export interface Delivery {
  id: string
  familyId: string
  date: string
  volunteer: string
  lines: DeliveryLine[]
  exceptionReason: string | null
  notes: string
}

export interface Settings {
  recentPeriodDays: number
  nearExpiryDays: number
  needBonusDays: number
  bankName: string
}

export interface BankState {
  version: 1
  products: Product[]
  lots: Lot[]
  donations: Donation[]
  movements: Movement[]
  families: Family[]
  deliveries: Delivery[]
  settings: Settings
  ops: { op: string; ref: string }[]
  seq: Record<'product' | 'lot' | 'donation' | 'delivery' | 'movement' | 'family', number>
}

export type OpResult =
  | { ok: true; state: BankState; ref: string; duplicate?: boolean }
  | { ok: false; error: string; code?: string; lastDate?: string }

export const DEFAULT_SETTINGS: Settings = {
  recentPeriodDays: 7,
  nearExpiryDays: 7,
  needBonusDays: 7,
  bankName: 'Banco de Alimentos del Barrio',
}

export const CATEGORIES = [
  'Granos y cereales',
  'Lácteos',
  'Enlatados',
  'Aceites',
  'Panadería',
  'Frutas y verduras',
  'Carnes y proteínas',
  'Higiene',
  'Otros',
]

export function emptyState(): BankState {
  return {
    version: 1,
    products: [],
    lots: [],
    donations: [],
    movements: [],
    families: [],
    deliveries: [],
    settings: { ...DEFAULT_SETTINGS },
    ops: [],
    seq: { product: 0, lot: 0, donation: 0, delivery: 0, movement: 0, family: 0 },
  }
}

// ---------- Fechas ----------

export function localDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function dayNumber(date: string): number {
  const [y, m, d] = date.slice(0, 10).split('-').map(Number)
  return Date.UTC(y, m - 1, d) / 86400000
}

export function daysBetween(from: string, to: string): number {
  return Math.round(dayNumber(to) - dayNumber(from))
}

export function isoToDay(iso: string): string {
  return iso.length === 10 ? iso : localDate(new Date(iso))
}

export function addDays(date: string, days: number): string {
  const t = (dayNumber(date) + days) * 86400000
  return new Date(t).toISOString().slice(0, 10)
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return 'Sin fecha'
  const [y, m, d] = isoToDay(date).split('-')
  return `${d}/${m}/${y}`
}

// ---------- Utilidades ----------

const round2 = (n: number) => Math.round(n * 100) / 100

export function isValidQuantity(n: number): boolean {
  return Number.isFinite(n) && n > 0 && n <= 100000 && Math.abs(Math.round(n * 100) - n * 100) < 1e-6
}

function nextId(s: BankState, key: keyof BankState['seq'], prefix: string, pad = 4): string {
  s.seq[key] += 1
  return prefix + String(s.seq[key]).padStart(pad, '0')
}

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

function withOp(state: BankState, opId: string | null, fn: (draft: BankState) => OpResult): OpResult {
  if (opId) {
    const prev = state.ops.find((o) => o.op === opId)
    if (prev) return { ok: true, state, ref: prev.ref, duplicate: true }
  }
  const draft = structuredClone(state)
  const result = fn(draft)
  if (!result.ok) return result
  if (opId) {
    draft.ops.push({ op: opId, ref: result.ref })
    if (draft.ops.length > 1000) draft.ops = draft.ops.slice(-1000)
  }
  return { ok: true, state: draft, ref: result.ref }
}

function addMovement(
  s: BankState,
  m: Omit<Movement, 'id'>,
): void {
  s.movements.push({ id: nextId(s, 'movement', 'M', 5), ...m })
}

export function getProduct(s: BankState, id: string): Product | undefined {
  return s.products.find((p) => p.id === id)
}

export function productName(s: BankState, id: string): string {
  return getProduct(s, id)?.name ?? 'Producto desconocido'
}

export function formatQty(n: number, unit?: string): string {
  const v = Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '')
  return unit ? `${v} ${unit}` : v
}

// ---------- Estado de lotes y FEFO ----------

export function lotStatus(lot: Lot, today: string, settings: Settings): LotStatus {
  if (lot.quantity <= 0) return 'agotado'
  if (lot.condition === 'no_apto') return 'no_apto'
  if (lot.expiry && lot.expiry < today) return 'vencido'
  if (lot.condition === 'revision') return 'revision'
  if (lot.expiry && daysBetween(today, lot.expiry) <= settings.nearExpiryDays) return 'por_vencer'
  return 'disponible'
}

export function isDistributable(status: LotStatus): boolean {
  return status === 'disponible' || status === 'por_vencer'
}

export const STATUS_LABEL: Record<LotStatus, string> = {
  disponible: 'Apto',
  por_vencer: 'Vence pronto',
  vencido: 'Vencido: revisar',
  revision: 'Pendiente de revisión',
  no_apto: 'No apto',
  agotado: 'Agotado',
}

function fefoCompare(a: Lot, b: Lot): number {
  if (a.expiry && b.expiry && a.expiry !== b.expiry) return a.expiry < b.expiry ? -1 : 1
  if (a.expiry && !b.expiry) return -1
  if (!a.expiry && b.expiry) return 1
  if (a.receivedAt !== b.receivedAt) return a.receivedAt < b.receivedAt ? -1 : 1
  return a.id < b.id ? -1 : 1
}

/** Lotes aptos para distribuir de un producto, ordenados por FEFO (vence primero, sale primero). */
export function fefoLots(s: BankState, productId: string, today: string): Lot[] {
  return s.lots
    .filter((l) => l.productId === productId && isDistributable(lotStatus(l, today, s.settings)))
    .sort(fefoCompare)
}

export function availableQuantity(s: BankState, productId: string, today: string): number {
  return round2(fefoLots(s, productId, today).reduce((sum, l) => sum + l.quantity, 0))
}

/** Todos los lotes con existencias de un producto, en orden FEFO, con su estado. */
export function productLots(s: BankState, productId: string, today: string) {
  return s.lots
    .filter((l) => l.productId === productId && l.quantity > 0)
    .sort(fefoCompare)
    .map((lot) => ({ lot, status: lotStatus(lot, today, s.settings) }))
}

// ---------- Productos ----------

export interface ProductInput {
  name: string
  category: string
  unit: string
  minStock: number
}

export function addProduct(state: BankState, input: ProductInput, opId: string | null): OpResult {
  const name = input.name.trim()
  if (name.length < 2) return { ok: false, error: 'Escriba el nombre del producto.' }
  if (!input.unit.trim()) return { ok: false, error: 'Indique la unidad de medida (por ejemplo: unidades, kg, litros).' }
  if (!Number.isFinite(input.minStock) || input.minStock < 0)
    return { ok: false, error: 'La cantidad mínima deseada debe ser 0 o un número mayor.' }
  const existing = state.products.find((p) => normalize(p.name) === normalize(name))
  if (existing) return { ok: false, error: `El producto "${existing.name}" ya existe. Elíjalo de la lista.` }
  return withOp(state, opId, (s) => {
    const id = nextId(s, 'product', 'P', 3)
    s.products.push({
      id,
      name,
      category: input.category || 'Otros',
      unit: input.unit.trim(),
      minStock: input.minStock,
    })
    return { ok: true, state: s, ref: id }
  })
}

export function updateProduct(state: BankState, id: string, input: ProductInput): OpResult {
  const name = input.name.trim()
  if (name.length < 2) return { ok: false, error: 'Escriba el nombre del producto.' }
  if (!input.unit.trim()) return { ok: false, error: 'Indique la unidad de medida.' }
  if (!Number.isFinite(input.minStock) || input.minStock < 0)
    return { ok: false, error: 'La cantidad mínima deseada debe ser 0 o un número mayor.' }
  const dup = state.products.find((p) => p.id !== id && normalize(p.name) === normalize(name))
  if (dup) return { ok: false, error: `Ya existe otro producto llamado "${dup.name}".` }
  return withOp(state, null, (s) => {
    const p = s.products.find((x) => x.id === id)
    if (!p) return { ok: false, error: 'No se encontró el producto.' }
    p.name = name
    p.category = input.category || 'Otros'
    p.unit = input.unit.trim()
    p.minStock = input.minStock
    return { ok: true, state: s, ref: id }
  })
}

// ---------- Donaciones ----------

export interface DonationInput {
  donor: string
  status: 'prevista' | 'recibida'
  expectedDate: string | null
  receivedBy: string
  items: DonationItem[]
  notes: string
}

function validateDonationItems(s: BankState, items: DonationItem[]): string | null {
  if (items.length === 0) return 'Agregue al menos un producto a la donación.'
  for (let i = 0; i < items.length; i++) {
    const it = items[i]
    const n = i + 1
    if (!getProduct(s, it.productId)) return `Producto ${n}: elija un producto de la lista.`
    if (!isValidQuantity(it.quantity))
      return `Producto ${n}: la cantidad debe ser un número mayor que 0 (máximo 2 decimales).`
    if (it.expiry !== null && !/^\d{4}-\d{2}-\d{2}$/.test(it.expiry))
      return `Producto ${n}: la fecha de vencimiento no es válida.`
  }
  return null
}

function receiveItems(s: BankState, donation: Donation, now: Date): void {
  const iso = now.toISOString()
  const day = localDate(now)
  for (const item of donation.items) {
    // Lo dañado al recibir no se contabiliza como existencia: queda registrado en la donación.
    if (item.condition === 'no_apto') continue
    let code = item.lotCode.trim()
    let lot: Lot | undefined
    if (code) {
      const sameCode = s.lots.filter((l) => l.productId === item.productId && normalize(l.code) === normalize(code))
      lot = sameCode.find((l) => l.expiry === item.expiry && l.condition === item.condition)
      if (!lot && sameCode.length > 0) {
        // Mismo código pero distinta fecha o estado: se identifica como lote independiente.
        let k = 2
        while (s.lots.some((l) => l.productId === item.productId && normalize(l.code) === normalize(`${code}-${k}`))) k++
        code = `${code}-${k}`
      }
    }
    if (!lot) {
      const id = nextId(s, 'lot', 'L')
      lot = {
        id,
        productId: item.productId,
        code: code || id,
        quantity: 0,
        expiry: item.expiry,
        condition: item.condition,
        receivedAt: day,
        donationId: donation.id,
        notes: item.notes,
      }
      s.lots.push(lot)
    }
    lot.quantity = round2(lot.quantity + item.quantity)
    addMovement(s, {
      date: iso,
      type: 'entrada',
      productId: item.productId,
      lotId: lot.id,
      quantity: item.quantity,
      balance: lot.quantity,
      reason: `Donación ${donation.id}${donation.donor ? ` de ${donation.donor}` : ''}`,
      refId: donation.id,
      user: donation.receivedBy,
    })
  }
}

export function registerDonation(state: BankState, input: DonationInput, opId: string | null, now: Date): OpResult {
  const err = validateDonationItems(state, input.items)
  if (err) return { ok: false, error: err }
  if (input.status === 'recibida' && !input.receivedBy.trim())
    return { ok: false, error: 'Escriba el nombre de la persona que recibe la donación.' }
  return withOp(state, opId, (s) => {
    const id = nextId(s, 'donation', 'D')
    const donation: Donation = {
      id,
      donor: input.donor.trim(),
      status: input.status,
      createdAt: now.toISOString(),
      expectedDate: input.status === 'prevista' ? input.expectedDate : null,
      receivedAt: input.status === 'recibida' ? now.toISOString() : null,
      receivedBy: input.receivedBy.trim(),
      items: input.items.map((i) => ({ ...i, lotCode: i.lotCode.trim(), notes: i.notes.trim() })),
      notes: input.notes.trim(),
    }
    s.donations.push(donation)
    if (donation.status === 'recibida') receiveItems(s, donation, now)
    return { ok: true, state: s, ref: id }
  })
}

/** Confirma la llegada de una donación prevista. Las cantidades pueden corregirse con lo que realmente llegó. */
export function confirmDonation(
  state: BankState,
  donationId: string,
  received: { items: DonationItem[]; receivedBy: string },
  opId: string | null,
  now: Date,
): OpResult {
  const d = state.donations.find((x) => x.id === donationId)
  if (!d) return { ok: false, error: 'No se encontró la donación.' }
  if (d.status === 'recibida')
    return { ok: false, error: `Esta donación ya fue recibida el ${formatDate(d.receivedAt)}. No se vuelve a sumar.` }
  if (!received.receivedBy.trim()) return { ok: false, error: 'Escriba el nombre de la persona que recibe la donación.' }
  const err = validateDonationItems(state, received.items)
  if (err) return { ok: false, error: err }
  return withOp(state, opId, (s) => {
    const donation = s.donations.find((x) => x.id === donationId)!
    donation.status = 'recibida'
    donation.receivedAt = now.toISOString()
    donation.receivedBy = received.receivedBy.trim()
    donation.items = received.items.map((i) => ({ ...i, lotCode: i.lotCode.trim(), notes: i.notes.trim() }))
    receiveItems(s, donation, now)
    return { ok: true, state: s, ref: donationId }
  })
}

export function cancelDonation(state: BankState, donationId: string): OpResult {
  const d = state.donations.find((x) => x.id === donationId)
  if (!d) return { ok: false, error: 'No se encontró la donación.' }
  if (d.status === 'recibida') return { ok: false, error: 'Una donación recibida no se puede eliminar. Use una corrección de inventario.' }
  return withOp(state, null, (s) => {
    s.donations = s.donations.filter((x) => x.id !== donationId)
    return { ok: true, state: s, ref: donationId }
  })
}

// ---------- Correcciones y revisión de lotes ----------

export function adjustLot(
  state: BankState,
  lotId: string,
  newQuantity: number,
  reason: string,
  user: string,
  opId: string | null,
  now: Date,
): OpResult {
  const lot = state.lots.find((l) => l.id === lotId)
  if (!lot) return { ok: false, error: 'No se encontró el lote.' }
  if (!Number.isFinite(newQuantity) || newQuantity < 0)
    return { ok: false, error: 'La cantidad contada debe ser 0 o un número mayor. Las existencias no pueden ser negativas.' }
  if (reason.trim().length < 4) return { ok: false, error: 'Explique el motivo de la corrección (por ejemplo: "conteo semanal").' }
  if (!user.trim()) return { ok: false, error: 'Escriba su nombre para dejar constancia de la corrección.' }
  if (round2(newQuantity) === lot.quantity) return { ok: false, error: 'La cantidad es la misma que ya está registrada.' }
  return withOp(state, opId, (s) => {
    const l = s.lots.find((x) => x.id === lotId)!
    const delta = round2(newQuantity - l.quantity)
    l.quantity = round2(newQuantity)
    addMovement(s, {
      date: now.toISOString(),
      type: 'ajuste',
      productId: l.productId,
      lotId: l.id,
      quantity: delta,
      balance: l.quantity,
      reason: reason.trim(),
      refId: null,
      user: user.trim(),
    })
    return { ok: true, state: s, ref: lotId }
  })
}

export function reviewLot(
  state: BankState,
  lotId: string,
  decision: 'apto' | 'baja',
  reason: string,
  user: string,
  opId: string | null,
  now: Date,
): OpResult {
  const lot = state.lots.find((l) => l.id === lotId)
  if (!lot) return { ok: false, error: 'No se encontró el lote.' }
  if (lot.quantity <= 0) return { ok: false, error: 'Este lote ya no tiene existencias.' }
  if (reason.trim().length < 4) return { ok: false, error: 'Describa qué se revisó o por qué se da de baja.' }
  if (!user.trim()) return { ok: false, error: 'Escriba su nombre para dejar constancia de la revisión.' }
  const today = localDate(now)
  if (decision === 'apto' && lot.expiry && lot.expiry < today)
    return {
      ok: false,
      error: 'Un lote vencido no puede marcarse como apto para la distribución normal. Debe darse de baja.',
    }
  return withOp(state, opId, (s) => {
    const l = s.lots.find((x) => x.id === lotId)!
    if (decision === 'apto') {
      l.condition = 'apto'
      addMovement(s, {
        date: now.toISOString(),
        type: 'revision',
        productId: l.productId,
        lotId: l.id,
        quantity: 0,
        balance: l.quantity,
        reason: `Revisado y apto: ${reason.trim()}`,
        refId: null,
        user: user.trim(),
      })
    } else {
      const qty = l.quantity
      l.quantity = 0
      l.condition = 'no_apto'
      addMovement(s, {
        date: now.toISOString(),
        type: 'baja',
        productId: l.productId,
        lotId: l.id,
        quantity: -qty,
        balance: 0,
        reason: `Baja: ${reason.trim()}`,
        refId: null,
        user: user.trim(),
      })
    }
    return { ok: true, state: s, ref: lotId }
  })
}

// ---------- Familias ----------

export interface FamilyInput {
  headName: string
  members: number
  contact: string
  priorityNeed: string
  notes: string
}

function validateFamily(input: FamilyInput): string | null {
  if (input.headName.trim().length < 3) return 'Escriba el nombre de la persona responsable de la familia.'
  if (!Number.isInteger(input.members) || input.members < 1 || input.members > 30)
    return 'El número de integrantes debe ser un número entero entre 1 y 30.'
  return null
}

export function findSimilarFamilies(s: BankState, name: string, excludeId?: string): Family[] {
  const n = normalize(name)
  if (n.length < 3) return []
  return s.families.filter((f) => f.id !== excludeId && normalize(f.headName) === n)
}

export function addFamily(state: BankState, input: FamilyInput, opId: string | null, now: Date): OpResult {
  const err = validateFamily(input)
  if (err) return { ok: false, error: err }
  return withOp(state, opId, (s) => {
    const id = nextId(s, 'family', 'F', 3)
    s.families.push({
      id,
      headName: input.headName.trim(),
      members: input.members,
      registeredAt: localDate(now),
      contact: input.contact.trim(),
      priorityNeed: input.priorityNeed.trim(),
      notes: input.notes.trim(),
      active: true,
    })
    return { ok: true, state: s, ref: id }
  })
}

export function updateFamily(state: BankState, id: string, input: FamilyInput & { active: boolean }): OpResult {
  const err = validateFamily(input)
  if (err) return { ok: false, error: err }
  return withOp(state, null, (s) => {
    const f = s.families.find((x) => x.id === id)
    if (!f) return { ok: false, error: 'No se encontró la familia.' }
    f.headName = input.headName.trim()
    f.members = input.members
    f.contact = input.contact.trim()
    f.priorityNeed = input.priorityNeed.trim()
    f.notes = input.notes.trim()
    f.active = input.active
    return { ok: true, state: s, ref: id }
  })
}

export function familyDeliveries(s: BankState, familyId: string): Delivery[] {
  return s.deliveries.filter((d) => d.familyId === familyId).sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function lastDelivery(s: BankState, familyId: string): Delivery | null {
  return familyDeliveries(s, familyId)[0] ?? null
}

export function recentDeliveryCheck(s: BankState, familyId: string, today: string) {
  const last = lastDelivery(s, familyId)
  if (!last) return { last: null, daysAgo: null, withinPeriod: false }
  const daysAgo = daysBetween(isoToDay(last.date), today)
  return { last, daysAgo, withinPeriod: daysAgo < s.settings.recentPeriodDays }
}

export function searchFamilies(s: BankState, query: string): Family[] {
  const q = normalize(query)
  const list = [...s.families].sort((a, b) => (a.id < b.id ? -1 : 1))
  if (!q) return list
  return list.filter((f) => normalize(f.id).includes(q) || normalize(f.headName).includes(q))
}

// ---------- Entregas ----------

export interface DeliveryRequestLine {
  productId: string
  quantity: number
  lotId: string | null
}

export interface DeliveryInput {
  familyId: string
  volunteer: string
  lines: DeliveryRequestLine[]
  exceptionReason: string
  notes: string
}

function blockedLotMessage(s: BankState, lot: Lot, status: LotStatus): string {
  const name = productName(s, lot.productId)
  switch (status) {
    case 'vencido':
      return `El lote ${lot.code} de ${name} está vencido (venció el ${formatDate(lot.expiry)}). Requiere revisión y no puede entregarse.`
    case 'revision':
      return `El lote ${lot.code} de ${name} está pendiente de revisión. Debe revisarse antes de entregarlo.`
    case 'no_apto':
      return `El lote ${lot.code} de ${name} está marcado como no apto y no puede entregarse.`
    default:
      return `El lote ${lot.code} de ${name} ya no tiene existencias.`
  }
}

/** Valida y calcula los lotes a usar sin modificar el estado. */
export function planDelivery(
  s: BankState,
  lines: DeliveryRequestLine[],
  today: string,
): { ok: true; lines: DeliveryLine[] } | { ok: false; error: string } {
  if (lines.length === 0) return { ok: false, error: 'Agregue al menos un producto a la entrega.' }
  const remaining = new Map(s.lots.map((l) => [l.id, l.quantity]))

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!getProduct(s, line.productId)) return { ok: false, error: `Producto ${i + 1}: elija un producto de la lista.` }
    if (!isValidQuantity(line.quantity))
      return { ok: false, error: `Producto ${i + 1}: la cantidad debe ser un número mayor que 0.` }
  }

  const resolved: DeliveryLine[] = []
  // 1) Lotes elegidos a mano: se valida su estado antes que cualquier otra cosa.
  for (const line of lines.filter((l) => l.lotId)) {
    const lot = s.lots.find((l) => l.id === line.lotId)
    if (!lot || lot.productId !== line.productId) return { ok: false, error: 'El lote elegido no corresponde al producto.' }
    const status = lotStatus(lot, today, s.settings)
    if (!isDistributable(status)) return { ok: false, error: blockedLotMessage(s, lot, status) }
    const left = remaining.get(lot.id) ?? 0
    if (line.quantity > left) {
      const unit = getProduct(s, lot.productId)?.unit
      return {
        ok: false,
        error: `El lote ${lot.code} de ${productName(s, lot.productId)} solo tiene ${formatQty(left, unit)} disponibles.`,
      }
    }
    remaining.set(lot.id, round2(left - line.quantity))
    resolved.push({ productId: line.productId, lotId: lot.id, quantity: line.quantity })
  }

  // 2) Verificación total por producto (todas las líneas juntas).
  const totals = new Map<string, number>()
  for (const line of lines) totals.set(line.productId, round2((totals.get(line.productId) ?? 0) + line.quantity))
  for (const [productId, total] of totals) {
    const available = availableQuantity(s, productId, today)
    if (total > available) {
      const p = getProduct(s, productId)!
      return {
        ok: false,
        error: `Solo hay ${formatQty(available, p.unit)} de ${p.name} disponibles para entregar. No se pueden entregar ${formatQty(total, p.unit)}.`,
      }
    }
  }

  // 3) Asignación automática FEFO para el resto.
  for (const line of lines.filter((l) => !l.lotId)) {
    let need = line.quantity
    for (const lot of fefoLots(s, line.productId, today)) {
      if (need <= 0) break
      const left = remaining.get(lot.id) ?? 0
      if (left <= 0) continue
      const take = round2(Math.min(left, need))
      remaining.set(lot.id, round2(left - take))
      need = round2(need - take)
      const existing = resolved.find((r) => r.lotId === lot.id)
      if (existing) existing.quantity = round2(existing.quantity + take)
      else resolved.push({ productId: line.productId, lotId: lot.id, quantity: take })
    }
    if (need > 0) {
      const p = getProduct(s, line.productId)!
      return { ok: false, error: `No hay suficiente ${p.name} disponible para completar la entrega.` }
    }
  }
  return { ok: true, lines: resolved }
}

export function registerDelivery(state: BankState, input: DeliveryInput, opId: string | null, now: Date): OpResult {
  if (opId) {
    const prev = state.ops.find((o) => o.op === opId)
    if (prev) return { ok: true, state, ref: prev.ref, duplicate: true }
  }
  const today = localDate(now)
  const family = state.families.find((f) => f.id === input.familyId)
  if (!family) return { ok: false, error: 'Elija la familia que recibe la entrega.' }
  if (!family.active) return { ok: false, error: `La familia ${family.id} está marcada como inactiva.` }
  if (!input.volunteer.trim()) return { ok: false, error: 'Escriba el nombre del voluntario o voluntaria responsable.' }

  const check = recentDeliveryCheck(state, family.id, today)
  const exception = input.exceptionReason.trim()
  if (check.withinPeriod && exception.length < 5) {
    return {
      ok: false,
      code: 'RECENT',
      lastDate: check.last!.date,
      error: `La familia ${family.id} recibió una entrega hace ${check.daysAgo} día(s), el ${formatDate(check.last!.date)}. Para entregar de nuevo, explique la necesidad.`,
    }
  }

  const plan = planDelivery(state, input.lines, today)
  if (!plan.ok) return plan

  return withOp(state, opId, (s) => {
    const id = nextId(s, 'delivery', 'E')
    const iso = now.toISOString()
    for (const line of plan.lines) {
      const lot = s.lots.find((l) => l.id === line.lotId)!
      lot.quantity = round2(lot.quantity - line.quantity)
      if (lot.quantity < 0) return { ok: false, error: 'Las existencias no pueden quedar negativas.' }
      addMovement(s, {
        date: iso,
        type: 'salida',
        productId: line.productId,
        lotId: lot.id,
        quantity: -line.quantity,
        balance: lot.quantity,
        reason: `Entrega ${id} a familia ${family.id}`,
        refId: id,
        user: input.volunteer.trim(),
      })
    }
    s.deliveries.push({
      id,
      familyId: family.id,
      date: iso,
      volunteer: input.volunteer.trim(),
      lines: plan.lines,
      exceptionReason: check.withinPeriod ? exception : null,
      notes: input.notes.trim(),
    })
    return { ok: true, state: s, ref: id }
  })
}

// ---------- Distribución equitativa ----------

export interface BasketItem {
  productId: string
  quantity: number
}

export interface RankedFamily {
  family: Family
  daysWaiting: number
  neverReceived: boolean
  needBonus: number
  score: number
  deliveriesLast30: number
  withinPeriod: boolean
  selected: boolean
  position: number
  reason: string
}

export interface DistributionProposal {
  capacity: number
  limitingProduct: string | null
  ranking: RankedFamily[]
  criteria: string[]
  error: string | null
}

export function proposeDistribution(s: BankState, basket: BasketItem[], today: string): DistributionProposal {
  const criteria = [
    'Se ordena por puntos de espera: días transcurridos desde la última entrega (o desde el registro, si nunca recibió ayuda).',
    `Si la familia tiene una necesidad justificada anotada, suma ${s.settings.needBonusDays} puntos.`,
    'Si hay empate, va primero la familia con más integrantes y después la que recibió menos entregas en los últimos 30 días.',
    'La cantidad de familias atendidas depende de los alimentos aptos disponibles para la canasta indicada.',
    'Es solo una propuesta: ninguna entrega se registra hasta que se confirme una por una.',
  ]
  const items = basket.filter((b) => b.quantity > 0 && getProduct(s, b.productId))
  if (items.length === 0)
    return { capacity: 0, limitingProduct: null, ranking: [], criteria, error: 'Agregue al menos un producto a la canasta.' }

  let capacity = Infinity
  let limitingProduct: string | null = null
  for (const item of items) {
    const possible = Math.floor(availableQuantity(s, item.productId, today) / item.quantity + 1e-9)
    if (possible < capacity) {
      capacity = possible
      limitingProduct = productName(s, item.productId)
    }
  }

  const candidates = s.families
    .filter((f) => f.active)
    .map((family) => {
      const deliveries = familyDeliveries(s, family.id)
      const last = deliveries[0]
      const neverReceived = !last
      const daysWaiting = last
        ? daysBetween(isoToDay(last.date), today)
        : Math.max(0, daysBetween(family.registeredAt, today))
      const needBonus = family.priorityNeed ? s.settings.needBonusDays : 0
      const deliveriesLast30 = deliveries.filter((d) => daysBetween(isoToDay(d.date), today) <= 30).length
      return {
        family,
        daysWaiting,
        neverReceived,
        needBonus,
        score: daysWaiting + needBonus,
        deliveriesLast30,
        withinPeriod: !neverReceived && daysWaiting < s.settings.recentPeriodDays,
      }
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.family.members - a.family.members ||
        a.deliveriesLast30 - b.deliveriesLast30 ||
        (a.family.id < b.family.id ? -1 : 1),
    )

  const ranking: RankedFamily[] = candidates.map((c, i) => {
    const selected = i < capacity
    const wait = c.neverReceived
      ? `nunca ha recibido ayuda (registrada hace ${c.daysWaiting} días)`
      : `lleva ${c.daysWaiting} días sin recibir ayuda`
    const bonus = c.needBonus ? ` + ${c.needBonus} puntos por necesidad justificada (${c.family.priorityNeed})` : ''
    const reason = selected
      ? `Prioridad ${i + 1}: ${wait}${bonus}. Puntos: ${c.score}.`
      : `Sin alimentos suficientes en esta ronda: alcanzan para ${capacity} familia(s) y esta ${wait}${bonus}. Puntos: ${c.score}.`
    return { ...c, selected, position: i + 1, reason }
  })

  return {
    capacity: Number.isFinite(capacity) ? capacity : 0,
    limitingProduct,
    ranking,
    criteria,
    error: null,
  }
}

// ---------- Análisis para el panel ----------

export function productSummaries(s: BankState, today: string) {
  return s.products
    .map((product) => {
      const lots = productLots(s, product.id, today)
      const sum = (pred: (st: LotStatus) => boolean) =>
        round2(lots.filter((x) => pred(x.status)).reduce((acc, x) => acc + x.lot.quantity, 0))
      return {
        product,
        available: sum(isDistributable),
        nearExpiry: sum((st) => st === 'por_vencer'),
        inReview: sum((st) => st === 'revision'),
        expired: sum((st) => st === 'vencido'),
        lots,
      }
    })
    .sort((a, b) => a.product.name.localeCompare(b.product.name, 'es'))
}

export function attentionLots(s: BankState, today: string) {
  return s.lots
    .map((lot) => ({ lot, status: lotStatus(lot, today, s.settings) }))
    .filter((x) => x.status === 'por_vencer' || x.status === 'vencido' || x.status === 'revision')
    .sort((a, b) => fefoCompare(a.lot, b.lot))
}

function outflowPerDay(s: BankState, productId: string, today: string): number {
  const total = s.movements
    .filter(
      (m) => m.productId === productId && m.type === 'salida' && daysBetween(isoToDay(m.date), today) <= 30,
    )
    .reduce((acc, m) => acc - m.quantity, 0)
  return total / 30
}

export function stockInsights(s: BankState, today: string) {
  const summaries = productSummaries(s, today)
  const scarce = summaries
    .filter((x) => x.product.minStock > 0 && x.available < x.product.minStock)
    .map((x) => ({ ...x, missing: round2(x.product.minStock - x.available) }))
  const surplus = summaries.filter((x) => x.product.minStock > 0 && x.available >= x.product.minStock * 3)

  // Riesgo de vencer antes de repartir: compara cada lote próximo a vencer con lo entregado en los últimos 30 días.
  const atRisk: { lot: Lot; product: Product; daysLeft: number; expectedOut: number; excess: number }[] = []
  for (const x of summaries) {
    const perDay = outflowPerDay(s, x.product.id, today)
    let ahead = 0
    for (const { lot, status } of x.lots) {
      if (!isDistributable(status)) continue
      ahead += lot.quantity
      if (status !== 'por_vencer' || !lot.expiry) continue
      const daysLeft = daysBetween(today, lot.expiry)
      const expectedOut = round2(perDay * (daysLeft + 1))
      const excess = round2(ahead - expectedOut)
      if (excess > 0) atRisk.push({ lot, product: x.product, daysLeft, expectedOut, excess: Math.min(excess, lot.quantity) })
    }
  }
  return { summaries, scarce, surplus, atRisk }
}

export function familyOverview(s: BankState, today: string) {
  return s.families
    .filter((f) => f.active)
    .map((family) => {
      const last = lastDelivery(s, family.id)
      const daysSince = last ? daysBetween(isoToDay(last.date), today) : null
      return { family, last, daysSince }
    })
}

export interface PriorityAction {
  level: 'alta' | 'media'
  text: string
  href: string
}

export function priorityActions(s: BankState, today: string): PriorityAction[] {
  const actions: PriorityAction[] = []
  const attention = attentionLots(s, today)
  const expired = attention.filter((x) => x.status === 'vencido')
  const review = attention.filter((x) => x.status === 'revision')
  const { scarce, atRisk } = stockInsights(s, today)

  if (expired.length)
    actions.push({
      level: 'alta',
      text: `${expired.length} lote(s) vencido(s) separados de la distribución. Revíselos y déles de baja.`,
      href: '/inventario/vencimientos',
    })
  for (const r of atRisk.slice(0, 3))
    actions.push({
      level: 'alta',
      text: `${formatQty(r.excess, r.product.unit)} de ${r.product.name} (lote ${r.lot.code}) podrían vencer antes de repartirse: vence en ${r.daysLeft} día(s). Inclúyalo en las próximas entregas.`,
      href: '/distribucion',
    })
  if (review.length)
    actions.push({
      level: 'media',
      text: `${review.length} lote(s) esperan revisión (sin fecha conocida o estado dudoso).`,
      href: '/inventario/vencimientos',
    })
  const pending = s.donations.filter((d) => d.status === 'prevista')
  if (pending.length)
    actions.push({
      level: 'media',
      text: `${pending.length} donación(es) prevista(s) por confirmar cuando lleguen.`,
      href: '/donaciones',
    })
  const waiting = familyOverview(s, today).filter(
    (x) => x.daysSince === null || x.daysSince >= s.settings.recentPeriodDays * 2,
  )
  if (waiting.length)
    actions.push({
      level: 'media',
      text: `${waiting.length} familia(s) llevan ${s.settings.recentPeriodDays * 2} días o más sin ayuda (o nunca la recibieron).`,
      href: '/distribucion',
    })
  if (scarce.length)
    actions.push({
      level: 'media',
      text: `Faltan productos: ${scarce.map((x) => x.product.name).join(', ')}. Comparta la lista de necesidades.`,
      href: '/necesidades',
    })
  return actions
}

export function needsMessage(s: BankState, today: string): string {
  const { scarce, surplus } = stockInsights(s, today)
  const lines = [`${s.settings.bankName}: lista de necesidades (${formatDate(today)})`, '']
  if (scarce.length === 0) lines.push('En este momento tenemos lo básico cubierto. ¡Gracias!')
  else {
    lines.push('Necesitamos:')
    for (const x of scarce) lines.push(`- ${x.product.name}: unos ${formatQty(x.missing, x.product.unit)}`)
  }
  if (surplus.length) {
    lines.push('', 'Por ahora no hace falta donar:')
    for (const x of surplus) lines.push(`- ${x.product.name}`)
  }
  lines.push('', 'Por favor, revise que los alimentos no estén vencidos antes de donarlos.')
  return lines.join('\n')
}

// ---------- Indicadores ----------

export function indicators(s: BankState, today: string, windowDays = 30) {
  const inWindow = (iso: string) => daysBetween(isoToDay(iso), today) <= windowDays && daysBetween(isoToDay(iso), today) >= 0
  const moves = s.movements.filter((m) => inWindow(m.date))
  const sumBy = (t: MovementType) => round2(moves.filter((m) => m.type === t).reduce((a, m) => a + Math.abs(m.quantity), 0))
  const received = sumBy('entrada')
  const delivered = sumBy('salida')
  const discarded = sumBy('baja')
  const rejected = round2(
    s.donations
      .filter((d) => d.status === 'recibida' && d.receivedAt && inWindow(d.receivedAt))
      .flatMap((d) => d.items)
      .filter((i) => i.condition === 'no_apto')
      .reduce((a, i) => a + i.quantity, 0),
  )
  const adjustments = moves.filter((m) => m.type === 'ajuste')
  const adjustedQty = round2(adjustments.reduce((a, m) => a + Math.abs(m.quantity), 0))
  const active = s.families.filter((f) => f.active)
  const served = new Set(s.deliveries.filter((d) => inWindow(d.date)).map((d) => d.familyId))
  const servedActive = active.filter((f) => served.has(f.id)).length
  const deliveriesInWindow = s.deliveries.filter((d) => inWindow(d.date))
  const exceptions = deliveriesInWindow.filter((d) => d.exceptionReason).length
  const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : null)
  return {
    windowDays,
    received,
    delivered,
    discarded,
    rejected,
    wastePct: pct(discarded + rejected, received + rejected),
    coveragePct: pct(servedActive, active.length),
    servedActive,
    activeFamilies: active.length,
    neverServed: active.filter((f) => !s.deliveries.some((d) => d.familyId === f.id)).length,
    deliveries: deliveriesInWindow.length,
    exceptions,
    adjustmentsCount: adjustments.length,
    adjustedQty,
    accuracyPct: pct(Math.max(0, received + delivered - adjustedQty), received + delivered),
  }
}

// ---------- Copias de seguridad ----------

export function parseBackup(text: string): { ok: true; state: BankState } | { ok: false; error: string } {
  try {
    const data = JSON.parse(text)
    const arrays = ['products', 'lots', 'donations', 'movements', 'families', 'deliveries'] as const
    if (data?.version !== 1 || arrays.some((k) => !Array.isArray(data[k])) || typeof data.seq !== 'object')
      return { ok: false, error: 'El archivo no es una copia de seguridad válida de esta aplicación.' }
    if (data.lots.some((l: Lot) => typeof l.quantity !== 'number' || l.quantity < 0))
      return { ok: false, error: 'La copia contiene existencias negativas o inválidas.' }
    const state: BankState = {
      ...emptyState(),
      ...data,
      settings: { ...DEFAULT_SETTINGS, ...data.settings },
      ops: Array.isArray(data.ops) ? data.ops : [],
    }
    return { ok: true, state }
  } catch {
    return { ok: false, error: 'No se pudo leer el archivo. Verifique que sea un archivo .json exportado desde aquí.' }
  }
}

// ---------- Datos de ejemplo ----------

export function demoState(now: Date): BankState {
  let s = emptyState()
  const today = localDate(now)
  const at = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86400000)
  const apply = (r: OpResult) => {
    if (!r.ok) throw new Error(r.error)
    s = r.state
    return r.ref
  }
  const products: ProductInput[] = [
    { name: 'Arroz', category: 'Granos y cereales', unit: 'kg', minStock: 20 },
    { name: 'Frijoles', category: 'Granos y cereales', unit: 'kg', minStock: 15 },
    { name: 'Leche', category: 'Lácteos', unit: 'litros', minStock: 20 },
    { name: 'Aceite', category: 'Aceites', unit: 'litros', minStock: 10 },
    { name: 'Atún en lata', category: 'Enlatados', unit: 'latas', minStock: 20 },
    { name: 'Pasta', category: 'Granos y cereales', unit: 'paquetes', minStock: 15 },
    { name: 'Pan de molde', category: 'Panadería', unit: 'bolsas', minStock: 5 },
  ]
  const ids = products.map((p) => apply(addProduct(s, p, null)))
  const [arroz, frijoles, leche, aceite, atun, pasta, pan] = ids
  const item = (productId: string, quantity: number, lotCode: string, expiry: string | null, condition: Condition = 'apto'): DonationItem => ({
    productId,
    quantity,
    lotCode,
    expiry,
    condition,
    notes: '',
  })

  apply(
    registerDonation(
      s,
      {
        donor: 'Supermercado La Esquina',
        status: 'recibida',
        expectedDate: null,
        receivedBy: 'Jorge',
        items: [
          item(arroz, 30, 'A', addDays(today, 5)),
          item(arroz, 25, 'B', addDays(today, 23)),
          item(leche, 24, 'L1', addDays(today, 3)),
          item(atun, 40, 'AT1', addDays(today, 200)),
          item(aceite, 4, 'AC1', addDays(today, 180)),
        ],
        notes: '',
      },
      null,
      at(35),
    ),
  )
  apply(
    registerDonation(
      s,
      {
        donor: 'Parroquia San José',
        status: 'recibida',
        expectedDate: null,
        receivedBy: 'Marta',
        items: [
          item(frijoles, 12, 'F1', addDays(today, 90)),
          item(pasta, 8, '', addDays(today, 120)),
          item(pan, 6, 'PAN1', addDays(today, -2)),
          item(leche, 6, 'L0', null, 'revision'),
        ],
        notes: 'Donación de la colecta del domingo',
      },
      null,
      at(10),
    ),
  )
  apply(
    registerDonation(
      s,
      {
        donor: 'Vecinos del edificio 12',
        status: 'prevista',
        expectedDate: addDays(today, 2),
        receivedBy: '',
        items: [item(aceite, 10, '', null), item(pasta, 20, '', null)],
        notes: 'Avisaron por teléfono',
      },
      null,
      at(1),
    ),
  )

  const fams: FamilyInput[] = [
    { headName: 'María López', members: 5, contact: '', priorityNeed: '', notes: '' },
    { headName: 'Carlos Pérez', members: 3, contact: '', priorityNeed: '', notes: '' },
    { headName: 'Ana Gómez', members: 2, contact: '', priorityNeed: '', notes: '' },
    { headName: 'Rosa Martínez', members: 6, contact: '', priorityNeed: 'Bebé de 6 meses', notes: '' },
    { headName: 'Luis Fernández', members: 1, contact: '', priorityNeed: '', notes: 'Persona mayor que vive sola' },
    { headName: 'Elena Ruiz', members: 4, contact: '', priorityNeed: '', notes: '' },
  ]
  const famIds = fams.map((f) => apply(addFamily(s, f, null, at(40))))
  const give = (familyId: string, daysAgo: number, lines: DeliveryRequestLine[]) =>
    apply(registerDelivery(s, { familyId, volunteer: 'Marta', lines, exceptionReason: '', notes: '' }, null, at(daysAgo)))
  const basic = (): DeliveryRequestLine[] => [
    { productId: arroz, quantity: 2, lotId: null },
    { productId: atun, quantity: 2, lotId: null },
  ]
  give(famIds[0], 20, basic())
  give(famIds[1], 12, basic())
  give(famIds[2], 4, basic())
  give(famIds[3], 9, basic())
  give(famIds[5], 3, [{ productId: leche, quantity: 2, lotId: null }])
  return s
}

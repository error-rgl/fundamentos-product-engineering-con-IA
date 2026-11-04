import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  addFamily,
  addProduct,
  adjustLot,
  availableQuantity,
  confirmDonation,
  emptyState,
  fefoLots,
  localDate,
  proposeDistribution,
  registerDelivery,
  registerDonation,
  type BankState,
  type DonationItem,
  type OpResult,
} from '../lib/bank.ts'

const NOW = new Date('2026-10-28T12:00:00')
const TODAY = localDate(NOW)
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86400000)

function ok(r: OpResult): BankState {
  if (!r.ok) throw new Error(r.error)
  return r.state
}

function item(productId: string, quantity: number, lotCode: string, expiry: string | null): DonationItem {
  return { productId, quantity, lotCode, expiry, condition: 'apto', notes: '' }
}

function withProduct(name: string, unit = 'unidades') {
  const r = addProduct(emptyState(), { name, category: 'Otros', unit, minStock: 0 }, null)
  if (!r.ok) throw new Error(r.error)
  return { state: r.state, productId: r.ref }
}

function donate(s: BankState, items: DonationItem[], opId: string | null = null, at = NOW) {
  return registerDonation(s, { donor: '', status: 'recibida', expectedDate: null, receivedBy: 'Voluntario', items, notes: '' }, opId, at)
}

test('Registrar una donación recibida: 8 + 12 = 20 con fecha y movimiento', () => {
  let { state: s, productId: arroz } = withProduct('Arroz')
  s = ok(donate(s, [item(arroz, 8, 'A', '2027-01-01')], null, daysAgo(5)))
  assert.equal(availableQuantity(s, arroz, TODAY), 8)
  s = ok(donate(s, [item(arroz, 12, 'A', '2027-01-01')]))
  assert.equal(availableQuantity(s, arroz, TODAY), 20)
  const last = s.donations.at(-1)!
  assert.equal(last.receivedAt, NOW.toISOString())
  const entradas = s.movements.filter((m) => m.type === 'entrada' && m.productId === arroz)
  assert.equal(entradas.length, 2)
  assert.equal(entradas[1].quantity, 12)
  assert.equal(entradas[1].balance, 20)
})

test('Una donación prevista no suma inventario hasta confirmarse, y no se suma dos veces', () => {
  let { state: s, productId: arroz } = withProduct('Arroz')
  s = ok(
    registerDonation(
      s,
      { donor: 'Vecinos', status: 'prevista', expectedDate: TODAY, receivedBy: '', items: [item(arroz, 10, '', null)], notes: '' },
      null,
      NOW,
    ),
  )
  assert.equal(s.lots.length, 0)
  const id = s.donations[0].id
  s = ok(confirmDonation(s, id, { items: [item(arroz, 9, '', '2027-01-01')], receivedBy: 'Ana' }, null, NOW))
  assert.equal(availableQuantity(s, arroz, TODAY), 9)
  const again = confirmDonation(s, id, { items: [item(arroz, 9, '', '2027-01-01')], receivedBy: 'Ana' }, null, NOW)
  assert.equal(again.ok, false)
})

test('Pulsaciones repetidas con la misma operación no duplican el registro', () => {
  let { state: s, productId: arroz } = withProduct('Arroz')
  s = ok(donate(s, [item(arroz, 12, 'A', '2027-01-01')], 'op-1'))
  const r2 = donate(s, [item(arroz, 12, 'A', '2027-01-01')], 'op-1')
  assert.ok(r2.ok && r2.duplicate)
  s = ok(r2)
  assert.equal(availableQuantity(s, arroz, TODAY), 12)
  assert.equal(s.donations.length, 1)
})

test('FEFO: el lote A (vence 2026-11-02) aparece antes que el B, y B sigue disponible', () => {
  let { state: s, productId: arroz } = withProduct('Arroz')
  s = ok(donate(s, [item(arroz, 15, 'B', '2026-11-20'), item(arroz, 10, 'A', '2026-11-02')]))
  const lots = fefoLots(s, arroz, TODAY)
  assert.deepEqual(
    lots.map((l) => [l.code, l.quantity, l.expiry]),
    [
      ['A', 10, '2026-11-02'],
      ['B', 15, '2026-11-20'],
    ],
  )
})

test('Lotes con el mismo código y distinta fecha se separan', () => {
  let { state: s, productId: arroz } = withProduct('Arroz')
  s = ok(donate(s, [item(arroz, 5, 'X', '2026-12-01'), item(arroz, 5, 'X', '2027-02-01')]))
  assert.equal(s.lots.length, 2)
  assert.notEqual(s.lots[0].code, s.lots[1].code)
})

test('No se distribuye un lote vencido: se rechaza, se informa y no se descuenta', () => {
  let { state: s, productId: leche } = withProduct('Leche')
  s = ok(donate(s, [item(leche, 6, 'V', '2026-10-20')], null, daysAgo(30)))
  s = ok(addFamily(s, { headName: 'María López', members: 3, contact: '', priorityNeed: '', notes: '' }, null, daysAgo(30)))
  const lotId = s.lots[0].id
  const r = registerDelivery(
    s,
    { familyId: 'F001', volunteer: 'Ana', lines: [{ productId: leche, quantity: 2, lotId }], exceptionReason: '', notes: '' },
    null,
    NOW,
  )
  assert.equal(r.ok, false)
  assert.match(!r.ok ? r.error : '', /vencido.*revisión/)
  assert.equal(s.lots[0].quantity, 6)
  assert.equal(availableQuantity(s, leche, TODAY), 0)
})

test('Advertir sobre una entrega reciente (3 días, periodo 7) y permitir excepción justificada', () => {
  let { state: s, productId: arroz } = withProduct('Arroz')
  s = ok(donate(s, [item(arroz, 50, 'A', '2027-06-01')], null, daysAgo(10)))
  s = ok(addFamily(s, { headName: 'María López', members: 3, contact: '', priorityNeed: '', notes: '' }, null, daysAgo(10)))
  const line = [{ productId: arroz, quantity: 2, lotId: null }]
  s = ok(registerDelivery(s, { familyId: 'F001', volunteer: 'Ana', lines: line, exceptionReason: '', notes: '' }, null, daysAgo(3)))
  assert.equal(s.settings.recentPeriodDays, 7)
  const blocked = registerDelivery(s, { familyId: 'F001', volunteer: 'Ana', lines: line, exceptionReason: '', notes: '' }, null, NOW)
  assert.equal(blocked.ok, false)
  if (!blocked.ok) {
    assert.equal(blocked.code, 'RECENT')
    assert.equal(blocked.lastDate, daysAgo(3).toISOString())
    assert.match(blocked.error, /hace 3 día/)
  }
  const allowed = registerDelivery(
    s,
    { familyId: 'F001', volunteer: 'Ana', lines: line, exceptionReason: 'Se les inundó la cocina', notes: '' },
    null,
    NOW,
  )
  assert.ok(allowed.ok)
  if (allowed.ok) assert.equal(allowed.state.deliveries.at(-1)!.exceptionReason, 'Se les inundó la cocina')
})

test('Rechazar una entrega mayor al inventario: 5 de leche, se piden 8', () => {
  let { state: s, productId: leche } = withProduct('Leche', 'unidades')
  s = ok(donate(s, [item(leche, 5, 'L', '2027-01-01')]))
  s = ok(addFamily(s, { headName: 'Carlos Pérez', members: 2, contact: '', priorityNeed: '', notes: '' }, null, NOW))
  const r = registerDelivery(
    s,
    { familyId: 'F001', volunteer: 'Ana', lines: [{ productId: leche, quantity: 8, lotId: null }], exceptionReason: '', notes: '' },
    null,
    NOW,
  )
  assert.equal(r.ok, false)
  assert.match(!r.ok ? r.error : '', /Solo hay 5 unidades de Leche/)
  assert.equal(availableQuantity(s, leche, TODAY), 5)
})

test('La entrega descuenta por FEFO y deja historial', () => {
  let { state: s, productId: arroz } = withProduct('Arroz')
  s = ok(donate(s, [item(arroz, 15, 'B', '2026-11-20'), item(arroz, 10, 'A', '2026-11-02')]))
  s = ok(addFamily(s, { headName: 'Ana Gómez', members: 2, contact: '', priorityNeed: '', notes: '' }, null, NOW))
  s = ok(
    registerDelivery(
      s,
      { familyId: 'F001', volunteer: 'Ana', lines: [{ productId: arroz, quantity: 12, lotId: null }], exceptionReason: '', notes: '' },
      null,
      NOW,
    ),
  )
  const byCode = Object.fromEntries(s.lots.map((l) => [l.code, l.quantity]))
  assert.deepEqual(byCode, { A: 0, B: 13 })
  assert.equal(s.movements.filter((m) => m.type === 'salida').length, 2)
})

test('Las correcciones de inventario no permiten negativos y dejan historial', () => {
  let { state: s, productId: arroz } = withProduct('Arroz')
  s = ok(donate(s, [item(arroz, 10, 'A', '2027-01-01')]))
  const lotId = s.lots[0].id
  assert.equal(adjustLot(s, lotId, -1, 'conteo', 'Jorge', null, NOW).ok, false)
  s = ok(adjustLot(s, lotId, 7, 'Conteo semanal', 'Jorge', null, NOW))
  const adj = s.movements.at(-1)!
  assert.equal(adj.type, 'ajuste')
  assert.equal(adj.quantity, -3)
  assert.equal(adj.balance, 7)
})

test('Distribución equitativa: alimentos para 2 familias, F001 (20 días) y F002 (12) primero, sin registrar entregas', () => {
  let { state: s, productId: arroz } = withProduct('Arroz')
  s = ok(donate(s, [item(arroz, 100, 'A', '2027-06-01')], null, daysAgo(40)))
  for (const name of ['María López', 'Carlos Pérez', 'Ana Gómez'])
    s = ok(addFamily(s, { headName: name, members: 3, contact: '', priorityNeed: '', notes: '' }, null, daysAgo(40)))
  const give = (fam: string, d: number) =>
    ok(registerDelivery(s, { familyId: fam, volunteer: 'Ana', lines: [{ productId: arroz, quantity: 1, lotId: null }], exceptionReason: '', notes: '' }, null, daysAgo(d)))
  s = give('F001', 20)
  s = give('F002', 12)
  s = give('F003', 4)
  const available = availableQuantity(s, arroz, TODAY)
  const perFamily = Math.floor(available / 2)
  const deliveriesBefore = s.deliveries.length
  const proposal = proposeDistribution(s, [{ productId: arroz, quantity: perFamily }], TODAY)
  assert.equal(proposal.capacity, 2)
  assert.deepEqual(
    proposal.ranking.filter((r) => r.selected).map((r) => r.family.id),
    ['F001', 'F002'],
  )
  assert.equal(proposal.ranking.find((r) => r.family.id === 'F003')!.selected, false)
  assert.ok(proposal.criteria.length > 0)
  assert.match(proposal.ranking[0].reason, /20 días/)
  assert.equal(s.deliveries.length, deliveriesBefore)
})

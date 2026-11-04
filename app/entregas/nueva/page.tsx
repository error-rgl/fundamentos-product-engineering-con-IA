import { DeliveryForm } from '@/components/bank/deliveries'

export const metadata = { title: 'Registrar entrega · Banco de Alimentos' }

export default async function Page({ searchParams }: { searchParams: Promise<{ familia?: string; items?: string }> }) {
  const { familia, items } = await searchParams
  return <DeliveryForm key={`${familia ?? ''}-${items ?? ''}`} initialFamily={familia} initialItems={items} />
}

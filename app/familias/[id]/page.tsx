import { FamilyDetail } from '@/components/bank/families'

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ nueva?: string }>
}) {
  const { id } = await params
  const { nueva } = await searchParams
  return <FamilyDetail familyId={id} isNew={nueva === '1'} />
}

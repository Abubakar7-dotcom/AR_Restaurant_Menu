import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import ReviewClient from './ReviewClient'

interface Props {
  searchParams: Promise<{ secret?: string }>
}

export default async function AdminReviewPage({ searchParams }: Props) {
  const { secret } = await searchParams

  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    redirect('/login')
  }

  const supabase = createAdminClient()

  const { data: dishes } = await supabase
    .from('dishes')
    .select('*, restaurants(name, slug)')
    .eq('status', 'under_review')
    .order('created_at')

  return <ReviewClient dishes={dishes ?? []} secret={secret!} />
}

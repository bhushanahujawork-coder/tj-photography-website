import { readConfig } from '@/lib/home-config/store'
import { FilmsPageEmbed } from '@/components/films/films-page'

export const runtime = 'nodejs'

export default async function AdminFilmsPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ embed?: string }>
}) {
  const { embed } = await searchParams
  const embedMode = embed === '1'
  const draft = await readConfig('draft')

  return <FilmsPageEmbed mode="preview" initialConfig={draft} embed={embedMode} />
}
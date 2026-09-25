import { readConfig } from '@/lib/home-config/store'
import { AboutPageEmbed } from '@/components/about/about-page'

export const runtime = 'nodejs'

export default async function AdminAboutPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ embed?: string }>
}) {
  const { embed } = await searchParams
  const embedMode = embed === '1'
  const draft = await readConfig('draft')

  return <AboutPageEmbed mode="preview" initialConfig={draft} embed={embedMode} />
}

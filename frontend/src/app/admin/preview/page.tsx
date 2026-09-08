import { readConfig } from '@/lib/home-config/store'
import { PreviewShell } from '@/components/admin/preview-shell'

export const runtime = 'nodejs'

export default async function AdminPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ embed?: string }>
}) {
  const { embed } = await searchParams
  const embedMode = embed === '1'
  const draft = await readConfig('draft')

  return <PreviewShell initialConfig={draft} embed={embedMode} />
}
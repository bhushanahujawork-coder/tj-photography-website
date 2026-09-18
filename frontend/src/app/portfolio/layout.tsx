import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Wedding Gallery — TJ Photography',
  description:
    'Dhariya + Shruti wedding — a full wedding gallery by TJ Photography, Jamnagar.',
}

export default function PortfolioLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children
}
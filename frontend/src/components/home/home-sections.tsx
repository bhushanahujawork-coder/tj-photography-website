'use client'

import HeroSection from '@/components/home/hero-section'
import SoulCinema from '@/components/home/soul-cinema'
import MasonryPortfolio from '@/components/home/masonry-portfolio'
import Reviews from '@/components/home/reviews'
import ContactSection from '@/components/home/contact-section'
import { useHomeConfig } from '@/lib/home-config/client'
import type { SectionId } from '@/lib/home-config/types'

const RENDERERS: Partial<Record<SectionId, () => React.JSX.Element | null>> = {
  hero: HeroSection,
  soulCinema: SoulCinema,
  portfolio: MasonryPortfolio,
  reviews: Reviews,
  contact: ContactSection,
}

/**
 * Renders the middle sections in the published/draft section order.
 * Header + Footer are locked to page-level position and are not part of this list.
 * The default order matches the original hardcoded homepage order exactly.
 */
export default function HomeSections() {
  const { config } = useHomeConfig()
  const order = config.sectionOrder ?? []
  const ids = order.filter((id): id is SectionId => !!RENDERERS[id as SectionId])

  return (
    <>
      {ids.map((id) => {
        const Section = RENDERERS[id]
        return Section ? <Section key={id} /> : null
      })}
    </>
  )
}
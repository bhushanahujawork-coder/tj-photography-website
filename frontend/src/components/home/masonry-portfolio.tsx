'use client'

import SectionHeading from '@/components/ui/section-heading'
import ImageCard from '@/components/ui/image-card'
import { useHomeConfig } from '@/lib/home-config/client'

export default function MasonryPortfolio() {
  const { config } = useHomeConfig()
  const portfolio = config.portfolio.images
  const portfolioHeading = {
    title: config.portfolio.headingTitle,
    description: config.portfolio.headingDescription,
  }
  return (
    <section id="weddings" className="pt-8 md:pt-12 pb-2 scroll-mt-20 md:scroll-mt-24">
      <div className="max-w-7xl mx-auto px-6 2xl:max-w-[1400px] 3xl:max-w-[1700px]">
        <SectionHeading
          title={portfolioHeading.title}
          description={portfolioHeading.description}
        />
      </div>

      <div className="w-full">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-[2px]">
          {portfolio.map((image, i) => (
            <div
              key={image.id}
              className={`relative aspect-square bg-black overflow-hidden ${
                i === 14 ? 'col-span-2 md:col-span-1' : ''
              }`}
            >
              <ImageCard
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                overlay={image.overlay}
                sizes="(max-width: 767px) 50vw, 20vw"
                className="w-full h-full"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

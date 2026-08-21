'use client'

import { portfolio } from '@/data/portfolio'
import { portfolioHeading } from '@/data/homepage'
import SectionHeading from '@/components/ui/section-heading'
import ImageCard from '@/components/ui/image-card'

export default function MasonryPortfolio() {
  return (
    <section id="weddings" className="pt-8 md:pt-12 pb-2">
      <div className="max-w-7xl mx-auto px-6 mb-10 md:mb-14">
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
                className="w-full h-full"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

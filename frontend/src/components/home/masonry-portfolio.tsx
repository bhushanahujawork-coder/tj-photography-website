'use client'

import { portfolio } from '@/data/portfolio'
import { portfolioHeading } from '@/data/homepage'
import SectionHeading from '@/components/ui/section-heading'
import ImageCard from '@/components/ui/image-card'

export default function MasonryPortfolio() {
  return (
    <section id="weddings" className="pt-8 md:pt-10 pb-12 md:pb-16 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading
          title={portfolioHeading.title}
          description={portfolioHeading.description}
        />
      </div>

      <div className="w-full bg-[#2a2a2a] p-[2px]">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-[2px]">
          {portfolio.map((image, i) => (
            <div
              key={image.id}
              className={`relative aspect-square bg-black overflow-hidden group cursor-pointer border border-gold/20 hover:border-gold/60 transition-colors duration-500 ${
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
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-500 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <span className="text-gold text-2xl">{'\u279C'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

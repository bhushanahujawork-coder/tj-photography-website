import type { PortfolioImage } from '@/types'

const dhariya = (id: string) => ({
  src: `/portfolio/dhariya-shruti/gallery/${id}.webp`,
  gridSrc: `/portfolio/dhariya-shruti/grid/${id}.webp`,
})

export const portfolio: PortfolioImage[] = [
  { id: 'p01', ...dhariya('ds-01'), alt: 'Dhariya + Shruti wedding — photo 01', width: 4609, height: 6914 },
  { id: 'p02', ...dhariya('ds-02'), alt: 'Dhariya + Shruti wedding — photo 02', width: 4672, height: 7008 },
  { id: 'p03', ...dhariya('ds-03'), alt: 'Dhariya + Shruti wedding — photo 03', width: 4672, height: 7008 },
  { id: 'p04', ...dhariya('ds-04'), alt: 'Dhariya + Shruti wedding — photo 04', width: 4672, height: 7008 },
  { id: 'p05', ...dhariya('ds-05'), alt: 'Dhariya + Shruti wedding — photo 05', width: 4672, height: 7008 },
  { id: 'p06', ...dhariya('ds-06'), alt: 'Dhariya + Shruti wedding — photo 06', width: 4672, height: 7008 },
  { id: 'p07', ...dhariya('ds-07'), alt: 'Dhariya + Shruti wedding — photo 07', width: 7008, height: 4672 },
  { id: 'p08', ...dhariya('ds-08'), alt: 'Dhariya + Shruti wedding — photo 08', width: 4672, height: 7008 },
  { id: 'p09', ...dhariya('ds-09'), alt: 'Dhariya + Shruti wedding — photo 09', width: 4672, height: 7008 },
  { id: 'p10', ...dhariya('ds-10'), alt: 'Dhariya + Shruti wedding — photo 10', width: 4630, height: 6945 },
  { id: 'p11', ...dhariya('ds-11'), alt: 'Dhariya + Shruti wedding — photo 11', width: 7008, height: 4672 },
  { id: 'p12', ...dhariya('ds-12'), alt: 'Dhariya + Shruti wedding — photo 12', width: 6761, height: 4507 },
  { id: 'p13', ...dhariya('ds-13'), alt: 'Dhariya + Shruti wedding — photo 13', width: 4672, height: 7008 },
  { id: 'p14', ...dhariya('ds-14'), alt: 'Dhariya + Shruti wedding — photo 14', width: 4672, height: 7008 },
  { id: 'p15', ...dhariya('ds-15'), alt: 'Dhariya + Shruti wedding — photo 15', width: 4672, height: 7008 },
  { id: 'p16', ...dhariya('ds-16'), alt: 'Dhariya + Shruti wedding — photo 16', width: 7008, height: 4672 },
  { id: 'p17', ...dhariya('ds-17'), alt: 'Dhariya + Shruti wedding — photo 17', width: 7008, height: 4672 },
  { id: 'p18', ...dhariya('ds-18'), alt: 'Dhariya + Shruti wedding — photo 18', width: 4672, height: 7008 },
  { id: 'p19', ...dhariya('ds-19'), alt: 'Dhariya + Shruti wedding — photo 19', width: 7008, height: 4672 },
  { id: 'p20', ...dhariya('ds-20'), alt: 'Dhariya + Shruti wedding — photo 20', width: 4672, height: 7008 },
  { id: 'p21', ...dhariya('ds-21'), alt: 'Dhariya + Shruti wedding — photo 21', width: 4281, height: 6421 },
  { id: 'p22', ...dhariya('ds-22'), alt: 'Dhariya + Shruti wedding — photo 22', width: 4672, height: 7008 },
  { id: 'p23', ...dhariya('ds-23'), alt: 'Dhariya + Shruti wedding — photo 23', width: 4672, height: 7008 },
  { id: 'p24', ...dhariya('ds-24'), alt: 'Dhariya + Shruti wedding — photo 24', width: 4672, height: 7008 },
  { id: 'p25', ...dhariya('ds-25'), alt: 'Dhariya + Shruti wedding — photo 25', width: 6341, height: 4227 },
]
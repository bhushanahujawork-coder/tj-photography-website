import type { ImageData } from '@/types'

export const hero = {
  slides: [
    {
      src: '/hero/hero-1.webp',
      alt: 'Luxury wedding photography',
    },
    {
      src: '/hero/hero-3.webp',
      alt: 'Fine art wedding portrait',
    },
  ] satisfies ImageData[],
  interval: 5000,
  ctaPrimary: { label: 'View Portfolio', href: '#portfolio' },
  ctaSecondary: { label: 'Find My Wedding', href: '#wedding' },
}

export const whyChooseHeading = {
  title: 'Why Choose TJ Photography',
  description:
    'We believe every wedding tells a unique story. Our approach blends artistry with timeless documentation.',
}

export const portfolioHeading = {
  title: 'Our Portfolio',
  description: 'A curated selection of our favorite moments.',
}

export const timeline = {
  title: 'The Experience',
  description: 'From the first consultation to your final album, every step is crafted with care.',
}

export const findWedding = {
  title: 'Access Your Gallery',
  description: 'Sign in to view and download your wedding photos.',
}

export const instagram = {
  title: 'Follow Our Journey',
  username: '@tjphotography',
  followUrl: 'https://instagram.com/tjphotography',
}

export const storiesHeading = {
  title: 'Featured Wedding Stories',
  description: 'Real love stories, beautifully captured.',
}

export const statisticsHeading = {
  title: "Don't Take Our Word For It — Count the Moments",
}

export const soulCinema = {
  eyebrow: 'Soul Cinema',
  title: 'Feel the Wedding. Not Just See It.',
  description:
    'A cinematic glimpse into the moments we live behind the lens — every frame, a story worth keeping.',
}

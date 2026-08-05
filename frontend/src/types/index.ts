export interface ImageData {
  src: string
  alt: string
  width?: number
  height?: number
  blurDataURL?: string
}

export interface NavLink {
  label: string
  href: string
}

export interface Service {
  id: string
  title: string
  description: string
  icon: string
}

export interface Story {
  id: string
  coverImage: ImageData
  bride: string
  groom: string
  location: string
  date: string
  excerpt: string
  slug?: string
}

export interface Testimonial {
  id: string
  quote: string
  author: string
  weddingDate: string
  image?: ImageData
}

export interface Statistic {
  value: number
  suffix?: string
  prefix?: string
  label: string
}

export interface TimelineStep {
  step: string
  title: string
  description: string
}

export interface PortfolioImage {
  id: string
  src: string
  alt: string
  width: number
  height: number
  overlay?: string
}

export interface SocialLink {
  label: string
  href: string
}

export interface ContactInfo {
  email: string
  phone: string
  location: string
}

export interface CTAButton {
  label: string
  href: string
}

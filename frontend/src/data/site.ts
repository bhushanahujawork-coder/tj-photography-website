import type { NavLink, SocialLink, ContactInfo, CTAButton } from '@/types'

export const site = {
  brand: {
    name: 'TJ Photography',
    tagline: 'Where Love Meets Light',
    subtitle: 'Fine Art Wedding Photography',
    description:
      'Crafting timeless wedding stories through the lens of artistry and emotion.',
  },
  nav: {
    links: [
      { label: 'Weddings', href: '#weddings' },
      { label: 'Films', href: '/films' },
      { label: 'About Us', href: '/about' },
      { label: 'Contact Us', href: '#contact' },
    ] satisfies NavLink[],
    weddingLink: {
      label: 'Find My Wedding',
      href: '#wedding',
    } satisfies NavLink,
    photographerLogin: {
      label: 'Photographer Login',
      href: '/admin',
    } satisfies Pick<NavLink, 'label' | 'href'>,
  },
  footer: {
    quickLinks: [
      { label: 'Weddings', href: '#weddings' },
      { label: 'Films', href: '/films' },
      { label: 'About Us', href: '/about' },
      { label: 'Contact Us', href: '#contact' },
      { label: 'Find My Wedding', href: '#wedding' },
    ] satisfies NavLink[],
    social: [
      { label: 'Instagram', href: '#' },
      { label: 'Facebook', href: '#' },
      { label: 'Pinterest', href: '#' },
    ] satisfies SocialLink[],
    contact: {
      email: 'hello@tjphotography.com',
      phone: '+1 (555) 123-4567',
      location: 'New York City',
    } satisfies ContactInfo,
  },
  cta: {
    heading: 'Ready to Tell Your Story?',
    description:
      'Every love story is unique. Let us capture yours with the artistry and elegance it deserves.',
    primaryButton: {
      label: 'Book Your Wedding',
      href: '#contact',
    } satisfies CTAButton,
    secondaryButton: {
      label: 'Contact Us',
      href: '#contact',
    } satisfies CTAButton,
  },
}

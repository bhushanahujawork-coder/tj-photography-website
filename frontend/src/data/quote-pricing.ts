import type { QuotationConfig } from '@/lib/api-quotation'

/**
 * Demo-mode mirror of `backend/app/core/pricing_config.py::get_public_config()`.
 * Used ONLY when the backend is unreachable so /quote still shows real prices.
 * Regenerate this file whenever backend pricing changes — it is not a second
 * source of truth.
 */

const INCLUSIONS_NOTE = 'Inclusions to be confirmed'

const QUOTATION_NOTE =
  'Final quotation may vary based on confirmed requirements, availability, ' +
  'travel, and other applicable requirements.'

export const QUOTE_CONFIG: QuotationConfig = {
  eventTypes: [
    { value: 'wedding', label: 'Wedding' },
    { value: 'engagement', label: 'Engagement' },
  ],
  packages: {
    wedding: [
      {
        id: 'wedding.silver',
        name: 'Silver',
        price: 110000,
        inclusions: ['Traditional Photography', 'Traditional Videography'],
        inclusionsNote: INCLUSIONS_NOTE,
      },
      {
        id: 'wedding.golden',
        name: 'Golden',
        price: 160000,
        inclusions: [
          'Traditional Photography',
          'Traditional Videography',
          'Candid Photography',
        ],
        inclusionsNote: INCLUSIONS_NOTE,
      },
      {
        id: 'wedding.diamond',
        name: 'Diamond',
        price: 220000,
        inclusions: [
          'Traditional Photography',
          'Traditional Videography',
          'Candid Photography',
          'Cinematography',
        ],
        inclusionsNote: INCLUSIONS_NOTE,
      },
    ],
    engagement: [
      { id: 'engagement.silver', name: 'Silver', price: 40000, inclusions: [], inclusionsNote: INCLUSIONS_NOTE },
      { id: 'engagement.golden', name: 'Golden', price: 60000, inclusions: [], inclusionsNote: INCLUSIONS_NOTE },
      { id: 'engagement.diamond', name: 'Diamond', price: 80000, inclusions: [], inclusionsNote: INCLUSIONS_NOTE },
    ],
  },
  addOns: {
    wedding: [
      { id: 'wedding.lagan_lakhan', name: 'Lagan Lakhan', price: 12000, perDay: false, group: 'Rituals' },
      { id: 'wedding.vana_rasham', name: 'Vana Rasham', price: 12000, perDay: false, group: 'Rituals' },
      { id: 'wedding.mahendi_rasham', name: 'Mahendi Rasham', price: 12000, perDay: false, group: 'Rituals' },
      { id: 'wedding.reels_shooter', name: 'Reels Shooter', price: 10000, perDay: true, group: 'Photography' },
      { id: 'wedding.rituals_photographer', name: 'Rituals Photographer', price: 12000, perDay: true, group: 'Photography' },
      { id: 'wedding.rituals_videographer', name: 'Rituals Videographer', price: 12000, perDay: true, group: 'Photography' },
      { id: 'wedding.candid_photographer', name: 'Candid Photographer', price: 20000, perDay: true, group: 'Photography' },
      { id: 'wedding.cinematographer', name: 'Cinematographer', price: 35000, perDay: true, group: 'Photography' },
      { id: 'wedding.family_photographer', name: 'Family Photographer', price: 15000, perDay: true, group: 'Photography' },
      { id: 'wedding.drone', name: 'Drone', price: 15000, perDay: true, group: 'Photography' },
      { id: 'wedding.drone_fpv', name: 'Drone + FPV', price: 25000, perDay: true, group: 'Photography' },
      { id: 'wedding.same_day_highlight', name: 'Same Day Wedding Highlight', price: 25000, perDay: false, group: 'Editing' },
      { id: 'wedding.urgent_reel', name: 'Urgent One Reel', price: 4000, perDay: false, group: 'Editing' },
      { id: 'wedding.urgent_story', name: 'One Urgent Insta Story', price: 1000, perDay: false, group: 'Editing' },
      { id: 'wedding.insta_post', name: 'One Instagram Post', price: 2000, perDay: false, group: 'Editing' },
    ],
    engagement: [
      { id: 'engagement.kanu_pagala', name: 'Kanu-Pagala', price: 15000, perDay: false, group: 'Rituals' },
      { id: 'engagement.outdoor_couple_shoot', name: 'Outdoor Couple Shoot', price: 20000, perDay: false, group: 'Photography' },
      { id: 'engagement.family_photographer', name: 'Family Photographer', price: 15000, perDay: false, group: 'Photography' },
      { id: 'engagement.drone', name: 'Drone', price: 12000, perDay: false, group: 'Photography' },
      { id: 'engagement.same_day_highlight', name: 'Same Day Highlight', price: 15000, perDay: false, group: 'Editing' },
      { id: 'engagement.urgent_reel', name: 'Urgent One Reel', price: 5000, perDay: false, group: 'Editing' },
      { id: 'engagement.urgent_story', name: 'One Urgent Insta Story', price: 1000, perDay: false, group: 'Editing' },
      { id: 'engagement.insta_post', name: 'One Instagram Post', price: 2000, perDay: false, group: 'Editing' },
    ],
  },
  recommendationRules: [],
  leadStatuses: ['NEW', 'QUOTATION_GENERATED', 'CONTACTED', 'FOLLOW_UP', 'BOOKED', 'LOST'],
  inclusionsNote: INCLUSIONS_NOTE,
  quotationNote: QUOTATION_NOTE,
  currency: 'INR',
  minAddOnQty: 1,
  maxAddOnQty: 3,
}

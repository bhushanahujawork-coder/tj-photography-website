export type AboutMember = {
  name: string
  role: string
  bio: string
  image: string
}

export const about = {
  story: {
    eyebrow: 'Our Story',
    paragraphs: [
      'TJ Photography is a wedding studio based in Jamnagar, trusted by couples across Gujarat. We believe a wedding is not just a ceremony — it is the most important story of your life, and it deserves to be told properly.',
      'That is why we never follow templates. Every wedding gets its own treatment — cinematic films, fine art albums and online galleries your family will revisit for years. We arrive early, stay till the last dance, and capture every moment exactly as it felt.',
    ],
    image: '/portfolio/dhariya-shruti/gallery/ds-01.webp',
    imageAlt: 'TJ Photography wedding work — Dhariya and Shruti',
    polaroids: [
      { src: '/portfolio/dhariya-shruti/gallery/ds-05.webp', alt: 'TJ Photography wedding work' },
      { src: '/portfolio/dhariya-shruti/gallery/ds-08.webp', alt: 'TJ Photography wedding work' },
    ],
    stats: [
      { value: '500+', label: 'Weddings Shot' },
      { value: '12+', label: 'Years of Artistry' },
      { value: '100%', label: 'Happy Couples' },
    ],
  },
  leadership: {
    eyebrow: 'Leadership',
    heading: 'Who Makes TJ Photography',
    members: [
      {
        name: '',
        role: 'Founder & CEO',
        bio: 'The eye behind every frame — leads the creative vision and ensures every wedding is shot with soul.',
        image: '/studio/owner.webp',
      },
      {
        name: '',
        role: 'Studio Manager',
        bio: 'Keeps the studio flawless — from client experience to timelines, everything runs like clockwork.',
        image: '/studio/owner.webp',
      },
      {
        name: '',
        role: 'Creative Director & CTO',
        bio: 'Drives the technology — AI galleries, cinematic grading and the digital magic behind every delivery.',
        image: '/studio/owner.webp',
      },
    ],
  },
  team: {
    eyebrow: 'The Team',
    heading: 'Our Team',
    subtitle:
      'The artists behind the lens — the people who make every TJ wedding unforgettable.',
    members: [
      { name: '', role: 'Lead Photographer', bio: '', image: '/studio/owner.webp' },
      { name: '', role: 'Photographer', bio: '', image: '/studio/owner.webp' },
      { name: '', role: 'Photographer', bio: '', image: '/studio/owner.webp' },
      { name: '', role: 'Associate Photographer', bio: '', image: '/studio/owner.webp' },
      { name: '', role: 'Lead Cinematographer', bio: '', image: '/studio/owner.webp' },
      { name: '', role: 'Cinematographer', bio: '', image: '/studio/owner.webp' },
      { name: '', role: 'Video Editor', bio: '', image: '/studio/owner.webp' },
      { name: '', role: 'Colorist', bio: '', image: '/studio/owner.webp' },
      { name: '', role: 'Album Designer', bio: '', image: '/studio/owner.webp' },
      { name: '', role: 'Retoucher', bio: '', image: '/studio/owner.webp' },
      { name: '', role: 'Client Experience', bio: '', image: '/studio/owner.webp' },
      { name: '', role: 'Studio Support', bio: '', image: '/studio/owner.webp' },
    ] as AboutMember[],
  },
  cities: {
    eyebrow: 'Cities We Serve',
    heading: 'As Seen In',
    caption: 'Trusted by couples across Gujarat & beyond',
    cities: ['Jamnagar', 'Rajkot', 'Ahmedabad'],
  },
  quotes: [
    { text: 'We don\u2019t take photos. We freeze feelings.', label: 'The TJ Philosophy' },
    {
      text: 'Every wedding is a once-in-a-lifetime story. We just make sure it is told beautifully.',
      label: 'The TJ Promise',
    },
    {
      text: 'The best frame is the one where your heart was full — and it shows.',
      label: 'The TJ Standard',
    },
  ],
}

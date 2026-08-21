export type AboutMember = {
  name: string
  role: string
  bio: string
  image: string
}

export const about = {
  story: {
    eyebrow: 'Our Story',
    heading: "We Don't Just Shoot Weddings.",
    accent: 'We Freeze Feelings.',
    paragraphs: [
      'TJ Photography is a wedding studio based in Jamnagar, trusted by couples across Gujarat. We believe a wedding is not just a ceremony — it is the most important story of your life, and it deserves to be told properly.',
      'That is why we never follow templates. Every wedding gets its own treatment — cinematic films, fine art albums and online galleries your family will revisit for years. We arrive early, stay till the last dance, and capture every moment exactly as it felt.',
    ],
    image: '/studio/studio-1.svg',
    imageAlt: 'TJ Photography studio',
    polaroids: [
      { src: '/studio/studio-2.svg', alt: 'TJ Photography studio' },
      { src: '/studio/studio-3.svg', alt: 'TJ Photography studio' },
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
        image: '/studio/team-a.svg',
      },
      {
        name: '',
        role: 'Studio Manager',
        bio: 'Keeps the studio flawless — from client experience to timelines, everything runs like clockwork.',
        image: '/studio/team-b.svg',
      },
      {
        name: '',
        role: 'Creative Director & CTO',
        bio: 'Drives the technology — AI galleries, cinematic grading and the digital magic behind every delivery.',
        image: '/studio/team-c.svg',
      },
    ],
  },
  team: {
    eyebrow: 'The Team',
    heading: 'Our Team',
    subtitle:
      'The artists behind the lens — the people who make every TJ wedding unforgettable.',
    members: [
      { name: '', role: 'Lead Photographer', bio: '', image: '/studio/team-d.svg' },
      { name: '', role: 'Photographer', bio: '', image: '/studio/team-e.svg' },
      { name: '', role: 'Photographer', bio: '', image: '/studio/team-f.svg' },
      { name: '', role: 'Associate Photographer', bio: '', image: '/studio/team-g.svg' },
      { name: '', role: 'Lead Cinematographer', bio: '', image: '/studio/team-h.svg' },
      { name: '', role: 'Cinematographer', bio: '', image: '/studio/team-i.svg' },
      { name: '', role: 'Video Editor', bio: '', image: '/studio/team-j.svg' },
      { name: '', role: 'Colorist', bio: '', image: '/studio/team-k.svg' },
      { name: '', role: 'Album Designer', bio: '', image: '/studio/team-l.svg' },
      { name: '', role: 'Retoucher', bio: '', image: '/studio/team-m.svg' },
      { name: '', role: 'Client Experience', bio: '', image: '/studio/team-n.svg' },
      { name: '', role: 'Studio Support', bio: '', image: '/studio/team-o.svg' },
    ],
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
  marquee: {
    items: [
      'Weddings',
      'Films',
      'Albums',
      'Love Stories',
      'Candid',
      'Golden Hour',
      'Fine Art',
      'Vows',
      'Memories',
      'Timeless',
      'Elegance',
      'Forever',
    ],
  },
}

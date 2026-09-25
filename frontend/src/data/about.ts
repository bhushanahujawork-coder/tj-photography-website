export type AboutMember = {
  name: string
  role: string
  bio: string
  image: string
}

export const about = {
  hero: {
    image: '/portfolio/dhariya-shruti/gallery/ds-01.webp',
    imageAlt: 'TJ Photography wedding work — Dhariya and Shruti',
    title: 'About the Studio',
    subtitle: 'The team behind TJ Photography',
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
    {
      text: 'Light fades, decor comes down — what stays is how the day felt.',
      label: 'On Craft',
    },
    {
      text: 'A great photograph is honest before it is beautiful.',
      label: 'On Honesty',
    },
    {
      text: 'We shoot quietly, so your moments stay truly yours.',
      label: 'On Presence',
    },
    {
      text: 'Traditions deserve patience; candid moments deserve speed.',
      label: 'On Balance',
    },
    {
      text: 'The small in-between moments become the biggest memories.',
      label: 'On Detail',
    },
    {
      text: 'Every family has its own rhythm. We learn it before we shoot it.',
      label: 'On People',
    },
    {
      text: 'Years from now, these frames should still feel like yesterday.',
      label: 'On Legacy',
    },
  ],
  founders: {
    eyebrow: 'Our Founders',
    heading: 'The People Behind the Studio',
    groupImage: '/final-about-us.webp',
    groupImageAlt: 'TJ Photography founders — owner centered with co-founder and manager',
    members: [
      {
        name: 'Hardik Bhai',
        role: 'Co-Founder',
        bio: 'Drives the craft — cinematic grading and the magic behind every delivery.',
        image: '/final-about-us.webp',
      },
      {
        name: 'Tejash Parmar',
        role: 'Founder',
        bio: 'Leads the creative vision — every wedding is shot with soul.',
        image: '/final-about-us.webp',
      },
      {
        name: 'Binal Bhai',
        role: 'Manager',
        bio: 'Keeps the studio flawless — client experience, timelines, everything on track.',
        image: '/final-about-us.webp',
      },
    ],
  },
  approach: {
    eyebrow: 'Our Approach',
    heading: 'What We Believe',
    paragraph:
      'TJ Photography is a wedding studio based in Jamnagar. We never follow templates — every wedding gets its own treatment, so your family revisits these frames for years.',
    principles: ['Authenticity', 'Storytelling', 'People First', 'Attention to Detail'],
  },
  team: {
    eyebrow: 'The Team',
    heading: 'Our Team',
    subtitle:
      'The artists behind the lens — the people who make every TJ wedding unforgettable.',
    members: [
      { name: '', role: 'Lead Photographer', bio: '', image: '/studio/team-a.svg' },
      { name: '', role: 'Photographer', bio: '', image: '/studio/team-b.svg' },
      { name: '', role: 'Photographer', bio: '', image: '/studio/team-c.svg' },
      { name: '', role: 'Associate Photographer', bio: '', image: '/studio/team-d.svg' },
      { name: '', role: 'Associate Photographer', bio: '', image: '/studio/team-e.svg' },
      { name: '', role: 'Lead Cinematographer', bio: '', image: '/studio/team-f.svg' },
      { name: '', role: 'Cinematographer', bio: '', image: '/studio/team-g.svg' },
      { name: '', role: 'Cinematographer', bio: '', image: '/studio/team-h.svg' },
      { name: '', role: 'Video Editor', bio: '', image: '/studio/team-i.svg' },
      { name: '', role: 'Colorist', bio: '', image: '/studio/team-j.svg' },
      { name: '', role: 'Album Designer', bio: '', image: '/studio/team-k.svg' },
      { name: '', role: 'Retoucher', bio: '', image: '/studio/team-l.svg' },
      { name: '', role: 'Drone Operator', bio: '', image: '/studio/team-m.svg' },
      { name: '', role: 'Client Experience', bio: '', image: '/studio/team-n.svg' },
      { name: '', role: 'Studio Support', bio: '', image: '/studio/team-o.svg' },
    ] as AboutMember[],
  },
}

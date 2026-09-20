// Seed projects. Only Hospitality has real sample content in the prototype;
// the other categories start empty and are filled by the client through the CMS.
// Shape mirrors the Phase 2 database table so the seed script can load it as-is.
const hiltonImages = [
  '/images/projects/HH_01.png',
  '/images/projects/HH_02.png',
  '/images/projects/HH_03.png',
  '/images/projects/HH_04.png',
];

const projects = [
  {
    id: 'hotel-hilton',
    slug: 'hotel-hilton',
    category: 'hospitality',
    name: 'Hotel Hilton',
    location: 'Mumbai',
    areaSqft: null,
    description:
      'International Airport, Mumbai\n\niConcepts + Partners is a Mumbai Based Firm, founded in the year 2007. iC+P is proud to have designed a whole host of successful projects of varied nature and possibilities i.e. Hospitality, Residential, Commercial to Recreational spaces/clubhouses, from prestige settings to building lobbies, sales galleries and many more - all of which has equipped Team iC+P with a unique perspective to craft a collaborative space that is entirely fit for purpose, centred and tailored around the Clients needs, budgets & style preferences thereby creating functional, soulful & aesthetically elevated spaces that have a unique and unmatched narrative quality.',
    thumbnail: '/images/HH_-Thumbnail.png',
    images: hiltonImages,
    published: true,
    sortOrder: 1,
  },
  {
    id: 'hotel-sahara-star',
    slug: 'hotel-sahara-star',
    category: 'hospitality',
    name: 'Hotel Sahara Star',
    location: 'Mumbai',
    areaSqft: null,
    description:
      'A boutique hospitality concept shaped by layered textures, soft lighting, and curated detailing. The spatial narrative emphasizes functionality while maintaining a premium, inviting atmosphere.',
    thumbnail: '/images/SS_Thumbnail.png',
    images: hiltonImages,
    published: true,
    sortOrder: 2,
  },
  {
    id: 'aamby-valley',
    slug: 'aamby-valley',
    category: 'hospitality',
    name: 'Aamby Valley',
    location: 'Lonavala',
    areaSqft: null,
    description:
      'A contemporary hospitality setting designed for flexibility and memorable guest touchpoints. Clean lines, balanced proportions, and warm finishes create a sophisticated yet comfortable mood.',
    thumbnail: '/images/AV_Thumbnail.png',
    images: hiltonImages,
    published: true,
    sortOrder: 3,
  },
  {
    id: 'golden-chariott',
    slug: 'golden-chariott',
    category: 'hospitality',
    name: 'Golden Chariott',
    location: 'Mumbai',
    areaSqft: null,
    description:
      'A layered interior with strong axial planning and carefully tuned lighting. The experience moves from bold arrival moments to quieter, restorative zones.',
    thumbnail: '/images/GC_Thumbnail.png',
    images: hiltonImages,
    published: true,
    sortOrder: 4,
  },
  {
    id: 'brass-monkey',
    slug: 'brass-monkey',
    category: 'hospitality',
    name: 'Brass Monkey',
    location: 'Mumbai',
    areaSqft: null,
    description:
      'An elegant hospitality experience with restrained materiality and detailed craftsmanship. The composition prioritizes comfort, legibility, and long-term durability.',
    thumbnail: '/images/BM_Thumbnail.png',
    images: hiltonImages,
    published: true,
    sortOrder: 5,
  },
];

export default projects;

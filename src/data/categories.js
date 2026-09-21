// Portfolio categories. `slug` is the URL segment and the storage folder name
// (projects/{slug}/...), so it must stay URL- and filesystem-safe.
// `description` (client copy, September 2026) introduces each category on its
// portfolio page; editable from the admin (Site text & contact).
const categories = [
  {
    slug: 'hospitality',
    label: 'Hospitality',
    image: '/images/Cat_Hosp.png',
    sortOrder: 1,
    description: `We design hospitality spaces that are distinctive, immersive and thoughtfully resolved—from hotels, suites and lobbies to restaurants, clubs, spas and serviced residences.

Our approach balances experience, functionality and aesthetics, translating a project’s identity into a cohesive design language through intelligent planning, considered material palettes and refined detailing. Working across complex programmes, budgets and multiple consultants, iC+P brings design thinking and executional clarity together to create spaces that are memorable, relevant and designed to endure.`,
  },
  {
    slug: 'builders-developers',
    label: 'Builders & Developers',
    image: '/images/Cat_Developer.png',
    sortOrder: 2,
    description: `We collaborate with residential developers to transform spaces into distinctive, desirable and experience-led environments—from sales galleries and show flats to clubhouses, amenities and building lobbies.

Working with the existing architectural framework, we bring together intelligent planning, refined aesthetics and a deep understanding of contemporary lifestyles to create spaces that respond to evolving behaviours and diverse, multi-generational needs. Our design approach seeks to make residential environments feel considered, aspirational and enduring, creating a strong sense of place while enhancing the overall experience of the development.`,
  },
  {
    slug: 'commercial',
    label: 'Commercial',
    image: '/images/Cat_ Comm.png',
    sortOrder: 3,
    description: `We create commercial environments that align business objectives with thoughtful design, from workplaces and corporate lobbies to clubhouses, wellness spaces and other high-use environments.

Our approach brings together functionality, efficiency, safety and aesthetics, while translating the character and aspirations of each business into a distinctive spatial identity. Through intelligent planning, considered materiality and attention to detail, iC+P creates environments that enhance experience, support performance and strengthen the way a brand is perceived.`,
  },
  {
    slug: 'private-residences',
    label: 'Private Residences',
    image: '/images/Cat_Pvt Res.png',
    sortOrder: 4,
    description: `We design private residences, villas, penthouses and apartments as highly personal expressions of the people who inhabit them. Working closely with our clients, we translate their lifestyle, aspirations, preferences and collections into spaces that feel intuitive, individual and entirely their own.

Our process begins with intelligent space planning, proportion and functionality, establishing a strong foundation before developing the design language. Material palettes, bespoke joinery, refined detailing and considered lighting come together to create interiors that are layered, tactile and enduring.

For us, luxury is not defined by excess or the most expensive materials. It lies in creating a space where every element feels purposeful, beautifully resolved and perfectly suited to its inhabitant—ultimately enhancing the experience of living.`,
  },
];

export default categories;

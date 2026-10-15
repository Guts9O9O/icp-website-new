// Portfolio categories. `slug` is the URL segment and the storage folder name
// (projects/{slug}/...), so it must stay URL- and filesystem-safe — the labels
// changed in R4 but the slugs deliberately did not, so existing links hold.
// `description` is the studio's own segment write-up (October 2026), lifted
// from their document; it introduces each category on its portfolio page and
// is editable from the admin (Site text & contact).
const categories = [
  {
    slug: 'builders-developers',
    label: 'Developers',
    image: '/images/cat-developers.png',
    sortOrder: 1,
    description: `DESIGNING FOR VISION & VALUE

We collaborate with residential developers to transform spaces into distinctive, desirable and experience-led environments—from sales galleries and show flats to clubhouses, amenities and building lobbies. Working within the existing architectural framework, we bring together intelligent planning, refined aesthetics and a deep understanding of contemporary lifestyles to create spaces that respond to evolving behaviors and diverse, multi-generational needs. Our multidisciplinary approach integrates architecture, interiors, materials, lighting and landscape into a cohesive design language, balancing creative vision with functionality, budgets, timelines and practical performance. Through a considered design process rooted in context, user aspirations and meticulous detailing, we create residential environments that feel purposeful, aspirational and enduring—strengthening the development’s identity while enhancing the experience of the people who inhabit and engage with it.

CREATING DISTINCTIVE ENVIRONMENTS THAT ELEVATE THE DEVELOPMENT AND ITS EXPERIENCE

Designing for builders and developers is about translating a vision into a distinctive experience that creates value and desire. We shape developments with a strong identity, refined character and enduring appeal, ensuring that every design decision contributes to the overall vision while responding to the practical demands of execution. Every touch point is thoughtfully designed to connect with the end user—from the first impression at a sales gallery to the experience of living, interacting and belonging. By bringing together intelligent space planning, material exploration, lighting, detailing and a sensitivity to context, we create cohesive environments that balance aesthetic distinction with functional relevance.

Ultimately, great development design goes beyond aesthetics. It creates distinction, strengthens perceived value and builds an emotional connection with the end user—shaping places that people aspire to be part of.`,
  },
  {
    slug: 'hospitality',
    label: 'Hospitality',
    image: '/images/cat-hospitality.png',
    sortOrder: 2,
    description: `THE CRAFT OF HOSPITALITY INTERIORS

Hospitality design is the art of turning a place into an experience—one that begins with arrival and lingers long after departure. We bring together architecture, interiors, light, material, texture and proportion to create environments with a distinct sense of character and atmosphere.

From arrival lounges, lobbies and guest rooms to suites, restaurants, banquets, business center, wellness and recreational facilities, we design across the spectrum of hotel environments, creating a cohesive design language that connects every space to the larger hospitality experience. Every space is thoughtfully choreographed around how people gather, connect, dine, relax and experience—balancing function with emotion. Our approach combines intelligent spatial planning, considered material palettes and meticulous detailing with a clear understanding of operational requirements, guest expectations and the unique identity of each project.

Working across complex programmes, budgets and multiple consultants, iC+P brings design thinking, technical coordination and executional clarity together to translate design intent into well-resolved, functional and enduring spaces. Ultimately, Great hospitality is more than a beautifully designed space; it is an experience that creates a feeling, a memory and a reason to return thereby crafting sophisticated spaces where design, experience & emotion converge.`,
  },
  {
    slug: 'commercial',
    label: 'Commercial',
    image: '/images/cat-commercial.png',
    sortOrder: 3,
    description: `WHERE DESIGN MEETS PERFORMANCE

We create commercial environments that align business objectives with thoughtful design, from workplaces and corporate lobbies to clubhouses, wellness spaces and other high-use environments. Our approach brings together functionality, efficiency, safety and aesthetics, translating the character and aspirations of each business into a distinctive spatial identity. Through intelligent planning, considered materiality and attention to detail, iC+P creates environments that enhance experience, support performance and strengthen the way a brand is perceived.

DESIGNING PURPOSEFUL ENVIRONMENTS WHERE IDENTITY, PRODUCTIVITY AND EXPERIENCE COME TOGETHER

Designing commercial spaces is the art of translating a brand’s identity, purpose and aspirations into a meaningful spatial experience. We balance architecture, interiors, light, material and proportion to create environments that are functional, distinctive and engaging. Our design process integrates spatial planning, user behavior, operational requirements and material exploration, ensuring that every decision responds to the needs of the business and the people who inhabit the space. Every detail is shaped around how people work, interact and experience their surroundings, creating environments that reflect the brand while enhancing everyday experience.

Ultimately, a well-designed commercial space is not simply built; it is thoughtfully composed to perform, inspire and leave a lasting impression.`,
  },
  {
    slug: 'private-residences',
    label: 'Pvt. Residences',
    image: '/images/cat-private-residences.png',
    sortOrder: 4,
    description: `THE ART OF THE ABODE

We design private residences, villas, penthouses and apartments as highly personal expressions of the people who inhabit them. Working closely with our clients, we translate their lifestyles, aspirations, preferences and collections into spaces that feel intuitive, individual and entirely their own. Our process begins with intelligent space planning, proportion and functionality, establishing a strong foundation before developing a cohesive design language. Bringing together architecture, interiors, lighting, materiality and bespoke elements, we explore how each discipline can contribute to a unified spatial experience. Considered material palettes, custom joinery, refined detailing and layered lighting come together to create interiors that are tactile, harmonious and enduring.

Balancing creative intent with practical performance, we approach every home with an understanding of its context, the way it will be used and the needs of those who inhabit it. From the overall spatial composition to the smallest detail, every decision is thoughtfully resolved to align aesthetics, functionality, budgets and execution. For us, luxury is not defined by excess or the most expensive materials. It lies in creating spaces where every element feels purposeful, beautifully resolved and perfectly suited to its inhabitant—enhancing the everyday experience of living.

CRAFTING HOMES THAT REFLECT HOW WE LIVE, FEEL & BELONG.

Designing a home is the art of translating the way one lives into a meaningful spatial experience. We balance architecture, interiors, light, material and proportion to create spaces that feel considered yet effortless. Every detail is shaped around the people who inhabit them, reflecting their personalities, rituals and aspirations. Ultimately, a well-designed home is not simply built; it is thoughtfully composed to be lived, experienced and remembered.`,
  },
  {
    slug: 'bespoke-elements',
    label: 'Bespoke Elements',
    image: '/images/cat-bespoke-elements.png',
    sortOrder: 5,
    description: `DESIGNED TO DEFINE

Bespoke elements that transform design into identity.

Designing bespoke elements is about creating singular pieces that belong uniquely to a space, its story and its character. At iC+P, we curate and develop furniture, lighting, artful installations and architectural details specifically for each project, translating the larger design narrative into elements of individuality and distinction.

Our multidisciplinary approach brings together creative exploration, material innovation, craftsmanship and technical understanding to refine every element in terms of form, proportion, function and detail. Through a considered design process, we balance creative intent with spatial context, practical performance and project requirements, ensuring that each piece is both expressive and purposefully resolved.

Conceived to complement the overall design language, these elements add depth, create focal points and enrich the experience of a space. Ultimately, the most memorable details are not simply designed for a project; they become its signature — distinctive statement pieces that define its character and create an identity of their own.`,
  },
];

export default categories;

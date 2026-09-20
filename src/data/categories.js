// Portfolio categories. `slug` is the URL segment and the storage folder name
// (projects/{slug}/...), so it must stay URL- and filesystem-safe.
const categories = [
  { slug: 'hospitality', label: 'Hospitality', image: '/images/Cat_Hosp.png', sortOrder: 1 },
  { slug: 'builders-developers', label: 'Builders & Developers', image: '/images/Cat_Developer.png', sortOrder: 2 },
  { slug: 'commercial', label: 'Commercial', image: '/images/Cat_ Comm.png', sortOrder: 3 },
  { slug: 'private-residences', label: 'Private Residences', image: '/images/Cat_Pvt Res.png', sortOrder: 4 },
];

export default categories;

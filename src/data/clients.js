// Client logos grouped by portfolio category, in the order they appear in the
// R3 grid (two columns per category, row by row). Image cells reference
// /public/images/clients; text cells are private clients without a logo.
const clientGroups = [
  {
    category: 'hospitality',
    label: 'Hospitality',
    items: [
      { type: 'image', file: 'hilton.png', name: 'Hilton' },
      { type: 'image', file: 'tfs.png', name: 'Travel Food Services' },
      { type: 'image', file: 'aamby-valley.png', name: 'Aamby Valley' },
      { type: 'image', file: 'sahara-star.png', name: 'Hotel Sahara Star' },
      { type: 'image', file: 'sankam-boutique-hotel.png', name: 'Sankam Boutique Hotel' },
      { type: 'image', file: 'sankam-residency.png', name: 'Sankam Residency' },
    ],
  },
  {
    category: 'builders-developers',
    label: 'Builders & Developers',
    items: [
      { type: 'image', file: 'lnt-realty.png', name: 'L&T Realty' },
      { type: 'image', file: 'raheja-universal.png', name: 'Raheja Universal' },
      { type: 'image', file: 'puravankara.png', name: 'Puravankara' },
      { type: 'image', file: 'provident.png', name: 'Provident' },
      { type: 'image', file: 'wadhwa-group.png', name: 'The Wadhwa Group' },
      { type: 'image', file: 'ashwin-sheth.png', name: 'Ashwin Sheth' },
      { type: 'image', file: 'cci-projects.png', name: 'CCI Projects' },
      { type: 'image', file: 'indiabulls.png', name: 'Indiabulls Real Estate' },
      { type: 'image', file: 'pra-realty.png', name: 'PRA Realty India Pvt. Ltd' },
      { type: 'image', file: 'ozone-group.png', name: 'Ozone Group' },
    ],
  },
  {
    category: 'commercial',
    label: 'Commercial',
    items: [
      { type: 'image', file: 'avi-worldwide.png', name: 'AVI Worldwide Pvt Ltd' },
      { type: 'image', file: 'cfe.png', name: 'Centre for Excellence' },
      { type: 'image', file: 'psp-laser-tech.png', name: 'PSP Laser Tech Pvt. Ltd' },
      { type: 'image', file: 'nixon.png', name: 'Nixon' },
      { type: 'image', file: 'dark-temptations.png', name: 'Dark Temptations' },
      { type: 'image', file: 'merint.png', name: 'Merint' },
    ],
  },
  {
    category: 'private-residences',
    label: 'Private Residences',
    items: [
      { type: 'text', text: 'Former CEO\nHotel Sahara Star & Aamby Valley\nMumbai, Maharashtra' },
      { type: 'text', text: 'Hegde House,\nBelgavi Karnataka' },
      { type: 'text', text: 'Hegde House,\nBelgavi Karnataka' },
      { type: 'text', text: '19/D Dr. Nandkumar House,\nMumbai Maharashtra' },
      { type: 'text', text: 'Bayana House,\nGurugram NCR' },
      { type: 'text', text: "Shetty's Apartment\nMumbai Maharashtra" },
    ],
  },
];

export default clientGroups;

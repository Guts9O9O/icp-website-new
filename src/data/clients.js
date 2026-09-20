// Client logos grouped by portfolio category. Image cells reference
// /public/images/clients; text cells are private clients without a logo.
// A `null` entry leaves an empty cell so the grid matches the design mock.
const clientGroups = [
  {
    category: 'hospitality',
    label: 'Hospitality',
    items: [
      { type: 'image', file: 'Hilton.png', name: 'Hilton' },
      { type: 'image', file: 'TFS.png', name: 'Travel Food Services' },
      { type: 'image', file: 'Aamby Valley.png', name: 'Aamby Valley' },
      { type: 'image', file: 'Hotel Sahara Star.png', name: 'Hotel Sahara Star' },
      { type: 'image', file: 'Sankama Boutique Hotel.png', name: 'Sankama Boutique Hotel' },
      { type: 'image', file: 'Sankam Residency.png', name: 'Sankam Residency' },
    ],
  },
  {
    category: 'builders-developers',
    label: 'Builders & Developers',
    items: [
      { type: 'image', file: 'L & T Realty.png', name: 'L&T Realty' },
      { type: 'image', file: 'Raheja Universal.png', name: 'Raheja Universal' },
      { type: 'image', file: 'Puravankara.png', name: 'Puravankara' },
      { type: 'image', file: 'Provident.png', name: 'Provident' },
      { type: 'image', file: 'Wadhwa group.png', name: 'Wadhwa Group' },
      { type: 'image', file: 'Ashwin sheth.png', name: 'Ashwin Sheth' },
      { type: 'image', file: 'CCI Projects.png', name: 'CCI Projects' },
      { type: 'image', file: 'Indiabulls.png', name: 'Indiabulls' },
      null,
      { type: 'image', file: 'Ozone group.png', name: 'Ozone Group' },
    ],
  },
  {
    category: 'commercial',
    label: 'Commercial',
    items: [
      { type: 'image', file: 'AVI.png', name: 'AVI Worldwide Pvt Ltd' },
      { type: 'image', file: 'CFE.png', name: 'Centre for Excellence' },
      { type: 'image', file: 'PSP.png', name: 'PSP Laser Tech Pvt.Ltd' },
      { type: 'image', file: 'Nixon.png', name: 'Nixon' },
      { type: 'image', file: 'Dark Temptations.png', name: 'Dark Temptations' },
      { type: 'image', file: 'Merint.png', name: 'Merint' },
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

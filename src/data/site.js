// Studio contact details shown on the enquiry page. Social URLs are
// placeholders until the client confirms them.
const site = {
  phone: '+91 99 8792 1441',
  // `email` takes staff recruitment and general enquiries, `designEmail` design
  // requests; the Enquiry page shows whichever the visitor's subject reaches.
  email: 'studio@icp.firm.in',
  designEmail: 'imran@icp.firm.in',
  addressLines: [
    'Studio: Unit no: 306, Shree Krishna Industrial Estate,',
    'Off Western Express Highway, Dahisar East, Mumbai 400 068.',
  ],
  // The brand-red discs the designer supplied with the October feedback, at
  // the resolution R3 expects. `iconHover` is kept in the shape because the
  // stored settings carry it, but both now point at the same artwork.
  socials: [
    { name: 'Instagram', href: '#', icon: '/images/icons/Insta.png', iconHover: '/images/icons/Insta_C.png' },
    { name: 'LinkedIn', href: '#', icon: '/images/icons/LinkedIN.png', iconHover: '/images/icons/LinkedIN_C.png' },
    { name: 'Pinterest', href: '#', icon: '/images/icons/Pinterest.png', iconHover: '/images/icons/Pinterest_C.png' },
  ],
};

export default site;

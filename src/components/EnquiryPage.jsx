const requestOptions = [
  'Design Request',
  'Staff Recruitment',
  'Other',
];

const categories = [
  'Hospitality',
  'Builders & Developers',
  'Commercial',
  'Private Residence',
];

export default function EnquiryPage({ onNavigate }) {
  return (
    <div className="min-h-screen font-brand text-[#d8d0c6]" style={{ background: '#514a43' }}>
      <div className="fixed inset-y-0 left-0 z-30 w-[14.5px] bg-[#781F1C]" />
      <div className="fixed inset-y-0 right-0 z-30 w-[14.5px] bg-[#C3BDB4]" />

      <nav className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3 text-[15px] font-semilight tracking-wide text-[#bfb6ab]">
          <span className="h-[30px] w-[7.5px] bg-[#781F1C]" />
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="transition hover:text-[#f1e6da]"
          >
            Home
          </button>
        </div>
        <div className="flex items-center gap-3 text-[18px] font-semilight tracking-wide text-[#c9c0b6]">
          <span>enquiry</span>
          <span className="text-[#8c8177]">|</span>
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="transition hover:text-[#f1e6da]"
          >
            contact us
          </button>
          <span className="h-[30px] w-[7.5px] bg-[#781F1C]" />
        </div>
      </nav>

      <main className="relative min-h-screen">

        <section className="relative z-10 grid min-h-screen grid-cols-2 px-10 pb-32 pt-24">
          <div className="pr-10">
            <form className="space-y-5 text-[13px] text-[#cfc6bc]">
              <div className="flex items-center gap-4">
                <label className="w-28 text-[#bfb6ab]">Subject</label>
                <div className="flex flex-1 gap-4">
                  <div className="relative flex-1">
                    <select className="w-full appearance-none border border-[#7a7168] bg-transparent px-3 py-2 text-[#d8d0c6]">
                      {requestOptions.map((item) => (
                        <option key={item} value={item} className="text-black">
                          {item}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#bfb6ab]">▼</span>
                  </div>
                  <div className="relative flex-1">
                    <select className="w-full appearance-none border border-[#7a7168] bg-transparent px-3 py-2 text-[#d8d0c6]">
                      {categories.map((item) => (
                        <option key={item} value={item} className="text-black">
                          {item}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#bfb6ab]">▼</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="w-28 text-[#bfb6ab]">Your Name</label>
                <input className="flex-1 border border-[#7a7168] bg-transparent px-3 py-2" />
              </div>

              <div className="flex items-center gap-4">
                <label className="w-28 text-[#bfb6ab]">Company Name</label>
                <input className="flex-1 border border-[#7a7168] bg-transparent px-3 py-2" />
              </div>

              <div className="flex items-center gap-4">
                <label className="w-28 text-[#bfb6ab]">Email Address</label>
                <input className="flex-1 border border-[#7a7168] bg-transparent px-3 py-2" />
              </div>

              <div className="flex items-center gap-4">
                <label className="w-28 text-[#bfb6ab]">Address</label>
                <input className="flex-1 border border-[#7a7168] bg-transparent px-3 py-2" />
              </div>

              <div className="flex items-center gap-4">
                <label className="w-28 text-[#bfb6ab]">Zip Code</label>
                <input className="flex-1 border border-[#7a7168] bg-transparent px-3 py-2" />
              </div>

              <div className="flex items-start gap-4">
                <label className="w-28 text-[#bfb6ab]">Requirement</label>
                <textarea className="flex-1 border border-[#7a7168] bg-transparent px-3 py-2" rows={4} />
              </div>

              <div className="flex items-center gap-4">
                <span className="w-28" />
                <button type="button" className="border border-[#7a7168] px-6 py-2 text-[#cfc6bc]">
                  Submit
                </button>
              </div>
            </form>
          </div>

          <div className="relative pl-12">
            <div className="absolute right-0 top-[42%] text-[16px] uppercase tracking-[0.2em] text-[#bfb6ab]">
              <p className="mb-4">instagram</p>
              <p>linked in</p>
            </div>
          </div>
        </section>

        <div className="absolute bottom-6 left-0 right-0 z-20 px-10">
          <div className="grid grid-cols-2 items-center">
            <div className="flex items-center gap-4 text-[12px] uppercase tracking-[0.18em] text-[#cbbf74]">
              <div className="flex h-[58px] w-[86px] items-center justify-center rounded-[18px] border border-[#cbbf74]">
                <span className="text-[14px] tracking-[0.2em] text-[#e3dad0]">iC+P</span>
              </div>
              <span>Animated Logo, Will Be Provided To You</span>
            </div>
            <div className="text-right">
              <span className="text-[40px] leading-none text-[#9b251f] [font-family:'Brush_Script_MT','Segoe_Script',cursive]">
                design to live
              </span>
            </div>
          </div>

          <div className="mt-6 border-t border-[#6a6158] pt-4 text-center text-[12px] font-semilight text-[#bdb4ab]">
            Website designed by adiz · 2026 iConcepts+Partners. All Rights Reserved
          </div>
        </div>
      </main>
    </div>
  );
}

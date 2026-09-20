const teamMembers = [
  {
    id: 'imran-khan',
    firstName: 'Imran',
    lastName: 'KHAN',
    role: 'Founder & Design Director',
  },
  {
    id: 'prachi-laud',
    firstName: 'Prachi',
    lastName: 'LAUD',
    role: 'Co-Founder & Design Partner',
  },
  {
    id: 'archna-shinghal',
    firstName: 'Archna',
    lastName: 'SHINGHAL',
    role: 'Design Partner',
  },
];

const placeholderImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='134' height='400' viewBox='0 0 134 400'%3E%3Crect width='134' height='400' fill='%23d1d5db'/%3E%3Cpath d='M67 170c-24 0-43-19-43-43s19-43 43-43 43 19 43 43-19 43-43 43Zm0 22c-38 0-69 31-69 69v37h138v-37c0-38-31-69-69-69Z' fill='%239ca3af'/%3E%3C/svg%3E";

function NavArrow({ direction = 'left' }) {
  return (
    <span
      className={[
        'relative inline-flex h-[33px] w-[8.22px] shrink-0 items-center justify-center text-[#781F1C]',
        direction === 'right' ? 'rotate-180' : '',
      ].join(' ')}
      aria-hidden="true"
    >
      <span className="absolute left-1/2 top-0 h-full w-[1.5px] -translate-x-1/2 bg-current" />
      <span className="absolute bottom-0 left-1/2 h-[8px] w-[8px] -translate-x-1/2 rotate-45 border-b-[1.5px] border-l-[1.5px] border-current" />
    </span>
  );
}

function TeamCard({ firstName, lastName, role }) {
  return (
    <article className="flex w-[133.36px] flex-col">
      <div className="relative h-[400px] overflow-hidden bg-gray-300">
        <img
          src={placeholderImage}
          alt={`${firstName} ${lastName}`}
          className="h-full w-full bg-gray-300 object-cover grayscale"
        />
        <div className="absolute inset-x-0 bottom-0 flex h-[40px] items-center justify-center bg-[rgba(102,89,77,0.5)] px-2 text-center">
          <p className="font-['Segoe_UI','Segoe_UI_Light','Segoe_UI_Semilight',sans-serif] text-[8px] leading-none text-white">
            <span>{firstName} </span>
            <strong className="font-bold">{lastName}</strong>
          </p>
        </div>
      </div>
      <div className="h-[17.7px] bg-[#781F1C]" />
      <div className="flex min-h-[55px] items-start justify-center pt-[10px] text-center">
        <p className="font-['Segoe_UI','Segoe_UI_Light','Segoe_UI_Semilight',sans-serif] text-[8px] leading-[1.35] text-[#47433E]">
          {role}
        </p>
      </div>
    </article>
  );
}

export default function AboutUs() {
  return (
    <section className="relative mx-auto min-h-screen w-full overflow-hidden bg-[#f5f1ec] font-['Segoe_UI','Segoe_UI_Light','Segoe_UI_Semilight',sans-serif]">
      <div className="absolute left-1/2 top-0 h-full w-[1.5px] -translate-x-1/2 bg-[#C3BDB4]" />

      <div className="px-0 pb-[48px] pt-[60px]">
        <nav className="mx-auto flex w-[1200px] items-center justify-between pl-[120px] pr-[60px]">
          <div className="flex items-center gap-[18px] text-[20px] font-light text-[#C3BDB4]">
            <NavArrow direction="left" />
            <a href="#" className="leading-none">
              home
            </a>
            <a href="#" className="leading-none">
              about us
            </a>
          </div>

          <div className="flex items-center gap-[18px] text-[20px] font-light text-[#C3BDB4]">
            <a href="#" className="leading-none">
              contact us
            </a>
            <NavArrow direction="right" />
          </div>
        </nav>

        <div className="mx-auto mt-[118px] flex w-[1232.42px] items-end justify-between">
          <div className="flex h-[475.7px] w-[133.36px] items-center justify-center">
            <p className="rotate-[-90deg] whitespace-nowrap font-['Segoe_UI','Segoe_UI_Light','Segoe_UI_Semilight',sans-serif] text-[20px] font-light italic tracking-[0.18em] text-[#C3BDB4]">
              design TEAM
            </p>
          </div>

          <div className="flex h-[475.7px] w-[133.36px] items-center justify-center">
            <div className="flex h-[400px] flex-col items-center justify-center text-[#C3BDB4]">
              <p className="font-['Segoe_UI','Segoe_UI_Light','Segoe_UI_Semilight',sans-serif] text-[17px] font-light tracking-[0.38em] [writing-mode:vertical-rl] [text-orientation:mixed]">
                abou+P
              </p>
              <p className="mt-[18px] font-['Segoe_UI','Segoe_UI_Light','Segoe_UI_Semilight',sans-serif] text-[17px] font-light tracking-[0.38em] [writing-mode:vertical-rl] [text-orientation:mixed]">
                iC
              </p>
            </div>
          </div>

          {teamMembers.map((member) => (
            <TeamCard
              key={member.id}
              firstName={member.firstName}
              lastName={member.lastName}
              role={member.role}
            />
          ))}
        </div>
      </div>

      <footer className="absolute inset-x-0 bottom-0">
        <div className="mx-auto flex w-[1200px] items-end justify-between pb-[18px] pl-[120px] pr-[60px]">
          <div className="flex h-[50px] w-[50px] flex-col items-center justify-center rounded-full border-[1.5px] border-[#781F1C] text-[#781F1C]">
            <span className="text-[9px] leading-none">iC</span>
            <span className="mt-[3px] text-[8px] leading-none">+P</span>
          </div>

          <p className="font-['Brush_Script_MT','Segoe_Script',cursive] text-[44px] leading-none text-[#781F1C]">
            design to live
          </p>
        </div>

        <div className="h-[1.5px] w-full bg-[#781F1C]" />
        <div className="py-[10px] text-center">
          <p className="font-['Segoe_UI','Segoe_UI_Light','Segoe_UI_Semilight',sans-serif] text-[8px] font-light text-[#C3BDB4]">
            Website designed by adiz © 2026 iConcepts+Partners. All Rights Reserved
          </p>
        </div>
      </footer>
    </section>
  );
}

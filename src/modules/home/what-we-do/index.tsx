import Image from "next/image";
import type { ReactNode } from "react";

import { CARD_RECTS, GRID, Glows, type CardName } from "./glows";

type Status = "Completed" | "In Progress";

const TRACKER: { name: string; status: Status }[] = [
  { name: "APECX 2026", status: "Completed" },
  { name: "SC Gathering", status: "Completed" },
  { name: "Company Visit To SLB CIB", status: "In Progress" },
];

/**
 * On desktop the card is not positioned, so its glow layer spans the whole
 * grid and the clip-path cuts out just this card's share of it — the glows
 * carry on from card to card, and the gaps stay clear. Stacked on smaller
 * screens, each card shows its own rectangle of the desktop layer instead.
 * The outline stands in for a border, which the glow would paint over.
 */
function Card({
  name,
  className = "",
  children,
}: {
  name: CardName;
  className?: string;
  children: ReactNode;
}) {
  return (
    <article
      className={`flagship-glass-card isolate rounded-[24px] border border-black/[0.08] outline outline-2 -outline-offset-1 outline-ink/10 [clip-path:inset(0_round_24px)] max-lg:relative ${className}`}
    >
      <Glows
        id={`glow-${name}-lg`}
        viewBox={[0, 0, GRID.width, GRID.height]}
        preserveAspectRatio="none"
        className="absolute inset-0 size-full max-lg:hidden"
      />
      <Glows
        id={`glow-${name}-sm`}
        viewBox={CARD_RECTS[name]}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 size-full lg:hidden"
      />
      {children}
    </article>
  );
}

function SpeMark() {
  return (
    <Image
      src="/landing/what-we-do/emblem.webp"
      alt=""
      width={160}
      height={88}
      className="h-[72px] w-auto md:h-[88px]"
    />
  );
}

function Tags({ items }: { items: string[] }) {
  return (
    <ul className="mx-auto flex max-w-[420px] flex-wrap justify-center gap-2.5">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-full border border-[#e4e5f0] bg-white/80 px-3 py-1 text-xs text-ink-soft"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function Copy({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="text-center">
      <h3 className="text-xl font-bold tracking-[-0.01em] text-ink md:text-[23px]">
        {title}
      </h3>
      <p className="mx-auto mt-3 max-w-[560px] text-sm leading-relaxed text-ink-soft">
        {children}
      </p>
    </div>
  );
}

function StatusPill({ status }: { status: Status }) {
  return (
    <span className="shrink-0 rounded-full border border-[#8b8bff] bg-[#eef0ff] px-2.5 py-0.5 text-[11px] font-medium text-[#4e4eff]">
      {status}
    </span>
  );
}

const SKILLS: { label: string; icon: ReactNode }[] = [
  {
    label: "Data Analytic for Energy",
    icon: (
      <svg width="24" height="24" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M24 4.80005C24.8487 4.80005 25.6626 5.13719 26.2627 5.73731C26.8629 6.33742 27.2 7.15136 27.2 8.00005V24C27.2 24.8487 26.8629 25.6627 26.2627 26.2628C25.6626 26.8629 24.8487 27.2 24 27.2C23.1513 27.2 22.3374 26.8629 21.7373 26.2628C21.1371 25.6627 20.8 24.8487 20.8 24V8.00005C20.8 7.15136 21.1371 6.33742 21.7373 5.73731C22.3374 5.13719 23.1513 4.80005 24 4.80005ZM25.6 8.00005C25.6 7.5757 25.4314 7.16874 25.1314 6.86868C24.8313 6.56862 24.4243 6.40005 24 6.40005C23.5757 6.40005 23.1687 6.56862 22.8686 6.86868C22.5686 7.16874 22.4 7.5757 22.4 8.00005V24C22.4 24.4244 22.5686 24.8314 22.8686 25.1314C23.1687 25.4315 23.5757 25.6 24 25.6C24.4243 25.6 24.8313 25.4315 25.1314 25.1314C25.4314 24.8314 25.6 24.4244 25.6 24V8.00005ZM19.2 12.8C19.2 11.9514 18.8629 11.1374 18.2627 10.5373C17.6626 9.93719 16.8487 9.60005 16 9.60005C15.1513 9.60005 14.3374 9.93719 13.7373 10.5373C13.1371 11.1374 12.8 11.9514 12.8 12.8V24C12.8 24.8487 13.1371 25.6627 13.7373 26.2628C14.3374 26.8629 15.1513 27.2 16 27.2C16.8487 27.2 17.6626 26.8629 18.2627 26.2628C18.8629 25.6627 19.2 24.8487 19.2 24V12.8ZM16 11.2C16.4243 11.2 16.8313 11.3686 17.1314 11.6687C17.4314 11.9687 17.6 12.3757 17.6 12.8V24C17.6 24.4244 17.4314 24.8314 17.1314 25.1314C16.8313 25.4315 16.4243 25.6 16 25.6C15.5757 25.6 15.1687 25.4315 14.8686 25.1314C14.5686 24.8314 14.4 24.4244 14.4 24V12.8C14.4 12.3757 14.5686 11.9687 14.8686 11.6687C15.1687 11.3686 15.5757 11.2 16 11.2ZM11.2 17.6C11.2 16.7514 10.8629 15.9374 10.2627 15.3373C9.66263 14.7372 8.84869 14.4 8 14.4C7.15131 14.4 6.33738 14.7372 5.73726 15.3373C5.13714 15.9374 4.8 16.7514 4.8 17.6V24C4.8 24.8487 5.13714 25.6627 5.73726 26.2628C6.33738 26.8629 7.15131 27.2 8 27.2C8.84869 27.2 9.66263 26.8629 10.2627 26.2628C10.8629 25.6627 11.2 24.8487 11.2 24V17.6ZM8 16C8.42435 16 8.83131 16.1686 9.13137 16.4687C9.43143 16.7687 9.6 17.1757 9.6 17.6V24C9.6 24.4244 9.43143 24.8314 9.13137 25.1314C8.83131 25.4315 8.42435 25.6 8 25.6C7.57566 25.6 7.16869 25.4315 6.86863 25.1314C6.56857 24.8314 6.4 24.4244 6.4 24V17.6C6.4 17.1757 6.56857 16.7687 6.86863 16.4687C7.16869 16.1686 7.57566 16 8 16Z" fill="#4E4EFF"/>
      </svg>
    ),
  },
  {
    label: "Renewable Energy System",
    icon: (
      <svg width="24" height="24" viewBox="-1.5 -1.5 32 32" fill="none" aria-hidden="true">
        <path d="M14.0833 27.4167C21.4471 27.4167 27.4167 21.4471 27.4167 14.0833C27.4167 6.71954 21.4471 0.75 14.0833 0.75C6.71954 0.75 0.75 6.71954 0.75 14.0833C0.75 21.4471 6.71954 27.4167 14.0833 27.4167Z" stroke="#4E4EFF" strokeWidth="1.5"/>
        <path d="M8.922 13.5474L14.254 6.36077C14.6713 5.79811 15.4527 6.14744 15.4527 6.89677V12.4594C15.4527 12.9074 15.7593 13.2714 16.138 13.2714H18.73C19.3193 13.2714 19.634 14.0954 19.2447 14.6194L13.9127 21.8061C13.4953 22.3688 12.714 22.0194 12.714 21.2701V15.7074C12.714 15.2594 12.4073 14.8954 12.0287 14.8954H9.43667C8.84867 14.8954 8.534 14.0714 8.92333 13.5474" stroke="#4E4EFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    label: "Development Training",
    icon: (
      <svg width="24" height="24" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M29.75 19.8628V22.75H28.0625V20.5747L26.6255 19.1245L26.665 19.085C26.3135 19.2783 25.9224 19.375 25.4917 19.375C25.105 19.375 24.749 19.2959 24.4238 19.1377L23 20.5747V22.75H21.3125V19.8628L23.2241 17.9644L23.1846 17.8721L19.8755 10.4629L14.4966 16.0132C14.5142 16.1538 14.5273 16.29 14.5361 16.4219C14.5449 16.5537 14.5537 16.6943 14.5625 16.8438V27.8125H16.25V29.5H2.75V27.8125H4.4375V16.8438C4.4375 16.1758 4.56055 15.5474 4.80664 14.9585C5.05273 14.3696 5.38672 13.8467 5.80859 13.3896C6.23047 12.9326 6.73145 12.5635 7.31152 12.2822C7.8916 12.001 8.51562 11.8384 9.18359 11.7944L17.1992 3.52832C17.5156 3.19434 17.8848 2.93945 18.3066 2.76367C18.7285 2.58789 19.168 2.5 19.625 2.5C19.9326 2.5 20.2402 2.54395 20.5479 2.63184C20.8555 2.71973 21.1499 2.85156 21.4312 3.02734C21.7124 3.20312 21.9629 3.40527 22.1826 3.63379C22.4023 3.8623 22.5781 4.12598 22.71 4.4248L27.7725 15.7363C27.8516 15.9121 27.9087 16.0923 27.9438 16.2769C27.979 16.4614 27.9966 16.646 27.9966 16.8306C27.9966 17.0415 27.9746 17.248 27.9307 17.4502C27.8867 17.6523 27.812 17.8501 27.7065 18.0435L27.812 17.938L29.75 19.8628ZM12.875 27.8125V16.8438C12.875 16.3779 12.7871 15.9429 12.6113 15.5386C12.4355 15.1343 12.1938 14.7739 11.8862 14.4575C11.5786 14.1411 11.2227 13.8994 10.8184 13.7324C10.4141 13.5654 9.97461 13.4775 9.5 13.4688C9.03418 13.4688 8.59912 13.5566 8.19482 13.7324C7.79053 13.9082 7.43018 14.1499 7.11377 14.4575C6.79736 14.7651 6.55566 15.1211 6.38867 15.5254C6.22168 15.9297 6.13379 16.3691 6.125 16.8438V27.8125H12.875ZM11.2402 12.0845C11.7852 12.2866 12.2817 12.5723 12.73 12.9414C13.1782 13.3105 13.5518 13.7456 13.8506 14.2466L20.8379 7.04834C21.1543 6.71436 21.3125 6.32324 21.3125 5.875C21.3125 5.6377 21.2686 5.41797 21.1807 5.21582C21.0928 5.01367 20.9741 4.83789 20.8247 4.68848C20.6753 4.53906 20.4951 4.41602 20.2842 4.31934C20.0732 4.22266 19.8535 4.17871 19.625 4.1875C19.1416 4.1875 18.7373 4.35889 18.4121 4.70166L11.2402 12.0845ZM22.3804 7.81299C22.2222 8.06787 22.0288 8.30078 21.8003 8.51172C21.5718 8.72266 21.3521 8.93799 21.1411 9.15771L23.7383 14.9717L25.2808 14.3125L22.3804 7.81299ZM25.4917 17.6875C25.7466 17.6875 25.9487 17.604 26.0981 17.437C26.2476 17.27 26.3223 17.0679 26.3223 16.8306C26.3223 16.6548 26.2827 16.4878 26.2036 16.3296C26.1245 16.1714 26.0454 16.0132 25.9663 15.855L24.4238 16.5142C24.4766 16.646 24.5293 16.7822 24.582 16.9229C24.6348 17.0635 24.7007 17.1909 24.7798 17.3052C24.8589 17.4194 24.9512 17.5117 25.0566 17.582C25.1621 17.6523 25.3071 17.6875 25.4917 17.6875ZM9.5 16C9.7373 16 9.95703 16.0439 10.1592 16.1318C10.3613 16.2197 10.5371 16.3384 10.6865 16.4878C10.8359 16.6372 10.959 16.8174 11.0557 17.0283C11.1523 17.2393 11.1963 17.459 11.1875 17.6875C11.1875 17.9248 11.1436 18.1445 11.0557 18.3467C10.9678 18.5488 10.8491 18.7246 10.6997 18.874C10.5503 19.0234 10.3701 19.1465 10.1592 19.2432C9.94824 19.3398 9.72852 19.3838 9.5 19.375C9.2627 19.375 9.04297 19.3311 8.84082 19.2432C8.63867 19.1553 8.46289 19.0366 8.31348 18.8872C8.16406 18.7378 8.04102 18.5576 7.94434 18.3467C7.84766 18.1357 7.80371 17.916 7.8125 17.6875C7.8125 17.4502 7.85645 17.2305 7.94434 17.0283C8.03223 16.8262 8.15088 16.6504 8.30029 16.501C8.44971 16.3516 8.62988 16.2285 8.84082 16.1318C9.05176 16.0352 9.27148 15.9912 9.5 16Z" fill="#4E4EFF"/>
      </svg>
    ),
  },
];

const SKILL_NOTES = [
  "An event that gathers global experts and professionals to discuss key topics in the petroleum industry.",
  "A short class that aims to improve boards, members, and college students' knowledge of the oil and gas industry.",
];

const CHAPTERS = [
  { name: "SPE ITB SC", logo: "/landing/what-we-do/spe-itb.webp" },
  { name: "SPE UPNVY SC", logo: "/landing/what-we-do/spe-upnvy.webp" },
  { name: "SPE ITS SC", logo: "/landing/what-we-do/spe-its.webp" },
  { name: "SPE UI SC", logo: "/landing/what-we-do/spe-ui.webp" },
  { name: "SPE Trisakti SC", logo: "/landing/what-we-do/spe-trisakti.webp" },
];

/**
 * What the chapter does, as a two-row bento. The three column tracks are
 * sized so the top row splits roughly 62/38 and the bottom one 52/48: the
 * top-left and bottom-right cards each span two of them.
 */
export function WhatWeDo() {
  return (
    <section
      id="what-we-do"
      aria-labelledby="what-we-do-title"
      className="px-6 pt-[clamp(1rem,calc(24*var(--k)),2.5rem)] pb-[clamp(5rem,calc(120*var(--k)),9rem)] md:px-10"
    >
      <header className="text-center">
        <p className="flex items-center justify-center gap-2 text-base text-curtain md:text-lg">
          <img src="/global/SVG-star.svg" width="14" height="14" aria-hidden="true" alt="" />
          What We Do
        </p>
        <h2
          id="what-we-do-title"
          className="mt-3 text-3xl md:text-7xl leading-[1.15] font-bold tracking-[-0.02em] text-ink"
        >
          Built for Every Future Engineer
        </h2>
      </header>

      <div className="mx-auto mt-[clamp(2rem,calc(48*var(--k)),3.5rem)] grid max-w-[1277px] gap-4 lg:relative lg:grid-cols-[52fr_10fr_38fr]">
        <article className="flagship-glass-card relative isolate flex flex-col items-center rounded-[24px] border border-black/[0.08] px-6 pt-12 pb-9 outline outline-2 -outline-offset-1 outline-ink/10 [clip-path:inset(0_round_24px)] overflow-hidden md:px-10 lg:col-span-2 lg:min-h-[434px]">
          {/* Purple gradient ellipse - bottom right */}
          <div className="pointer-events-none absolute -bottom-12 -right-12 w-[600px] opacity-70">
            <Image
              src="/landing/what-we-do/Ellipse 1479.svg"
              alt=""
              width={956}
              height={376}
              className="h-auto w-full"
            />
          </div>
          
          <SpeMark />
          <div className="relative z-10 mt-auto w-full space-y-7 pt-10">
            <Tags
              items={[
                "Company Visit",
                "Research Groups",
                "Interview Prep",
                "SPE International",
                "Career Talk",
              ]}
            />
            <Copy title="Career-Oriented Development">
              Preparing students to carve their career paths and land dream roles
              in the energy sector through mentorship, career talks, and
              skill-building programs.
            </Copy>
          </div>
        </article>

        <article className="flagship-glass-card relative isolate rounded-[24px] border border-black/[0.08] px-6 pt-10 pb-9 outline outline-2 -outline-offset-1 outline-ink/10 [clip-path:inset(0_round_24px)] overflow-hidden md:px-8 lg:min-h-[434px]">
          {/* Purple gradient ellipse - bottom left */}
          <div className="pointer-events-none absolute -bottom-12 -left-12 w-[500px] opacity-70">
            <Image
              src="/landing/what-we-do/Ellipse 1480.svg"
              alt=""
              width={956}
              height={376}
              className="h-auto w-full"
            />
          </div>
          
          <div className="relative z-10">
            <Copy title="Event & Program Tracker">
              Real-time progress and milestones of our continuous learning
              programs, industry visits, and international events.
            </Copy>
            <p className="mt-9 text-[11px] font-medium tracking-[0.08em] text-[#9a9db0] uppercase">
              Program Execution Status
            </p>
            <ol className="mt-3 space-y-3">
              {TRACKER.map(({ name, status }, i) => (
                <li
                  key={name}
                  className="flex items-center gap-3 rounded-xl border border-[#e4e5f0] bg-white/70 px-3.5 py-3"
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#eceef6] text-[11px] font-semibold text-[#8a8ea3]">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-ink">
                    {name}
                  </span>
                  <StatusPill status={status} />
                </li>
              ))}
            </ol>
          </div>
        </article>

        <article className="flagship-glass-card relative isolate flex flex-col rounded-[24px] border border-black/[0.08] px-6 pt-8 pb-9 outline outline-2 -outline-offset-1 outline-ink/10 [clip-path:inset(0_round_24px)] overflow-hidden md:px-8 lg:min-h-[421px]">
          {/* Purple gradient ellipse - top right */}
          <div className="pointer-events-none absolute -top-24 -right-32 w-[660px] opacity-70">
            <Image
              src="/landing/what-we-do/Ellipse 1478.svg"
              alt=""
              width={956}
              height={376}
              className="h-auto w-full"
            />
          </div>
          
          <div className="relative z-10">
            <Copy title="Technical Skill Enhancement">
              Empowering future engineers with hard skills and practical
              knowledge to excel in technical roles within the industry.
            </Copy>

            <ul className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {SKILLS.map(({ label, icon }) => (
                <li
                  key={label}
                  className="flex flex-col items-start rounded-2xl border border-[#e4e5f0] bg-white/70 p-4"
                >
                  <span className="grid size-10 place-items-center rounded-xl border border-[#d9dcf5] bg-[#E5EBFE] text-[#4e4eff]">
                    {icon}
                  </span>
                  <p className="mt-4 text-base leading-snug font-bold text-ink">
                    {label}
                  </p>
                </li>
              ))}
            </ul>

            <ul className="mt-6 space-y-3">
              {SKILL_NOTES.map((note) => (
                <li key={note} className="flex items-start gap-3">
                  <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-[#4e4eff]" />
                  <p className="text-xs leading-relaxed text-ink-soft">{note}</p>
                </li>
              ))}
            </ul>
          </div>
        </article>

        <article className="flagship-glass-card relative isolate flex flex-col rounded-[24px] border border-black/[0.08] px-6 pt-8 pb-0 outline outline-2 -outline-offset-1 outline-ink/10 [clip-path:inset(0_round_24px)] overflow-hidden md:px-8 lg:col-span-2 lg:min-h-[421px]">
          {/* Purple gradient ellipse - top left */}
          <div className="pointer-events-none absolute -top-20 -left-20 w-[950px] opacity-70">
            <Image
              src="/landing/what-we-do/Ellipse 1481.svg"
              alt=""
              width={956}
              height={376}
              className="h-auto w-full"
            />
          </div>
          
          <div className="relative z-10 flex flex-1 flex-col">
            <Copy title="Networking & Community">
              Connecting students to a network of energy professionals and
              fostering a supportive, cross-cultural community.
            </Copy>

            <div className="mt-7 grid flex-1 grid-cols-1 gap-3 sm:grid-cols-[0.9fr_1.1fr]">
              <div className="flex h-[230px] flex-col rounded-t-2xl border border-b-0 border-[#e4e5f0] bg-white/70 px-3 pt-4">
                <h4 className="text-center text-base font-bold text-ink">
                  Connect &amp; Engage
                </h4>
                <ul className="mt-3 flex-1 space-y-2 overflow-y-auto pb-3 [scrollbar-width:none]">
                  {CHAPTERS.map((chapter) => (
                    <li
                      key={chapter.name}
                      className="flex items-center gap-2.5 rounded-xl border border-[#e4e5f0] bg-white px-3 py-2"
                    >
                      <Image
                        src={chapter.logo}
                        alt=""
                        width={24}
                        height={24}
                        className="size-6 shrink-0 object-contain"
                      />
                      <span className="text-sm text-ink">{chapter.name}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="relative flex h-[230px] flex-col items-center justify-end overflow-hidden rounded-t-2xl border border-b-0 border-[#e4e5f0] bg-white/70 px-4 pb-6">
                <Image
                  src="/landing/what-we-do/map.webp"
                  alt=""
                  width={841}
                  height={512}
                  className="absolute inset-x-4 top-5 h-auto w-[calc(100%-2rem)]"
                />
                <a
                  href="https://www.spe.org/en/chapters/list/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative rounded-full bg-[#4e4eff] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgba(78,78,255,0.7)] transition-colors hover:bg-[#3b3bea]"
                >
                  Find an SPE Chapter
                </a>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

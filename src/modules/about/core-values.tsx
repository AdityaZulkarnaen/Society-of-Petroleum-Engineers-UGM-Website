const VALUES = [
  {
    title: "Networking",
    body: "At SPE UGM SC, we believe that meaningful connections are the foundation of growth. We connect students across disciplines with industry professionals, alumni, academics, and the wider SPE community. Through company visits, industry engagements, collaborations, and professional events, we create opportunities for members to exchange perspectives, build relationships, and become part of a broader energy network.",
  },
  {
    title: "Experience",
    body: "We believe that professional growth goes beyond the classroom. SPE UGM SC provides members with opportunities to experience the energy industry through company visits, competitions, technical projects, organizational roles, and direct interaction with industry practitioners. These experiences allow students to understand how knowledge is applied in real-world settings while developing the adaptability, teamwork, and professionalism needed to navigate the industry.",
  },
  {
    title: "Learning",
    body: "Learning is at the heart of our journey as students and future energy professionals. SPE UGM SC creates a space where members can continuously develop their technical and professional competencies through workshops, seminars, mentoring, discussions, certifications, and knowledge-sharing sessions. By connecting academic foundations with insights from industry, we encourage our members to stay curious, capable, and ready to face the evolving challenges of the energy sector.",
  },
  {
    title: "Innovation",
    body: "The energy industry continues to evolve, and so must the way we think about its challenges. SPE UGM SC encourages members to explore new ideas, technologies, and approaches across engineering, science, and energy. Through competitions, collaborative projects, research-oriented activities, and cross-disciplinary initiatives, we foster a culture of curiosity and innovation, also empowering students to look beyond conventional solutions and contribute to a more adaptive and sustainable energy future.",
  },
];

/**
 * The light in the card's top-right corner, after Figma: a 375 × 223 shape
 * whose thin tail leaves the top-left of that box, runs along the top and
 * bends down to the bottom-right corner, so the fill hugs the card's right
 * edge. Linear 180° (top → bottom): #FFFFFF → #9999FF (14%) → #4E4EFF,
 * softened by the layer blur.
 */
function CornerGlow({ id }: { id: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 375 223"
      className="pointer-events-none absolute top-0 right-[-6%] -z-10 aspect-[375/223] w-[72%]"
    >
      <defs>
        <linearGradient
          id={`${id}-fill`}
          gradientUnits="objectBoundingBox"
          x1="0.5"
          y1="0"
          x2="0.5"
          y2="1"
        >
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.14" stopColor="#9999FF" />
          <stop offset="1" stopColor="#4E4EFF" />
        </linearGradient>
        <filter id={`${id}-blur`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="26" />
        </filter>
      </defs>
      <path
        d="M0 0C118 6 254 42 330 120C358 149 370 186 375 223L375 0Z"
        fill={`url(#${id}-fill)`}
        fillOpacity="0.85"
        filter={`url(#${id}-blur)`}
      />
    </svg>
  );
}

/* The people mark sitting in the white tile at the top of every card. */
function ValueIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M21.8712 12.6212C22.2972 12.6212 22.7057 12.452 23.0069 12.1508C23.3081 11.8496 23.4773 11.4411 23.4773 11.0152C23.4773 10.5892 23.3081 10.1807 23.0069 9.8795C22.7057 9.5783 22.2972 9.40909 21.8712 9.40909C21.4453 9.40909 21.0368 9.5783 20.7356 9.8795C20.4344 10.1807 20.2652 10.5892 20.2652 11.0152C20.2652 11.4411 20.4344 11.8496 20.7356 12.1508C21.0368 12.452 21.4453 12.6212 21.8712 12.6212ZM21.8712 15.0303C22.9361 15.0303 23.9574 14.6073 24.7104 13.8543C25.4633 13.1013 25.8864 12.08 25.8864 11.0152C25.8864 9.95027 25.4633 8.929 24.7104 8.17601C23.9574 7.42302 22.9361 7 21.8712 7C20.8063 7 19.7851 7.42302 19.0321 8.17601C18.2791 8.929 17.8561 9.95027 17.8561 11.0152C17.8561 12.08 18.2791 13.1013 19.0321 13.8543C19.7851 14.6073 20.8063 15.0303 21.8712 15.0303ZM18.2576 24.6667V21.4545C18.2576 20.2832 17.7922 19.1598 16.964 18.3315C16.1357 17.5032 15.0123 17.0379 13.8409 17.0379H7.41667C6.24529 17.0379 5.1219 17.5032 4.29361 18.3315C3.46533 19.1598 3 20.2832 3 21.4545V24.6667H5.40909V21.4545C5.40909 20.3464 6.30848 19.447 7.41667 19.447H13.8409C14.9491 19.447 15.8485 20.3464 15.8485 21.4545V24.6667H18.2576ZM29.5 21.4545V24.6667H27.0909V21.4545C27.0909 20.3464 26.1915 19.447 25.0833 19.447H21.0682V17.0379H25.0833C26.2547 17.0379 27.3781 17.5032 28.2064 18.3315C29.0347 19.1598 29.5 20.2832 29.5 21.4545ZM12.2348 11.0152C12.2348 11.4411 12.0656 11.8496 11.7644 12.1508C11.4632 12.452 11.0547 12.6212 10.6288 12.6212C10.2028 12.6212 9.79433 12.452 9.49313 12.1508C9.19194 11.8496 9.02273 11.4411 9.02273 11.0152C9.02273 10.5892 9.19194 10.1807 9.49313 9.8795C9.79433 9.5783 10.2028 9.40909 10.6288 9.40909C11.0547 9.40909 11.4632 9.5783 11.7644 9.8795C12.0656 10.1807 12.2348 10.5892 12.2348 11.0152ZM14.6439 11.0152C14.6439 12.08 14.2209 13.1013 13.4679 13.8543C12.7149 14.6073 11.6937 15.0303 10.6288 15.0303C9.5639 15.0303 8.54263 14.6073 7.78965 13.8543C7.03666 13.1013 6.61364 12.08 6.61364 11.0152C6.61364 9.95027 7.03666 8.929 7.78965 8.17601C8.54263 7.42302 9.5639 7 10.6288 7C11.6937 7 12.7149 7.42302 13.4679 8.17601C14.2209 8.929 14.6439 9.95027 14.6439 11.0152Z" fill="#4E4EFF"/>
    </svg>
  );
}

/**
 * The four values the chapter is built on, on the same lavender glass as the
 * cards above, each lit from its top-right corner by a `CornerGlow`.
 */
export function CoreValues() {
  return (
    <section
      aria-labelledby="core-values-title"
      className="px-4 pb-[clamp(5rem,calc(120*var(--k)),9rem)]"
    >
      <header className="text-center">
        <p className="flex items-center justify-center gap-2 text-base text-curtain md:text-lg">
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
            <path
              fill="currentColor"
              d="M8 0c.5 3.9 2.1 5.5 6 6-3.9.5-5.5 2.1-6 6-.5-3.9-2.1-5.5-6-6 3.9-.5 5.5-2.1 6-6Z"
              transform="translate(0 2)"
            />
          </svg>
          The Pillars of SPE
        </p>
        <h2
          id="core-values-title"
          className="mt-3 font-display text-[clamp(30px,calc(60*var(--k)),64px)] leading-[1.12] font-bold tracking-[-0.02em] text-ink"
        >
          Our Core Value
        </h2>
      </header>

      <div className="mx-auto mt-[clamp(1.5rem,calc(40*var(--k)),3rem)] grid w-[min(calc(1270*var(--kw)),100%)] gap-4 md:grid-cols-2 md:gap-5">
        {VALUES.map((value) => (
          <article
            key={value.title}
            className="relative isolate overflow-hidden rounded-[clamp(20px,calc(28*var(--k)),32px)] border border-white bg-[linear-gradient(160deg,#fbfbff_0%,#f3f4fd_100%)] px-6 pt-7 pb-8 shadow-[0_24px_60px_-34px_rgba(60,48,160,0.35),inset_0_1px_0_rgba(255,255,255,0.9)] sm:px-9 sm:pt-9 sm:pb-10"
          >
            <CornerGlow id={`value-glow-${value.title.toLowerCase()}`} />
            <span className="flex size-11 items-center justify-center rounded-[8px] border-[1.6px] border-black/12 bg-white/5 shadow-[0_8px_20px_-12px_rgba(60,48,160,0.5)]">
              <ValueIcon />
            </span>
            <h3 className="mt-6 text-xl font-bold tracking-[-0.01em] text-ink md:text-[23px]">
              {value.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              {value.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

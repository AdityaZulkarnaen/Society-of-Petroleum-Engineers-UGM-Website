import Image from "next/image";

/**
 * Sponsors section - showcase partner logos
 * Design: light blue background, centered heading, horizontal scrolling logo grid
 */

export function Sponsors() {
  return (
    <section className="bg-[#f2f8fe] px-8 pb-[60px]">
      <div className="mx-auto max-w-[1429px]">
        {/* Header */}
        <div className="flex flex-col items-center gap-4">
          {/* "Our Sponsors" with icon */}
          <div className="flex items-center gap-2">
            <img src="/global/SVG-star.svg" width="14" height="14" aria-hidden="true" alt="" />
            <p className="flex items-center justify-center gap-2 text-base text-curtain md:text-lg">
              Our Sponsors
            </p>
          </div>

          {/* Main heading */}
          <h2 className="max-w-[900px] text-center font-display text-[clamp(32px,calc(61.395*var(--k)),61.395px)] font-bold leading-[1.01] tracking-[-1.24px] text-[#2c2d3f]">
            Proudly supported by partners who make this possible
          </h2>
        </div>

        {/* Logo grid - scrollable on mobile, centered grid on desktop */}
        <div className="mt-[75px] overflow-x-auto pb-8">
          <div className="flex min-w-max justify-center gap-4 md:flex-wrap md:min-w-0">
            {/* Logo card template - repeat 8 times */}
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex h-[92px] w-[200px] shrink-0 items-center justify-center overflow-hidden rounded-md bg-white shadow-[0px_38px_15px_0px_rgba(0,0,0,0.01),0px_21px_13px_0px_rgba(0,0,0,0.02),0px_9px_9px_0px_rgba(0,0,0,0.03),0px_2px_5px_0px_rgba(0,0,0,0.04)]"
              >
                {i === 0 ? (
                  <Image
                    src="/sponsors/phi.webp"
                    alt="Phi"
                    width={156}
                    height={42}
                    className="h-auto max-h-[70px] w-auto max-w-[150px] object-contain"
                  />
                ) : i === 1 ? (
                  <Image
                    src="/sponsors/skkmigasiog.webp"
                    alt="SKK Migas IOG phi"
                    width={156}
                    height={42}
                    className="h-auto max-h-[50px] w-auto max-w-[150px] object-contain"
                  />
                ) : i === 2 ? (
                  <Image
                    src="/sponsors/petrochina.webp"
                    alt="PetroChina"
                    width={156}
                    height={42}
                    className="h-auto max-h-[60px] w-auto max-w-[170px] object-contain"
                  />
                ) : i === 3 ? (
                  <Image
                    src="/sponsors/skkmigas.webp"
                    alt="SKK Migas petroChina"
                    width={156}
                    height={42}
                    className="h-auto max-h-[50px] w-auto max-w-[150px] object-contain"
                  />
                ) : i === 4 ? (
                  <Image
                    src="/sponsors/opt.webp"
                    alt="OPT"
                    width={156}
                    height={42}
                    className="h-auto max-h-[70px] w-auto max-w-[180px] object-contain"
                  />
                ) : i === 5 ? (
                  <Image
                    src="/sponsors/rsupsardjito.webp"
                    alt="RSUP Sardjito"
                    width={156}
                    height={42}
                    className="h-auto max-h-[50px] w-auto max-w-[180px] object-contain"
                  />
                ) : i === 6 ? (
                  <Image
                    src="/sponsors/pdsi.webp"
                    alt="PDSI"
                    width={156}
                    height={42}
                    className="h-auto max-h-[70px] w-auto max-w-[150px] object-contain"
                  />
                ) : i === 7 ? (
                  <Image
                    src="/sponsors/skkmigasiog.webp"
                    alt="skkmigasiog pdsi"
                    width={156}
                    height={42}
                    className="h-auto max-h-[50px] w-auto max-w-[150px] object-contain"
                  />
                ) : (
                  <div className="text-center text-xs text-gray-400">
                    Logo {i + 1}
                    <br />
                    200×92
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

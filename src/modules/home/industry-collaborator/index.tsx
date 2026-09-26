import Image from "next/image";

type Collaborator = {
  name: string;
  logo: string;
  width: number;
  height: number;
  /** bg colour behind the logo image. "white" for most, or a hex for branded ones */
  logoBg?: string;
};

/**
 * Three auto-scrolling columns (left goes up, centre goes down, right goes up)
 * of glassmorphic cards, faithful to the Figma design at node 550:3025.
 */
const COLUMN_1: Collaborator[] = [
  { name: "Pertamina", logo: "/landing/industry-collaborator/pertamina.png", width: 90, height: 17, logoBg: "white" },
  { name: "PEPC", logo: "/landing/industry-collaborator/pepc.png", width: 90, height: 18, logoBg: "white" },
  { name: "PGE", logo: "/landing/industry-collaborator/pge.png", width: 90, height: 21, logoBg: "white" },
  { name: "PDSI", logo: "/landing/industry-collaborator/pdsi.png", width: 90, height: 16, logoBg: "white" },
];

const COLUMN_2: Collaborator[] = [
  { name: "PIEP", logo: "/landing/industry-collaborator/piep.png", width: 90, height: 18, logoBg: "white" },
  { name: "OPT", logo: "/landing/industry-collaborator/opt.png", width: 90, height: 24, logoBg: "white" },
  { name: "PHE", logo: "/landing/industry-collaborator/phe.png", width: 90, height: 19, logoBg: "white" },
  { name: "Halliburton", logo: "/landing/industry-collaborator/halliburton.png", width: 90, height: 61, logoBg: "#cc0001" },
];

const COLUMN_3: Collaborator[] = [
  { name: "SLB", logo: "/landing/industry-collaborator/slb.png", width: 90, height: 35, logoBg: "white" },
  { name: "SKK Migas", logo: "/landing/industry-collaborator/skk-migas.png", width: 90, height: 61, logoBg: "white" },
  { name: "tNavigator", logo: "/landing/industry-collaborator/tnavigator.png", width: 90, height: 18, logoBg: "white" },
  { name: "Java Offshore", logo: "/landing/industry-collaborator/java-offshore.png", width: 90, height: 110, logoBg: "white" },
];

/** A single glassmorphic collaborator card */
function CollaboratorCard({ item }: { item: Collaborator }) {
  return (
    <div className="industry-card">
      {/* subtle inner gradient overlay (glassmorphism) */}
      <div aria-hidden className="industry-card__overlay" />
      {/* logo */}
      <div className="industry-card__logo-wrap" style={{ background: item.logoBg ?? "transparent" }}>
        <Image
          src={item.logo}
          alt={item.name}
          width={item.width}
          height={item.height}
          className="industry-card__logo-img"
        />
      </div>
      {/* label */}
      <p className="industry-card__label">{item.name}</p>
      {/* inner glow ring */}
      <div aria-hidden className="industry-card__ring" />
    </div>
  );
}

/** One scrolling column — duped items for seamless loop */
function ScrollColumn({
  items,
  direction = "up",
  speed = 40,
}: {
  items: Collaborator[];
  direction?: "up" | "down";
  speed?: number; // seconds for one full cycle
}) {
  const doubled = [...items, ...items];
  return (
    <div className="industry-column" aria-hidden={false}>
      <div
        className={`industry-column__track industry-column__track--${direction}`}
        style={{ "--scroll-duration": `${speed}s` } as React.CSSProperties}
      >
        {doubled.map((item, i) => (
          <CollaboratorCard key={`${item.name}-${i}`} item={item} />
        ))}
      </div>
    </div>
  );
}

export function IndustryCollaborator() {
  return (
    <section id="industry-collaborator" aria-labelledby="ic-title" className="industry-section">
      <div className="industry-section__inner">
        {/* ── Left: heading ─────────────────────────────────────────── */}
        <div className="industry-section__heading">
          <h2 id="ic-title" className="industry-section__title">
            Our{"\n"}Industry{"\n"}Collaborator
          </h2>
        </div>

        {/* ── Right: three auto-scrolling columns ───────────────────── */}
        <div className="industry-section__columns" aria-label="Industry collaborator logos">
          {/* fade masks top & bottom */}
          <div aria-hidden className="industry-section__fade industry-section__fade--top" />
          <div aria-hidden className="industry-section__fade industry-section__fade--bottom" />

          <ScrollColumn items={COLUMN_1} direction="up" speed={38} />
          <ScrollColumn items={COLUMN_2} direction="down" speed={44} />
          <ScrollColumn items={COLUMN_3} direction="up" speed={50} />
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import { pillSolid } from "@/components/ui/button-styles";
import styles from "./coming-soon.module.css";

type Props = { title: string; description: string };

export function ComingSoon({ title, description }: Props) {
  return (
    <main className={`${styles.page} relative isolate overflow-hidden bg-ground px-6 pt-20 pb-24 md:pt-24 md:pb-36`}>
      <div key={title} className="mx-auto max-w-5xl pt-14 md:pt-20 lg:pt-28">
        <p className="motion-safe:animate-fade-rise [--delay:0.05s] text-sm font-semibold tracking-[0.15em] text-curtain uppercase">SPE UGM Student Chapter / {title}</p>
        <h1 className="motion-safe:animate-fade-rise [--delay:0.15s] mt-8 max-w-3xl font-display text-[clamp(3.5rem,9vw,8rem)] leading-[1.02] font-bold tracking-[-0.045em] text-ink">Coming<br />soon<span className="text-curtain">.</span></h1>
        <p className="motion-safe:animate-fade-rise [--delay:0.25s] mt-8 max-w-lg text-lg leading-relaxed text-ink-soft">{description}</p>
        <div className="motion-safe:animate-fade-rise [--delay:0.35s] mt-10 flex flex-wrap gap-3">
          <Link href="/" className={pillSolid}>Back to Home</Link>
        </div>
      </div>
    </main>
  );
}

import { About } from "./about";
import { Hero } from "./hero";
import { WhatWeDo } from "./what-we-do";

export function HomePage() {
  return (
    <main>
      <Hero />
      <About />
      <WhatWeDo />
    </main>
  );
}

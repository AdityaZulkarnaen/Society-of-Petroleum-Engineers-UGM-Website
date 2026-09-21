import { About } from "./about";
import { FlagshipProgram } from "./flagship-program";
import { Hero } from "./hero";
import { IndustryCollaborator } from "./industry-collaborator";
import { Sponsors } from "./sponsors";
import { Testimonials } from "./testimonials";
import { WhatWeDo } from "./what-we-do";

export function HomePage() {
  return (
    <main>
      <Hero />
      <About />
      <WhatWeDo />
      <Testimonials />
      <IndustryCollaborator />
      <FlagshipProgram />
      <Sponsors />
    </main>
  );
}

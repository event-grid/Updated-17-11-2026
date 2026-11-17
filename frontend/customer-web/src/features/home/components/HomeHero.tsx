import { Eyebrow } from "@/components/layout/SectionHeading";

import { HeroVisual } from "./HeroVisual";

/** Delay slot for a staggered entrance (see .stagger in globals.css). */
const step = (i: number) => ({ "--i": i }) as React.CSSProperties;

/**
 * Homepage hero. `planner` is the "What are you planning?" box, supplied by the page
 * (features do not import each other). Location selection joins when its feature exists (D-30).
 * Headline and supporting copy are placeholders (D-30, U-25). Lines enter one after another.
 */
export function HomeHero({ planner }: { planner: React.ReactNode }) {
  return (
    // overflow-x-clip: the spinning badge's square corners must never make the page scroll sideways.
    <section className="mx-auto grid w-full max-w-7xl items-center gap-16 overflow-x-clip px-4 pb-20 pt-12 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
      <div className="flex flex-col gap-8">
        <div className="stagger animate-fade-up" style={step(0)}>
          <Eyebrow>Your celebration starts here</Eyebrow>
        </div>
        <h1
          style={step(1)}
          className="stagger animate-fade-up font-display text-5xl font-normal leading-[1.02] tracking-tight text-ink sm:text-7xl"
        >
          Bring your
          <br />
          people together.
          <br />
          <em className="inline-block animate-[fade-up_0.9s_var(--ease-out-soft)_0.45s_backwards] font-medium text-terracotta">
            Celebrate in style.
          </em>
        </h1>
        <p style={step(3)} className="stagger max-w-xl animate-fade-up text-lg leading-relaxed text-ink-soft">
          Explore venues and event services for the moments that matter — from
          intimate gatherings to once-in-a-lifetime weddings.
        </p>
        {/* z-10: the planner's dropdown must open above the hero artwork on narrow screens. */}
        <div style={step(4)} className="stagger relative z-10 max-w-2xl animate-fade-up">
          {planner}
        </div>
        <p style={step(5)} className="stagger flex animate-fade-up items-center gap-2 text-sm text-ink-soft">
          <span aria-hidden="true" className="text-terracotta">✦</span>
          Every event type and service, in one place.
        </p>
      </div>
      <HeroVisual />
    </section>
  );
}

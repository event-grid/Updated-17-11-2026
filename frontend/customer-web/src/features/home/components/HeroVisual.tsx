import fs from "node:fs";
import path from "node:path";

import Image from "next/image";

/**
 * Hero artwork: a large circle with the EVENTGRID emblem, a caption card and a rotating badge.
 *
 * Optional photo: put a square-ish image at public/images/hero/hero.jpg (about 1200x1200)
 * and restart the dev server; it then fills the circle instead of the emblem.
 */
const HERO_PHOTO = fs.existsSync(path.join(process.cwd(), "public", "images", "hero", "hero.jpg"))
  ? "/images/hero/hero.jpg"
  : null;

export function HeroVisual() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[13.5rem] animate-[pop-in_1s_var(--ease-out-soft)_0.2s_backwards] sm:max-w-[24rem] lg:mx-0 lg:ml-auto lg:max-w-[32rem]">
      {/* Thin champagne rings behind the circle, drawn in after the circle lands */}
      <div aria-hidden="true" className="absolute -inset-2 animate-[fade-in_1.2s_ease-out_0.7s_backwards] rounded-full border border-champagne sm:-inset-3" />
      <div aria-hidden="true" className="absolute -inset-4 animate-[fade-in_1.6s_ease-out_1s_backwards] rounded-full border border-dashed border-champagne/60 sm:-inset-7" />

      {/* Circle */}
      <div className="absolute inset-0 overflow-hidden rounded-full bg-plum shadow-card">
        {HERO_PHOTO ? (
          <Image src={HERO_PHOTO} alt="" fill priority sizes="(min-width: 1024px) 32rem, 90vw" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Image
              src="/images/brand/eventgrid-emblem.jpg"
              alt=""
              width={450}
              height={340}
              priority
              className="w-[72%]"
            />
          </div>
        )}
      </div>

      {/* Caption card */}
      <div className="absolute -bottom-5 left-1/2 flex w-max max-w-[19rem] -translate-x-1/2 animate-float items-center gap-3 bg-white px-4 py-3 shadow-card ring-1 ring-line sm:-bottom-4 sm:left-0 sm:max-w-none sm:-translate-x-0 sm:px-5 sm:py-4 sm:-left-6">
        <span aria-hidden="true" className="text-xl text-terracotta">✦</span>
        <span className="flex flex-col">
          <span className="font-display text-[15px] text-ink sm:text-[17px]">Every celebration, one platform</span>
          <span className="hidden text-xs text-ink-soft sm:block">Weddings, birthdays, gatherings and more</span>
        </span>
      </div>

      {/* Rotating badge */}
      <div className="absolute -right-3 top-[2%] flex size-16 items-center justify-center rounded-full bg-champagne shadow-card sm:-right-2 sm:top-[6%] sm:size-28 lg:size-32">
        <svg aria-hidden="true" viewBox="0 0 100 100" className="absolute inset-0 animate-spin-slow">
          <defs>
            <path id="badge-circle" d="M50 50m-36 0a36 36 0 1 1 72 0a36 36 0 1 1-72 0" />
          </defs>
          <text className="fill-plum text-[8.5px] font-semibold uppercase tracking-[0.2em]">
            <textPath href="#badge-circle">One platform · every celebration ·</textPath>
          </text>
        </svg>
        <span aria-hidden="true" className="text-lg text-terracotta sm:text-2xl">✳</span>
      </div>
    </div>
  );
}

import type { Metadata } from "next";

import { Eyebrow } from "@/components/layout/SectionHeading";
import { CartView } from "@/features/shopping/components/CartView";

export const metadata: Metadata = { title: "Cart", robots: { index: false } };

export default function CartPage() {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-14 sm:px-8">
      <div className="flex flex-col gap-4">
        <Eyebrow>Your cart</Eyebrow>
        <h1 className="font-display text-4xl leading-[1.05] tracking-tight text-ink sm:text-5xl">
          Ready to <em className="text-terracotta">book?</em>
        </h1>
      </div>
      <CartView />
    </section>
  );
}

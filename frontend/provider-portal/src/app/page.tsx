import Link from "next/link";

const STEPS = [
  ["Register", "Tell us who you are and tick the services you offer, such as photography, catering or decoration."],
  ["Get approved", "An EVENTGRID administrator reviews your registration. You can sign in once it is approved."],
  ["Fill in your service details", "For each service you get a form that matches it: what you offer, your prices and your packages. Customers can then find you."],
];

export default function Home() {
  return (
    <div className="flex flex-col gap-12">
      <section className="flex max-w-2xl flex-col gap-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">For vendors and event companies</p>
        <h1 className="font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">
          Grow your events business with <em className="text-terracotta">EVENTGRID.</em>
        </h1>
        <p className="text-lg text-ink-soft">Register once, list every service you offer and let customers book your packages.</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/register" className="rounded-md bg-terracotta px-6 py-3.5 font-semibold text-white transition-all hover:bg-terracotta-600 active:scale-[0.98]">
            Register as a vendor
          </Link>
          <Link href="/login" className="rounded-md px-6 py-3.5 font-semibold text-ink ring-1 ring-line hover:text-terracotta">
            Sign in
          </Link>
        </div>
      </section>

      <ol className="flex flex-col gap-4">
        {STEPS.map(([title, body], i) => (
          <li key={title} className="flex gap-5 rounded-xl bg-white p-6 ring-1 ring-line">
            <span className="font-display text-4xl italic leading-none text-terracotta">{i + 1}</span>
            <span className="flex flex-col gap-1">
              <span className="font-display text-xl">{title}</span>
              <span className="text-ink-soft">{body}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="text-sm text-ink-soft">EVENTGRID can also create your account for you. If you were given a temporary password, sign in with it.</p>
    </div>
  );
}

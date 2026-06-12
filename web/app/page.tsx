import Link from "next/link";

import { getCategories, type Category } from "@/lib/api";
import { categoryIcon } from "@/lib/catalog";
import { HeroSearch } from "@/components/hero-search";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const POPULAR = [
  "cleaning",
  "handyman",
  "furniture-assembly",
  "moving-delivery",
  "gardening",
  "painting",
  "electrical",
  "plumbing",
];

// Popular tasks deep-link straight to a specific service (category + service),
// so the wizard opens on that service with its detail prompts.
const QUICK_TASKS: { label: string; slug: string; service: string }[] = [
  { label: "Deep clean my home", slug: "cleaning", service: "Apartment deep clean" },
  { label: "Assemble furniture", slug: "furniture-assembly", service: "IKEA furniture assembly" },
  { label: "Help me move", slug: "moving-delivery", service: "Help moving house" },
  { label: "Fix a leaking tap", slug: "plumbing", service: "Fix a leaking tap" },
  { label: "Mount a TV", slug: "handyman", service: "Mount a TV" },
  { label: "Design a logo", slug: "web-design", service: "Logo design" },
];

async function fetchCategories(): Promise<Category[]> {
  try {
    return await getCategories();
  } catch {
    return [];
  }
}

export default async function Home() {
  const categories = await fetchCategories();
  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  const chips = POPULAR.map((s) => bySlug.get(s)).filter(Boolean) as Category[];

  return (
    <main>
      {/* Hero — centred on posting a task */}
      <section className="hero-wash">
        <div className="mx-auto max-w-3xl px-6 pb-16 pt-20 text-center">
          <span className="inline-block rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
            Get almost anything done
          </span>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl">
            Post a task.
            <br className="hidden sm:block" /> Get it{" "}
            <span className="text-primary">done.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            Describe what you need, get offers from trusted, reviewed taskers,
            and pay securely once it&apos;s done.
          </p>

          {/* Hero post box with typeahead suggestions */}
          <HeroSearch />

          {/* Quick task prompts */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-muted-foreground">Popular:</span>
            {QUICK_TASKS.map((t) => (
              <Link
                key={t.label}
                href={`/post?category=${t.slug}&service=${encodeURIComponent(t.service)}`}
                className="rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {t.label}
              </Link>
            ))}
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            Looking for work instead?{" "}
            <Link href="/browse" className="font-medium text-primary hover:underline">
              Browse open tasks →
            </Link>
          </p>
        </div>
      </section>

      {/* Categories → browse */}
      {chips.length > 0 && (
        <section className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-center text-2xl font-bold">
            What can you get done?
          </h2>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            From a quick fix to a big project — there&apos;s a tasker for it.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {chips.map((c) => (
              <Link
                key={c.id}
                href={`/post?category=${c.slug}`}
                className="group rounded-2xl border bg-card p-6 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-2xl text-accent-foreground">
                  {categoryIcon(c.slug)}
                </div>
                <span className="text-sm font-semibold">{c.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="border-t bg-secondary/40">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-center text-2xl font-bold">How Taskroo works</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {[
              { n: "1", t: "Describe your task", d: "Tell us what you need done, where, and your budget." },
              { n: "2", t: "Get offers", d: "Reviewed taskers send offers. Compare ratings and chat." },
              { n: "3", t: "Pay securely", d: "Funds are held in escrow and released when you're happy." },
            ].map((s) => (
              <div key={s.n} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {s.n}
                </div>
                <h3 className="mt-4 font-semibold">{s.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button asChild size="lg" className="rounded-full px-8">
              <Link href="/post">Post your first task</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

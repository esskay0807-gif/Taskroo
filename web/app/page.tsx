import Link from "next/link";

import { getCategories, type Category } from "@/lib/api";
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
      {/* Hero */}
      <section className="hero-wash">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <span className="inline-block rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
            India’s friendly task marketplace
          </span>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Post a task. <span className="text-primary">Get it done.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Describe what you need, get offers from trusted, reviewed taskers near
            you, chat, and pay securely once it’s done.
          </p>

          {/* Search → browse */}
          <form
            action="/browse"
            method="get"
            className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-full border bg-card p-1.5 shadow-sm"
          >
            <input
              name="q"
              placeholder="In a few words, what do you need done?"
              className="min-w-0 flex-1 bg-transparent px-4 py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
            <Button type="submit" size="lg" className="rounded-full px-6">
              Search
            </Button>
          </form>

          <div className="mt-4 flex items-center justify-center gap-3 text-sm">
            <span className="text-muted-foreground">or</span>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/post">Post a task — it’s free</Link>
            </Button>
          </div>

          {/* Trust strip */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span>★★★★★ Reviewed taskers</span>
            <span>· Secure escrow payments</span>
            <span>· No job too big or small</span>
          </div>
        </div>
      </section>

      {/* Categories */}
      {chips.length > 0 && (
        <section className="mx-auto max-w-5xl px-6 py-14">
          <h2 className="text-center text-2xl font-bold">
            Popular categories
          </h2>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            Browse tasks by what you need help with.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {chips.map((c) => (
              <Link
                key={c.id}
                href={`/browse?category=${c.slug}`}
                className="group rounded-xl border bg-card p-5 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <CategoryIcon slug={c.slug} />
                </div>
                <span className="text-sm font-medium">{c.name}</span>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/browse">Browse all tasks</Link>
            </Button>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="border-t bg-secondary/40">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-center text-2xl font-bold">How it works</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {[
              {
                n: "1",
                t: "Describe your task",
                d: "Tell us what you need done, where, and your budget.",
              },
              {
                n: "2",
                t: "Get offers",
                d: "Reviewed taskers send offers. Compare ratings and chat.",
              },
              {
                n: "3",
                t: "Pay securely",
                d: "Funds are held in escrow and released when you’re happy.",
              },
            ].map((s) => (
              <div key={s.n} className="text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
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

function CategoryIcon({ slug }: { slug: string }) {
  const map: Record<string, string> = {
    cleaning: "🧽",
    handyman: "🔧",
    "furniture-assembly": "🪑",
    "moving-delivery": "📦",
    gardening: "🌿",
    painting: "🎨",
    electrical: "💡",
    plumbing: "🚰",
    "appliance-repair": "🛠️",
    tutoring: "📚",
    photography: "📷",
    "web-design": "💻",
  };
  return <span className="text-xl">{map[slug] ?? "✅"}</span>;
}

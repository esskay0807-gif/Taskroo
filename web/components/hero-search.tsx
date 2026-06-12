"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { categoryIcon, searchServices } from "@/lib/catalog";
import { Button } from "@/components/ui/button";

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const matches = searchServices(query);
  const showDropdown = open && matches.length > 0;

  function goCustom() {
    const t = query.trim();
    router.push(t ? `/post?title=${encodeURIComponent(t)}` : "/post");
  }

  function pick(slug: string, service: string) {
    router.push(
      `/post?category=${slug}&service=${encodeURIComponent(service)}`,
    );
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const m = matches[active];
      if (m) pick(m.slug, m.service);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative mx-auto mt-8 max-w-xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          goCustom();
        }}
        className="flex items-center gap-2 rounded-full border bg-card p-2 shadow-lg shadow-primary/5"
      >
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
          placeholder="In a few words, what do you need done?"
          className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-base outline-none placeholder:text-muted-foreground"
          aria-label="Search for a task"
          autoComplete="off"
        />
        <Button type="submit" size="lg" className="rounded-full px-7">
          Post a task
        </Button>
      </form>

      {showDropdown && (
        <ul className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border bg-card text-left shadow-xl">
          {matches.map((m, i) => (
            <li key={`${m.slug}-${m.service}`}>
              <button
                type="button"
                // keep input focus so the click registers before blur closes the list
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(m.slug, m.service)}
                className={
                  "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors " +
                  (i === active ? "bg-accent/60" : "hover:bg-accent/40")
                }
              >
                <span className="text-lg">{categoryIcon(m.slug)}</span>
                <span className="flex-1 text-sm font-medium">{m.service}</span>
                <span className="text-xs text-muted-foreground">
                  {m.category}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

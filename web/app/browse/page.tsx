"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  getCategories,
  listTasks,
  type TaskFilters,
} from "@/lib/api";
import { categoryIcon, searchServices } from "@/lib/catalog";
import { TaskCard } from "@/components/task-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function BrowsePage() {
  // Seed q / category from the URL (e.g. links from the home hero & category tiles).
  const [filters, setFilters] = useState<TaskFilters>(() => {
    if (typeof window === "undefined") return { sort: "newest" };
    const sp = new URLSearchParams(window.location.search);
    return {
      sort: "newest",
      q: sp.get("q") ?? undefined,
      category: sp.get("category") ?? undefined,
    };
  });

  const update = (patch: Partial<TaskFilters>) =>
    setFilters((f) => ({ ...f, ...patch }));

  // Search typeahead
  const [searchOpen, setSearchOpen] = useState(false);
  const [active, setActive] = useState(0);
  const matches = searchServices(filters.q ?? "");
  const showSuggestions = searchOpen && matches.length > 0;

  function selectService(slug: string, service: string) {
    update({ category: slug, q: service });
    setSearchOpen(false);
  }

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["tasks", filters],
    queryFn: () => listTasks(filters),
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Browse tasks</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Find work near you and send an offer.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 grid grid-cols-1 gap-4 rounded-xl border bg-card p-5 shadow-sm sm:grid-cols-2">
        <div className="relative space-y-1 sm:col-span-2">
          <Label htmlFor="q">Search</Label>
          <Input
            id="q"
            placeholder="Search tasks or services…"
            autoComplete="off"
            value={filters.q ?? ""}
            onChange={(e) => {
              update({ q: e.target.value });
              setSearchOpen(true);
              setActive(0);
            }}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
            onKeyDown={(e) => {
              if (!showSuggestions) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, matches.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                const m = matches[active];
                if (m) selectService(m.slug, m.service);
              } else if (e.key === "Escape") {
                setSearchOpen(false);
              }
            }}
          />
          {showSuggestions && (
            <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border bg-card shadow-xl">
              {matches.map((m, i) => (
                <li key={`${m.slug}-${m.service}`}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => selectService(m.slug, m.service)}
                    className={
                      "flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors " +
                      (i === active ? "bg-accent/60" : "hover:bg-accent/40")
                    }
                  >
                    <span className="text-base">{categoryIcon(m.slug)}</span>
                    <span className="flex-1 font-medium">{m.service}</span>
                    <span className="text-xs text-muted-foreground">
                      {m.category}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="space-y-1">
          <Label>Category</Label>
          <Select
            value={filters.category ?? ""}
            onChange={(e) => update({ category: e.target.value })}
          >
            <option value="">All categories</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Location</Label>
          <Select
            value={filters.location_type ?? ""}
            onChange={(e) =>
              update({
                location_type: e.target.value as TaskFilters["location_type"],
              })
            }
          >
            <option value="">Anywhere</option>
            <option value="in_person">In person</option>
            <option value="remote">Remote</option>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            placeholder="e.g. Bengaluru"
            value={filters.city ?? ""}
            onChange={(e) => update({ city: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label>Sort</Label>
          <Select
            value={filters.sort ?? "newest"}
            onChange={(e) =>
              update({ sort: e.target.value as TaskFilters["sort"] })
            }
          >
            <option value="newest">Newest</option>
            <option value="budget_asc">Budget: low to high</option>
            <option value="budget_desc">Budget: high to low</option>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="bmin">Min budget (₹)</Label>
          <Input
            id="bmin"
            type="number"
            value={filters.budget_min ?? ""}
            onChange={(e) =>
              update({
                budget_min: e.target.value === "" ? "" : Number(e.target.value),
              })
            }
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="bmax">Max budget (₹)</Label>
          <Input
            id="bmax"
            type="number"
            value={filters.budget_max ?? ""}
            onChange={(e) =>
              update({
                budget_max: e.target.value === "" ? "" : Number(e.target.value),
              })
            }
          />
        </div>
      </div>

      {/* Results */}
      {isLoading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}
      {error && (
        <p className="text-sm text-red-600">{(error as Error).message}</p>
      )}
      {data && data.items.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No tasks match your filters yet.
        </p>
      )}
      <div className="space-y-3">
        {data?.items.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
      {data && data.total > 0 && (
        <p className="mt-6 text-xs text-muted-foreground">
          Showing {data.items.length} of {data.total} tasks.
        </p>
      )}
    </main>
  );
}

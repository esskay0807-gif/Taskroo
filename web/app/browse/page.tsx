"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  getCategories,
  listTasks,
  type TaskFilters,
} from "@/lib/api";
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
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="q">Search</Label>
          <Input
            id="q"
            placeholder="Search tasks…"
            value={filters.q ?? ""}
            onChange={(e) => update({ q: e.target.value })}
          />
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

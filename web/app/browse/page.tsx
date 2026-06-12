"use client";

import Link from "next/link";
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

export default function BrowsePage() {
  const [filters, setFilters] = useState<TaskFilters>({ sort: "newest" });

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
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          ← Home
        </Link>
        <Link href="/post" className="text-sm font-medium hover:underline">
          Post a task →
        </Link>
      </div>

      <h1 className="mb-6 text-2xl font-bold">Browse tasks</h1>

      {/* Filters */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
      {isLoading && <p className="text-sm">Loading tasks…</p>}
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

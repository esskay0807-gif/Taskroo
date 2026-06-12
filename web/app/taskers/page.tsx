"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  getCategories,
  getTaskerDirectory,
  type TaskerDirectoryFilters,
} from "@/lib/api";
import { TaskerCard } from "@/components/tasker-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function TaskersPage() {
  const [filters, setFilters] = useState<TaskerDirectoryFilters>(() => {
    if (typeof window === "undefined") return {};
    const sp = new URLSearchParams(window.location.search);
    return {
      category: sp.get("category") ?? undefined,
      city: sp.get("city") ?? undefined,
    };
  });

  const update = (patch: Partial<TaskerDirectoryFilters>) =>
    setFilters((f) => ({ ...f, ...patch }));

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["taskers", filters],
    queryFn: () => getTaskerDirectory(filters),
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Find local taskers
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse trusted local taskers and request a fixed-price service directly.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 rounded-xl border bg-card p-5 shadow-sm sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="q">Search</Label>
          <Input
            id="q"
            placeholder="Tasker name…"
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
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            placeholder="e.g. Bengaluru"
            value={filters.city ?? ""}
            onChange={(e) => update({ city: e.target.value })}
          />
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      )}
      {data && data.items.length === 0 && (
        <p className="rounded-2xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
          No taskers match yet. Taskers who list services will appear here.
        </p>
      )}
      <div className="space-y-4">
        {data?.items.map((t) => (
          <TaskerCard key={t.id} tasker={t} />
        ))}
      </div>
    </main>
  );
}

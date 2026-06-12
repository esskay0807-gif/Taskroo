"use client";

import { useAuth } from "@/lib/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import {
  createService,
  deleteService,
  getCategories,
  getMe,
  myServices,
  updateService,
  type TaskerService,
} from "@/lib/api";
import { formatInr } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export function ServicesManager() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => getMe(await getToken()),
  });
  const { data: services } = useQuery({
    queryKey: ["my-services"],
    queryFn: async () => myServices(await getToken()),
  });
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["my-services"] });

  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");

  const create = useMutation({
    mutationFn: async () =>
      createService(await getToken(), {
        category_id: categoryId,
        title: title.trim(),
        price: Number(price),
        description: description.trim() || null,
      }),
    onSuccess: () => {
      setCategoryId("");
      setTitle("");
      setPrice("");
      setDescription("");
      invalidate();
    },
  });

  if (!me?.is_tasker) return null;

  const canAdd =
    categoryId !== "" && title.trim().length >= 3 && Number(price) > 0;

  return (
    <section className="rounded-2xl border bg-card p-6 shadow-sm">
      <h2 className="font-semibold">My services</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">
        List fixed-price services so clients can hire you directly.
      </p>

      <div className="mt-4 space-y-2">
        {services?.map((s) => (
          <ServiceRow key={s.id} service={s} onChange={invalidate} />
        ))}
        {services && services.length === 0 && (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            No services yet — add one below.
          </p>
        )}
      </div>

      {/* Add a service */}
      <div className="mt-4 space-y-3 rounded-xl bg-secondary/30 p-4">
        <p className="text-sm font-medium">Add a service</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select
              className="h-10"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Select…</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="svc-price">Price (₹)</Label>
            <Input
              id="svc-price"
              type="number"
              className="h-10"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="1500"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="svc-title">Title</Label>
          <Input
            id="svc-title"
            className="h-10"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Deep clean 2BHK apartment"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="svc-desc">Description (optional)</Label>
          <Textarea
            id="svc-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's included"
          />
        </div>
        <Button
          size="sm"
          className="rounded-full"
          onClick={() => create.mutate()}
          disabled={!canAdd || create.isPending}
        >
          {create.isPending ? "Adding…" : "Add service"}
        </Button>
        {create.isError && (
          <p className="text-xs text-red-600">
            {(create.error as Error).message}
          </p>
        )}
      </div>
    </section>
  );
}

function ServiceRow({
  service,
  onChange,
}: {
  service: TaskerService;
  onChange: () => void;
}) {
  const { getToken } = useAuth();

  const toggle = useMutation({
    mutationFn: async () =>
      updateService(await getToken(), service.id, {
        is_active: !service.is_active,
      }),
    onSuccess: onChange,
  });
  const remove = useMutation({
    mutationFn: async () => deleteService(await getToken(), service.id),
    onSuccess: onChange,
  });

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
      <div className="min-w-0">
        <p className="truncate font-medium">
          {service.title}{" "}
          <span className="text-sm text-muted-foreground">
            · {formatInr(service.price)}
          </span>
        </p>
        <p className="text-xs text-muted-foreground">{service.category.name}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Switch
            checked={service.is_active}
            onCheckedChange={() => toggle.mutate()}
          />
          <span className="text-xs text-muted-foreground">
            {service.is_active ? "Active" : "Off"}
          </span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="rounded-full text-red-600 hover:text-red-700"
          onClick={() => remove.mutate()}
          disabled={remove.isPending}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}

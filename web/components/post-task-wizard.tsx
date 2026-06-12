"use client";

import { useAuth } from "@/lib/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { type Path, useForm } from "react-hook-form";
import { z } from "zod";

import {
  createTask,
  getCategories,
  uploadFile,
  type TaskCreateInput,
} from "@/lib/api";
import { formatBudget } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const schema = z
  .object({
    title: z.string().min(3, "At least 3 characters"),
    description: z.string().min(1, "Required"),
    category_id: z.string().min(1, "Pick a category"),
    location_type: z.enum(["in_person", "remote"]),
    city: z.string(),
    address: z.string(),
    lat: z.string(),
    lng: z.string(),
    budget_min: z.string().min(1, "Required"),
    budget_max: z.string().min(1, "Required"),
  })
  .superRefine((val, ctx) => {
    if (val.location_type === "in_person" && val.city.trim() === "") {
      ctx.addIssue({
        path: ["city"],
        code: z.ZodIssueCode.custom,
        message: "City is required for in-person tasks",
      });
    }
    const mn = Number(val.budget_min);
    const mx = Number(val.budget_max);
    if (val.budget_min && (Number.isNaN(mn) || mn <= 0)) {
      ctx.addIssue({
        path: ["budget_min"],
        code: z.ZodIssueCode.custom,
        message: "Enter a positive amount",
      });
    }
    if (val.budget_max && (Number.isNaN(mx) || mx <= 0)) {
      ctx.addIssue({
        path: ["budget_max"],
        code: z.ZodIssueCode.custom,
        message: "Enter a positive amount",
      });
    }
    if (!Number.isNaN(mn) && !Number.isNaN(mx) && mn > mx) {
      ctx.addIssue({
        path: ["budget_max"],
        code: z.ZodIssueCode.custom,
        message: "Max must be greater than or equal to min",
      });
    }
  });

type FormValues = z.infer<typeof schema>;

const STEPS = ["Details", "Location", "Budget", "Photos", "Review"] as const;

const STEP_FIELDS: Path<FormValues>[][] = [
  ["title", "description", "category_id"],
  ["location_type", "city", "address", "lat", "lng"],
  ["budget_min", "budget_max"],
  [],
  [],
];

export function PostTaskWizard() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [step, setStep] = useState(0);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const {
    register,
    trigger,
    watch,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      title: "",
      description: "",
      category_id: "",
      location_type: "in_person",
      city: "",
      address: "",
      lat: "",
      lng: "",
      budget_min: "",
      budget_max: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (input: TaskCreateInput) =>
      createTask(await getToken(), input),
    onSuccess: (task) => router.push(`/tasks/${task.id}`),
  });

  const locationType = watch("location_type");

  async function next() {
    const valid = await trigger(STEP_FIELDS[step]);
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const token = await getToken();
      const urls = await Promise.all(
        files.map((f) => uploadFile(token, f, "task")),
      );
      setPhotoUrls((prev) => [...prev, ...urls].slice(0, 10));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function submit() {
    const v = getValues();
    const input: TaskCreateInput = {
      title: v.title.trim(),
      description: v.description.trim(),
      category_id: v.category_id,
      location_type: v.location_type,
      city: v.location_type === "in_person" ? v.city.trim() || null : null,
      address:
        v.location_type === "in_person" ? v.address.trim() || null : null,
      lat: v.lat.trim() === "" ? null : Number(v.lat),
      lng: v.lng.trim() === "" ? null : Number(v.lng),
      budget_min: Number(v.budget_min),
      budget_max: Number(v.budget_max),
      photo_urls: photoUrls,
    };
    mutation.mutate(input);
  }

  const v = getValues();

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <ol className="flex flex-wrap gap-2 text-xs">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={
              "rounded-full border px-2.5 py-1 " +
              (i === step
                ? "border-primary font-medium text-primary"
                : i < step
                  ? "border-green-600 text-green-700"
                  : "text-muted-foreground")
            }
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register("title")} placeholder="e.g. Deep clean my apartment" />
            {errors.title && (
              <p className="text-xs text-red-600">{errors.title.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Describe what you need done"
            />
            {errors.description && (
              <p className="text-xs text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select {...register("category_id")}>
              <option value="">Select a category…</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            {errors.category_id && (
              <p className="text-xs text-red-600">
                {errors.category_id.message}
              </p>
            )}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Location type</Label>
            <Select {...register("location_type")}>
              <option value="in_person">In person</option>
              <option value="remote">Remote</option>
            </Select>
          </div>
          {locationType === "in_person" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" {...register("city")} placeholder="Bengaluru" />
                {errors.city && (
                  <p className="text-xs text-red-600">{errors.city.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address (optional)</Label>
                <Input id="address" {...register("address")} placeholder="Area / street" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lat">Latitude (optional)</Label>
                  <Input id="lat" {...register("lat")} placeholder="12.97" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lng">Longitude (optional)</Label>
                  <Input id="lng" {...register("lng")} placeholder="77.59" />
                </div>
              </div>
            </>
          )}
          {locationType === "remote" && (
            <p className="text-sm text-muted-foreground">
              Remote tasks don&apos;t need a location.
            </p>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="budget_min">Min budget (₹)</Label>
            <Input id="budget_min" type="number" {...register("budget_min")} placeholder="1500" />
            {errors.budget_min && (
              <p className="text-xs text-red-600">{errors.budget_min.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget_max">Max budget (₹)</Label>
            <Input id="budget_max" type="number" {...register("budget_max")} placeholder="3000" />
            {errors.budget_max && (
              <p className="text-xs text-red-600">{errors.budget_max.message}</p>
            )}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <Label>Photos (optional, up to 10)</Label>
          <label className="inline-block">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePhotos}
              disabled={uploading || photoUrls.length >= 10}
            />
            <Button type="button" variant="outline" size="sm" asChild>
              <span>{uploading ? "Uploading…" : "Add photos"}</span>
            </Button>
          </label>
          <div className="flex flex-wrap gap-2">
            {photoUrls.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt="Task photo"
                className="h-20 w-20 rounded border object-cover"
              />
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3 rounded-lg border p-4 text-sm">
          <p className="text-base font-medium">{v.title || "(no title)"}</p>
          <p className="whitespace-pre-wrap text-muted-foreground">
            {v.description}
          </p>
          <dl className="grid grid-cols-2 gap-2">
            <dt className="text-muted-foreground">Category</dt>
            <dd>
              {categories?.find((c) => c.id === v.category_id)?.name ?? "—"}
            </dd>
            <dt className="text-muted-foreground">Location</dt>
            <dd>
              {v.location_type === "remote"
                ? "Remote"
                : [v.city, v.address].filter(Boolean).join(", ") || "In person"}
            </dd>
            <dt className="text-muted-foreground">Budget</dt>
            <dd>
              {v.budget_min && v.budget_max
                ? formatBudget(Number(v.budget_min), Number(v.budget_max))
                : "—"}
            </dd>
            <dt className="text-muted-foreground">Photos</dt>
            <dd>{photoUrls.length}</dd>
          </dl>
          {mutation.isError && (
            <p className="text-red-600">
              {(mutation.error as Error).message}
            </p>
          )}
        </div>
      )}

      {/* Nav */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setStep((s) => Math.max(s - 1, 0))}
          disabled={step === 0 || mutation.isPending}
        >
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={next}>
            Next
          </Button>
        ) : (
          <Button type="button" onClick={submit} disabled={mutation.isPending}>
            {mutation.isPending ? "Posting…" : "Post task"}
          </Button>
        )}
      </div>
    </div>
  );
}

"use client";

import { useAuth } from "@/lib/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { type Path, useForm } from "react-hook-form";
import { z } from "zod";

import {
  createTask,
  getCategories,
  uploadFile,
  type TaskCreateInput,
} from "@/lib/api";
import { categoryIcon, servicesFor } from "@/lib/catalog";
import { formatBudget } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const STEPS = [
  { label: "Details", heading: "What do you need done?", sub: "Give your task a clear title and description." },
  { label: "Location", heading: "Where is it?", sub: "In person or remote — taskers nearby can help." },
  { label: "Budget", heading: "What's your budget?", sub: "A range helps taskers send realistic offers." },
  { label: "Photos", heading: "Add photos", sub: "Optional, but they help taskers understand the job." },
  { label: "Review", heading: "Review & post", sub: "Check the details, then post your task." },
] as const;

const STEP_FIELDS: Path<FormValues>[][] = [
  ["title", "description", "category_id"],
  ["location_type", "city", "address", "lat", "lng"],
  ["budget_min", "budget_max"],
  [],
  [],
];

function initialTitle(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("title") ?? "";
}

export function PostTaskWizard() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [step, setStep] = useState(0);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  // "Something else" — let the user type a custom title instead of picking a service.
  const [custom, setCustom] = useState(() => initialTitle() !== "");

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const {
    register,
    trigger,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      title: initialTitle(),
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
  const categoryId = watch("category_id");
  const title = watch("title");
  const selectedCategory = categories?.find((c) => c.id === categoryId);
  const services = selectedCategory ? servicesFor(selectedCategory.slug) : [];

  // Pre-select a category from ?category=<slug> (deep links from the home page).
  useEffect(() => {
    if (!categories) return;
    const slug = new URLSearchParams(window.location.search).get("category");
    if (slug && !getValues("category_id")) {
      const match = categories.find((c) => c.slug === slug);
      if (match) setValue("category_id", match.id);
    }
  }, [categories, getValues, setValue]);

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
  const current = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="space-y-8">
      {/* Progress */}
      <div>
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>
            Step {step + 1} of {STEPS.length}
          </span>
          <span>{current.label}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold tracking-tight">{current.heading}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{current.sub}</p>
      </div>

      {step === 0 && (
        <div className="space-y-6">
          {/* Keep title/category in the form; they're set by the pickers below. */}
          <input type="hidden" {...register("title")} />
          <input type="hidden" {...register("category_id")} />

          {!selectedCategory ? (
            /* 1) Pick a category */
            <div>
              <p className="mb-3 text-sm font-medium">Choose a category</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {categories?.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setValue("category_id", c.id, { shouldValidate: true });
                      setValue("title", "");
                      setCustom(false);
                    }}
                    className="flex flex-col items-center gap-2 rounded-xl border-2 border-border p-4 text-center transition-colors hover:border-primary/50 hover:bg-accent/40"
                  >
                    <span className="text-2xl">{categoryIcon(c.slug)}</span>
                    <span className="text-sm font-medium">{c.name}</span>
                  </button>
                ))}
              </div>
              {errors.category_id && (
                <p className="mt-2 text-xs text-red-600">
                  {errors.category_id.message}
                </p>
              )}
            </div>
          ) : (
            /* 2) Pick a service within the category */
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
                  {categoryIcon(selectedCategory.slug)} {selectedCategory.name}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setValue("category_id", "");
                    setValue("title", "");
                    setCustom(false);
                  }}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Change
                </button>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">What do you need?</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {services.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setValue("title", s, { shouldValidate: true });
                        setCustom(false);
                      }}
                      className={cn(
                        "rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                        !custom && title === s
                          ? "border-primary bg-accent font-medium"
                          : "border-border hover:border-primary/40",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setCustom(true);
                      setValue("title", "");
                    }}
                    className={cn(
                      "rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                      custom
                        ? "border-primary bg-accent font-medium"
                        : "border-dashed border-border hover:border-primary/40",
                    )}
                  >
                    ✏️ Something else…
                  </button>
                </div>
                {custom && (
                  <Input
                    autoFocus
                    className="mt-3 h-12"
                    {...register("title")}
                    placeholder="Describe your task in a few words"
                  />
                )}
                {errors.title && (
                  <p className="mt-2 text-xs text-red-600">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Add details</Label>
                <Textarea
                  id="description"
                  className="min-h-32"
                  {...register("description")}
                  placeholder="Share the details — what, when, and anything a tasker should know."
                />
                {errors.description && (
                  <p className="text-xs text-red-600">
                    {errors.description.message}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <input type="hidden" {...register("location_type")} />
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                { v: "in_person", t: "In person", d: "At a location", icon: "📍" },
                { v: "remote", t: "Remote", d: "Done online", icon: "💻" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.v}
                type="button"
                onClick={() =>
                  setValue("location_type", opt.v, { shouldValidate: true })
                }
                className={cn(
                  "rounded-xl border-2 p-4 text-left transition-colors",
                  locationType === opt.v
                    ? "border-primary bg-accent"
                    : "border-border hover:border-primary/40",
                )}
              >
                <div className="text-2xl">{opt.icon}</div>
                <div className="mt-2 font-semibold">{opt.t}</div>
                <div className="text-xs text-muted-foreground">{opt.d}</div>
              </button>
            ))}
          </div>
          {locationType === "in_person" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" className="h-12" {...register("city")} placeholder="Bengaluru" />
                {errors.city && (
                  <p className="text-xs text-red-600">{errors.city.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address (optional)</Label>
                <Input id="address" className="h-12" {...register("address")} placeholder="Area / street" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lat">Latitude (optional)</Label>
                  <Input id="lat" className="h-12" {...register("lat")} placeholder="12.97" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lng">Longitude (optional)</Label>
                  <Input id="lng" className="h-12" {...register("lng")} placeholder="77.59" />
                </div>
              </div>
            </>
          )}
          {locationType === "remote" && (
            <p className="rounded-lg bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
              Remote tasks don&apos;t need a location — taskers can help from anywhere.
            </p>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget_min">Min budget (₹)</Label>
              <Input id="budget_min" type="number" className="h-12" {...register("budget_min")} placeholder="1500" />
              {errors.budget_min && (
                <p className="text-xs text-red-600">{errors.budget_min.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget_max">Max budget (₹)</Label>
              <Input id="budget_max" type="number" className="h-12" {...register("budget_max")} placeholder="3000" />
              {errors.budget_max && (
                <p className="text-xs text-red-600">{errors.budget_max.message}</p>
              )}
            </div>
          </div>
          <p className="rounded-lg bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
            Taskers send offers around this range — you only pay when you accept one.
          </p>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent/40">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePhotos}
              disabled={uploading || photoUrls.length >= 10}
            />
            <span className="text-2xl">🖼️</span>
            <span className="mt-1">
              {uploading ? "Uploading…" : "Click to add photos (up to 10)"}
            </span>
          </label>
          {photoUrls.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {photoUrls.map((url) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={url}
                  src={url}
                  alt="Task photo"
                  className="h-24 w-24 rounded-lg border object-cover"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4 rounded-xl border bg-secondary/40 p-5">
          <p className="text-lg font-semibold">{v.title || "(no title)"}</p>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {v.description}
          </p>
          <dl className="grid grid-cols-1 gap-3 border-t pt-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Category</dt>
              <dd className="font-medium">
                {categories?.find((c) => c.id === v.category_id)?.name ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Location</dt>
              <dd className="font-medium">
                {v.location_type === "remote"
                  ? "Remote"
                  : [v.city, v.address].filter(Boolean).join(", ") || "In person"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Budget</dt>
              <dd className="font-medium">
                {v.budget_min && v.budget_max
                  ? formatBudget(Number(v.budget_min), Number(v.budget_max))
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Photos</dt>
              <dd className="font-medium">{photoUrls.length}</dd>
            </div>
          </dl>
          {mutation.isError && (
            <p className="text-sm text-red-600">
              {(mutation.error as Error).message}
            </p>
          )}
        </div>
      )}

      {/* Nav */}
      <div className="flex items-center justify-between border-t pt-6">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setStep((s) => Math.max(s - 1, 0))}
          disabled={step === 0 || mutation.isPending}
        >
          ← Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="button" size="lg" className="rounded-full px-8" onClick={next}>
            Continue
          </Button>
        ) : (
          <Button
            type="button"
            size="lg"
            className="rounded-full px-8"
            onClick={submit}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Posting…" : "Post task"}
          </Button>
        )}
      </div>
    </div>
  );
}

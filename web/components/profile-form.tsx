"use client";

import { useAuth } from "@/lib/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import {
  getCategories,
  getMe,
  updateMe,
  type Me,
  type ProfileUpdate,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { AvatarUploader } from "@/components/avatar-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const coordField = (max: number, label: string) =>
  z.string().refine(
    (v) => {
      if (v.trim() === "") return true;
      const n = Number(v);
      return !Number.isNaN(n) && n >= -max && n <= max;
    },
    { message: `Enter a valid ${label} between -${max} and ${max}` },
  );

const formSchema = z.object({
  name: z.string().max(120),
  bio: z.string().max(1000),
  city: z.string().max(120),
  avatar_url: z.string(),
  lat: coordField(90, "latitude"),
  lng: coordField(180, "longitude"),
  is_poster: z.boolean(),
  is_tasker: z.boolean(),
  is_available: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

function toFormValues(me: Me): FormValues {
  return {
    name: me.name ?? "",
    bio: me.bio ?? "",
    city: me.city ?? "",
    avatar_url: me.avatar_url ?? "",
    lat: me.lat != null ? String(me.lat) : "",
    lng: me.lng != null ? String(me.lng) : "",
    is_poster: me.is_poster,
    is_tasker: me.is_tasker,
    is_available: me.is_available,
  };
}

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-card p-6 shadow-sm">
      <h2 className="font-semibold">{title}</h2>
      {desc && <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export function ProfileForm() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [skills, setSkills] = useState<Set<string>>(new Set());

  const { data: me, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: async () => getMe(await getToken()),
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  // Seed skills from the loaded profile.
  useEffect(() => {
    if (me) setSkills(new Set(me.categories.map((c) => c.id)));
  }, [me]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: me ? toFormValues(me) : undefined,
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const text = (v: string) => (v.trim() === "" ? null : v.trim());
      const num = (v: string) => (v.trim() === "" ? null : Number(v));
      const payload: ProfileUpdate = {
        name: text(values.name),
        bio: text(values.bio),
        city: text(values.city),
        avatar_url: text(values.avatar_url),
        lat: num(values.lat),
        lng: num(values.lng),
        is_poster: values.is_poster,
        is_tasker: values.is_tasker,
        is_available: values.is_available,
        category_ids: Array.from(skills),
      };
      return updateMe(await getToken(), payload);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["me"], updated);
      reset(toFormValues(updated));
      setSkills(new Set(updated.categories.map((c) => c.id)));
    },
  });

  if (isLoading || !me) {
    return <p className="text-sm">Loading your profile…</p>;
  }

  const isTasker = watch("is_tasker");

  function toggleSkill(id: string) {
    setSkills((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  const skillsDirty =
    me != null &&
    (skills.size !== me.categories.length ||
      me.categories.some((c) => !skills.has(c.id)));

  return (
    <form
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      className="space-y-6"
    >
      <Section title="Public profile" desc="How others see you on Taskroo.">
        <div className="space-y-2">
          <Label>Avatar</Label>
          <AvatarUploader
            value={watch("avatar_url") || null}
            onUploaded={(url) =>
              setValue("avatar_url", url, { shouldDirty: true })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register("name")} placeholder="Your name" />
          {errors.name && (
            <p className="text-xs text-red-600">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" {...register("bio")} placeholder="A short bio" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" {...register("city")} placeholder="Bengaluru" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="lat">Latitude</Label>
            <Input id="lat" {...register("lat")} placeholder="12.97" />
            {errors.lat && (
              <p className="text-xs text-red-600">{errors.lat.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lng">Longitude</Label>
            <Input id="lng" {...register("lng")} placeholder="77.59" />
            {errors.lng && (
              <p className="text-xs text-red-600">{errors.lng.message}</p>
            )}
          </div>
        </div>
      </Section>

      <Section title="How you use Taskroo">
        <Controller
          control={control}
          name="is_poster"
          render={({ field }) => (
            <ToggleRow
              label="Post tasks"
              desc="Hire taskers to get things done."
              checked={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="is_tasker"
          render={({ field }) => (
            <ToggleRow
              label="Work as a tasker"
              desc="Get recommended for and invited to tasks."
              checked={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </Section>

      {isTasker && (
        <Section
          title="Tasker profile"
          desc="Pick your skills so posters can find and invite you."
        >
          <Controller
            control={control}
            name="is_available"
            render={({ field }) => (
              <ToggleRow
                label="Available for work"
                desc="Turn off to stop appearing in recommendations."
                checked={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <div className="space-y-2">
            <Label>Skills</Label>
            <div className="flex flex-wrap gap-2">
              {categories?.map((c) => {
                const on = skills.has(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleSkill(c.id)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition-colors",
                      on
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>
        </Section>
      )}

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          className="rounded-full px-6"
          disabled={mutation.isPending || (!isDirty && !skillsDirty)}
        >
          {mutation.isPending ? "Saving…" : "Save profile"}
        </Button>
        {mutation.isSuccess && !isDirty && !skillsDirty && (
          <span className="text-sm text-green-600">Saved.</span>
        )}
        {mutation.isError && (
          <span className="text-sm text-red-600">
            {(mutation.error as Error).message}
          </span>
        )}
      </div>
    </form>
  );
}

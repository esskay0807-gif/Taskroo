"use client";

import { useAuth } from "@/lib/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { getMe, updateMe, type Me, type ProfileUpdate } from "@/lib/api";
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

// The form works entirely in strings + booleans (what the inputs produce); we
// convert to the API's nullable/number shape on submit.
const formSchema = z.object({
  name: z.string().max(120),
  bio: z.string().max(1000),
  city: z.string().max(120),
  avatar_url: z.string(),
  lat: coordField(90, "latitude"),
  lng: coordField(180, "longitude"),
  is_poster: z.boolean(),
  is_tasker: z.boolean(),
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
  };
}

function toPayload(values: FormValues): ProfileUpdate {
  const text = (v: string) => (v.trim() === "" ? null : v.trim());
  const num = (v: string) => (v.trim() === "" ? null : Number(v));
  return {
    name: text(values.name),
    bio: text(values.bio),
    city: text(values.city),
    avatar_url: text(values.avatar_url),
    lat: num(values.lat),
    lng: num(values.lng),
    is_poster: values.is_poster,
    is_tasker: values.is_tasker,
  };
}

export function ProfileForm() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data: me, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: async () => getMe(await getToken()),
  });

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
    mutationFn: async (values: FormValues) =>
      updateMe(await getToken(), toPayload(values)),
    onSuccess: (updated) => {
      queryClient.setQueryData(["me"], updated);
      reset(toFormValues(updated));
    },
  });

  if (isLoading || !me) {
    return <p className="text-sm">Loading your profile…</p>;
  }

  return (
    <form
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      className="space-y-6"
    >
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
        {errors.bio && (
          <p className="text-xs text-red-600">{errors.bio.message}</p>
        )}
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

      <div className="space-y-3">
        <Label>Roles</Label>
        <Controller
          control={control}
          name="is_poster"
          render={({ field }) => (
            <div className="flex items-center justify-between">
              <span className="text-sm">Act as a Poster (post tasks)</span>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </div>
          )}
        />
        <Controller
          control={control}
          name="is_tasker"
          render={({ field }) => (
            <div className="flex items-center justify-between">
              <span className="text-sm">Act as a Tasker (do tasks)</span>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </div>
          )}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={mutation.isPending || !isDirty}>
          {mutation.isPending ? "Saving…" : "Save profile"}
        </Button>
        {mutation.isSuccess && !isDirty && (
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

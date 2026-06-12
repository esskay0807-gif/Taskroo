"use client";

import { useAuth, SignedIn, SignedOut, SignInButton } from "@/lib/auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { getMe, requestService, type TaskerService } from "@/lib/api";
import { formatInr } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function RequestService({ service }: { service: TaskerService }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <SignedOut>
        <SignInButton mode="modal">
          <Button size="sm" className="rounded-full">
            Request · {formatInr(service.price)}
          </Button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        {open ? (
          <RequestForm service={service} onClose={() => setOpen(false)} />
        ) : (
          <Button
            size="sm"
            className="rounded-full"
            onClick={() => setOpen(true)}
          >
            Request · {formatInr(service.price)}
          </Button>
        )}
      </SignedIn>
    </div>
  );
}

function RequestForm({
  service,
  onClose,
}: {
  service: TaskerService;
  onClose: () => void;
}) {
  const { getToken } = useAuth();
  const router = useRouter();
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => getMe(await getToken()),
  });

  const [locationType, setLocationType] = useState<"in_person" | "remote">(
    "in_person",
  );
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [seeded, setSeeded] = useState(false);

  // Prefill the city from the requester's profile once.
  if (me && !seeded) {
    setSeeded(true);
    if (me.city) setCity(me.city);
  }

  const mutation = useMutation({
    mutationFn: async () =>
      requestService(await getToken(), service.id, {
        location_type: locationType,
        city: locationType === "in_person" ? city.trim() || null : null,
        address: locationType === "in_person" ? address.trim() || null : null,
        note: note.trim() || null,
      }),
    onSuccess: (task) => router.push(`/tasks/${task.id}`),
  });

  return (
    <div className="mt-3 space-y-3 rounded-xl border bg-secondary/30 p-4">
      <p className="text-sm font-medium">
        Request “{service.title}” · {formatInr(service.price)} fixed
      </p>
      <div className="space-y-1.5">
        <Label>Location</Label>
        <Select
          className="h-10"
          value={locationType}
          onChange={(e) =>
            setLocationType(e.target.value as "in_person" | "remote")
          }
        >
          <option value="in_person">In person</option>
          <option value="remote">Remote</option>
        </Select>
      </div>
      {locationType === "in_person" && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="rs-city">City</Label>
            <Input
              id="rs-city"
              className="h-10"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Bengaluru"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rs-addr">Area (optional)</Label>
            <Input
              id="rs-addr"
              className="h-10"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Indiranagar"
            />
          </div>
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="rs-note">Note (optional)</Label>
        <Textarea
          id="rs-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Any details for the tasker"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="rounded-full"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Sending…" : "Send request"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="rounded-full"
          onClick={onClose}
          disabled={mutation.isPending}
        >
          Cancel
        </Button>
        {mutation.isError && (
          <span className="text-xs text-red-600">
            {(mutation.error as Error).message}
          </span>
        )}
      </div>
    </div>
  );
}

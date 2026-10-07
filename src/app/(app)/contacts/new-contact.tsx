"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocationInput, SingleSelect } from "@/components/fields";
import { createContact } from "./actions";

export function NewContactButton({
  accounts,
  orgs,
}: {
  accounts: { id: string; name: string }[];
  orgs: { id: string; name: string; account_id: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [accountId, setAccountId] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [location, setLocation] = useState("");

  const orgOptions = orgs
    .filter((o) => !accountId || o.account_id === accountId)
    .map((o) => ({ value: o.id, label: o.name }));

  return (
    <Dialog open={open} onOpenChange={(o) => setOpen(o)}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="size-3.5" /> New contact
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New contact</DialogTitle>
          <DialogDescription>Everything else can be filled in on their profile.</DialogDescription>
        </DialogHeader>
        <form
          className="grid grid-cols-2 gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            start(async () => {
              const r = await createContact({
                first_name: String(form.get("first_name") ?? ""),
                last_name: String(form.get("last_name") ?? ""),
                title: String(form.get("title") ?? "") || null,
                email: String(form.get("email") ?? "") || null,
                account_id: accountId,
                org_id: orgId,
                location: location || null,
              });
              if (!r.ok || !r.data) {
                toast.error(r.ok ? "Created, but couldn't open the profile." : r.error);
                return;
              }
              setOpen(false);
              router.push(`/contacts/${r.data.id}`);
            });
          }}
        >
          <div className="space-y-1">
            <Label htmlFor="first_name">First name *</Label>
            <Input id="first_name" name="first_name" required autoFocus />
          </div>
          <div className="space-y-1">
            <Label htmlFor="last_name">Last name</Label>
            <Input id="last_name" name="last_name" />
          </div>
          <div className="col-span-2 space-y-1">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" placeholder="e.g. VP of Engineering" />
          </div>
          <div className="col-span-2 space-y-1">
            <Label>Account</Label>
            <SingleSelect
              options={accounts.map((a) => ({ value: a.id, label: a.name }))}
              value={accountId}
              placeholder="No account"
              onChange={(v) => {
                setAccountId(v);
                setOrgId(null);
              }}
              searchable
            />
          </div>
          {accountId && orgOptions.length > 0 && (
            <div className="col-span-2 space-y-1">
              <Label>Org</Label>
              <SingleSelect options={orgOptions} value={orgId} placeholder="No org" onChange={setOrgId} searchable />
            </div>
          )}
          <div className="col-span-2 space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="name@company.com" />
          </div>
          <div className="col-span-2 space-y-1">
            <Label>Location</Label>
            <LocationInput
              value={location || null}
              onSelect={(text) => setLocation(text)}
              placeholder="City, region or country"
            />
          </div>
          <DialogFooter className="col-span-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Creating…" : "Create contact"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

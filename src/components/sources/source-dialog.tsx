"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { Pencil, Plus } from "lucide-react";

import { createSourceAction, updateSourceAction, type SourceFormState } from "@/app/sources/actions";
import { SOURCE_TYPE_LABELS, SOURCE_TYPE_VALUES, type Source } from "@/lib/sources/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SourceDialogProps {
  /** Omit to render the "Add Source" trigger; pass a source to edit it. */
  source?: Source;
}

export function SourceDialog({ source }: SourceDialogProps) {
  const [open, setOpen] = useState(false);
  const isEditing = Boolean(source);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          isEditing ? (
            <Button variant="ghost" size="icon-sm" aria-label={`Edit ${source?.name}`} />
          ) : (
            <Button />
          )
        }
      >
        {isEditing ? (
          <Pencil />
        ) : (
          <>
            <Plus />
            Add Source
          </>
        )}
      </DialogTrigger>

      {/* Remounting on open resets form/error state each time the dialog opens. */}
      {open && <SourceForm source={source} onSaved={() => setOpen(false)} />}
    </Dialog>
  );
}

function SourceForm({ source, onSaved }: { source?: Source; onSaved: () => void }) {
  const isEditing = Boolean(source);
  const action = isEditing
    ? updateSourceAction.bind(null, String(source!._id))
    : createSourceAction;
  const [state, formAction, pending] = useActionState<SourceFormState, FormData>(action, {});

  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      onSaved();
    }
    wasPending.current = pending;
  }, [pending, state.error, onSaved]);

  return (
    <DialogContent>
      <form action={formAction} className="flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit source" : "Add source"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this feed's details."
              : "Register a new feed that aviation news can be pulled from."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="source-id">Source ID</Label>
            <Input
              id="source-id"
              name="id"
              defaultValue={source?.id}
              placeholder="faa-news"
              required
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="source-name">Name</Label>
            <Input
              id="source-name"
              name="name"
              defaultValue={source?.name}
              placeholder="FAA News"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="source-type">Type</Label>
              <Select name="type" defaultValue={source?.type ?? "rss"} required>
                <SelectTrigger id="source-type" className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_TYPE_VALUES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {SOURCE_TYPE_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="source-category">Category</Label>
              <Input
                id="source-category"
                name="category"
                defaultValue={source?.category}
                placeholder="Safety"
                required
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="source-url">URL</Label>
            <Input
              id="source-url"
              name="url"
              type="url"
              defaultValue={source?.url}
              placeholder="https://example.com/feed"
              required
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="source-active">Active</Label>
              <p className="text-xs text-muted-foreground">
                Inactive sources are excluded from ingestion.
              </p>
            </div>
            <Switch id="source-active" name="active" defaultChecked={source?.active ?? true} />
          </div>
        </div>

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}

        <DialogFooter>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : isEditing ? "Save changes" : "Add source"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

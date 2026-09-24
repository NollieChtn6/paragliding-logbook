"use client";

import { useState } from "react";
import { useT } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Filtre de dates propre à ce dialogue, sans effet sur l'affichage de
// /progression : la requête est construite ici et transmise telle quelle à
// la route d'export (#228), qui fait tout le travail via ses en-têtes de
// réponse — pas de fetch/blob côté client.
export function ExportCarnetDialog() {
  const [open, setOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const t = useT();
  const te = t.export;
  const ta = t.activities;

  const params = new URLSearchParams();
  if (dateFrom) params.set("from", dateFrom);
  if (dateTo) params.set("to", dateTo);
  const exportHref =
    params.size > 0 ? `/api/export/carnet?${params.toString()}` : "/api/export/carnet";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline">{te.exportButton}</Button>} />
      <DialogContent>
        <DialogCloseButton label={t.common.close} />
        <DialogHeader>
          <DialogTitle>{te.dialogTitle}</DialogTitle>
          <DialogDescription>{te.dialogDescription}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="export-date-from" className="text-xs text-muted-foreground">
              {ta.dateFromLabel}
            </Label>
            <Input
              id="export-date-from"
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="export-date-to" className="text-xs text-muted-foreground">
              {ta.dateToLabel}
            </Label>
            <Input
              id="export-date-to"
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </div>
        </div>

        {(dateFrom || dateTo) && (
          <p className="text-xs text-muted-foreground">{te.dateRangeHint}</p>
        )}

        <DialogFooter>
          <Button
            nativeButton={false}
            render={
              <a href={exportHref} onClick={() => setOpen(false)}>
                {te.confirmButton}
              </a>
            }
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

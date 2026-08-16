"use client";

import { useState } from "react";
import { Trash2, AlertTriangle, X } from "lucide-react";
import { tr, type Lang } from "@/lib/i18n";
import { deleteComplaintAction } from "@/app/(app)/citizen/complaints-actions";

export function DeleteComplaintButton({ id, lang }: { id: string; lang: Lang }) {
  const [open, setOpen] = useState(false);
  const t = (k: string) => tr(lang, k);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
      >
        <Trash2 className="h-3.5 w-3.5" /> {t("my.delete")}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border bg-background p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <p className="font-semibold">{t("my.deleteConfirm")}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-1 text-muted-foreground hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{t("my.deleteHint")}</p>
            <form action={deleteComplaintAction} className="mt-4 flex justify-end gap-2">
              <input type="hidden" name="id" value={id} />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border px-3 py-1.5 text-sm font-medium transition hover:bg-accent"
              >
                {t("my.deleteCancel")}
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4" /> {t("my.delete")}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
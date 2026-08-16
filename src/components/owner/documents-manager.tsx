"use client";

import { useRef, useState } from "react";
import { Upload, FileText, Loader2, Trash2, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";
import {
  uploadDocumentAction,
  addDocumentAction,
  deleteDocumentAction,
} from "@/app/(app)/owner/actions";
import { formatDate } from "@/lib/format";
import { tr, type Lang } from "@/lib/i18n";

const DOC_TYPE_KEYS: Record<string, string> = {
  license: "own.typeLicense",
  lab_certificate: "own.typeLab",
  health_certificate: "own.typeHealth",
};

interface DocRow {
  id: string;
  businessId: string;
  businessName: string;
  type: string;
  fileUrl: string;
  uploadedAt: Date | string;
  expiresAt: Date | string | null;
}

export function DocumentsManager({ documents, lang }: { documents: DocRow[]; lang: Lang }) {
  const t = (k: string, vars?: Record<string, string>) => tr(lang, k, vars);
  const [open, setOpen] = useState(false);
  const [businessId, setBusinessId] = useState("");
  const [type, setType] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const businesses = [...new Map(documents.map((d) => [d.businessId, d.businessName])).entries()];

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.set("file", file);
    const res = await uploadDocumentAction(fd);
    setUploading(false);
    if (res.ok && res.url) {
      setFileUrl(res.url!);
      toast.success(t("own.staged"));
    } else {
      toast.error(res.error ?? t("own.uploadFailed"));
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = () => {
    const fd = new FormData();
    fd.set("businessId", businessId);
    fd.set("type", type);
    fd.set("fileUrl", fileUrl);
    fd.set("expiresAt", expiresAt);
    addDocumentAction(fd);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t("own.docSub")}
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" /> {t("own.uploadDoc")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("own.uploadTitle")}</DialogTitle>
              <DialogDescription>
                {t("own.uploadDesc")}
              </DialogDescription>
            </DialogHeader>
            <form action={submit} className="space-y-4" onSubmit={() => setOpen(false)}>
              <div className="space-y-2">
                <Label>{t("own.business")}</Label>
                <Select value={businessId} onValueChange={setBusinessId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("own.selectBusiness")} />
                  </SelectTrigger>
                  <SelectContent>
                    {businesses.map(([id, name]) => (
                      <SelectItem key={id} value={id}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("own.docType")}</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("own.selectType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="license">{t("own.typeLicense")}</SelectItem>
                    <SelectItem value="lab_certificate">{t("own.typeLab")}</SelectItem>
                    <SelectItem value="health_certificate">{t("own.typeHealth")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("own.file")}</Label>
                <input ref={fileRef} type="file" className="hidden" onChange={onUpload} />
                <Button type="button" variant="outline" className="w-full" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  {fileUrl ? t("own.changeFile") : uploading ? t("own.uploading") : t("own.chooseFile")}
                </Button>
                {fileUrl && (
                  <p className="break-all font-mono text-xs text-muted-foreground">{fileUrl}</p>
                )}
              </div>
              <input type="hidden" name="fileUrl" value={fileUrl} />
              <div className="space-y-2">
                <Label htmlFor="expiresAt">{t("own.expiryOpt")}</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  name="expiresAt"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={!businessId || !type || !fileUrl}>
                  {t("own.saveDoc")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="flex h-48 flex-col items-center justify-center text-center">
            <FileText className="h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-medium">{t("own.noDocs")}</p>
            <p className="text-sm text-muted-foreground">{t("own.noDocsHint")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {documents.map((d) => {
            const expired = d.expiresAt && new Date(d.expiresAt) < new Date();
            return (
              <Card key={d.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium capitalize">{t(DOC_TYPE_KEYS[d.type] ?? d.type.replace(/_/g, " "))}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {d.businessName} · {t("own.uploaded", { date: formatDate(d.uploadedAt) })}
                        {d.expiresAt && (
                          <span className="flex items-center gap-1">
                            <CalendarClock className="h-3 w-3" /> {t("own.expires", { date: formatDate(d.expiresAt) })}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {expired ? (
                      <Badge className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-950 dark:text-red-300">
                        {t("own.expired")}
                      </Badge>
                    ) : d.expiresAt ? (
                      <Badge variant="outline" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {t("own.valid")}
                      </Badge>
                    ) : (
                      <Badge variant="outline">{t("own.onFile")}</Badge>
                    )}
                    <form action={deleteDocumentAction}>
                      <input type="hidden" name="id" value={d.id} />
                      <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Truck, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  addSupplierAction,
  updateSupplierAction,
  deleteSupplierAction,
} from "@/app/(app)/owner/suppliers-actions";
import { formatDate } from "@/lib/format";
import { tr, type Lang } from "@/lib/i18n";

const SUPPLIER_CATEGORIES = [
  "Water",
  "Vegetables",
  "Meat",
  "Dairy",
  "Seafood",
  "Grains",
  "Packaged Food",
  "Beverages",
  "Spices",
  "Other",
];

interface SupplierRow {
  id: string;
  businessId: string;
  businessName: string;
  name: string;
  category: string;
  products: string;
  location: string;
  licenceNumber: string | null;
  lastDeliveryAt: Date | string | null;
}

interface BusinessWithSuppliers {
  id: string;
  name: string;
  suppliers: SupplierRow[];
}

function toDateInputValue(d: Date | string | null): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function SuppliersManager({
  businesses,
  lang,
}: {
  businesses: BusinessWithSuppliers[];
  lang: Lang;
}) {
  const t = (k: string, vars?: Record<string, string>) => tr(lang, k, vars);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierRow | null>(null);
  const [businessId, setBusinessId] = useState(businesses[0]?.id ?? "");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [products, setProducts] = useState("");
  const [location, setLocation] = useState("");
  const [licenceNumber, setLicenceNumber] = useState("");
  const [lastDeliveryAt, setLastDeliveryAt] = useState("");

  const suppliers = businesses.flatMap((b) => b.suppliers);
  const multiple = businesses.length > 1;

  const openAdd = () => {
    setEditing(null);
    setBusinessId(businesses[0]?.id ?? "");
    setName("");
    setCategory("");
    setProducts("");
    setLocation("");
    setLicenceNumber("");
    setLastDeliveryAt("");
    setOpen(true);
  };

  const openEdit = (s: SupplierRow) => {
    setEditing(s);
    setBusinessId(s.businessId);
    setName(s.name);
    setCategory(s.category);
    setProducts(s.products);
    setLocation(s.location);
    setLicenceNumber(s.licenceNumber ?? "");
    setLastDeliveryAt(toDateInputValue(s.lastDeliveryAt));
    setOpen(true);
  };

  const submit = () => {
    const fd = new FormData();
    if (editing) fd.set("id", editing.id);
    fd.set("businessId", businessId);
    fd.set("name", name);
    fd.set("category", category);
    fd.set("products", products);
    fd.set("location", location);
    fd.set("licenceNumber", licenceNumber);
    fd.set("lastDeliveryAt", lastDeliveryAt);
    if (editing) updateSupplierAction(fd);
    else addSupplierAction(fd);
  };

  const onDelete = async (id: string) => {
    if (!confirm(t("supp.deleteConfirm"))) return;
    const fd = new FormData();
    fd.set("id", id);
    await deleteSupplierAction(fd);
  };

  if (businesses.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-48 flex-col items-center justify-center text-center">
          <Truck className="h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-medium">{t("own.noBusinesses")}</p>
          <p className="text-sm text-muted-foreground">{t("own.noBusinessesSub")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {t("supp.count", { n: String(suppliers.length) })}
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAdd}>
              <Plus className="mr-2 h-4 w-4" /> {t("supp.add")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? t("supp.editTitle") : t("supp.addTitle")}</DialogTitle>
              <DialogDescription>{t("supp.sub")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {multiple && (
                <div className="space-y-2">
                  <Label>{t("supp.business")}</Label>
                  <Select value={businessId} onValueChange={setBusinessId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("own.selectBusiness")} />
                    </SelectTrigger>
                    <SelectContent>
                      {businesses.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="supplier-name">{t("supp.name")}</Label>
                  <Input
                    id="supplier-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("supp.namePlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("supp.category")}</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("supp.selectCategory")} />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPLIER_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {tr(lang, `scat.${c}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier-products">{t("supp.products")}</Label>
                <Input
                  id="supplier-products"
                  value={products}
                  onChange={(e) => setProducts(e.target.value)}
                  placeholder={t("supp.productsPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier-location">{t("supp.location")}</Label>
                <Input
                  id="supplier-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t("supp.locationPlaceholder")}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="supplier-licence">{t("supp.licence")}</Label>
                  <Input
                    id="supplier-licence"
                    value={licenceNumber}
                    onChange={(e) => setLicenceNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier-last">{t("supp.lastDelivery")}</Label>
                  <Input
                    id="supplier-last"
                    type="date"
                    value={lastDeliveryAt}
                    onChange={(e) => setLastDeliveryAt(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {t("supp.cancel")}
              </Button>
              <Button
                type="button"
                onClick={submit}
                disabled={!name.trim() || !category || !products.trim() || !location.trim()}
              >
                {t("supp.save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {suppliers.length === 0 ? (
        <Card>
          <CardContent className="flex h-48 flex-col items-center justify-center text-center">
            <Truck className="h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-medium">{t("supp.empty")}</p>
            <p className="text-sm text-muted-foreground">{t("supp.emptyHint")}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4">{t("supp.name")}</TableHead>
                  <TableHead>{t("supp.category")}</TableHead>
                  <TableHead className="max-w-40">{t("supp.productsLbl")}</TableHead>
                  <TableHead className="max-w-44">{t("supp.location")}</TableHead>
                  <TableHead>{t("supp.licence")}</TableHead>
                  <TableHead>{t("supp.lastDelivery")}</TableHead>
                  <TableHead className="w-20 text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="px-4">
                      <p className="font-medium">{s.name}</p>
                      {multiple && (
                        <p className="text-xs text-muted-foreground">{s.businessName}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="whitespace-nowrap">
                        {tr(lang, `scat.${s.category}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-40 truncate text-muted-foreground">
                      {s.products}
                    </TableCell>
                    <TableCell className="max-w-44 truncate text-muted-foreground">
                      {s.location}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.licenceNumber ?? t("supp.licenceNone")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.lastDeliveryAt ? formatDate(s.lastDeliveryAt) : t("supp.deliveryNone")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(s)} title={t("supp.edit")}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground hover:text-red-600"
                          onClick={() => onDelete(s.id)}
                          title={t("supp.delete")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

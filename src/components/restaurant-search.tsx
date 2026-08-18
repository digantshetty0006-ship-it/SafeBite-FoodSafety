"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RestaurantSearch({ initial, placeholder, label }: { initial: string; placeholder: string; label: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const v = q.trim();
    router.replace(v ? `/restaurants?q=${encodeURIComponent(v)}` : "/restaurants");
  };

  return (
    <form onSubmit={submit} className="flex w-full max-w-md gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="pl-8"
        />
      </div>
      {q && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => {
            setQ("");
            router.replace("/restaurants");
          }}
          aria-label="clear"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      <Button type="submit">{label}</Button>
    </form>
  );
}
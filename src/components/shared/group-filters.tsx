"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { getGroupFormOptions } from "@/actions/student/groups";
import type { GroupFilters } from "@/types/groups";
import type { GroupFormOptions } from "@/types/groups";

interface Props {
  onSearch: (filters: GroupFilters) => void;
  onClose: () => void;
}

export default function GroupFilters({ onSearch, onClose }: Props) {
  const [opts, setOpts] = useState<GroupFormOptions | null>(null);
  const [filters, setFilters] = useState<GroupFilters>({});

  useEffect(() => {
    getGroupFormOptions().then(setOpts).catch(() => {});
  }, []);

  function clean(v: string | null): string | undefined {
    return !v || v === "_" ? undefined : v;
  }

  const filteredChapters = opts?.chapters.filter(
    (c) => !filters.systemId || c.systemId === filters.systemId
  );

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-medium text-sm">فلترة المجموعات</p>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Input
          placeholder="ابحث بالاسم..."
          value={filters.search ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value || undefined }))}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Select value={filters.systemId ?? "_"} onValueChange={(v) => setFilters((f) => ({ ...f, systemId: clean(v), chapterId: undefined }))}>
            <SelectTrigger><SelectValue placeholder="النظام" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_">الكل</SelectItem>
              {opts?.systems.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filters.chapterId ?? "_"} onValueChange={(v) => setFilters((f) => ({ ...f, chapterId: clean(v) }))} disabled={!filters.systemId}>
            <SelectTrigger><SelectValue placeholder="الفصل" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_">الكل</SelectItem>
              {filteredChapters?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filters.visibility ?? "_"} onValueChange={(v) => setFilters((f) => ({ ...f, visibility: clean(v) }))}>
            <SelectTrigger><SelectValue placeholder="الظهور" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_">الكل</SelectItem>
              <SelectItem value="PUBLIC">عام</SelectItem>
              <SelectItem value="PRIVATE">خاص</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.locationId ?? "_"} onValueChange={(v) => setFilters((f) => ({ ...f, locationId: clean(v) }))}>
            <SelectTrigger><SelectValue placeholder="المكان" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_">الكل</SelectItem>
              {opts?.locations.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Button className="w-full" onClick={() => onSearch(filters)}>
          بحث
        </Button>
      </CardContent>
    </Card>
  );
}
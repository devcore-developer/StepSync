"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Separator } from "@/components/ui/separator";
import PartnerCard from "@/components/shared/partner-card";
import {
  getPartnerFilterOptions,
  searchPartnerMatches,
  getSmartPartnerMatches,
} from "@/actions/student/partners";
import {
  STUDY_TIMES,
  STUDY_TIME_LABELS,
  USMLE_STAGE_LABELS,
  GENDER_LABELS,
  FILTER_REMOVAL_ORDER,
} from "@/lib/constants/matching";
import type {
  PartnerFilters,
  PartnerCandidate,
  PartnerFilterOptions,
} from "@/types/partner";
import { Filter, Sparkles, SlidersHorizontal, X } from "lucide-react";

function cleanValue(v: string | null): string | undefined {
  return !v || v === "_" ? undefined : v;
}

export default function PartnersPage() {
  const [options, setOptions] = useState<PartnerFilterOptions | null>(null);
  const [filters, setFilters] = useState<PartnerFilters>({});
  const [candidates, setCandidates] = useState<PartnerCandidate[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    getPartnerFilterOptions()
      .then(setOptions)
      .catch(() => toast.error("فشل تحميل خيارات الفلترة"));
  }, []);

  const handleSearch = useCallback(async (searchFilters: PartnerFilters) => {
    setLoading(true);
    setSearched(true);
    try {
      const result = await searchPartnerMatches(searchFilters);
      setCandidates(result.candidates);
      setAppliedFilters(result.appliedFilters);
    } catch {
      toast.error("فشل البحث");
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSmartMatch = async () => {
    setLoading(true);
    setSearched(true);
    setFilters({});
    setAppliedFilters([]);
    try {
      const result = await getSmartPartnerMatches();
      setCandidates(result.candidates);
    } catch {
      toast.error("فشل العثور على تطابقات");
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBroaden = () => {
    const newFilters = { ...filters };
    for (const key of FILTER_REMOVAL_ORDER) {
      if (newFilters[key as keyof PartnerFilters]) {
        delete newFilters[key as keyof PartnerFilters];
        setFilters(newFilters);
        handleSearch(newFilters);
        return;
      }
    }
  };

  const clearFilters = () => {
    setFilters({});
    setCandidates([]);
    setSearched(false);
    setAppliedFilters([]);
  };

  const filteredChapters = options?.chapters.filter(
    (c) => !filters.systemId || c.systemId === filters.systemId
  );

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">اعثر على شريك دراستك</h1>
        <p className="text-muted-foreground mt-1">
          اعثر على طالب طب يدرس بنفس وتيرتك ويسعى لنفس الهدف.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => handleSearch(filters)} disabled={loading}>
          <Filter className="h-4 w-4 ml-2" />
          بحث بالفلتر
        </Button>
        <Button
          variant="outline"
          onClick={handleSmartMatch}
          disabled={loading}
        >
          <Sparkles className="h-4 w-4 ml-2" />
          مطابقة ذكية
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-4 w-4 ml-1" />
          الفلاتر
        </Button>
      </div>

      <div className={`${showFilters ? "block" : "hidden"} md:block`}>
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* السنة الدراسية */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  السنة الدراسية
                </label>
                <Select
                  value={filters.academicYear ?? "_"}
                  onValueChange={(v) =>
                    setFilters((f) => ({
                      ...f,
                      academicYear: cleanValue(v),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="الكل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_">الكل</SelectItem>
                    {options?.academicYears.map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* الجنس */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  الجنس
                </label>
                <Select
                  value={filters.gender ?? "_"}
                  onValueChange={(v) =>
                    setFilters((f) => ({
                      ...f,
                      gender: cleanValue(v),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="الكل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_">الكل</SelectItem>
                    {Object.entries(GENDER_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* مرحلة USMLE */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  مرحلة USMLE
                </label>
                <Select
                  value={filters.usmleStage ?? "_"}
                  onValueChange={(v) =>
                    setFilters((f) => ({
                      ...f,
                      usmleStage: cleanValue(v),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="الكل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_">الكل</SelectItem>
                    {Object.entries(USMLE_STAGE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* النظام */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  النظام
                </label>
                <Select
                  value={filters.systemId ?? "_"}
                  onValueChange={(v) =>
                    setFilters((f) => ({
                      ...f,
                      systemId: cleanValue(v),
                      chapterId: undefined,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="الكل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_">الكل</SelectItem>
                    {options?.systems.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* الفصل */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  الفصل
                </label>
                <Select
                  value={filters.chapterId ?? "_"}
                  onValueChange={(v) =>
                    setFilters((f) => ({
                      ...f,
                      chapterId: cleanValue(v),
                    }))
                  }
                  disabled={!filters.systemId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نظاماً أولاً" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_">الكل</SelectItem>
                    {filteredChapters?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* وقت الدراسة */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  وقت الدراسة
                </label>
                <Select
                  value={filters.studyTime ?? "_"}
                  onValueChange={(v) =>
                    setFilters((f) => ({
                      ...f,
                      studyTime: cleanValue(v),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="الكل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_">الكل</SelectItem>
                    {STUDY_TIMES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {STUDY_TIME_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {appliedFilters.length} فلتر نشط
                </p>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-3 w-3 ml-1" />
                  مسح الكل
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {loading && (
        <div className="text-center py-12 text-muted-foreground">
          جارٍ البحث عن شركاء مناسبين...
        </div>
      )}

      {!loading && candidates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {candidates.map((c) => (
            <PartnerCard key={c.userId} candidate={c} />
          ))}
        </div>
      )}

      {!loading && searched && candidates.length === 0 && hasActiveFilters && (
        <Card>
          <CardContent className="flex flex-col items-center py-10 text-center">
            <p className="font-medium mb-1">لا توجد تطابقات دقيقة</p>
            <p className="text-sm text-muted-foreground mb-4">
              جرّب تخفيف أحد تفضيلاتك.
            </p>
            <Button variant="outline" onClick={handleBroaden}>
              توسيع نطاق البحث
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && searched && candidates.length === 0 && !hasActiveFilters && (
        <Card>
          <CardContent className="flex flex-col items-center py-10 text-center">
            <p className="font-medium mb-1">لا يوجد شركاء دراسة بعد</p>
            <p className="text-sm text-muted-foreground mb-4">
              جرّب توسيع تفضيلاتك أو تحقق لاحقاً مع انضمام المزيد من طلاب
              جامعة الإسكندرية لـ StepSync.
            </p>
            <Button variant="outline" onClick={handleSmartMatch}>
              <Sparkles className="h-4 w-4 ml-1" />
              مطابقة ذكية
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && !searched && (
        <Card>
          <CardContent className="flex flex-col items-center py-10 text-center">
            <p className="text-3xl mb-3">🤝</p>
            <p className="font-medium mb-1">ابدأ بالبحث</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              استخدم الفلاتر للعثور على شركاء يدوياً، أو اضغط &quot;مطابقة
              ذكية&quot; وندع النظام يجد لك الأنسب.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
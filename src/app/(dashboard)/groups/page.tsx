"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import StudyGroupCard from "@/components/shared/study-group-card";
import GroupFiltersComponent from "@/components/shared/group-filters";
import {
  discoverGroups,
  getRecommendedGroups,
} from "@/actions/student/groups";
import type { StudyGroupSummary } from "@/types/groups";
import { Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GroupsPage() {
  const [recommended, setRecommended] = useState<StudyGroupSummary[]>([]);
  const [groups, setGroups] = useState<StudyGroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    getRecommendedGroups()
      .then((d: any) => setRecommended(d))
      .catch(() => toast.error("فشل تحميل التوصيات"));
  }, []);

  async function handleSearch(filters: any) {
    setLoading(true);
    setShowFilters(false);
    try {
      const result = await discoverGroups(filters);
      setGroups(result);
    } catch {
      toast.error("فشل البحث");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">مجموعات الدراسة</h1>
          <p className="text-muted-foreground mt-1">انضم لمجموعة دراسية منظم</p>
        </div>
        <Link href="/groups/create">
          <Button>
            <Plus className="h-4 w-4 ml-2" />إنشاء مجموعة
          </Button>
        </Link>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          فلاتر
        </Button>
      </div>

      {showFilters && (
        <GroupFiltersComponent
          onSearch={handleSearch}
          onClose={() => setShowFilters(false)}
        />
      )}

      {!loading && recommended.length > 0 && (
        <section>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> مقترحة لك
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommended.map((g) => (
              <StudyGroupCard key={g.id} group={g} showMatch />
            ))}
          </div>
        </section>
      )}

      {loading && (
        <p className="text-center py-16 text-muted-foreground">جارٍ البحث...</p>
      )}

      {!loading && !showFilters && recommended.length === 0 && (
        <div className="text-center py-16">
          <p className="text-3xl mb-3">👥</p>
          <p className="font-medium">لا توجد مجموعات بعد</p>
          <p className="text-sm text-muted-foreground">
            كن أول من ينشئ مجموعة دراسية!
          </p>
          <Link href="/groups/create">
            <Button variant="outline">إنشاء مجموعة</Button>
          </Link>
        </div>
      )}

      {!loading && !showFilters && groups.length === 0 && (
        <div className="text-center py-16">
          <p className="text-3xl mb-3">🔍</p>
          <p className="font-medium">لا توجد نتائج مطابق</p>
          <p className="text-sm text-muted-foreground">
            جرّب تغيير الفلاتر أو تصفح المجموعات الأخرى
          </p>
          <Link href="/groups">
            <Button variant="outline">تصفح المجموعات</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
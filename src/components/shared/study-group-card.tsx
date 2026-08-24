"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { StudyGroupSummary } from "@/types/groups";

interface Props {
  group: StudyGroupSummary;
  showMatch?: boolean;
}

export default function StudyGroupCard({ group, showMatch }: Props) {
  return (
    <Link href={`/groups/${group.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate">{group.name}</h3>
              {group.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {group.description}
                </p>
              )}
            </div>
            <Badge variant={group.visibility === "PUBLIC" ? "secondary" : "outline"} className="shrink-0 text-[10px]">
              {group.visibility === "PUBLIC" ? "عام" : "خاص"}
            </Badge>
          </div>

          {(group.currentSystem || group.currentChapter) && (
            <p className="text-xs text-muted-foreground">
              {group.currentSystem?.name}
              {group.currentChapter ? ` → ${group.currentChapter.name}` : ""}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{group.memberCount} عضو{group.maxMembers ? ` / ${group.maxMembers}` : ""}</span>
            {group.studyLocation && <span>📍 {group.studyLocation.name}</span>}
          </div>

          {showMatch && group.matchScore !== undefined && (
            <div className="pt-1 border-t">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">{group.matchScore}% تطابق</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-1">
                <div
                  className={`rounded-full h-1 transition-all ${group.matchScore >= 70 ? "bg-primary" : "bg-muted-foreground"}`}
                  style={{ width: `${group.matchScore}%` }}
                />
              </div>
              {group.matchReasons && group.matchReasons.length > 0 && (
                <div className="mt-1.5 space-y-0.5">
                  {group.matchReasons.map((r, i) => (
                    <p key={i} className="text-[10px] text-muted-foreground">✓ {r}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
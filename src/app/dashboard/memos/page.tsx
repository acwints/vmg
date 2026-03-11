"use client";

import { SectionHeader } from "@/components/shared/section-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemos } from "@/hooks/use-api";

export default function MemosPage() {
  const { memos, loading, error } = useMemos();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-destructive">Failed to load memos: {error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full space-y-8 animate-fade-in">
      <SectionHeader
        title="IC Memos"
        description="Investment committee memos and decision logs"
        action={
          <Button size="sm" disabled>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New Memo
          </Button>
        }
      />

      {memos.length > 0 ? (
        <div className="space-y-3">
          {memos.map((memo) => (
            <Card key={memo.id} className="glass-card glass-card-hover cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-secondary p-2 mt-0.5">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        {memo.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">{memo.author}</span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(memo.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                      {memo.companies.length > 0 && (
                        <div className="flex gap-1.5 mt-2">
                          {memo.companies.map((c) => (
                            <Badge key={c.id} variant="secondary" className="text-[10px]">
                              {c.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant={memo.status === "final" ? "active" : "secondary"}>
                    {memo.status === "final" ? "Final" : "Draft"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="glass-card">
          <CardContent className="p-6">
            <EmptyState
              icon={FileText}
              title="No memos yet"
              description="Investment committee memos will appear here once created."
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

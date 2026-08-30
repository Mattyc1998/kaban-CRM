"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { CallQueueLead } from "@prisma/client";
import {
  Phone,
  Upload,
  Download,
  Check,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  X,
  Star,
  Globe,
  MapPin,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { importCallQueueLeads, markCalled, rescheduleCallQueueLead } from "@/lib/actions/call-queue";

// ---- Pure query/presentation helpers, mirroring the original spec ----

function dateStr(d: Date | string) {
  return new Date(d).toISOString().split("T")[0];
}

function websiteHref(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function getQueuedLeads(allLeads: CallQueueLead[]) {
  const today = dateStr(new Date());
  return allLeads.filter((lead) => lead.status === "ACTIVE" && dateStr(lead.nextCallDate) <= today);
}

type MarkedLead = CallQueueLead & { isOverdue: boolean };

function groupAndSort(queuedLeads: CallQueueLead[]): { day: number; leads: MarkedLead[] }[] {
  const today = dateStr(new Date());
  const marked: MarkedLead[] = queuedLeads.map((lead) => ({
    ...lead,
    isOverdue: dateStr(lead.nextCallDate) < today,
  }));

  const groups: Record<number, MarkedLead[]> = {};
  marked.forEach((lead) => {
    const key = lead.sequenceDay;
    if (!groups[key]) groups[key] = [];
    groups[key].push(lead);
  });

  Object.keys(groups).forEach((key) => {
    groups[Number(key)].sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return dateStr(a.nextCallDate).localeCompare(dateStr(b.nextCallDate));
    });
  });

  return Object.keys(groups)
    .map(Number)
    .sort((a, b) => a - b)
    .map((day) => ({ day, leads: groups[day] }));
}

// ---- Client-side CSV parsing (no libraries) ----

// Google Maps / Places-style scraper export. business_name is the only
// column that's actually required (it's the lead name) — every other
// recognized column is mapped opportunistically if present, and anything
// else in the sheet (extra scraper columns like has_website) is just
// ignored rather than rejected, since real exports vary in exactly which
// columns they include.
const REQUIRED_HEADERS = ["business_name"];

const DONE_VALUES = new Set(["true", "yes", "y", "1", "done", "complete", "completed"]);

function stripBom(text: string) {
  // Excel's "CSV UTF-8" export (the common Windows path) prepends a BOM
  // (char code 0xFEFF), which otherwise corrupts the first header and
  // silently breaks every row.
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function parseHeaders(text: string): string[] {
  const firstLine = stripBom(text).trim().split(/\r?\n/)[0] ?? "";
  return firstLine.split(",").map((h) => h.trim().toLowerCase());
}

function parseCSV(text: string): Record<string, string>[] {
  const cleaned = stripBom(text);
  const lines = cleaned.trim().split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = values[i] || ""));
    return obj;
  });
}

function toImportRow(raw: Record<string, string>) {
  return {
    leadName: raw.business_name,
    phone: raw.phone || undefined,
    email: raw.email || undefined,
    placeId: raw.place_id || undefined,
    address: raw.address || undefined,
    website: raw.website || undefined,
    rating: raw.rating || undefined,
    reviews: raw.reviews || undefined,
    sequenceDay: "1",
    nextCallDate: dateStr(new Date()),
    // A "done" column (if present) marks a business as already handled —
    // anything else defaults to a fresh active lead due today.
    status: DONE_VALUES.has((raw.done || "").trim().toLowerCase()) ? "complete" : "active",
  };
}

const DAY_TABS = [1, 3, 5, 7] as const;

export function CallQueuePageClient({ initialLeads }: { initialLeads: CallQueueLead[] }) {
  const [dayFilter, setDayFilter] = useState<number | "all">("all");
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [pending, startTransition] = useTransition();
  const [pulse, setPulse] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const queued = getQueuedLeads(initialLeads);
  const grouped = groupAndSort(queued);
  const dueCount = queued.length;

  const prevCount = useRef(dueCount);
  useEffect(() => {
    if (prevCount.current !== dueCount) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 300);
      prevCount.current = dueCount;
      return () => clearTimeout(t);
    }
  }, [dueCount]);

  const dayCounts: Record<number, number> = {};
  grouped.forEach((g) => (dayCounts[g.day] = g.leads.length));

  const visibleGroups = dayFilter === "all" ? grouped : grouped.filter((g) => g.day === dayFilter);

  function handleMarkCalled(id: string) {
    setRemovingIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      startTransition(async () => {
        await markCalled({ id });
        router.refresh();
      });
    }, 300);
  }

  function openReschedule(id: string, current: Date) {
    setRescheduleId(id);
    setRescheduleDate(dateStr(current));
  }

  function confirmReschedule() {
    if (!rescheduleId || !rescheduleDate) return;
    startTransition(async () => {
      await rescheduleCallQueueLead({ id: rescheduleId, nextCallDate: rescheduleDate });
      setRescheduleId(null);
      toast.success("Rescheduled");
      router.refresh();
    });
  }

  function handleFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result);
      const headers = parseHeaders(text);
      const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));

      if (missing.length > 0) {
        toast.error(`CSV is missing required column${missing.length === 1 ? "" : "s"}: ${missing.join(", ")}`);
        return;
      }

      setCsvRows(parseCSV(text));
    };
    reader.readAsText(file);
  }

  function handleImport() {
    startTransition(async () => {
      const allRows = csvRows.map(toImportRow);
      const rows = allRows.filter((r) => r.leadName && r.leadName.trim());
      const skipped = allRows.length - rows.length;

      if (rows.length === 0) {
        toast.error('No valid rows found — check the CSV has a "business_name" column with values');
        return;
      }

      try {
        const { imported } = await importCallQueueLeads(rows);
        toast.success(
          skipped > 0
            ? `Imported ${imported} leads (skipped ${skipped} with no lead name)`
            : `Imported ${imported} leads`
        );
        setCsvRows([]);
        setUploadOpen(false);
        if (fileRef.current) fileRef.current.value = "";
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Import failed — check the CSV format");
      }
    });
  }

  function dueLabel(lead: MarkedLead) {
    const today = dateStr(new Date());
    const due = dateStr(lead.nextCallDate);
    if (due === today) return "Today";
    if (lead.isOverdue) {
      const days = Math.round((new Date(today).getTime() - new Date(due).getTime()) / 86400000);
      return `${days} day${days === 1 ? "" : "s"} overdue`;
    }
    return new Date(lead.nextCallDate).toLocaleDateString();
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Top bar */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Phone className="size-5 text-primary" />
          Call Queue
        </h1>
        <Badge
          className={cn(
            "h-7 gap-1 bg-primary/20 px-3 text-sm font-semibold text-primary transition-transform",
            pulse && "scale-125"
          )}
          variant="outline"
        >
          {dueCount} due
        </Badge>
      </div>

      {/* Day filter tabs */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        <button
          onClick={() => setDayFilter("all")}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            dayFilter === "all"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border/60 text-muted-foreground hover:text-foreground"
          )}
        >
          All ({dueCount})
        </button>
        {DAY_TABS.map((d) => (
          <button
            key={d}
            onClick={() => setDayFilter(d)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              dayFilter === d
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border/60 text-muted-foreground hover:text-foreground"
            )}
          >
            Day {d} ({dayCounts[d] ?? 0})
          </button>
        ))}
      </div>

      {/* CSV upload (collapsible) */}
      <Card className="mb-4">
        <button
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
          onClick={() => setUploadOpen((v) => !v)}
        >
          <span className="flex items-center gap-2">
            <Upload className="size-4 text-primary" />
            Upload Leads CSV
          </span>
          {uploadOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
        {uploadOpen && (
          <CardContent className="space-y-3 border-t border-border/60 pt-3">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFile(e.dataTransfer.files?.[0]);
              }}
              onClick={() => fileRef.current?.click()}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 border-dashed p-6 text-center text-sm text-muted-foreground transition-colors",
                dragOver ? "border-primary bg-primary/5" : "border-border/60"
              )}
            >
              <Upload className="size-5" />
              Drag &amp; drop a CSV, or click to browse
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>

            {csvRows.length > 0 && (
              <div className="space-y-2">
                <div className="overflow-x-auto rounded-lg border border-border/60">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/30">
                        <th className="px-2 py-1.5 text-left font-medium">Business</th>
                        <th className="px-2 py-1.5 text-left font-medium">Address</th>
                        <th className="px-2 py-1.5 text-left font-medium">Phone</th>
                        <th className="px-2 py-1.5 text-left font-medium">Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvRows.slice(0, 3).map((r, i) => (
                        <tr key={i} className="border-b border-border/60 last:border-0">
                          <td className="px-2 py-1.5">{r.business_name}</td>
                          <td className="truncate px-2 py-1.5 text-muted-foreground">{r.address}</td>
                          <td className="px-2 py-1.5">{r.phone}</td>
                          <td className="px-2 py-1.5">
                            {r.rating}
                            {r.reviews && ` (${r.reviews})`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button size="sm" disabled={pending} onClick={handleImport}>
                  Import {csvRows.length} leads
                </Button>
              </div>
            )}

            <a
              href="/sample_leads.csv"
              download
              className="flex w-fit items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              <Download className="size-3.5" />
              Download sample CSV
            </a>
          </CardContent>
        )}
      </Card>

      {/* Queue */}
      {dueCount === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <CheckCircle2 className="size-10 text-emerald-400" />
            <p className="text-base font-semibold">You&apos;re caught up</p>
            <p className="text-sm text-muted-foreground">
              No calls due today. Check back tomorrow or upload new leads.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {visibleGroups.map((group) => (
            <div key={group.day}>
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span className="h-px flex-1 bg-border/60" />
                Day {group.day}
                <span className="text-primary">{group.leads.length} leads</span>
                <span className="h-px flex-1 bg-border/60" />
              </p>
              <div className="space-y-2">
                {group.leads.map((lead) => (
                  <Card
                    key={lead.id}
                    className={cn(
                      "gap-0 py-3 transition-all duration-300 ease-in-out",
                      lead.isOverdue && "border-l-4 border-l-rose-500 bg-rose-500/[0.08]",
                      removingIds.has(lead.id) && "-translate-x-full opacity-0"
                    )}
                  >
                    <CardContent className="px-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-sm font-semibold">{lead.leadName}</p>
                            {lead.isOverdue && (
                              <Badge className="h-4 border-rose-500/30 bg-rose-500/15 px-1.5 text-[9px] text-rose-400">
                                OVERDUE
                              </Badge>
                            )}
                          </div>
                          {lead.company && (
                            <p className="truncate text-xs text-muted-foreground">{lead.company}</p>
                          )}
                          {lead.address && (
                            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                              <MapPin className="size-3 shrink-0" />
                              {lead.address}
                            </p>
                          )}
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs">
                            {lead.phone && (
                              <a href={`tel:${lead.phone}`} className="text-primary hover:underline">
                                {lead.phone}
                              </a>
                            )}
                            {lead.website && (
                              <a
                                href={websiteHref(lead.website)}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 text-primary hover:underline"
                              >
                                <Globe className="size-3" />
                                Website
                              </a>
                            )}
                            {lead.rating != null && (
                              <span className="flex items-center gap-1 text-amber-400">
                                <Star className="size-3 fill-current" />
                                {lead.rating}
                                {lead.reviews != null && ` (${lead.reviews})`}
                              </span>
                            )}
                            <span className={lead.isOverdue ? "font-medium text-rose-400" : "text-muted-foreground"}>
                              {dueLabel(lead)}
                            </span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <Button
                            size="xs"
                            className="bg-emerald-500 text-white hover:bg-emerald-500/90"
                            onClick={() => handleMarkCalled(lead.id)}
                          >
                            <Check className="size-3" />
                            Called
                          </Button>
                          <Button
                            size="xs"
                            variant="secondary"
                            onClick={() => openReschedule(lead.id, lead.nextCallDate)}
                          >
                            <CalendarClock className="size-3" />
                            Reschedule
                          </Button>
                        </div>
                      </div>

                      {rescheduleId === lead.id && (
                        <div className="mt-2 flex items-center gap-2 border-t border-border/60 pt-2">
                          <Input
                            type="date"
                            value={rescheduleDate}
                            onChange={(e) => setRescheduleDate(e.target.value)}
                            className="h-8 flex-1"
                          />
                          <Button size="xs" disabled={pending} onClick={confirmReschedule}>
                            Confirm
                          </Button>
                          <Button size="icon-sm" variant="ghost" onClick={() => setRescheduleId(null)}>
                            <X className="size-3.5" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Star, ChevronDown, Loader2, RefreshCw } from "lucide-react";
import { applicationService } from "@/services/application.service";
import { aiService, type CandidateResult, type BestResult } from "@/services/ai.service";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import type { ApplicationWithRelations } from "@repo/shared";

type CardState = "waiting" | "analyzing" | "done";

interface AnalysisEntry {
  matchPercent: number;
  strengths: string[];
  weaknesses: string[];
  summary: string;
}

function MatchPill({ percent }: { percent: number }) {
  const color =
    percent >= 70
      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
      : percent >= 40
        ? "bg-amber-50 text-amber-700 border border-amber-200"
        : "bg-red-50 text-red-700 border border-red-200";
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-0.5 text-sm font-semibold animate-fade-in ${color}`}
    >
      {percent}%
    </span>
  );
}

function CandidateCard({
  app,
  state,
  analysis,
  isBest,
  index,
}: {
  app: ApplicationWithRelations;
  state: CardState;
  analysis: AnalysisEntry | null;
  isBest: boolean;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const fullName = String(app.formData?.full_name ?? `Application #${app.id}`);

  return (
    <Card
      className={`overflow-hidden transition-[box-shadow,border-color] duration-500 ${isBest ? "ring-2 ring-amber-400" : ""}`}
      style={{
        opacity: 0,
        animation: "fade-in-up 0.4s ease forwards",
        animationDelay: `${index * 70}ms`,
      }}
    >
      {/* Card header */}
      <button
        type="button"
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-[var(--color-surface-subtle)] transition-colors duration-150"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">{fullName}</span>
            {isBest && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 border border-amber-300 px-2 py-0.5 text-xs font-medium animate-fade-in">
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                Best Match
              </span>
            )}
            {app.currentStage && (
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                style={{ backgroundColor: `${app.currentStage.color}1A`, color: app.currentStage.color }}
              >
                {app.currentStage.name}
              </span>
            )}
            <span className="text-xs text-[var(--color-text-muted)]">Applied {formatDate(app.createdAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {state === "done" && analysis ? (
            <MatchPill percent={analysis.matchPercent} />
          ) : state === "analyzing" ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] animate-pulse">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Analyzing...
            </span>
          ) : (
            <span className="text-xs text-[var(--color-text-muted)]">Waiting...</span>
          )}
          <ChevronDown
            className={`h-4 w-4 text-[var(--color-text-muted)] transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* Animated accordion body */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div ref={bodyRef} className="min-h-0 overflow-hidden">
          <div className="border-t border-[var(--color-border)] px-5 py-4">
            {state === "waiting" && (
              <p className="text-sm text-[var(--color-text-muted)]">Waiting for analysis to begin...</p>
            )}

            {state === "analyzing" && (
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            )}

            {state === "done" && analysis && (
              <div className="space-y-4 animate-fade-in-up">
                <p className="text-sm text-[var(--color-text-primary)]">{analysis.summary}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.strengths.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 mb-2">Strengths</p>
                      <ul className="space-y-1">
                        {analysis.strengths.map((s, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-1.5 text-sm text-[var(--color-text-primary)] animate-fade-in-up"
                            style={{ animationDelay: `${i * 40}ms`, opacity: 0 }}
                          >
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.weaknesses.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-red-600 mb-2">Weaknesses</p>
                      <ul className="space-y-1">
                        {analysis.weaknesses.map((w, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-1.5 text-sm text-[var(--color-text-primary)] animate-fade-in-up"
                            style={{ animationDelay: `${i * 40}ms`, opacity: 0 }}
                          >
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function ComparePage() {
  const searchParams = useSearchParams();
  const idsParam = searchParams.get("ids") ?? "";
  const ids = idsParam
    .split(",")
    .map(Number)
    .filter((n) => !isNaN(n) && n > 0);

  const [analysisMap, setAnalysisMap] = useState<Record<number, AnalysisEntry>>({});
  const [cardStates, setCardStates] = useState<Record<number, CardState>>(() =>
    Object.fromEntries(ids.map((id) => [id, "waiting" as CardState])),
  );
  const [best, setBest] = useState<BestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [displayIds, setDisplayIds] = useState<number[]>(ids);
  const [reordering, setReordering] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const startedRef = useRef(false);
  const matchPercentRef = useRef<Record<number, number>>({});

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: () => applicationService.list(),
  });

  const selectedApps = applications.filter((a) => ids.includes(a.id));
  const orderedApps = ids
    .map((id) => selectedApps.find((a) => a.id === id))
    .filter(Boolean) as ApplicationWithRelations[];

  const roleName = orderedApps[0]?.role.name;
  const roleColor = orderedApps[0]?.role.color;

  useEffect(() => {
    if (startedRef.current || ids.length < 2 || isLoading || orderedApps.length === 0) return;
    startedRef.current = true;

    const forceRefresh = refreshKey > 0;
    const controller = new AbortController();

    setIsRunning(true);
    setCardStates(Object.fromEntries(ids.map((id) => [id, "waiting" as CardState])));
    setCardStates((prev) => ({ ...prev, [ids[0]]: "analyzing" }));
    matchPercentRef.current = {};

    let currentIndex = 0;

    aiService
      .compareApplications(
        ids,
        (item) => {
          if (item.type === "candidate") {
            const result = item as CandidateResult;
            matchPercentRef.current[result.applicationId] = result.matchPercent;
            setAnalysisMap((prev) => ({
              ...prev,
              [result.applicationId]: {
                matchPercent: result.matchPercent,
                strengths: result.strengths,
                weaknesses: result.weaknesses,
                summary: result.summary,
              },
            }));
            setCardStates((prev) => ({ ...prev, [result.applicationId]: "done" }));

            currentIndex++;
            if (currentIndex < ids.length) {
              setCardStates((prev) => ({ ...prev, [ids[currentIndex]]: "analyzing" }));
            }
          } else if (item.type === "best") {
            setBest(item as BestResult);
            const sorted = [...ids].sort(
              (a, b) => (matchPercentRef.current[b] ?? 0) - (matchPercentRef.current[a] ?? 0),
            );
            setReordering(true);
            setTimeout(() => {
              setDisplayIds(sorted);
              setReordering(false);
            }, 350);
          }
        },
        controller.signal,
        forceRefresh,
      )
      .catch((err: Error) => {
        if (err.name !== "AbortError") {
          setError(err.message ?? "Analysis failed");
        }
      })
      .finally(() => setIsRunning(false));

    return () => {
      controller.abort();
      startedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, refreshKey]);

  function handleReanalyze() {
    startedRef.current = false;
    setAnalysisMap({});
    setBest(null);
    setError(null);
    setDisplayIds(ids);
    setRefreshKey((k) => k + 1);
  }

  if (ids.length < 2) {
    return (
      <div className="space-y-5">
        <Link
          href="/dashboard/applications"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Applications
        </Link>
        <p className="text-sm text-[var(--color-text-muted)]">Please select at least 2 applications to compare.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/applications"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Applications
        </Link>
        {roleName && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
            style={{ backgroundColor: `${roleColor}1A`, color: roleColor }}
          >
            <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: roleColor }} />
            {roleName}
          </span>
        )}
        <button
          type="button"
          onClick={handleReanalyze}
          disabled={isRunning}
          className="ml-auto inline-flex items-center gap-1.5 rounded-[var(--radius)] border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRunning ? "animate-spin" : ""}`} />
          Re-analyze
        </button>
      </div>

      <div>
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Comparing {ids.length} candidate{ids.length === 1 ? "" : "s"}
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
          AI is evaluating each candidate individually against the role requirements.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 animate-fade-in">
          {error}
        </div>
      )}

      {/* Best match banner */}
      {best && (
        <div
          className="rounded-lg border border-amber-300 bg-amber-50 px-5 py-4 flex items-start gap-3 animate-fade-in-up"
        >
          <Star className="h-5 w-5 text-amber-500 fill-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Best overall:{" "}
              {String(
                orderedApps.find((a) => a.id === best.applicationId)?.formData?.full_name ??
                  `Application #${best.applicationId}`,
              )}
            </p>
            <p className="text-sm text-amber-700 mt-0.5">{best.reason}</p>
          </div>
        </div>
      )}

      {/* Candidate cards */}
      <div className={`space-y-3 transition-opacity duration-300 ${reordering ? "opacity-0" : "opacity-100"}`}>
        {isLoading
          ? ids.map((id) => <Skeleton key={id} className="h-16 w-full" />)
          : displayIds.map((id, index) => {
              const app = orderedApps.find((a) => a.id === id);
              if (!app) return null;
              return (
                <CandidateCard
                  key={app.id}
                  app={app}
                  state={cardStates[app.id] ?? "waiting"}
                  analysis={analysisMap[app.id] ?? null}
                  isBest={best?.applicationId === app.id}
                  index={index}
                />
              );
            })}
      </div>
    </div>
  );
}

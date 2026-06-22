import { useMemo, useState } from "react";
import { AlertTriangle, ExternalLink, ImageIcon, Loader2 } from "lucide-react";

export interface OrthancSeries {
  orthanc_series_id: string;
  series_instance_uid: string;
  modality: string;
  description: string;
  series_number: string;
  instance_count: number;
  preview_instance_id: string | null;
  instance_ids: string[];
}

export interface OrthancStudy {
  orthanc_study_id: string;
  study_id: string;
  study_instance_uid: string;
  accession_number: string;
  study_description: string;
  study_date: string;
  patient_id: string;
  patient_name: string;
  series: OrthancSeries[];
}

interface Props {
  studyQuery: string;
  study: OrthancStudy | null;
  loading: boolean;
  error: string | null;
  apiBase: string;
  orthancBase: string;
}

/** Stone Web Viewer deep-link (uses DICOM UIDs, not Orthanc internal IDs). */
export function orthancViewerUrl(
  orthancBase: string,
  studyInstanceUid: string,
  seriesInstanceUid?: string,
) {
  const base = orthancBase.replace(/\/$/, "");
  const params = new URLSearchParams({ study: studyInstanceUid });
  if (seriesInstanceUid) {
    params.set("series", seriesInstanceUid);
  }
  return `${base}/stone-webviewer/index.html?${params.toString()}`;
}

/** Orthanc Explorer 2 study page (uses Orthanc internal UUID). */
export function orthancExplorerUrl(orthancBase: string, orthancStudyId: string) {
  const base = orthancBase.replace(/\/$/, "");
  return `${base}/ui/app/#/studies/${encodeURIComponent(orthancStudyId)}`;
}

export default function DicomViewer({
  studyQuery,
  study,
  loading,
  error,
  apiBase,
  orthancBase,
}: Props) {
  if (loading) {
    return (
      <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading study from Orthanc…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-400/20 bg-amber-500/[0.04] p-3 text-sm text-amber-200/90">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
        <div>
          <div>{error}</div>
          <div className="mt-1 text-xs text-amber-200/60">
            Looked up <code className="font-mono">{studyQuery}</code> against
            Orthanc StudyID / AccessionNumber / PatientID.
          </div>
        </div>
      </div>
    );
  }

  if (!study) return null;

  if (study.series.length === 0) {
    return (
      <p className="mt-2 text-sm text-slate-500">
        Study found ({study.study_id}), but it contains no series.
      </p>
    );
  }

  return (
    <div className="mt-3 space-y-4">
      <StudyHeader study={study} orthancBase={orthancBase} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {study.series.map((s) => (
          <SeriesCard
            key={s.orthanc_series_id}
            series={s}
            apiBase={apiBase}
            orthancBase={orthancBase}
            studyInstanceUid={study.study_instance_uid}
          />
        ))}
      </div>
    </div>
  );
}

function StudyHeader({
  study,
  orthancBase,
}: {
  study: OrthancStudy;
  orthancBase: string;
}) {
  const date = useMemo(() => formatDate(study.study_date), [study.study_date]);
  const primarySeries = study.series[0];
  const viewerUrl =
    study.study_instance_uid &&
    orthancViewerUrl(
      orthancBase,
      study.study_instance_uid,
      study.series.length === 1
        ? primarySeries?.series_instance_uid
        : undefined,
    );
  const explorerUrl = orthancExplorerUrl(orthancBase, study.orthanc_study_id);

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="text-sm font-semibold text-white">
              {study.study_description || "Untitled study"}
            </span>
            <span className="text-xs text-slate-400">
              StudyID{" "}
              <span className="text-slate-200">{study.study_id || "—"}</span>
            </span>
            {study.accession_number && (
              <span className="text-xs text-slate-500">
                Accession{" "}
                <span className="font-mono text-slate-300">
                  {study.accession_number}
                </span>
              </span>
            )}
            {date && <span className="text-xs text-slate-500">{date}</span>}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Patient {study.patient_name || "—"}
            {study.patient_id && (
              <>
                {" · "}
                <span className="font-mono">{study.patient_id}</span>
              </>
            )}
            {" · "}
            {study.series.length} series ·{" "}
            {study.series.reduce((acc, s) => acc + s.instance_count, 0)}{" "}
            instances
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {viewerUrl ? (
            <a
              href={viewerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={viewerButtonClass}
            >
              <span>Open in Orthanc Viewer</span>
              <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.25} />
            </a>
          ) : (
            <span className="text-xs text-amber-300/80">
              StudyInstanceUID missing — cannot open viewer
            </span>
          )}
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={secondaryButtonClass}
          >
            <span>Orthanc Explorer</span>
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.25} />
          </a>
        </div>
      </div>
    </div>
  );
}

function SeriesCard({
  series,
  apiBase,
  orthancBase,
  studyInstanceUid,
}: {
  series: OrthancSeries;
  apiBase: string;
  orthancBase: string;
  studyInstanceUid: string;
}) {
  const [previewFailed, setPreviewFailed] = useState(false);
  const previewUrl = series.preview_instance_id
    ? `${apiBase}/api/dicom/preview/${series.preview_instance_id}`
    : null;
  const seriesViewerUrl =
    studyInstanceUid && series.series_instance_uid
      ? orthancViewerUrl(
          orthancBase,
          studyInstanceUid,
          series.series_instance_uid,
        )
      : null;

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="truncate text-xs font-semibold uppercase tracking-wider text-slate-300">
          {series.description || `Series ${series.series_number || "?"}`}
        </p>
        <span className="shrink-0 rounded-md bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent-hover ring-1 ring-inset ring-accent/20">
          {series.modality || "?"}
        </span>
      </div>
      <div className="relative flex h-44 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/60">
        {previewUrl && !previewFailed ? (
          <img
            src={previewUrl}
            alt={series.description || series.orthanc_series_id}
            loading="lazy"
            className="h-full w-full object-contain"
            onError={() => setPreviewFailed(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-slate-500">
            <ImageIcon className="h-6 w-6" />
            <span className="text-[11px]">
              {previewFailed ? "Preview failed" : "No preview"}
            </span>
          </div>
        )}
      </div>
      <p className="mt-2 flex items-center justify-between gap-2 text-[11px] text-slate-500">
        <span>
          {series.instance_count} instance
          {series.instance_count === 1 ? "" : "s"}
          {" · "}
          <span className="font-mono">
            {series.orthanc_series_id.slice(0, 8)}…
          </span>
        </span>
        {seriesViewerUrl && (
          <a
            href={seriesViewerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-hover hover:text-white transition-colors"
          >
            View series →
          </a>
        )}
      </p>
    </div>
  );
}

function formatDate(yyyymmdd: string): string {
  if (!/^\d{8}$/.test(yyyymmdd)) return "";
  const y = yyyymmdd.slice(0, 4);
  const m = yyyymmdd.slice(4, 6);
  const d = yyyymmdd.slice(6, 8);
  return `${y}-${m}-${d}`;
}

const viewerButtonClass = [
  "inline-flex items-center gap-2 rounded-xl px-3 py-2",
  "text-xs font-medium text-white",
  "bg-accent hover:bg-accent-hover",
  "shadow-[0_8px_24px_-8px_rgba(124,108,255,0.6)]",
  "transition-colors duration-150",
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring",
].join(" ");

const secondaryButtonClass = [
  "inline-flex items-center gap-2 rounded-xl px-3 py-2",
  "text-xs font-medium text-slate-200",
  "bg-white/[0.04] border border-white/10 hover:bg-white/[0.08]",
  "transition-colors duration-150",
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring",
].join(" ");

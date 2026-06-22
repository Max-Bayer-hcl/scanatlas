import { FileText } from "lucide-react";

export interface Result {
  study_id: string;
  source_dir?: string;
  filename: string;
  snippet: string;
}

interface Props {
  results: Result[];
  query: string;
  loading: boolean;
  onSelectStudy: (studyId: string, sourceDir?: string) => void;
  selectedStudyId?: string | null;
}

export default function SearchResults({
  results,
  query,
  loading,
  onSelectStudy,
  selectedStudyId,
}: Props) {
  if (!query) return null;

  if (loading) {
    return (
      <p className="mt-10 text-center text-sm text-slate-500">Searching…</p>
    );
  }

  if (results.length === 0) {
    return (
      <p className="mt-10 text-center text-sm text-slate-500">
        No results for <span className="text-slate-300">“{query}”</span>.
      </p>
    );
  }

  return (
    <div className="mt-10">
      <p className="mb-4 text-xs uppercase tracking-wider text-slate-500">
        {results.length} {results.length === 1 ? "result" : "results"} for{" "}
        <span className="text-slate-300 normal-case">“{query}”</span>
      </p>
      <ul className="space-y-3">
        {results.map((r, i) => {
          const isSelected = selectedStudyId === r.study_id;
          return (
            <li
              key={`${r.study_id}-${r.filename}-${i}`}
              onClick={() => onSelectStudy(r.study_id, r.source_dir)}
              className={[
                "group cursor-pointer rounded-xl p-4 transition-colors",
                "bg-white/[0.02] border",
                isSelected
                  ? "border-accent/50 bg-accent/[0.06]"
                  : "border-white/5 hover:border-white/10 hover:bg-white/[0.04]",
              ].join(" ")}
            >
              <div className="flex items-baseline justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={[
                      "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
                      "bg-accent/10 text-accent-hover ring-1 ring-inset ring-accent/20",
                    ].join(" ")}
                  >
                    {r.study_id}
                  </span>
                  <span className="truncate text-sm text-slate-300 inline-flex items-center gap-1.5 min-w-0">
                    <FileText className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{r.filename}</span>
                  </span>
                </div>
                {r.source_dir && r.source_dir !== r.study_id && (
                  <span className="shrink-0 text-[11px] text-slate-500">
                    {r.source_dir}
                  </span>
                )}
              </div>
              <p
                className="mt-2 text-sm leading-relaxed text-slate-400 line-clamp-3"
                dangerouslySetInnerHTML={{ __html: r.snippet }}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

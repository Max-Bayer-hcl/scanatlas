import { useCallback, useState } from "react";
import { Atom, History, Users } from "lucide-react";
import SearchBox from "./components/SearchBox";
import SearchResults, { type Result } from "./components/SearchResults";
import DicomViewer, { type OrthancStudy } from "./components/DicomViewer";

const API = "http://127.0.0.1:8000";
const ORTHANC = "http://127.0.0.1:8042";

export default function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudy, setSelectedStudy] = useState<string | null>(null);
  const [study, setStudy] = useState<OrthancStudy | null>(null);
  const [studyError, setStudyError] = useState<string | null>(null);
  const [studyLoading, setStudyLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const runSearch = useCallback(async (q: string) => {
    if (!q) {
      setQuery("");
      setResults([]);
      setHasSearched(false);
      setSelectedStudy(null);
      setStudy(null);
      setStudyError(null);
      return;
    }
    setQuery(q);
    setHasSearched(true);
    setLoading(true);
    setSelectedStudy(null);
    setStudy(null);
    setStudyError(null);
    try {
      const res = await fetch(`${API}/api/search?q=${encodeURIComponent(q)}`);
      const data: Result[] = await res.json();
      setResults(data);
    } catch (err) {
      console.error("search failed", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectStudy = useCallback(
    async (studyId: string, sourceDir?: string) => {
      setSelectedStudy(studyId);
      setStudy(null);
      setStudyError(null);
      setStudyLoading(true);
      try {
        const url = new URL(
          `${API}/api/study/${encodeURIComponent(studyId)}/dicoms`,
        );
        if (sourceDir && sourceDir !== studyId) {
          url.searchParams.set("alt", sourceDir);
        }
        const res = await fetch(url.toString());
        if (res.status === 404) {
          setStudyError("No matching study in Orthanc for this identifier.");
          return;
        }
        if (res.status === 503) {
          setStudyError("Orthanc is unreachable. Start it via scripts/start_orthanc.sh.");
          return;
        }
        if (!res.ok) {
          setStudyError(`Unexpected error (${res.status})`);
          return;
        }
        setStudy((await res.json()) as OrthancStudy);
      } catch (err) {
        console.error("dicom list failed", err);
        setStudyError("Failed to fetch study from backend.");
      } finally {
        setStudyLoading(false);
      }
    },
    [],
  );

  const heroCondensed = hasSearched;

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg-base">
      <div
        aria-hidden
        className={[
          "pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
          "h-[820px] w-[820px] bg-radial-glow",
          "transition-all duration-700 ease-out",
          heroCondensed ? "opacity-50" : "opacity-100",
        ].join(" ")}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background:radial-gradient(120%_80%_at_50%_0%,transparent_40%,rgba(0,0,0,0.55)_100%)]"
      />

      <main className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center px-6">
        <section
          className={[
            "flex w-full flex-col items-center text-center",
            "transition-all duration-500 ease-out",
            heroCondensed ? "pt-16 pb-8" : "pt-[24vh] pb-12",
          ].join(" ")}
        >
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Study Atlas
          </h1>
          <p className="mt-3 max-w-md text-sm text-slate-400">
            Access clinical studies, patient histories, and
            imaging records securely.
          </p>

          <div className="mt-8 w-full flex justify-center">
            <SearchBox onSearch={runSearch} loading={loading} />
          </div>

          {!heroCondensed && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <Chip
                icon={<Atom className="h-3.5 w-3.5" />}
                label="Neurology"
                onClick={() => runSearch("Neurology")}
              />
              <Chip
                icon={<Users className="h-3.5 w-3.5" />}
                label="Oncology"
                onClick={() => runSearch("Oncology")}
              />
              <Chip
                icon={<History className="h-3.5 w-3.5" />}
                label="Recent queries"
                onClick={() => runSearch("MRI")}
              />
            </div>
          )}
        </section>

        <section className="w-full pb-24">
          <SearchResults
            results={results}
            query={query}
            loading={loading}
            onSelectStudy={handleSelectStudy}
            selectedStudyId={selectedStudy}
          />

          {selectedStudy && (
            <div className="mt-8">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                DICOM — {selectedStudy}
              </h2>
              <DicomViewer
                studyQuery={selectedStudy}
                study={study}
                loading={studyLoading}
                error={studyError}
                apiBase={API}
                orthancBase={ORTHANC}
              />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Chip({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5",
        "text-xs text-slate-300",
        "bg-bg-chip border border-white/5 backdrop-blur-xl",
        "hover:text-white hover:border-white/10 hover:bg-white/[0.05]",
        "transition-colors duration-150",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring",
      ].join(" ")}
    >
      <span className="text-slate-400">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

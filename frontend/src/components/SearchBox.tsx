import { useState, type FormEvent } from "react";
import { ArrowRight, Search } from "lucide-react";

interface Props {
  onSearch: (query: string) => void;
  loading?: boolean;
}

export default function SearchBox({ onSearch, loading = false }: Props) {
  const [query, setQuery] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    onSearch(query.trim());
  }

  return (
    <form
      onSubmit={submit}
      className="relative w-full max-w-2xl group"
    >
      <div
        className={[
          "flex items-center gap-2 rounded-2xl pl-5 pr-2 py-2",
          "bg-bg-input border border-white/5 backdrop-blur-xl",
          "shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6)]",
          "transition-colors duration-200",
          "focus-within:border-accent/40 focus-within:shadow-[0_0_0_4px_rgba(124,108,255,0.12)]",
        ].join(" ")}
      >
        <Search className="h-5 w-5 text-slate-400 shrink-0" strokeWidth={2} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by keyword, study ID, or finding..."
          className="flex-1 bg-transparent border-0 outline-none text-[15px] text-slate-100 placeholder:text-slate-500 py-2"
          autoFocus
        />
        <button
          type="submit"
          disabled={loading}
          className={[
            "inline-flex items-center gap-2 rounded-xl px-4 py-2",
            "text-sm font-medium text-white",
            "bg-accent hover:bg-accent-hover",
            "shadow-[0_8px_24px_-8px_rgba(124,108,255,0.6)]",
            "transition-colors duration-150",
            "disabled:opacity-60 disabled:cursor-not-allowed",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring",
          ].join(" ")}
        >
          <span>{loading ? "Searching" : "Search"}</span>
          <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
        </button>
      </div>
    </form>
  );
}

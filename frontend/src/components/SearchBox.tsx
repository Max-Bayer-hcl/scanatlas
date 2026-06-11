import { useState } from "react";

interface Props {
  onSearch: (query: string) => void;
}

export default function SearchBox({ onSearch }: Props) {
  const [query, setQuery] = useState("");

  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(query);
      }}
    >
      <input
        className="flex-1 border rounded px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        type="text"
        placeholder="Enter keyword to search study documents…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button
        type="submit"
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 text-sm"
      >
        Search
      </button>
    </form>
  );
}

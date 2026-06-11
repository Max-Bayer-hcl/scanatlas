import { useState } from "react";
import SearchBox from "./components/SearchBox";
import SearchResults from "./components/SearchResults";
import DicomViewer from "./components/DicomViewer";

const API = "http://localhost:8000";

export default function App() {
  const [results, setResults] = useState<any[]>([]);
  const [selectedStudy, setSelectedStudy] = useState<string | null>(null);
  const [dicoms, setDicoms] = useState<any[]>([]);

  async function handleSearch(query: string) {
    const res = await fetch(`${API}/api/search?q=${encodeURIComponent(query)}`);
    setResults(await res.json());
    setSelectedStudy(null);
    setDicoms([]);
  }

  async function handleSelectStudy(studyId: string) {
    setSelectedStudy(studyId);
    const res = await fetch(`${API}/api/study/${studyId}/dicoms`);
    setDicoms(await res.json());
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Study Document Search
        </h1>
        <SearchBox onSearch={handleSearch} />
        <SearchResults results={results} onSelectStudy={handleSelectStudy} />
        {selectedStudy && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              DICOM Images — {selectedStudy}
            </h2>
            <DicomViewer studyId={selectedStudy} subjects={dicoms} />
          </div>
        )}
      </div>
    </div>
  );
}

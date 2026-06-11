interface Result {
  study_id: string;
  filename: string;
  snippet: string;
}

interface Props {
  results: Result[];
  onSelectStudy: (studyId: string) => void;
}

export default function SearchResults({ results, onSelectStudy }: Props) {
  if (results.length === 0)
    return <p className="text-gray-400 mt-8 text-center">No results.</p>;

  return (
    <ul className="mt-6 space-y-3">
      {results.map((r, i) => (
        <li
          key={i}
          className="border rounded p-4 hover:bg-blue-50 cursor-pointer"
          onClick={() => onSelectStudy(r.study_id)}
        >
          <p className="font-semibold text-blue-700">{r.study_id}</p>
          <p className="text-xs text-gray-400 mb-1">{r.filename}</p>
          <p
            className="text-sm text-gray-600"
            dangerouslySetInnerHTML={{ __html: r.snippet }}
          />
        </li>
      ))}
    </ul>
  );
}

// TODO (Stage 2): Integrate Cornerstone.js to render DICOM files
// npm install cornerstone-core cornerstone-wado-image-loader dicomParser

interface Subject {
  subject: string;
  files: string[];
}

interface Props {
  studyId: string;
  subjects: Subject[];
}

export default function DicomViewer({ studyId, subjects }: Props) {
  if (subjects.length === 0)
    return <p className="text-gray-400">No DICOM data found for {studyId}.</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      {subjects.map((s) => (
        <div key={s.subject} className="border rounded p-3">
          <p className="text-xs font-semibold text-gray-500 mb-2">
            {s.subject}
          </p>
          {/* Cornerstone canvas will be mounted here in Stage 2 */}
          <div className="bg-black h-48 flex items-center justify-center text-gray-500 text-xs">
            {s.files[0]
              ? `DICOM: /api/dicom/${studyId}/${s.subject}/${s.files[0]}`
              : "No .dcm files"}
          </div>
        </div>
      ))}
    </div>
  );
}

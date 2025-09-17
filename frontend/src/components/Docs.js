export default function Docs({ docs, setSelDoc }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Your Documents</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {docs.map((d) => (
          <div key={d.id} className="bg-white rounded-xl shadow p-4 hover:shadow-xl transition">
            <h3 className="font-bold">{d.filename}</h3>
            <p className="text-sm text-gray-500">{new Date(d.upload_time).toLocaleString()}</p>
            <p className="text-sm text-gray-600">Pages: {d.metadata?.pages || "-"}</p>
            <button onClick={() => setSelDoc(d)} className="mt-2 text-purple-700 underline text-sm">Select for chat</button>
          </div>
        ))}
      </div>
    </div>
  );
}
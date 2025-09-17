import { useEffect, useState } from "react";
import axios from "axios";

export default function Chat({ docs, selDoc }) {
  const [q, setQ] = useState("");
  const [hist, setHist] = useState([]);
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    if (!q.trim()) return;
    setLoading(true);
    const token = localStorage.getItem("token");
    const { data } = await axios.post(
      `${process.env.REACT_APP_API}/chat`,
      { question: q, doc_id: selDoc?.id || null },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setHist((h) => [...h, { role: "user", msg: q }, { role: "assistant", msg: data.reply }]);
    setQ("");
    setLoading(false);
  };

  useEffect(() => { setHist([]); }, [selDoc]);

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-semibold mb-2">Chat {selDoc && `– ${selDoc.filename}`}</h2>
      <div className="flex-1 overflow-auto bg-white rounded-xl shadow p-4 space-y-3">
        {hist.map((m, i) => (
          <div key={i} className={`${m.role==="user"?"text-right":""}`}>
            <span className={`inline-block px-3 py-2 rounded-lg text-sm ${m.role==="user"?"bg-purple-600 text-white":"bg-gray-200 text-gray-800"}`}>
              {m.msg}
            </span>
          </div>
        ))}
        {loading && <span className="text-gray-500 text-sm">Thinking…</span>}
      </div>
      <div className="mt-4 flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)}
               onKeyDown={(e) => e.key==="Enter" && ask()}
               className="flex-1 px-4 py-2 rounded-lg border" placeholder="Ask something…" />
        <button onClick={ask} className="bg-purple-600 text-white px-4 py-2 rounded-lg">Send</button>
      </div>
    </div>
  );
}
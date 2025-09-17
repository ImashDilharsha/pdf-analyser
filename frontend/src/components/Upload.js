import { useRef, useState } from "react";
import axios from "axios";

export default function Upload({ onOk }) {
  const [loading, setLoading] = useState(false);
  const inp = useRef();

  const upload = async () => {
    const file = inp.current.files[0];
    if (!file) return;
    setLoading(true);
    const token = localStorage.getItem("token");
    const fd = new FormData();
    fd.append("pdf", file);
    await axios.post(`${process.env.REACT_APP_API}/upload`, fd, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type":"multipart/form-data" },
    });
    setLoading(false);
    onOk();   // refresh list
    inp.current.value = "";
    alert("Uploaded ✅");
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Upload PDF</h2>
      <input ref={inp} type="file" accept=".pdf" className="mb-2" />
      <br />
      <button onClick={upload} disabled={loading}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg disabled:opacity-50">
        {loading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
}
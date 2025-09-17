import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Docs from "../components/Docs";
import Upload from "../components/Upload";
import Chat from "../components/Chat";

export default function Dashboard({ logout }) {
  const [section, setSection] = useState("Documents");
  const [docs, setDocs] = useState([]);
  const [selDoc, setSelDoc] = useState(null);

  useEffect(() => { if (section==="Documents") fetchDocs(); }, [section]);

  const fetchDocs = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${process.env.REACT_APP_API}/docs`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setDocs(data);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar section={section} setSection={setSection} logout={logout} />
      <div className="flex-1 overflow-auto p-6">
        {section === "Documents" && <Docs docs={docs} setSelDoc={setSelDoc} />}
        {section === "Upload Area" && <Upload onOk={fetchDocs} />}
        {section === "Chat" && <Chat docs={docs} selDoc={selDoc} />}
      </div>
    </div>
  );
}
export default function Sidebar({ section, setSection, logout }) {
  const items = ["Documents", "Upload Area", "Chat"];
  return (
    <nav className="w-64 bg-white shadow-lg">
      <div className="p-4 text-xl font-bold text-purple-700">PDF-AnalyseR</div>
      <ul className="p-2 space-y-2">
        {items.map((i) => (
          <li key={i} onClick={() => setSection(i)}
              className={`px-4 py-2 rounded-lg cursor-pointer transition ${section===i?"bg-purple-100 text-purple-700":""} hover:bg-purple-50`}>
            {i}
          </li>
        ))}
      </ul>
      <div className="absolute bottom-4 left-4">
        <button onClick={logout} className="text-sm text-gray-600 underline">Logout</button>
      </div>
    </nav>
  );
}
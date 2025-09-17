import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { useState } from "react";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const saveToken = (t) => { localStorage.setItem("token", t); setToken(t); };
  const logout = () => { localStorage.removeItem("token"); setToken(null); };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={token ? <Dashboard logout={logout}/> : <Navigate to="/login"/>}/>
        <Route path="/login" element={token ? <Navigate to="/"/> : <Login saveToken={saveToken}/>}/>
      </Routes>
    </BrowserRouter>
  );
}
export default App;
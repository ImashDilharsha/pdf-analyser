import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API = process.env.REACT_APP_API;

export default function Login({ saveToken }) {
  const nav = useNavigate();
  const [isReg, setReg] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", confirmPassword: "" });

  const submit = async (e) => {
    e.preventDefault();
    const url = isReg ? `${API}/register` : `${API}/login`;
    const payload = isReg
      ? { username: form.username, password: form.password, confirmPassword: form.confirmPassword }
      : { username: form.username, password: form.password };
    try {
      const { data } = await axios.post(url, payload);
      if (!isReg && data.token) { saveToken(data.token); nav("/"); }
      else { alert("Registered! Please login."); setReg(false); }
    } catch (err) { alert(err.response?.data?.msg || "Error"); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
      <form onSubmit={submit} className="glass rounded-2xl p-8 w-full max-w-md space-y-4">
        <h2 className="text-white text-2xl font-bold">{isReg ? "Create account" : "Login"}</h2>
        <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
               className="w-full px-4 py-2 rounded-lg outline-none" placeholder="Username" required />
        <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
               className="w-full px-4 py-2 rounded-lg outline-none" placeholder="Password" required />
        {isReg && (
          <input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                 className="w-full px-4 py-2 rounded-lg outline-none" placeholder="Confirm password" required />
        )}
        <button className="w-full bg-white text-purple-700 font-semibold py-2 rounded-lg hover:scale-105 transition">
          {isReg ? "Register" : "Login"}
        </button>
        <p className="text-white text-sm text-center cursor-pointer" onClick={() => setReg((v) => !v)}>
          {isReg ? "Already have an account? Login" : "New user? Register"}
        </p>
      </form>
    </div>
  );
}
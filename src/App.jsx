import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Login from "./frontend/pages/Login";
import Register from "./frontend/pages/Register";
import Dashboard from "./frontend/pages/Dashboard";

function App() {
  const isAuthenticated = localStorage.getItem("email"); // Cek apakah pengguna sudah login

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/sign-in"} />} />
        <Route path="/sign-in" element={<Login />} />
        <Route path="/sign-up" element={<Register />} />
        <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/sign-in" />} />
      </Routes>
    </Router>
  );
}

export default App;

import { useState } from "react";
import SignIn from "./components/SignIn";
import SignUp from "./components/SignUp";
import Dashboard from "./components/Dashboard";
import "./styles/index.css";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [authMode, setAuthMode] = useState("signin");

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
  };

  if (!token) {
    return authMode === "signin" ? (
      <SignIn onAuthSuccess={setToken} onSwitchToSignUp={() => setAuthMode("signup")} />
    ) : (
      <SignUp onAuthSuccess={setToken} onSwitchToSignIn={() => setAuthMode("signin")} />
    );
  }

  return <Dashboard token={token} onLogout={handleLogout} />;
}

export default App;
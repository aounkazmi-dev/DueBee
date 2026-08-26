import { useState } from "react";
import SignIn from "./components/SignIn";
import SignUp from "./components/SignUp";
import "./styles/index.css";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [authMode, setAuthMode] = useState("signin");

  if (!token) {
    return authMode === "signin" ? (
      <SignIn onAuthSuccess={setToken} onSwitchToSignUp={() => setAuthMode("signup")} />
    ) : (
      <SignUp onAuthSuccess={setToken} onSwitchToSignIn={() => setAuthMode("signin")} />
    );
  }

  return <h1 className="text-white text-center mt-20">Logged in — bills page comes next.</h1>;
}

export default App;
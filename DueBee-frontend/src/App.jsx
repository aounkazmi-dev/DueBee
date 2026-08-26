import { useState, useEffect } from "react";

const API_URL = "http://localhost:8001";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const [bills, setBills] = useState([]);
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(true);

  // ---- Auth ----

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");

    if (isSignup) {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const err = await res.json();
        setAuthError(err.detail || "Signup failed");
        return;
      }
      // After signup, log in immediately
    }

    const form = new URLSearchParams();
    form.append("username", email);
    form.append("password", password);

    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });

    if (!res.ok) {
      setAuthError("Incorrect email or password");
      return;
    }

    const data = await res.json();
    localStorage.setItem("token", data.access_token);
    setToken(data.access_token);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
    setBills([]);
  };

  // ---- Bills ----

  const fetchBills = async () => {
    setLoading(true);
    const res = await fetch(`${API_URL}/bills`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      handleLogout();
      return;
    }
    const data = await res.json();
    setBills(data);
    setLoading(false);
  };

    useEffect(() => {
      const fetchData = async () => {
        if (token) await fetchBills();
      };
      fetchData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]); 

  const handleAddBill = async (e) => {
    e.preventDefault();
    await fetch(`${API_URL}/bills`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        vendor,
        amount: parseFloat(amount),
        due_date: dueDate,
      }),
    });
    setVendor("");
    setAmount("");
    setDueDate("");
    fetchBills();
  };

  // ---- Render ----

  if (!token) {
    return (
      <div style={{ maxWidth: 380, margin: "60px auto", fontFamily: "sans-serif" }}>
        <h1>DueBee</h1>
        <h2>{isSignup ? "Sign up" : "Log in"}</h2>
        <form onSubmit={handleAuthSubmit}>
          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }}
          />
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }}
          />
          {authError && <p style={{ color: "red" }}>{authError}</p>}
          <button type="submit" style={{ padding: "8px 16px" }}>
            {isSignup ? "Sign up" : "Log in"}
          </button>
        </form>
        <p style={{ marginTop: 12 }}>
          {isSignup ? "Already have an account?" : "Need an account?"}{" "}
          <button onClick={() => setIsSignup(!isSignup)}>
            {isSignup ? "Log in" : "Sign up"}
          </button>
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 500, margin: "40px auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>DueBee</h1>
        <button onClick={handleLogout}>Log out</button>
      </div>

      <form onSubmit={handleAddBill} style={{ marginBottom: 30 }}>
        <input
          placeholder="Vendor (e.g. LESCO)"
          value={vendor}
          onChange={(e) => setVendor(e.target.value)}
          required
          style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }}
        />
        <input
          placeholder="Amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }}
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          required
          style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }}
        />
        <button type="submit" style={{ padding: "8px 16px" }}>
          Add Bill
        </button>
      </form>

      <h2>Your Bills</h2>
      {loading ? (
        <p>Loading...</p>
      ) : bills.length === 0 ? (
        <p>No bills yet — add one above.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {bills.map((bill) => (
            <li
              key={bill.id}
              style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginBottom: 8 }}
            >
              <strong>{bill.vendor}</strong> — Rs. {bill.amount}
              <br />
              <small>Due: {bill.due_date}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
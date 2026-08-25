import { useState, useEffect } from "react";

// Your backend URL — change this later when you deploy to Render
const API_URL = "http://localhost:8000";

function App() {
  const [bills, setBills] = useState([]);
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch all bills from the backend
  const fetchBills = async () => {
    try {
      const res = await fetch(`${API_URL}/bills`);
      const data = await res.json();
      setBills(data);
    } catch (err) {
      console.error("Failed to fetch bills:", err);
    } finally {
      setLoading(false);
    }
  };

  // Run once when the page loads
  useEffect(() => {
    let cancelled = false;

    async function loadBills() {
      try {
        const res = await fetch(`${API_URL}/bills`);
        const data = await res.json();
        if (!cancelled) setBills(data);
      } catch (err) {
        console.error("Failed to fetch bills:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadBills();

    return () => {
      cancelled = true;
    };
  }, []);

  // Handle the "add bill" form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    await fetch(`${API_URL}/bills`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vendor,
        amount: parseFloat(amount),
        due_date: dueDate,
      }),
    });

    // Clear the form and refresh the list
    setVendor("");
    setAmount("");
    setDueDate("");
    fetchBills();
  };

  return (
    <div style={{ maxWidth: 500, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>DueBee</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: 30 }}>
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
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: 12,
                marginBottom: 8,
              }}
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
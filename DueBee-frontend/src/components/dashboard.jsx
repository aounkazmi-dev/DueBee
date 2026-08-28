import { useState, useEffect } from "react";

const API_URL = "http://localhost:8001";

function Dashboard({ token, onLogout }) {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);

  const fetchBills = async () => {
    setLoading(true);
    const res = await fetch(`${API_URL}/bills`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      onLogout();
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
  }, []);

  const handleScan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    setScanning(true);
    setError("");
  
    try {
      const formData = new FormData();
      formData.append("file", file);
  
      const res = await fetch(`${API_URL}/bills/scan`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
  
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Could not read the bill image");
      }
  
      const data = await res.json();
  
      if (data.vendor) setVendor(data.vendor);
      if (data.amount) setAmount(data.amount);
      if (data.due_date) setDueDate(normalizeDate(data.due_date));
    } catch (err) {
      setError(err.message);
    } finally {
      setScanning(false);
      e.target.value = "";
    }
  };

  // OCR might return DD/MM/YYYY or "3 Sep 2026" — the <input type="date"> needs YYYY-MM-DD
  const normalizeDate = (raw) => {
    const isoMatch = raw.match(/\d{4}-\d{2}-\d{2}/);
    if (isoMatch) return isoMatch[0];

    const parsed = new Date(raw);
    if (!isNaN(parsed)) return parsed.toISOString().split("T")[0];

    return "";
  };

  const handleAddBill = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${API_URL}/bills`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ vendor, amount: parseFloat(amount), due_date: dueDate }),
      });
      if (!res.ok) throw new Error("Could not add bill");

      setVendor("");
      setAmount("");
      setDueDate("");
      fetchBills();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-full px-6 py-12 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="DueBee" className="h-8 w-auto" />
            <h1 className="text-xl font-bold text-white">DueBee</h1>
          </div>
          <button
            onClick={onLogout}
            className="text-sm font-semibold text-gray-400 hover:text-gray-200"
          >
            Log out
          </button>
        </div>

        <div className="mt-10">
          <label className="block text-sm/6 font-medium text-gray-100">
            Scan a bill photo
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleScan}
            disabled={scanning}
            className="mt-2 block w-full text-sm text-gray-400 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-500 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-indigo-400 disabled:opacity-60"
          />
          {scanning && <p className="mt-2 text-sm text-gray-500">Reading bill…</p>}
        </div>

        <form
          onSubmit={handleAddBill}
          className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end"
        >
          <div>
            <label className="block text-sm/6 font-medium text-gray-100">Vendor</label>
            <input
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              required
              placeholder="LESCO"
              className="mt-2 block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
            />
          </div>
          <div>
            <label className="block text-sm/6 font-medium text-gray-100">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="8450"
              className="mt-2 block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
            />
          </div>
          <div>
            <label className="block text-sm/6 font-medium text-gray-100">Due date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className="mt-2 block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
            />
          </div>
          <div className="sm:col-span-3">
            <button
              type="submit"
              className="rounded-md bg-indigo-500 px-4 py-1.5 text-sm/6 font-semibold text-white hover:bg-indigo-400"
            >
              Add Bill
            </button>
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          </div>
        </form>

        <h2 className="mt-12 text-sm font-semibold text-gray-400 uppercase tracking-wide">
          Your Bills
        </h2>

        {loading ? (
          <p className="mt-4 text-sm text-gray-500">Loading…</p>
        ) : bills.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No bills yet — add one above.</p>
        ) : (
          <ul className="mt-4 divide-y divide-white/10 rounded-md border border-white/10">
            {bills.map((bill) => (
              <li key={bill.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">{bill.vendor}</p>
                  <p className="text-xs text-gray-500">Due {bill.due_date}</p>
                </div>
                <p className="text-sm font-semibold text-gray-100">Rs. {bill.amount}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
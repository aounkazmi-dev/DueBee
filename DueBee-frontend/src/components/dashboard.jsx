import { useState, useEffect } from "react";

const API_URL = "http://localhost:8001";

const CATEGORIES = ["Electricity", "Gas", "Water", "Internet", "Other"];
const STATUSES = ["unpaid", "paid", "overdue"];

function daysUntil(dueDate) {
  const diff = new Date(dueDate) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function Dashboard({ token, onLogout }) {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [billingMonth, setBillingMonth] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [status, setStatus] = useState("unpaid");
  const [consumption, setConsumption] = useState("");

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
    const loadBills = async () => {
      await fetchBills();
    };
  
    loadBills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        body: JSON.stringify({
          vendor,
          amount: parseFloat(amount),
          due_date: dueDate,
          billing_month: billingMonth,
          category,
          status,
          consumption: consumption ? parseFloat(consumption) : null,
        }),
      });
      if (!res.ok) throw new Error("Could not add bill");

      setVendor("");
      setAmount("");
      setDueDate("");
      setBillingMonth("");
      setCategory(CATEGORIES[0]);
      setStatus("unpaid");
      setConsumption("");
      setShowForm(false);
      fetchBills();
    } catch (err) {
      setError(err.message);
    }
  };

  const upcoming = [...bills]
    .filter((b) => b.status !== "paid")
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  return (
    <div className="min-h-full px-6 py-12 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
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

        <div className="mt-10 rounded-xl border border-white/10 divide-y divide-white/10">
          {/* Upcoming Bills */}
          <section className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                Upcoming Bills
              </h2>
              <button
                onClick={() => setShowForm(!showForm)}
                className="text-sm font-semibold text-indigo-400 hover:text-indigo-300"
              >
                {showForm ? "Cancel" : "+ Add bill"}
              </button>
            </div>

            {showForm && (
              <form onSubmit={handleAddBill} className="mt-4 grid grid-cols-2 gap-3">
                <input
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  required
                  placeholder="Vendor (e.g. LESCO)"
                  className="col-span-2 rounded-md bg-white/5 px-3 py-1.5 text-sm text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:outline-indigo-500"
                />
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  placeholder="Amount"
                  className="rounded-md bg-white/5 px-3 py-1.5 text-sm text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:outline-indigo-500"
                />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="rounded-md bg-white/5 px-3 py-1.5 text-sm text-white outline-1 -outline-offset-1 outline-white/10 focus:outline-2 focus:outline-indigo-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-gray-900">
                      {c}
                    </option>
                  ))}
                </select>
                <label className="text-xs text-gray-400 col-span-2 -mb-2">Due date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  className="rounded-md bg-white/5 px-3 py-1.5 text-sm text-white outline-1 -outline-offset-1 outline-white/10 focus:outline-2 focus:outline-indigo-500"
                />
                <label className="text-xs text-gray-400 -mb-2">Billing month (which month this bill is for)</label>
                <input
                  type="month"
                  value={billingMonth}
                  onChange={(e) => setBillingMonth(e.target.value + "")}
                  required
                  className="rounded-md bg-white/5 px-3 py-1.5 text-sm text-white outline-1 -outline-offset-1 outline-white/10 focus:outline-2 focus:outline-indigo-500"
                />
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="rounded-md bg-white/5 px-3 py-1.5 text-sm text-white outline-1 -outline-offset-1 outline-white/10 focus:outline-2 focus:outline-indigo-500"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s} className="bg-gray-900">
                      {s}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={consumption}
                  onChange={(e) => setConsumption(e.target.value)}
                  placeholder="Units consumed (optional)"
                  className="rounded-md bg-white/5 px-3 py-1.5 text-sm text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:outline-indigo-500"
                />
                <button
                  type="submit"
                  className="col-span-2 mt-1 rounded-md bg-indigo-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-400"
                >
                  Save Bill
                </button>
                {error && <p className="col-span-2 text-sm text-red-400">{error}</p>}
              </form>
            )}

            <div className="mt-4">
              {loading ? (
                <p className="text-sm text-gray-500">Loading…</p>
              ) : upcoming.length === 0 ? (
                <p className="text-sm text-gray-500">No upcoming bills.</p>
              ) : (
                <ul className="divide-y divide-white/10">
                  {upcoming.map((bill) => {
                    const days = daysUntil(bill.due_date);
                    return (
                      <li key={bill.id} className="flex items-center justify-between py-3">
                        <div>
                          <p className="text-sm font-medium text-white">{bill.vendor}</p>
                          <p className="text-xs text-gray-500">{bill.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-100">
                            Rs {Number(bill.amount).toLocaleString()}
                          </p>
                          <p className={`text-xs ${days < 3 ? "text-red-400" : "text-gray-500"}`}>
                            {days < 0 ? "overdue" : `${days} days`}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          {/* AI Forecast — placeholder, wired up in a later phase */}
          <section className="p-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
              AI Forecast
            </h2>
            <p className="mt-3 text-sm text-gray-500">
              Coming soon — predicted next-bill range once enough billing history exists.
            </p>
          </section>

          {/* AI Insights — placeholder, wired up in a later phase */}
          <section className="p-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
              AI Insights
            </h2>
            <p className="mt-3 text-sm text-gray-500">
              Coming soon — flags for unusual spending patterns across your bills.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
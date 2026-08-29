import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL;

const CATEGORIES = ["Electricity", "Gas", "Water", "Internet", "Other"];
const STATUSES = ["unpaid", "paid", "overdue"];

const inputClass =
  "w-full rounded-md bg-white/5 px-3 py-1.5 text-sm text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:outline-indigo-500";

const STATUS_STYLES = {
  unpaid: "bg-gray-500/10 text-gray-400",
  paid: "bg-green-500/10 text-green-400",
  overdue: "bg-red-500/10 text-red-400",
};

function Field({ label, hint, className = "", children }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs font-medium text-gray-400">
        {label}
        {hint && <span className="ml-1 font-normal text-gray-600">· {hint}</span>}
      </label>
      {children}
    </div>
  );
}

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

  const [forecast, setForecast] = useState(null);

  const fetchForecast = async (billsData) => {
    const uniqueCategories = [...new Set(billsData.map((b) => b.category))];
    for (const cat of uniqueCategories) {
      try {
        const res = await fetch(
          `${API_URL}/analytics/forecast?category=${encodeURIComponent(cat)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) continue;
        const data = await res.json();
        if (data.enough_data) {
          setForecast(data);
          return;
        }
      } catch {
        // skip this category, try the next
      }
    }
    setForecast(null);
  };

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

    fetchForecast(data);
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

  const handleDeleteBill = async (billId) => {
    try {
      const res = await fetch(`${API_URL}/bills/${billId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Could not delete bill");
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
              <form onSubmit={handleAddBill} className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4">
                <Field label="Vendor" className="col-span-2">
                  <input
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    required
                    placeholder="e.g. LESCO"
                    className={inputClass}
                  />
                </Field>

                <Field label="Amount">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    placeholder="Rs"
                    className={inputClass}
                  />
                </Field>

                <Field label="Category">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={inputClass}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c} className="bg-gray-900">
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Due date">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className={inputClass}
                  />
                </Field>

                <Field label="Billing month" hint="Which month this bill covers">
                  <input
                    type="month"
                    value={billingMonth}
                    onChange={(e) => setBillingMonth(e.target.value)}
                    required
                    className={inputClass}
                  />
                </Field>

                <Field label="Status">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className={inputClass}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s} className="bg-gray-900">
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Units consumed" hint="Optional">
                  <input
                    type="number"
                    value={consumption}
                    onChange={(e) => setConsumption(e.target.value)}
                    placeholder="e.g. 320"
                    className={inputClass}
                  />
                </Field>

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
                    const isPastDue = days < 0;

                    return (
                      <li key={bill.id} className="flex items-center justify-between py-3">
                        <div>
                          <p className="text-sm font-medium text-white">{bill.vendor}</p>
                          <p className="text-xs text-gray-500">{bill.category}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-100">
                              Rs {Number(bill.amount).toLocaleString()}
                            </p>
                            <p className={`text-xs ${days < 3 ? "text-red-400" : "text-gray-500"}`}>
                              {isPastDue ? "overdue" : `${days} days`}
                            </p>
                            <div className="mt-1 flex items-center justify-end gap-1.5">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                  STATUS_STYLES[bill.status] || STATUS_STYLES.unpaid
                                }`}
                              >
                                {bill.status}
                              </span>
                              {bill.reminder_sent ? (
                                <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-500/80">
                                  🔔 Reminder sent
                                </span>
                              ) : !isPastDue ? (
                                <span className="rounded-full bg-gray-500/10 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                                  ⏳ Reminder pending
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteBill(bill.id)}
                            title="Delete bill"
                            className="text-gray-600 hover:text-red-400 text-sm px-1"
                          >
                            ✕
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          {/* AI Forecast */}
          <section className="p-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
              AI Forecast
            </h2>
            {forecast === null ? (
              <p className="mt-3 text-sm text-gray-500">
                Not enough billing history yet to forecast — add a few more bills in the same category.
              </p>
            ) : (
              <div className="mt-3">
                <p className="text-sm text-gray-100">
                  <span className="font-medium text-white">{forecast.category}</span>{" "}
                  <span className="text-gray-500">next bill estimate</span>
                </p>
                <p className="mt-1 text-lg font-semibold text-white">
                  Rs {Number(forecast.predicted_low).toLocaleString()} – Rs{" "}
                  {Number(forecast.predicted_high).toLocaleString()}
                </p>
                <p
                  className={`mt-1 text-xs font-medium ${
                    forecast.percent_change_vs_average > 0 ? "text-red-400" : "text-green-400"
                  }`}
                >
                  {forecast.percent_change_vs_average > 0 ? "▲" : "▼"}{" "}
                  {Math.abs(forecast.percent_change_vs_average)}% vs average
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
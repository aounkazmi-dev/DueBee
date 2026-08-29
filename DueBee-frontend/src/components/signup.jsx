import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

function SignUp({ onAuthSuccess, onSwitchToSignIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const signupRes = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!signupRes.ok) {
        const err = await signupRes.json();
        throw new Error(err.detail || "Signup failed");
      }

      const form = new URLSearchParams();
      form.append("username", email);
      form.append("password", password);

      const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form,
      });

      if (!loginRes.ok) throw new Error("Account created — please sign in");

      const data = await loginRes.json();
      localStorage.setItem("token", data.access_token);
      onAuthSuccess(data.access_token);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
      <img
  src="/logo.png"
  alt="DueBee"
  className="mx-auto w-40 sm:w-48 md:w-56 lg:w-64 h-auto"
 />
        <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-white">
          Create your DueBee account
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm/6 font-medium text-gray-100">
              Email address
            </label>
            <div className="mt-2">
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm/6 font-medium text-gray-100">
              Password
            </label>
            <div className="mt-2">
              <input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm/6 font-semibold text-white hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-60"
            >
              {submitting ? "Please wait…" : "Create account"}
            </button>
          </div>
        </form>

        <p className="mt-10 text-center text-sm/6 text-gray-400">
          Already have an account?{" "}
          <button onClick={onSwitchToSignIn} className="font-semibold text-indigo-400 hover:text-indigo-300">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}

export default SignUp;
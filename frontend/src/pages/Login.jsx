import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Barcode, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from?.pathname || '/dashboard';

  const [form,    setForm]    = useState({ email: '', password: '' });
  const [show,    setShow]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      await login(form.email.trim(), form.password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Demo credential fill
  const fillDemo = (role) => {
    const creds = {
      admin:   { email: 'admin@invotrack.com',   password: 'Admin@1234' },
      manager: { email: 'manager@invotrack.com', password: 'Manager@1234' },
      cashier: { email: 'cashier@invotrack.com', password: 'Cashier@1234' },
    };
    setForm(creds[role]);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
              <Barcode size={20} className="text-white" />
            </div>
            <div>
              <div className="text-white font-semibold text-lg leading-tight">InvoTrack</div>
              <div className="text-blue-300/70 text-xs">Inventory & Billing System</div>
            </div>
          </div>

          <h1 className="text-white text-xl font-semibold mb-1">Sign in</h1>
          <p className="text-blue-200/60 text-sm mb-7">Enter your credentials to continue</p>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-300 text-sm rounded-lg px-4 py-3 mb-5">
              <AlertCircle size={15} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-blue-200/70 mb-1.5">Email address</label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full h-10 px-3.5 rounded-lg bg-white/[0.08] border border-white/10
                           text-white placeholder-white/25 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50
                           transition-all duration-150"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-blue-200/70 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full h-10 px-3.5 pr-10 rounded-lg bg-white/[0.08] border border-white/10
                             text-white placeholder-white/25 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50
                             transition-all duration-150"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 flex items-center justify-center gap-2 rounded-lg
                         bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed
                         text-white text-sm font-medium transition-colors duration-150 mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign in <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-7 pt-6 border-t border-white/10">
            <p className="text-xs text-white/30 mb-3 text-center">Demo accounts</p>
            <div className="grid grid-cols-3 gap-2">
              {['admin', 'manager', 'cashier'].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => fillDemo(role)}
                  className="py-1.5 px-2 rounded-lg border border-white/10 bg-white/5
                             text-white/50 hover:text-white hover:bg-white/10
                             text-[11px] font-medium capitalize transition-all duration-150"
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Version */}
        <p className="text-center text-white/20 text-xs mt-6">InvoTrack v1.0.0 · Smart Inventory & Billing</p>
      </div>
    </div>
  );
}

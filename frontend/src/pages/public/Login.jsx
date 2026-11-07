import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Bike, Mail, Lock, AlertCircle, ArrowRight, ShieldCheck, User } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.success) {
        login(res.user, res.token);
        showToast(`Welcome back, ${res.user.full_name}!`, 'success');

        if (redirect) {
          navigate(redirect);
        } else if (res.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/customer');
        }
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickAccount = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-100 shadow-card">
        
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-md">
              <Bike className="w-6 h-6 text-secondary" />
            </div>
            <span className="text-2xl font-black text-primary">
              Ride<span className="text-secondary">Now</span>
            </span>
          </Link>
          <h2 className="text-2xl font-black text-primary tracking-tight">Sign In to Your Account</h2>
          <p className="text-xs text-slate-500 mt-1">Manage bookings, view active rentals, and explore vehicles.</p>
        </div>

        {/* Quick Demo Credentials Helper */}
        <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/10 space-y-2">
          <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">Quick Fill Demo Accounts:</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillQuickAccount('admin@ridenow.com', 'Admin@123')}
              className="py-1.5 px-2.5 rounded-lg bg-primary text-white text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-primary-light transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
              <span>Admin Demo</span>
            </button>
            <button
              type="button"
              onClick={() => fillQuickAccount('customer@ridenow.com', 'Customer@123')}
              className="py-1.5 px-2.5 rounded-lg bg-secondary text-white text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-secondary-hover transition-colors shadow-sm"
            >
              <User className="w-3.5 h-3.5 text-white" />
              <span>Customer Demo</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-secondary bg-slate-50"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-600">Password</label>
              <Link to="/forgot-password" className="text-[11px] font-bold text-secondary hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-secondary bg-slate-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-secondary hover:bg-secondary-hover disabled:bg-slate-300 text-white text-xs font-bold transition-all shadow-md shadow-secondary/20 flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-bold text-secondary hover:underline">
            Create account
          </Link>
        </div>

      </div>
    </div>
  );
}

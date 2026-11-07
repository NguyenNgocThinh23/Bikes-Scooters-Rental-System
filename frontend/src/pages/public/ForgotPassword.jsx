import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bike, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err) {
      setSubmitted(true); // Always display message for privacy
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-slate-100 shadow-card">
        
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-md">
              <Bike className="w-6 h-6 text-secondary" />
            </div>
            <span className="text-2xl font-black text-primary">
              Ride<span className="text-secondary">Now</span>
            </span>
          </Link>
          <h2 className="text-2xl font-black text-primary tracking-tight">Reset Password</h2>
          <p className="text-xs text-slate-500 mt-1">Enter your registered email to receive password reset instructions.</p>
        </div>

        {submitted ? (
          <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p>If an account exists for {email}, a recovery link has been dispatched.</p>
            <Link to="/login" className="inline-block mt-3 text-secondary font-bold hover:underline">
              Return to Login
            </Link>
          </div>
        ) : (
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-secondary hover:bg-secondary-hover disabled:bg-slate-300 text-white text-xs font-bold transition-all shadow-md shadow-secondary/20 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Sending...' : 'Send Recovery Link'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          Remember your password?{' '}
          <Link to="/login" className="font-bold text-secondary hover:underline">
            Back to Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}

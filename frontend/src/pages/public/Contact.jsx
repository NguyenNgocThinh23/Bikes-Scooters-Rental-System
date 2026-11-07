import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2 } from 'lucide-react';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccess(true);
    setForm({ name: '', email: '', subject: '', message: '' });
    setTimeout(() => setSuccess(false), 6000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      
      <div className="text-center max-w-3xl mx-auto">
        <span className="text-xs font-extrabold uppercase tracking-widest text-secondary">Customer Support</span>
        <h1 className="text-4xl font-black text-primary mt-2">Contact RideNow</h1>
        <p className="text-sm text-slate-500 mt-3 leading-relaxed">
          Need help with your booking, vehicle pickup, or group rental? Our team is available 7 days a week.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Info Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-card space-y-6">
            <h3 className="text-lg font-bold text-primary">Da Nang Headquarters</h3>
            
            <div className="space-y-4 text-xs sm:text-sm text-slate-600">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-primary block">Central Station</span>
                  <span>120 Nguyen Van Linh, Hai Chau District, Da Nang</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-secondary shrink-0" />
                <span>+84 905 123 456 (24/7 Hotline)</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-secondary shrink-0" />
                <span>support@ridenow.com</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-secondary shrink-0" />
                <span>Open Daily: 06:30 - 22:00</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Other Branches</h4>
              <ul className="text-xs text-slate-500 space-y-1">
                <li>• My Khe Beach Station (254 Vo Nguyen Giap)</li>
                <li>• Han River Waterfront Hub (88 Bach Dang)</li>
                <li>• Hoi An Ancient Town Branch (35 Tran Phu)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Form Column */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-card">
            <h3 className="text-lg font-bold text-primary mb-4">Send Us a Direct Message</h3>

            {success && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Thank you! Your message has been received. A RideNow specialist will reach out shortly.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:border-secondary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:border-secondary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Booking extension / General inquiry"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:border-secondary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Message</label>
                <textarea
                  rows={5}
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell us how we can help you..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:border-secondary"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-secondary hover:bg-secondary-hover text-white text-xs font-bold transition-all shadow-md shadow-secondary/20 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Send Message</span>
              </button>
            </form>
          </div>
        </div>

      </div>

    </div>
  );
}

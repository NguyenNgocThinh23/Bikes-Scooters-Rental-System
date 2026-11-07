import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, Shield, ArrowRight, HelpCircle } from 'lucide-react';
import api from '../../services/api';
import { formatVND } from '../../utils/formatters';

export default function Pricing() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPricing() {
      try {
        const res = await api.get('/vehicles/categories');
        if (res.success) setCategories(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchPricing();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      
      <div className="text-center max-w-3xl mx-auto">
        <span className="text-xs font-extrabold uppercase tracking-widest text-secondary">Clear & Flexible</span>
        <h1 className="text-4xl font-black text-primary mt-2">Rental Pricing Plans</h1>
        <p className="text-sm text-slate-500 mt-3 leading-relaxed">
          Transparent rates in Vietnamese Dong (VND). Significant discounts for weekly and monthly adventures.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card hover:shadow-hover transition-all flex flex-col justify-between"
          >
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Category</span>
              <h3 className="text-lg font-black text-primary mt-1">{cat.name}</h3>
              
              <div className="mt-5 pb-5 border-b border-slate-100">
                <div className="text-2xl font-black text-secondary">{formatVND(cat.base_daily_rate)}</div>
                <div className="text-xs text-slate-400 font-semibold">Standard Daily Rate</div>
                <div className="text-xs text-slate-500 mt-1">Hourly: {formatVND(cat.base_hourly_rate)}/h</div>
              </div>

              <ul className="mt-5 space-y-2.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-secondary shrink-0" />
                  <span>Sanitized helmet included</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-secondary shrink-0" />
                  <span>Heavy-duty security lock</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-secondary shrink-0" />
                  <span>24/7 Roadside support</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-secondary shrink-0" />
                  <span>Free station drop-off</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4">
              <Link
                to={`/explore?category=${cat.slug}`}
                className="w-full py-2.5 rounded-xl bg-primary hover:bg-secondary text-white text-xs font-bold text-center block transition-colors shadow-sm"
              >
                Browse {cat.name}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Policies highlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h4 className="font-bold text-primary text-sm mb-2">Deposit Protection</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            All deposits are tracked separately and refunded automatically upon return inspection.
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h4 className="font-bold text-primary text-sm mb-2">Free Cancellation</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Cancel with zero penalty up to 24 hours prior to your scheduled pickup time.
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h4 className="font-bold text-primary text-sm mb-2">Flexible Extensions</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Request rental extension straight from your active rentals dashboard with real-time availability checks.
          </p>
        </div>
      </div>

    </div>
  );
}

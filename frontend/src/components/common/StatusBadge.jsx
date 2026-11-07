import React from 'react';

export default function StatusBadge({ status, type = 'status' }) {
  if (!status) return null;

  const normalized = String(status).toLowerCase();

  const config = {
    // Booking statuses
    pending: { label: 'Pending', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
    confirmed: { label: 'Confirmed', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
    active: { label: 'Active', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    completed: { label: 'Completed', bg: 'bg-gray-100 text-gray-700 border-gray-200' },
    cancelled: { label: 'Cancelled', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
    rejected: { label: 'Rejected', bg: 'bg-red-50 text-red-700 border-red-200' },

    // Vehicle operational statuses
    available: { label: 'Available', bg: 'bg-secondary/10 text-secondary border-secondary/20' },
    rented: { label: 'Rented', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
    maintenance: { label: 'Maintenance', bg: 'bg-orange-50 text-orange-700 border-orange-200' },
    unavailable: { label: 'Unavailable', bg: 'bg-slate-100 text-slate-600 border-slate-200' },

    // Document verification statuses
    approved: { label: 'Verified', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },

    // Payment statuses
    paid: { label: 'Paid', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    partially_paid: { label: 'Partially Paid', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
    refunded: { label: 'Refunded', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
    failed: { label: 'Failed', bg: 'bg-red-50 text-red-700 border-red-200' },

    // Deposit statuses
    held: { label: 'Held', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
    deducted: { label: 'Deducted', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
    partially_refunded: { label: 'Partially Refunded', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
  };

  const style = config[normalized] || {
    label: status,
    bg: 'bg-gray-100 text-gray-700 border-gray-200'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style.bg}`}>
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-70"></span>
      {style.label}
    </span>
  );
}

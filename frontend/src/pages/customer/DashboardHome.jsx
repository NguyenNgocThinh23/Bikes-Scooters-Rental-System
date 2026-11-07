import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  Bike,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  FileText,
  Upload
} from 'lucide-react';
import api from '../../services/api';
import { formatVND, formatDateTime } from '../../utils/formatters';
import StatusBadge from '../../components/common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import InvoiceModal from '../../components/common/InvoiceModal';

export default function DashboardHome() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  useEffect(() => {
    async function loadBookings() {
      try {
        const res = await api.get('/bookings/my-bookings');
        if (res.success) {
          setBookings(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadBookings();
  }, []);

  const totalBookings = bookings.length;
  const activeRentals = bookings.filter(b => b.booking_status === 'active');
  const pendingBookings = bookings.filter(b => b.booking_status === 'pending');
  const completedRentals = bookings.filter(b => b.booking_status === 'completed');

  return (
    <div className="space-y-8">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary to-primary-light text-white p-6 sm:p-8 rounded-3xl shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-secondary">Customer Portal</span>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">Hello, {user?.full_name}!</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">Welcome back to your RideNow rental control center.</p>
        </div>

        <Link
          to="/explore"
          className="px-5 py-2.5 rounded-xl bg-secondary hover:bg-secondary-hover text-white text-xs font-bold shadow-md shadow-secondary/20 transition-all transform hover:-translate-y-0.5"
        >
          + Rent Another Vehicle
        </Link>
      </div>

      {/* ID Verification Warning Banner if Pending/Rejected */}
      {user?.document_verification_status !== 'approved' && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
          user?.document_verification_status === 'rejected'
            ? 'bg-rose-50 text-rose-800 border-rose-200'
            : 'bg-amber-50 text-amber-800 border-amber-200'
        }`}>
          <div className="flex items-center gap-3 text-xs">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <span className="font-bold">
                {user?.document_verification_status === 'rejected'
                  ? 'Identity Document Verification Rejected'
                  : 'Identity Verification Required'}
              </span>
              <p className="text-[11px] opacity-90 mt-0.5">
                {user?.document_verification_status === 'rejected'
                  ? `Reason: ${user.document_rejection_reason || 'Document unreadable'}. Please re-upload a clear copy.`
                  : 'Please upload your National ID or Driver\'s License to ensure swift vehicle pickup.'}
              </p>
            </div>
          </div>
          <Link
            to="/customer/profile"
            className="px-3.5 py-1.5 rounded-xl bg-white text-xs font-bold border shadow-sm shrink-0 hover:bg-slate-50 transition-colors"
          >
            Upload ID
          </Link>
        </div>
      )}

      {/* Active Rental Alert Card if currently renting */}
      {activeRentals.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 sm:p-7 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-secondary text-white flex items-center justify-center shrink-0 shadow-md">
                <Bike className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Currently on Trip</span>
                <h3 className="text-base font-black text-primary">{activeRentals[0].vehicle_name} ({activeRentals[0].booking_code})</h3>
                <div className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-secondary" />
                  <span>Return Deadline: <strong>{formatDateTime(activeRentals[0].return_datetime)}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Link
                to="/customer/active-rentals"
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-secondary hover:bg-secondary-hover text-white text-xs font-bold text-center shadow-md transition-all"
              >
                Manage Trip / Extend
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Total Bookings</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-primary mt-2">{totalBookings}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Lifetime reservations</span>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Active Rentals</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-secondary flex items-center justify-center">
              <Bike className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-secondary mt-2">{activeRentals.length}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Vehicles in your possession</span>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Pending Review</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 mt-2">{pendingBookings.length}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Awaiting admin confirm</span>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Completed Trips</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-primary mt-2">{completedRentals.length}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Safely returned & closed</span>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-primary">Recent Bookings</h3>
            <p className="text-xs text-slate-500">Your most recent rental requests and trips.</p>
          </div>
          <Link
            to="/customer/my-bookings"
            className="text-xs font-bold text-secondary hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {bookings.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No bookings yet. Explore our fleet and book your first ride!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Pickup</th>
                  <th className="py-3 px-4">Return</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {bookings.slice(0, 5).map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-primary">{b.booking_code}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{b.vehicle_name}</td>
                    <td className="py-3.5 px-4 text-slate-600">{formatDateTime(b.pickup_datetime)}</td>
                    <td className="py-3.5 px-4 text-slate-600">{formatDateTime(b.return_datetime)}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={b.booking_status} />
                    </td>
                    <td className="py-3.5 px-4 font-bold text-secondary">{formatVND(b.total_amount)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedInvoiceId(b.id)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors inline-flex items-center gap-1 text-[11px] font-bold"
                        title="View & Print Invoice"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Invoice</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      {selectedInvoiceId && (
        <InvoiceModal
          bookingId={selectedInvoiceId}
          onClose={() => setSelectedInvoiceId(null)}
        />
      )}

    </div>
  );
}

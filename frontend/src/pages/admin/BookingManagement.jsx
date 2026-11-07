import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  FileText,
  Clock,
  MapPin,
  Calendar
} from 'lucide-react';
import api from '../../services/api';
import { formatVND, formatDateTime } from '../../utils/formatters';
import StatusBadge from '../../components/common/StatusBadge';
import InvoiceModal from '../../components/common/InvoiceModal';
import { useNotifications } from '../../context/NotificationContext';

export default function BookingManagement() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { showToast } = useNotifications();

  // Modals
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [rejectModalBooking, setRejectModalBooking] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadBookings();
  }, [search, statusFilter]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);

      const res = await api.get(`/bookings/all?${params.toString()}`);
      if (res.success) {
        setBookings(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Admin Confirm: Triggers backend database transaction with anti-double-booking locks
   */
  const handleConfirmBooking = async (b) => {
    if (!window.confirm(`Confirm reservation ${b.booking_code} for ${b.vehicle_name}? System will lock and verify vehicle availability.`)) {
      return;
    }

    try {
      const res = await api.post(`/bookings/${b.id}/confirm`);
      if (res.success) {
        showToast(`Booking ${b.booking_code} confirmed! Vehicle reserved for this schedule.`, 'success');
        loadBookings();
      }
    } catch (err) {
      showToast(err.message || 'Cannot confirm booking: Time slot conflict detected!', 'error');
    }
  };

  const handleRejectBooking = async () => {
    if (!rejectModalBooking) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/bookings/${rejectModalBooking.id}/reject`, {
        reason: rejectReason || 'Vehicle unavailable or identity verification needed'
      });
      if (res.success) {
        showToast(`Booking ${rejectModalBooking.booking_code} rejected.`, 'info');
        setRejectModalBooking(null);
        setRejectReason('');
        loadBookings();
      }
    } catch (err) {
      showToast(err.message || 'Rejection failed.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-primary">Booking Management</h1>
          <p className="text-xs text-slate-500">
            Review customer reservations, confirm bookings with transactional concurrency checks, and manage trips.
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search booking code, customer name, email, or vehicle..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-secondary shadow-sm"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:outline-none focus:border-secondary shadow-sm"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">No bookings found matching filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="py-3.5 px-5">Code & Date</th>
                  <th className="py-3.5 px-5">Customer</th>
                  <th className="py-3.5 px-5">Vehicle & Station</th>
                  <th className="py-3.5 px-5">Rental Interval</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Total</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {bookings.map((b) => {
                  const isPending = b.booking_status === 'pending';

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-5">
                        <span className="font-bold text-primary block">{b.booking_code}</span>
                        <span className="text-[10px] text-slate-400">{formatDateTime(b.created_at)}</span>
                      </td>

                      <td className="py-4 px-5">
                        <span className="font-bold text-slate-800 block">{b.customer_name}</span>
                        <span className="text-[10px] text-slate-400">{b.customer_email}</span>
                      </td>

                      <td className="py-4 px-5">
                        <span className="font-bold text-slate-800 block">{b.vehicle_name}</span>
                        <span className="text-[10px] text-slate-400">{b.pickup_location_name}</span>
                      </td>

                      <td className="py-4 px-5 space-y-0.5 text-slate-600">
                        <div>From: <strong>{formatDateTime(b.pickup_datetime)}</strong></div>
                        <div>To: <strong>{formatDateTime(b.return_datetime)}</strong></div>
                      </td>

                      <td className="py-4 px-5">
                        <StatusBadge status={b.booking_status} />
                      </td>

                      <td className="py-4 px-5 font-black text-secondary">
                        {formatVND(b.total_amount)}
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleConfirmBooking(b)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm flex items-center gap-1"
                                title="Confirm booking (Transaction Check)"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Confirm</span>
                              </button>
                              <button
                                onClick={() => setRejectModalBooking(b)}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[11px] flex items-center gap-1"
                                title="Reject booking"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => setSelectedBooking(b)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                            title="View Booking Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setSelectedInvoiceId(b.id)}
                            className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary hover:text-white text-primary transition-colors"
                            title="View Invoice"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="font-black text-primary text-base">Reject Booking {rejectModalBooking.booking_code}?</h3>
            <p className="text-xs text-slate-500">Provide an explanation that will be emailed / notified to the customer.</p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Rejection</label>
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Vehicle maintenance, schedule conflict, ID document missing..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-400 bg-slate-50"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalBooking(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleRejectBooking}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-md"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-primary text-base">Booking Details: {selectedBooking.booking_code}</h3>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-3 rounded-xl bg-bgLight">
                <span className="text-slate-500">Booking Status:</span>
                <StatusBadge status={selectedBooking.booking_status} />
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-bgLight">
                <span className="text-slate-500">Payment Status:</span>
                <StatusBadge status={selectedBooking.payment_status} />
              </div>
              <div className="p-3 rounded-xl bg-bgLight space-y-1">
                <span className="text-slate-500 block font-bold">Renter Info:</span>
                <div>Name: <strong>{selectedBooking.customer_name}</strong></div>
                <div>Email: <strong>{selectedBooking.customer_email}</strong></div>
                <div>Phone: <strong>{selectedBooking.customer_phone || 'None'}</strong></div>
              </div>
              <div className="p-3 rounded-xl bg-bgLight space-y-1">
                <span className="text-slate-500 block font-bold">Station Routing:</span>
                <div>Pickup: <strong>{selectedBooking.pickup_location_name}</strong></div>
                <div>Return: <strong>{selectedBooking.return_location_name}</strong></div>
              </div>
              <div className="p-3 rounded-xl bg-bgLight space-y-1">
                <span className="text-slate-500 block font-bold">Financial Summary:</span>
                <div className="flex justify-between">
                  <span>Rental Fee:</span>
                  <span className="font-bold">{formatVND(selectedBooking.rental_fee)}</span>
                </div>
                <div className="flex justify-between text-secondary font-black pt-1 border-t border-slate-200">
                  <span>Total Amount:</span>
                  <span>{formatVND(selectedBooking.total_amount)}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => {
                  const bId = selectedBooking.id;
                  setSelectedBooking(null);
                  setSelectedInvoiceId(bId);
                }}
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold"
              >
                View Full Invoice
              </button>
            </div>
          </div>
        </div>
      )}

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

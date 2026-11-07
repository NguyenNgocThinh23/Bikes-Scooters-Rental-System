import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Search,
  Filter,
  FileText,
  XCircle,
  Eye,
  AlertCircle,
  Clock,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import api from '../../services/api';
import { formatVND, formatDateTime } from '../../utils/formatters';
import StatusBadge from '../../components/common/StatusBadge';
import InvoiceModal from '../../components/common/InvoiceModal';
import { useNotifications } from '../../context/NotificationContext';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const { showToast } = useNotifications();

  // Selected Booking for Details Modal
  const [selectedBooking, setSelectedBooking] = useState(null);
  // Selected Booking for Invoice Modal
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  // Cancellation Modal
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadBookings();
  }, [statusFilter, search]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);

      const res = await api.get(`/bookings/my-bookings?${params.toString()}`);
      if (res.success) {
        setBookings(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelModalBooking) return;
    setCancelling(true);
    try {
      const res = await api.post(`/bookings/${cancelModalBooking.id}/cancel`, {
        reason: cancelReason || 'Cancelled by customer'
      });
      if (res.success) {
        showToast('Booking cancelled successfully.', 'info');
        setCancelModalBooking(null);
        setCancelReason('');
        loadBookings();
      }
    } catch (err) {
      showToast(err.message || 'Failed to cancel booking', 'error');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-primary">My Bookings</h1>
          <p className="text-xs text-slate-500">Track and manage all your past, present, and upcoming reservations.</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search input */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search code or vehicle..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-secondary shadow-sm"
            />
          </div>

          {/* Status filter dropdown */}
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
      </div>

      {/* Bookings Table / Cards */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading your bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <CalendarCheck className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-xs font-semibold">No bookings found matching your filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="py-3.5 px-5">Booking Code</th>
                  <th className="py-3.5 px-5">Vehicle</th>
                  <th className="py-3.5 px-5">Pickup & Return</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Deposit</th>
                  <th className="py-3.5 px-5">Total Amount</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {bookings.map((b) => {
                  const canCancel = ['pending', 'confirmed'].includes(b.booking_status);

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-5">
                        <span className="font-bold text-primary block">{b.booking_code}</span>
                        <span className="text-[10px] text-slate-400">{formatDateTime(b.created_at)}</span>
                      </td>

                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-800">{b.vehicle_name}</div>
                        <span className="text-[10px] text-slate-400">{b.category_name}</span>
                      </td>

                      <td className="py-4 px-5 space-y-0.5 text-slate-600">
                        <div>From: <strong>{formatDateTime(b.pickup_datetime)}</strong></div>
                        <div>To: <strong>{formatDateTime(b.return_datetime)}</strong></div>
                      </td>

                      <td className="py-4 px-5">
                        <StatusBadge status={b.booking_status} />
                      </td>

                      <td className="py-4 px-5">
                        <StatusBadge status={b.deposit_status || 'held'} />
                      </td>

                      <td className="py-4 px-5 font-black text-secondary">
                        {formatVND(b.total_amount)}
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
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
                            title="View Itemized Invoice"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {canCancel && (
                            <button
                              onClick={() => setCancelModalBooking(b)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                              title="Cancel Booking"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
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

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-4">
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
                <span className="text-slate-500 block font-bold">Stations:</span>
                <div>Pickup Station: <strong>{selectedBooking.pickup_location_name}</strong></div>
                <div>Return Station: <strong>{selectedBooking.return_location_name}</strong></div>
              </div>
              <div className="p-3 rounded-xl bg-bgLight space-y-1">
                <span className="text-slate-500 block font-bold">Financial Summary:</span>
                <div className="flex justify-between">
                  <span>Rental Fee:</span>
                  <span className="font-bold">{formatVND(selectedBooking.rental_fee)}</span>
                </div>
                {selectedBooking.extension_fee > 0 && (
                  <div className="flex justify-between">
                    <span>Extension Fee:</span>
                    <span className="font-bold">{formatVND(selectedBooking.extension_fee)}</span>
                  </div>
                )}
                {selectedBooking.late_fee > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Overdue Late Fee:</span>
                    <span className="font-bold">{formatVND(selectedBooking.late_fee)}</span>
                  </div>
                )}
                <div className="flex justify-between text-secondary font-black pt-1 border-t border-slate-200">
                  <span>Total Amount:</span>
                  <span>{formatVND(selectedBooking.total_amount)}</span>
                </div>
              </div>
              {selectedBooking.notes && (
                <div className="p-3 rounded-xl bg-bgLight">
                  <span className="text-slate-500 font-bold block mb-1">Customer / Handover Notes:</span>
                  <p className="text-slate-700 whitespace-pre-line">{selectedBooking.notes}</p>
                </div>
              )}
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

      {/* Cancel Booking Confirmation Modal */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="font-black text-primary text-base">Cancel Booking {cancelModalBooking.booking_code}?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to cancel this booking? If cancelled at least 24 hours prior to pickup, your deposit will be refunded in full.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reason for cancellation</label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Change of schedule, travel plans changed..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-400 bg-slate-50"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalBooking(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelBooking}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-md"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
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

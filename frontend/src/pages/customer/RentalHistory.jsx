import React, { useState, useEffect } from 'react';
import {
  History,
  Star,
  FileText,
  MessageSquarePlus,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import { formatVND, formatDateTime } from '../../utils/formatters';
import StatusBadge from '../../components/common/StatusBadge';
import InvoiceModal from '../../components/common/InvoiceModal';
import { useNotifications } from '../../context/NotificationContext';

export default function RentalHistory() {
  const [historyBookings, setHistoryBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const { showToast } = useNotifications();

  // Review Modal State
  const [reviewBooking, setReviewBooking] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bookings/my-bookings');
      if (res.success) {
        // Filter history statuses: completed, cancelled, rejected
        const historyList = res.data.filter(b => ['completed', 'cancelled', 'rejected'].includes(b.booking_status));
        setHistoryBookings(historyList);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReview = (booking) => {
    setReviewBooking(booking);
    setReviewRating(5);
    setReviewComment('');
    setReviewError('');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewBooking) return;
    setSubmittingReview(true);
    setReviewError('');

    try {
      const res = await api.post('/reviews', {
        booking_id: reviewBooking.id,
        rating: reviewRating,
        comment: reviewComment
      });

      if (res.success) {
        showToast('Thank you! Your review has been submitted.', 'success');
        setReviewBooking(null);
        loadHistory();
      }
    } catch (err) {
      setReviewError(err.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-6">
      
      <div>
        <h1 className="text-2xl font-black text-primary">Rental History</h1>
        <p className="text-xs text-slate-500">Review your past completed, cancelled, or closed rental trips.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading history...</div>
        ) : historyBookings.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <History className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-xs font-semibold">No past rental history yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="py-3.5 px-5">Code</th>
                  <th className="py-3.5 px-5">Vehicle</th>
                  <th className="py-3.5 px-5">Trip Dates</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Total Paid</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {historyBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-5 font-bold text-primary">{b.booking_code}</td>
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-800">{b.vehicle_name}</div>
                      <span className="text-[10px] text-slate-400">{b.category_name}</span>
                    </td>
                    <td className="py-4 px-5 text-slate-600">
                      <div>{formatDateTime(b.pickup_datetime)}</div>
                      <div className="text-[11px] text-slate-400">to {formatDateTime(b.actual_return_datetime || b.return_datetime)}</div>
                    </td>
                    <td className="py-4 px-5">
                      <StatusBadge status={b.booking_status} />
                    </td>
                    <td className="py-4 px-5 font-black text-secondary">
                      {formatVND(b.total_amount)}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {b.booking_status === 'completed' && (
                          <button
                            onClick={() => handleOpenReview(b)}
                            className="px-3 py-1.5 rounded-lg bg-secondary/15 hover:bg-secondary hover:text-white text-secondary font-bold text-xs flex items-center gap-1 transition-all"
                            title="Rate & Review Vehicle"
                          >
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span>Review</span>
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedInvoiceId(b.id)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Invoice</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-primary text-base">Write a Review</h3>
                <span className="text-xs text-slate-400 font-semibold">{reviewBooking.vehicle_name}</span>
              </div>
              <button
                onClick={() => setReviewBooking(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                &times;
              </button>
            </div>

            {reviewError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{reviewError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Rating (1 - 5 Stars)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 text-amber-400 hover:scale-110 transition-transform"
                    >
                      <Star className={`w-6 h-6 ${star <= reviewRating ? 'fill-amber-400' : 'text-slate-200'}`} />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-2">{reviewRating} / 5 Stars</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Your Review & Experience</label>
                <textarea
                  rows={4}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="How was the ride? How did the brakes, gears, or battery perform?"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-secondary bg-slate-50"
                ></textarea>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewBooking(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="flex-1 py-2.5 rounded-xl bg-secondary hover:bg-secondary-hover text-white text-xs font-bold transition-all shadow-md shadow-secondary/20"
                >
                  {submittingReview ? 'Submitting...' : 'Post Review'}
                </button>
              </div>
            </form>

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

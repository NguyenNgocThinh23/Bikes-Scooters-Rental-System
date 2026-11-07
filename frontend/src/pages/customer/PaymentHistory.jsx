import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import api from '../../services/api';
import { formatVND, formatDateTime } from '../../utils/formatters';
import StatusBadge from '../../components/common/StatusBadge';
import { useNotifications } from '../../context/NotificationContext';

export default function PaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('payments');
  const { showToast } = useNotifications();

  // Simulated Payment Modal
  const [showMockModal, setShowMockModal] = useState(false);
  const [mockBookingId, setMockBookingId] = useState('');
  const [mockAmount, setMockAmount] = useState('250000');
  const [mockMethod, setMockMethod] = useState('mock_card');
  const [processing, setProcessing] = useState(false);
  const [myPendingBookings, setMyPendingBookings] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [historyRes, bookingsRes] = await Promise.all([
        api.get('/payments/my-history'),
        api.get('/bookings/my-bookings')
      ]);

      if (historyRes.success) {
        setPayments(historyRes.payments || []);
        setDeposits(historyRes.deposits || []);
      }

      if (bookingsRes.success) {
        const pending = bookingsRes.data.filter(b => b.payment_status !== 'paid');
        setMyPendingBookings(pending);
        if (pending.length > 0) {
          setMockBookingId(pending[0].id);
          setMockAmount(pending[0].total_amount);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePayment = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const res = await api.post('/payments/process', {
        booking_id: mockBookingId,
        amount: mockAmount,
        payment_method: mockMethod,
        payment_type: 'rental_fee'
      });

      if (res.success) {
        showToast(res.message, 'success');
        setShowMockModal(false);
        loadData();
      }
    } catch (err) {
      showToast(err.message || 'Payment simulation failed.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-primary">Payment & Deposit History</h1>
          <p className="text-xs text-slate-500">Track all rental transactions, mock online payments, and security deposit ledgers.</p>
        </div>

        {myPendingBookings.length > 0 && (
          <button
            onClick={() => setShowMockModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary-hover text-white text-xs font-bold shadow-md shadow-secondary/20 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Pay Due Balance (Demo Simulator)</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('payments')}
          className={`py-3 px-6 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'payments'
              ? 'border-secondary text-primary font-black'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Rental Payments ({payments.length})
        </button>
        <button
          onClick={() => setActiveTab('deposits')}
          className={`py-3 px-6 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'deposits'
              ? 'border-secondary text-primary font-black'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Security Deposits Ledger ({deposits.length})
        </button>
      </div>

      {/* Payment Table */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
          {payments.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">No payment transactions found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                  <tr>
                    <th className="py-3.5 px-5">Transaction Code</th>
                    <th className="py-3.5 px-5">Booking</th>
                    <th className="py-3.5 px-5">Payment Method</th>
                    <th className="py-3.5 px-5">Amount</th>
                    <th className="py-3.5 px-5">Date</th>
                    <th className="py-3.5 px-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {payments.map((p) => {
                    const isMock = p.payment_method.includes('mock');
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-5">
                          <span className="font-bold text-primary block">{p.transaction_code}</span>
                          {p.notes && <span className="text-[10px] text-slate-400 line-clamp-1">{p.notes}</span>}
                        </td>
                        <td className="py-4 px-5">
                          <span className="font-bold text-slate-800">{p.booking_code}</span>
                          <span className="text-[10px] text-slate-400 block">{p.vehicle_name}</span>
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-1.5 font-bold text-slate-700 capitalize">
                            <span>{p.payment_method.replace('_', ' ')}</span>
                            {isMock && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-extrabold uppercase">
                                Demo
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-5 font-black text-secondary">{formatVND(p.amount)}</td>
                        <td className="py-4 px-5 text-slate-500">{formatDateTime(p.paid_at)}</td>
                        <td className="py-4 px-5">
                          <StatusBadge status={p.payment_status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Deposit Ledger Table */}
      {activeTab === 'deposits' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
          {deposits.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">No security deposit records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                  <tr>
                    <th className="py-3.5 px-5">Booking</th>
                    <th className="py-3.5 px-5">Vehicle</th>
                    <th className="py-3.5 px-5">Held Amount</th>
                    <th className="py-3.5 px-5">Refunded</th>
                    <th className="py-3.5 px-5">Deducted</th>
                    <th className="py-3.5 px-5">Deposit Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {deposits.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-5 font-bold text-primary">{d.booking_code}</td>
                      <td className="py-4 px-5 font-semibold text-slate-800">{d.vehicle_name}</td>
                      <td className="py-4 px-5 font-bold text-slate-700">{formatVND(d.amount)}</td>
                      <td className="py-4 px-5 font-bold text-emerald-600">{formatVND(d.refunded_amount)}</td>
                      <td className="py-4 px-5 text-rose-600 font-bold">
                        {d.deducted_amount > 0 ? formatVND(d.deducted_amount) : '—'}
                      </td>
                      <td className="py-4 px-5">
                        <StatusBadge status={d.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Simulated Demo Payment Modal */}
      {showMockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-secondary/20 text-secondary flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h3 className="font-black text-primary text-base">Simulated Payment Gateway</h3>
              </div>
              <button
                onClick={() => setShowMockModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                &times;
              </button>
            </div>

            {/* Simulated Demo Notice */}
            <div className="p-3 rounded-xl bg-amber-50 text-amber-900 text-xs font-medium border border-amber-200">
              <strong>Demo Notice:</strong> This is a simulated testing interface for academic/demo review. No real banking charge or actual transaction will occur.
            </div>

            <form onSubmit={handleSimulatePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Target Booking</label>
                <select
                  value={mockBookingId}
                  onChange={(e) => {
                    setMockBookingId(e.target.value);
                    const b = myPendingBookings.find(x => String(x.id) === e.target.value);
                    if (b) setMockAmount(b.total_amount);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:outline-none focus:border-secondary"
                  required
                >
                  {myPendingBookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.booking_code} — {b.vehicle_name} ({formatVND(b.total_amount)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Amount to Settle (VND)</label>
                <input
                  type="number"
                  required
                  value={mockAmount}
                  onChange={(e) => setMockAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:outline-none focus:border-secondary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Simulated Gateway Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMockMethod('mock_card')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition-colors ${
                      mockMethod === 'mock_card'
                        ? 'border-secondary bg-secondary/15 text-secondary'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Mock Credit Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setMockMethod('mock_momo')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition-colors ${
                      mockMethod === 'mock_momo'
                        ? 'border-pink-500 bg-pink-50 text-pink-600'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Mock MoMo E-Wallet
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMockModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 py-2.5 rounded-xl bg-secondary hover:bg-secondary-hover text-white text-xs font-bold transition-all shadow-md shadow-secondary/20"
                >
                  {processing ? 'Simulating...' : 'Execute Demo Payment'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

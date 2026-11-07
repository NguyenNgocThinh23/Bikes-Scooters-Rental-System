import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  DollarSign,
  Search,
  Filter,
  ShieldCheck,
  RefreshCw,
  FileText,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Wallet
} from 'lucide-react';
import api from '../../services/api';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import StatusBadge from '../../components/common/StatusBadge';
import InvoiceModal from '../../components/common/InvoiceModal';

export default function PaymentManagement() {
  const [payments, setPayments] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('payments'); // 'payments' | 'deposits'
  const [filterMethod, setFilterMethod] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState(null);

  const fetchFinancials = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterMethod) params.method = filterMethod;
      if (filterStatus) params.status = filterStatus;
      if (searchTerm) params.search = searchTerm;

      const res = await api.get('/payments/all', { params });
      if (res.success) {
        setPayments(res.payments || []);
        setDeposits(res.deposits || []);
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancials();
  }, [filterMethod, filterStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchFinancials();
  };

  // Metrics
  const totalRevenue = payments
    .filter((p) => p.payment_status === 'paid')
    .reduce((acc, p) => acc + parseFloat(p.amount || 0), 0);

  const totalDepositsHeld = deposits
    .filter((d) => d.status === 'held')
    .reduce((acc, d) => acc + parseFloat(d.amount || 0), 0);

  const totalDepositsRefunded = deposits
    .reduce((acc, d) => acc + parseFloat(d.refunded_amount || 0), 0);

  const totalSimulatedPayments = payments
    .filter((p) => p.payment_method === 'mock_card' || p.payment_method === 'mock_momo')
    .length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Payments & Financial Ledger</h1>
          <p className="text-sm text-gray-500">
            Track customer payments, security deposits, simulated demo transactions, and audit receipts.
          </p>
        </div>
        <button
          onClick={fetchFinancials}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Ledger
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold text-gray-400">Total Revenue Paid</p>
            <p className="text-2xl font-bold text-brand-dark mt-1">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-brand-green font-medium mt-1">Confirmed rental payments</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold text-gray-400">Deposits In Escrow</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(totalDepositsHeld)}</p>
            <p className="text-xs text-gray-500 font-medium mt-1">Held during active rentals</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold text-gray-400">Deposits Refunded</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(totalDepositsRefunded)}</p>
            <p className="text-xs text-gray-500 font-medium mt-1">Returned safely upon return</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold text-gray-400">Demo Gateway Txs</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{totalSimulatedPayments}</p>
            <p className="text-xs text-purple-500 font-medium mt-1">Simulated Card & MoMo</p>
          </div>
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                activeTab === 'payments'
                  ? 'bg-brand-dark text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Rental Payments ({payments.length})
            </button>
            <button
              onClick={() => setActiveTab('deposits')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                activeTab === 'deposits'
                  ? 'bg-brand-dark text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Security Deposits ({deposits.length})
            </button>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search tx code, booking, name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand-green"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-green text-white text-sm font-semibold rounded-xl hover:bg-emerald-600 transition"
            >
              Search
            </button>
          </form>
        </div>

        {/* Filters bar for Payments */}
        {activeTab === 'payments' && (
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5 text-gray-500 font-medium">
              <Filter className="w-4 h-4" />
              Filter by:
            </div>
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-green bg-white"
            >
              <option value="">All Payment Methods</option>
              <option value="mock_card">[DEMO] Simulated Card</option>
              <option value="mock_momo">[DEMO] MoMo E-Wallet</option>
              <option value="cash">Cash on Delivery</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-green bg-white"
            >
              <option value="">All Payment Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>

            {(filterMethod || filterStatus || searchTerm) && (
              <button
                onClick={() => {
                  setFilterMethod('');
                  setFilterStatus('');
                  setSearchTerm('');
                }}
                className="text-xs text-rose-600 hover:underline font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Ledger Tables */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-green" />
            <p>Loading financial transactions...</p>
          </div>
        ) : activeTab === 'payments' ? (
          payments.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <AlertCircle className="w-10 h-10 mx-auto text-gray-400 mb-2" />
              <p className="font-semibold text-gray-700">No payment records found.</p>
              <p className="text-sm">Try resetting filters or search criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">TX Code</th>
                    <th className="py-3 px-4">Booking</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map((p) => {
                    const isMock = p.payment_method === 'mock_card' || p.payment_method === 'mock_momo';
                    return (
                      <tr key={p.id} className="hover:bg-gray-50/80 transition">
                        <td className="py-3 px-4 font-mono font-medium text-brand-dark">
                          {p.transaction_code}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-xs font-semibold bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                            {p.booking_code}
                          </span>
                          <p className="text-xs text-gray-500 mt-0.5">{p.vehicle_name}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{p.customer_name}</p>
                          <p className="text-xs text-gray-400">{p.customer_email}</p>
                        </td>
                        <td className="py-3 px-4 font-bold text-brand-dark">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="py-3 px-4">
                          {isMock ? (
                            <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                              {p.payment_method === 'mock_card' ? 'Simulated Card' : 'Simulated MoMo'}
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-gray-700 capitalize">
                              {p.payment_method.replace('_', ' ')}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs font-medium text-gray-600 capitalize">
                          {p.payment_type.replace('_', ' ')}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={p.payment_status} type="payment" />
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-500">
                          {formatDateTime(p.created_at)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedBookingId(p.booking_id)}
                            className="inline-flex items-center gap-1 text-xs text-brand-green font-semibold hover:underline"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Invoice
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* Deposits Tab */
          deposits.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <AlertCircle className="w-10 h-10 mx-auto text-gray-400 mb-2" />
              <p className="font-semibold text-gray-700">No security deposit records found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Deposit ID</th>
                    <th className="py-3 px-4">Booking</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Held Amount</th>
                    <th className="py-3 px-4">Refunded</th>
                    <th className="py-3 px-4">Deducted</th>
                    <th className="py-3 px-4">Escrow Status</th>
                    <th className="py-3 px-4">Deduction Reason</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {deposits.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50/80 transition">
                      <td className="py-3 px-4 font-mono font-medium text-gray-600">
                        DEP-#{d.id}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-semibold bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                          {d.booking_code}
                        </span>
                        <p className="text-xs text-gray-500 mt-0.5">{d.vehicle_name}</p>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {d.customer_name}
                      </td>
                      <td className="py-3 px-4 font-bold text-amber-600">
                        {formatCurrency(d.amount)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-emerald-600">
                        {parseFloat(d.refunded_amount || 0) > 0 ? formatCurrency(d.refunded_amount) : '—'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-rose-600">
                        {parseFloat(d.deducted_amount || 0) > 0 ? formatCurrency(d.deducted_amount) : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={d.status} type="deposit" />
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500 max-w-xs truncate">
                        {d.deduction_reason || 'No deductions recorded'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedBookingId(d.booking_id)}
                          className="inline-flex items-center gap-1 text-xs text-brand-green font-semibold hover:underline"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Invoice
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Itemized Invoice Modal */}
      {selectedBookingId && (
        <InvoiceModal
          bookingId={selectedBookingId}
          onClose={() => setSelectedBookingId(null)}
        />
      )}
    </div>
  );
}

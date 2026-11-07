import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  FileCheck2,
  ExternalLink,
  CheckCircle,
  XCircle,
  UserCheck,
  UserX,
  AlertCircle,
  Eye,
  Mail,
  Phone
} from 'lucide-react';
import api from '../../services/api';
import { formatVND, formatDateTime } from '../../utils/formatters';
import StatusBadge from '../../components/common/StatusBadge';
import { useNotifications } from '../../context/NotificationContext';

export default function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [verifFilter, setVerifFilter] = useState('');
  const { showToast } = useNotifications();

  // Document Verification Reject Modal
  const [rejectModalCustomer, setRejectModalCustomer] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  // Customer Details Modal
  const [detailsCustomer, setDetailsCustomer] = useState(null);

  useEffect(() => {
    loadCustomers();
  }, [search, statusFilter, verifFilter]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (verifFilter) params.set('verification_status', verifFilter);

      const res = await api.get(`/customers/all?${params.toString()}`);
      if (res.success) {
        setCustomers(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDocument = async (c) => {
    if (!window.confirm(`Approve ID verification document for ${c.full_name}?`)) {
      return;
    }

    try {
      const res = await api.post(`/customers/${c.id}/verify-document`, { status: 'approved' });
      if (res.success) {
        showToast(`Document approved for ${c.full_name}. Customer is now verified!`, 'success');
        loadCustomers();
      }
    } catch (err) {
      showToast(err.message || 'Verification approval failed', 'error');
    }
  };

  const handleRejectDocument = async () => {
    if (!rejectModalCustomer) return;
    setProcessing(true);
    try {
      const res = await api.post(`/customers/${rejectModalCustomer.id}/verify-document`, {
        status: 'rejected',
        rejection_reason: rejectReason || 'Document photo unreadable or blurry'
      });
      if (res.success) {
        showToast(`Document rejected. Feedback sent to customer.`, 'info');
        setRejectModalCustomer(null);
        setRejectReason('');
        loadCustomers();
      }
    } catch (err) {
      showToast(err.message || 'Action failed.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleAccountStatus = async (c) => {
    const nextStatus = c.status === 'active' ? 'inactive' : 'active';
    if (!window.confirm(`Change account status of ${c.full_name} to ${nextStatus.toUpperCase()}?`)) {
      return;
    }

    try {
      const res = await api.post(`/customers/${c.id}/status`, { status: nextStatus });
      if (res.success) {
        showToast(res.message, 'success');
        loadCustomers();
      }
    } catch (err) {
      showToast(err.message || 'Status toggle failed.', 'error');
    }
  };

  const viewSecureDocument = (c) => {
    window.open(`/api/customers/${c.id}/document`, '_blank');
  };

  const openCustomerDetails = async (c) => {
    try {
      const res = await api.get(`/customers/${c.id}`);
      if (res.success) {
        setDetailsCustomer(res.data);
      }
    } catch (err) {
      showToast('Failed to load customer profile details', 'error');
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-primary">Customer Management</h1>
          <p className="text-xs text-slate-500">
            Inspect customer accounts, review and approve identity verification documents securely, and track booking history.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, email, or phone..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-secondary shadow-sm"
          />
        </div>

        <select
          value={verifFilter}
          onChange={(e) => setVerifFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:outline-none focus:border-secondary shadow-sm"
        >
          <option value="">All Document Statuses</option>
          <option value="pending">Pending Verification</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:outline-none focus:border-secondary shadow-sm"
        >
          <option value="">All Account Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading customers...</div>
        ) : customers.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">No customers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="py-3.5 px-5">Customer</th>
                  <th className="py-3.5 px-5">Contact Details</th>
                  <th className="py-3.5 px-5">ID Document</th>
                  <th className="py-3.5 px-5">Trips & Spent</th>
                  <th className="py-3.5 px-5">Account Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-secondary/15 text-secondary font-bold flex items-center justify-center shrink-0">
                          {c.full_name?.charAt(0) || 'C'}
                        </div>
                        <div>
                          <span className="font-bold text-primary block">{c.full_name}</span>
                          <span className="text-[10px] text-slate-400">Member since {formatDateTime(c.created_at)}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-5 space-y-0.5">
                      <div className="text-slate-800">{c.email}</div>
                      <div className="text-slate-400 text-[11px]">{c.phone || 'No phone'}</div>
                    </td>

                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={c.document_verification_status} />
                        {c.has_document && (
                          <button
                            onClick={() => viewSecureDocument(c)}
                            className="p-1 text-slate-400 hover:text-primary rounded hover:bg-slate-100 transition-colors"
                            title="Inspect Secure Document"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-800">{c.total_bookings} Bookings</div>
                      <span className="text-[10px] text-secondary font-bold block">{formatVND(c.total_spent)} spent</span>
                    </td>

                    <td className="py-4 px-5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        c.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {c.status}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Document Verification Actions */}
                        {c.has_document && c.document_verification_status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveDocument(c)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm flex items-center gap-1"
                              title="Approve ID"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => setRejectModalCustomer(c)}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[11px] flex items-center gap-1"
                              title="Reject ID"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => openCustomerDetails(c)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                          title="View Customer Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleToggleAccountStatus(c)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            c.status === 'active'
                              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          }`}
                          title={c.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
                        >
                          {c.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
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

      {/* Reject Document Modal */}
      {rejectModalCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="font-black text-primary text-base">Reject Document for {rejectModalCustomer.full_name}</h3>
            <p className="text-xs text-slate-500">Provide an exact reason so the customer can upload a corrected copy.</p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Rejection Reason</label>
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Document photo is blurry / expired license / name does not match..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-400 bg-slate-50"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalCustomer(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={handleRejectDocument}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-md"
              >
                {processing ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Details Modal */}
      {detailsCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-primary text-base">Customer Profile: {detailsCustomer.full_name}</h3>
              <button
                onClick={() => setDetailsCustomer(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-bgLight p-4 rounded-2xl">
              <div>Email: <strong>{detailsCustomer.email}</strong></div>
              <div>Phone: <strong>{detailsCustomer.phone || 'None'}</strong></div>
              <div>Address: <strong>{detailsCustomer.address || 'None'}</strong></div>
              <div>Account Status: <strong className="capitalize">{detailsCustomer.status}</strong></div>
              <div>
                ID Verification: <StatusBadge status={detailsCustomer.document_verification_status} />
              </div>
              {detailsCustomer.has_document && (
                <div>
                  <button
                    onClick={() => viewSecureDocument(detailsCustomer)}
                    className="text-secondary font-bold underline flex items-center gap-1"
                  >
                    <span>View Stored Document</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Booking History */}
            <div>
              <h4 className="font-bold text-xs text-primary uppercase tracking-wider mb-2">
                Booking History ({detailsCustomer.bookings?.length || 0})
              </h4>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {detailsCustomer.bookings?.map((b) => (
                  <div key={b.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50 text-xs flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-800">{b.booking_code} — {b.vehicle_name}</div>
                      <div className="text-[11px] text-slate-400">{formatDateTime(b.pickup_datetime)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-secondary">{formatVND(b.total_amount)}</div>
                      <StatusBadge status={b.booking_status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setDetailsCustomer(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Calendar,
  User,
  Activity,
  Code,
  X
} from 'lucide-react';
import api from '../../services/api';
import { formatDateTime } from '../../utils/formatters';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const [selectedDetails, setSelectedDetails] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterAction) params.action = filterAction;
      if (filterEntity) params.entity_type = filterEntity;

      const res = await api.get('/settings/audit-logs/all', { params });
      if (res.success) {
        setLogs(res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterAction, filterEntity]);

  const parseDetails = (details) => {
    if (!details) return null;
    if (typeof details === 'object') return details;
    try {
      return JSON.parse(details);
    } catch (e) {
      return { raw: details };
    }
  };

  const getActionColor = (action) => {
    if (action.includes('RETURN') || action.includes('CONFIRM') || action.includes('APPROVE') || action.includes('COMPLETE')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (action.includes('PICKUP') || action.includes('SCHEDULE') || action.includes('CREATE')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (action.includes('CANCEL') || action.includes('REJECT') || action.includes('DELETE')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (action.includes('VERIF') || action.includes('PAYMENT')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">System Audit & Compliance Logs</h1>
          <p className="text-sm text-gray-500">
            Immutable tracking record of all administrative overrides, customer actions, and financial transactions.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stream
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5 text-gray-500 font-medium">
            <Filter className="w-4 h-4" />
            Filter Logs:
          </div>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-green bg-white"
          >
            <option value="">All Actions</option>
            <option value="BOOKING_CONFIRM">BOOKING_CONFIRM</option>
            <option value="RENTAL_PICKUP">RENTAL_PICKUP</option>
            <option value="RENTAL_RETURN">RENTAL_RETURN</option>
            <option value="EXTENSION_APPROVE">EXTENSION_APPROVE</option>
            <option value="EXTENSION_REJECT">EXTENSION_REJECT</option>
            <option value="CUSTOMER_VERIFIED">CUSTOMER_VERIFIED</option>
            <option value="CUSTOMER_DOC_REJECTED">CUSTOMER_DOC_REJECTED</option>
            <option value="MAINTENANCE_SCHEDULE">MAINTENANCE_SCHEDULE</option>
            <option value="MAINTENANCE_COMPLETE">MAINTENANCE_COMPLETE</option>
            <option value="PAYMENT_PROCESS">PAYMENT_PROCESS</option>
            <option value="SETTING_UPDATE">SETTING_UPDATE</option>
          </select>

          <select
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-green bg-white"
          >
            <option value="">All Entity Types</option>
            <option value="BOOKINGS">BOOKINGS</option>
            <option value="VEHICLES">VEHICLES</option>
            <option value="USERS">USERS</option>
            <option value="PAYMENTS">PAYMENTS</option>
            <option value="BOOKING_EXTENSIONS">BOOKING_EXTENSIONS</option>
            <option value="VEHICLE_MAINTENANCE">VEHICLE_MAINTENANCE</option>
            <option value="SYSTEM_SETTINGS">SYSTEM_SETTINGS</option>
          </select>

          {(filterAction || filterEntity) && (
            <button
              onClick={() => {
                setFilterAction('');
                setFilterEntity('');
              }}
              className="text-xs text-rose-600 hover:underline font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>

        <p className="text-xs text-gray-500">
          Showing <strong>{logs.length}</strong> latest recorded events
        </p>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-green" />
            <p>Loading audit ledger...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <ShieldAlert className="w-10 h-10 mx-auto text-gray-400 mb-2" />
            <p className="font-semibold text-gray-700">No audit records found</p>
            <p className="text-sm">Administrative actions and system events will appear here in real time.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Log ID</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Client IP</th>
                  <th className="py-3 px-4 text-right">Payload Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-3 px-4 font-mono text-xs text-gray-500">
                      #{log.id}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-600 whitespace-nowrap">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border ${getActionColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-brand-dark text-xs">
                        {log.entity_type}
                      </div>
                      {log.entity_id && (
                        <div className="text-xs text-gray-400 font-mono">
                          ID: {log.entity_id}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {log.user_name ? (
                        <div>
                          <p className="font-medium text-gray-900 text-xs">{log.user_name}</p>
                          <p className="text-[11px] text-gray-400">{log.user_email}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">System Auto</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-gray-500">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {log.details ? (
                        <button
                          onClick={() => setSelectedDetails({ log, parsed: parseDetails(log.details) })}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-brand-green bg-emerald-50 rounded-lg hover:bg-emerald-100 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View JSON
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* JSON Inspection Modal */}
      {selectedDetails && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-brand-green" />
                <h3 className="text-lg font-bold text-brand-dark">Audit Event Payload Inspection</h3>
              </div>
              <button
                onClick={() => setSelectedDetails(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 grid grid-cols-2 gap-2 text-xs text-gray-600">
              <p>
                <strong>Action:</strong> <span className="font-mono text-brand-dark">{selectedDetails.log.action}</span>
              </p>
              <p>
                <strong>Entity:</strong> {selectedDetails.log.entity_type} #{selectedDetails.log.entity_id}
              </p>
              <p>
                <strong>Actor:</strong> {selectedDetails.log.user_name || 'System'}
              </p>
              <p>
                <strong>Timestamp:</strong> {formatDateTime(selectedDetails.log.created_at)}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-700 mb-1">State & Changes Data:</p>
              <pre className="bg-gray-900 text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-80">
                {JSON.stringify(selectedDetails.parsed, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedDetails(null)}
                className="px-4 py-2 bg-brand-dark text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

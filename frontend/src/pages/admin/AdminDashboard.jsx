import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  CalendarCheck,
  Users,
  Bike,
  Clock,
  Wrench,
  TrendingUp,
  Percent,
  CheckCircle2,
  FileText,
  ArrowRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import api from '../../services/api';
import { formatVND, formatDateTime } from '../../utils/formatters';
import StatusBadge from '../../components/common/StatusBadge';
import InvoiceModal from '../../components/common/InvoiceModal';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await api.get('/analytics/dashboard');
        if (res.success) {
          setData(res);
        }
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading operations analytics...</div>;
  }

  if (!data) {
    return <div className="py-20 text-center text-xs text-rose-500">Failed to load analytics data.</div>;
  }

  const { kpis, charts, recent_bookings } = data;

  const COLORS = ['#20B875', '#142B45', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-8">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-primary">Operations & Analytics</h1>
          <p className="text-xs text-slate-500">Live operational metrics computed directly from database tables.</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/console"
            className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary-hover text-white text-xs font-bold shadow-md shadow-secondary/20 transition-all"
          >
            Open Pickup & Return Console
          </Link>
        </div>
      </div>

      {/* 14.1 Summary Cards (8 KPI Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Total Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-secondary flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-primary mt-2">
            {formatVND(kpis.total_revenue)}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Paid rental fees</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Total Bookings</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-primary mt-2">
            {kpis.total_bookings}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Lifetime reservations</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Total Customers</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-primary mt-2">
            {kpis.total_customers}
          </div>
          <span className="text-[11px] text-amber-600 font-semibold mt-1 block">
            {kpis.pending_verifications} pending verification
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Fleet Utilization</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-600 mt-2">
            {kpis.utilization_rate}%
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {kpis.rented_vehicles} of {kpis.total_vehicles} currently rented
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Available Vehicles</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-secondary flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-secondary mt-2">
            {kpis.available_vehicles}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Ready at stations</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Currently Rented</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Bike className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-600 mt-2">
            {kpis.rented_vehicles}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Active on trip</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Pending Bookings</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 mt-2">
            {kpis.pending_bookings}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Need confirmation</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Under Maintenance</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600 mt-2">
            {kpis.maintenance_vehicles}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">In workshop</span>
        </div>

      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Daily Revenue Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-primary">Daily Revenue Trend</h3>
            <span className="text-xs font-semibold text-slate-400">Past 14 Days</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.revenue_by_day}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#20B875" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#20B875" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={(value) => [formatVND(value), 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#20B875" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Monthly Revenue Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-primary">Monthly Revenue Comparison</h3>
            <span className="text-xs font-semibold text-slate-400">Past 6 Months</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.revenue_by_month}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={(value) => [formatVND(value), 'Revenue']} />
                <Bar dataKey="revenue" fill="#142B45" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Top Rented Vehicles Popularity */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-primary">Most Rented Vehicles</h3>
            <span className="text-xs font-semibold text-slate-400">By Trip Volume</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.vehicle_popularity} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis type="number" stroke="#94A3B8" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={10} width={100} />
                <Tooltip formatter={(value) => [`${value} Bookings`, 'Total']} />
                <Bar dataKey="booking_count" fill="#20B875" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Booking Status Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-primary">Booking Status Breakdown</h3>
            <span className="text-xs font-semibold text-slate-400">All Time</span>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.status_distribution}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {charts.status_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Recent Bookings Queue Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-primary">Recent Bookings Queue</h3>
            <p className="text-xs text-slate-500">Live feed of new incoming reservations.</p>
          </div>
          <Link
            to="/admin/bookings"
            className="text-xs font-bold text-secondary hover:underline flex items-center gap-1"
          >
            <span>Manage All Bookings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4 text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {recent_bookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-primary">{b.booking_code}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">{b.customer_name}</td>
                  <td className="py-3.5 px-4 text-slate-700">{b.vehicle_name}</td>
                  <td className="py-3.5 px-4 text-slate-500">{formatDateTime(b.pickup_datetime)}</td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={b.booking_status} />
                  </td>
                  <td className="py-3.5 px-4 font-bold text-secondary">{formatVND(b.total_amount)}</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedInvoiceId(b.id)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors inline-flex items-center gap-1 text-[11px] font-bold"
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

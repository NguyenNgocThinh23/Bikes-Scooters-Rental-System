import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bike,
  CalendarDays,
  KeyRound,
  RotateCcw,
  Users,
  CreditCard,
  Wrench,
  Settings,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  ArrowLeft,
  FileCheck2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navSections = [
    {
      group: 'Overview',
      items: [
        { name: 'Analytics & KPIs', path: '/admin', icon: BarChart3, exact: true }
      ]
    },
    {
      group: 'Rental Operations',
      items: [
        { name: 'Fleet Management', path: '/admin/vehicles', icon: Bike },
        { name: 'Bookings Queue', path: '/admin/bookings', icon: CalendarDays },
        { name: 'Pickup & Return Console', path: '/admin/console', icon: KeyRound },
        { name: 'Extension Requests', path: '/admin/extensions', icon: RotateCcw }
      ]
    },
    {
      group: 'Customers & Finance',
      items: [
        { name: 'Customer Verification', path: '/admin/customers', icon: Users },
        { name: 'Payments & Deposits', path: '/admin/payments', icon: CreditCard }
      ]
    },
    {
      group: 'Fleet Health & System',
      items: [
        { name: 'Maintenance Scheduler', path: '/admin/maintenance', icon: Wrench },
        { name: 'System Settings', path: '/admin/settings', icon: Settings },
        { name: 'Audit Logs', path: '/admin/audit-logs', icon: ShieldCheck }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Admin Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0C1C2E] text-slate-300 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        {/* Header */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-slate-800">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-secondary text-primary font-black flex items-center justify-center shadow-lg shadow-secondary/20">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="text-xl font-black text-white tracking-tight">
                Ride<span className="text-secondary">Now</span>
              </span>
              <span className="block text-[10px] uppercase font-extrabold tracking-widest text-secondary">
                Admin Console
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin User Info */}
        <div className="px-6 py-4 bg-slate-900/50 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs border border-emerald-500/30">
              ADM
            </div>
            <div className="overflow-hidden">
              <h5 className="text-xs font-bold text-white truncate">{user?.full_name || 'Administrator'}</h5>
              <p className="text-[11px] text-slate-400 truncate">Super Admin</p>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 px-4 py-4 space-y-6 overflow-y-auto">
          {navSections.map((sec, idx) => (
            <div key={idx}>
              <h4 className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                {sec.group}
              </h4>
              <nav className="space-y-1">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      end={item.exact}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                          isActive
                            ? 'bg-secondary text-primary shadow-md font-extrabold'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-800 bg-[#0A1624]">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>View Public Website</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold text-slate-500 hidden sm:inline">
              RideNow Fleet Management & Operations Platform
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-semibold text-slate-600">Database Connected (MySQL)</span>
            </div>
          </div>
        </header>

        {/* Page View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  Bike,
  History,
  CreditCard,
  User,
  Bell,
  LogOut,
  ChevronRight,
  Menu,
  X,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export default function CustomerLayout() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { name: 'Dashboard Overview', path: '/customer', icon: LayoutDashboard, exact: true },
    { name: 'My Bookings', path: '/customer/my-bookings', icon: CalendarCheck },
    { name: 'Active Rentals', path: '/customer/active-rentals', icon: Bike },
    { name: 'Rental History', path: '/customer/rental-history', icon: History },
    { name: 'Payment History', path: '/customer/payment-history', icon: CreditCard },
    { name: 'My Profile', path: '/customer/profile', icon: User },
    { name: 'Notifications', path: '/customer/notifications', icon: Bell, badge: unreadCount }
  ];

  return (
    <div className="min-h-screen bg-bgLight flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-primary text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        {/* Brand Header */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-slate-800">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-primary font-bold shadow-md">
              <Bike className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-black text-white">
              Ride<span className="text-secondary">Now</span>
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer Profile Pill */}
        <div className="px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary/20 border border-secondary/40 text-secondary font-bold flex items-center justify-center text-sm">
              {user?.full_name?.charAt(0) || 'C'}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-bold text-white truncate">{user?.full_name || 'Customer'}</h4>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.exact}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-secondary text-white shadow-md shadow-secondary/20 font-bold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.name}</span>
                </div>
                {item.badge > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link
            to="/explore"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-secondary/15 text-secondary hover:bg-secondary hover:text-white text-xs font-bold transition-all"
          >
            <span>+ Book New Ride</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link to="/" className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to RideNow Public Website</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/customer/notifications"
              className="relative p-2 rounded-xl text-slate-500 hover:text-primary hover:bg-slate-50 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Link>
            <Link
              to="/customer/profile"
              className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-primary"
            >
              <span className="hidden sm:inline">{user?.full_name}</span>
              <div className="w-8 h-8 rounded-full bg-secondary/15 text-secondary flex items-center justify-center font-bold">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
            </Link>
          </div>
        </header>

        {/* Page Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

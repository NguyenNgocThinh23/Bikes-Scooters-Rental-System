import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import CustomerLayout from './layouts/CustomerLayout';
import AdminLayout from './layouts/AdminLayout';

// Common Components
import ProtectedRoute from './components/common/ProtectedRoute';

// Public Pages
import Home from './pages/public/Home';
import ExploreVehicles from './pages/public/ExploreVehicles';
import VehicleDetails from './pages/public/VehicleDetails';
import HowItWorks from './pages/public/HowItWorks';
import Pricing from './pages/public/Pricing';
import AboutUs from './pages/public/AboutUs';
import Contact from './pages/public/Contact';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import ForgotPassword from './pages/public/ForgotPassword';

// Customer Pages
import DashboardHome from './pages/customer/DashboardHome';
import MyBookings from './pages/customer/MyBookings';
import ActiveRentals from './pages/customer/ActiveRentals';
import RentalHistory from './pages/customer/RentalHistory';
import PaymentHistory from './pages/customer/PaymentHistory';
import MyProfile from './pages/customer/MyProfile';
import CustomerNotifications from './pages/customer/CustomerNotifications';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import VehicleManagement from './pages/admin/VehicleManagement';
import BookingManagement from './pages/admin/BookingManagement';
import RentalConsole from './pages/admin/RentalConsole';
import ExtensionRequests from './pages/admin/ExtensionRequests';
import CustomerManagement from './pages/admin/CustomerManagement';
import PaymentManagement from './pages/admin/PaymentManagement';
import MaintenanceScheduler from './pages/admin/MaintenanceScheduler';
import SystemSettings from './pages/admin/SystemSettings';
import AuditLogs from './pages/admin/AuditLogs';

// 404 Component
function NotFound() {
  return (
    <div className="min-h-screen bg-bgLight flex items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-4">
        <div className="text-7xl font-black text-secondary">404</div>
        <h1 className="text-2xl font-bold text-primary">Page Not Found</h1>
        <p className="text-sm text-slate-500">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-secondary hover:bg-secondary-hover text-white text-sm font-bold rounded-2xl shadow-lg shadow-secondary/20 transition-all"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* 1. Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/vehicles" element={<ExploreVehicles />} />
        <Route path="/vehicles/:id" element={<VehicleDetails />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      {/* 2. Customer Dashboard Routes (Protected) */}
      <Route
        path="/customer"
        element={
          <ProtectedRoute>
            <CustomerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="dashboard" element={<DashboardHome />} />
        <Route path="my-bookings" element={<MyBookings />} />
        <Route path="bookings" element={<Navigate to="/customer/my-bookings" replace />} />
        <Route path="active-rentals" element={<ActiveRentals />} />
        <Route path="rental-history" element={<RentalHistory />} />
        <Route path="payment-history" element={<PaymentHistory />} />
        <Route path="profile" element={<MyProfile />} />
        <Route path="notifications" element={<CustomerNotifications />} />
      </Route>

      {/* 3. Admin Dashboard Routes (Protected: Admin Only) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="vehicles" element={<VehicleManagement />} />
        <Route path="bookings" element={<BookingManagement />} />
        <Route path="console" element={<RentalConsole />} />
        <Route path="extensions" element={<ExtensionRequests />} />
        <Route path="customers" element={<CustomerManagement />} />
        <Route path="payments" element={<PaymentManagement />} />
        <Route path="maintenance" element={<MaintenanceScheduler />} />
        <Route path="settings" element={<SystemSettings />} />
        <Route path="audit-logs" element={<AuditLogs />} />
      </Route>

      {/* 4. Fallback 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ requireRole = null, children }) {
  const { user, isAuthenticated, loading, isAdmin, isCustomer } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bgLight">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">Checking authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireRole === 'admin' && !isAdmin) {
    return <Navigate to="/customer/dashboard" replace />;
  }

  return children ? children : <Outlet />;
}

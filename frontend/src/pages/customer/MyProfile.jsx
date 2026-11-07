import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Upload,
  FileCheck2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

export default function MyProfile() {
  const { user, updateUser, token } = useAuth();
  const { showToast } = useNotifications();

  // Profile Edit Form
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password Change Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  // Document Upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docError, setDocError] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const res = await api.put('/auth/profile', {
        full_name: fullName,
        phone,
        address
      });
      if (res.success) {
        updateUser(res.user);
        showToast('Profile information updated successfully.', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassError('');

    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setPassError('New password must be at least 6 characters.');
      return;
    }

    setChangingPass(true);
    try {
      const res = await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      if (res.success) {
        showToast('Password changed successfully.', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setPassError(err.message || 'Failed to change password.');
    } finally {
      setChangingPass(false);
    }
  };

  const handleDocumentUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setDocError('Please select a file to upload.');
      return;
    }

    // Client-side file validation
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(selectedFile.type)) {
      setDocError('Invalid file type. Only JPG, PNG, and PDF files are allowed.');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setDocError('File size exceeds the 5MB limit.');
      return;
    }

    setDocError('');
    setUploadingDoc(true);

    const formData = new FormData();
    formData.append('document', selectedFile);

    try {
      const res = await fetch('/api/customers/upload-document', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        showToast('Verification document uploaded! Status: Pending verification.', 'success');
        updateUser({
          document_verification_status: 'pending',
          document_rejection_reason: null,
          has_document: true
        });
        setSelectedFile(null);
      } else {
        setDocError(data.message || 'Upload failed.');
      }
    } catch (err) {
      setDocError(err.message || 'Upload failed.');
    } finally {
      setUploadingDoc(false);
    }
  };

  const viewSecureDocument = () => {
    window.open(`/api/customers/${user?.id}/document`, '_blank');
  };

  return (
    <div className="space-y-8 max-w-4xl">
      
      <div>
        <h1 className="text-2xl font-black text-primary">My Profile & Security</h1>
        <p className="text-xs text-slate-500">Manage your identity details, document verification, and password.</p>
      </div>

      {/* 1. Identity Verification Document Box */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-primary flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-secondary" />
              <span>Identity Verification Document</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Required for all vehicle handovers and rentals.</p>
          </div>
          <StatusBadge status={user?.document_verification_status || 'pending'} />
        </div>

        {/* Verification Status Details */}
        {user?.document_verification_status === 'approved' ? (
          <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold">Identity Verified & Approved!</span>
                <p className="text-[11px] text-emerald-700">You are fully cleared to rent all bicycles, e-bikes, and scooters.</p>
              </div>
            </div>
            <button
              onClick={viewSecureDocument}
              className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 font-bold text-xs text-emerald-800 hover:bg-emerald-100 flex items-center gap-1 shadow-sm"
            >
              <span>View Document</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : user?.document_verification_status === 'rejected' ? (
          <div className="p-4 rounded-2xl bg-rose-50 text-rose-800 text-xs border border-rose-200 space-y-2">
            <div className="flex items-center gap-2.5 font-bold">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
              <span>Document Verification Rejected</span>
            </div>
            <p className="text-xs text-rose-700">
              Reason: <strong>{user?.document_rejection_reason || 'Photo unclear or expired'}</strong>. Please upload a clear photo of your ID or Driver's License below.
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-amber-50 text-amber-800 text-xs border border-amber-200 flex items-center justify-between">
            <div>
              <span className="font-bold">Verification Pending Administrator Review</span>
              <p className="text-[11px] text-amber-700">Our operations team inspects uploaded documents before handover.</p>
            </div>
            {user?.has_document && (
              <button
                onClick={viewSecureDocument}
                className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 font-bold text-xs text-amber-900 hover:bg-amber-100 flex items-center gap-1 shadow-sm"
              >
                <span>View Uploaded</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Upload form */}
        <form onSubmit={handleDocumentUpload} className="space-y-4 pt-2">
          {docError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{docError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Upload New National ID / Driver's License (JPG, PNG, PDF &lt; 5MB)
            </label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary file:text-white hover:file:bg-primary-light cursor-pointer border border-slate-200 rounded-xl p-1 bg-slate-50"
            />
          </div>

          <button
            type="submit"
            disabled={uploadingDoc || !selectedFile}
            className="px-5 py-2.5 rounded-xl bg-secondary hover:bg-secondary-hover disabled:bg-slate-300 text-white text-xs font-bold transition-all shadow-md shadow-secondary/20 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>{uploadingDoc ? 'Uploading & Verifying File...' : 'Upload Document for Verification'}</span>
          </button>
        </form>
      </div>

      {/* 2. Personal Information */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card space-y-6">
        <h3 className="text-base font-bold text-primary flex items-center gap-2 pb-4 border-b border-slate-100">
          <User className="w-5 h-5 text-secondary" />
          <span>Personal Information</span>
        </h3>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:outline-none focus:border-secondary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-100 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:outline-none focus:border-secondary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Address / City</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:outline-none focus:border-secondary"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={updatingProfile}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-light text-white text-xs font-bold transition-all shadow-sm"
          >
            {updatingProfile ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>

      {/* 3. Change Password */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card space-y-6">
        <h3 className="text-base font-bold text-primary flex items-center gap-2 pb-4 border-b border-slate-100">
          <Lock className="w-5 h-5 text-secondary" />
          <span>Change Password</span>
        </h3>

        {passError && (
          <div className="p-3.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{passError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:outline-none focus:border-secondary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:outline-none focus:border-secondary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-type new password"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:outline-none focus:border-secondary"
            />
          </div>

          <button
            type="submit"
            disabled={changingPass}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-light text-white text-xs font-bold transition-all shadow-sm"
          >
            {changingPass ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import {
  Settings,
  DollarSign,
  Clock,
  Shield,
  Phone,
  Mail,
  MapPin,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import api from '../../services/api';

export default function SystemSettings() {
  const [settingsList, setSettingsList] = useState([]);
  const [settingsMap, setSettingsMap] = useState({});
  const [formData, setFormData] = useState({
    late_fee_hourly_rate: '50000',
    deposit_percentage: '20',
    cancellation_grace_hours: '24',
    support_phone: '+84 28 3823 4567',
    support_email: 'support@ridenow.com',
    office_address: '123 Nguyen Hue Boulevard, District 1, Ho Chi Minh City, Vietnam'
  });

  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [saveAllLoading, setSaveAllLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      if (res.success) {
        setSettingsList(res.settings || []);
        const map = res.map || {};
        setSettingsMap(map);
        setFormData({
          late_fee_hourly_rate: map.late_fee_hourly_rate || '50000',
          deposit_percentage: map.deposit_percentage || '20',
          cancellation_grace_hours: map.cancellation_grace_hours || '24',
          support_phone: map.support_phone || '+84 28 3823 4567',
          support_email: map.support_email || 'support@ridenow.com',
          office_address: map.office_address || '123 Nguyen Hue Boulevard, District 1, Ho Chi Minh City, Vietnam'
        });
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleFieldChange = (key, val) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  const handleSaveIndividual = async (key) => {
    try {
      setSavingKey(key);
      const res = await api.put(`/settings/${key}`, { value: formData[key] });
      if (res.success) {
        setFeedback({ type: 'success', text: `Setting '${key}' saved successfully.` });
        fetchSettings();
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update setting' });
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveAll = async (e) => {
    e.preventDefault();
    try {
      setSaveAllLoading(true);
      const keys = Object.keys(formData);
      for (const k of keys) {
        await api.put(`/settings/${k}`, { value: formData[k] });
      }
      setFeedback({ type: 'success', text: 'All system settings have been saved and applied.' });
      fetchSettings();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to save all settings' });
    } finally {
      setSaveAllLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">System Configuration & Policies</h1>
          <p className="text-sm text-gray-500">
            Control dynamic rental fee multipliers, deposit security rates, and company contact details.
          </p>
        </div>
        <button
          onClick={fetchSettings}
          className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Reload
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Overview Notice */}
      <div className="bg-brand-surface border border-emerald-100 p-4 rounded-2xl flex items-start gap-3">
        <Info className="w-5 h-5 text-brand-green flex-shrink-0 mt-0.5" />
        <div className="text-xs text-brand-dark space-y-1">
          <p className="font-semibold text-sm">Dynamic Calculation Rules</p>
          <p>
            Changes to the <strong>Late Fee Hourly Rate</strong> and <strong>Deposit Percentage</strong> take effect immediately
            for all subsequent bookings, returns, and extensions generated across the platform. Existing closed rentals maintain historical audit values.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* Section 1: Rental & Fee Policies */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-lg font-bold text-brand-dark flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-brand-green" />
              Rental, Late Fee & Deposit Rules
            </h2>
            <p className="text-xs text-gray-500">Fine-tune the automated rate calculators used during return inspection</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Late Fee */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Late Return Hourly Fee (VND / Hour)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={formData.late_fee_hourly_rate}
                  onChange={(e) => handleFieldChange('late_fee_hourly_rate', e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-green font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleSaveIndividual('late_fee_hourly_rate')}
                  disabled={savingKey === 'late_fee_hourly_rate'}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save
                </button>
              </div>
              <p className="text-xs text-gray-400">
                Applied automatically in the Return Console when actual return time exceeds the 30-minute grace period.
              </p>
            </div>

            {/* Deposit Percentage */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Security Deposit Percentage (%)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.deposit_percentage}
                  onChange={(e) => handleFieldChange('deposit_percentage', e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-green font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleSaveIndividual('deposit_percentage')}
                  disabled={savingKey === 'deposit_percentage'}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save
                </button>
              </div>
              <p className="text-xs text-gray-400">
                Percentage of the base rental total held as a security deposit during the active rental period.
              </p>
            </div>

            {/* Cancellation Grace Period */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Free Cancellation Grace Period (Hours)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  max="168"
                  value={formData.cancellation_grace_hours}
                  onChange={(e) => handleFieldChange('cancellation_grace_hours', e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-green font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleSaveIndividual('cancellation_grace_hours')}
                  disabled={savingKey === 'cancellation_grace_hours'}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save
                </button>
              </div>
              <p className="text-xs text-gray-400">
                Minimum advance hours before pickup allowing customers full cancellation without penalty.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Contact & Company Profile */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-lg font-bold text-brand-dark flex items-center gap-2">
              <Phone className="w-5 h-5 text-brand-green" />
              Company Details & Customer Support
            </h2>
            <p className="text-xs text-gray-500">Contact information printed on invoices and displayed across the public portal</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Phone */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Support Hotline Phone</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.support_phone}
                  onChange={(e) => handleFieldChange('support_phone', e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-green"
                />
                <button
                  type="button"
                  onClick={() => handleSaveIndividual('support_phone')}
                  disabled={savingKey === 'support_phone'}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save
                </button>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Official Support Email</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={formData.support_email}
                  onChange={(e) => handleFieldChange('support_email', e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-green"
                />
                <button
                  type="button"
                  onClick={() => handleSaveIndividual('support_email')}
                  disabled={savingKey === 'support_email'}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save
                </button>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700">HQ Office Address</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.office_address}
                  onChange={(e) => handleFieldChange('office_address', e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-green"
                />
                <button
                  type="button"
                  onClick={() => handleSaveIndividual('office_address')}
                  disabled={savingKey === 'office_address'}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Global Save Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={fetchSettings}
            className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-semibold"
          >
            Reset Changes
          </button>
          <button
            type="submit"
            disabled={saveAllLoading}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-green text-white font-bold rounded-xl hover:bg-emerald-600 transition shadow-sm text-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saveAllLoading ? 'Saving All...' : 'Save All Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Bike,
  User,
  Wrench,
  Search,
  DollarSign
} from 'lucide-react';
import api from '../../services/api';
import { formatVND, formatDateTime } from '../../utils/formatters';
import StatusBadge from '../../components/common/StatusBadge';
import { useNotifications } from '../../context/NotificationContext';

export default function RentalConsole() {
  const [activeTab, setActiveTab] = useState('pickup');
  const [confirmedBookings, setConfirmedBookings] = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useNotifications();

  // Handover (Pickup) Action Modal State
  const [pickupModalBooking, setPickupModalBooking] = useState(null);
  const [pickupDateTime, setPickupDateTime] = useState(() => new Date().toISOString().slice(0, 16));
  const [pickupNotes, setPickupNotes] = useState('Vehicle inspected and handed over in excellent condition with 1 helmet and lock.');
  const [processingPickup, setProcessingPickup] = useState(false);

  // Return Action Modal State
  const [returnModalBooking, setReturnModalBooking] = useState(null);
  const [actualReturnTime, setActualReturnTime] = useState(() => new Date().toISOString().slice(0, 16));
  const [inspectionCondition, setInspectionCondition] = useState('good');
  const [damagesFound, setDamagesFound] = useState('');
  const [damageFee, setDamageFee] = useState('0');
  const [returnNotes, setReturnNotes] = useState('Vehicle returned in good working order. Helmet and lock accounted for.');
  const [nextVehicleStatus, setNextVehicleStatus] = useState('available');
  const [processingReturn, setProcessingReturn] = useState(false);

  useEffect(() => {
    loadConsoleData();
  }, []);

  const loadConsoleData = async () => {
    setLoading(true);
    try {
      const [confRes, actRes] = await Promise.all([
        api.get('/bookings/all?status=confirmed'),
        api.get('/bookings/all?status=active')
      ]);
      if (confRes.success) setConfirmedBookings(confRes.data);
      if (actRes.success) setActiveBookings(actRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openPickupModal = (b) => {
    setPickupModalBooking(b);
    setPickupDateTime(new Date().toISOString().slice(0, 16));
    setPickupNotes('Vehicle inspected and handed over with 1 helmet and lock.');
  };

  const handleExecutePickup = async (e) => {
    e.preventDefault();
    if (!pickupModalBooking) return;
    setProcessingPickup(true);

    try {
      const res = await api.post('/returns/pickup', {
        booking_id: pickupModalBooking.id,
        actual_pickup_datetime: pickupDateTime,
        pickup_notes: pickupNotes
      });

      if (res.success) {
        showToast(`Vehicle handed over! Booking ${pickupModalBooking.booking_code} is now ACTIVE. Vehicle status set to RENTED.`, 'success');
        setPickupModalBooking(null);
        loadConsoleData();
      }
    } catch (err) {
      showToast(err.message || 'Pickup processing failed.', 'error');
    } finally {
      setProcessingPickup(false);
    }
  };

  const openReturnModal = (b) => {
    setReturnModalBooking(b);
    setActualReturnTime(new Date().toISOString().slice(0, 16));
    setInspectionCondition('good');
    setDamagesFound('');
    setDamageFee('0');
    setReturnNotes('Vehicle returned and inspected. No mechanical defects.');
    setNextVehicleStatus('available');
  };

  const handleExecuteReturn = async (e) => {
    e.preventDefault();
    if (!returnModalBooking) return;
    setProcessingReturn(true);

    try {
      const res = await api.post('/returns/return', {
        booking_id: returnModalBooking.id,
        actual_return_datetime: actualReturnTime,
        inspection_condition: inspectionCondition,
        damages_found: damagesFound,
        damage_fee: parseFloat(damageFee) || 0,
        return_notes: returnNotes,
        next_vehicle_status: nextVehicleStatus
      });

      if (res.success) {
        showToast(`Return completed! Deposit refund: ${formatVND(res.data.deposit_refunded)} (${res.data.deposit_status}). Vehicle status updated to ${res.data.vehicle_status.toUpperCase()}.`, 'success');
        setReturnModalBooking(null);
        loadConsoleData();
      }
    } catch (err) {
      showToast(err.message || 'Return processing failed.', 'error');
    } finally {
      setProcessingReturn(false);
    }
  };

  return (
    <div className="space-y-6">
      
      <div>
        <h1 className="text-2xl font-black text-primary">Rental Pickup & Return Console</h1>
        <p className="text-xs text-slate-500">
          Field technician console to execute vehicle handovers, conduct return inspections, assess damages, and process deposits.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('pickup')}
          className={`py-3 px-6 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'pickup'
              ? 'border-secondary text-primary font-black'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <KeyRound className="w-4 h-4 text-secondary" />
          <span>Vehicle Pickup Queue ({confirmedBookings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('return')}
          className={`py-3 px-6 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'return'
              ? 'border-secondary text-primary font-black'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <RotateCcw className="w-4 h-4 text-secondary" />
          <span>Vehicle Return Inspection Queue ({activeBookings.length})</span>
        </button>
      </div>

      {/* 1. Pickup Tab Content */}
      {activeTab === 'pickup' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Confirmed Bookings Awaiting Handover</span>
            <span className="text-xs text-slate-400 font-semibold">{confirmedBookings.length} vehicles ready for customer</span>
          </div>

          {confirmedBookings.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              No confirmed bookings currently awaiting vehicle pickup.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                  <tr>
                    <th className="py-3 px-5">Booking Code</th>
                    <th className="py-3 px-5">Customer & Contact</th>
                    <th className="py-3 px-5">Vehicle & Station</th>
                    <th className="py-3 px-5">Scheduled Pickup</th>
                    <th className="py-3 px-5">Deposit</th>
                    <th className="py-3 px-5 text-right">Handover Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {confirmedBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-5">
                        <span className="font-bold text-primary block">{b.booking_code}</span>
                        <StatusBadge status="confirmed" />
                      </td>
                      <td className="py-4 px-5">
                        <span className="font-bold text-slate-800 block">{b.customer_name}</span>
                        <span className="text-[10px] text-slate-400">{b.customer_phone || b.customer_email}</span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="font-bold text-slate-800 block">{b.vehicle_name}</span>
                        <span className="text-[10px] text-slate-400">{b.pickup_location_name}</span>
                      </td>
                      <td className="py-4 px-5 text-slate-700 font-semibold">
                        {formatDateTime(b.pickup_datetime)}
                      </td>
                      <td className="py-4 px-5">
                        <span className="font-bold text-slate-800">{formatVND(b.deposit_amount)}</span>
                        <span className="text-[10px] text-amber-600 font-bold block uppercase">{b.deposit_status || 'Held'}</span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => openPickupModal(b)}
                          className="px-3.5 py-2 rounded-xl bg-secondary hover:bg-secondary-hover text-white font-bold text-xs shadow-md shadow-secondary/20 transition-all flex items-center gap-1.5 ml-auto"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Process Handover</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 2. Return Tab Content */}
      {activeTab === 'return' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Active Rentals on the Road</span>
            <span className="text-xs text-slate-400 font-semibold">{activeBookings.length} vehicles out with customers</span>
          </div>

          {activeBookings.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              No vehicles currently out on active rental trips.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                  <tr>
                    <th className="py-3 px-5">Booking Code</th>
                    <th className="py-3 px-5">Customer</th>
                    <th className="py-3 px-5">Vehicle</th>
                    <th className="py-3 px-5">Handover Time</th>
                    <th className="py-3 px-5">Scheduled Return</th>
                    <th className="py-3 px-5 text-right">Return Intake</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {activeBookings.map((b) => {
                    const scheduledReturn = new Date(b.return_datetime);
                    const now = new Date();
                    const isOverdue = now > scheduledReturn;

                    return (
                      <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-5">
                          <span className="font-bold text-primary block">{b.booking_code}</span>
                          <StatusBadge status="active" />
                        </td>
                        <td className="py-4 px-5">
                          <span className="font-bold text-slate-800 block">{b.customer_name}</span>
                          <span className="text-[10px] text-slate-400">{b.customer_phone || b.customer_email}</span>
                        </td>
                        <td className="py-4 px-5">
                          <span className="font-bold text-slate-800 block">{b.vehicle_name}</span>
                          <span className="text-[10px] text-secondary font-bold block">{b.license_plate}</span>
                        </td>
                        <td className="py-4 px-5 text-slate-500">
                          {formatDateTime(b.actual_pickup_datetime || b.pickup_datetime)}
                        </td>
                        <td className="py-4 px-5">
                          <span className={`font-bold block ${isOverdue ? 'text-rose-600' : 'text-slate-800'}`}>
                            {formatDateTime(b.return_datetime)}
                          </span>
                          {isOverdue && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-extrabold bg-rose-100 text-rose-700 uppercase">
                              Overdue
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-5 text-right">
                          <button
                            onClick={() => openReturnModal(b)}
                            className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-light text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 ml-auto"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-secondary" />
                            <span>Inspect & Return</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Handover (Pickup) Modal */}
      {pickupModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-primary text-base">Vehicle Handover: {pickupModalBooking.vehicle_name}</h3>
              <button
                onClick={() => setPickupModalBooking(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                &times;
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-bgLight text-xs space-y-1">
              <div>Customer: <strong>{pickupModalBooking.customer_name}</strong></div>
              <div>Booking Code: <strong>{pickupModalBooking.booking_code}</strong></div>
              <div>Station: <strong>{pickupModalBooking.pickup_location_name}</strong></div>
            </div>

            <form onSubmit={handleExecutePickup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Actual Pickup Datetime</label>
                <input
                  type="datetime-local"
                  required
                  value={pickupDateTime}
                  onChange={(e) => setPickupDateTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:outline-none focus:border-secondary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Handover Checklist & Condition Notes</label>
                <textarea
                  rows={3}
                  value={pickupNotes}
                  onChange={(e) => setPickupNotes(e.target.value)}
                  placeholder="Brakes tested, battery 100%, 1 helmet and lock handed over..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-secondary bg-slate-50"
                ></textarea>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
                Action Effect: Booking transitions to <strong>Active</strong> and vehicle operational status transitions to <strong>Rented</strong>.
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPickupModalBooking(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingPickup}
                  className="flex-1 py-2.5 rounded-xl bg-secondary hover:bg-secondary-hover text-white text-xs font-bold transition-all shadow-md shadow-secondary/20"
                >
                  {processingPickup ? 'Handing Over...' : 'Confirm Handover'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Return & Inspection Modal */}
      {returnModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-primary text-base">Return Intake: {returnModalBooking.vehicle_name}</h3>
              <button
                onClick={() => setReturnModalBooking(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                &times;
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-bgLight text-xs space-y-1">
              <div>Booking Code: <strong>{returnModalBooking.booking_code}</strong></div>
              <div>Customer: <strong>{returnModalBooking.customer_name}</strong></div>
              <div>Scheduled Return: <strong>{formatDateTime(returnModalBooking.return_datetime)}</strong></div>
              <div>Security Deposit Held: <strong>{formatVND(returnModalBooking.deposit_amount)}</strong></div>
            </div>

            <form onSubmit={handleExecuteReturn} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Actual Return Datetime</label>
                <input
                  type="datetime-local"
                  required
                  value={actualReturnTime}
                  onChange={(e) => setActualReturnTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:outline-none focus:border-secondary"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  * Late fee (50,000 VND/hour) is auto-calculated if return exceeds scheduled time (+15 min grace).
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Inspection Condition</label>
                  <select
                    value={inspectionCondition}
                    onChange={(e) => setInspectionCondition(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:outline-none focus:border-secondary"
                  >
                    <option value="excellent">Excellent (Like new)</option>
                    <option value="good">Good (Normal wear)</option>
                    <option value="fair">Fair (Scratches/Cosmetic)</option>
                    <option value="damaged">Damaged (Requires Repair)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Next Vehicle Operational Status</label>
                  <select
                    value={nextVehicleStatus}
                    onChange={(e) => setNextVehicleStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:outline-none focus:border-secondary"
                  >
                    <option value="available">Available (Put back in fleet)</option>
                    <option value="maintenance">Maintenance (Send to workshop)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Damages Assessed (if any)</label>
                <input
                  type="text"
                  value={damagesFound}
                  onChange={(e) => setDamagesFound(e.target.value)}
                  placeholder="Flat tire, cracked mirror, broken pedal..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:outline-none focus:border-secondary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Damage Fee Charged to Deposit (VND)</label>
                <input
                  type="number"
                  value={damageFee}
                  onChange={(e) => setDamageFee(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:outline-none focus:border-secondary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Technician Inspection Notes</label>
                <textarea
                  rows={2}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-secondary bg-slate-50"
                ></textarea>
              </div>

              <div className="p-3 rounded-xl bg-bgLight text-[11px] text-slate-600 space-y-1">
                <p>• Booking status will update to <strong>Completed</strong>.</p>
                <p>• Deposit will be refunded minus any calculated late and damage fees.</p>
                <p>• If marked for maintenance, a maintenance log will be automatically recorded.</p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReturnModalBooking(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingReturn}
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-light text-white text-xs font-bold transition-all shadow-md"
                >
                  {processingReturn ? 'Processing...' : 'Complete Return Intake'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

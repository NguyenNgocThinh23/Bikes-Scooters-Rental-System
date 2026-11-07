import React, { useState, useEffect } from 'react';
import { Printer, Download, X, Bike, CheckCircle2, ShieldCheck } from 'lucide-react';
import api from '../../services/api';
import { formatVND, formatDateTime } from '../../utils/formatters';

export default function InvoiceModal({ bookingId, onClose }) {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadInvoice() {
      try {
        const res = await api.get(`/payments/invoice/${bookingId}`);
        if (res.success) {
          setInvoice(res.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to load invoice details.');
      } finally {
        setLoading(false);
      }
    }
    if (bookingId) {
      loadInvoice();
    }
  }, [bookingId]);

  const handlePrint = () => {
    window.print();
  };

  if (!bookingId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
        
        {/* Actions bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 no-print">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Official Rental Invoice & Receipt
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-light transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500 font-semibold">
            Generating itemized invoice...
          </div>
        ) : error ? (
          <div className="py-12 text-center text-xs text-rose-600 font-semibold">
            {error}
          </div>
        ) : invoice ? (
          <div id="printable-invoice" className="space-y-6 pt-4 text-slate-800">
            
            {/* Header info */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold">
                  <Bike className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-primary">RideNow Rentals</h2>
                  <span className="text-[11px] text-slate-500">Da Nang City, Vietnam</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-black text-primary">{invoice.invoice_number}</div>
                <div className="text-[11px] text-slate-500">Issued: {formatDateTime(invoice.invoice_date)}</div>
                <div className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-secondary/15 text-secondary">
                  Status: {invoice.payment_status}
                </div>
              </div>
            </div>

            {/* Customer & Vehicle Info Grid */}
            <div className="grid grid-cols-2 gap-6 text-xs bg-bgLight p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Renter Details</span>
                <div className="font-bold text-primary text-sm">{invoice.customer.name}</div>
                <div className="text-slate-600">{invoice.customer.email}</div>
                <div className="text-slate-600">{invoice.customer.phone || 'Phone not provided'}</div>
                {invoice.customer.address && <div className="text-slate-500 mt-1">{invoice.customer.address}</div>}
              </div>

              <div>
                <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Vehicle Details</span>
                <div className="font-bold text-primary text-sm">{invoice.vehicle.name}</div>
                <div className="text-slate-600">{invoice.vehicle.brand} • {invoice.vehicle.category}</div>
                <div className="text-secondary font-bold">Plate: {invoice.vehicle.license_plate}</div>
              </div>
            </div>

            {/* Rental Duration & Stations */}
            <div className="text-xs space-y-1.5 p-3.5 rounded-xl border border-slate-200/80">
              <div className="flex justify-between">
                <span className="text-slate-500">Pickup Schedule:</span>
                <span className="font-bold text-primary">{formatDateTime(invoice.rental_period.pickup_datetime)} ({invoice.rental_period.pickup_location})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Return Schedule:</span>
                <span className="font-bold text-primary">{formatDateTime(invoice.rental_period.return_datetime)} ({invoice.rental_period.return_location})</span>
              </div>
              {invoice.rental_period.actual_return_datetime && (
                <div className="flex justify-between pt-1 border-t border-slate-100 text-slate-600">
                  <span>Actual Return:</span>
                  <span className="font-bold">{formatDateTime(invoice.rental_period.actual_return_datetime)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>Billed Duration:</span>
                <span className="font-bold text-primary">{invoice.rental_period.duration_hours} hours ({invoice.rental_period.rental_type})</span>
              </div>
            </div>

            {/* Line items table */}
            <div className="overflow-hidden border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] tracking-wider font-bold">
                  <tr>
                    <th className="py-2.5 px-4">Item Description</th>
                    <th className="py-2.5 px-4 text-right">Amount (VND)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {invoice.line_items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-4 text-slate-700">{item.description}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-primary">{formatVND(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Totals */}
            <div className="space-y-1.5 text-xs text-right pr-2">
              <div className="flex justify-end gap-8 text-slate-600">
                <span>Subtotal Rental Fee:</span>
                <span className="font-bold text-primary w-28">{formatVND(invoice.financial_summary.rental_fee)}</span>
              </div>
              {invoice.financial_summary.extension_fee > 0 && (
                <div className="flex justify-end gap-8 text-slate-600">
                  <span>Extension Fee:</span>
                  <span className="font-bold text-primary w-28">{formatVND(invoice.financial_summary.extension_fee)}</span>
                </div>
              )}
              {invoice.financial_summary.late_fee > 0 && (
                <div className="flex justify-end gap-8 text-rose-600">
                  <span>Overdue Late Fee:</span>
                  <span className="font-bold w-28">{formatVND(invoice.financial_summary.late_fee)}</span>
                </div>
              )}
              {invoice.financial_summary.damage_fee > 0 && (
                <div className="flex justify-end gap-8 text-rose-600">
                  <span>Damage Charges:</span>
                  <span className="font-bold w-28">{formatVND(invoice.financial_summary.damage_fee)}</span>
                </div>
              )}
              <div className="flex justify-end gap-8 text-base font-black text-primary pt-2 border-t border-slate-200">
                <span>Gross Total:</span>
                <span className="text-secondary w-28">{formatVND(invoice.financial_summary.total_amount)}</span>
              </div>
              <div className="flex justify-end gap-8 text-xs font-bold text-slate-600">
                <span>Total Paid:</span>
                <span className="w-28">{formatVND(invoice.financial_summary.total_paid)}</span>
              </div>
              <div className="flex justify-end gap-8 text-xs font-bold text-slate-800">
                <span>Balance Due:</span>
                <span className="w-28 text-rose-600">{formatVND(invoice.financial_summary.balance_due)}</span>
              </div>
            </div>

            {/* Security Deposit Ledger */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs">
              <div className="font-bold text-amber-900 mb-1 flex items-center justify-between">
                <span>Security Deposit Ledger</span>
                <span className="uppercase text-[10px] px-2 py-0.5 rounded bg-white font-black text-amber-800 border border-amber-200">
                  Status: {invoice.deposit_details.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div>Original Deposit: <strong className="text-primary">{formatVND(invoice.deposit_details.amount)}</strong></div>
                <div>Refunded to Customer: <strong className="text-emerald-700">{formatVND(invoice.deposit_details.refunded_amount)}</strong></div>
                {invoice.deposit_details.deducted_amount > 0 && (
                  <div className="col-span-2 text-rose-700 font-semibold">
                    Deducted for fees/damages: {formatVND(invoice.deposit_details.deducted_amount)} ({invoice.deposit_details.deduction_reason})
                  </div>
                )}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="text-[10px] text-slate-400 italic pt-2 border-t border-slate-200">
              {invoice.disclaimer}
            </div>

          </div>
        ) : null}

      </div>
    </div>
  );
}

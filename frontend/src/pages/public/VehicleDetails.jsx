import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Star,
  MapPin,
  Calendar,
  Clock,
  Shield,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Share2,
  Heart,
  ChevronRight,
  Info
} from 'lucide-react';
import api from '../../services/api';
import { formatVND, formatDateTime } from '../../utils/formatters';
import StatusBadge from '../../components/common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

export default function VehicleDetails() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useNotifications();

  const [vehicle, setVehicle] = useState(null);
  const [bookedIntervals, setBookedIntervals] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Booking Modal State
  const [showBookingModal, setShowBookingModal] = useState(searchParams.get('book') === 'true');
  const [pickupLocId, setPickupLocId] = useState('');
  const [returnLocId, setReturnLocId] = useState('');
  const [pickupDateTime, setPickupDateTime] = useState(() => {
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [returnDateTime, setReturnDateTime] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    d.setHours(18, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [bookingNotes, setBookingNotes] = useState('');
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Dynamic calculated pricing
  const [calcDurationHours, setCalcDurationHours] = useState(0);
  const [calcRentalFee, setCalcRentalFee] = useState(0);
  const [calcDeposit, setCalcDeposit] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const [vRes, calRes, locRes] = await Promise.all([
          api.get(`/vehicles/${id}`),
          api.get(`/vehicles/${id}/availability`),
          api.get('/vehicles/locations')
        ]);
        if (vRes.success) {
          setVehicle(vRes.data);
          setPickupLocId(vRes.data.location_id);
          setReturnLocId(vRes.data.location_id);
          setCalcDeposit(parseFloat(vRes.data.deposit_amount || 500000));
        }
        if (calRes.success) {
          setBookedIntervals(calRes.bookedIntervals || []);
        }
        if (locRes.success) {
          setLocations(locRes.data);
        }
      } catch (err) {
        console.error('Failed to load vehicle details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  // Recalculate price whenever dates change
  useEffect(() => {
    if (!vehicle || !pickupDateTime || !returnDateTime) return;

    const p = new Date(pickupDateTime);
    const r = new Date(returnDateTime);
    if (isNaN(p.getTime()) || isNaN(r.getTime()) || r <= p) {
      setCalcDurationHours(0);
      setCalcRentalFee(0);
      return;
    }

    const diffMs = r.getTime() - p.getTime();
    const hours = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));
    const days = Math.ceil(hours / 24);

    const hourly = parseFloat(vehicle.hourly_rate);
    const daily = parseFloat(vehicle.daily_rate);

    let fee = 0;
    if (hours < 24) {
      fee = Math.min(hours * hourly, daily);
    } else {
      fee = days * daily;
    }

    setCalcDurationHours(hours);
    setCalcRentalFee(fee);
  }, [vehicle, pickupDateTime, returnDateTime]);

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate(`/login?redirect=/vehicles/${id}?book=true`);
      return;
    }

    setSubmittingBooking(true);
    setBookingError('');

    try {
      const res = await api.post('/bookings', {
        vehicle_id: parseInt(id, 10),
        pickup_location_id: parseInt(pickupLocId, 10),
        return_location_id: parseInt(returnLocId, 10),
        pickup_datetime: pickupDateTime,
        return_datetime: returnDateTime,
        notes: bookingNotes
      });

      if (res.success) {
        showToast(`Booking request ${res.data.booking_code} submitted!`, 'success');
        setShowBookingModal(false);
        navigate('/customer/my-bookings');
      }
    } catch (err) {
      setBookingError(err.message);
    } finally {
      setSubmittingBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm font-semibold text-slate-500">Loading vehicle details...</p>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-primary">Vehicle Not Found</h2>
        <Link to="/explore" className="mt-4 inline-block text-secondary font-bold hover:underline">
          Back to fleet
        </Link>
      </div>
    );
  }

  const specs = typeof vehicle.specifications === 'string'
    ? JSON.parse(vehicle.specifications || '{}')
    : (vehicle.specifications || {});

  const features = typeof vehicle.features === 'string'
    ? JSON.parse(vehicle.features || '[]')
    : (vehicle.features || []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link to="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/explore" className="hover:text-primary">Fleet</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to={`/explore?category=${vehicle.category_slug}`} className="hover:text-primary">{vehicle.category_name}</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-primary font-bold">{vehicle.name}</span>
      </div>

      {/* Main Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left: Images Showcase */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative rounded-3xl overflow-hidden shadow-card border border-slate-100 aspect-[16/10] bg-slate-100">
            <img
              src={vehicle.image_url}
              alt={vehicle.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4">
              <StatusBadge status={vehicle.status} />
            </div>
          </div>

          {/* Additional gallery if present */}
          {vehicle.images && vehicle.images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {vehicle.images.map((img) => (
                <div key={img.id} className="rounded-xl overflow-hidden aspect-video border border-slate-200">
                  <img src={img.image_url} alt="Gallery" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Booking Card & Key Specs */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card space-y-6">
            
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span>{vehicle.brand} • {vehicle.category_name}</span>
                <span className="text-secondary font-black">{vehicle.license_plate}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary mt-1">{vehicle.name}</h1>
              
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{parseFloat(vehicle.rating).toFixed(2)}</span>
                  <span className="text-slate-400">({vehicle.total_reviews} reviews)</span>
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  {vehicle.total_trips} trips completed
                </div>
              </div>
            </div>

            {/* Pricing Matrix Highlight */}
            <div className="p-4 rounded-2xl bg-bgLight border border-slate-200/80 space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl sm:text-3xl font-black text-primary">{formatVND(vehicle.daily_rate)}</span>
                  <span className="text-xs text-slate-400 font-semibold"> / day</span>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-slate-700">{formatVND(vehicle.hourly_rate)}</span>
                  <span className="text-xs text-slate-400"> / hour</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <span>Refundable Deposit:</span>
                <span className="font-bold text-primary">{formatVND(vehicle.deposit_amount)}</span>
              </div>
            </div>

            {/* Station info */}
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-primary/5 text-xs text-slate-700">
              <MapPin className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-primary">{vehicle.location_name}</span>
                <span className="text-slate-500">{vehicle.location_address}</span>
              </div>
            </div>

            {/* Book Now Button */}
            <div>
              {vehicle.status === 'available' ? (
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="w-full py-3.5 rounded-xl bg-secondary hover:bg-secondary-hover text-white font-bold text-sm shadow-md shadow-secondary/25 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book This Vehicle</span>
                </button>
              ) : (
                <div className="p-3 text-center rounded-xl bg-slate-100 text-slate-500 text-xs font-bold">
                  Vehicle is currently {vehicle.status}. Check calendar for future dates.
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-400 space-y-1">
              <p>✓ Sanitized helmet & safety lock included</p>
              <p>✓ 100% free cancellation up to 24h before pickup</p>
              <p>✓ Instant confirmation by RideNow Operations team</p>
            </div>

          </div>
        </div>

      </div>

      {/* Description & Technical Specifications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column: Description, Features, Specs */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Description */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card">
            <h3 className="text-lg font-bold text-primary mb-3">About This Vehicle</h3>
            <p className="text-sm text-slate-600 leading-relaxed font-normal">
              {vehicle.description}
            </p>

            {/* Features tags */}
            {features.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Key Highlights</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Technical Specifications */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card">
            <h3 className="text-lg font-bold text-primary mb-4">Technical Specifications</h3>
            <div className="divide-y divide-slate-100 text-xs sm:text-sm">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500 font-medium">Condition</span>
                <span className="font-bold text-primary capitalize">{vehicle.vehicle_condition}</span>
              </div>
              {Object.entries(specs).map(([key, val]) => (
                <div key={key} className="py-2.5 flex justify-between">
                  <span className="text-slate-500 font-medium capitalize">{key.replace('_', ' ')}</span>
                  <span className="font-bold text-primary">{String(val)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Reviews Section */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card">
            <h3 className="text-lg font-bold text-primary mb-4">
              Verified Rider Reviews ({vehicle.reviews?.length || 0})
            </h3>

            {(!vehicle.reviews || vehicle.reviews.length === 0) ? (
              <p className="text-xs text-slate-500 italic">No customer reviews yet. Be the first to rent and review!</p>
            ) : (
              <div className="space-y-4 divide-y divide-slate-100">
                {vehicle.reviews.map((rev) => (
                  <div key={rev.id} className="pt-4 first:pt-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-primary">{rev.customer_name}</span>
                      <div className="flex items-center gap-1 text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400' : 'text-slate-200'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">{formatDateTime(rev.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Live Booking Availability Calendar */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-primary flex items-center gap-2">
                <Calendar className="w-5 h-5 text-secondary" />
                <span>Availability Schedule</span>
              </h3>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Live DB Schedule
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Below are active and confirmed bookings for this vehicle. Overlapping reservations cannot be confirmed.
            </p>

            {bookedIntervals.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Vehicle is completely open for reservations across upcoming dates!</span>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {bookedIntervals.map((interval) => (
                  <div
                    key={interval.id}
                    className="p-3 rounded-xl border border-rose-100 bg-rose-50/70 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        <span>{formatDateTime(interval.pickup_datetime)}</span>
                      </div>
                      <div className="text-slate-500 text-[11px] pl-3.5">
                        Until {formatDateTime(interval.return_datetime)}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white border border-rose-200 text-rose-700">
                      {interval.booking_status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => setShowBookingModal(true)}
                className="w-full py-3 rounded-xl bg-secondary hover:bg-secondary-hover text-white text-xs font-bold shadow-md shadow-secondary/20 transition-all"
              >
                Reserve Now
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Interactive Booking Drawer / Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-primary">Book {vehicle.name}</h3>
                <span className="text-xs text-slate-400 font-semibold">{vehicle.brand} • {vehicle.category_name}</span>
              </div>
              <button
                onClick={() => setShowBookingModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                &times;
              </button>
            </div>

            {bookingError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{bookingError}</span>
              </div>
            )}

            <form onSubmit={handleCreateBooking} className="mt-6 space-y-4">
              
              {/* Pickup & Return Station */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Pickup Station</label>
                  <select
                    value={pickupLocId}
                    onChange={(e) => setPickupLocId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:outline-none focus:border-secondary"
                    required
                  >
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Return Station</label>
                  <select
                    value={returnLocId}
                    onChange={(e) => setReturnLocId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:outline-none focus:border-secondary"
                    required
                  >
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pickup & Return Datetime */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Pickup Date & Time</label>
                  <input
                    type="datetime-local"
                    value={pickupDateTime}
                    onChange={(e) => setPickupDateTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:outline-none focus:border-secondary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Return Date & Time</label>
                  <input
                    type="datetime-local"
                    value={returnDateTime}
                    onChange={(e) => setReturnDateTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:outline-none focus:border-secondary"
                    required
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Additional Notes (Optional)</label>
                <input
                  type="text"
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="Need special helmet size, luggage rack, etc."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:outline-none focus:border-secondary"
                />
              </div>

              {/* Price Calculation Summary */}
              <div className="p-4 rounded-2xl bg-bgLight border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Duration:</span>
                  <span className="font-bold text-primary">{calcDurationHours} hours ({Math.ceil(calcDurationHours / 24)} days)</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Rental Fee:</span>
                  <span className="font-bold text-primary">{formatVND(calcRentalFee)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Refundable Security Deposit:</span>
                  <span className="font-bold text-primary">{formatVND(calcDeposit)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-secondary">
                  <span>Total Due on Pickup:</span>
                  <span>{formatVND(calcRentalFee)}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  * Deposit is held during rental and refunded automatically upon vehicle return inspection.
                </p>
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBooking || calcDurationHours <= 0}
                  className="flex-1 py-3 rounded-xl bg-secondary hover:bg-secondary-hover disabled:bg-slate-300 text-white text-xs font-bold transition-all shadow-md shadow-secondary/20"
                >
                  {submittingBooking ? 'Checking & Booking...' : 'Confirm Reservation'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

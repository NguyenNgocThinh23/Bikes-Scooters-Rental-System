import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bike,
  Search,
  Calendar,
  MapPin,
  ShieldCheck,
  Clock,
  Sparkles,
  ChevronDown,
  Star,
  ArrowRight,
  CheckCircle2,
  Phone,
  Mail,
  Zap,
  Navigation,
  Mountain,
  Gauge
} from 'lucide-react';
import api from '../../services/api';
import { formatVND } from '../../utils/formatters';
import StatusBadge from '../../components/common/StatusBadge';

export default function Home() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick search form state
  const [searchLocation, setSearchLocation] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [pickupDate, setPickupDate] = useState(() => {
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [returnDate, setReturnDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    d.setHours(18, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(0);

  // Contact form state
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [contactSuccess, setContactSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [vehRes, catRes, locRes, revRes] = await Promise.all([
          api.get('/vehicles'),
          api.get('/vehicles/categories'),
          api.get('/vehicles/locations'),
          api.get('/reviews?limit=4')
        ]);
        if (vehRes.success) setVehicles(vehRes.data);
        if (catRes.success) setCategories(catRes.data);
        if (locRes.success) setLocations(locRes.data);
        if (revRes.success) setReviews(revRes.data);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleQuickSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchLocation) params.set('location', searchLocation);
    if (searchCategory) params.set('category', searchCategory);
    if (pickupDate) params.set('pickup_date', pickupDate);
    if (returnDate) params.set('return_date', returnDate);
    navigate(`/explore?${params.toString()}`);
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSuccess(true);
    setContactForm({ name: '', email: '', subject: '', message: '' });
    setTimeout(() => setContactSuccess(false), 5000);
  };

  const faqs = [
    {
      q: 'How can I rent a bike or scooter?',
      a: 'Browse our fleet on the Explore page, select your vehicle, choose pickup and return dates, and confirm your booking. Once confirmed by our team, pick up your ride at your designated station!'
    },
    {
      q: 'What documents do I need?',
      a: 'For city and mountain bicycles, a valid National ID or Passport is sufficient. For motor scooters and high-speed electric scooters, a valid Vietnamese or International Driving License is required.'
    },
    {
      q: 'Can I cancel my booking?',
      a: 'Yes! You can cancel up to 24 hours prior to scheduled pickup for a 100% full refund of your deposit. Cancellations within 24 hours are subject to our flexible cancellation policy.'
    },
    {
      q: 'What happens if a vehicle is damaged?',
      a: 'During return inspection, our technicians assess any damage. Minor cosmetic scratches are often covered, while serious damage or component failure is deducted from the security deposit.'
    },
    {
      q: 'Can I extend my rental period?',
      a: 'Absolutely. If you have an active rental, simply visit the Active Rentals tab in your Customer Dashboard, click "Request Extension", and our team will approve it provided there are no scheduling conflicts.'
    },
    {
      q: 'Are helmets included?',
      a: 'Yes! Every rental comes with sanitized helmets, a lock, and safety gear at no extra charge.'
    },
    {
      q: 'What payment methods are accepted?',
      a: 'We accept Cash on pickup, Bank Transfer via QR code, and Simulated Demo Online Payments (Card & MoMo) for demonstration purposes.'
    }
  ];

  const categoryIcons = {
    'city-bikes': Bike,
    'mountain-bikes': Mountain,
    'electric-bikes': Zap,
    'electric-scooters': Navigation,
    'motor-scooters': Gauge
  };

  return (
    <div className="space-y-24 pb-20">
      
      {/* 4.2 Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary via-primary-light to-primary text-white pt-12 pb-24 lg:pt-20 lg:pb-32">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#20B875_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Text */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary/15 border border-secondary/30 text-secondary text-xs font-bold tracking-wider uppercase">
                <Sparkles className="w-4 h-4" />
                <span>Next-Gen Mobility in Da Nang & Hoi An</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                Ride Your Way, <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-emerald-300">
                  Explore Your City
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Discover freedom and convenience with our affordable bike and scooter rentals. From coastal bicycles to agile e-scooters and petrol motorbikes, ride on your own terms.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/explore"
                  className="px-8 py-3.5 rounded-xl font-bold text-sm bg-secondary hover:bg-secondary-hover text-white shadow-lg shadow-secondary/25 transition-all transform hover:-translate-y-0.5"
                >
                  Explore Vehicles
                </Link>
                <Link
                  to="/how-it-works"
                  className="px-7 py-3.5 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/15 text-white border border-white/20 transition-all"
                >
                  How It Works
                </Link>
              </div>

              {/* Stats badges */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-700/60 max-w-lg mx-auto lg:mx-0">
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-white">50+</div>
                  <div className="text-xs text-slate-400 font-medium">Bikes & Scooters</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-secondary">5</div>
                  <div className="text-xs text-slate-400 font-medium">Convenient Hubs</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-white">4.9/5</div>
                  <div className="text-xs text-slate-400 font-medium">Customer Rating</div>
                </div>
              </div>
            </div>

            {/* Hero Image Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/15 aspect-[4/3]">
                  <img
                    src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1000&q=80"
                    alt="RideNow Modern Fleet"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent"></div>
                  <div className="absolute bottom-5 left-5 right-5 text-white">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase bg-secondary text-primary">
                      Premium Quality
                    </span>
                    <h3 className="text-lg font-bold mt-1.5">Inspected & Sanitized Daily</h3>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Quick Vehicle Search Widget */}
          <div className="mt-12 bg-white rounded-2xl p-5 sm:p-7 shadow-hover border border-slate-100 text-slate-800">
            <h3 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-secondary" />
              <span>Find & Book Your Ride</span>
            </h3>

            <form onSubmit={handleQuickSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              
              {/* Pickup Location */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Pickup Location</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <select
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-secondary bg-slate-50/50"
                  >
                    <option value="">All Stations</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Vehicle Category */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Vehicle Type</label>
                <div className="relative">
                  <Bike className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <select
                    value={searchCategory}
                    onChange={(e) => setSearchCategory(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-secondary bg-slate-50/50"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.slug}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pickup Date & Time */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Pickup Date & Time</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="datetime-local"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-secondary bg-slate-50/50"
                    required
                  />
                </div>
              </div>

              {/* Return Date & Time */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Return Date & Time</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="datetime-local"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-secondary bg-slate-50/50"
                    required
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-secondary hover:bg-secondary-hover text-white text-xs font-bold transition-all shadow-md shadow-secondary/20 flex items-center justify-center gap-2 h-[42px]"
                >
                  <Search className="w-4 h-4" />
                  <span>Search Available</span>
                </button>
              </div>

            </form>
          </div>

        </div>
      </section>

      {/* 4.3 Vehicle Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-extrabold uppercase tracking-widest text-secondary">Browse By Type</span>
          <h2 className="text-3xl font-black text-primary mt-1">Vehicle Categories</h2>
          <p className="text-sm text-slate-500 mt-2">
            Select the perfect ride tailored to your lifestyle, commuting route, or weekend journey.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {categories.map((cat) => {
            const Icon = categoryIcons[cat.slug] || Bike;
            return (
              <div
                key={cat.id}
                className="group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-card hover:shadow-hover transition-all duration-300 flex flex-col"
              >
                <div className="relative h-44 overflow-hidden bg-slate-100">
                  <img
                    src={cat.image_url}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 w-9 h-9 rounded-xl bg-white/90 backdrop-blur-md flex items-center justify-center text-primary shadow">
                    <Icon className="w-5 h-5 text-secondary" />
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-base text-primary">{cat.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{cat.description}</p>
                    <div className="mt-3 text-xs font-semibold text-secondary">
                      {cat.available_count} vehicles available now
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400">From {formatVND(cat.base_hourly_rate)}/h</span>
                    <Link
                      to={`/explore?category=${cat.slug}`}
                      className="text-xs font-bold text-primary group-hover:text-secondary flex items-center gap-1 transition-colors"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4.4 Featured Vehicles */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-secondary">Top Picks</span>
            <h2 className="text-3xl font-black text-primary mt-1">Featured Vehicles</h2>
            <p className="text-sm text-slate-500 mt-1">Hand-picked, thoroughly serviced, and ready to roll.</p>
          </div>
          <Link
            to="/explore"
            className="flex items-center gap-2 text-sm font-bold text-secondary hover:text-secondary-hover transition-colors"
          >
            <span>View All Fleet ({vehicles.length})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {vehicles.slice(0, 8).map((vehicle) => (
            <div
              key={vehicle.id}
              className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-card hover:shadow-hover transition-all duration-300 flex flex-col group"
            >
              {/* Image & Status Badge */}
              <div className="relative h-48 overflow-hidden bg-slate-100">
                <img
                  src={vehicle.image_url}
                  alt={vehicle.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3">
                  <StatusBadge status={vehicle.status} />
                </div>
                <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-white/90 backdrop-blur-md text-xs font-bold text-slate-800 flex items-center gap-1 shadow">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{parseFloat(vehicle.rating).toFixed(1)}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {vehicle.brand} • {vehicle.category_name}
                  </div>
                  <h3 className="font-bold text-base text-primary mt-0.5 truncate">{vehicle.name}</h3>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                    {vehicle.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="flex items-baseline justify-between mb-3">
                    <div>
                      <span className="text-lg font-black text-primary">{formatVND(vehicle.daily_rate)}</span>
                      <span className="text-xs text-slate-400"> / day</span>
                    </div>
                    <span className="text-xs text-slate-400">{formatVND(vehicle.hourly_rate)}/h</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to={`/vehicles/${vehicle.id}`}
                      className="w-full py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 text-center transition-colors"
                    >
                      View Details
                    </Link>
                    <Link
                      to={`/vehicles/${vehicle.id}?book=true`}
                      className={`w-full py-2 rounded-xl text-xs font-bold text-center transition-colors shadow-sm ${
                        vehicle.status === 'available'
                          ? 'bg-secondary hover:bg-secondary-hover text-white shadow-secondary/20'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed pointer-events-none'
                      }`}
                    >
                      {vehicle.status === 'available' ? 'Book Now' : 'Not Available'}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4.5 How It Works */}
      <section className="bg-primary/5 py-16 border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-extrabold uppercase tracking-widest text-secondary">Simple 4-Step Process</span>
            <h2 className="text-3xl font-black text-primary mt-1">How It Works</h2>
            <p className="text-sm text-slate-500 mt-2">
              Renting a bike or scooter with RideNow takes less than 2 minutes online.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                title: 'Choose Your Vehicle',
                desc: 'Explore city bikes, electric scooters, or motorbikes with transparent pricing and live availability.'
              },
              {
                step: '02',
                title: 'Select Rental Time',
                desc: 'Pick your dates and pickup hub. Our automated system calculates the best hourly or daily rates.'
              },
              {
                step: '03',
                title: 'Confirm Your Booking',
                desc: 'Submit your reservation. Our administrators verify vehicle readiness and send instant confirmation.'
              },
              {
                step: '04',
                title: 'Pick Up & Enjoy',
                desc: 'Arrive at the station, complete quick document handover, grab your helmet, and embark on your journey!'
              }
            ].map((step, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-card relative">
                <span className="text-3xl font-black text-secondary/30 mb-2 block">{step.step}</span>
                <h3 className="text-base font-bold text-primary mb-2">{step.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4.6 Pricing Matrix Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-extrabold uppercase tracking-widest text-secondary">Transparent Rates</span>
          <h2 className="text-3xl font-black text-primary mt-1">Rental Pricing Plans</h2>
          <p className="text-sm text-slate-500 mt-2">
            No hidden costs. Helmets and maintenance support included in all rentals.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-primary text-white text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Hourly Rate</th>
                  <th className="py-4 px-6">Daily Rate</th>
                  <th className="py-4 px-6">Weekly (Avg/day)</th>
                  <th className="py-4 px-6">Monthly (Avg/day)</th>
                  <th className="py-4 px-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-bold text-primary flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-secondary"></span>
                      {c.name}
                    </td>
                    <td className="py-4 px-6">{formatVND(c.base_hourly_rate)}</td>
                    <td className="py-4 px-6 font-bold text-secondary">{formatVND(c.base_daily_rate)}</td>
                    <td className="py-4 px-6 text-slate-600">{formatVND(c.base_daily_rate * 0.85)}</td>
                    <td className="py-4 px-6 text-slate-600">{formatVND(c.base_daily_rate * 0.65)}</td>
                    <td className="py-4 px-6">
                      <Link
                        to={`/explore?category=${c.slug}`}
                        className="px-3.5 py-1.5 rounded-lg bg-primary/10 hover:bg-secondary hover:text-white text-primary text-xs font-bold transition-all"
                      >
                        Rent
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 4.7 Why Choose RideNow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-extrabold uppercase tracking-widest text-secondary">The RideNow Difference</span>
          <h2 className="text-3xl font-black text-primary mt-1">Why Choose RideNow</h2>
          <p className="text-sm text-slate-500 mt-2">Designed for tourists, locals, and commuters seeking premium freedom.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Zap,
              title: 'Affordable Rental Prices',
              desc: 'Best price guaranteed with clear hourly and discounted daily/weekly rental packages.'
            },
            {
              icon: Bike,
              title: 'Wide Vehicle Selection',
              desc: 'From lightweight city commuters to trail-grade MTBs, high-tech e-scooters, and petrol motorbikes.'
            },
            {
              icon: CheckCircle2,
              title: 'Easy Online Booking',
              desc: 'Live availability calendars and seamless reservation workflows prevent double-booking.'
            },
            {
              icon: ShieldCheck,
              title: 'Well-Maintained Vehicles',
              desc: 'Strict post-rental inspection protocol and certified technician maintenance schedule.'
            },
            {
              icon: Clock,
              title: 'Flexible Rental Periods',
              desc: 'Rent for 2 hours or 2 months. Request extensions straight from your active customer dashboard.'
            },
            {
              icon: Phone,
              title: '24/7 Roadside Assistance',
              desc: 'Hotline support and multiple central hubs in Da Nang and Hoi An for quick assistance.'
            }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-card flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary/15 flex items-center justify-center shrink-0 text-secondary">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-primary">{item.title}</h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4.8 Customer Reviews */}
      <section className="bg-slate-50 py-16 border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-extrabold uppercase tracking-widest text-secondary">Renter Stories</span>
            <h2 className="text-3xl font-black text-primary mt-1">What Our Riders Say</h2>
            <p className="text-sm text-slate-500 mt-2">Genuine verified reviews from travelers and locals.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.slice(0, 3).map((r) => (
              <div key={r.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-card flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < r.rating ? 'fill-amber-400' : 'text-slate-200'}`} />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
                    "{r.comment}"
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-secondary/20 text-secondary font-bold flex items-center justify-center text-xs">
                    {r.customer_name?.charAt(0) || 'R'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-primary">{r.customer_name}</h4>
                    <span className="text-[11px] text-slate-400">Rented: {r.vehicle_name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4.9 FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-xs font-extrabold uppercase tracking-widest text-secondary">Got Questions?</span>
          <h2 className="text-3xl font-black text-primary mt-1">Frequently Asked Questions</h2>
          <p className="text-sm text-slate-500 mt-2">Everything you need to know about the rental experience.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl border border-slate-200/80 overflow-hidden transition-all duration-200"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                className="w-full py-4 px-6 flex items-center justify-between text-left font-bold text-sm text-primary hover:text-secondary transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openFaq === idx ? 'rotate-180 text-secondary' : 'text-slate-400'}`} />
              </button>
              {openFaq === idx && (
                <div className="px-6 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 4.10 Contact Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-primary rounded-3xl p-8 sm:p-12 lg:p-16 text-white shadow-2xl overflow-hidden relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Contact details */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs font-extrabold uppercase tracking-widest text-secondary">Get In Touch</span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">We're Here to Help Your Journey</h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Have questions regarding custom group rentals, long-term leasing, or station pickup? Contact our team directly.
              </p>

              <div className="space-y-4 pt-4 text-xs sm:text-sm text-slate-300">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-secondary shrink-0" />
                  <span>120 Nguyen Van Linh, Hai Chau, Da Nang City, Vietnam</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-secondary shrink-0" />
                  <span>+84 905 123 456 (24/7 Hotline)</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-secondary shrink-0" />
                  <span>support@ridenow.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-secondary shrink-0" />
                  <span>Working Hours: Daily 06:30 - 22:00</span>
                </div>
              </div>
            </div>

            {/* Interactive Contact Form */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 text-slate-800 shadow-xl">
              <h3 className="text-lg font-bold text-primary mb-4">Send Us a Message</h3>

              {contactSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                  Thank you! Your inquiry has been received. Our team will contact you shortly.
                </div>
              )}

              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="e.g. John Doe"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-secondary bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="john@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-secondary bg-slate-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    placeholder="Rental Inquiry / Long-term booking"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-secondary bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Message</label>
                  <textarea
                    rows={4}
                    required
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Write your message here..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-secondary bg-slate-50"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-secondary hover:bg-secondary-hover text-white text-xs font-bold transition-all shadow-md shadow-secondary/20"
                >
                  Send Inquiry
                </button>
              </form>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}

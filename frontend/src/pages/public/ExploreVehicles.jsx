import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Star,
  MapPin,
  Calendar,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  Bike
} from 'lucide-react';
import api from '../../services/api';
import { formatVND } from '../../utils/formatters';
import StatusBadge from '../../components/common/StatusBadge';

export default function ExploreVehicles() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [vehicles, setVehicles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '1000000');
  const [minRating, setMinRating] = useState(searchParams.get('min_rating') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [pickupDate, setPickupDate] = useState(searchParams.get('pickup_date') || '');
  const [returnDate, setReturnDate] = useState(searchParams.get('return_date') || '');

  // Mobile filters modal toggle
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    async function fetchMetadata() {
      try {
        const [catRes, locRes] = await Promise.all([
          api.get('/vehicles/categories'),
          api.get('/vehicles/locations')
        ]);
        if (catRes.success) setCategories(catRes.data);
        if (locRes.success) setLocations(locRes.data);
      } catch (err) {
        console.error('Failed to load filter metadata:', err);
      }
    }
    fetchMetadata();
  }, []);

  useEffect(() => {
    async function loadVehicles() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (search) queryParams.set('search', search);
        if (category) queryParams.set('category', category);
        if (location) queryParams.set('location', location);
        if (status) queryParams.set('status', status);
        if (maxPrice) queryParams.set('max_price', maxPrice);
        if (minRating) queryParams.set('min_rating', minRating);
        if (sort) queryParams.set('sort', sort);
        if (pickupDate && returnDate) {
          queryParams.set('pickup_date', pickupDate);
          queryParams.set('return_date', returnDate);
        }

        const res = await api.get(`/vehicles?${queryParams.toString()}`);
        if (res.success) {
          setVehicles(res.data);
        }
      } catch (err) {
        console.error('Failed to load vehicles:', err);
      } finally {
        setLoading(false);
      }
    }
    loadVehicles();
  }, [search, category, location, status, maxPrice, minRating, sort, pickupDate, returnDate]);

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setLocation('');
    setStatus('');
    setMaxPrice('1000000');
    setMinRating('');
    setSort('newest');
    setPickupDate('');
    setReturnDate('');
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Title & Search bar */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-primary">Explore Our Fleet</h1>
        <p className="text-sm text-slate-500 mt-1">
          Search and compare bicycles, e-scooters, and motorbikes with real-time availability.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by vehicle name, model, or brand (e.g. Trek, Xiaomi, Honda)..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-secondary bg-white shadow-sm"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="lg:hidden flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-sm"
            >
              <SlidersHorizontal className="w-4 h-4 text-secondary" />
              <span>Filters</span>
            </button>

            <div className="relative flex-1 sm:w-48">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full px-3 py-3 rounded-xl border border-slate-200 text-xs font-semibold bg-white shadow-sm focus:outline-none focus:border-secondary"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating_desc">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Filters (Desktop) */}
        <aside className="hidden lg:block space-y-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-card h-fit sticky top-24">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h3 className="font-bold text-primary flex items-center gap-2 text-sm">
              <Filter className="w-4 h-4 text-secondary" />
              <span>Filter Vehicles</span>
            </h3>
            <button
              onClick={clearFilters}
              className="text-xs text-secondary hover:underline font-semibold"
            >
              Reset All
            </button>
          </div>

          {/* Dates check */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700">Trip Dates (Check Availability)</label>
            <div className="space-y-2">
              <input
                type="datetime-local"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-secondary"
              />
              <input
                type="datetime-local"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-secondary"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Category</label>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setCategory('')}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  category === '' ? 'bg-secondary/15 text-secondary font-bold' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                All Categories
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.slug)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    category === c.slug ? 'bg-secondary/15 text-secondary font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Station Location</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:border-secondary"
            >
              <option value="">All Stations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          {/* Max Price Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Max Daily Price</span>
              <span className="text-secondary">{formatVND(maxPrice)}</span>
            </div>
            <input
              type="range"
              min="100000"
              max="1000000"
              step="50000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full accent-secondary"
            />
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Minimum Rating</label>
            <div className="flex gap-2">
              {['', '4.5', '4.8'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setMinRating(r)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-1 ${
                    minRating === r
                      ? 'bg-secondary text-white border-secondary'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {r ? <><Star className="w-3 h-3 fill-current" /> {r}+</> : 'Any'}
                </button>
              ))}
            </div>
          </div>

          {/* Operational Status */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Operational Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:border-secondary"
            >
              <option value="">All Statuses</option>
              <option value="available">Available</option>
              <option value="rented">Currently Rented</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </aside>

        {/* Vehicles Grid */}
        <div className="lg:col-span-3">
          
          <div className="mb-4 flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Showing {vehicles.length} vehicles matching your criteria</span>
            {(search || category || location || status || pickupDate) && (
              <button
                onClick={clearFilters}
                className="text-secondary hover:underline font-bold"
              >
                Clear all filters
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border border-slate-100"></div>
              ))}
            </div>
          ) : vehicles.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-card">
              <Bike className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-primary">No vehicles found</h3>
              <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or search terms.</p>
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 rounded-xl bg-secondary text-white text-xs font-bold shadow-md shadow-secondary/20"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {vehicles.map((v) => {
                const isAvailForDates = v.is_available_for_dates !== false && v.status === 'available';

                return (
                  <div
                    key={v.id}
                    className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-card hover:shadow-hover transition-all duration-300 flex flex-col group"
                  >
                    <div className="relative h-48 overflow-hidden bg-slate-100">
                      <img
                        src={v.image_url}
                        alt={v.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3">
                        <StatusBadge status={v.status} />
                      </div>
                      <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-white/90 backdrop-blur-md text-xs font-bold text-slate-800 flex items-center gap-1 shadow">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{parseFloat(v.rating).toFixed(1)}</span>
                      </div>
                      <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-secondary" />
                        <span className="truncate max-w-[180px]">{v.location_name}</span>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          {v.brand} • {v.category_name}
                        </div>
                        <h3 className="font-bold text-base text-primary mt-0.5 truncate">{v.name}</h3>
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                          {v.description}
                        </p>

                        {/* Date conflict note if applicable */}
                        {v.is_available_for_dates === false && (
                          <div className="mt-2 text-[11px] font-bold text-rose-500">
                            Booked during selected dates
                          </div>
                        )}
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-100">
                        <div className="flex items-baseline justify-between mb-3">
                          <div>
                            <span className="text-lg font-black text-primary">{formatVND(v.daily_rate)}</span>
                            <span className="text-xs text-slate-400"> / day</span>
                          </div>
                          <span className="text-xs text-slate-400">{formatVND(v.hourly_rate)}/h</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Link
                            to={`/vehicles/${v.id}`}
                            className="w-full py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 text-center transition-colors"
                          >
                            Details
                          </Link>
                          <Link
                            to={`/vehicles/${v.id}?book=true`}
                            className={`w-full py-2 rounded-xl text-xs font-bold text-center transition-colors shadow-sm ${
                              isAvailForDates
                                ? 'bg-secondary hover:bg-secondary-hover text-white shadow-secondary/20'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed pointer-events-none'
                            }`}
                          >
                            {isAvailForDates ? 'Book Now' : 'Unavailable'}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

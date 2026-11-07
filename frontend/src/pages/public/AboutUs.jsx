import React from 'react';
import { Bike, Shield, Heart, Award, Users, MapPin } from 'lucide-react';

export default function AboutUs() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto">
        <span className="text-xs font-extrabold uppercase tracking-widest text-secondary">Our Story & Mission</span>
        <h1 className="text-4xl font-black text-primary mt-2">Empowering Urban Freedom</h1>
        <p className="text-sm text-slate-500 mt-3 leading-relaxed">
          RideNow was founded in Da Nang with a single mission: to provide travellers and local commuters with reliable, affordable, and eco-friendly bikes and scooters.
        </p>
      </div>

      {/* Grid values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-card">
          <div className="w-12 h-12 rounded-2xl bg-secondary/15 flex items-center justify-center text-secondary mb-5">
            <Bike className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-primary mb-2">Sustainable Mobility</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Reducing urban carbon footprints through modern pedal-assist e-bikes and low-emission scooters.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-card">
          <div className="w-12 h-12 rounded-2xl bg-secondary/15 flex items-center justify-center text-secondary mb-5">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-primary mb-2">Rigorous Safety</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Every bicycle and scooter undergoes regular certified mechanical maintenance and thorough sanitization between rentals.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-card">
          <div className="w-12 h-12 rounded-2xl bg-secondary/15 flex items-center justify-center text-secondary mb-5">
            <Heart className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-primary mb-2">Customer-First Service</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Dedicated multi-lingual station staff, flexible cancellation policies, and roadside support whenever you need assistance.
          </p>
        </div>
      </div>

      {/* Designer Spotlight */}
      <div className="bg-primary text-white rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-xl">
        <span className="text-xs font-extrabold uppercase tracking-widest text-secondary block mb-2">System Design</span>
        <h3 className="text-2xl font-black">Crafted with Precision</h3>
        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
          RideNow – Bikes & Scooters Rental System was architected and designed by <strong>Minh Do</strong> as a commercial-grade, full-stack mobility platform utilizing modern React, Express RESTful architecture, and relational MySQL data integrity.
        </p>
      </div>

    </div>
  );
}

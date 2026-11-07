import React from 'react';
import { Link } from 'react-router-dom';
import { Bike, Calendar, CheckCircle, ShieldCheck, ArrowRight, HelpCircle } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Choose Your Ride',
      desc: 'Browse our catalog of city cruisers, mountain bikes, electric bikes, e-scooters, and motor scooters. Review live specifications, customer ratings, and transparent prices in VND.'
    },
    {
      num: '02',
      title: 'Pick Dates & Station',
      desc: 'Select your preferred pickup hub and duration (hourly, daily, weekly, or monthly). Our booking calendar verifies vehicle availability to prevent any reservation conflicts.'
    },
    {
      num: '03',
      title: 'Instant Confirmation',
      desc: 'Submit your reservation with one click. Our operations team verifies the booking, sanitizes your vehicle, and readies your safety helmet and accessories.'
    },
    {
      num: '04',
      title: 'Pickup & Ride',
      desc: 'Show your Booking ID at the station, complete quick identity verification, and head out on your journey! Return at your scheduled time or easily request an extension online.'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      
      <div className="text-center max-w-3xl mx-auto">
        <span className="text-xs font-extrabold uppercase tracking-widest text-secondary">Simple & Transparent</span>
        <h1 className="text-4xl font-black text-primary mt-2">How RideNow Works</h1>
        <p className="text-sm text-slate-500 mt-3 leading-relaxed">
          From browsing our fleet to hitting the open coastal road, our streamlined digital workflow gets you riding in minutes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {steps.map((s, idx) => (
          <div key={idx} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-card flex flex-col justify-between relative overflow-hidden">
            <div className="text-5xl font-black text-secondary/20 mb-4">{s.num}</div>
            <div>
              <h3 className="text-lg font-bold text-primary mb-2">{s.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-bold text-secondary flex items-center gap-1">
              <span>Step {s.num}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        ))}
      </div>

      {/* Checklist banner */}
      <div className="bg-primary text-white rounded-3xl p-8 sm:p-12 shadow-2xl">
        <div className="max-w-2xl space-y-4">
          <span className="text-xs font-extrabold uppercase tracking-widest text-secondary">What to Bring</span>
          <h2 className="text-2xl sm:text-3xl font-black">Requirements for Pickup</h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Please make sure you have the following items ready upon arrival at our rental station:
          </p>
          <ul className="space-y-2.5 text-xs sm:text-sm text-slate-200 pt-2">
            <li className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-secondary shrink-0" />
              <span>Valid National ID Card or Passport</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-secondary shrink-0" />
              <span>Valid Driving License (for Motor Scooters only)</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-secondary shrink-0" />
              <span>Security Deposit (payable by cash, card, or demo transfer)</span>
            </li>
          </ul>

          <div className="pt-4">
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary hover:bg-secondary-hover text-white text-xs font-bold shadow-md shadow-secondary/20 transition-all"
            >
              <span>Explore Fleet & Book</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}

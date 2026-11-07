import React from 'react';
import { Link } from 'react-router-dom';
import { Bike, MapPin, Phone, Mail, Clock, Facebook, Instagram, Twitter, Youtube, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-primary text-slate-300 pt-16 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          
          {/* Brand Info (2 Columns) */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-primary font-bold shadow-md">
                <Bike className="w-6 h-6 text-primary" />
              </div>
              <span className="text-2xl font-black text-white">
                Ride<span className="text-secondary">Now</span>
              </span>
            </Link>
            
            <p className="text-sm text-slate-300 leading-relaxed max-w-sm">
              Your Ride, Your Journey, Your Freedom. Premium bike and scooter rentals empowering effortless urban mobility and scenic coastal adventures across Vietnam.
            </p>

            <div className="pt-2">
              <div className="flex items-center gap-3 text-slate-400">
                <a href="#facebook" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-secondary hover:text-primary flex items-center justify-center transition-colors">
                  <Facebook className="w-4 h-4" />
                </a>
                <a href="#instagram" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-secondary hover:text-primary flex items-center justify-center transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="#twitter" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-secondary hover:text-primary flex items-center justify-center transition-colors">
                  <Twitter className="w-4 h-4" />
                </a>
                <a href="#youtube" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-secondary hover:text-primary flex items-center justify-center transition-colors">
                  <Youtube className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Quick Links</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/" className="hover:text-secondary transition-colors">Home</Link></li>
              <li><Link to="/explore" className="hover:text-secondary transition-colors">Explore Vehicles</Link></li>
              <li><Link to="/how-it-works" className="hover:text-secondary transition-colors">How It Works</Link></li>
              <li><Link to="/pricing" className="hover:text-secondary transition-colors">Rental Pricing</Link></li>
              <li><Link to="/about" className="hover:text-secondary transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-secondary transition-colors">Contact Support</Link></li>
            </ul>
          </div>

          {/* Vehicle Categories */}
          <div>
            <h3 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Categories</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/explore?category=city-bikes" className="hover:text-secondary transition-colors">City Bikes</Link></li>
              <li><Link to="/explore?category=mountain-bikes" className="hover:text-secondary transition-colors">Mountain Bikes</Link></li>
              <li><Link to="/explore?category=electric-bikes" className="hover:text-secondary transition-colors">Electric Bikes</Link></li>
              <li><Link to="/explore?category=electric-scooters" className="hover:text-secondary transition-colors">Electric Scooters</Link></li>
              <li><Link to="/explore?category=motor-scooters" className="hover:text-secondary transition-colors">Motor Scooters</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Contact Station</h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
                <span>120 Nguyen Van Linh, Hai Chau, Da Nang</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-secondary shrink-0" />
                <span>+84 905 123 456</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-secondary shrink-0" />
                <span>support@ridenow.com</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-secondary shrink-0" />
                <span>Daily: 06:30 - 22:00</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Credits & Designer Signature */}
        <div className="pt-8 mt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            © 2026 RideNow – Bikes & Scooters Rental System. All rights reserved.
          </div>
          
          <div className="flex items-center gap-1.5 font-medium text-slate-300">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>•</span>
            <span className="text-secondary font-bold tracking-wide">Designed by Minh Do</span>
          </div>
        </div>

      </div>
    </footer>
  );
}

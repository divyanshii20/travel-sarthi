import { Link } from 'react-router-dom';
import { Plane, Github, Twitter, Instagram } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-primary text-white/80 pt-12 pb-6 mt-16">
      <div className="page-container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 font-display font-bold text-xl text-white mb-3">
              <Plane size={20} className="text-saffron" />
              Travel Sarthi
            </div>
            <p className="text-sm leading-relaxed text-white/60">
              AI-powered travel intelligence for Indian travelers. Find the cheapest flights, smartest deals, personalized itineraries.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                <Twitter size={16} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                <Instagram size={16} />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                <Github size={16} />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-bold text-white mb-3">Product</h4>
            <ul className="flex flex-col gap-2 text-sm">
              <li><Link to="/plan" className="hover:text-white transition-colors">Plan a Trip</Link></li>
              <li><Link to="/discover" className="hover:text-white transition-colors">Discover</Link></li>
              <li><Link to="/deals" className="hover:text-white transition-colors">Deals & Coupons</Link></li>
              <li><Link to="/fare-alerts" className="hover:text-white transition-colors">Fare Alerts</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-sm font-bold text-white mb-3">Account</h4>
            <ul className="flex flex-col gap-2 text-sm">
              <li><Link to="/register" className="hover:text-white transition-colors">Sign Up</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
              <li><Link to="/my-trips" className="hover:text-white transition-colors">My Trips</Link></li>
              <li><Link to="/profile" className="hover:text-white transition-colors">Profile</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-bold text-white mb-3">Legal</h4>
            <ul className="flex flex-col gap-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/40">
          <p>© {new Date().getFullYear()} Travel Sarthi. All rights reserved.</p>
          <p>Made with ❤️ for Indian travelers</p>
        </div>
      </div>
    </footer>
  );
}

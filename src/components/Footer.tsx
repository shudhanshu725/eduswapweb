import React from 'react';
import { Page } from '../types';
import { Github, Twitter, Linkedin, Instagram } from 'lucide-react';

interface FooterProps {
  onPageChange: (page: Page) => void;
}

export const Footer: React.FC<FooterProps> = ({ onPageChange }) => {
  return (
    <footer className="bg-slate-50 w-full py-16 px-8 border-t border-slate-100">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <button
              onClick={() => onPageChange('landing')}
              className="text-2xl font-extrabold tracking-tighter text-primary font-headline mb-4"
            >
              EduSwap
            </button>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              The Academic Curator. Empowering students through knowledge sharing and collaborative learning.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-primary hover:text-white transition-all">
                <Twitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-primary hover:text-white transition-all">
                <Github size={18} />
              </a>
              <a href="#" className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-primary hover:text-white transition-all">
                <Linkedin size={18} />
              </a>
              <a href="#" className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-primary hover:text-white transition-all">
                <Instagram size={18} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-6 uppercase text-xs tracking-widest">Platform</h4>
            <ul className="space-y-4">
              <li>
                <button onClick={() => onPageChange('explore')} className="text-slate-500 hover:text-primary text-sm transition-colors">Explore Materials</button>
              </li>
              <li>
                <button onClick={() => onPageChange('community')} className="text-slate-500 hover:text-primary text-sm transition-colors">Community Feed</button>
              </li>
              <li>
                <button onClick={() => onPageChange('upload')} className="text-slate-500 hover:text-primary text-sm transition-colors">Upload Resource</button>
              </li>
              <li>
                <button onClick={() => onPageChange('chat')} className="text-slate-500 hover:text-primary text-sm transition-colors">Direct Chat</button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-6 uppercase text-xs tracking-widest">Support</h4>
            <ul className="space-y-4">
              <li>
                <button onClick={() => onPageChange('contact')} className="text-slate-500 hover:text-primary text-sm transition-colors">Contact Us</button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-6 uppercase text-xs tracking-widest">Legal</h4>
            <ul className="space-y-4">
              <li>
                <button onClick={() => onPageChange('terms')} className="text-slate-500 hover:text-primary text-sm transition-colors">Terms of Service</button>
              </li>
              <li>
                <button onClick={() => onPageChange('privacy')} className="text-slate-500 hover:text-primary text-sm transition-colors">Privacy Policy</button>
              </li>
              <li>
                <button onClick={() => onPageChange('privacy')} className="text-slate-500 hover:text-primary text-sm transition-colors">Cookie Policy</button>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-xs uppercase tracking-widest">© 2024 EduSwap. All rights reserved.</p>
          <div className="flex gap-6">
            <button onClick={() => onPageChange('terms')} className="text-slate-400 hover:text-primary text-[10px] uppercase tracking-widest transition-colors">Terms</button>
            <button onClick={() => onPageChange('privacy')} className="text-slate-400 hover:text-primary text-[10px] uppercase tracking-widest transition-colors">Privacy</button>
          </div>
        </div>
      </div>
    </footer>
  );
};

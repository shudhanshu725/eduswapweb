import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, FileText, HelpCircle, Mail, Send, MapPin, Phone, Users } from 'lucide-react';
import { supabase } from '../auth';
import type { Database } from '../supabase.types';

interface InfoPageProps {
  type: 'about' | 'terms' | 'privacy' | 'help' | 'contact';
}

export const InfoPage: React.FC<InfoPageProps> = ({ type }) => {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    try {
      const payload: Database['public']['Tables']['contact_messages']['Insert'] = {
        name: contactForm.name.trim(),
        email: contactForm.email.trim(),
        message: contactForm.message.trim(),
      };
      const { error } = await supabase.from('contact_messages').insert(payload);
      if (error) throw error;

      setContactForm({ name: '', email: '', message: '' });
      setSubmitStatus('success');
    } catch (error) {
      console.error('Failed to submit contact form:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    switch (type) {
      case 'about':
        return (
          <div className="space-y-14">
            <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-sky-50 p-10 md:p-14">
              <div className="absolute -top-20 -right-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
              <div className="absolute -bottom-20 -left-12 h-48 w-48 rounded-full bg-secondary/10 blur-3xl" />
              <div className="relative z-10 flex items-start gap-4 mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <Users size={32} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Who We Are</p>
                  <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mt-2">About EduSwap</h1>
                </div>
              </div>
              <p className="relative z-10 max-w-3xl text-lg leading-relaxed text-slate-700">
                EduSwap is built specifically for Veer Bahadur Singh Purvanchal University students. The goal is simple:
                make student-to-student exchange feel local, useful, and trustworthy.
              </p>
              <div className="relative z-10 mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                  <p className="text-xs uppercase tracking-widest font-bold text-slate-500">Campus</p>
                  <p className="mt-2 text-sm font-bold text-slate-900">VBSPU, Jaunpur</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                  <p className="text-xs uppercase tracking-widest font-bold text-slate-500">Model</p>
                  <p className="mt-2 text-sm font-bold text-slate-900">Peer-to-Peer Sharing</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                  <p className="text-xs uppercase tracking-widest font-bold text-slate-500">Focus</p>
                  <p className="mt-2 text-sm font-bold text-slate-900">Academic + Daily College Needs</p>
                </div>
              </div>
            </div>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <article className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] font-bold text-secondary">Our Mission</p>
                <h2 className="mt-3 text-2xl font-extrabold text-slate-900">Make College Sharing Practical</h2>
                <p className="mt-4 text-slate-600 leading-relaxed">
                  Students should not struggle to find notes, tools, or essentials every semester. EduSwap helps reduce
                  waste and effort by connecting students directly inside one campus ecosystem.
                </p>
              </article>
              <article className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] font-bold text-tertiary">What You Can Exchange</p>
                <h2 className="mt-3 text-2xl font-extrabold text-slate-900">More Than Documents</h2>
                <p className="mt-4 text-slate-600 leading-relaxed">
                  Swap, sell, donate, or share notes, books, lab equipment, electronics, bicycles, calculators,
                  and other student-useful items.
                </p>
              </article>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-slate-900 p-8 md:p-10">
              <p className="text-xs uppercase tracking-[0.2em] font-bold text-slate-300">Community First</p>
              <h2 className="mt-3 text-3xl font-extrabold text-white">Built for Students, Not Generic Marketplaces</h2>
              <p className="mt-4 max-w-3xl text-slate-300 leading-relaxed">
                EduSwap is intentionally campus-centered. It is designed to keep exchange simple, affordable, and relevant
                to real student life at VBSPU.
              </p>
            </section>

            <section className="space-y-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] font-bold text-primary">Our Team</p>
                <h2 className="mt-2 text-3xl font-extrabold text-slate-900">People Behind EduSwap</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  {
                    name: 'Ayush Yadav',
                    role: 'Founder & CEO',
                    desc: 'Leads product vision, strategy, and campus growth for EduSwap at VBSPU.',
                  },
                  {
                    name: 'Shudhanshu Mishra',
                    role: 'Co-Founder',
                    desc: 'Drives platform development, feature execution, and student experience improvements.',
                  },
                ].map((member) => (
                  <article key={member.name} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                      <Users size={22} />
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900">{member.name}</h3>
                    <p className="text-sm font-bold uppercase tracking-wide text-secondary mt-1">{member.role}</p>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{member.desc}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>
        );
      case 'terms':
        return (
          <div className="space-y-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <FileText size={32} />
              </div>
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Terms of Service</h1>
            </div>
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">1. Acceptance of Terms</h2>
              <p className="text-slate-600 leading-relaxed">
                By accessing and using EduSwap, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
            </section>
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">2. User Conduct</h2>
              <p className="text-slate-600 leading-relaxed">
                Users are responsible for the content they upload. You must own the rights to any study materials you share. Plagiarism or unauthorized distribution of copyrighted materials is strictly prohibited.
              </p>
            </section>
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">3. Transactions</h2>
              <p className="text-slate-600 leading-relaxed">
                EduSwap provides a platform for swapping, selling, and donating materials. We are not responsible for the quality of materials or the outcome of individual transactions between users.
              </p>
            </section>
          </div>
        );
      case 'privacy':
        return (
          <div className="space-y-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary">
                <Shield size={32} />
              </div>
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Privacy Policy</h1>
            </div>
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">1. Data Collection</h2>
              <p className="text-slate-600 leading-relaxed">
                We collect information you provide directly to us, such as when you create an account, upload materials, or contact us for support. This includes your name, email, and profile picture.
              </p>
            </section>
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">2. Use of Information</h2>
              <p className="text-slate-600 leading-relaxed">
                We use the information we collect to provide, maintain, and improve our services, to process transactions, and to communicate with you.
              </p>
            </section>
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">3. Data Security</h2>
              <p className="text-slate-600 leading-relaxed">
                We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access.
              </p>
            </section>
          </div>
        );
      case 'help':
        return (
          <div className="space-y-12">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-tertiary/10 rounded-2xl flex items-center justify-center text-tertiary">
                <HelpCircle size={32} />
              </div>
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Help Center</h1>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-lg mb-4">How do I upload?</h3>
                <p className="text-slate-600 text-sm">Navigate to the Upload page, drag and drop your file, fill in the details, and click 'Upload Now'.</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-lg mb-4">What is Swapping?</h3>
                <p className="text-slate-600 text-sm">Swapping allows you to exchange your materials with others without any monetary transaction.</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-lg mb-4">Are payments secure?</h3>
                <p className="text-slate-600 text-sm">We use industry-standard encryption for all transactions. Your financial data is never stored on our servers.</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-lg mb-4">How do I report content?</h3>
                <p className="text-slate-600 text-sm">If you find inappropriate or copyrighted content, please use the report button on the material card.</p>
              </div>
            </div>
          </div>
        );
      case 'contact':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <Mail size={32} />
                </div>
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Contact Us</h1>
              </div>
              <p className="text-slate-600 mb-12 text-lg">
                Have questions or feedback? We'd love to hear from you. Our team is here to help you get the most out of EduSwap.
              </p>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400">Email</p>
                    <p className="font-bold text-slate-900">shudhanshu.webdev23@gamil.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400">Office</p>
                    <p className="font-bold text-slate-900">Veer Bahadur Singh Purvanchal University, Jaunpur, Uttar Pradesh</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400">Phone</p>
                    <p className="font-bold text-slate-900">+91 8896875416</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
              <form className="space-y-6" onSubmit={handleContactSubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 px-1">Your Name</label>
                  <input
                    type="text"
                    className="w-full h-14 px-6 bg-slate-50 rounded-2xl border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="John Doe"
                    value={contactForm.name}
                    onChange={(e) => setContactForm((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 px-1">Email Address</label>
                  <input
                    type="email"
                    className="w-full h-14 px-6 bg-slate-50 rounded-2xl border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="john@example.com"
                    value={contactForm.email}
                    onChange={(e) => setContactForm((prev) => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 px-1">Message</label>
                  <textarea
                    rows={4}
                    className="w-full p-6 bg-slate-50 rounded-2xl border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                    placeholder="How can we help you?"
                    value={contactForm.message}
                    onChange={(e) => setContactForm((prev) => ({ ...prev, message: e.target.value }))}
                    required
                  ></textarea>
                </div>
                {submitStatus === 'success' && (
                  <p className="text-sm font-medium text-emerald-700">Message sent successfully. We will contact you soon.</p>
                )}
                {submitStatus === 'error' && (
                  <p className="text-sm font-medium text-rose-700">Message send failed. Please try again.</p>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-primary text-white rounded-full font-bold text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Send size={20} />
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen pt-32 pb-20 px-6 bg-slate-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        {renderContent()}
      </motion.div>
    </main>
  );
};

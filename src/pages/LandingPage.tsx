import React from 'react';
import { motion } from 'motion/react';
import { Page } from '../types';

interface LandingPageProps {
  onPageChange: (page: Page) => void;
}

const steps = [
  { title: 'List Items', desc: 'List anything students need, from notes to lab tools and bicycles.', icon: 'upload_file' },
  { title: 'Connect', desc: 'Chat directly with students and sellers.', icon: 'forum' },
  { title: 'Exchange', desc: 'Swap, sell, donate, or share resources in one place.', icon: 'swap_horiz' },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onPageChange }) => {
  return (
    <div className="pt-20">
      <section className="relative overflow-hidden px-6 py-16 md:px-10 md:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(0,88,186,0.14),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(0,105,76,0.14),transparent_42%),linear-gradient(180deg,#f6f8ff_0%,#f2f6ff_100%)]" />
        <div className="relative mx-auto grid max-w-7xl items-start gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary">
              <span className="material-symbols-outlined text-sm">school</span>
              Student Exchange Network
            </div>
            <h1 className="mt-6 max-w-3xl font-headline text-5xl font-extrabold leading-tight text-on-surface md:text-7xl">
              One Hub for <span className="text-primary">Swap</span>, <span className="text-secondary">Sell</span>, <span className="text-tertiary">Donate</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-on-surface-variant md:text-xl">
              This platform is dedicated to Veer Bahadur Singh Purvanchal University students. Exchange notes, lab equipment, bicycles, calculators, and other daily college essentials.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => onPageChange('explore')}
                className="rounded-full bg-primary px-7 py-3 font-headline text-sm font-extrabold uppercase tracking-wide text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
              >
                Explore Materials
              </button>
              <button
                onClick={() => onPageChange('upload')}
                className="rounded-full border border-outline-variant/40 bg-white px-7 py-3 font-headline text-sm font-extrabold uppercase tracking-wide text-on-surface transition-all hover:border-primary hover:text-primary"
              >
                Start Uploading
              </button>
            </div>
            <div className="mt-10 rounded-2xl border border-outline-variant/20 bg-white/75 p-4 backdrop-blur md:max-w-lg">
              <p className="text-sm font-bold uppercase tracking-widest text-primary">Campus Focus</p>
              <p className="mt-2 text-on-surface-variant">
                This platform is currently active for Veer Bahadur Singh Purvanchal University students only.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="rounded-[2rem] border border-outline-variant/20 bg-white/85 p-6 shadow-[0_24px_80px_rgba(20,37,90,0.14)] backdrop-blur"
          >
            <div className="grid gap-4">
              <div className="rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-primary">Campus Launch</p>
                <p className="mt-2 text-2xl font-extrabold text-on-surface">Early Access Phase</p>
                <p className="mt-2 text-sm text-on-surface-variant">Live usage data will appear here once students start posting materials.</p>
              </div>
              <div className="rounded-2xl bg-gradient-to-r from-secondary/12 to-secondary/5 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-secondary">Current Status</p>
                <p className="mt-2 text-2xl font-extrabold text-on-surface">No Trends Yet</p>
                <p className="mt-2 text-sm text-on-surface-variant">Trending topics will auto-update after enough uploads and interactions.</p>
              </div>
              <div className="rounded-2xl bg-gradient-to-r from-tertiary/12 to-tertiary/5 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-tertiary">What To Do First</p>
                <p className="mt-2 text-2xl font-extrabold text-on-surface">Upload 1st Resource</p>
                <p className="mt-2 text-sm text-on-surface-variant">Start with one note/PDF so your university feed begins to build.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-6 py-16 md:px-10 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex items-end justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-secondary">How It Works</p>
              <h2 className="mt-3 font-headline text-4xl font-extrabold text-on-surface md:text-5xl">Three Steps. Zero Confusion.</h2>
            </div>
            <button
              onClick={() => onPageChange('community')}
              className="rounded-full border border-outline-variant/30 px-5 py-2 text-xs font-extrabold uppercase tracking-wide text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
            >
              Open Community
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {steps.map((step, i) => (
              <motion.article
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-7 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <span className="material-symbols-outlined">{step.icon}</span>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Step 0{i + 1}</span>
                </div>
                <h3 className="mt-6 font-headline text-2xl font-extrabold text-on-surface">{step.title}</h3>
                <p className="mt-3 text-on-surface-variant">{step.desc}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 md:px-10 md:pb-24">
        <div className="mx-auto max-w-6xl rounded-[2.5rem] border border-outline-variant/20 bg-gradient-to-r from-on-surface to-[#1e2f62] p-10 text-center text-white md:p-16">
          <h2 className="font-headline text-4xl font-extrabold md:text-5xl">Ready to Raise Your Academic Game?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/80">
            Built for Veer Bahadur Singh Purvanchal University to make academic sharing simple, trusted, and local.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => onPageChange('explore')}
              className="rounded-full bg-white px-8 py-3 text-sm font-extrabold uppercase tracking-wide text-on-surface transition-transform hover:scale-[1.03]"
            >
              Browse Now
            </button>
            <button
              onClick={() => onPageChange('upload')}
              className="rounded-full border border-white/35 px-8 py-3 text-sm font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-white/10"
            >
              Upload Material
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

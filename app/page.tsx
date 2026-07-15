'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from '@/app/lib/store';
import { Button } from '@/app/components/ui';
import {
  PrinterIcon,
  UploadIcon,
  PaymentIcon,
  CheckCircleIcon,
  ClockIcon,
  QueueIcon,
  SunIcon,
  MoonIcon,
  ArrowRightIcon,
  StarIcon,
  ShopIcon,
} from '@/app/components/icons';

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-[var(--border-subtle)]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
              <PrinterIcon size={16} className="text-[var(--text-inverse)]" />
            </div>
            <span className="text-lg font-bold text-[var(--text-primary)] tracking-tight">Ordo</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              How it works
            </a>
            <a href="#pricing" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Pricing
            </a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <MoonIcon size={18} /> : <SunIcon size={18} />}
            </button>
            <Link href="/login">
              <Button variant="secondary" size="sm">Sign in</Button>
            </Link>
            <Link href="/shops">
              <Button size="sm">
                Get Started
                <ArrowRightIcon size={14} />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center stagger-children">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-xs)] mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse-soft" />
            <span className="text-xs font-medium text-[var(--text-secondary)]">Now live for colleges across India</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold text-[var(--text-primary)] tracking-tight leading-[1.1] mb-6">
            Upload. Pay.
            <br />
            <span className="gradient-text">Collect.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed">
            Stop the WhatsApp chaos. Ordo lets you upload documents, pay online, and skip the queue at your campus print shop — all from your phone.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/shops">
              <Button size="lg" className="shadow-lg">
                <PrinterIcon size={18} />
                Start Printing
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary" size="lg">
                <ShopIcon size={18} />
                I&apos;m a Shopkeeper
              </Button>
            </Link>
          </div>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-6 mt-12 text-sm text-[var(--text-muted)]">
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-2">
                {['AM', 'KN', 'RV', 'DJ'].map((initials, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full bg-[var(--accent-subtle)] border-2 border-[var(--background)] flex items-center justify-center text-[10px] font-medium text-[var(--text-secondary)]"
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <span>1,200+ students</span>
            </div>
            <span className="w-1 h-1 rounded-full bg-[var(--border-strong)]" />
            <div className="flex items-center gap-1">
              <StarIcon size={14} filled className="text-[var(--warning)]" />
              <span>4.8 rating</span>
            </div>
            <span className="w-1 h-1 rounded-full bg-[var(--border-strong)]" />
            <span>6 print shops</span>
          </div>
        </div>
      </section>

      {/* Hero Visual — Preview Cards */}
      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="relative bg-[var(--surface)] rounded-3xl border border-[var(--border-subtle)] shadow-[var(--shadow-xl)] overflow-hidden p-8 md:p-12">
            {/* Decorative grid */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: 'radial-gradient(circle, var(--text-primary) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }} />

            <div className="relative grid md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div className="bg-[var(--background)] rounded-2xl p-6 border border-[var(--border-subtle)]">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent)] flex items-center justify-center mb-4">
                  <UploadIcon size={18} className="text-[var(--text-inverse)]" />
                </div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-1">Upload</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Drag & drop your PDFs. Auto page counting, live preview, and smart print options.
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <div className="w-6 h-6 rounded bg-[var(--surface-hover)] flex items-center justify-center">📄</div>
                    Physics_Notes.pdf
                    <span className="ml-auto text-[var(--text-muted)]">48 pages</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <div className="w-6 h-6 rounded bg-[var(--surface-hover)] flex items-center justify-center">📄</div>
                    Lab_Report.pdf
                    <span className="ml-auto text-[var(--text-muted)]">12 pages</span>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-[var(--background)] rounded-2xl p-6 border border-[var(--border-subtle)]">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent)] flex items-center justify-center mb-4">
                  <PaymentIcon size={18} className="text-[var(--text-inverse)]" />
                </div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-1">Pay</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Instant pricing. Pay with UPI, cards, or net banking. No cash hassle.
                </p>
                <div className="mt-4 bg-[var(--surface)] rounded-xl p-3 border border-[var(--border-subtle)]">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-[var(--text-muted)]">48 × ₹3</span>
                    <span className="text-[var(--text-secondary)]">₹144</span>
                  </div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-[var(--text-muted)]">Spiral Binding</span>
                    <span className="text-[var(--text-secondary)]">₹30</span>
                  </div>
                  <div className="border-t border-[var(--border-subtle)] pt-1.5 mt-1.5 flex justify-between text-sm font-semibold">
                    <span className="text-[var(--text-primary)]">Total</span>
                    <span className="text-[var(--text-primary)]">₹174</span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-[var(--background)] rounded-2xl p-6 border border-[var(--border-subtle)]">
                <div className="w-10 h-10 rounded-xl bg-[var(--success)] flex items-center justify-center mb-4">
                  <CheckCircleIcon size={18} className="text-white" />
                </div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-1">Collect</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Get your queue number. Track live status. Get notified when ready.
                </p>
                <div className="mt-4 text-center bg-[var(--surface)] rounded-xl p-4 border border-[var(--border-subtle)]">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1">Queue Number</p>
                  <p className="text-3xl font-bold text-[var(--text-primary)]">#27</p>
                  <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-[var(--success)]">
                    <ClockIcon size={12} />
                    ~12 min wait
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="px-6 py-24 bg-[var(--surface)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
              Everything you need,<br />nothing you don&apos;t
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
            {[
              {
                icon: <UploadIcon size={20} />,
                title: 'Smart Upload',
                desc: 'Drag & drop PDFs and images. Auto page counting and instant preview.',
              },
              {
                icon: <QueueIcon size={20} />,
                title: 'Live Queue',
                desc: 'Real-time queue tracking. Know exactly when your prints will be ready.',
              },
              {
                icon: <PaymentIcon size={20} />,
                title: 'Digital Payments',
                desc: 'Pay with UPI, cards, or net banking. No more "exact change" problems.',
              },
              {
                icon: <ClockIcon size={20} />,
                title: 'Save Time',
                desc: 'No waiting in line. Upload from your hostel and collect when ready.',
              },
              {
                icon: <PrinterIcon size={20} />,
                title: 'Custom Options',
                desc: 'Color, B&W, binding, lamination — customize everything per document.',
              },
              {
                icon: <CheckCircleIcon size={20} />,
                title: 'Instant Notifications',
                desc: 'Get notified the moment your prints are ready for collection.',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group p-6 rounded-2xl border border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)] transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center text-[var(--text-secondary)] group-hover:bg-[var(--accent)] group-hover:text-[var(--text-inverse)] transition-all duration-200 mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-1.5">{feature.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">How it works</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
              Three steps. Zero hassle.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Choose a Shop', desc: 'Browse nearby print shops, see queue length, ratings, and estimated wait times.' },
              { step: '02', title: 'Upload & Customize', desc: 'Upload your PDFs, set print options (color, binding, copies), and see instant pricing.' },
              { step: '03', title: 'Pay & Collect', desc: 'Pay online, get your queue number, and track live status. Collect when ready.' },
            ].map((item, i) => (
              <div key={i} className="relative">
                <span className="text-6xl font-bold text-[var(--border)] absolute -top-2 -left-2">{item.step}</span>
                <div className="relative pt-12">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">{item.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-[var(--accent)] rounded-3xl p-12 md:p-16 relative overflow-hidden">
            {/* Decorative */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-1/3 -translate-x-1/3" />

            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-inverse)] tracking-tight mb-4">
                Ready to skip the queue?
              </h2>
              <p className="text-base text-[var(--text-inverse)]/70 mb-8 max-w-lg mx-auto">
                Join 1,200+ students already using Ordo. Upload your first document in under 30 seconds.
              </p>
              <Link href="/shops">
                <Button
                  variant="secondary"
                  size="lg"
                  className="bg-white text-[var(--accent)] hover:bg-white/90 border-none shadow-lg"
                >
                  Get Started — It&apos;s Free
                  <ArrowRightIcon size={16} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-[var(--border-subtle)]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center">
              <PrinterIcon size={13} className="text-[var(--text-inverse)]" />
            </div>
            <span className="font-semibold text-[var(--text-primary)] tracking-tight">Ordo</span>
          </div>

          <div className="flex items-center gap-8 text-sm text-[var(--text-muted)]">
            <Link href="/login" className="hover:text-[var(--text-primary)] transition-colors">Student Login</Link>
            <Link href="/dashboard" className="hover:text-[var(--text-primary)] transition-colors">Shopkeeper</Link>
            <Link href="/admin" className="hover:text-[var(--text-primary)] transition-colors">Admin</Link>
          </div>

          <p className="text-xs text-[var(--text-muted)]">
            © 2024 Ordo. Built with ♥ for college campuses.
          </p>
        </div>
      </footer>
    </div>
  );
}

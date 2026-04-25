'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useStudent } from '@/context/StudentContext';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';

interface School { id: number; name: string; code: string; city: string; state: string; logo: string | null; }

const TRUST_BADGES = [
  { icon: '✅', text: '100% School Approved' },
  { icon: '🔒', text: 'Secure Payments' },
  { icon: '🚚', text: 'School Delivery' },
  { icon: '↩️', text: 'Easy Returns' },
];

const STEPS = [
  { num: '01', image: '/images/lifestyle_1.png', title: 'Create Profile', desc: 'Sign up as a parent and add your child\'s school information to create their profile.', color: '#4f46e5' },
  { num: '02', image: '/images/hero_uniform.png', title: 'Get Verified', desc: 'Submit a verification request to your school administration for fast approval.', color: '#8b5cf6' },
  { num: '03', image: '/images/lifestyle_2.png', title: 'Order Uniforms', desc: 'Browse your school\'s precise official catalogue and select your uniforms.', color: '#06b6d4' },
  { num: '04', image: '/images/testimonial_1.png', title: 'School Delivery', desc: 'Uniforms are delivered safely to the school and handed directly to your child.', color: '#10b981' },
];

const WHY_US = [
  { image: '/images/lifestyle_1.png', title: 'School-Vetted Products', desc: 'Every product is approved by school administration. Zero counterfeit uniforms on our platform.' },
  { image: '/images/lifestyle_2.png', title: 'Bank-Grade Security', desc: 'All payments are encrypted and processed through RBI-compliant payment gateways.' },
  { image: '/images/hero_uniform.png', title: 'Direct School Delivery', desc: 'No hassle shipping. Uniforms go straight to your school\'s distribution point.' },
];

const CATEGORIES = [
  { name: 'Shirts & Tops', image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=500&q=80' },
  { name: 'Trousers & Bottoms', image: 'https://images.unsplash.com/photo-1594938298596-70f56fb3cecb?auto=format&fit=crop&w=500&q=80' },
  { name: 'Blazers & Jackets', image: 'https://images.unsplash.com/photo-1559551409-dadc959f76b8?auto=format&fit=crop&w=500&q=80' },
  { name: 'Shoes & Accessories', image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=500&q=80' }
];

const FAQ = [
  { q: 'Can I order for multiple children?', a: 'Yes! One parent account supports unlimited student profiles. Each student shops from their own school\'s catalogue independently.' },
  { q: 'What happens if my child changes school?', a: 'You can update the school in the student profile and submit a new verification request. Old orders remain accessible in your order history.' },
  { q: 'Are uniforms delivered to home?', a: "Uniforms are shipped to the school and distributed by staff. You'll get notified when ready for pickup — no home delivery needed." },
  { q: 'How long does school verification take?', a: 'Most schools review verification requests within 1–2 working days. You will receive a notification once approved.' },
  { q: 'Can I pay online securely?', a: 'Yes, we use RBI-compliant payment gateways with 256-bit SSL encryption. UPI, cards, and net banking are supported.' },
  { q: 'What if I receive the wrong size?', a: 'Contact the school administration or raise a return request within 7 days of distribution. Exchanges are handled directly through the school.' },
];

export default function LandingPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolSearch, setSchoolSearch] = useState('');
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [heroVisible, setHeroVisible] = useState(false);
  const [latestBlogs, setLatestBlogs] = useState<any[]>([]);
  const { isAuthenticated, role } = useAuth();
  const { students, activeStudent } = useStudent();
  const router = useRouter();
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_URL}/blog/posts/latest/`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setLatestBlogs(data);
        else if (data.results && Array.isArray(data.results)) setLatestBlogs(data.results);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/schools/public/`)
      .then((r) => r.json())
      .then((d) => setSchools(Array.isArray(d) ? d : (d.results ?? [])))
      .catch(console.error)
      .finally(() => setSchoolsLoading(false));
  }, []);

  // Removed auth redirect: Authenticated users can now browse the homepage.

  const filtered = schools.filter((s) => {
    const q = schoolSearch.toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || s.city?.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
  });

  const logoUrl = (logo: string | null) => logo ? (logo.startsWith('http') ? logo : `${API_BASE}${logo}`) : null;

  return (
    <div style={{ fontFamily: 'var(--font-sans)', background: 'var(--mat-bg)', minHeight: '100vh' }}>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <Header />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section ref={heroRef} style={{ 
        position: 'relative', 
        minHeight: '85vh', 
        display: 'flex', 
        alignItems: 'center',
        background: '#0f172a',
        overflow: 'hidden'
      }}>
        {/* Immersive Background Image */}
        <div style={{ 
          position: 'absolute', inset: 0, 
          backgroundImage: 'url("/images/hero_uniform.png")', 
          backgroundSize: 'cover', backgroundPosition: 'center 30%', 
          opacity: 0.6,
          mixBlendMode: 'luminosity'
        }} />
        <div style={{ 
          position: 'absolute', inset: 0, 
          background: 'linear-gradient(90deg, #0f172a 0%, rgba(15, 23, 42, 0.8) 50%, rgba(15, 23, 42, 0.2) 100%)'
        }} />

        <div style={{ maxWidth: 1280, width: '100%', margin: '0 auto', padding: '0 2rem', position: 'relative', zIndex: 10 }}>
          <div style={{ maxWidth: 640, opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'none' : 'translateY(40px)', transition: 'all 1s cubic-bezier(0.25,0.46,0.45,0.94)' }}>
            <span style={{ display: 'inline-block', background: 'rgba(79, 70, 229, 0.2)', color: '#c7d2fe', border: '1px solid rgba(79, 70, 229, 0.4)', borderRadius: '99px', padding: '0.4rem 1rem', fontSize: '0.8125rem', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '1.5rem', backdropFilter: 'blur(4px)' }}>
              TRUSTED BY 500+ SCHOOLS
            </span>
            <h1 style={{ fontSize: 'clamp(2.75rem, 6vw, 4.5rem)', color: 'white', fontWeight: 900, lineHeight: 1.05, margin: '0 0 1.5rem', letterSpacing: '-0.03em' }}>
              The Premium <br/>
              <span style={{ color: '#818cf8' }}>School Uniform</span><br/>
              Experience.
            </h1>
            <p style={{ fontSize: '1.125rem', color: '#cbd5e1', lineHeight: 1.7, margin: '0 0 2.5rem', maxWidth: 540 }}>
              Say goodbye to long queues and hassle. Explore your school's official catalogue with high-definition imagery and order directly to your classroom.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link href="/browse" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'white', color: '#0f172a', fontWeight: 800, fontSize: '1rem', padding: '1rem 2.25rem', borderRadius: '12px', textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.transform = '')}>
                Browse Collections
              </Link>
              <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', fontWeight: 600, fontSize: '1rem', padding: '1rem 2.25rem', borderRadius: '12px', textDecoration: 'none', transition: 'all 0.2s', backdropFilter: 'blur(10px)' }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.15)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)')}>
                Parent Login →
              </Link>
            </div>

            {/* Micro stats banner */}
            <div style={{ display: 'flex', gap: '2.5rem', marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div>
                <div style={{ color: 'white', fontSize: '1.5rem', fontWeight: 800 }}>10k+</div>
                <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Parents Enrolled</div>
              </div>
              <div>
                <div style={{ color: 'white', fontSize: '1.5rem', fontWeight: 800 }}>100%</div>
                <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>School Approved</div>
              </div>
              <div>
                <div style={{ color: 'white', fontSize: '1.5rem', fontWeight: 800 }}>48hr</div>
                <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Avg Delivery</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ACTIVE STUDENT QUICK SHOP (if logged in) ─────────────────────── */}
      {students.length > 0 && (
        <section style={{ background: 'white', borderBottom: '1px solid var(--mat-border)', padding: '1.25rem 2rem' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--mat-text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>Continue shopping for</span>
            {students.map((s) => (
              <Link key={s.id} href={`/store/shop/${s.school}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.625rem', background: activeStudent?.id === s.id ? '#eef2ff' : '#f8fafc', border: `1.5px solid ${activeStudent?.id === s.id ? '#a5b4fc' : '#e2e8f0'}`, borderRadius: '10px', padding: '0.5rem 0.875rem', textDecoration: 'none', color: 'inherit', transition: 'all 0.15s', flexShrink: 0 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: s.is_verified ? '#4f46e5' : '#f59e0b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>{s.student_name.charAt(0)}</div>
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{s.student_name}</span>
                <span style={{ fontSize: '0.75rem' }}>{s.is_verified ? '✅' : '⏳'}</span>
              </Link>
            ))}
            <Link href="/store/students/new" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--mat-primary)', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none', padding: '0.5rem 0.875rem', border: '1.5px dashed #a5b4fc', borderRadius: '10px', whiteSpace: 'nowrap' }}>+ Add Student</Link>
          </div>
        </section>
      )}

      {/* ── VISUAL CATEGORIES ────────────────────────────────────────────── */}
      <section className="mat-section" style={{ background: 'var(--mat-surface-2)', padding: '5rem 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <h2 className="mat-section-title">Shop by Category</h2>
              <p className="mat-section-subtitle" style={{ marginTop: '0.5rem' }}>High-quality uniforms curated for your school.</p>
            </div>
            <Link href="/browse" style={{ color: 'var(--mat-primary)', fontWeight: 700, textDecoration: 'none', fontSize: '0.9375rem' }}>View the Catalogue →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
            {CATEGORIES.map((cat, i) => (
              <div key={i} style={{ borderRadius: '16px', overflow: 'hidden', position: 'relative', aspectRatio: '4/5', cursor: 'pointer', group: 'true' }}>
                <img src={cat.image} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)' }} />
                <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', right: '1.5rem' }}>
                  <h3 style={{ margin: 0, color: 'white', fontSize: '1.25rem', fontWeight: 800 }}>{cat.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS — Image Process ────────────────────────────── */}
      <section className="mat-section" style={{ background: 'white' }}>
        <div className="mat-section-inner">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <span style={{ display: 'inline-block', color: 'var(--mat-primary)', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' }}>Seamless Process</span>
            <h2 className="mat-section-title" style={{ textAlign: 'center' }}>Ordering Made Beautifully Simple</h2>
            <p className="mat-section-subtitle" style={{ textAlign: 'center', margin: '0.75rem auto 0' }}>From signing up to uniform delivery — managed effortlessly online.</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem' }}>
            {STEPS.map((step, i) => (
              <div key={i} className={`mat-animate mat-animate-${i + 1}`} style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', aspectRatio: '3/2', marginBottom: '1.5rem' }}>
                  <img src={step.image} alt={step.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: 12, left: 12, width: 32, height: 32, background: 'white', color: step.color, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 900, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>{step.num}</div>
                </div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, margin: '0 0 0.625rem', color: 'var(--mat-text-1)' }}>{step.title}</h3>
                <p style={{ fontSize: '0.9375rem', color: 'var(--mat-text-2)', lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED SCHOOLS ─────────────────────────────────────────────── */}
      <section className="mat-section" style={{ background: 'var(--mat-bg)' }}>
        <div className="mat-section-inner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 className="mat-section-title">Partner Schools</h2>
              <p className="mat-section-subtitle" style={{ marginTop: '0.5rem' }}>Explore the official uniform catalogues for these schools.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'white', border: '1.5px solid var(--mat-border)', borderRadius: '12px', padding: '0.625rem 1rem', boxShadow: 'var(--mat-shadow-1)', minWidth: 280 }}>
              <span style={{ color: 'var(--mat-text-3)' }}>🔍</span>
              <input value={schoolSearch} onChange={(e) => setSchoolSearch(e.target.value)} placeholder="Search schools or city…" style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.9rem', flex: 1, color: 'var(--mat-text-1)' }} />
            </div>
          </div>

          {schoolsLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="mat-shimmer" style={{ height: 180, borderRadius: '16px' }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--mat-text-3)' }}>No schools match your search.</div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {filtered.slice(0, 6).map((school, i) => {
                  const img = logoUrl(school.logo);
                  return (
                    <Link key={school.id} href={`/browse/${school.id}`} className={`mat-card mat-animate mat-animate-${Math.min(i + 1, 6)}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', gap: '1.25rem', padding: '1.5rem' }}>
                      <div style={{ width: 80, height: 80, borderRadius: '16px', background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', overflow: 'hidden', flexShrink: 0, padding: img ? 0 : '1rem' }}>
                        {img ? <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : '🏫'}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1.0625rem', marginBottom: '0.25rem', color: 'var(--mat-text-1)', lineHeight: 1.3 }}>{school.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--mat-text-3)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            📍 {[school.city, school.state].filter(Boolean).join(', ') || 'India'}
                          </div>
                        </div>
                        <div style={{ marginTop: '0.75rem' }}>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--mat-primary)' }}>View Catalogue →</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
              {filtered.length > 6 && (
                <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                  <Link href="/browse" className="mat-btn" style={{ background: 'white', color: 'var(--mat-text-1)', border: '1px solid #cbd5e1', boxShadow: 'var(--mat-shadow-1)', padding: '0.875rem 2.5rem', borderRadius: '12px', fontSize: '0.9375rem', fontWeight: 600 }}>
                    View All {filtered.length} Schools
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── WHY CHOOSE ESCHOOLKART — Lifestyle Cards ─────────────────────────────────── */}
      <section className="mat-section" style={{ background: 'white' }}>
        <div className="mat-section-inner">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 className="mat-section-title" style={{ textAlign: 'center' }}>The Smart Way to Shop for Uniforms</h2>
            <p className="mat-section-subtitle" style={{ textAlign: 'center', margin: '0.75rem auto 0' }}>We paired top-tier technology with meticulous school integrations.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {WHY_US.map((item, i) => (
              <div key={i} className={`mat-animate mat-animate-${Math.min(i + 1, 6)}`} style={{ background: 'var(--mat-surface)', border: '1px solid var(--mat-border)', borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ width: '100%', height: 200 }}>
                  <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '2rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.75rem', color: 'var(--mat-text-1)' }}>{item.title}</h3>
                  <p style={{ fontSize: '0.9375rem', color: 'var(--mat-text-2)', margin: 0, lineHeight: 1.6 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────────────── */}
      <section style={{ background: '#0f172a', padding: '5rem 2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=2000&q=80")', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.1 }} />
        <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto', zIndex: 10 }}>
          <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 900, color: 'white', letterSpacing: '-0.04em', margin: '0 0 1.125rem' }}>Ready to Order Your Child's Uniforms?</h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.0625rem', margin: '0 0 2.5rem', lineHeight: 1.6 }}>Join thousands of parents who've upgraded their uniform shopping experience.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--mat-primary)', color: 'white', fontWeight: 800, fontSize: '1rem', padding: '1rem 2.5rem', borderRadius: '12px', textDecoration: 'none', boxShadow: '0 8px 32px rgba(79,70,229,0.4)' }}>Get Started Now</Link>
          </div>
        </div>
      </section>

      {/* ── LATEST FROM BLOG ─────────────────────────────────────────────────────────── */}
      {Array.isArray(latestBlogs) && latestBlogs.length > 0 && (
        <section style={{ padding: '6rem 2rem', background: '#fafafa' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
              <div>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--mat-text-1)', letterSpacing: '-0.03em', margin: '0 0 0.5rem' }}>Latest Guides & Updates</h2>
                <p style={{ fontSize: '1.125rem', color: 'var(--mat-text-2)', margin: 0 }}>News from around the eSchoolKart ecosystem.</p>
              </div>
              <Link href="/blog" style={{ color: 'var(--mat-primary)', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>View All Posts →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem' }}>
              {latestBlogs.map((post, i) => (
                <Link href={`/blog/${post.slug}`} key={i} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: 'var(--mat-shadow-1)', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column', height: '100%' }}
                       onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
                       onMouseLeave={(e) => (e.currentTarget.style.transform = '')}>
                    <div style={{ height: 200, background: '#f1f5f9', overflow: 'hidden' }}>
                      {post.featured_image ? (
                        <img src={post.featured_image.startsWith('http') ? post.featured_image : API_BASE + post.featured_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '2rem' }}>📝</div>
                      )}
                    </div>
                    <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>{post.category?.name || 'Uncategorized'}</div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 1rem', lineHeight: 1.4 }}>{post.title}</h3>
                      <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: 'auto' }}>{new Date(post.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric'})}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── TESTIMONIALS ──────────────────────────────────────────────────────── */}
      <section className="mat-section" style={{ background: '#0f172a', padding: '6rem 2rem' }}>
        <div className="mat-section-inner">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <span style={{ display: 'inline-block', color: '#818cf8', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' }}>Trusted Nationwide</span>
            <h2 className="mat-section-title" style={{ color: 'white', textAlign: 'center' }}>What Parents Say</h2>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '2.5rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ color: '#fbbf24', fontSize: '1.25rem', marginBottom: '1rem', letterSpacing: '2px' }}>★★★★★</div>
              <p style={{ fontSize: '1.125rem', color: '#e2e8f0', lineHeight: 1.6, flex: 1, fontStyle: 'italic', marginBottom: '2rem' }}>
                "We used to stand in line for 3 hours every summer just to get the right sizes. With eSchoolKart, I ordered directly from my phone and my son's new blazer was delivered straight to his homeroom teacher."
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img src="/images/testimonial_1.png" alt="Happy Parent" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid #4f46e5' }} />
                <div>
                  <h4 style={{ margin: 0, color: 'white', fontWeight: 700, fontSize: '1rem' }}>Priyanka S.</h4>
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.875rem' }}>Parent • St. Jude's Academy</p>
                </div>
              </div>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '2.5rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ color: '#fbbf24', fontSize: '1.25rem', marginBottom: '1rem', letterSpacing: '2px' }}>★★★★★</div>
              <p style={{ fontSize: '1.125rem', color: '#e2e8f0', lineHeight: 1.6, flex: 1, fontStyle: 'italic', marginBottom: '2rem' }}>
                "The quality of the material is incredibly premium, and it perfectly matches the school's strict guidelines. I had peace of mind knowing these weren't counterfeit knockoffs."
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img src="/images/testimonial_2.png" alt="Happy Parent" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid #8b5cf6' }} />
                <div>
                  <h4 style={{ margin: 0, color: 'white', fontWeight: 700, fontSize: '1rem' }}>Rajesh V.</h4>
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.875rem' }}>Parent • Oakwood International</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section style={{ padding: '6rem 2rem', background: 'white' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--mat-text-1)', letterSpacing: '-0.03em', margin: '0 0 1rem' }}>Frequently Asked Questions</h2>
            <p style={{ fontSize: '1.125rem', color: 'var(--mat-text-2)', margin: 0 }}>Everything you need to know about the platform.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {FAQ.map((faq, i) => (
              <div 
                key={i} 
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1.0625rem', color: '#0f172a' }}>{faq.q}</h4>
                  <span style={{ color: '#4f46e5', fontWeight: 800, fontSize: '1.5rem', lineHeight: 0.5, transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.25s' }}>+</span>
                </div>
                {openFaq === i && (
                  <div style={{ padding: '0 1.5rem 1.5rem', color: '#64748b', lineHeight: 1.6, fontSize: '0.9375rem' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA BEFORE FOOTER ─────────────────────────────────────── */}
      <section style={{ background: '#030712', padding: '5rem 2rem', textAlign: 'center', position: 'relative', overflow: 'hidden', borderTop: '1px solid #1f2937' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(79, 70, 229, 0.15) 0%, transparent 60%)' }} />
        <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto', zIndex: 10 }}>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, color: 'white', letterSpacing: '-0.04em', margin: '0 0 1rem', lineHeight: 1.1 }}>
            Ready for a seamless school year?
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '1.125rem', margin: '0 0 2.5rem', lineHeight: 1.6 }}>
            Create your parent profile in 60 seconds and start exploring your school's catalog today.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'white', color: '#0f172a', fontWeight: 800, fontSize: '1.125rem', padding: '1rem 2.5rem', borderRadius: '14px', textDecoration: 'none', transition: 'transform 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

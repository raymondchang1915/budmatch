'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Home() {
  const [matched, setMatched] = useState(false)
  const [sparked, setSparked] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setMatched(true), 900)
    const t2 = setTimeout(() => setSparked(true), 1500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <main className="min-h-screen bg-[#f5f5f0] relative overflow-hidden">

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

        .font-display { font-family: 'Instrument Serif', serif; }
        .font-body    { font-family: 'DM Sans', sans-serif; }

        @keyframes slideInLeft {
          from { transform: translateX(60px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(-60px); opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
        @keyframes popIn {
          0%   { transform: scale(0); opacity: 0; }
          60%  { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-5px); }
        }

        .bud-enter-left  { animation: slideInLeft  0.6s cubic-bezier(0.34,1.4,0.64,1) 0.1s both; }
        .bud-enter-right { animation: slideInRight 0.6s cubic-bezier(0.34,1.4,0.64,1) 0.1s both; }
        .floating        { animation: float 3.5s ease-in-out infinite; }
        .fade-up-1 { animation: fadeUp 0.6s ease 0.1s both; }
        .fade-up-2 { animation: fadeUp 0.6s ease 0.25s both; }
        .fade-up-3 { animation: fadeUp 0.6s ease 0.4s both; }
        .fade-up-4 { animation: fadeUp 0.6s ease 1.7s both; }
        .fade-up-5 { animation: fadeUp 0.6s ease 1.9s both; }
        .fade-up-6 { animation: fadeUp 0.6s ease 2.1s both; }

        .step-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .step-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.07) !important;
        }

        /* Hero layout */
        .hero-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          align-items: center;
        }

        /* Steps layout */
        .steps-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        /* Stats layout */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
        }

        /* Mobile overrides */
        @media (max-width: 768px) {
          .hero-grid {
            grid-template-columns: 1fr;
            gap: 0;
          }
          .steps-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          .stats-grid {
            grid-template-columns: 1fr;
            gap: 1px;
          }
          .hero-text h1 {
            font-size: 52px !important;
            letter-spacing: -1.5px !important;
          }
          .bud-wrap {
            height: 220px !important;
            margin-bottom: 0 !important;
          }
          .bud-size {
            width: 76px !important;
            height: 76px !important;
          }
          .stat-item {
            border-right: none !important;
            border-bottom: 1px solid rgba(0,0,0,0.06) !important;
          }
          .stat-item:last-child {
            border-bottom: none !important;
          }
          .cta-strip {
            flex-direction: column !important;
            gap: 16px !important;
            text-align: center !important;
          }
          .cta-strip a {
            width: 100% !important;
            text-align: center !important;
          }
        }
      `}</style>

      {/* Dot pattern */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle, #00000014 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
      }} />

      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section className="relative max-w-6xl mx-auto px-4 sm:px-8 pt-28 sm:pt-32 pb-12 sm:pb-16">
        <div className="hero-grid">

          {/* Left — text */}
          <div className="hero-text">
            <div className="fade-up-1" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <div style={{ height: 1, width: 28, background: '#999' }} />
              <span className="font-body" style={{ fontSize: 11, color: '#999', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                The marketplace for missing earbuds
              </span>
            </div>

            <h1 className="fade-up-1 font-display" style={{
              fontSize: 68, lineHeight: 0.95,
              color: '#111', marginBottom: 20,
              letterSpacing: '-2px', fontWeight: 400,
            }}>
              Find your<br />
              <span style={{ fontStyle: 'italic' }}>missing half.</span>
            </h1>

            <p className="fade-up-2 font-body" style={{
              fontSize: 15, color: '#666',
              lineHeight: 1.75, marginBottom: 32, maxWidth: 360,
            }}>
              Lost one earbud? Someone out there has yours and needs yours.
              BudMatch connects you both — for a fraction of the replacement cost.
            </p>

            <div className="fade-up-3" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href="/listings/new" className="font-body" style={{
                background: '#111', color: '#fff',
                padding: '12px 26px', borderRadius: 999,
                fontWeight: 500, fontSize: 13,
                textDecoration: 'none',
              }}>
                Post a listing →
              </Link>
              <Link href="/browse" className="font-body" style={{
                background: '#fff', color: '#444',
                border: '1px solid #e0e0e0',
                padding: '12px 26px', borderRadius: 999,
                fontWeight: 400, fontSize: 13,
                textDecoration: 'none',
              }}>
                Browse listings
              </Link>
            </div>
          </div>

          {/* Right — earbud animation */}
          <div className="bud-wrap" style={{
            position: 'relative', height: 280,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginTop: 0,
          }}>

            {/* Green glow */}
            <div style={{
              position: 'absolute', width: 200, height: 200,
              borderRadius: '50%', zIndex: 0,
              background: 'radial-gradient(circle, rgba(34,197,94,0.18) 0%, transparent 70%)',
              opacity: sparked ? 1 : 0,
              transform: sparked ? 'scale(1)' : 'scale(0.5)',
              transition: 'opacity 0.5s ease, transform 0.5s ease',
            }} />

            {/* Left bud */}
            <div
              className={`bud-enter-left ${sparked ? 'floating' : ''}`}
              style={{
                position: 'absolute',
                left: matched ? 'calc(50% - 58px)' : '8%',
                transition: matched ? 'left 0.7s cubic-bezier(0.34,1.3,0.64,1)' : 'none',
                zIndex: 2,
              }}
            >
              <div className="bud-size" style={{
                width: 90, height: 90,
                borderRadius: '50% 50% 50% 18%',
                background: '#111',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: sparked
                  ? '0 0 0 3px rgba(34,197,94,0.35), 0 12px 32px rgba(0,0,0,0.2)'
                  : '0 12px 32px rgba(0,0,0,0.15)',
                transition: 'box-shadow 0.4s ease',
                position: 'relative',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1.5px solid rgba(255,255,255,0.2)',
                }} />
                <div style={{
                  position: 'absolute', bottom: 13, right: 13,
                  width: 9, height: 9, borderRadius: '50%',
                  background: sparked ? '#22c55e' : 'rgba(255,255,255,0.25)',
                  transition: 'background 0.3s ease',
                  boxShadow: sparked ? '0 0 8px rgba(34,197,94,0.8)' : 'none',
                }} />
                <span className="font-body" style={{
                  position: 'absolute', top: 9, right: 9,
                  fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 500,
                }}>L</span>
              </div>
            </div>

            {/* Match dot */}
            {sparked && (
              <div style={{
                position: 'absolute', zIndex: 10,
                animation: 'popIn 0.4s cubic-bezier(0.34,1.4,0.64,1) both',
              }}>
                <div style={{
                  width: 9, height: 9, borderRadius: '50%',
                  background: '#22c55e',
                  boxShadow: '0 0 14px rgba(34,197,94,0.9)',
                }} />
              </div>
            )}

            {/* Right bud */}
            <div
              className={`bud-enter-right ${sparked ? 'floating' : ''}`}
              style={{
                position: 'absolute',
                right: matched ? 'calc(50% - 58px)' : '8%',
                transition: matched ? 'right 0.7s cubic-bezier(0.34,1.3,0.64,1)' : 'none',
                zIndex: 2,
                animationDelay: '0.1s',
              }}
            >
              <div className="bud-size" style={{
                width: 90, height: 90,
                borderRadius: '50% 50% 18% 50%',
                background: '#111',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: sparked
                  ? '0 0 0 3px rgba(34,197,94,0.35), 0 12px 32px rgba(0,0,0,0.2)'
                  : '0 12px 32px rgba(0,0,0,0.15)',
                transition: 'box-shadow 0.4s ease',
                position: 'relative',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1.5px solid rgba(255,255,255,0.2)',
                }} />
                <div style={{
                  position: 'absolute', bottom: 13, left: 13,
                  width: 9, height: 9, borderRadius: '50%',
                  background: sparked ? '#22c55e' : 'rgba(255,255,255,0.25)',
                  transition: 'background 0.3s ease',
                  boxShadow: sparked ? '0 0 8px rgba(34,197,94,0.8)' : 'none',
                }} />
                <span className="font-body" style={{
                  position: 'absolute', top: 9, left: 9,
                  fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 500,
                }}>R</span>
              </div>
            </div>

            {/* Matched badge */}
            <div style={{
              position: 'absolute', bottom: 20,
              background: sparked ? '#fff' : 'transparent',
              border: sparked ? '1px solid #e8e8e8' : '1px solid transparent',
              borderRadius: 999, padding: '5px 14px',
              display: 'flex', alignItems: 'center', gap: 6,
              opacity: sparked ? 1 : 0,
              transform: sparked ? 'translateY(0)' : 'translateY(8px)',
              transition: 'all 0.4s ease 0.2s',
              boxShadow: sparked ? '0 4px 12px rgba(0,0,0,0.07)' : 'none',
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
              <span className="font-body" style={{ fontSize: 11, color: '#444', fontWeight: 500 }}>
                Matched
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────────────────────── */}
      <section className="fade-up-4 relative max-w-6xl mx-auto px-4 sm:px-8 pb-12 sm:pb-16">
        <div className="stats-grid" style={{
          background: '#e8e8e8',
          borderRadius: 20, overflow: 'hidden',
          border: '1px solid #e0e0e0',
        }}>
          {[
            { val: '50+', label: 'Earbud models' },
            { val: 'LKR', label: 'Sri Lankan Rupees' },
            { val: '2×', label: 'Cheaper than new' },
          ].map((s, i) => (
            <div key={i} className="stat-item" style={{
              padding: '24px 28px',
              background: '#fff',
              borderRight: i < 2 ? '1px solid #e8e8e8' : 'none',
            }}>
              <p className="font-display" style={{ fontSize: 32, color: '#111', marginBottom: 4 }}>{s.val}</p>
              <p className="font-body" style={{ fontSize: 12, color: '#999' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────── */}
      <section className="relative max-w-6xl mx-auto px-4 sm:px-8 pb-16 sm:pb-24">

        <div className="fade-up-5" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
          <div style={{ height: 1, width: 28, background: '#999' }} />
          <span className="font-body" style={{ fontSize: 11, color: '#999', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            How it works
          </span>
        </div>

        <div className="fade-up-5 steps-grid">
          {[
            {
              num: '01',
              title: 'Post what you have',
              desc: 'Tell us your model, which bud you have, its condition, and your asking price.',
            },
            {
              num: '02',
              title: 'Get auto-matched',
              desc: 'Our algorithm finds the best match — same model, opposite bud, closest location.',
            },
            {
              num: '03',
              title: 'Negotiate & trade',
              desc: 'Agree on a price, pay the platform fee, and chat to arrange the handoff.',
            },
          ].map((step, i) => (
            <div key={i} className="step-card" style={{
              background: '#fff',
              border: '1px solid #e8e8e8',
              borderRadius: 20, padding: '28px 28px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}>
              <span className="font-body" style={{
                fontSize: 10, color: '#ccc',
                letterSpacing: '0.15em', display: 'block', marginBottom: 16,
              }}>
                {step.num}
              </span>
              <h3 className="font-display" style={{
                fontSize: 20, color: '#111',
                marginBottom: 10, lineHeight: 1.2,
              }}>
                {step.title}
              </h3>
              <p className="font-body" style={{
                fontSize: 13, color: '#888', lineHeight: 1.7, margin: 0,
              }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="fade-up-6 cta-strip" style={{
          marginTop: 12,
          background: '#111',
          borderRadius: 20, padding: '28px 32px',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 20,
        }}>
          <div>
            <p className="font-display" style={{ fontSize: 18, color: '#fff', marginBottom: 4 }}>
              Apple · Samsung · Sony · JBL · Bose · Jabra · and 40+ more
            </p>
            <p className="font-body" style={{ fontSize: 12, color: '#666' }}>
              All major earbud models supported
            </p>
          </div>
          <Link href="/listings/new" className="font-body" style={{
            background: '#fff', color: '#111',
            padding: '11px 22px', borderRadius: 999,
            fontWeight: 500, fontSize: 13,
            textDecoration: 'none', whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            Find your match →
          </Link>
        </div>

      </section>

    </main>
  )
}
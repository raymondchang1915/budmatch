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
          from { transform: translateX(80px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(-80px); opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
        @keyframes meetLeft {
          from { left: 12%; }
          to   { left: calc(50% - 68px); }
        }
        @keyframes meetRight {
          from { right: 12%; }
          to   { right: calc(50% - 68px); }
        }
        @keyframes popIn {
          0%   { transform: scale(0); opacity: 0; }
          60%  { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
        @keyframes greenPulse {
          0%   { transform: scale(0.8); opacity: 0; }
          50%  { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1);   opacity: 0.6; }
        }
        @keyframes dotGrid {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .bud-enter-left  { animation: slideInLeft  0.6s cubic-bezier(0.34,1.4,0.64,1) 0.1s both; }
        .bud-enter-right { animation: slideInRight 0.6s cubic-bezier(0.34,1.4,0.64,1) 0.1s both; }
        .floating        { animation: float 3.5s ease-in-out infinite; }
        .fade-up-1       { animation: fadeUp 0.6s ease 1.7s both; }
        .fade-up-2       { animation: fadeUp 0.6s ease 1.9s both; }
        .fade-up-3       { animation: fadeUp 0.6s ease 2.1s both; }
        .fade-up-4       { animation: fadeUp 0.6s ease 2.3s both; }
        .fade-up-5       { animation: fadeUp 0.6s ease 2.5s both; }

        .step-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .step-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.08) !important;
        }
      `}</style>

      {/* Dot pattern */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle, #00000014 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
      }} />

      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section className="relative max-w-6xl mx-auto px-8 pt-32 pb-16">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>

          {/* Left — text */}
          <div>
            <div className="fade-up-1" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
              <div style={{ height: 1, width: 32, background: '#999' }} />
              <span className="font-body" style={{ fontSize: 12, color: '#999', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                The marketplace for missing earbuds
              </span>
            </div>

            <h1 className="fade-up-1 font-display" style={{
              fontSize: 68, lineHeight: 0.95,
              color: '#111', marginBottom: 24,
              letterSpacing: '-2px', fontWeight: 400,
            }}>
              Find your<br />
              <span style={{ fontStyle: 'italic' }}>missing half.</span>
            </h1>

            <p className="fade-up-2 font-body" style={{
              fontSize: 15, color: '#666',
              lineHeight: 1.75, marginBottom: 36, maxWidth: 360,
            }}>
              Lost one earbud? Someone out there has yours and needs yours.
              BudMatch connects you both — for a fraction of the replacement cost.
            </p>

            <div className="fade-up-3" style={{ display: 'flex', gap: 10 }}>
              <Link href="/listings/new" className="font-body" style={{
                background: '#111', color: '#fff',
                padding: '12px 26px', borderRadius: 999,
                fontWeight: 500, fontSize: 13,
                textDecoration: 'none', display: 'inline-flex',
                alignItems: 'center', gap: 6,
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = '#000')}
                onMouseLeave={e => (e.currentTarget.style.background = '#111')}
              >
                Post a listing →
              </Link>
              <Link href="/browse" className="font-body" style={{
                background: '#fff', color: '#444',
                border: '1px solid #e0e0e0',
                padding: '12px 26px', borderRadius: 999,
                fontWeight: 400, fontSize: 13,
                textDecoration: 'none',
                transition: 'border-color 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#999')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#e0e0e0')}
              >
                Browse listings
              </Link>
            </div>
          </div>

          {/* Right — earbud animation */}
          <div style={{ position: 'relative', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

            {/* Green glow — appears on match */}
            <div style={{
              position: 'absolute', width: 220, height: 220,
              borderRadius: '50%', zIndex: 0,
              background: 'radial-gradient(circle, rgba(34,197,94,0.18) 0%, transparent 70%)',
              opacity: sparked ? 1 : 0,
              transform: sparked ? 'scale(1)' : 'scale(0.6)',
              transition: 'opacity 0.5s ease, transform 0.5s ease',
            }} />

            {/* Left bud — purple-ish dark */}
            <div
              className={`bud-enter-left ${sparked ? 'floating' : ''}`}
              style={{
                position: 'absolute',
                left: matched ? 'calc(50% - 68px)' : '12%',
                transition: matched ? 'left 0.7s cubic-bezier(0.34,1.3,0.64,1)' : 'none',
                zIndex: 2,
              }}
            >
              <div style={{
                width: 96, height: 96,
                borderRadius: '50% 50% 50% 18%',
                background: '#111',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: sparked
                  ? '0 0 0 3px rgba(34,197,94,0.4), 0 16px 40px rgba(0,0,0,0.25)'
                  : '0 16px 40px rgba(0,0,0,0.2)',
                transition: 'box-shadow 0.4s ease',
                position: 'relative',
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1.5px solid rgba(255,255,255,0.2)',
                }} />
                <div style={{
                  position: 'absolute', bottom: 14, right: 14,
                  width: 10, height: 10, borderRadius: '50%',
                  background: sparked ? '#22c55e' : 'rgba(255,255,255,0.3)',
                  transition: 'background 0.3s ease',
                  boxShadow: sparked ? '0 0 8px rgba(34,197,94,0.8)' : 'none',
                }} />
                <span className="font-body" style={{
                  position: 'absolute', top: 10, right: 10,
                  fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: 500,
                }}>L</span>
              </div>
            </div>

            {/* Match dot — appears between buds */}
            {sparked && (
              <div style={{
                position: 'absolute', zIndex: 10,
                animation: 'popIn 0.4s cubic-bezier(0.34,1.4,0.64,1) both',
              }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: '#22c55e',
                  boxShadow: '0 0 16px rgba(34,197,94,0.9)',
                }} />
              </div>
            )}

            {/* Right bud */}
            <div
              className={`bud-enter-right ${sparked ? 'floating' : ''}`}
              style={{
                position: 'absolute',
                right: matched ? 'calc(50% - 68px)' : '12%',
                transition: matched ? 'right 0.7s cubic-bezier(0.34,1.3,0.64,1)' : 'none',
                zIndex: 2,
                animationDelay: '0.1s',
              }}
            >
              <div style={{
                width: 96, height: 96,
                borderRadius: '50% 50% 18% 50%',
                background: '#111',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: sparked
                  ? '0 0 0 3px rgba(34,197,94,0.4), 0 16px 40px rgba(0,0,0,0.25)'
                  : '0 16px 40px rgba(0,0,0,0.2)',
                transition: 'box-shadow 0.4s ease',
                position: 'relative',
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1.5px solid rgba(255,255,255,0.2)',
                }} />
                <div style={{
                  position: 'absolute', bottom: 14, left: 14,
                  width: 10, height: 10, borderRadius: '50%',
                  background: sparked ? '#22c55e' : 'rgba(255,255,255,0.3)',
                  transition: 'background 0.3s ease',
                  boxShadow: sparked ? '0 0 8px rgba(34,197,94,0.8)' : 'none',
                }} />
                <span className="font-body" style={{
                  position: 'absolute', top: 10, left: 10,
                  fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: 500,
                }}>R</span>
              </div>
            </div>

            {/* Matched badge */}
            <div style={{
              position: 'absolute', bottom: 24,
              background: sparked ? '#fff' : 'transparent',
              border: sparked ? '1px solid #e8e8e8' : '1px solid transparent',
              borderRadius: 999, padding: '6px 14px',
              display: 'flex', alignItems: 'center', gap: 6,
              opacity: sparked ? 1 : 0,
              transform: sparked ? 'translateY(0)' : 'translateY(8px)',
              transition: 'all 0.4s ease 0.2s',
              boxShadow: sparked ? '0 4px 16px rgba(0,0,0,0.08)' : 'none',
            }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
              <span className="font-body" style={{ fontSize: 12, color: '#444', fontWeight: 500 }}>
                Matched
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────── */}
      <section className="relative max-w-6xl mx-auto px-8 pb-32">

        <div className="fade-up-4" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 56 }}>
          <div style={{ height: 1, width: 32, background: '#999' }} />
          <span className="font-body" style={{ fontSize: 12, color: '#999', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            How it works
          </span>
        </div>

        <div className="fade-up-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            {
              num: '01',
              title: 'Post what you have',
              desc: 'Tell us your model, which bud you have, its condition, and your asking price.',
              accent: '#111',
            },
            {
              num: '02',
              title: 'Get auto-matched',
              desc: 'Our algorithm finds the best match — same model, opposite bud, closest location.',
              accent: '#111',
            },
            {
              num: '03',
              title: 'Negotiate & trade',
              desc: 'Agree on a price, pay the platform fee, and chat to arrange the handoff.',
              accent: '#111',
            },
          ].map((step, i) => (
            <div key={i} className="step-card" style={{
              background: '#fff',
              border: '1px solid #e8e8e8',
              borderRadius: 20, padding: 32,
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            }}>
              <span className="font-body" style={{
                fontSize: 11, color: '#bbb',
                letterSpacing: '0.15em', display: 'block', marginBottom: 20,
              }}>
                {step.num}
              </span>
              <h3 className="font-display" style={{
                fontSize: 22, color: '#111',
                marginBottom: 12, lineHeight: 1.2,
              }}>
                {step.title}
              </h3>
              <p className="font-body" style={{
                fontSize: 14, color: '#888', lineHeight: 1.7,
              }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom CTA strip */}
        <div className="fade-up-5" style={{
          marginTop: 16,
          background: '#111',
          borderRadius: 20, padding: '32px 40px',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 24,
        }}>
          <div>
            <p className="font-display" style={{ fontSize: 22, color: '#fff', marginBottom: 4 }}>
              Apple · Samsung · Sony · JBL · Bose · Jabra · and 40+ more
            </p>
            <p className="font-body" style={{ fontSize: 13, color: '#666' }}>
              All major earbud models supported
            </p>
          </div>
          <Link href="/listings/new" className="font-body" style={{
            background: '#fff', color: '#111',
            padding: '12px 24px', borderRadius: 999,
            fontWeight: 500, fontSize: 13,
            textDecoration: 'none', whiteSpace: 'nowrap',
            flexShrink: 0,
            transition: 'opacity 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Find your match →
          </Link>
        </div>

      </section>

    </main>
  )
}
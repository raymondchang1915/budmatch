'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Home() {
  const [matched, setMatched] = useState(false)
  const [sparked, setSparked] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setMatched(true), 800)
    const t2 = setTimeout(() => setSparked(true), 1400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <main className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">

      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; }

        .font-display { font-family: 'Instrument Serif', serif; }
        .font-body { font-family: 'DM Sans', sans-serif; }

        @keyframes slideLeft {
          from { transform: translateX(120px) scale(0.85); opacity: 0; }
          to   { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes slideRight {
          from { transform: translateX(-120px) scale(0.85); opacity: 0; }
          to   { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes matchPulse {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
        @keyframes sparkle {
          0%   { opacity: 0; transform: scale(0) rotate(0deg); }
          50%  { opacity: 1; transform: scale(1.2) rotate(180deg); }
          100% { opacity: 0; transform: scale(0.8) rotate(360deg); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes orb {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(30px, -20px) scale(1.05); }
          66%       { transform: translate(-20px, 15px) scale(0.95); }
        }
        @keyframes glow {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 0.8; }
        }

        .bud-left  { animation: slideLeft 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.2s both; }
        .bud-right { animation: slideRight 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.2s both; }
        .matched   { animation: matchPulse 0.5s ease 0s 1; }
        .spark     { animation: sparkle 0.6s ease forwards; }
        .fade-up-1 { animation: fadeUp 0.7s ease 1.6s both; }
        .fade-up-2 { animation: fadeUp 0.7s ease 1.9s both; }
        .fade-up-3 { animation: fadeUp 0.7s ease 2.1s both; }
        .fade-up-4 { animation: fadeUp 0.7s ease 2.3s both; }
        .floating  { animation: float 4s ease-in-out infinite; }

        .gradient-text {
          background: linear-gradient(135deg, #a78bfa, #f472b6, #fb923c, #facc15);
          background-size: 300% 300%;
          animation: gradientShift 4s ease infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .card-hover {
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .card-hover:hover {
          transform: translateY(-2px);
          border-color: rgba(255,255,255,0.15) !important;
        }
      `}</style>

      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{
          position: 'absolute', top: '10%', left: '15%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167,139,250,0.15) 0%, transparent 70%)',
          animation: 'orb 8s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', top: '40%', right: '10%',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(244,114,182,0.12) 0%, transparent 70%)',
          animation: 'orb 10s ease-in-out infinite reverse',
        }} />
        <div style={{
          position: 'absolute', bottom: '15%', left: '30%',
          width: 350, height: 350, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(251,146,60,0.10) 0%, transparent 70%)',
          animation: 'orb 7s ease-in-out infinite 2s',
        }} />
        {/* Dot grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />
      </div>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative max-w-6xl mx-auto px-8 pt-32 pb-20">

        {/* Label */}
        <div className="fade-up-1 flex items-center gap-3 mb-10">
          <div style={{ height: 1, width: 32, background: 'rgba(255,255,255,0.3)' }} />
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', fontFamily: 'DM Sans, sans-serif' }}>
            The marketplace for missing earbuds
          </span>
        </div>

        {/* Main layout: text left, animation right */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center' }}>

          {/* Left — headline */}
          <div>
            <h1 className="fade-up-1 font-display" style={{
              fontSize: 72, lineHeight: 0.95, fontWeight: 400,
              color: '#fff', marginBottom: 24, letterSpacing: '-2px',
            }}>
              Find your<br />
              <span className="gradient-text" style={{ fontStyle: 'italic' }}>missing half.</span>
            </h1>

            <p className="fade-up-2 font-body" style={{
              fontSize: 16, color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.7, marginBottom: 36, maxWidth: 380,
            }}>
              Lost one earbud? Someone out there has yours — and needs yours.
              BudMatch connects you both, for a fraction of the replacement cost.
            </p>

            <div className="fade-up-3" style={{ display: 'flex', gap: 12 }}>
              <Link href="/listings/new" style={{
                background: 'linear-gradient(135deg, #a78bfa, #f472b6)',
                color: '#fff', padding: '13px 28px',
                borderRadius: 999, fontWeight: 500,
                fontSize: 14, textDecoration: 'none',
                fontFamily: 'DM Sans, sans-serif',
                transition: 'opacity 0.2s',
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                Post a listing →
              </Link>
              <Link href="/browse" style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.8)', padding: '13px 28px',
                borderRadius: 999, fontWeight: 400,
                fontSize: 14, textDecoration: 'none',
                fontFamily: 'DM Sans, sans-serif',
                transition: 'border-color 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
              >
                Browse listings
              </Link>
            </div>
          </div>

          {/* Right — earbud animation */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', height: 320 }}>

            {/* Glow ring behind buds */}
            {sparked && (
              <div style={{
                position: 'absolute', width: 200, height: 200,
                borderRadius: '50%', zIndex: 0,
                background: 'radial-gradient(circle, rgba(167,139,250,0.35) 0%, transparent 70%)',
                animation: 'glow 2s ease-in-out infinite',
              }} />
            )}

            {/* Left bud */}
            <div className={`bud-left floating`} style={{
              position: 'absolute',
              left: matched ? '50%' : '10%',
              transform: matched ? 'translateX(-58px)' : 'translateX(0)',
              transition: matched ? 'left 0.6s cubic-bezier(0.34,1.56,0.64,1), transform 0.6s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
              zIndex: 2,
            }}>
              <div style={{
                width: 100, height: 100,
                borderRadius: '50% 50% 50% 20%',
                background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: sparked ? '0 0 40px rgba(167,139,250,0.6)' : '0 20px 40px rgba(0,0,0,0.4)',
                transition: 'box-shadow 0.4s ease',
                position: 'relative',
              }}>
                {/* Bud detail */}
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.15)',
                  border: '2px solid rgba(255,255,255,0.3)',
                }} />
                <div style={{
                  position: 'absolute', bottom: 12, right: 12,
                  width: 12, height: 12, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.4)',
                }} />
                <div style={{
                  position: 'absolute', top: 8, right: 8,
                  fontSize: 10, color: 'rgba(255,255,255,0.6)',
                  fontFamily: 'DM Sans, sans-serif', fontWeight: 500,
                }}>L</div>
              </div>
            </div>

            {/* Spark / match indicator */}
            {sparked && (
              <div className="spark" style={{
                position: 'absolute', zIndex: 10,
                fontSize: 28, userSelect: 'none',
                filter: 'drop-shadow(0 0 12px rgba(250,204,21,0.8))',
              }}>
                ✦
              </div>
            )}

            {/* Right bud */}
            <div className={`bud-right floating`} style={{
              position: 'absolute',
              right: matched ? '50%' : '10%',
              transform: matched ? 'translateX(58px)' : 'translateX(0)',
              transition: matched ? 'right 0.6s cubic-bezier(0.34,1.56,0.64,1), transform 0.6s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
              zIndex: 2,
              animationDelay: '0.15s',
            }}>
              <div style={{
                width: 100, height: 100,
                borderRadius: '50% 50% 20% 50%',
                background: 'linear-gradient(135deg, #f472b6, #db2777)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: sparked ? '0 0 40px rgba(244,114,182,0.6)' : '0 20px 40px rgba(0,0,0,0.4)',
                transition: 'box-shadow 0.4s ease',
                position: 'relative',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.15)',
                  border: '2px solid rgba(255,255,255,0.3)',
                }} />
                <div style={{
                  position: 'absolute', bottom: 12, left: 12,
                  width: 12, height: 12, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.4)',
                }} />
                <div style={{
                  position: 'absolute', top: 8, left: 8,
                  fontSize: 10, color: 'rgba(255,255,255,0.6)',
                  fontFamily: 'DM Sans, sans-serif', fontWeight: 500,
                }}>R</div>
              </div>
            </div>

            {/* Matched label */}
            {sparked && (
              <div className="spark" style={{
                position: 'absolute', bottom: 40,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 999, padding: '6px 16px',
                fontSize: 12, color: 'rgba(255,255,255,0.7)',
                fontFamily: 'DM Sans, sans-serif',
                animationDelay: '0.3s',
              }}>
                ✓ Matched
              </div>
            )}

          </div>
        </div>
      </section>

      {/* ── STATS STRIP ──────────────────────────────────────────────── */}
      <section className="fade-up-4 relative max-w-6xl mx-auto px-8 pb-20">
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1, background: 'rgba(255,255,255,0.06)',
          borderRadius: 20, overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          {[
            { val: '50+', label: 'Earbud models supported' },
            { val: 'LKR', label: 'Payments in Sri Lankan Rupees' },
            { val: '2×', label: 'Cheaper than buying new' },
          ].map((s, i) => (
            <div key={i} style={{
              padding: '28px 32px',
              background: 'rgba(255,255,255,0.03)',
              borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}>
              <p className="gradient-text font-display" style={{ fontSize: 36, marginBottom: 4 }}>{s.val}</p>
              <p className="font-body" style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section className="relative max-w-6xl mx-auto px-8 pb-24">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
          <div style={{ height: 1, width: 32, background: 'rgba(255,255,255,0.3)' }} />
          <span className="font-body" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}>How it works</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

          {/* Step 1 — big card */}
          <div className="card-hover" style={{
            gridRow: 'span 2',
            background: 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(124,58,237,0.08))',
            border: '1px solid rgba(167,139,250,0.2)',
            borderRadius: 24, padding: 40,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            minHeight: 300,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, marginBottom: 24,
            }}>📋</div>
            <div>
              <p className="font-body" style={{ fontSize: 11, color: 'rgba(167,139,250,0.8)', letterSpacing: '0.15em', marginBottom: 10 }}>STEP 01</p>
              <h3 className="font-display" style={{ fontSize: 28, color: '#fff', marginBottom: 12, lineHeight: 1.2 }}>Post what you have</h3>
              <p className="font-body" style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>
                Tell us your earbud model, which piece you have, its condition, and your asking price.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="card-hover" style={{
            background: 'linear-gradient(135deg, rgba(244,114,182,0.15), rgba(219,39,119,0.08))',
            border: '1px solid rgba(244,114,182,0.2)',
            borderRadius: 24, padding: 32,
            display: 'flex', alignItems: 'flex-start', gap: 20,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: 'linear-gradient(135deg, #f472b6, #db2777)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>⚡</div>
            <div>
              <p className="font-body" style={{ fontSize: 11, color: 'rgba(244,114,182,0.8)', letterSpacing: '0.15em', marginBottom: 8 }}>STEP 02</p>
              <h3 className="font-display" style={{ fontSize: 22, color: '#fff', marginBottom: 8 }}>Get auto-matched</h3>
              <p className="font-body" style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
                Our graph algorithm instantly finds your best match — same model, opposite bud.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="card-hover" style={{
            background: 'linear-gradient(135deg, rgba(251,146,60,0.15), rgba(234,88,12,0.08))',
            border: '1px solid rgba(251,146,60,0.2)',
            borderRadius: 24, padding: 32,
            display: 'flex', alignItems: 'flex-start', gap: 20,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: 'linear-gradient(135deg, #fb923c, #ea580c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>🤝</div>
            <div>
              <p className="font-body" style={{ fontSize: 11, color: 'rgba(251,146,60,0.8)', letterSpacing: '0.15em', marginBottom: 8 }}>STEP 03</p>
              <h3 className="font-display" style={{ fontSize: 22, color: '#fff', marginBottom: 8 }}>Negotiate & trade</h3>
              <p className="font-body" style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
                Agree on a fair price, pay the platform fee, and chat to arrange the swap.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ── SUPPORTED MODELS ─────────────────────────────────────────── */}
      <section className="relative max-w-6xl mx-auto px-8 pb-24">
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 24, padding: '32px 40px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32,
          flexWrap: 'wrap',
        }}>
          <div>
            <h3 className="font-display" style={{ fontSize: 24, color: '#fff', marginBottom: 8 }}>
              All the brands you love
            </h3>
            <p className="font-body" style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
              Apple · Samsung · Sony · JBL · Bose · Jabra · Xiaomi · OnePlus · and more
            </p>
          </div>
          <Link href="/listings/new" style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#fff', padding: '12px 24px',
            borderRadius: 999, fontSize: 13,
            textDecoration: 'none', fontFamily: 'DM Sans, sans-serif',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            Find your match →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.07)',
        padding: '24px 0', textAlign: 'center',
      }}>
        <p className="font-body" style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
          BudMatch · Sri Lanka · 2025
        </p>
      </footer>

    </main>
  )
}
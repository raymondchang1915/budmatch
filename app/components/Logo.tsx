export default function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const scale = size === 'sm' ? 0.55 : size === 'lg' ? 1 : 0.72

  const bud = Math.round(90 * scale)
  const lens = Math.round(32 * scale)
  const dot = Math.round(9 * scale)
  const dotOffset = Math.round(13 * scale)
  const labelSize = Math.round(9 * scale)
  const labelOffset = Math.round(9 * scale)
  const matchDot = Math.round(9 * scale)
  const iconW = Math.round(160 * scale)
  const iconH = Math.round(90 * scale)
  const overlap = Math.round(58 * scale)
  const wordSize = Math.round(22 * scale)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: Math.round(10 * scale) }}>
      {/* Icon: two overlapping earbuds */}
      <div style={{ position: 'relative', width: iconW, height: iconH, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>

        {/* Glow */}
        <div style={{
          position: 'absolute',
          width: Math.round(100 * scale), height: Math.round(100 * scale),
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,197,94,0.2) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Left bud */}
        <div style={{
          position: 'absolute',
          left: `calc(50% - ${overlap}px)`,
          width: bud, height: bud,
          borderRadius: '50% 50% 50% 18%',
          background: '#111',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 0 2px rgba(34,197,94,0.35), 0 6px 16px rgba(0,0,0,0.2)',
          zIndex: 2,
          flexShrink: 0,
        }}>
          <div style={{ width: lens, height: lens, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.2)' }} />
          <div style={{ position: 'absolute', bottom: dotOffset, right: dotOffset, width: dot, height: dot, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.8)' }} />
          <span style={{ position: 'absolute', top: labelOffset, right: labelOffset, fontSize: labelSize, color: 'rgba(255,255,255,0.4)', fontWeight: 500, fontFamily: 'system-ui', lineHeight: 1 }}>L</span>
        </div>

        {/* Center match dot */}
        <div style={{ position: 'absolute', zIndex: 10, width: matchDot, height: matchDot, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 10px rgba(34,197,94,0.9)' }} />

        {/* Right bud */}
        <div style={{
          position: 'absolute',
          right: `calc(50% - ${overlap}px)`,
          width: bud, height: bud,
          borderRadius: '50% 50% 18% 50%',
          background: '#111',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 0 2px rgba(34,197,94,0.35), 0 6px 16px rgba(0,0,0,0.2)',
          zIndex: 1,
          flexShrink: 0,
        }}>
          <div style={{ width: lens, height: lens, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.2)' }} />
          <div style={{ position: 'absolute', bottom: dotOffset, left: dotOffset, width: dot, height: dot, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.8)' }} />
          <span style={{ position: 'absolute', top: labelOffset, left: labelOffset, fontSize: labelSize, color: 'rgba(255,255,255,0.4)', fontWeight: 500, fontFamily: 'system-ui', lineHeight: 1 }}>R</span>
        </div>
      </div>

      {/* Wordmark */}
      <span style={{ fontSize: wordSize, fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1, fontFamily: 'system-ui, sans-serif', whiteSpace: 'nowrap' }}>
        <span style={{ color: '#22c55e' }}>Bud</span>
        <span style={{ color: '#111' }}>Match</span>
      </span>
    </div>
  )
}

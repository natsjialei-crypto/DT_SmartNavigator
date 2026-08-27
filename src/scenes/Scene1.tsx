import { useState, useEffect, useRef } from 'react'
import bgDCS from '@/imports/image-1.png'
import { SHARED_SECTIONS, SHARED_PLANS_DATA, SHARED_PROC_ROWS, type SharedProcRow } from './Scene3'

// ── Icons ─────────────────────────────────────────────────────────────────────

function BookIcon({ size = 22, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 7.5C4 6.7 4.6 6 5.5 6H12V20H5.5C4.6 20 4 19.3 4 18.5V7.5Z" fill={color} />
      <path d="M12 6H18.5C19.4 6 20 6.7 20 7.5V18.5C20 19.3 19.4 20 18.5 20H12V6Z" fill={color} opacity={0.72} />
      <rect x="11.5" y="6" width="1" height="14" fill={color} opacity={0.4} />
      <path d="M8 1.5L8.6 3.4L10.5 4L8.6 4.6L8 6.5L7.4 4.6L5.5 4L7.4 3.4Z" fill={color} />
      <path d="M16.5 0.8L17 2.2L18.4 2.7L17 3.2L16.5 4.6L16 3.2L14.6 2.7L16 2.2Z" fill={color} />
      <path d="M13.5 2.5L13.8 3.3L14.6 3.6L13.8 3.9L13.5 4.7L13.2 3.9L12.4 3.6L13.2 3.3Z" fill={color} opacity={0.8} />
    </svg>
  )
}

function LightbulbIcon({ size = 22, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M9 21h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 3a6 6 0 0 1 6 6c0 2.22-1.2 4.16-3 5.2V17a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1v-2.8C7.2 13.16 6 11.22 6 9a6 6 0 0 1 6-6z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="9" y1="17" x2="15" y2="17" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function PlanListIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="9" y1="13" x2="15" y2="13"/>
      <line x1="9" y1="17" x2="13" y2="17"/>
    </svg>
  )
}

// ── Types & state config ──────────────────────────────────────────────────────

export type BubbleState = 'silent' | 'alert' | 'abnormal'

const STATE_CFG: Record<BubbleState, {
  label: string; labelEn: string
  fill: string; ring: string; ringGlow: string; text: string
  metric: string; metricSub: string
}> = {
  silent: {
    label: '静默', labelEn: 'SILENT',
    fill: 'rgba(22,140,10,0.22)', ring: '#39C523', ringGlow: 'rgba(57,197,35,0.5)', text: '#B6F1AD',
    metric: '36h', metricSub: '最长持续静默',
  },
  alert: {
    label: '提示', labelEn: 'ALERT',
    fill: 'rgba(195,130,0,0.22)', ring: '#F2B544', ringGlow: 'rgba(242,181,68,0.55)', text: '#FFE5A0',
    metric: '3 个', metricSub: '待复位预案',
  },
  abnormal: {
    label: '异常', labelEn: 'ABNORMAL',
    fill: 'rgba(200,30,30,0.22)', ring: '#F05050', ringGlow: 'rgba(240,80,80,0.55)', text: '#FFBFBF',
    metric: '2 个', metricSub: '已激活预案',
  },
}

const PLANS = [
  '01 气化冷态开车', '02 气化停车', '03 气化热态开车',
  '05 停电应急', '06 紧急停车', '08 烧嘴压差波动',
  '09 激冷室底部堵渣操作', '10 空分跳车应急',
]

// Alert state: plans awaiting reset
const ALERT_RESET_PLANS = [
  '02 气化停车',
  '06 紧急停车',
  '10 空分跳车应急',
]

// Abnormal state: plans being operated + plans awaiting reset
const ABNORMAL_PENDING_PLANS = [
  '01 气化冷态开车',
  '08 烧嘴压差波动',
]
const ABNORMAL_RESET_PLANS = [
  '03 气化热态开车',
  '05 停电应急',
]

const VIEW_STEPS = [
  { seq: 2, group: '准备工作', content: '打开 LV021411 前后手阀，建立激冷水循环' },
  { seq: 3, group: '准备工作', content: '打开 LV021411 给 V021410 建立液位，V021410 液位到 60% 后投自动' },
  { seq: 4, group: '准备工作', content: '降低压水泵至澄清槽手阀 704105V03' },
  { seq: 5, group: '准备工作', content: '打开 P021403A/B 进口阀' },
  { seq: 6, group: '准备工作', content: '启动 P021403A/B' },
  { seq: 7, group: '预热阶段', content: '将气化炉预热水管板侧"通"' },
  { seq: 8, group: '预热阶段', content: '打开 FV021342 前后手阀' },
  { seq: 9, group: '预热阶段', content: '打开米 FV021342 后总阀 703107AV01' },
]

// ── State switcher (top-right) ────────────────────────────────────────────────

function StateSwitcher({ current, onChange }: { current: BubbleState; onChange: (s: BubbleState) => void }) {
  const states: BubbleState[] = ['abnormal', 'alert', 'silent']
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 6,
      background: 'rgba(5,18,36,0.88)',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: 12,
      padding: '10px 10px',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em', fontWeight: 600, textTransform: 'uppercase', textAlign: 'center', marginBottom: 2 }}>浮球状态</div>
      {states.map((s) => {
        const cfg = STATE_CFG[s]
        const active = current === s
        return (
          <button
            key={s}
            onClick={() => onChange(s)}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '8px 12px',
              border: `1px solid ${active ? cfg.ring : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 8,
              background: active ? `rgba(${s === 'silent' ? '22,140,10' : s === 'alert' ? '195,130,0' : '200,30,30'},0.18)` : 'rgba(255,255,255,0.03)',
              cursor: 'pointer',
              transition: 'all 140ms ease',
              width: 128,
            }}
          >
            {/* Dot */}
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: active ? cfg.ring : 'rgba(255,255,255,0.15)',
              boxShadow: active ? `0 0 7px ${cfg.ringGlow}` : 'none',
              flexShrink: 0,
              transition: 'all 140ms ease',
            }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 12, fontWeight: active ? 700 : 400, color: active ? cfg.text : 'rgba(255,255,255,0.45)', lineHeight: 1.2, transition: 'color 140ms' }}>
                {cfg.label}
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>{cfg.metricSub}</div>
            </div>
            {active && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={cfg.ring} strokeWidth="2.5" strokeLinecap="round" style={{ marginLeft: 'auto', flexShrink: 0 }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ── Right-click context menu ──────────────────────────────────────────────────

export function ContextMenu({ x, y, onManage, onQuit, onClose }: {
  x: number; y: number
  onManage: () => void; onQuit: () => void; onClose: () => void
}) {
  // Keep menu on screen
  const left = Math.min(x, window.innerWidth  - 180)
  const top  = Math.min(y, window.innerHeight - 100)

  return (
    <>
      {/* invisible backdrop */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 10010 }} onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose() }} />
      <div style={{
        position: 'fixed', left, top,
        width: 168,
        background: 'rgba(6,20,40,0.97)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10,
        boxShadow: '0 8px 32px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.3)',
        zIndex: 10011,
        overflow: 'hidden',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        animation: 'ctxIn 100ms cubic-bezier(0.2,0,0,1)',
      }}>
        <style>{`@keyframes ctxIn { from{opacity:0;transform:scale(0.94)} to{opacity:1;transform:scale(1)} }`}</style>

        {/* Menu items */}
        {[
          {
            icon: (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
              </svg>
            ),
            label: '预案管理',
            sub: '切换到管理场景',
            action: onManage,
            accent: '#82B9DD',
          },
          {
            icon: (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            ),
            label: '退出系统',
            sub: '关闭操作导航',
            action: onQuit,
            accent: '#F05050',
          },
        ].map((item, i) => (
          <button
            key={i}
            onClick={() => { item.action(); onClose() }}
            style={{
              width: '100%', textAlign: 'left', padding: '10px 14px',
              border: 'none', background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 10,
              borderBottom: i === 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              color: item.accent,
              transition: 'background 80ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <span style={{ flexShrink: 0, opacity: 0.9 }}>{item.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1 }}>{item.label}</span>
          </button>
        ))}
      </div>
    </>
  )
}

// ── Capsule float bubble ──────────────────────────────────────────────────────

export function FloatBubble({
  state, silentDuration, onAiClick = () => {}, onCapClick = () => {}, onContextMenu, pos, onPosChange,
}: {
  state: BubbleState; silentDuration: string
  onAiClick?: () => void; onCapClick?: () => void; onContextMenu: (e: React.MouseEvent) => void
  pos: { x: number; y: number }; onPosChange: (p: { x: number; y: number }) => void
}) {
  const [hovered, setHovered] = useState(false)
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)
  const cfg = STATE_CFG[state]
  const displayMetric = state === 'silent' ? silentDuration : cfg.metric

  const BALL  = 72
  const ENTRY = 72

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault()
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y }
    setDragging(true)

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return
      const dx = ev.clientX - dragRef.current.startX
      const dy = ev.clientY - dragRef.current.startY
      onPosChange({
        x: Math.max(0, Math.min(window.innerWidth  - BALL, dragRef.current.origX + dx)),
        y: Math.max(0, Math.min(window.innerHeight - BALL, dragRef.current.origY + dy)),
      })
    }
    const onUp = () => {
      setDragging(false)
      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <>
      {/* Pulsing outer ring */}
      <div style={{
        position: 'fixed', left: pos.x, top: pos.y,
        width: BALL, height: BALL, borderRadius: '50%',
        border: `1.5px solid ${cfg.ring}`,
        pointerEvents: 'none', zIndex: 10001,
        animation: 'ringExpand 2.2s ease-out infinite',
      }} />

      {/* Unified capsule */}
      <div
        onMouseEnter={() => { if (!dragging) setHovered(true) }}
        onMouseLeave={() => setHovered(false)}
        onContextMenu={onContextMenu}
        style={{
          position: 'fixed',
          left: hovered ? pos.x - ENTRY : pos.x,
          top: pos.y,
          height: BALL,
          width: hovered ? BALL + ENTRY : BALL,
          borderRadius: BALL / 2,
          overflow: 'hidden',
          background: cfg.fill,
          border: `2.5px solid ${cfg.ring}`,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          boxShadow: `0 0 0 1px ${cfg.ringGlow}, 0 0 20px ${cfg.ringGlow}, 0 8px 24px rgba(0,0,0,0.38)`,
          animation: dragging ? 'none' : 'bubblePulse 2.2s ease-in-out infinite',
          transition: dragging ? 'none' : 'left 280ms cubic-bezier(0.34,1.12,0.64,1), width 280ms cubic-bezier(0.34,1.12,0.64,1), border-color 260ms ease, background 260ms ease, box-shadow 260ms ease',
          zIndex: 10002,
          cursor: dragging ? 'grabbing' : 'context-menu',
          userSelect: 'none',
        }}
      >
        {/* ── Left: AI assistant entry ── */}
        <button
          onClick={(e) => { e.stopPropagation(); onAiClick() }}
          style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: ENTRY,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
            background: 'transparent', border: 'none',
            borderRight: `1px solid ${cfg.ring}40`,
            cursor: 'pointer', color: 'rgba(255,255,255,0.88)',
            opacity: hovered ? 1 : 0,
            pointerEvents: hovered ? 'auto' : 'none',
            transition: 'opacity 200ms ease, background 120ms ease, color 120ms ease',
            outline: 'none',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = `${cfg.ring}30`; e.currentTarget.style.color = cfg.ring }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.88)' }}
          title="AI 助手（即将开放）"
        >
          <LightbulbIcon size={24} color="currentColor" />
          <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.04em', opacity: 0.7, whiteSpace: 'nowrap' }}>AI 助手</span>
        </button>

        {/* ── Right: state cap — drag handle + tap ── */}
        <div
          onMouseDown={handleDragStart}
          onClick={(e) => {
            if (dragRef.current === null && !dragging) { e.stopPropagation(); onCapClick() }
          }}
          style={{
            position: 'absolute', right: 0, top: 0, bottom: 0,
            width: BALL,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
            padding: '0 4px', cursor: dragging ? 'grabbing' : 'grab',
          }}
        >
          {/* Drag hint dots */}
          <div style={{ position: 'absolute', top: 7, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 3, opacity: hovered && !dragging ? 0.4 : 0, transition: 'opacity 200ms' }}>
            {[0,1,2].map((i) => <div key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: '#fff' }} />)}
          </div>
          <span style={{
            fontSize: displayMetric.length > 3 ? 15 : 20,
            fontWeight: 800, color: '#fff',
            fontFamily: '"Inter Tight", sans-serif',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
            textShadow: `0 0 10px ${cfg.ring}`,
            pointerEvents: 'none',
          }}>{displayMetric}</span>
          <div style={{ width: 28, height: 1, background: `${cfg.ring}55`, margin: '3px 0 2px' }} />
          <span style={{
            fontSize: 8, color: cfg.text, fontWeight: 600,
            letterSpacing: '0.03em', opacity: 0.85,
            textAlign: 'center', lineHeight: 1.3, whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}>{cfg.metricSub}</span>
        </div>
      </div>
    </>
  )
}

// ── Silent panel (静默态) ─────────────────────────────────────────────────────

export function SilentPanel({ onClose, onOpenPlans, silentDuration, anchor }: { onClose: () => void; onOpenPlans: () => void; silentDuration: string; anchor: { right: number; bottom: number } }) {
  const cfg = STATE_CFG['silent']
  return (
    <div style={{
      position: 'fixed', bottom: anchor.bottom, right: anchor.right, width: 260,
      background: 'rgba(5,18,36,0.97)', border: `1px solid ${cfg.ring}55`,
      borderRadius: 14, zIndex: 10003, overflow: 'hidden',
      boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 20px ${cfg.ringGlow}`,
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      animation: 'panelIn 160ms cubic-bezier(0.2,0,0,1)',
    }}>
      {/* Header */}
      <div style={{ padding: '11px 14px 9px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.ring, boxShadow: `0 0 6px ${cfg.ring}`, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1 }}>静默监控</div>
        </div>
        <button
          onClick={onOpenPlans}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 5, border: `1px solid ${cfg.ring}55`, background: `${cfg.ring}14`, color: cfg.ring, fontSize: 10, fontWeight: 600, cursor: 'pointer', flexShrink: 0, transition: 'all 80ms ease', marginRight: 6 }}
          onMouseEnter={(e) => { e.currentTarget.style.background = `${cfg.ring}28` }}
          onMouseLeave={(e) => { e.currentTarget.style.background = `${cfg.ring}14` }}
          title="查看操作预案列表"
        >
          <PlanListIcon size={11} color={cfg.ring} />
          操作预案
        </button>
        <button onClick={onClose} style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.45)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      {/* Status body */}
      <div style={{ padding: '14px 16px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', border: `2px solid ${cfg.ring}55`, background: `${cfg.ring}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cfg.ring} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 3 }}>系统运行正常 · 无异常预案</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: cfg.ring, fontFamily: '"Inter Tight", sans-serif', lineHeight: 1 }}>{silentDuration}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>持续静默时长</div>
        </div>
      </div>
    </div>
  )
}

// ── Alert panel (提示态) — 待复位预案列表 ──────────────────────────────────────

export function AlertPanel({ onClose, onOpenPlans, anchor }: { onClose: () => void; onOpenPlans: () => void; anchor: { right: number; bottom: number } }) {
  const cfg = STATE_CFG['alert']
  const [list, setList] = useState(ALERT_RESET_PLANS)
  const remove = (plan: string) => setList((p) => p.filter((x) => x !== plan))

  return (
    <div style={{
      position: 'fixed', bottom: anchor.bottom, right: anchor.right, width: 288,
      background: 'rgba(5,18,36,0.97)', border: `1px solid ${cfg.ring}55`,
      borderRadius: 14, zIndex: 10003, overflow: 'hidden',
      boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 20px ${cfg.ringGlow}`,
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      animation: 'panelIn 160ms cubic-bezier(0.2,0,0,1)',
    }}>
      {/* Header */}
      <div style={{ padding: '11px 14px 9px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.ring, boxShadow: `0 0 6px ${cfg.ring}`, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1 }}>待复位预案</div>
        </div>
        <button
          onClick={onOpenPlans}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 5, border: `1px solid ${cfg.ring}55`, background: `${cfg.ring}14`, color: cfg.ring, fontSize: 10, fontWeight: 600, cursor: 'pointer', flexShrink: 0, transition: 'all 80ms ease', marginRight: 6 }}
          onMouseEnter={(e) => { e.currentTarget.style.background = `${cfg.ring}28` }}
          onMouseLeave={(e) => { e.currentTarget.style.background = `${cfg.ring}14` }}
          title="查看操作预案列表"
        >
          <PlanListIcon size={11} color={cfg.ring} />
          操作预案
        </button>
        <button onClick={onClose} style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.45)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      {/* List */}
      <div style={{ padding: '6px 8px 8px' }}>
        {list.length === 0 && (
          <div style={{ padding: '16px 0', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>全部已复位</div>
        )}
        {list.map((plan) => (
          <div key={plan} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 8, marginBottom: 2 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.ring, opacity: 0.7, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>{plan}</span>
            <button
              onClick={() => remove(plan)}
              style={{ padding: '3px 10px', borderRadius: 5, border: `1px solid ${cfg.ring}55`, background: `${cfg.ring}14`, color: cfg.ring, fontSize: 10, fontWeight: 600, cursor: 'pointer', flexShrink: 0, transition: 'all 80ms ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${cfg.ring}28` }}
              onMouseLeave={(e) => { e.currentTarget.style.background = `${cfg.ring}14` }}
            >手动复位</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Abnormal panel (异常态) — 待操作 + 待复位两组 ─────────────────────────────

export function AbnormalPanel({ onActivate, onClose, onOpenPlans, anchor }: { onActivate: (plan: string) => void; onClose: () => void; onOpenPlans: () => void; anchor: { right: number; bottom: number } }) {
  const cfg = STATE_CFG['abnormal']
  const [pending, setPending]  = useState(ABNORMAL_PENDING_PLANS)
  const [resetList, setReset]  = useState(ABNORMAL_RESET_PLANS)

  const removePending = (plan: string) => setPending((p) => p.filter((x) => x !== plan))
  const removeReset   = (plan: string) => setReset((p) => p.filter((x) => x !== plan))

  return (
    <div style={{
      position: 'fixed', bottom: anchor.bottom, right: anchor.right, width: 300,
      background: 'rgba(5,18,36,0.97)', border: `1px solid ${cfg.ring}55`,
      borderRadius: 14, zIndex: 10003, overflow: 'hidden',
      boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 20px ${cfg.ringGlow}`,
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      animation: 'panelIn 160ms cubic-bezier(0.2,0,0,1)',
    }}>
      {/* Header */}
      <div style={{ padding: '11px 14px 9px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.ring, boxShadow: `0 0 6px ${cfg.ring}`, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1 }}>异常预案处置</div>
        </div>
        <button
          onClick={onOpenPlans}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 5, border: `1px solid ${cfg.ring}55`, background: `${cfg.ring}14`, color: cfg.ring, fontSize: 10, fontWeight: 600, cursor: 'pointer', flexShrink: 0, transition: 'all 80ms ease', marginRight: 6 }}
          onMouseEnter={(e) => { e.currentTarget.style.background = `${cfg.ring}28` }}
          onMouseLeave={(e) => { e.currentTarget.style.background = `${cfg.ring}14` }}
          title="查看操作预案列表"
        >
          <PlanListIcon size={11} color={cfg.ring} />
          操作预案
        </button>
        <button onClick={onClose} style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.45)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {/* Section: 待操作 */}
      <div style={{ padding: '8px 14px 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em' }}>待操作预案</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
        <span style={{ fontSize: 10, color: cfg.ring, fontWeight: 600 }}>{pending.length}</span>
      </div>
      <div style={{ padding: '0 8px 6px' }}>
        {pending.length === 0 && <div style={{ padding: '8px 8px', fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>暂无待操作预案</div>}
        {pending.map((plan) => (
          <div key={plan} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 8, marginBottom: 2 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.ring, opacity: 0.8, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>{plan}</span>
            <button
              onClick={() => { onActivate(plan); removePending(plan); onClose() }}
              style={{ padding: '3px 10px', borderRadius: 5, border: `1px solid ${cfg.ring}66`, background: `${cfg.ring}18`, color: cfg.ring, fontSize: 10, fontWeight: 700, cursor: 'pointer', flexShrink: 0, transition: 'all 80ms ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${cfg.ring}30` }}
              onMouseLeave={(e) => { e.currentTarget.style.background = `${cfg.ring}18` }}
            >处理</button>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />

      {/* Section: 待复位 */}
      <div style={{ padding: '8px 14px 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em' }}>待复位预案</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>{resetList.length}</span>
      </div>
      <div style={{ padding: '0 8px 8px' }}>
        {resetList.length === 0 && <div style={{ padding: '8px 8px', fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>暂无待复位预案</div>}
        {resetList.map((plan) => (
          <div key={plan} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 8, marginBottom: 2 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{plan}</span>
            <button
              onClick={() => removeReset(plan)}
              style={{ padding: '3px 10px', borderRadius: 5, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: 600, cursor: 'pointer', flexShrink: 0, transition: 'all 80ms ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
            >手动复位</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Plan panel ────────────────────────────────────────────────────────────────

const ALL_SECTION = '全部工段'

export function PlanPanel({
  state, onActivate, onClose, onView, anchor,
}: { state: BubbleState; onActivate: (plan: string) => void; onClose: () => void; onView: (plan: string) => void; anchor: { right: number; bottom: number } }) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [section, setSection] = useState<string>(ALL_SECTION)
  const [dropOpen, setDropOpen] = useState(false)
  const cfg = STATE_CFG[state]

  // Build flat plan list from shared data, filtered by section
  const sectionOptions = [ALL_SECTION, ...SHARED_SECTIONS]
  const planPool: string[] = section === ALL_SECTION
    ? Object.values(SHARED_PLANS_DATA).flat().map((p) => p.name)
    : (SHARED_PLANS_DATA[section] ?? []).map((p) => p.name)

  const filtered = search.trim()
    ? planPool.filter((p) => p.toLowerCase().includes(search.trim().toLowerCase()))
    : planPool

  return (
    <div style={{
      position: 'fixed', bottom: anchor.bottom, right: anchor.right,
      width: 320, maxHeight: 500,
      background: 'rgba(5,18,36,0.96)',
      border: `1px solid ${cfg.ring}`,
      borderRadius: 14,
      boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 24px ${cfg.ringGlow}`,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      zIndex: 10003,
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      animation: 'panelIn 160ms cubic-bezier(0.2,0,0,1)',
    }}>
      {/* Header — section name + dropdown */}
      <div style={{ padding: '11px 14px 10px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.ring, boxShadow: `0 0 6px ${cfg.ring}`, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1 }}>操作预案</div>
            </div>
          <button onClick={onClose} style={{ width: 26, height: 26, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {/* Section dropdown */}
        <div style={{ position: 'relative', marginTop: 8 }}>
          <button
            onClick={() => setDropOpen(!dropOpen)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 10px', borderRadius: 7, border: `1px solid ${cfg.ring}44`,
              background: 'rgba(255,255,255,0.06)', cursor: 'pointer', outline: 'none',
              color: '#fff', fontSize: 12, fontFamily: '"Noto Sans SC", sans-serif',
              transition: 'border-color 100ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${cfg.ring}88`)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = `${cfg.ring}44`)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={cfg.ring} strokeWidth="2" strokeLinecap="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span style={{ fontWeight: section === ALL_SECTION ? 400 : 600 }}>{section}</span>
            </div>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round"
              style={{ transform: dropOpen ? 'rotate(180deg)' : 'none', transition: 'transform 160ms ease', flexShrink: 0 }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {dropOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 1 }} onClick={() => setDropOpen(false)} />
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
                background: 'rgba(4,14,30,0.98)', border: `1px solid ${cfg.ring}44`,
                borderRadius: 8, overflow: 'hidden', zIndex: 2,
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                animation: 'panelIn 100ms cubic-bezier(0.2,0,0,1)',
              }}>
                {sectionOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setSection(opt); setDropOpen(false); setSelectedPlan(null) }}
                    style={{
                      width: '100%', textAlign: 'left', padding: '8px 12px',
                      border: 'none', background: opt === section ? `${cfg.ring}18` : 'transparent',
                      color: opt === section ? cfg.ring : 'rgba(255,255,255,0.7)',
                      fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      fontFamily: '"Noto Sans SC", sans-serif',
                      transition: 'background 60ms ease',
                    }}
                    onMouseEnter={(e) => { if (opt !== section) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                    onMouseLeave={(e) => { if (opt !== section) e.currentTarget.style.background = 'transparent' }}
                  >
                    <span>{opt}</span>
                    {opt === section && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input
            placeholder="搜索预案名称…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelectedPlan(null) }}
            style={{ width: '100%', padding: '6px 10px 6px 28px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 12, outline: 'none', boxSizing: 'border-box', fontFamily: '"Noto Sans SC", sans-serif' }}
            onFocus={(e) => (e.currentTarget.style.borderColor = cfg.ring)}
            onBlur={(e)  => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
          />
          {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 14, lineHeight: 1 }}>×</button>}
        </div>
      </div>

      {/* Plan list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
        {filtered.length === 0 && (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>未找到匹配预案</div>
        )}
        {filtered.map((plan) => (
          <div key={plan}>
            <button
              onClick={() => setSelectedPlan(selectedPlan === plan ? null : plan)}
              style={{
                width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 8, border: 'none',
                background: selectedPlan === plan ? `${cfg.ring}18` : 'transparent',
                color: selectedPlan === plan ? cfg.text : 'rgba(255,255,255,0.65)',
                fontSize: 12, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                transition: 'background 80ms ease',
              }}
              onMouseEnter={(e) => { if (selectedPlan !== plan) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={(e) => { if (selectedPlan !== plan) e.currentTarget.style.background = 'transparent' }}
            >
              <span>{plan}</span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                style={{ transform: selectedPlan === plan ? 'rotate(90deg)' : 'none', transition: 'transform 140ms', flexShrink: 0, opacity: 0.35 }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            {selectedPlan === plan && (
              <div style={{ margin: '2px 10px 6px', display: 'flex', gap: 6 }}>
                <button
                  onClick={() => { onActivate(plan); onClose() }}
                  style={{ flex: 1, padding: '7px 0', background: '#004B8D', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#005A9B')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#004B8D')}
                >
                  激活预案
                </button>
                <button
                  onClick={() => onView(plan)}
                  style={{ flex: 1, padding: '7px 0', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#fff' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
                >
                  查看预案
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: '7px 14px', borderTop: '1px solid rgba(255,255,255,0.07)', fontSize: 10, color: 'rgba(255,255,255,0.25)', display: 'flex', justifyContent: 'space-between' }}>
        <span>{search ? `搜索结果：${filtered.length} 条` : `共 ${filtered.length} 条预案`}</span>
        {section !== ALL_SECTION && <span style={{ color: cfg.text, opacity: 0.6 }}>{section}</span>}
      </div>
    </div>
  )
}

// ── View plan drawer ──────────────────────────────────────────────────────────

function WrenchIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E8932A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  )
}

export function ViewDrawer({ plan, onClose, onActivate }: { plan: string; onClose: () => void; onActivate: (p: string) => void }) {
  // Group steps by group number; filter out group-title rows for step rendering
  const rows: SharedProcRow[] = SHARED_PROC_ROWS
  const groupNums = [...new Set(rows.map((r) => r.group))].sort((a, b) => a - b)
  const getGroupTitle = (g: number) => rows.find((r) => r.group === g && r.type === '组标题')?.content ?? `步骤组 ${g}`
  const getGroupSteps = (g: number) => rows.filter((r) => r.group === g && r.type !== '组标题')

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1500 }} onClick={onClose} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 420,
        background: '#F4F6F9', zIndex: 1600,
        boxShadow: '-12px 0 48px rgba(0,0,0,0.22)',
        display: 'flex', flexDirection: 'column',
        animation: 'drawerIn 220ms cubic-bezier(0.2,0,0,1)',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid #E0E4E9', background: '#fff', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, color: '#9FA6AF', marginBottom: 4, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>操作预案</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#171A1E', lineHeight: 1.2 }}>{plan}</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#515760' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: '#004B8D', opacity: 0.7 }} />
                中控操作
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#515760' }}>
                <WrenchIcon />
                现场操作
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid #E0E4E9', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#747A82', flexShrink: 0 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {/* Step list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
          {groupNums.map((g) => {
            const steps = getGroupSteps(g)
            if (steps.length === 0) return null
            return (
              <div key={g} style={{ marginBottom: 18 }}>
                {/* Group header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 3, height: 14, borderRadius: 2, background: '#004B8D', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#30353B', letterSpacing: '0.02em' }}>{getGroupTitle(g)}</span>
                  <div style={{ flex: 1, height: 1, background: '#E0E4E9' }} />
                  <span style={{ fontSize: 10, color: '#9FA6AF' }}>{steps.length} 步</span>
                </div>

                {/* Steps */}
                {steps.map((step) => {
                  const isField = step.location === '现场'
                  return (
                    <div key={step.seq} style={{ display: 'flex', gap: 10, marginBottom: 6, alignItems: 'flex-start' }}>
                      {/* Seq badge */}
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                        background: isField ? 'rgba(232,147,42,0.12)' : '#EEF5FB',
                        border: isField ? '1px solid rgba(232,147,42,0.4)' : '1px solid #D4E4F5',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 800,
                        color: isField ? '#E8932A' : '#004B8D',
                        fontFamily: '"Inter Tight", sans-serif',
                      }}>
                        {step.seq}
                      </div>

                      {/* Content card */}
                      <div style={{
                        flex: 1, padding: '6px 10px',
                        background: isField ? 'rgba(232,147,42,0.06)' : '#fff',
                        borderRadius: 7,
                        border: isField ? '1px solid rgba(232,147,42,0.25)' : '1px solid #E4E8ED',
                        fontSize: 12, color: '#171A1E', lineHeight: 1.55,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                          {isField && <div style={{ marginTop: 2, flexShrink: 0 }}><WrenchIcon /></div>}
                          <span>{step.content}</span>
                        </div>
                        {step.type === '提示信息' && (
                          <div style={{ marginTop: 4, fontSize: 10, color: '#9FA6AF', fontStyle: 'italic' }}>提示信息</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #E0E4E9', background: '#fff', display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px 0', border: '1px solid #CDD2D9', borderRadius: 8, background: '#fff', color: '#30353B', fontSize: 13, cursor: 'pointer' }}>关闭</button>
          <button onClick={() => { onActivate(plan); onClose() }} style={{ flex: 2, padding: '10px 0', border: 'none', borderRadius: 8, background: '#004B8D', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>激活预案</button>
        </div>
      </div>
    </>
  )
}

// ── AI assistant panel ────────────────────────────────────────────────────────

const AI_SUGGESTIONS = [
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/>
      </svg>
    ),
    question: '这个工况应该如何选择预案？',
    desc: '查询相关操作预案、触发条件、及历史经验。',
    accent: '#6CB8FF',
    bg: 'rgba(108,184,255,0.08)',
    border: 'rgba(108,184,255,0.2)',
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    question: 'XX 工艺参数近期表现如何？',
    desc: '分析历史趋势数据，生成趋势图，并自动总结运行状态、波动情况及异常结论。',
    accent: '#A78BFA',
    bg: 'rgba(167,139,250,0.08)',
    border: 'rgba(167,139,250,0.2)',
  },
]

export function AiPanel({ onClose, anchor }: { onClose: () => void; anchor: { right: number; bottom: number } }) {
  return (
    <div style={{
      position: 'fixed', bottom: anchor.bottom, right: anchor.right, width: 300,
      background: 'rgba(4,12,28,0.98)',
      border: '1px solid rgba(108,184,255,0.25)',
      borderRadius: 16, zIndex: 10003, overflow: 'hidden',
      boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 32px rgba(108,184,255,0.12)',
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      animation: 'panelIn 160ms cubic-bezier(0.2,0,0,1)',
    }}>
      {/* Header gradient strip */}
      <div style={{
        padding: '16px 16px 14px',
        background: 'linear-gradient(135deg, rgba(108,184,255,0.12) 0%, rgba(167,139,250,0.08) 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Lightbulb avatar */}
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, rgba(108,184,255,0.25), rgba(167,139,250,0.25))',
              border: '1px solid rgba(108,184,255,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 14px rgba(108,184,255,0.2)',
            }}>
              <LightbulbIcon size={18} color="#6CB8FF" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>您想了解什么？</div>
              <div style={{ fontSize: 11, color: 'rgba(108,184,255,0.75)', marginTop: 2 }}>这里有一些建议</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', flexShrink: 0, marginTop: 2 }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>

      {/* Suggestion cards */}
      <div style={{ padding: '12px 12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {AI_SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            style={{
              width: '100%', textAlign: 'left', padding: '11px 13px',
              background: s.bg, border: `1px solid ${s.border}`,
              borderRadius: 10, cursor: 'pointer',
              display: 'flex', alignItems: 'flex-start', gap: 10,
              transition: 'all 120ms ease', outline: 'none',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = s.bg.replace('0.08', '0.16'); e.currentTarget.style.borderColor = s.border.replace('0.2', '0.45') }}
            onMouseLeave={(e) => { e.currentTarget.style.background = s.bg; e.currentTarget.style.borderColor = s.border }}
          >
            {/* Icon chip */}
            <div style={{
              width: 28, height: 28, borderRadius: 7, flexShrink: 0,
              background: `${s.accent}18`, border: `1px solid ${s.accent}33`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: s.accent, marginTop: 1,
            }}>
              {s.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', lineHeight: 1.3, marginBottom: 4 }}>{s.question}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.42)', lineHeight: 1.5 }}>{s.desc}</div>
            </div>
            {/* Arrow */}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={s.accent} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 6, opacity: 0.7 }}>
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        ))}

        {/* Input hint */}
        <div style={{
          marginTop: 2, padding: '9px 12px',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8,
          cursor: 'text',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', flex: 1 }}>输入您的问题…</span>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)', fontFamily: '"Inter Tight", monospace', letterSpacing: '0.04em' }}>即将开放</span>
        </div>
      </div>
    </div>
  )
}

// ── Clock ─────────────────────────────────────────────────────────────────────

function Clock() {
  const [t, setT] = useState(() => new Date().toLocaleTimeString('zh-CN', { hour12: false }))
  useEffect(() => { const id = setInterval(() => setT(new Date().toLocaleTimeString('zh-CN', { hour12: false })), 1000); return () => clearInterval(id) }, [])
  return <span style={{ color: 'rgba(255,255,255,0.38)', fontSize: 11, fontFamily: '"JetBrains Mono", monospace' }}>2026-08-14 {t}</span>
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface Props {
  onActivate: (name: string) => void
  onView: (name: string) => void
  onManage?: () => void
}

// Returns a live "Xh Ym" string counting up from silentSince
export function useSilentDuration(silentSince: number): string {
  const [elapsed, setElapsed] = useState(Date.now() - silentSince)
  useEffect(() => {
    const id = setInterval(() => setElapsed(Date.now() - silentSince), 60_000)
    return () => clearInterval(id)
  }, [silentSince])
  const totalMinutes = Math.floor(elapsed / 60_000)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

type ActivePanel = 'plans' | 'silent' | 'alert' | 'abnormal' | null

export default function Scene1({ onActivate, onManage }: Props) {
  const [bubbleState,  setBubbleState]  = useState<BubbleState>('silent')
  const [activePanel,  setActivePanel]  = useState<ActivePanel>(null)
  const [aiOpen,       setAiOpen]       = useState(false)
  const [viewPlan,     setViewPlan]     = useState<string | null>(null)
  const [ctxMenu,      setCtxMenu]      = useState<{ x: number; y: number } | null>(null)
  const [bubblePos,    setBubblePos]    = useState(() => ({ x: window.innerWidth - 32 - 72, y: window.innerHeight - 32 - 72 }))
  const [silentSince]  = useState(() => Date.now() - 36 * 3_600_000)
  const silentDuration = useSilentDuration(silentSince)

  // Panel anchor: appears above and aligned to bubble's right edge
  const BALL = 72
  const panelRight = window.innerWidth - bubblePos.x - BALL
  const panelBottom = window.innerHeight - bubblePos.y + 12

  const handleStateChange = (s: BubbleState) => { setBubbleState(s); setActivePanel(null); setAiOpen(false) }

  const openCapPanel = (s: BubbleState) => {
    setAiOpen(false)
    if (s === 'silent')   setActivePanel((p) => p === 'silent'   ? null : 'silent')
    if (s === 'alert')    setActivePanel((p) => p === 'alert'    ? null : 'alert')
    if (s === 'abnormal') setActivePanel((p) => p === 'abnormal' ? null : 'abnormal')
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setActivePanel(null)
    setCtxMenu({ x: e.clientX, y: e.clientY })
  }

  const handleQuit = () => {
    // In a browser context, navigate away or show a confirmation
    if (window.confirm('确定要退出操作导航系统吗？')) {
      window.close()
    }
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', fontFamily: '"Noto Sans SC", "Microsoft YaHei", sans-serif', background: '#040D1A' }}>
      <style>{`
        @keyframes bubblePulse  { 0%,100%{opacity:1} 50%{opacity:0.72} }
        @keyframes ringExpand   { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(2.1);opacity:0} }
        @keyframes panelIn      { from{opacity:0;transform:translateY(8px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes drawerIn     { from{transform:translateX(100%);opacity:0.6} to{transform:translateX(0);opacity:1} }
      `}</style>

      {/* ── DCS background ── */}
      <img
        src={bgDCS}
        alt="DCS 操作画面"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', opacity: 0.5, userSelect: 'none', pointerEvents: 'none' }}
      />
      {/* Vignette */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, rgba(4,13,26,0.05) 0%, rgba(4,13,26,0.5) 100%)', pointerEvents: 'none' }} />

      {/* ── Header ── */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 52, background: 'rgba(0,20,44,0.9)', borderBottom: '1px solid rgba(0,105,168,0.3)', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 14, zIndex: 300, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#005A9B,#004B8D)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,75,141,0.5), inset 0 1px 0 rgba(255,255,255,0.12)', border: '1px solid rgba(0,105,168,0.6)' }}>
            <BookIcon size={20} color="#fff" />
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, lineHeight: 1.1 }}>Emerson DCS</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>预案导航系统 · 静默监控</div>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, fontFamily: '"JetBrains Mono", monospace' }}>气化装置 · 操作监控画面</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(57,197,35,0.12)', border: '1px solid rgba(57,197,35,0.25)', borderRadius: 4, padding: '3px 10px' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#39C523' }} />
          <span style={{ color: '#39C523', fontSize: 11, fontWeight: 500 }}>系统在线</span>
        </div>
        <Clock />
      </div>

      {/* ── State switcher — top right below header ── */}
      <div style={{ position: 'absolute', top: 52 + 20, right: 24, zIndex: 200 }}>
        <StateSwitcher current={bubbleState} onChange={handleStateChange} />
      </div>

      {/* ── Single float bubble ── */}
      <FloatBubble
        state={bubbleState}
        silentDuration={silentDuration}
        onAiClick={() => { setActivePanel(null); setAiOpen((v) => !v) }}
        onCapClick={() => openCapPanel(bubbleState)}
        onContextMenu={handleContextMenu}
        pos={bubblePos}
        onPosChange={setBubblePos}
      />

      {/* ── Right-click context menu ── */}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x} y={ctxMenu.y}
          onManage={() => { onManage?.() }}
          onQuit={handleQuit}
          onClose={() => setCtxMenu(null)}
        />
      )}

      {/* ── AI assistant panel ── */}
      {aiOpen && <AiPanel onClose={() => setAiOpen(false)} anchor={{ right: panelRight, bottom: panelBottom }} />}

      {/* ── Silent panel (静默态) ── */}
      {activePanel === 'silent' && (
        <SilentPanel
          silentDuration={silentDuration}
          onClose={() => setActivePanel(null)}
          onOpenPlans={() => setActivePanel('plans')}
          anchor={{ right: panelRight, bottom: panelBottom }}
        />
      )}

      {/* ── Plan panel ── */}
      {activePanel === 'plans' && (
        <PlanPanel
          state={bubbleState}
          onActivate={(plan) => { onActivate(plan); setActivePanel(null) }}
          onClose={() => setActivePanel(null)}
          onView={(plan) => setViewPlan(plan)}
          anchor={{ right: panelRight, bottom: panelBottom }}
        />
      )}

      {/* ── Alert panel (提示态) ── */}
      {activePanel === 'alert' && (
        <AlertPanel
          onClose={() => setActivePanel(null)}
          onOpenPlans={() => setActivePanel('plans')}
          anchor={{ right: panelRight, bottom: panelBottom }}
        />
      )}

      {/* ── Abnormal panel (异常态) ── */}
      {activePanel === 'abnormal' && (
        <AbnormalPanel
          onActivate={(plan) => { onActivate(plan); setActivePanel(null) }}
          onClose={() => setActivePanel(null)}
          onOpenPlans={() => setActivePanel('plans')}
          anchor={{ right: panelRight, bottom: panelBottom }}
        />
      )}

      {/* ── View plan drawer ── */}
      {viewPlan && (
        <ViewDrawer
          plan={viewPlan}
          onClose={() => setViewPlan(null)}
          onActivate={(p) => { onActivate(p); setViewPlan(null); setActivePanel(null) }}
        />
      )}
    </div>
  )
}

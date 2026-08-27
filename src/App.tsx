import { useState } from 'react'
import Scene1 from './scenes/Scene1'
import Scene2 from './scenes/Scene2'
import Scene3 from './scenes/Scene3'

type Scene = 'dcs' | 'active' | 'manage'

const NAV: { key: Scene; label: string; sub: string }[] = [
  { key: 'dcs', label: '静默场景', sub: '操作员 · 浮球预案' },
  { key: 'active', label: '激活场景', sub: '操作员 · 预案执行' },
  { key: 'manage', label: '管理场景', sub: '工程师 · 组态管理' },
]

export default function App() {
  const [scene, setScene] = useState<Scene>('dcs')
  const [activePlan, setActivePlan] = useState('01 气化冷态开车')

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Demo navigation strip */}
      <div
        style={{
          height: 40,
          background: '#001D38',
          borderBottom: '1px solid rgba(0,75,141,0.4)',
          display: 'flex',
          alignItems: 'stretch',
          gap: 0,
          flexShrink: 0,
          zIndex: 9999,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px', gap: 6, borderRight: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#39C523' }} />
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, letterSpacing: '0.06em', fontFamily: '"Noto Sans SC", sans-serif' }}>
            DEMO
          </span>
        </div>
        {NAV.map((n) => (
          <button
            key={n.key}
            onClick={() => setScene(n.key)}
            style={{
              padding: '0 18px',
              border: 'none',
              borderRight: '1px solid rgba(255,255,255,0.06)',
              background: scene === n.key ? 'rgba(0,75,141,0.6)' : 'transparent',
              borderBottom: scene === n.key ? '2px solid #004B8D' : '2px solid transparent',
              color: scene === n.key ? '#fff' : 'rgba(255,255,255,0.5)',
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 1,
              transition: 'all 120ms ease',
              fontFamily: '"Noto Sans SC", "Microsoft YaHei", sans-serif',
            }}
            onMouseEnter={(e) => { if (scene !== n.key) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
            onMouseLeave={(e) => { if (scene !== n.key) e.currentTarget.style.background = 'transparent' }}
          >
            <span style={{ fontWeight: scene === n.key ? 600 : 400 }}>{n.label}</span>
            <span style={{ fontSize: 9, color: scene === n.key ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.3)' }}>{n.sub}</span>
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', paddingRight: 16, gap: 6 }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: '"JetBrains Mono", monospace' }}>
            ELIT Design Language · Emerson
          </span>
        </div>
      </div>

      {/* Scene content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {scene === 'dcs' && (
          <Scene1
            onActivate={(name) => { setActivePlan(name); setScene('active') }}
            onView={() => {}}
            onManage={() => setScene('manage')}
          />
        )}
        {scene === 'active' && (
          <Scene2
            planName={activePlan}
            onReset={() => setScene('dcs')}
          />
        )}
        {scene === 'manage' && <Scene3 onActivate={(name) => { setActivePlan(name); setScene('active') }} />}
      </div>
    </div>
  )
}

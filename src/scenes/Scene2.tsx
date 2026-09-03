import { useState, useEffect, useMemo } from 'react'
import {
  type BubbleState,
  FloatBubble, SilentPanel, AlertPanel, AbnormalPanel,
  PlanPanel, AiPanel, ViewDrawer, ContextMenu, useSilentDuration,
} from './Scene1'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'

// ── Types ────────────────────────────────────────────────────────────────────
type StepStatus = '已操作' | '待操作' | '注意预操作' | '未达到操作条件' | '已略过'

interface Step {
  seq: number
  type: '操作' | '组标题' | '提示信息'
  group: number
  groupTitle: string
  content: string
  status: StepStatus
  time?: string
  confirm: string
  location?: '现场' | '中控'
  conditions: { label: string; met: boolean; expr: string }[]
  preConditions?: { label: string; met: boolean; expr: string }[]
}

// ── Data ─────────────────────────────────────────────────────────────────────
const STEPS: Step[] = [
  { seq: 2, type: '操作', group: 1, groupTitle: '烘炉', content: '打开 LV021411 前后手阀', status: '已操作', time: '6/11/2026 3:45:59 PM', confirm: '手动确认', location: '现场', conditions: [{ label: 'LV021411 阀位反馈', met: true, expr: '(*LV021411*>0)' }] },
  { seq: 3, type: '操作', group: 1, groupTitle: '烘炉', content: '打开 LV021411 给 V021410 建立液位，V021410 液位到 60% 后投自动', status: '待操作', confirm: '手动确认', location: '中控', conditions: [{ label: 'V021410 液位', met: false, expr: '(*V021410_LI*>=60)' }, { label: 'LV021411 投自动', met: false, expr: '(*LV021411模式*=8)' }] },
  { seq: 4, type: '操作', group: 1, groupTitle: '烘炉', content: '降低压水泵至澄清槽手阀 704105V03 (704021V06)', status: '已操作', time: '6/11/2026 3:45:59 PM', confirm: '手动确认', location: '现场', conditions: [{ label: '手阀开度确认', met: true, expr: '(*FOD03*=0)' }] },
  { seq: 5, type: '操作', group: 1, groupTitle: '烘炉', content: '打开 P021403A/B 进口阀', status: '待操作', confirm: '手动确认', location: '现场', conditions: [{ label: 'P021403A 进口阀', met: false, expr: '(*FOD01*=0)' }] },
  { seq: 6, type: '操作', group: 1, groupTitle: '烘炉', content: '启动 P021403A/B', status: '已操作', time: '6/11/2026 3:45:59 PM', confirm: '手动确认', location: '中控', conditions: [{ label: 'P021403A 运行状态', met: true, expr: '(*FV101*=0)' }] },
  { seq: 7, type: '操作', group: 1, groupTitle: '烘炉', content: '打开 P021403A/B 出口阀给澄清槽建立液位', status: '已操作', time: '6/11/2026 3:46:00 PM', confirm: '手动确认', location: '现场', conditions: [{ label: '澄清槽液位', met: true, expr: '(*FOD04*>0)' }, { label: 'P021403A 出口阀', met: true, expr: '(*P101A*>0)' }], preConditions: [{ label: 'FOD08 状态', met: true, expr: '((*FOD08*>0)并且(*FOD06*=0))' }] },
  { seq: 8, type: '操作', group: 1, groupTitle: '烘炉', content: '启动螺旋机 A021401', status: '待操作', confirm: '手动确认', location: '中控', conditions: [{ label: 'A021401 运行状态', met: false, expr: '(*P101BPG*>0.6)' }], preConditions: [{ label: '步骤 8 前置', met: true, expr: '(^步8^)' }] },
  { seq: 9, type: '操作', group: 1, groupTitle: '烘炉', content: '将气化炉预热水管板侧"通"', status: '注意预操作', time: '6/11/2026 3:46:02 PM', confirm: '手动确认', location: '现场', conditions: [{ label: 'FIC101 模式', met: true, expr: '(*FIC101模式*=8)' }, { label: 'FIC101 测量值范围', met: false, expr: '((*FIC101测量值*>30)并且(*FIC101测量值*<60))' }] },
  { seq: 10, type: '操作', group: 1, groupTitle: '烘炉', content: '打开 FV021342 前后手阀', status: '已操作', time: '6/11/2026 3:45:59 PM', confirm: '手动确认', location: '现场', conditions: [{ label: 'FV021342 阀位', met: true, expr: '(*FOD06*>0)' }] },
  { seq: 11, type: '操作', group: 2, groupTitle: '预热升温', content: '打开米 FV021342 后总阀 703107AV01', status: '待操作', confirm: '手动确认', location: '现场', conditions: [{ label: '703107AV01 阀位', met: false, expr: '(*FIC101模式*=16)' }] },
  { seq: 12, type: '操作', group: 2, groupTitle: '预热升温', content: '打开 FV021310 前后手阀', status: '未达到操作条件', confirm: '手动确认', location: '现场', conditions: [{ label: 'FIC101 设定值', met: false, expr: '(*FIC101设定值*=45)' }] },
  { seq: 13, type: '操作', group: 2, groupTitle: '预热升温', content: '将气化炉至水封管板侧"通"', status: '未达到操作条件', confirm: '手动确认', location: '现场', conditions: [{ label: 'FIC101 测量值', met: false, expr: '((*FIC101测量值*>30)并且(*FIC101测量值*<60))' }] },
  { seq: 14, type: '操作', group: 2, groupTitle: '预热升温', content: '打开气化炉至水封槽手阀', status: '待操作', confirm: '手动确认', location: '现场', conditions: [{ label: '水封槽手阀', met: false, expr: '((*FIC101测量值*>30)并且(*FIC101测量值*<60))' }] },
  { seq: 15, type: '操作', group: 2, groupTitle: '预热升温', content: '打开 FV1310、FV1342、XV1359 调节预热水流量大于 100 m³/h', status: '待操作', confirm: '手动确认', location: '中控', conditions: [{ label: '预热水流量', met: false, expr: '(*FIC1359_PV*>100)' }] },
  { seq: 16, type: '操作', group: 2, groupTitle: '预热升温', content: '关闭渣池泵至真空手阀 703110AV03', status: '待操作', confirm: '手动确认', location: '现场', conditions: [{ label: '703110AV03 阀位', met: false, expr: '(*AV703110_03*=0)' }] },
  { seq: 17, type: '操作', group: 3, groupTitle: '水循环建立', content: '打开渣池泵至澄清槽手阀 703110AV02', status: '待操作', confirm: '手动确认', location: '现场', conditions: [{ label: '703110AV02 阀位', met: false, expr: '(*AV703110_02*>0)' }] },
  { seq: 18, type: '操作', group: 3, groupTitle: '水循环建立', content: '打开 LV021312 前后手阀', status: '待操作', confirm: '手动确认', location: '现场', conditions: [{ label: 'LV021312 阀位', met: false, expr: '(*LV021312*>0)' }] },
  { seq: 19, type: '提示信息', group: 3, groupTitle: '水循环建立', content: '渣池有液位后启动搅拌机 A021302', status: '待操作', confirm: '手动确认', location: '中控', conditions: [] },
  { seq: 20, type: '操作', group: 3, groupTitle: '水循环建立', content: '打开 P021304 1/2 进口阀', status: '待操作', confirm: '手动确认', location: '现场', conditions: [{ label: 'P021304 进口阀', met: false, expr: '(*P021304_IN*>0)' }] },
  { seq: 21, type: '操作', group: 3, groupTitle: '水循环建立', content: '启动 P021304 1/2', status: '待操作', confirm: '手动确认', location: '中控', conditions: [{ label: 'P021304 运行状态', met: false, expr: '(*P021304_RUN*=1)' }] },
]

// priority: 1=紧急 2=高 3=中 4=提示
const PLANS = [
  { name: '06 紧急停车',       priority: 1 },
  { name: '05 停电应急',       priority: 1 },
  { name: '01 气化冷态开车',   priority: 2 },
  { name: '08 烧嘴压差波动',   priority: 2 },
  { name: '10 空分跳车应急',   priority: 3 },
  { name: '09 激冷室底部堵渣', priority: 4 },
]

const PRIORITY_META: Record<number, { label: string; color: string; bg: string; border: string }> = {
  1: { label: '紧急', color: '#C0392B', bg: '#FEF2F2', border: '#FECACA' },
  2: { label: '高',   color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
  3: { label: '中',   color: '#374151', bg: '#F3F4F6', border: '#D1D5DB' },
  4: { label: '提示', color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
}

interface Param {
  id: string; name: string; value: number; unit: string
  high: number; low: number; highHigh?: number; lowLow?: number
  status: 'normal' | 'attention' | 'warning' | 'critical'
}
const PROCESS_PARAMS: Param[] = [
  { id: 'PIC201', name: '激冷室压力',    value: 2.31,  unit: 'MPa',   high: 3.0,  low: 1.5,  highHigh: 3.5,  lowLow: 1.2,  status: 'normal'    },
  { id: 'FIC101', name: '煤浆进料流量',  value: 18.24, unit: 't/h',   high: 25.0, low: 10.0,                               status: 'attention' },
  { id: 'TI302',  name: '出口温度',      value: 1352,  unit: '°C',    high: 1500, low: 1200, highHigh: 1600,               status: 'normal'    },
  { id: 'LIC401', name: '激冷室液位',    value: 63.5,  unit: '%',     high: 80,   low: 30,   highHigh: 90,   lowLow: 15,   status: 'normal'    },
  { id: 'FIC501', name: '激冷水流量',    value: 126.4, unit: 'm³/h',  high: 160,  low: 80,                                 status: 'normal'    },
  { id: 'PDI601', name: '烧嘴压差',      value: 1.28,  unit: 'MPa',   high: 1.2,  low: 0.4,  highHigh: 1.5,               status: 'warning'   },
  { id: 'PIC202', name: '气化炉压力',    value: 3.85,  unit: 'MPa',   high: 4.2,  low: 3.0,  highHigh: 4.5,               status: 'normal'    },
  { id: 'FIC102', name: '氧气进料流量',  value: 22.1,  unit: 'km³/h', high: 28.0, low: 12.0,                               status: 'normal'    },
  { id: 'PIC203', name: '煤浆泵出口压力',value: 5.12,  unit: 'MPa',   high: 6.0,  low: 4.0,  highHigh: 6.5,               status: 'normal'    },
  { id: 'LIC402', name: '闪蒸槽液位',    value: 48.2,  unit: '%',     high: 75,   low: 25,   highHigh: 85,   lowLow: 15,   status: 'normal'    },
  { id: 'TI303',  name: '合成气出口温度',value: 248,   unit: '°C',    high: 300,  low: 180,  highHigh: 350,               status: 'normal'    },
  { id: 'FIC502', name: '激冷水补水量',  value: 14.6,  unit: 'm³/h',  high: 25,   low: 5,                                  status: 'normal'    },
  { id: 'AI601',  name: '合成气CO含量',  value: 42.3,  unit: '%',     high: 50,   low: 35,                                 status: 'attention' },
  { id: 'AI602',  name: '合成气H₂含量',  value: 36.8,  unit: '%',     high: 45,   low: 28,                                 status: 'normal'    },
  { id: 'TI304',  name: '气化炉壁温',    value: 312,   unit: '°C',    high: 400,  low: 250,  highHigh: 450,               status: 'normal'    },
  { id: 'PDI602', name: '洗涤塔压差',    value: 0.42,  unit: 'MPa',   high: 0.6,  low: 0.1,  highHigh: 0.8,               status: 'normal'    },
]

function generateTrend(base: number, count = 30, noise = 0.05) {
  return Array.from({ length: count }, (_, i) => ({
    t: `${String(Math.floor(14 + i * 0.5)).padStart(2, '0')}:${String(Math.round((i * 0.5 % 1) * 60)).padStart(2, '0')}`,
    v: parseFloat((base + (Math.random() - 0.5) * base * noise + Math.sin(i / 5) * base * 0.02).toFixed(2)),
  }))
}
// All selectable trend params (id → chart config)
const ALL_TRENDS: Record<string, { name: string; unit: string; high: number; low: number; color: string; data: { t: string; v: number }[] }> = {
  PIC201: { name: '激冷室压力',     unit: 'MPa',   high: 3.0,  low: 1.5,  color: '#004B8D', data: generateTrend(2.31,   30, 0.05) },
  FIC101: { name: '煤浆进料流量',   unit: 't/h',   high: 25,   low: 10,   color: '#F2B544', data: generateTrend(18.24,  30, 0.08) },
  TI302:  { name: '出口温度',       unit: '°C',    high: 1500, low: 1200, color: '#39C523', data: generateTrend(1352,   30, 0.03) },
  LIC401: { name: '激冷室液位',     unit: '%',     high: 80,   low: 30,   color: '#0069A8', data: generateTrend(63.5,   30, 0.06) },
  FIC501: { name: '激冷水流量',     unit: 'm³/h',  high: 160,  low: 80,   color: '#7A68A6', data: generateTrend(126.4,  30, 0.04) },
  PDI601: { name: '烧嘴压差',       unit: 'MPa',   high: 1.2,  low: 0.4,  color: '#D66B55', data: generateTrend(1.28,   30, 0.06) },
  PIC202: { name: '气化炉压力',     unit: 'MPa',   high: 4.2,  low: 3.0,  color: '#2E86AB', data: generateTrend(3.85,   30, 0.04) },
  FIC102: { name: '氧气进料流量',   unit: 'km³/h', high: 28,   low: 12,   color: '#E84855', data: generateTrend(22.1,   30, 0.06) },
  PIC203: { name: '煤浆泵出口压力', unit: 'MPa',   high: 6.0,  low: 4.0,  color: '#3BB273', data: generateTrend(5.12,   30, 0.03) },
  LIC402: { name: '闪蒸槽液位',     unit: '%',     high: 75,   low: 25,   color: '#F4A261', data: generateTrend(48.2,   30, 0.07) },
  TI303:  { name: '合成气出口温度', unit: '°C',    high: 300,  low: 180,  color: '#A8DADC', data: generateTrend(248,    30, 0.04) },
  FIC502: { name: '激冷水补水量',   unit: 'm³/h',  high: 25,   low: 5,    color: '#9B5DE5', data: generateTrend(14.6,   30, 0.09) },
  AI601:  { name: '合成气CO含量',   unit: '%',     high: 50,   low: 35,   color: '#F15BB5', data: generateTrend(42.3,   30, 0.03) },
  AI602:  { name: '合成气H₂含量',   unit: '%',     high: 45,   low: 28,   color: '#00BBF9', data: generateTrend(36.8,   30, 0.03) },
  TI304:  { name: '气化炉壁温',     unit: '°C',    high: 400,  low: 250,  color: '#FEE440', data: generateTrend(312,    30, 0.02) },
  PDI602: { name: '洗涤塔压差',     unit: 'MPa',   high: 0.6,  low: 0.1,  color: '#00F5D4', data: generateTrend(0.42,   30, 0.08) },
}

const DEFAULT_SELECTED = PROCESS_PARAMS.map((p) => p.id)

const STATUS_STYLE: Record<StepStatus, { bg: string; color: string; dot: string; label: string }> = {
  '已操作': { bg: '#EFF9EC', color: '#237D17', dot: '#39C523', label: '已操作' },
  '待操作': { bg: '#F7F8FA', color: '#515760', dot: '#CDD2D9', label: '待操作' },
  '注意预操作': { bg: '#FEF9EC', color: '#8B6200', dot: '#F2B544', label: '注意预操作' },
  '未达到操作条件': { bg: '#FCECEC', color: '#A52727', dot: '#D93838', label: '未达到条件' },
  '已略过': { bg: '#F1F3F6', color: '#747A82', dot: '#9FA1A4', label: '已略过' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function ParamCard({ p, isCurrent }: { p: Param; isCurrent?: boolean }) {
  const overHigh = p.value > p.high
  const overHighHigh = p.highHigh != null && p.value > p.highHigh
  const underLow = p.value < p.low
  const underLowLow = p.lowLow != null && p.value < p.lowLow

  const abnormal = overHigh || underLow
  const critical = overHighHigh || underLowLow

  const valueColor = critical
    ? '#D93838'
    : abnormal
    ? '#F28C28'
    : p.status === 'attention'
    ? '#8B6200'
    : '#171A1E'

  return (
    <div style={{
      padding: '7px 10px',
      background: critical ? '#FFF5F5' : abnormal ? '#FEF3E8' : '#F9FAFB',
      borderRadius: 7,
      border: `1px solid ${critical ? 'rgba(217,56,56,0.2)' : abnormal ? 'rgba(242,140,40,0.2)' : '#E0E4E9'}`,
      borderLeft: `3px solid ${critical ? '#D93838' : abnormal ? '#F28C28' : p.status === 'attention' ? '#F2B544' : '#39C523'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 9, color: '#747A82', fontFamily: '"JetBrains Mono", monospace', marginBottom: 1 }}>{p.id}</div>
        <div style={{ fontSize: 10, color: '#515760', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, flexShrink: 0 }}>
        {(overHighHigh) && <span style={{ fontSize: 10, color: '#D93838' }}>▲</span>}
        {(overHigh && !overHighHigh) && <span style={{ fontSize: 10, color: '#F28C28' }}>▲</span>}
        {(underLowLow) && <span style={{ fontSize: 10, color: '#004B8D' }}>▼</span>}
        {(underLow && !underLowLow) && <span style={{ fontSize: 10, color: '#F2B544' }}>▼</span>}
        <span style={{ fontSize: 19, fontWeight: 700, color: 'rgb(0, 0, 0)', fontFamily: '"Inter Tight", sans-serif', fontVariantNumeric: 'tabular-nums' }}>{p.value}</span>
        <span style={{ fontSize: 10, color: '#9FA6AF' }}>{p.unit}</span>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
interface Props { planName: string; onReset: () => void }

export default function Scene2({ planName, onReset }: Props) {
  const [activeTab, setActiveTab] = useState(0)
  const [conditionStep, setConditionStep] = useState<Step | null>(null)
  const [elapsed, setElapsed] = useState(23)
  const [confirmed, setConfirmed] = useState(false)
  const [resetConfirm, setResetConfirm] = useState(false)
  const [confirmDoneOpen, setConfirmDoneOpen] = useState(false)
  const [completedOpen, setCompletedOpen] = useState(false)
  const [paramFilter, setParamFilter] = useState<'all' | 'warning' | 'normal'>('all')
  const [selectedParamId, setSelectedParamId] = useState<string>(() => {
    const first = PROCESS_PARAMS.find(p => p.status !== 'normal')
    return first ? first.id : PROCESS_PARAMS[0].id
  })
  const [feedback, setFeedback] = useState('')
  const startTime = '2026-08-17 09:32'

  // ── Float bubble state ──
  type ActivePanel = 'plans' | 'silent' | 'alert' | 'abnormal' | null
  const [bubbleState,  setBubbleState]  = useState<BubbleState>('abnormal')
  const [activePanel,  setActivePanel]  = useState<ActivePanel>(null)
  const [aiOpen,       setAiOpen]       = useState(false)
  const [viewPlan,     setViewPlan]     = useState<string | null>(null)
  const [ctxMenu,      setCtxMenu]      = useState<{ x: number; y: number } | null>(null)
  const [bubblePos,    setBubblePos]    = useState(() => ({ x: window.innerWidth - 72 - 8, y: Math.round((window.innerHeight - 72) / 2) }))
  const [silentSince]  = useState(() => Date.now() - 36 * 3_600_000)
  const silentDuration = useSilentDuration(silentSince)
  const BALL = 72
  const panelRight  = window.innerWidth  - bubblePos.x - BALL
  const panelBottom = window.innerHeight - bubblePos.y + 12
  const handleBubbleStateChange = (s: BubbleState) => { setBubbleState(s); setActivePanel(null); setAiOpen(false) }
  const openCapPanel = (s: BubbleState) => {
    setAiOpen(false)
    if (s === 'silent')   setActivePanel((p) => p === 'silent'   ? null : 'silent')
    if (s === 'alert')    setActivePanel((p) => p === 'alert'    ? null : 'alert')
    if (s === 'abnormal') setActivePanel((p) => p === 'abnormal' ? null : 'abnormal')
  }
  const handleContextMenu = (e: React.MouseEvent) => { e.preventDefault(); setActivePanel(null); setCtxMenu({ x: e.clientX, y: e.clientY }) }
  const handleQuit = () => { if (window.confirm('确定要退出操作导航系统吗？')) window.close() }


  useEffect(() => {
    const id = setInterval(() => setElapsed((t) => t + 1), 60000)
    return () => clearInterval(id)
  }, [])

  // First '待操作' step is the "current" step to highlight
  const currentSeq = useMemo(() => STEPS.find((s) => s.status === '待操作')?.seq ?? -1, [])

  const doneCount = STEPS.filter((s) => s.status === '已操作').length
  const progress = Math.round((doneCount / STEPS.length) * 100)

  // Group steps by group number
  const groups = useMemo(() => {
    const map = new Map<number, { title: string; steps: Step[] }>()
    for (const step of STEPS) {
      if (!map.has(step.group)) map.set(step.group, { title: step.groupTitle, steps: [] })
      map.get(step.group)!.steps.push(step)
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0])
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#E9EDF2', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: '"Noto Sans SC", "Microsoft YaHei", sans-serif' }}>
      {/* ─── Secondary Action Bar ─── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E0E4E9', display: 'flex', alignItems: 'center', padding: '0 16px', height: 44, gap: 16, flexShrink: 0, boxShadow: '0 1px 4px rgba(27,39,52,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: '#515760' }}>执行进度</span>
          <div style={{ width: 100, height: 6, background: '#E0E4E9', borderRadius: 999 }}>
            <div style={{ width: `${progress}%`, height: '100%', background: '#39C523', borderRadius: 999, transition: 'width 300ms ease' }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#237D17', fontFamily: '"Inter Tight", sans-serif', fontVariantNumeric: 'tabular-nums' }}>{progress}%</span>
        </div>
        <div style={{ width: 1, height: 20, background: '#E0E4E9' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#515760', fontSize: 12 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#747A82" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
          <span style={{ fontFamily: '"Inter Tight", sans-serif', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
            {elapsed}
          </span>
          <span style={{ color: '#747A82' }}>分钟</span>
        </div>
        <div style={{ width: 1, height: 20, background: '#E0E4E9' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#515760', fontSize: 12 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#747A82" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
          <span style={{ color: '#747A82' }}>开始</span>
          <span style={{ fontFamily: '"JetBrains Mono", monospace', fontVariantNumeric: 'tabular-nums', fontSize: 11, color: '#30353B', fontWeight: 500 }}>{startTime}</span>
        </div>
        <div style={{ width: 1, height: 20, background: '#E0E4E9' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#9FA6AF', fontSize: 12 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9FA6AF" strokeWidth="2"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" opacity=".3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="#747A82"/><polyline points="12 6 12 12 16 14" stroke="#747A82"/></svg>
          <span>均值</span>
          <span style={{ fontFamily: '"Inter Tight", sans-serif', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: '#747A82' }}>25</span>
          <span>分钟</span>
        </div>

        <div style={{ flex: 1 }} />

        {/* 结束操作 */}
        <button
          onClick={() => setResetConfirm(true)}
          style={{ padding: '6px 16px', border: '1.5px solid #CDD2D9', borderRadius: 6, background: '#fff', color: '#30353B', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 120ms ease' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#B7BDC5'; e.currentTarget.style.background = '#F7F8FA' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#CDD2D9'; e.currentTarget.style.background = '#fff' }}
        >
          结束操作
        </button>
      </div>

      {/* ─── Main Content ─── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', gap: 10, padding: 10 }}>

        {/* Far Left: Plan list by priority */}
        <div style={{ width: 188, flexShrink: 0, background: '#fff', borderRadius: 12, border: '1px solid rgba(96,108,122,0.14)', boxShadow: '0 8px 24px rgba(27,39,52,0.07)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid #E0E4E9', flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#747A82', letterSpacing: '0.07em', textTransform: 'uppercase' }}>执行预案列表</div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0 10px' }}>
            {(() => {
              const seen = new Set<number>()
              const order: number[] = []
              for (const p of PLANS) { if (!seen.has(p.priority)) { seen.add(p.priority); order.push(p.priority) } }
              return order.map((pri) => {
                const meta = PRIORITY_META[pri]
                const plansInGroup = PLANS.map((p, i) => ({ ...p, idx: i })).filter((p) => p.priority === pri)
                return (
                  <div key={pri}>
                    {/* Priority section header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px 4px' }}>
                      <div style={{ width: 7, height: 7, borderRadius: 2, background: meta.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: meta.color, letterSpacing: '0.04em' }}>{meta.label}优先级</span>
                      <span style={{ marginLeft: 'auto', fontSize: 9, color: '#9FA6AF', fontFamily: '"Inter Tight", sans-serif' }}>{plansInGroup.length}</span>
                    </div>
                    {/* Plan items */}
                    {plansInGroup.map((p) => {
                      const active = activeTab === p.idx
                      return (
                        <button key={p.idx} onClick={() => setActiveTab(p.idx)}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 12px', border: 'none', background: active ? meta.bg : 'transparent', borderLeft: `3px solid ${active ? meta.color : 'transparent'}`, cursor: 'pointer', textAlign: 'left', transition: 'all 80ms' }}
                          onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#F7F8FA' }}
                          onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}
                        >
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: active ? meta.color : '#CDD2D9', flexShrink: 0 }} />
                          <span style={{ fontSize: 11, fontWeight: active ? 700 : 400, color: active ? meta.color : '#515760', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                            {p.idx === 0 ? planName : p.name}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )
              })
            })()}
          </div>
        </div>

        {/* Center: Execution Steps */}
        <div style={{ flex: 1, background: '#fff', borderRadius: 12, border: '1px solid rgba(96,108,122,0.14)', boxShadow: '0 8px 24px rgba(27,39,52,0.07)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '96px 148px 36px 1fr 36px', padding: '0 10px', height: 34, alignItems: 'center', background: '#F1F3F6', borderBottom: '1px solid #E0E4E9', fontSize: 11, color: '#747A82', fontWeight: 600, flexShrink: 0 }}>
            <span>实时状态</span>
            <span>时间戳</span>
            <span style={{ textAlign: 'center' }}>步序</span>
            <span>操作内容</span>
            <span style={{ textAlign: 'center' }}>确认</span>
          </div>

          {/* Steps list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>

            {/* ── Completed steps collapsible section ── */}
            {(() => {
              const completedSteps = STEPS.filter((s) => s.status === '已操作')
              if (completedSteps.length === 0) return null
              return (
                <div>
                  {/* Collapsed header */}
                  <button
                    onClick={() => setCompletedOpen((v) => !v)}
                    style={{
                      width: '100%', border: 'none', padding: '7px 12px',
                      background: '#EFF9EC',
                      borderBottom: '1px solid #C8EEC0',
                      display: 'flex', alignItems: 'center', gap: 8,
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <svg
                      width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="#237D17" strokeWidth="2.5" strokeLinecap="round"
                      style={{ transform: completedOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 160ms ease', flexShrink: 0 }}
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#237D17" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#237D17' }}>已完成操作</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#237D17', marginLeft: 2, fontFamily: '"Inter Tight", sans-serif' }}>{completedSteps.length} 步</span>
                    <span style={{ fontSize: 10, color: '#39C523', marginLeft: 'auto' }}>{completedOpen ? '收起' : '展开查看'}</span>
                  </button>

                  {/* Expanded completed rows */}
                  {completedOpen && completedSteps.map((step) => (
                    <div
                      key={step.seq}
                      onClick={() => step.conditions.length > 0 && setConditionStep(step)}
                      style={{
                        display: 'grid', gridTemplateColumns: '96px 148px 36px 1fr 36px',
                        padding: '6px 10px', borderBottom: '1px solid #DCF0D8',
                        alignItems: 'center', minHeight: 38,
                        background: '#F7FCF5',
                        borderLeft: '3px solid #39C523',
                        cursor: step.conditions.length > 0 ? 'pointer' : 'default',
                        opacity: 0.82,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#EFF9EC' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#F7FCF5' }}
                    >
                      <div>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 6px', borderRadius: 999, background: '#EFF9EC', color: '#237D17', fontSize: 10, fontWeight: 500 }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#39C523', flexShrink: 0 }} />已操作
                        </span>
                      </div>
                      <span style={{ fontSize: 10, color: '#747A82', fontFamily: '"JetBrains Mono", monospace', fontVariantNumeric: 'tabular-nums' }}>{step.time ?? '—'}</span>
                      <span style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#9FA6AF', fontFamily: '"Inter Tight", sans-serif' }}>{step.seq}</span>
                      <span style={{ fontSize: 12, color: '#515760', lineHeight: 1.4, display: 'flex', alignItems: 'center', gap: 5 }}>
                        {step.location === '现场' && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F28C28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="现场操作" style={{ flexShrink: 0 }}>
                            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                          </svg>
                        )}
                        {step.content}
                      </span>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <div style={{ width: 22, height: 22, borderRadius: 6, border: '1.5px solid rgba(57,197,35,0.4)', background: '#EFF9EC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#39C523' }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}

            {/* ── Active groups (non-completed steps only) ── */}
            {groups.map(([groupNum, { title, steps }]) => {
              const activeSteps = steps.filter((s) => s.status !== '已操作')
              if (activeSteps.length === 0) return null
              return (
              <div key={groupNum}>
                {/* Full-width group header */}
                <div style={{ padding: '5px 12px', background: '#F1F3F6', borderBottom: '1px solid #CDD2D9', borderTop: '2px solid #E0E4E9', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 18, height: 18, borderRadius: 4, background: '#004B8D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', fontFamily: '"Inter Tight", sans-serif', flexShrink: 0 }}>
                    {groupNum}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#30353B' }}>{title}</span>
                  <span style={{ fontSize: 10, color: '#9FA6AF', marginLeft: 4 }}>
                    {steps.filter((s) => s.status === '已操作').length}/{steps.length} 步已完成
                  </span>
                </div>

                {/* Active steps in group */}
                {activeSteps.map((step) => {
                  const ss = STATUS_STYLE[step.status]
                  const isCurrent = step.seq === currentSeq
                  const isInfo = step.type === '提示信息'
                  const hasConditions = step.conditions.length > 0
                  const isConfirmed = step.status === '已操作'

                  return (
                    <div
                      key={step.seq}
                      onClick={() => hasConditions && setConditionStep(step)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '96px 148px 36px 1fr 36px',
                        padding: '7px 10px',
                        borderBottom: '1px solid #E0E4E9',
                        alignItems: 'center',
                        minHeight: 42,
                        background: isCurrent
                          ? 'linear-gradient(90deg, #EEF5FB 0%, #F5F9FE 100%)'
                          : isInfo ? '#FEF9EC' : 'transparent',
                        borderLeft: isCurrent ? '3px solid #004B8D' : '3px solid transparent',
                        cursor: hasConditions ? 'pointer' : 'default',
                        transition: 'background 100ms ease',
                      }}
                      onMouseEnter={(e) => { if (!isCurrent && !isInfo) e.currentTarget.style.background = '#F7F8FA' }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = isCurrent
                          ? 'linear-gradient(90deg, #EEF5FB 0%, #F5F9FE 100%)'
                          : isInfo ? '#FEF9EC' : 'transparent'
                      }}
                    >
                      {/* Status badge */}
                      <div>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 6px', borderRadius: 999, background: ss.bg, color: ss.color, fontSize: 10, fontWeight: 500, whiteSpace: 'nowrap' }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: ss.dot, flexShrink: 0 }} />
                          {ss.label}
                        </span>
                      </div>
                      {/* Timestamp */}
                      <span style={{ fontSize: 10, color: '#747A82', fontFamily: '"JetBrains Mono", monospace', fontVariantNumeric: 'tabular-nums' }}>{step.time ?? '—'}</span>
                      {/* Step number */}
                      <span style={{ textAlign: 'center', fontSize: 12, fontWeight: isCurrent ? 700 : 600, color: isCurrent ? '#004B8D' : '#747A82', fontFamily: '"Inter Tight", sans-serif' }}>{step.seq}</span>
                      {/* Content */}
                      <span style={{ fontSize: 12, color: isInfo ? '#8B6200' : '#171A1E', lineHeight: 1.4, fontWeight: isCurrent ? 600 : 400, display: 'flex', alignItems: 'center', gap: 5 }}>
                        {step.location === '现场' && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F28C28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="现场操作" style={{ flexShrink: 0 }}>
                            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                          </svg>
                        )}
                        {step.content}
                      </span>
                      {/* Hand confirm button */}
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <button
                          onClick={(e) => { e.stopPropagation() /* manual confirm action */ }}
                          title="手动确认"
                          style={{
                            width: 26, height: 26,
                            borderRadius: 6,
                            border: isConfirmed ? '1.5px solid rgba(57,197,35,0.4)' : '1.5px solid #CDD2D9',
                            background: isConfirmed ? '#EFF9EC' : '#fff',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 120ms ease',
                            flexShrink: 0,
                            color: isConfirmed ? '#39C523' : '#9FA6AF',
                          }}
                          onMouseEnter={(e) => { if (!isConfirmed) { e.currentTarget.style.borderColor = '#004B8D'; e.currentTarget.style.color = '#004B8D'; e.currentTarget.style.background = '#EEF5FB' } }}
                          onMouseLeave={(e) => { if (!isConfirmed) { e.currentTarget.style.borderColor = '#CDD2D9'; e.currentTarget.style.color = '#9FA6AF'; e.currentTarget.style.background = '#fff' } }}
                        >
                          {/* Hand icon */}
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 11V8a2 2 0 0 0-2-2 2 2 0 0 0-2 2" />
                            <path d="M14 10V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2" />
                            <path d="M10 10.5V5a2 2 0 0 0-2-2 2 2 0 0 0-2 2v9" />
                            <path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34L3 19" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
              )
            })}
          </div>

          {/* Summary */}
          <div style={{ padding: '6px 14px', borderTop: '1px solid #E0E4E9', display: 'flex', gap: 14, fontSize: 10, color: '#747A82', background: '#F9FAFB', flexShrink: 0 }}>
            {([['已操作', '#39C523'], ['待操作', '#CDD2D9'], ['注意预操作', '#F2B544'], ['未达到操作条件', '#D93838']] as [string, string][]).map(([label, color]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
                <span>{label} {STEPS.filter((s) => s.status === label).length}</span>
              </div>
            ))}
            <span style={{ marginLeft: 'auto' }}>共 {STEPS.length} 步</span>
          </div>

          {/* 确认完成 — 通栏按钮 */}
          <button
            onClick={() => setConfirmDoneOpen(true)}
            style={{ width: '100%', padding: '13px 0', border: 'none', borderTop: '1px solid #E0E4E9', borderRadius: '0 0 12px 12px', background: '#004B8D', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, flexShrink: 0, transition: 'background 120ms ease', letterSpacing: '0.02em' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#005A9B')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#004B8D')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
            确认完成
          </button>
        </div>

        {/* Right: Process Card */}
        <div style={{ flex: '0 0 27.5%', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden', minWidth: 0 }}>
          {/* Key Process Params */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid rgba(96,108,122,0.14)', boxShadow: '0 8px 24px rgba(27,39,52,0.07)', padding: '8px 12px', height: 480, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
            {/* Header + filter chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, flexShrink: 0 }}>
              <span style={{ fontSize: 10, color: '#747A82', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>关键工艺参数</span>
              <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
                {([['warning', '超限', '#D93838', '#FFF0F0'], ['normal', '正常', '#237D17', '#EFF9EC'], ['all', '全部', '#515760', '#F1F3F6']] as [typeof paramFilter, string, string, string][]).map(([v, label, activeColor, activeBg]) => (
                  <button key={v} onClick={() => setParamFilter(v)}
                    style={{ padding: '2px 9px', border: `1px solid ${paramFilter === v ? activeColor : '#CDD2D9'}`, borderRadius: 999, fontSize: 10, fontWeight: paramFilter === v ? 700 : 400, background: paramFilter === v ? activeBg : '#fff', color: paramFilter === v ? activeColor : '#747A82', cursor: 'pointer', transition: 'all 80ms' }}>
                    {label}
                    {v !== 'all' && (
                      <span style={{ marginLeft: 4, fontFamily: '"Inter Tight", sans-serif', fontWeight: 700 }}>
                        {PROCESS_PARAMS.filter(p => v === 'warning' ? p.status !== 'normal' : p.status === 'normal').length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                {PROCESS_PARAMS
                  .filter(p => paramFilter === 'all' ? true : paramFilter === 'warning' ? p.status !== 'normal' : p.status === 'normal')
                  .map((p) => (
                    <button key={p.id} onClick={() => setSelectedParamId(p.id)}
                      style={{ all: 'unset', cursor: 'pointer', display: 'block', borderRadius: 8, outline: selectedParamId === p.id ? `2px solid #004B8D` : '2px solid transparent', transition: 'outline 80ms' }}>
                      <ParamCard p={p} isCurrent={selectedParamId === p.id} />
                    </button>
                  ))
                }
              </div>
              {PROCESS_PARAMS.filter(p => paramFilter === 'all' ? true : paramFilter === 'warning' ? p.status !== 'normal' : p.status === 'normal').length === 0 && (
                <div style={{ textAlign: 'center', padding: '18px 0', fontSize: 12, color: '#9FA6AF' }}>无{paramFilter === 'warning' ? '超限' : '正常'}参数</div>
              )}
            </div>
          </div>

          {/* Single Trend Chart — driven by selectedParamId */}
          <div style={{ flex: 1, background: '#fff', borderRadius: 12, border: '1px solid rgba(96,108,122,0.14)', boxShadow: '0 8px 24px rgba(27,39,52,0.07)', padding: '8px 12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {(() => {
              const cfg = ALL_TRENDS[selectedParamId]
              const param = PROCESS_PARAMS.find(p => p.id === selectedParamId)
              if (!cfg) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9FA6AF', fontSize: 12 }}>请选择参数</div>
              const isOver = param && param.status !== 'normal'
              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexShrink: 0 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#171A1E' }}>{cfg.name}</span>
                    <span style={{ fontSize: 10, fontFamily: '"JetBrains Mono", monospace', color: '#9FA6AF' }}>{selectedParamId}</span>
                    {isOver && <span style={{ fontSize: 10, fontWeight: 700, color: '#D93838', background: '#FFF0F0', padding: '1px 7px', borderRadius: 999, border: '1px solid rgba(217,56,56,0.2)' }}>超限</span>}
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 14, fontSize: 10 }}>
                      <span style={{ color: '#D93838', fontFamily: '"Inter Tight", sans-serif' }}>▲ 上限 {cfg.high} {cfg.unit}</span>
                      <span style={{ color: '#004B8D', fontFamily: '"Inter Tight", sans-serif' }}>▼ 下限 {cfg.low} {cfg.unit}</span>
                    </div>
                  </div>
                  <div style={{ flex: 1, minHeight: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={cfg.data} margin={{ top: 6, right: 12, left: -18, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E0E4E9" opacity={0.5} />
                        <XAxis dataKey="t" tick={{ fontSize: 9, fill: '#9FA6AF' }} tickLine={false} interval={4} />
                        <YAxis tick={{ fontSize: 9, fill: '#9FA6AF' }} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 7, border: '1px solid #E0E4E9', background: '#fff', padding: '5px 10px' }} labelStyle={{ color: '#515760' }} formatter={(v) => [`${v} ${cfg.unit}`, cfg.name]} />
                        <ReferenceLine y={cfg.high} stroke="#D93838" strokeDasharray="4 2" strokeWidth={1.5} label={{ value: '上限', position: 'insideTopRight', fontSize: 9, fill: '#D93838' }} />
                        <ReferenceLine y={cfg.low} stroke="#004B8D" strokeDasharray="4 2" strokeWidth={1.5} label={{ value: '下限', position: 'insideBottomRight', fontSize: 9, fill: '#004B8D' }} />
                        <Line type="monotone" dataKey="v" stroke={cfg.color} strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: cfg.color }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      </div>

      {/* ─── Judgment Modal ─── */}
      {conditionStep && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(23,26,30,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }} onClick={() => setConditionStep(null)}>
          <div style={{ background: '#fff', borderRadius: 12, width: 540, maxHeight: '72vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden', animation: 'panelIn 160ms ease' }} onClick={(e) => e.stopPropagation()}>
            <style>{`@keyframes panelIn { from { opacity:0; transform:scale(0.96) } to { opacity:1; transform:scale(1) } }`}</style>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #E0E4E9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 10, color: '#747A82', marginBottom: 3 }}>步骤 {conditionStep.seq} · 操作成功判定</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#171A1E' }}>{conditionStep.content}</div>
              </div>
              <button onClick={() => setConditionStep(null)} style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #E0E4E9', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#747A82' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <div style={{ overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#515760', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 3, height: 12, background: '#004B8D', borderRadius: 2 }} />操作判定条件
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {conditionStep.conditions.map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', borderRadius: 8, background: c.met ? '#EFF9EC' : '#FCECEC', border: `1px solid ${c.met ? 'rgba(57,197,35,0.25)' : 'rgba(217,56,56,0.2)'}` }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', background: c.met ? '#39C523' : '#D93838', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {c.met
                          ? <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>
                          : <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><line x1="3" y1="3" x2="9" y2="9" stroke="white" strokeWidth="1.8" strokeLinecap="round" /><line x1="9" y1="3" x2="3" y2="9" stroke="white" strokeWidth="1.8" strokeLinecap="round" /></svg>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: '#30353B', marginBottom: 2 }}>{c.label}</div>
                        <div style={{ fontSize: 10, fontFamily: '"JetBrains Mono", monospace', color: c.met ? '#237D17' : '#A52727' }}>{c.expr}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: c.met ? '#237D17' : '#A52727' }}>{c.met ? '已满足' : '未满足'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {conditionStep.preConditions && conditionStep.preConditions.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#515760', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 3, height: 12, background: '#F2B544', borderRadius: 2 }} />预操作判定条件
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {conditionStep.preConditions.map((c, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', borderRadius: 8, background: c.met ? '#EFF9EC' : '#FEF9EC', border: `1px solid ${c.met ? 'rgba(57,197,35,0.25)' : 'rgba(242,181,68,0.3)'}` }}>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', background: c.met ? '#39C523' : '#F2B544', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {c.met
                            ? <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>
                            : <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><line x1="6" y1="2" x2="6" y2="7" stroke="white" strokeWidth="2" strokeLinecap="round" /><circle cx="6" cy="10" r="1" fill="white" /></svg>}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, color: '#30353B', marginBottom: 2 }}>{c.label}</div>
                          <div style={{ fontSize: 10, fontFamily: '"JetBrains Mono", monospace', color: c.met ? '#237D17' : '#8B6200' }}>{c.expr}</div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: c.met ? '#237D17' : '#8B6200' }}>{c.met ? '已满足' : '注意'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#515760', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 3, height: 12, background: '#0069A8', borderRadius: 2 }} />OPC 点位通讯状态
                </div>
                <div style={{ padding: '8px 12px', background: '#F7F8FA', borderRadius: 8, border: '1px solid #E0E4E9', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {conditionStep.conditions.map((c, i) => {
                    const opcId = c.expr.match(/\*([^*]+)\*/)?.[1] ?? `POINT_${i + 1}`
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                        <span style={{ fontFamily: '"JetBrains Mono", monospace', color: '#515760' }}>{opcId}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#39C523' }} />
                          <span style={{ color: '#237D17' }}>通讯正常</span>
                          <span style={{ color: '#9FA6AF', marginLeft: 4 }}>质量码 192</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 确认完成弹窗 ─── */}
      {confirmDoneOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }}>
          <div style={{ width: 440, background: '#fff', borderRadius: 14, boxShadow: '0 24px 64px rgba(27,39,52,0.22)', overflow: 'hidden', animation: 'modalIn 160ms cubic-bezier(0.2,0,0,1)' }}>
            <div style={{ padding: '22px 24px 16px', borderBottom: '1px solid #E0E4E9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EFF9EC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#237D17" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#171A1E' }}>确认完成此预案</div>
              </div>
              <div style={{ fontSize: 13, color: '#515760', lineHeight: 1.65, paddingLeft: 42 }}>
                确认后将标记预案已完成并关闭此预案，操作记录将自动归档。请确认所有步骤均已执行完毕。
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #E0E4E9' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#515760', display: 'block', marginBottom: 8 }}>
                操作反馈 <span style={{ fontWeight: 400, color: '#9FA6AF' }}>（选填）</span>
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="请填写本次操作的情况说明、异常记录或改进建议…"
                rows={4}
                style={{
                  width: '100%', padding: '10px 12px', border: '1.5px solid #CDD2D9', borderRadius: 8,
                  fontSize: 13, color: '#30353B', resize: 'vertical', outline: 'none',
                  fontFamily: '"Noto Sans SC", "Microsoft YaHei", sans-serif', lineHeight: 1.65,
                  boxSizing: 'border-box', transition: 'border-color 120ms ease',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#004B8D')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#CDD2D9')}
              />
            </div>
            <div style={{ padding: '14px 24px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmDoneOpen(false)}
                style={{ padding: '8px 20px', border: '1.5px solid #CDD2D9', borderRadius: 8, background: '#fff', color: '#30353B', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'background 100ms ease' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#F7F8FA')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
              >取消</button>
              <button
                onClick={onReset}
                style={{ padding: '8px 20px', border: 'none', borderRadius: 8, background: '#004B8D', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background 100ms ease' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#005A9B')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#004B8D')}
              >确认完成，关闭预案</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 结束操作确认弹窗 ─── */}
      {resetConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }}>
          <div style={{ width: 360, background: '#fff', borderRadius: 14, boxShadow: '0 24px 64px rgba(27,39,52,0.22)', overflow: 'hidden', animation: 'modalIn 160ms cubic-bezier(0.2,0,0,1)' }}>
            <style>{`@keyframes modalIn { from{opacity:0;transform:scale(0.95) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }`}</style>
            {/* Header */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #E0E4E9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FEF3F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D93838" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#171A1E' }}>确认结束操作</div>
              </div>
              <div style={{ fontSize: 13, color: '#515760', lineHeight: 1.6, paddingLeft: 42 }}>
                结束后将退出当前预案执行，已操作步骤将保留记录。此操作不可撤销，确认继续？
              </div>
            </div>
            {/* Footer */}
            <div style={{ padding: '14px 24px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setResetConfirm(false)}
                style={{ padding: '8px 20px', border: '1.5px solid #CDD2D9', borderRadius: 8, background: '#fff', color: '#30353B', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 100ms ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#F7F8FA' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#fff' }}
              >取消</button>
              <button
                onClick={onReset}
                style={{ padding: '8px 20px', border: 'none', borderRadius: 8, background: '#D93838', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background 100ms ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#C03030' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#D93838' }}
              >确认结束</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Float Bubble ── */}
      <style>{`
        @keyframes bubblePulse  { 0%,100%{opacity:1} 50%{opacity:0.72} }
        @keyframes ringExpand   { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(2.1);opacity:0} }
        @keyframes panelIn      { from{opacity:0;transform:translateY(8px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes drawerIn     { from{transform:translateX(100%);opacity:0.6} to{transform:translateX(0);opacity:1} }
      `}</style>
      <FloatBubble
        state={bubbleState}
        silentDuration={silentDuration}
        onAiClick={() => { setActivePanel(null); setAiOpen((v) => !v) }}
        onCapClick={() => openCapPanel(bubbleState)}
        onContextMenu={handleContextMenu}
        pos={bubblePos}
        onPosChange={setBubblePos}
      />
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x} y={ctxMenu.y}
          onManage={() => {}}
          onQuit={handleQuit}
          onClose={() => setCtxMenu(null)}
        />
      )}
      {aiOpen && <AiPanel onClose={() => setAiOpen(false)} anchor={{ right: panelRight, bottom: panelBottom }} />}
      {activePanel === 'silent' && (
        <SilentPanel silentDuration={silentDuration} onClose={() => setActivePanel(null)} onOpenPlans={() => setActivePanel('plans')} anchor={{ right: panelRight, bottom: panelBottom }} />
      )}
      {activePanel === 'plans' && (
        <PlanPanel state={bubbleState} onActivate={() => setActivePanel(null)} onClose={() => setActivePanel(null)} onView={(p) => setViewPlan(p)} anchor={{ right: panelRight, bottom: panelBottom }} />
      )}
      {activePanel === 'alert' && (
        <AlertPanel onClose={() => setActivePanel(null)} onOpenPlans={() => setActivePanel('plans')} anchor={{ right: panelRight, bottom: panelBottom }} />
      )}
      {activePanel === 'abnormal' && (
        <AbnormalPanel onActivate={() => setActivePanel(null)} onClose={() => setActivePanel(null)} onOpenPlans={() => setActivePanel('plans')} anchor={{ right: panelRight, bottom: panelBottom }} />
      )}
      {viewPlan && (
        <ViewDrawer plan={viewPlan} onClose={() => setViewPlan(null)} onActivate={() => { setViewPlan(null); setActivePanel(null) }} />
      )}
    </div>
  )
}

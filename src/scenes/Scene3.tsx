import { useState, useMemo } from 'react'
import { ViewDrawer } from './Scene1'

// ─── Data ───────────────────────────────────────────────────────────────────

interface Plan {
  id: string
  name: string
  status: 'enabled' | 'disabled' | 'draft'
  priority: string
  updatedAt: string
}

interface AlarmPriority {
  id: string
  name: string
  color: string
}

const DEFAULT_ALARM_PRIORITIES: AlarmPriority[] = [
  { id: 'p1', name: 'P1 紧急', color: '#D93838' },
  { id: 'p2', name: 'P2 高', color: '#F28C28' },
  { id: 'p3', name: 'P3 中', color: '#F2B544' },
  { id: 'p4', name: 'P4 低', color: '#39C523' },
  { id: 'p5', name: 'P5 参考', color: '#82B9DD' },
]

const SECTIONS_INIT = ['气化装置', '甲醇装置']

// Shared with Scene1 — do not remove exports
export const SHARED_SECTIONS = SECTIONS_INIT
export type SharedProcRow = { type: string; group: number; seq: number; content: string; location: '现场' | '中控' | '' }

export const SHARED_PLANS_DATA: Record<string, { id: string; name: string; status: string }[]> = {
  '气化装置': [
    { id: 'g01', name: '01 气化冷态开车', status: 'enabled' },
    { id: 'g02', name: '02 气化停车', status: 'enabled' },
    { id: 'g03', name: '03 气化热态开车', status: 'enabled' },
    { id: 'g05', name: '05 停电应急', status: 'enabled' },
    { id: 'g06', name: '06 紧急停车', status: 'enabled' },
    { id: 'g08', name: '08 烧嘴压差波动', status: 'enabled' },
    { id: 'g09', name: '09 激冷室底部堵渣操作', status: 'draft' },
    { id: 'g10', name: '10 空分跳车应急', status: 'enabled' },
  ],
  '甲醇装置': [
    { id: 'm01', name: '停车至热循环', status: 'enabled' },
    { id: 'm02', name: '冷态开车', status: 'enabled' },
    { id: 'm03', name: '分离器顶部带液预案', status: 'enabled' },
    { id: 'm05', name: '压缩机跳停', status: 'enabled' },
    { id: 'm06', name: '反应器床层压降过大预案', status: 'enabled' },
    { id: 'm07', name: '反应器床层温度高', status: 'enabled' },
    { id: 'm09', name: '汽包干烧紧急预案', status: 'enabled' },
    { id: 'm10', name: '汽包满水预案', status: 'enabled' },
  ],
}

const PLANS_DATA: Record<string, Plan[]> = {
  '气化装置': [
    { id: 'g01', name: '01 气化冷态开车',      status: 'enabled',  priority: 'p1', updatedAt: '2026-07-15' },
    { id: 'g02', name: '02 气化停车',           status: 'enabled',  priority: 'p2', updatedAt: '2026-07-15' },
    { id: 'g03', name: '03 气化热态开车',       status: 'enabled',  priority: 'p1', updatedAt: '2026-07-20' },
    { id: 'g05', name: '05 停电应急',           status: 'enabled',  priority: 'p2', updatedAt: '2026-07-22' },
    { id: 'g06', name: '06 紧急停车',           status: 'enabled',  priority: 'p1', updatedAt: '2026-07-22' },
    { id: 'g08', name: '08 烧嘴压差波动',       status: 'enabled',  priority: 'p2', updatedAt: '2026-07-18' },
    { id: 'g09', name: '09 激冷室底部堵渣操作', status: 'draft',    priority: 'p3', updatedAt: '2026-08-01' },
    { id: 'g10', name: '10 空分跳车应急',       status: 'enabled',  priority: 'p1', updatedAt: '2026-07-25' },
  ],
  '甲醇装置': [
    { id: 'm01', name: '停车至热循环',           status: 'enabled',  priority: 'p2', updatedAt: '2026-07-14' },
    { id: 'm02', name: '冷态开车',               status: 'enabled',  priority: 'p1', updatedAt: '2026-07-14' },
    { id: 'm03', name: '分离器顶部带液预案',     status: 'enabled',  priority: 'p2', updatedAt: '2026-07-16' },
    { id: 'm05', name: '压缩机跳停',             status: 'enabled',  priority: 'p1', updatedAt: '2026-07-19' },
    { id: 'm06', name: '反应器床层压降过大预案', status: 'enabled',  priority: 'p2', updatedAt: '2026-07-20' },
    { id: 'm07', name: '反应器床层温度高',       status: 'enabled',  priority: 'p1', updatedAt: '2026-07-20' },
    { id: 'm09', name: '汽包干烧紧急预案',       status: 'enabled',  priority: 'p1', updatedAt: '2026-07-23' },
    { id: 'm10', name: '汽包满水预案',           status: 'enabled',  priority: 'p2', updatedAt: '2026-07-23' },
  ],
}

// ─── Config rows ─────────────────────────────────────────────────────────────

type ProcRow = { type: string; group: number; seq: number; content: string; score: number; judge: string; preJudge: string; startSym: string; endSym: string; hold: string; location: '现场' | '中控' | '' }

export const SHARED_PROC_ROWS: ProcRow[] = [
  { type: '组标题', group: 1, seq: 1, content: '关闭新鲜气，进入热循环', score: 0, judge: '', preJudge: '', startSym: '', endSym: '', hold: '', location: '' },
  { type: '操作', group: 1, seq: 2, content: '原料气流量控制 FIC4101 投手动', score: 1, judge: '(*FIC4101模式*=8)', preJudge: '', startSym: '', endSym: '', hold: '', location: '中控' },
  { type: '操作', group: 1, seq: 3, content: '关闭 @@FV4101', score: 1, judge: '(*FV4101*=0)', preJudge: '', startSym: '', endSym: '', hold: '', location: '中控' },
  { type: '操作', group: 1, seq: 4, content: '打开 D4101 现场中压氮气手阀向系统内充入氮气', score: 1, judge: '', preJudge: '', startSym: '', endSym: '', hold: '', location: '现场' },
  { type: '操作', group: 1, seq: 5, content: '设定汽包压力控制 APIC4210A 设定值在 2000 到 2200 KPaG', score: 1, judge: '((*APIC4210A设定值*>=2000)并且(*APIC4210A设定值*<=2200))', preJudge: '', startSym: '', endSym: '', hold: '', location: '中控' },
  { type: '操作', group: 1, seq: 6, content: '打开 HN 手操器 HIC4201', score: 1, judge: '(*HIC4201*>0)', preJudge: '', startSym: '', endSym: '', hold: '', location: '中控' },
  { type: '操作', group: 1, seq: 7, content: '打开防喘阀 @@PV4101', score: 1, judge: '(*PV4101*>0)', preJudge: '', startSym: '', endSym: '', hold: '', location: '中控' },
  { type: '操作', group: 1, seq: 8, content: '打开防喘阀 @@PV4102', score: 1, judge: '(*PV4102*>0)', preJudge: '', startSym: '', endSym: '', hold: '', location: '中控' },
  { type: '操作', group: 1, seq: 9, content: '控制压缩机转速 SI4101 参数在 7500 到 9000', score: 1, judge: '((*SI4101*>7500)并且(*SI4101*<9000))', preJudge: '', startSym: '', endSym: '', hold: '', location: '中控' },
  { type: '操作', group: 1, seq: 10, content: '设定 D4201 压力控制 PIC4215 设定值在 5.5 到 6.5', score: 1, judge: '((*PIC4215设定值*>5.5)并且(*PIC4215设定值*<6.5))', preJudge: '', startSym: '', endSym: '', hold: '', location: '中控' },
  { type: '组标题', group: 2, seq: 11, content: '停氢回收', score: 0, judge: '', preJudge: '', startSym: '', endSym: '', hold: '', location: '' },
  { type: '操作', group: 2, seq: 12, content: '关闭分离器到水洗塔手阀', score: 1, judge: '', preJudge: '', startSym: '', endSym: '', hold: '', location: '现场' },
  { type: '操作', group: 2, seq: 13, content: 'C4201 塔顶流量控制 FIC4203 投手动', score: 1, judge: '(*FIC4203模式*=8)', preJudge: '', startSym: '', endSym: '', hold: '', location: '中控' },
  { type: '操作', group: 2, seq: 14, content: '关闭 @@FV4203', score: 1, judge: '(*FV4203*=0)', preJudge: '', startSym: '', endSym: '', hold: '', location: '中控' },
  { type: '提示信息', group: 2, seq: 15, content: '关闭富氢气进 D4101 手阀', score: 0, judge: '', preJudge: '', startSym: '', endSym: '', hold: '', location: '现场' },
  { type: '操作', group: 2, seq: 16, content: '脱盐水流量控制 FIC4209 投手动', score: 1, judge: '(*FIC4209模式*=8)', preJudge: '', startSym: '', endSym: '', hold: '', location: '中控' },
  { type: '操作', group: 2, seq: 17, content: '关闭 @@FV4209', score: 1, judge: '(*FV4209*=0)', preJudge: '', startSym: '', endSym: '', hold: '', location: '中控' },
  { type: '操作', group: 2, seq: 18, content: '停止 P4201 泵 P4201', score: 1, judge: '(*P4201*=0)', preJudge: '', startSym: '', endSym: '', hold: '', location: '中控' },
  { type: '组标题', group: 3, seq: 19, content: '待系统 CO 及 CO2 浓度降低后，切断分离器至闪蒸槽', score: 0, judge: '', preJudge: '', startSym: '', endSym: '', hold: '', location: '' },
  { type: '操作', group: 3, seq: 20, content: '控制进塔前合成气组分 COmol%AI4201B 参数 小于 0.5', score: 1, judge: '(*AI4201B*<0.5)', preJudge: '', startSym: '', endSym: '', hold: '', location: '中控' },
  { type: '操作', group: 3, seq: 21, content: '控制进塔前合成气组分 CO2mol%AI4201C 参数 小于 0.2', score: 1, judge: '(*AI4201C*<0.2)', preJudge: '', startSym: '', endSym: '', hold: '', location: '中控' },
  { type: '操作', group: 3, seq: 22, content: '控制入塔气温度 TI4205 参数 200~220', score: 1, judge: '(*TI4205*>200)并且(*TI4205*<220)', preJudge: '', startSym: '', endSym: '', hold: '', location: '中控' },
  { type: '操作', group: 4, seq: 23, content: '控制 D4201 液位控制 LIC4201 测量值在 5 到 10', score: 1, judge: '((*LIC4201测量值*>=5)并且(*LIC4201测量值*<=10))', preJudge: '', startSym: '', endSym: '', hold: '', location: '中控' },
  { type: '操作', group: 4, seq: 24, content: 'D4201 液位控制 LIC4201 投手动', score: 1, judge: '(*LIC4201模式*=8)', preJudge: '', startSym: '', endSym: '', hold: '', location: '中控' },
  { type: '操作', group: 4, seq: 25, content: '设定 D4201 液位控制 LIC4201 输出值等于 0', score: 1, judge: '(*LIC4201输出值*=0)', preJudge: '', startSym: '', endSym: '', hold: '', location: '中控' },
  { type: '操作', group: 4, seq: 26, content: '关闭 D4201 塔底阀 XV4202', score: 1, judge: '(*XV4202*=0)', preJudge: '', startSym: '', endSym: '', hold: '', location: '中控' },
]

const PROC_ROWS_INIT = SHARED_PROC_ROWS

const TRIGGER_ROWS = [
  { status: 'NA', time: '', seq: 1, desc: '反应器温度高', judge: '(*MF_R4201_TEMP_HIGH*=1)', autoDetect: '', delay: '', changeRate: '', rateMonitor: '', allowChange: '', rateWeight: '', rateDir: '', rateStatus: '' },
  { status: 'NA', time: '', seq: 2, desc: '分离器液位高', judge: '(*MF_SEP_LEVEL_HH*=1)', autoDetect: '', delay: '5', changeRate: '', rateMonitor: '', allowChange: '', rateWeight: '', rateDir: '', rateStatus: '' },
]

const PROCESS_CARD_ROWS = [
  { seq: 1, group: '烘炉',    paramDesc: '汽包液位',       series: 1, deductLimit: 10, highHigh: 90, high: 85, low: 20, lowLow: 10, paramObj: 'LIC4205测量值', startSym: '', endJudge: '(*AI4201B*<0.5)' },
  { seq: 2, group: '预热升温', paramDesc: 'D4201 液位控制', series: 2, deductLimit: 20, highHigh: 85, high: 70, low: 20, lowLow: 10, paramObj: 'LIC4201测量值', startSym: '', endJudge: '(*AI4201B*<0.5)' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StatusTag({ status }: { status: Plan['status'] }) {
  const map = {
    enabled: { bg: '#EFF9EC', color: '#237D17', dot: '#39C523', label: '已启用' },
    disabled: { bg: '#F1F3F6', color: '#515760', dot: '#9FA1A4', label: '已禁用' },
    draft: { bg: '#FEF9EC', color: '#8B6200', dot: '#F2B544', label: '草稿' },
  }
  const s = map[status]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, background: s.bg, color: s.color, fontSize: 11, fontWeight: 500 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot }} />
      {s.label}
    </span>
  )
}

function PriTag({ priorityId, matrix }: { priorityId: string; matrix: AlarmPriority[] }) {
  const pri = (matrix ?? []).find((m) => m.id === priorityId)
  if (!pri) return <span style={{ fontSize: 11, color: '#9FA6AF' }}>—</span>
  const bg = pri.color + '22'
  const border = pri.color + '55'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, background: bg, color: pri.color, fontSize: 11, fontWeight: 600, border: `1px solid ${border}`, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: pri.color, flexShrink: 0 }} />
      {pri.name}
    </span>
  )
}

function ToolbarBtn({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 10px',
        border: '1px solid #CDD2D9',
        borderRadius: 5,
        background: '#fff',
        color: '#30353B',
        fontSize: 11,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'all 100ms ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#82B9DD'; e.currentTarget.style.color = '#004B8D' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#CDD2D9'; e.currentTarget.style.color = '#30353B' }}
    >
      {label}
    </button>
  )
}

// ─── Config Panel ────────────────────────────────────────────────────────────

function ConfigPanel({ planName, onClose, priority, onPriorityChange, matrix }: { planName: string; onClose: () => void; priority?: string; onPriorityChange?: (v: string) => void; matrix?: AlarmPriority[] }) {
  const [tab, setTab] = useState<'proc' | 'trigger' | 'card'>('proc')
  const [selectedRow, setSelectedRow] = useState<number | null>(null)
  const [procRows, setProcRows] = useState<ProcRow[]>(PROC_ROWS_INIT)
  const [editingGroupIdx, setEditingGroupIdx] = useState<number | null>(null)
  const [editingGroupName, setEditingGroupName] = useState('')
  const [addGroupDialog, setAddGroupDialog] = useState(false)
  const [addGroupName, setAddGroupName] = useState('')
  const [linkedHazardId, setLinkedHazardId] = useState<string | null>(null)

  const PROC_COLS = 10

  const confirmAddGroup = () => {
    const name = addGroupName.trim() || `新分组`
    const maxGroup = procRows.reduce((m, r) => Math.max(m, r.group), 0)
    const maxSeq = procRows.reduce((m, r) => Math.max(m, r.seq), 0)
    const newGroup = maxGroup + 1
    setProcRows((prev) => [
      ...prev,
      { type: '组标题', group: newGroup, seq: maxSeq + 1, content: name, score: 0, judge: '', preJudge: '', startSym: '', endSym: '', hold: '', location: '' },
    ])
    setAddGroupName('')
    setAddGroupDialog(false)
  }

  const startEditGroup = (idx: number, name: string) => {
    setEditingGroupIdx(idx)
    setEditingGroupName(name)
  }

  const commitEditGroup = () => {
    if (editingGroupIdx === null) return
    setProcRows((prev) => prev.map((r, i) =>
      i === editingGroupIdx ? { ...r, content: editingGroupName.trim() || r.content } : r
    ))
    setEditingGroupIdx(null)
  }

  const toggleLocation = (idx: number) => {
    setProcRows((prev) => prev.map((r, i) => {
      if (i !== idx || r.type === '组标题') return r
      const next = r.location === '现场' ? '中控' : r.location === '中控' ? '现场' : '中控'
      return { ...r, location: next }
    }))
  }

  const tabs = [
    { key: 'proc' as const, label: '操作规程' },
    { key: 'trigger' as const, label: '触发条件' },
    { key: 'card' as const, label: '工艺卡片' },
  ]

  const typeBg = (t: string) =>
    t === '提示信息' ? '#FEF9EC' : 'transparent'
  const typeColor = (t: string) =>
    t === '提示信息' ? '#8B6200' : '#171A1E'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
      {/* Config Header */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid #E0E4E9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div>
            <div style={{ fontSize: 10, color: '#747A82', marginBottom: 3 }}>预案组态</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#171A1E' }}>{planName}</div>
          </div>
          {matrix && onPriorityChange && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: '#747A82', fontWeight: 500 }}>优先级</span>
              <select
                value={priority ?? ''}
                onChange={(e) => onPriorityChange(e.target.value)}
                style={{ padding: '4px 8px', border: '1px solid #CDD2D9', borderRadius: 6, fontSize: 12, background: '#fff', color: '#30353B', cursor: 'pointer', outline: 'none' }}
              >
                <option value="">— 未设置 —</option>
                {matrix.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ padding: '6px 16px', border: '1px solid #CDD2D9', borderRadius: 6, background: '#fff', color: '#30353B', fontSize: 12, cursor: 'pointer' }}>
            保存
          </button>
          <button style={{ padding: '6px 16px', border: 'none', borderRadius: 6, background: '#004B8D', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            确认
          </button>
          <button onClick={onClose} style={{ padding: '6px 14px', border: '1px solid #CDD2D9', borderRadius: 6, background: '#fff', color: '#515760', fontSize: 12, cursor: 'pointer' }}>
            取消
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #E0E4E9', background: '#F9FAFB', flexShrink: 0 }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '9px 20px',
              border: 'none',
              borderBottom: tab === t.key ? '2px solid #004B8D' : '2px solid transparent',
              background: 'transparent',
              color: tab === t.key ? '#004B8D' : '#515760',
              fontSize: 13,
              fontWeight: tab === t.key ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 120ms ease',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #E0E4E9', display: 'flex', gap: 6, flexWrap: 'wrap', background: '#FAFBFC', flexShrink: 0 }}>
        <ToolbarBtn label="整表粘贴" />
        <ToolbarBtn label="清空整表" />
        <div style={{ width: 1, background: '#E0E4E9', margin: '0 4px' }} />
        {tab === 'proc' && (
          <>
            <ToolbarBtn label="粘入操作" />
            <ToolbarBtn label="粘入判定" />
            <div style={{ width: 1, background: '#E0E4E9', margin: '0 4px' }} />
            <ToolbarBtn label="+ 新增分组" onClick={() => { setAddGroupName(''); setAddGroupDialog(true) }} />
          </>
        )}
        {tab === 'trigger' && (
          <>
            <ToolbarBtn label="粘入故障判定" />
            <ToolbarBtn label="粘入变化率参数" />
            <ToolbarBtn label="粘入纯判定" />
          </>
        )}
        {tab === 'card' && (
          <>
            <ToolbarBtn label="粘入参数" />
            <ToolbarBtn label="粘入判定" />
          </>
        )}
        <div style={{ width: 1, background: '#E0E4E9', margin: '0 4px' }} />
        <ToolbarBtn label="上移" />
        <ToolbarBtn label="下移" />
        <ToolbarBtn label="序号重排" />
        <div style={{ width: 1, background: '#E0E4E9', margin: '0 4px' }} />
        <ToolbarBtn label="向上添加" />
        <ToolbarBtn label="向下添加" />
        <ToolbarBtn label="尾部添加" />
        <div style={{ flex: 1 }} />
        <ToolbarBtn label="删除选中" />
      </div>

      {/* New Group Dialog */}
      {addGroupDialog && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(23,26,30,0.35)' }}
          onClick={() => setAddGroupDialog(false)}>
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 16px 40px rgba(20,34,48,0.18)', padding: '24px 28px', width: 340, display: 'flex', flexDirection: 'column', gap: 16 }}
            onClick={(e) => e.stopPropagation()}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#171A1E', marginBottom: 4 }}>新增分组</div>
              <div style={{ fontSize: 12, color: '#747A82' }}>为新分组定义名称，创建后可继续添加操作步骤</div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#515760', display: 'block', marginBottom: 6 }}>分组名称</label>
              <input
                autoFocus
                value={addGroupName}
                onChange={(e) => setAddGroupName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') confirmAddGroup(); if (e.key === 'Escape') setAddGroupDialog(false) }}
                placeholder="例如：系统预热、投料准备…"
                style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #CDD2D9', borderRadius: 7, fontSize: 13, outline: 'none', fontFamily: '"Noto Sans SC", sans-serif', boxSizing: 'border-box', transition: 'border-color 120ms ease' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#004B8D')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#CDD2D9')}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setAddGroupDialog(false)} style={{ padding: '7px 18px', border: '1px solid #CDD2D9', borderRadius: 6, background: '#fff', color: '#515760', fontSize: 12, cursor: 'pointer' }}>
                取消
              </button>
              <button onClick={confirmAddGroup} style={{ padding: '7px 18px', border: 'none', borderRadius: 6, background: '#004B8D', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                创建分组
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        {tab === 'proc' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#F1F3F6', position: 'sticky', top: 0, zIndex: 2 }}>
                {['类型', '步序号', '操作内容', '执行位置', '分值', '操作判定', '预操作判定', '开始表征', '终止表征', '保持时间'].map((h) => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#515760', fontWeight: 600, fontSize: 11, borderBottom: '1px solid #CDD2D9', whiteSpace: 'nowrap', borderRight: '1px solid #E0E4E9' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {procRows.map((row, i) => {
                if (row.type === '组标题') {
                  // Full-width group banner row
                  const isEditing = editingGroupIdx === i
                  const groupNum = procRows.slice(0, i + 1).filter((r) => r.type === '组标题').length
                  return (
                    <tr key={i}>
                      <td
                        colSpan={PROC_COLS}
                        style={{
                          padding: 0,
                          borderBottom: '1px solid #C2CEDE',
                          borderTop: i > 0 ? '2px solid #E0E4E9' : 'none',
                        }}
                      >
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '7px 12px',
                          background: 'linear-gradient(90deg, #EEF5FB 0%, #F5F9FE 60%, #F9FAFB 100%)',
                          borderLeft: '3px solid #004B8D',
                          minHeight: 36,
                        }}>
                          {/* Group number badge */}
                          <div style={{ width: 20, height: 20, borderRadius: 5, background: '#004B8D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', fontFamily: '"Inter Tight", sans-serif', flexShrink: 0 }}>
                            {groupNum}
                          </div>
                          {/* Group name — inline editable */}
                          {isEditing ? (
                            <input
                              autoFocus
                              value={editingGroupName}
                              onChange={(e) => setEditingGroupName(e.target.value)}
                              onBlur={commitEditGroup}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') commitEditGroup() }}
                              style={{ flex: 1, padding: '3px 8px', border: '1.5px solid #004B8D', borderRadius: 5, fontSize: 13, fontWeight: 700, color: '#171A1E', background: '#fff', fontFamily: '"Noto Sans SC", sans-serif', outline: 'none' }}
                            />
                          ) : (
                            <span
                              style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#1A2D45', cursor: 'text', letterSpacing: '0.01em' }}
                              onDoubleClick={() => startEditGroup(i, row.content)}
                              title="双击编辑分组名称"
                            >
                              {row.content}
                            </span>
                          )}
                          {/* Step count badge */}
                          {(() => {
                            const count = procRows.slice(i + 1).filter((r, j) => {
                              const nextGroupIdx = procRows.slice(i + 1).findIndex((rr) => rr.type === '组标题')
                              return (nextGroupIdx === -1 || j < nextGroupIdx) && r.type !== '组标题'
                            }).length
                            return (
                              <span style={{ fontSize: 10, color: '#5A7899', background: '#D8E8F5', padding: '1px 7px', borderRadius: 999, fontFamily: '"Inter Tight", sans-serif', fontWeight: 500 }}>
                                {count} 步
                              </span>
                            )
                          })()}
                          {/* Edit button */}
                          <button
                            onClick={() => startEditGroup(i, row.content)}
                            title="编辑分组名称"
                            style={{ padding: '3px 8px', border: '1px solid rgba(0,75,141,0.2)', borderRadius: 5, background: 'rgba(0,75,141,0.06)', color: '#004B8D', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 100ms ease' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,75,141,0.12)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,75,141,0.06)' }}
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            编辑名称
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                }

                // Regular step row
                return (
                  <tr
                    key={i}
                    onClick={() => setSelectedRow(selectedRow === i ? null : i)}
                    style={{
                      background: selectedRow === i ? '#EEF5FB' : typeBg(row.type),
                      borderBottom: '1px solid #E0E4E9',
                      cursor: 'pointer',
                      transition: 'background 80ms ease',
                    }}
                    onMouseEnter={(e) => { if (selectedRow !== i) e.currentTarget.style.background = '#F7F8FA' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = selectedRow === i ? '#EEF5FB' : typeBg(row.type) }}
                  >
                    <td style={{ padding: '6px 10px', borderRight: '1px solid #E0E4E9', whiteSpace: 'nowrap' }}>
                      <span style={{
                        fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 500,
                        background: row.type === '提示信息' ? '#FEF9EC' : '#F1F3F6',
                        color: row.type === '提示信息' ? '#8B6200' : '#515760',
                      }}>
                        {row.type}
                      </span>
                    </td>
                    <td style={{ padding: '6px 10px', borderRight: '1px solid #E0E4E9', textAlign: 'center', fontWeight: 600, color: selectedRow === i ? '#004B8D' : '#747A82', fontFamily: '"Inter Tight", sans-serif', fontSize: 11 }}>
                      {row.seq}
                    </td>
                    <td style={{ padding: '6px 10px', borderRight: '1px solid #E0E4E9', color: typeColor(row.type), maxWidth: 280 }}>
                      {row.content}
                    </td>
                    <td style={{ padding: '6px 10px', borderRight: '1px solid #E0E4E9', textAlign: 'center' }} onClick={(e) => { e.stopPropagation(); toggleLocation(i) }}>
                      {row.location ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                          padding: '2px 7px', borderRadius: 999, fontSize: 11, fontWeight: 500, cursor: 'pointer',
                          background: row.location === '现场' ? '#FEF3E8' : '#EEF5FB',
                          color: row.location === '现场' ? '#7A4000' : '#004B8D',
                          border: `1px solid ${row.location === '现场' ? 'rgba(242,140,40,0.3)' : 'rgba(0,75,141,0.2)'}`,
                          userSelect: 'none',
                        }}>
                          {row.location === '现场' && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                            </svg>
                          )}
                          {row.location}
                        </span>
                      ) : (
                        <span style={{ fontSize: 10, color: '#CDD2D9', cursor: 'pointer' }} title="点击设置执行位置">—</span>
                      )}
                    </td>
                    <td style={{ padding: '6px 10px', borderRight: '1px solid #E0E4E9', textAlign: 'center', color: '#515760', fontFamily: '"Inter Tight", sans-serif' }}>{row.score}</td>
                    <td style={{ padding: '6px 10px', borderRight: '1px solid #E0E4E9', fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: '#004B8D', maxWidth: 200, wordBreak: 'break-word' }}>{row.judge}</td>
                    <td style={{ padding: '6px 10px', borderRight: '1px solid #E0E4E9', fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: '#0069A8', maxWidth: 180 }}>{row.preJudge}</td>
                    <td style={{ padding: '6px 10px', borderRight: '1px solid #E0E4E9', color: '#747A82', fontFamily: '"JetBrains Mono", monospace', fontSize: 10 }}>{row.startSym}</td>
                    <td style={{ padding: '6px 10px', borderRight: '1px solid #E0E4E9', color: '#747A82', fontFamily: '"JetBrains Mono", monospace', fontSize: 10 }}>{row.endSym}</td>
                    <td style={{ padding: '6px 10px', color: '#747A82' }}>{row.hold}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {tab === 'trigger' && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* ── Hazard association section ── */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #E0E4E9', background: '#FAFBFC', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: linkedHazardId ? 10 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: '#FEF3E8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F28C28" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#515760' }}>关联隐患</span>
                </div>
                <select
                  value={linkedHazardId ?? ''}
                  onChange={e => setLinkedHazardId(e.target.value || null)}
                  style={{ padding: '5px 10px', border: '1.5px solid #CDD2D9', borderRadius: 6, fontSize: 12, background: '#fff', color: '#171A1E', cursor: 'pointer', outline: 'none', fontFamily: '"Noto Sans SC", sans-serif', minWidth: 220 }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#004B8D')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#CDD2D9')}
                >
                  <option value="">— 不关联隐患 —</option>
                  {INIT_HAZARDS.map(h => (
                    <option key={h.id} value={h.id}>{h.name}（{h.device} · {h.unit}）</option>
                  ))}
                </select>
                {linkedHazardId && (
                  <span style={{ fontSize: 11, color: '#9FA6AF' }}>
                    选中后，该隐患的触发条件将导入到本预案
                  </span>
                )}
                {linkedHazardId && (
                  <button
                    onClick={() => setLinkedHazardId(null)}
                    style={{ marginLeft: 'auto', padding: '3px 8px', border: '1px solid #CDD2D9', borderRadius: 5, background: '#fff', color: '#747A82', fontSize: 11, cursor: 'pointer' }}
                  >清除关联</button>
                )}
              </div>
              {/* Show linked hazard's trigger conditions */}
              {linkedHazardId && (() => {
                const h = INIT_HAZARDS.find(x => x.id === linkedHazardId)
                if (!h) return null
                return (
                  <div style={{ background: '#fff', border: '1px solid rgba(242,140,40,0.25)', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ padding: '7px 12px', background: 'linear-gradient(90deg, #FEF3E8 0%, #FAFBFC 100%)', borderBottom: '1px solid rgba(242,140,40,0.15)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#F28C28' }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#7A4000' }}>{h.name}</span>
                      <span style={{ fontSize: 11, color: '#9FA6AF' }}>{h.device} › {h.unit}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 10, color: '#F28C28', background: 'rgba(242,140,40,0.1)', padding: '2px 7px', borderRadius: 999, fontWeight: 600 }}>{h.triggers.length} 条触发条件</span>
                    </div>
                    {h.triggers.length > 0 ? (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                        <thead>
                          <tr style={{ background: '#F9F9FA' }}>
                            {['序号', '故障说明', '故障判定表达式', '判定延迟 (s)', '参数变化率'].map(col => (
                              <th key={col} style={{ padding: '6px 10px', textAlign: 'left', color: '#747A82', fontWeight: 600, fontSize: 10, borderBottom: '1px solid #E0E4E9', borderRight: '1px solid #E0E4E9', whiteSpace: 'nowrap' }}>{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {h.triggers.map((t) => (
                            <tr key={t.seq} style={{ borderBottom: '1px solid #F1F3F6' }}>
                              <td style={{ padding: '5px 10px', borderRight: '1px solid #E0E4E9', textAlign: 'center', fontFamily: '"Inter Tight", sans-serif', fontWeight: 700, color: '#747A82' }}>{t.seq}</td>
                              <td style={{ padding: '5px 10px', borderRight: '1px solid #E0E4E9', color: '#30353B' }}>{t.desc}</td>
                              <td style={{ padding: '5px 10px', borderRight: '1px solid #E0E4E9', fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: '#004B8D' }}>{t.judge}</td>
                              <td style={{ padding: '5px 10px', borderRight: '1px solid #E0E4E9', textAlign: 'center', color: '#515760', fontFamily: '"Inter Tight", sans-serif' }}>{t.delay || '—'}</td>
                              <td style={{ padding: '5px 10px', color: '#515760' }}>{t.changeRate || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div style={{ padding: '12px', textAlign: 'center', fontSize: 11, color: '#9FA6AF' }}>该隐患暂无触发条件</div>
                    )}
                  </div>
                )
              })()}
            </div>
            {/* ── Trigger table ── */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#F1F3F6', position: 'sticky', top: 0, zIndex: 1 }}>
                  {['实时状', '时间戳', '序号', '故障说明', '故障判定', '自动检测前', '判定延迟', '参数变化率', '参数变化率监', '允许变化', '变化率考量层', '变化率考量方向'].map((h) => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#515760', fontWeight: 600, fontSize: 11, borderBottom: '1px solid #CDD2D9', whiteSpace: 'nowrap', borderRight: '1px solid #E0E4E9' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TRIGGER_ROWS.map((row, i) => (
                  <tr
                    key={i}
                    onClick={() => setSelectedRow(selectedRow === i ? null : i)}
                    style={{ background: selectedRow === i ? '#EEF5FB' : 'transparent', borderBottom: '1px solid #E0E4E9', cursor: 'pointer' }}
                    onMouseEnter={(e) => { if (selectedRow !== i) e.currentTarget.style.background = '#F7F8FA' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = selectedRow === i ? '#EEF5FB' : 'transparent' }}
                  >
                    <td style={{ padding: '7px 10px', borderRight: '1px solid #E0E4E9' }}>
                      <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#F1F3F6', color: '#515760' }}>{row.status}</span>
                    </td>
                    <td style={{ padding: '7px 10px', borderRight: '1px solid #E0E4E9', fontSize: 10, fontFamily: '"JetBrains Mono", monospace', color: '#747A82' }}>{row.time || '—'}</td>
                    <td style={{ padding: '7px 10px', borderRight: '1px solid #E0E4E9', textAlign: 'center', fontWeight: 600, color: selectedRow === i ? '#004B8D' : '#171A1E', fontFamily: '"Inter Tight", sans-serif' }}>{row.seq}</td>
                    <td style={{ padding: '7px 10px', borderRight: '1px solid #E0E4E9', fontWeight: 500, color: '#171A1E', whiteSpace: 'nowrap' }}>{row.desc}</td>
                    <td style={{ padding: '7px 10px', borderRight: '1px solid #E0E4E9', fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: '#004B8D', maxWidth: 200, wordBreak: 'break-word' }}>{row.judge}</td>
                    <td style={{ padding: '7px 10px', borderRight: '1px solid #E0E4E9', color: '#747A82' }}>{row.autoDetect}</td>
                    <td style={{ padding: '7px 10px', borderRight: '1px solid #E0E4E9', color: '#515760', fontFamily: '"Inter Tight", sans-serif', textAlign: 'center' }}>{row.delay || '—'}</td>
                    <td style={{ padding: '7px 10px', borderRight: '1px solid #E0E4E9', color: '#747A82' }}>{row.changeRate || '—'}</td>
                    <td style={{ padding: '7px 10px', borderRight: '1px solid #E0E4E9', color: '#747A82' }}>{row.rateMonitor || '—'}</td>
                    <td style={{ padding: '7px 10px', borderRight: '1px solid #E0E4E9', color: '#747A82' }}>{row.allowChange || '—'}</td>
                    <td style={{ padding: '7px 10px', borderRight: '1px solid #E0E4E9', color: '#747A82' }}>{row.rateWeight || '—'}</td>
                    <td style={{ padding: '7px 10px', color: '#747A82' }}>{row.rateDir || '—'}</td>
                  </tr>
                ))}
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`empty-${i}`} style={{ borderBottom: '1px solid #E0E4E9', height: 36 }}>
                    {Array.from({ length: 12 }).map((_, j) => (
                      <td key={j} style={{ borderRight: '1px solid #E0E4E9' }} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'card' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#F1F3F6', position: 'sticky', top: 0, zIndex: 1 }}>
                {['序号', '分组', '工艺参数说明', '扣分系列', '扣分限', '高高限', '高限', '低限', '低低限', '工艺参数对象', '开始表征', '终止表征判定'].map((h) => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#515760', fontWeight: 600, fontSize: 11, borderBottom: '1px solid #CDD2D9', whiteSpace: 'nowrap', borderRight: '1px solid #E0E4E9' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PROCESS_CARD_ROWS.map((row, i) => (
                <tr
                  key={i}
                  onClick={() => setSelectedRow(selectedRow === i ? null : i)}
                  style={{ background: selectedRow === i ? '#EEF5FB' : 'transparent', borderBottom: '1px solid #E0E4E9', cursor: 'pointer' }}
                  onMouseEnter={(e) => { if (selectedRow !== i) e.currentTarget.style.background = '#F7F8FA' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = selectedRow === i ? '#EEF5FB' : 'transparent' }}
                >
                  <td style={{ padding: '7px 10px', borderRight: '1px solid #E0E4E9', textAlign: 'center', fontWeight: 600, color: selectedRow === i ? '#004B8D' : '#171A1E', fontFamily: '"Inter Tight", sans-serif' }}>{row.seq}</td>
                  <td style={{ padding: '7px 10px', borderRight: '1px solid #E0E4E9', whiteSpace: 'nowrap' }}>
                    <select
                      value={row.group}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => {}}
                      style={{ fontSize: 12, border: '1px solid #CDD2D9', borderRadius: 4, padding: '2px 6px', background: '#fff', color: '#171A1E', cursor: 'pointer' }}
                    >
                      {Array.from(new Set(SHARED_PROC_ROWS.filter(r => r.type === '组标题').map(r => r.content))).map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '7px 10px', borderRight: '1px solid #E0E4E9', fontWeight: 500, color: '#171A1E', whiteSpace: 'nowrap' }}>{row.paramDesc}</td>
                  <td style={{ padding: '7px 10px', borderRight: '1px solid #E0E4E9', textAlign: 'center', color: '#515760', fontFamily: '"Inter Tight", sans-serif' }}>{row.series}</td>
                  <td style={{ padding: '7px 10px', borderRight: '1px solid #E0E4E9', textAlign: 'center', color: '#515760', fontFamily: '"Inter Tight", sans-serif' }}>{row.deductLimit}</td>
                  <td style={{ padding: '7px 10px', borderRight: '1px solid #E0E4E9', textAlign: 'center', color: '#D93838', fontFamily: '"Inter Tight", sans-serif', fontWeight: 500 }}>{row.highHigh}</td>
                  <td style={{ padding: '7px 10px', borderRight: '1px solid #E0E4E9', textAlign: 'center', color: '#F28C28', fontFamily: '"Inter Tight", sans-serif' }}>{row.high}</td>
                  <td style={{ padding: '7px 10px', borderRight: '1px solid #E0E4E9', textAlign: 'center', color: '#F2B544', fontFamily: '"Inter Tight", sans-serif' }}>{row.low}</td>
                  <td style={{ padding: '7px 10px', borderRight: '1px solid #E0E4E9', textAlign: 'center', color: '#004B8D', fontFamily: '"Inter Tight", sans-serif' }}>{row.lowLow}</td>
                  <td style={{ padding: '7px 10px', borderRight: '1px solid #E0E4E9', fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: '#004B8D' }}>{row.paramObj}</td>
                  <td style={{ padding: '7px 10px', borderRight: '1px solid #E0E4E9', color: '#747A82', fontFamily: '"JetBrains Mono", monospace', fontSize: 10 }}>{row.startSym}</td>
                  <td style={{ padding: '7px 10px', fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: '#004B8D' }}>{row.endJudge}</td>
                </tr>
              ))}
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={`empty-${i}`} style={{ borderBottom: '1px solid #E0E4E9', height: 36 }}>
                  {Array.from({ length: 12 }).map((_, j) => (
                    <td key={j} style={{ borderRight: '1px solid #E0E4E9' }} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ─── Operation Records Data ───────────────────────────────────────────────────

interface OpStep {
  seq: number; content: string; time: string
  location?: '现场' | '中控'; type: '操作' | '提示信息'; groupTitle: string; operator?: string
}
interface OpRecord {
  id: string; plan: string; section: string; operator: string; date: string; endTime: string
  duration: number; avgDuration: number; totalSteps: number; doneSteps: number
  phase: 'pending-action' | 'pending-reset' | 'completed' | 'manually-ended'
  triggerMode: 'auto' | 'manual'
  steps: OpStep[]
}

const BASE_STEPS: OpStep[] = [
  { seq: 2,  content: '打开 LV021411 前后手阀',                                              time: '09:45', location: '现场', type: '操作',    groupTitle: '烘炉',   operator: '张工' },
  { seq: 3,  content: '打开 LV021411 给 V021410 建立液位，V021410 液位到 60% 后投自动',       time: '09:52', location: '中控', type: '操作',    groupTitle: '烘炉',   operator: '李班长' },
  { seq: 4,  content: '降低压水泵至澄清槽手阀 704105V03',                                    time: '10:01', location: '现场', type: '操作',    groupTitle: '烘炉',   operator: '张工' },
  { seq: 5,  content: '打开 P021403A/B 进口阀',                                              time: '10:08', location: '现场', type: '操作',    groupTitle: '烘炉',   operator: '王操' },
  { seq: 6,  content: '启动 P021403A/B',                                                     time: '10:12', location: '中控', type: '操作',    groupTitle: '烘炉',   operator: '李班长' },
  { seq: 7,  content: '打开 P021403A/B 出口阀给澄清槽建立液位',                              time: '10:18', location: '现场', type: '操作',    groupTitle: '烘炉',   operator: '王操' },
  { seq: 8,  content: '启动螺旋机 A021401',                                                  time: '10:25', location: '中控', type: '操作',    groupTitle: '烘炉',   operator: '李班长' },
  { seq: 9,  content: '将气化炉预热水管板侧"通"',                                            time: '10:33', location: '现场', type: '操作',    groupTitle: '烘炉',   operator: '张工' },
  { seq: 10, content: '打开 FV021342 前后手阀',                                              time: '10:39', location: '现场', type: '操作',    groupTitle: '烘炉',   operator: '王操' },
  { seq: 11, content: '打开米 FV021342 后总阀 703107AV01',                                   time: '10:47', location: '现场', type: '操作',    groupTitle: '预热升温', operator: '张工' },
  { seq: 12, content: '打开 FV021310 前后手阀',                                              time: '10:52', location: '现场', type: '操作',    groupTitle: '预热升温', operator: '王操' },
  { seq: 13, content: '将气化炉至水封管板侧"通"',                                            time: '10:58', location: '现场', type: '操作',    groupTitle: '预热升温', operator: '张工' },
  { seq: 14, content: '打开气化炉至水封槽手阀',                                              time: '11:04', location: '现场', type: '操作',    groupTitle: '预热升温', operator: '王操' },
  { seq: 15, content: '打开 FV1310、FV1342、XV1359 调节预热水流量大于 100 m³/h',             time: '11:10', location: '中控', type: '操作',    groupTitle: '预热升温', operator: '李班长' },
  { seq: 16, content: '关闭渣池泵至真空手阀 703110AV03',                                     time: '11:19', location: '现场', type: '操作',    groupTitle: '预热升温', operator: '张工' },
  { seq: 17, content: '打开渣池泵至澄清槽手阀 703110AV02',                                   time: '11:25', location: '现场', type: '操作',    groupTitle: '水循环建立', operator: '王操' },
  { seq: 18, content: '打开 LV021312 前后手阀',                                              time: '11:30', location: '现场', type: '操作',    groupTitle: '水循环建立', operator: '张工' },
  { seq: 19, content: '渣池有液位后启动搅拌机 A021302',                                      time: '11:36', location: '中控', type: '提示信息', groupTitle: '水循环建立', operator: '李班长' },
  { seq: 20, content: '打开 P021304 1/2 进口阀',                                             time: '11:42', location: '现场', type: '操作',    groupTitle: '水循环建立', operator: '王操' },
  { seq: 21, content: '启动 P021304 1/2',                                                    time: '11:48', location: '中控', type: '操作',    groupTitle: '水循环建立', operator: '李班长' },
]

const OP_RECORDS: OpRecord[] = [
  { id: 'r1', plan: '01 气化冷态开车',       section: '气化装置', operator: '张工', date: '2026-08-14 09:32', endTime: '2026-08-14 11:55', duration: 143, avgDuration: 155, totalSteps: 21, doneSteps: 21, phase: 'completed',       triggerMode: 'manual', steps: BASE_STEPS },
  { id: 'r2', plan: '08 烧嘴压差波动',       section: '气化装置', operator: '王工', date: '2026-08-14 14:32', endTime: '2026-08-14 14:55', duration: 23,  avgDuration: 20,  totalSteps: 12, doneSteps: 12, phase: 'pending-reset',   triggerMode: 'auto',   steps: BASE_STEPS.slice(0,12).map((s,i) => ({...s, time:`14:${String(32+i).padStart(2,'0')}`})) },
  { id: 'r3', plan: '06 紧急停车',           section: '气化装置', operator: '赵工', date: '2026-08-13 16:20', endTime: '2026-08-13 16:32', duration: 12,  avgDuration: 15,  totalSteps: 8,  doneSteps: 8,  phase: 'manually-ended',  triggerMode: 'auto',   steps: BASE_STEPS.slice(0,8).map((s,i)  => ({...s, time:`16:${String(20+i).padStart(2,'0')}`})) },
  { id: 'r4', plan: '07 反应器床层温度高',   section: '甲醇装置', operator: '李工', date: '2026-08-12 09:15', endTime: '—',                duration: 45,  avgDuration: 30,  totalSteps: 15, doneSteps: 13, phase: 'pending-action',  triggerMode: 'auto',   steps: BASE_STEPS.slice(0,13).map((s,i) => ({...s, time:`09:${String(15+i).padStart(2,'0')}`})) },
  { id: 'r5', plan: '05 停电应急',           section: '气化装置', operator: '张工', date: '2026-08-10 22:50', endTime: '2026-08-10 23:08', duration: 18,  avgDuration: 20,  totalSteps: 10, doneSteps: 10, phase: 'completed',       triggerMode: 'manual', steps: BASE_STEPS.slice(0,10).map((s,i) => ({...s, time:`22:${String(50+i).padStart(2,'0')}`})) },
  { id: 'r6', plan: '09 汽包干烧紧急预案',   section: '甲醇装置', operator: '陈工', date: '2026-08-07 19:45', endTime: '2026-08-07 20:07', duration: 22,  avgDuration: 20,  totalSteps: 11, doneSteps: 11, phase: 'pending-reset',   triggerMode: 'auto',   steps: BASE_STEPS.slice(0,11).map((s,i) => ({...s, time:`19:${String(45+i).padStart(2,'0')}`})) },
  { id: 'r7', plan: '10 空分跳车应急',       section: '气化装置', operator: '王工', date: '2026-08-05 08:30', endTime: '2026-08-05 08:48', duration: 18,  avgDuration: 25,  totalSteps: 15, doneSteps: 15, phase: 'completed',       triggerMode: 'manual', steps: BASE_STEPS.slice(0,15).map((s,i) => ({...s, time:`08:${String(30+i).padStart(2,'0')}`})) },
]

// ─── Shared UI: SceneSidebar ──────────────────────────────────────────────────

interface NavItem { key: string; label: string; sub: string; icon: React.ReactNode }

function SceneSidebar({ nav, page, onPage, roleLabel }: { nav: NavItem[]; page: string; onPage: (p: string) => void; roleLabel: string }) {
  return (
    <div style={{ width: 210, background: '#001D38', display: 'flex', flexDirection: 'column', flexShrink: 0, borderRight: '1px solid rgba(0,75,141,0.25)' }}>
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.08em', fontWeight: 600, textTransform: 'uppercase' }}>{roleLabel}</div>
      </div>
      <div style={{ flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {nav.map((n) => {
          const active = page === n.key
          return (
            <button key={n.key} onClick={() => onPage(n.key)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: 'none', borderRadius: 8, cursor: 'pointer', textAlign: 'left', width: '100%', background: active ? 'rgba(0,75,141,0.65)' : 'transparent', borderLeft: `3px solid ${active ? '#82B9DD' : 'transparent'}`, color: active ? '#fff' : 'rgba(255,255,255,0.52)', transition: 'all 120ms ease' }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{ flexShrink: 0, opacity: active ? 1 : 0.65 }}>{n.icon}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: active ? 600 : 400, lineHeight: 1.25 }}>{n.label}</div>
                <div style={{ fontSize: 10, opacity: 0.45, lineHeight: 1, marginTop: 2 }}>{n.sub}</div>
              </div>
            </button>
          )
        })}
      </div>
      <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 10, color: 'rgba(255,255,255,0.18)' }}>2026-08-14</div>
    </div>
  )
}

// ─── Shared UI: OperationRecordsPage ─────────────────────────────────────────

const WrenchIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#F28C28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
)

// ── Operation Records: Detail sub-view ───────────────────────────────────────

// ── Process card trend data (mock time-series per parameter) ─────────────────

function generateTrend(seed: number, points: number, base: number, amplitude: number): number[] {
  const vals: number[] = []
  let v = base
  for (let i = 0; i < points; i++) {
    const noise = Math.sin(i * 0.7 + seed) * amplitude * 0.6 + Math.cos(i * 1.3 + seed * 2) * amplitude * 0.4
    v = Math.max(0, Math.min(100, v + noise + (Math.random() - 0.5) * amplitude * 0.3))
    vals.push(Math.round(v * 10) / 10)
  }
  return vals
}

const PROC_CARD_TREND_POINTS = 24

const PROC_CARD_TRENDS: Record<string, { param: typeof PROCESS_CARD_ROWS[0]; values: number[] }[]> = (() => {
  const groups: Record<string, { param: typeof PROCESS_CARD_ROWS[0]; values: number[] }[]> = {}
  PROCESS_CARD_ROWS.forEach((row, i) => {
    if (!groups[row.group]) groups[row.group] = []
    const base = (row.high + row.low) / 2
    const amp = (row.high - row.low) * 0.18
    groups[row.group].push({ param: row, values: generateTrend(i * 7 + 3, PROC_CARD_TREND_POINTS, base, amp) })
  })
  return groups
})()

function ParamTrendChart({ values, high, highHigh, low, lowLow, color }: { values: number[]; high: number; highHigh: number; low: number; lowLow: number; color: string }) {
  const W = 260, H = 72, PAD = 4
  const min = Math.min(lowLow - 5, ...values)
  const max = Math.max(highHigh + 5, ...values)
  const range = max - min || 1
  const toY = (v: number) => PAD + (H - PAD * 2) * (1 - (v - min) / range)
  const toX = (i: number) => (i / (values.length - 1)) * W

  const pts = values.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ')
  const areaPath = `M${toX(0)},${H} ` + values.map((v, i) => `L${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ') + ` L${W},${H} Z`

  const limitLine = (v: number, clr: string, dash?: string) => (
    <line x1={0} y1={toY(v)} x2={W} y2={toY(v)} stroke={clr} strokeWidth={1} strokeDasharray={dash ?? '4 3'} opacity={0.7} />
  )

  const lastVal = values[values.length - 1]
  const alarm = lastVal >= highHigh || lastVal <= lowLow
  const warn  = !alarm && (lastVal >= high || lastVal <= low)

  return (
    <div style={{ position: 'relative' }}>
      <svg width={W} height={H} style={{ display: 'block', overflow: 'visible' }}>
        {/* limit lines */}
        {limitLine(highHigh, '#D93838')}
        {limitLine(high, '#F28C28')}
        {limitLine(low, '#F28C28')}
        {limitLine(lowLow, '#D93838')}
        {/* area fill */}
        <path d={areaPath} fill={color} opacity={0.08} />
        {/* line */}
        <polyline points={pts} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
        {/* last point dot */}
        <circle cx={toX(values.length - 1)} cy={toY(lastVal)} r={3} fill={alarm ? '#D93838' : warn ? '#F28C28' : color} stroke="#fff" strokeWidth={1.5} />
      </svg>
      {/* y-axis labels */}
      <div style={{ position: 'absolute', right: -32, top: 0, height: H, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: 9, color: '#9FA6AF', fontFamily: '"Inter Tight", sans-serif', fontVariantNumeric: 'tabular-nums', pointerEvents: 'none' }}>
        <span>{max.toFixed(0)}</span>
        <span>{min.toFixed(0)}</span>
      </div>
    </div>
  )
}

function OpRecordDetail({ record, onBack, onFeedback, hasFeedback, onViewFeedback, role }: { record: OpRecord; onBack: () => void; onFeedback?: (() => void) | undefined; hasFeedback?: boolean; onViewFeedback?: () => void; role?: 'engineer' | 'supervisor' }) {
  const stepGroups = useMemo(() => {
    const map = new Map<string, OpStep[]>()
    for (const s of record.steps) {
      if (!map.has(s.groupTitle)) map.set(s.groupTitle, [])
      map.get(s.groupTitle)!.push(s)
    }
    return Array.from(map.entries())
  }, [record])

  const rate = Math.round((record.doneSteps / record.totalSteps) * 100)
  const diff = record.duration - record.avgDuration
  const faster = diff < 0
  const analysisText = faster
    ? `本次执行比历史平均快 ${Math.abs(diff)} 分钟，步骤完成率 ${rate}%，执行效率${rate === 100 ? '优秀' : '良好'}。建议将本次操作作为参考基准。`
    : diff === 0
      ? `本次执行与历史平均耗时持平，步骤完成率 ${rate}%。`
      : `本次执行超过历史平均 ${diff} 分钟，步骤完成率 ${rate}%。建议复盘超时原因，优化操作流程。`

  // Zoomed chart state: { groupName, paramIdx }
  const [zoomedChart, setZoomedChart] = useState<{ groupName: string; paramIdx: number } | null>(null)

  const zoomedEntry = zoomedChart
    ? (() => {
        const params = PROC_CARD_TRENDS[zoomedChart.groupName]
        return params ? params[zoomedChart.paramIdx] : null
      })()
    : null

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#E9EDF2', position: 'relative' }}>
      {/* Top bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E0E4E9', padding: '12px 20px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', border: '1px solid #CDD2D9', borderRadius: 6, background: '#fff', cursor: 'pointer', color: '#515760', fontSize: 12, fontWeight: 500 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          返回列表
        </button>
        <div style={{ width: 1, height: 20, background: '#E0E4E9' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#171A1E', lineHeight: 1.2 }}>{record.plan}</div>
          <div style={{ fontSize: 11, color: '#747A82', marginTop: 2, fontFamily: '"JetBrains Mono", monospace' }}>
            {record.date} · 执行人：{record.operator} · {record.section}
          </div>
        </div>
        {role === 'engineer' ? (
          <button
            onClick={onViewFeedback}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', border: '1px solid #CDD2D9', borderRadius: 6, background: '#fff', cursor: 'pointer', color: '#515760', fontSize: 12, transition: 'all 100ms' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#82B9DD'; e.currentTarget.style.color = '#004B8D' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#CDD2D9'; e.currentTarget.style.color = '#515760' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            查看反馈{FEEDBACK_DATA[record.id] ? ` (${FEEDBACK_DATA[record.id].length})` : ''}
          </button>
        ) : (
          <button
            onClick={onFeedback}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', border: `1px solid ${hasFeedback ? 'rgba(57,197,35,0.4)' : '#CDD2D9'}`, borderRadius: 6, background: hasFeedback ? '#EFF9EC' : '#fff', cursor: 'pointer', color: hasFeedback ? '#237D17' : '#515760', fontSize: 12, transition: 'all 100ms' }}
            onMouseEnter={(e) => { if (!hasFeedback) { e.currentTarget.style.borderColor = '#82B9DD'; e.currentTarget.style.color = '#004B8D' } }}
            onMouseLeave={(e) => { if (!hasFeedback) { e.currentTarget.style.borderColor = '#CDD2D9'; e.currentTarget.style.color = '#515760' } }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
            {hasFeedback ? '查看/修改反馈' : '填写反馈'}
          </button>
        )}
        <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', border: '1px solid #CDD2D9', borderRadius: 6, background: '#fff', cursor: 'pointer', color: '#515760', fontSize: 12 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          导出记录
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* KPI row */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: '本次用时',   value: `${record.duration}`,    unit: 'min', accent: diff > 0 ? '#F28C28' : '#237D17' },
            { label: '历史平均',   value: `${record.avgDuration}`, unit: 'min', accent: '#515760' },
            { label: faster ? '节省时长' : '超时时长', value: `${Math.abs(diff)}`, unit: 'min', accent: faster ? '#237D17' : '#F28C28' },
            { label: '步骤完成率', value: `${rate}`,               unit: '%',   accent: rate === 100 ? '#237D17' : '#F2B544' },
          ].map((k) => (
            <div key={k.label} style={{ background: '#fff', border: '1px solid #E0E4E9', borderRadius: 10, padding: '14px 20px', textAlign: 'center', minWidth: 110, boxShadow: '0 2px 8px rgba(27,39,52,0.05)' }}>
              <div style={{ fontSize: 10, color: '#747A82', marginBottom: 6, fontWeight: 500 }}>{k.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: k.accent, fontFamily: '"Inter Tight", sans-serif', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: 10, color: '#9FA6AF', marginTop: 4 }}>{k.unit}</div>
            </div>
          ))}
          <div style={{ flex: 1, minWidth: 160, background: '#fff', border: '1px solid #E0E4E9', borderRadius: 10, padding: '14px 20px', boxShadow: '0 2px 8px rgba(27,39,52,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: '#747A82', fontWeight: 500 }}>执行进度</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#237D17', fontFamily: '"Inter Tight", sans-serif' }}>{record.doneSteps}/{record.totalSteps} 步</span>
            </div>
            <div style={{ height: 6, background: '#E9EDF2', borderRadius: 999 }}>
              <div style={{ width: `${rate}%`, height: '100%', background: rate === 100 ? '#39C523' : '#F2B544', borderRadius: 999, transition: 'width 400ms ease' }} />
            </div>
            <div style={{ fontSize: 10, color: '#9FA6AF' }}>{rate === 100 ? '全部完成' : `${record.totalSteps - record.doneSteps} 步未完成`}</div>
          </div>
        </div>

        {/* Analysis banner */}
        <div style={{ background: faster ? '#EFF9EC' : diff > 0 ? '#FEF3E8' : '#EEF5FB', border: `1px solid ${faster ? 'rgba(57,197,35,0.25)' : diff > 0 ? 'rgba(242,140,40,0.25)' : 'rgba(0,75,141,0.15)'}`, borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={faster ? '#237D17' : diff > 0 ? '#7A4000' : '#004B8D'} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          <span style={{ fontSize: 13, color: faster ? '#237D17' : diff > 0 ? '#7A4000' : '#1A2D45', lineHeight: 1.7 }}>{analysisText}</span>
        </div>

        {/* ── Left / Right split: 工艺卡片 + 操作步序 ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 14, alignItems: 'start' }}>

          {/* LEFT: 工艺卡片参数趋势 */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid rgba(96,108,122,0.12)', boxShadow: '0 4px 16px rgba(27,39,52,0.06)', overflow: 'hidden' }}>
            <div style={{ padding: '11px 16px', borderBottom: '1px solid #E0E4E9', display: 'flex', alignItems: 'center', gap: 8, background: '#F9FAFB' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#004B8D" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#171A1E' }}>工艺卡片参数趋势</span>
              <span style={{ fontSize: 11, color: '#9FA6AF', marginLeft: 4 }}>执行期间实时监测，按组展示</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
                {[['#D93838', '高高/低低限'], ['#F28C28', '高/低限']].map(([c, l]) => (
                  <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#9FA6AF' }}>
                    <svg width="16" height="6"><line x1="0" y1="3" x2="16" y2="3" stroke={c} strokeWidth="1.5" strokeDasharray="4 2" /></svg>
                    {l}
                  </span>
                ))}
              </div>
            </div>

            {Object.entries(PROC_CARD_TRENDS).map(([groupName, params], gi) => (
              <div key={groupName}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 16px', background: 'linear-gradient(90deg,#EEF5FB,#F5F9FE 60%,#F9FAFB)', borderBottom: '1px solid #CDD2D9', borderLeft: '3px solid #004B8D', borderTop: gi > 0 ? '2px solid #E0E4E9' : 'none' }}>
                  <div style={{ width: 18, height: 18, borderRadius: 4, background: '#004B8D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', fontFamily: '"Inter Tight", sans-serif', flexShrink: 0 }}>{gi + 1}</div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1A2D45' }}>{groupName}</span>
                  <span style={{ fontSize: 10, color: '#5A7899', background: '#D8E8F5', padding: '1px 7px', borderRadius: 999, fontFamily: '"Inter Tight", sans-serif', fontWeight: 500 }}>{params.length} 个参数</span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', padding: '14px 16px 10px', gap: 12 }}>
                  {params.map(({ param, values }, paramIdx) => {
                    const lastVal = values[values.length - 1]
                    const alarm = lastVal >= param.highHigh || lastVal <= param.lowLow
                    const warn  = !alarm && (lastVal >= param.high || lastVal <= param.low)
                    const statusColor = alarm ? '#D93838' : warn ? '#F28C28' : '#237D17'
                    const statusLabel = alarm ? '越限' : warn ? '预警' : '正常'
                    const trendColor = alarm ? '#D93838' : warn ? '#F28C28' : '#004B8D'

                    return (
                      <div key={param.seq} style={{ border: `1px solid ${alarm ? 'rgba(217,56,56,0.25)' : warn ? 'rgba(242,140,40,0.2)' : 'rgba(0,75,141,0.12)'}`, borderRadius: 10, padding: '12px 14px 10px', background: alarm ? '#FFF5F5' : warn ? '#FFFBF0' : '#F9FBFE', flex: '1 1 260px', minWidth: 260, position: 'relative' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#1A2D45' }}>{param.paramDesc}</div>
                            <div style={{ fontSize: 10, color: '#9FA6AF', marginTop: 2, fontFamily: '"JetBrains Mono", monospace' }}>{param.paramObj}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 18, fontWeight: 800, color: trendColor, fontFamily: '"Inter Tight", sans-serif', lineHeight: 1 }}>{lastVal.toFixed(1)}</div>
                            <span style={{ fontSize: 10, fontWeight: 600, color: statusColor, background: `${statusColor}18`, padding: '1px 6px', borderRadius: 999, display: 'inline-block', marginTop: 3 }}>{statusLabel}</span>
                          </div>
                        </div>

                        <div style={{ paddingRight: 36 }}>
                          <ParamTrendChart values={values} high={param.high} highHigh={param.highHigh} low={param.low} lowLow={param.lowLow} color={trendColor} />
                        </div>

                        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                          {[
                            { label: `HH ${param.highHigh}`, color: '#D93838' },
                            { label: `H ${param.high}`,       color: '#F28C28' },
                            { label: `L ${param.low}`,        color: '#F28C28' },
                            { label: `LL ${param.lowLow}`,    color: '#D93838' },
                          ].map(({ label, color }) => (
                            <span key={label} style={{ fontSize: 9, color, fontFamily: '"Inter Tight", sans-serif', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                              <span style={{ width: 10, height: 1.5, background: color, display: 'inline-block', borderRadius: 1 }} />{label}
                            </span>
                          ))}
                          <span style={{ marginLeft: 'auto', fontSize: 9, color: '#9FA6AF', fontFamily: '"Inter Tight", sans-serif' }}>扣分系数 {param.deductLimit}%</span>
                        </div>

                        {/* Zoom button — bottom right corner */}
                        <button
                          onClick={() => setZoomedChart({ groupName, paramIdx })}
                          title="放大趋势图"
                          style={{
                            position: 'absolute',
                            bottom: 8,
                            right: 8,
                            width: 22,
                            height: 22,
                            border: `1px solid ${alarm ? 'rgba(217,56,56,0.3)' : 'rgba(0,75,141,0.2)'}`,
                            borderRadius: 5,
                            background: alarm ? 'rgba(255,245,245,0.9)' : 'rgba(238,245,251,0.9)',
                            color: trendColor,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 120ms ease',
                            backdropFilter: 'blur(2px)',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = trendColor; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = trendColor }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = alarm ? 'rgba(255,245,245,0.9)' : 'rgba(238,245,251,0.9)'; e.currentTarget.style.color = trendColor; e.currentTarget.style.borderColor = alarm ? 'rgba(217,56,56,0.3)' : 'rgba(0,75,141,0.2)' }}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                          </svg>
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT: 操作步序 */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid rgba(96,108,122,0.12)', boxShadow: '0 4px 16px rgba(27,39,52,0.06)', overflow: 'hidden', position: 'sticky', top: 0 }}>
            <div style={{ padding: '11px 14px', borderBottom: '1px solid #E0E4E9', display: 'flex', alignItems: 'center', gap: 8, background: '#F9FAFB' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#004B8D" strokeWidth="2" strokeLinecap="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#171A1E' }}>操作步序记录</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9FA6AF', fontFamily: '"Inter Tight", sans-serif' }}>{record.doneSteps} / {record.totalSteps} 步</span>
            </div>
            {/* Column headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '36px 44px 1fr 48px 24px', padding: '0 10px', height: 32, alignItems: 'center', background: '#F1F3F6', borderBottom: '1px solid #E0E4E9', fontSize: 10, color: '#747A82', fontWeight: 600, gap: 4 }}>
              <span>步序</span><span>时刻</span><span>操作内容</span><span>操作人</span><span />
            </div>
            {stepGroups.map(([groupTitle, gSteps], gi) => (
              <div key={gi}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'linear-gradient(90deg,#EEF5FB,#F5F9FE 60%,#F9FAFB)', borderBottom: '1px solid #CDD2D9', borderLeft: '3px solid #004B8D', borderTop: gi > 0 ? '2px solid #E0E4E9' : 'none' }}>
                  <div style={{ width: 16, height: 16, borderRadius: 4, background: '#004B8D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', fontFamily: '"Inter Tight", sans-serif', flexShrink: 0 }}>{gi + 1}</div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#1A2D45', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{groupTitle}</span>
                  <span style={{ fontSize: 9, color: '#5A7899', background: '#D8E8F5', padding: '1px 6px', borderRadius: 999, flexShrink: 0 }}>{gSteps.length} 步</span>
                </div>
                {gSteps.map((step) => (
                  <div key={step.seq} style={{ display: 'grid', gridTemplateColumns: '36px 44px 1fr 48px 24px', padding: '7px 10px', borderBottom: '1px solid #E9EDF2', alignItems: 'center', gap: 4, background: '#F7FCF5', borderLeft: '3px solid #39C523' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#9FA6AF', fontFamily: '"Inter Tight", sans-serif', textAlign: 'center' }}>{step.seq}</span>
                    <span style={{ fontSize: 9, color: '#747A82', fontFamily: '"JetBrains Mono", monospace', letterSpacing: '-0.02em' }}>{step.time}</span>
                    <span style={{ fontSize: 11, color: step.type === '提示信息' ? '#8B6200' : '#515760', lineHeight: 1.4, display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                      {step.location === '现场' && <WrenchIcon />}
                      <span>{step.content}</span>
                    </span>
                    <span style={{ fontSize: 10, color: '#515760', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{step.operator ?? '—'}</span>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <div style={{ width: 18, height: 18, borderRadius: 5, border: '1.5px solid rgba(57,197,35,0.35)', background: '#EFF9EC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#39C523' }}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Zoom modal ── */}
      {zoomedChart && zoomedEntry && (() => {
        const { param, values } = zoomedEntry
        const lastVal = values[values.length - 1]
        const alarm = lastVal >= param.highHigh || lastVal <= param.lowLow
        const warn  = !alarm && (lastVal >= param.high || lastVal <= param.low)
        const statusColor = alarm ? '#D93838' : warn ? '#F28C28' : '#237D17'
        const statusLabel = alarm ? '越限' : warn ? '预警' : '正常'
        const trendColor = alarm ? '#D93838' : warn ? '#F28C28' : '#004B8D'

        const W = 560, H = 180, PAD = 6
        const min = Math.min(param.lowLow - 5, ...values)
        const max = Math.max(param.highHigh + 5, ...values)
        const range = max - min || 1
        const toY = (v: number) => PAD + (H - PAD * 2) * (1 - (v - min) / range)
        const toX = (i: number) => (i / (values.length - 1)) * W
        const pts = values.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ')
        const areaPath = `M${toX(0)},${H} ` + values.map((v, i) => `L${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ') + ` L${W},${H} Z`
        const limitLine = (v: number, clr: string) => <line key={v} x1={0} y1={toY(v)} x2={W} y2={toY(v)} stroke={clr} strokeWidth={1.2} strokeDasharray="5 3" opacity={0.75} />

        return (
          <div style={{ position: 'absolute', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(23,26,30,0.5)' }}
            onClick={() => setZoomedChart(null)}>
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 24px 64px rgba(20,34,48,0.28)', width: 680, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
              onClick={(e) => e.stopPropagation()}>
              {/* Modal header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E0E4E9', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1A2D45' }}>{param.paramDesc}</div>
                  <div style={{ fontSize: 11, color: '#9FA6AF', marginTop: 2, fontFamily: '"JetBrains Mono", monospace' }}>{param.paramObj}</div>
                </div>
                <div style={{ textAlign: 'right', marginRight: 10 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: trendColor, fontFamily: '"Inter Tight", sans-serif', lineHeight: 1 }}>{lastVal.toFixed(1)}</div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: statusColor, background: `${statusColor}18`, padding: '2px 8px', borderRadius: 999, display: 'inline-block', marginTop: 4 }}>{statusLabel}</span>
                </div>
                <button onClick={() => setZoomedChart(null)} style={{ width: 30, height: 30, border: '1px solid #E0E4E9', borderRadius: 8, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#747A82', flexShrink: 0 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
              {/* Enlarged chart */}
              <div style={{ padding: '20px 28px 16px', background: alarm ? '#FFF5F5' : warn ? '#FFFBF0' : '#F9FBFE' }}>
                <div style={{ position: 'relative', paddingRight: 44 }}>
                  <svg width={W} height={H} style={{ display: 'block', overflow: 'visible', width: '100%' }} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
                    {limitLine(param.highHigh, '#D93838')}
                    {limitLine(param.high, '#F28C28')}
                    {limitLine(param.low, '#F28C28')}
                    {limitLine(param.lowLow, '#D93838')}
                    <path d={areaPath} fill={trendColor} opacity={0.07} />
                    <polyline points={pts} fill="none" stroke={trendColor} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
                    <circle cx={toX(values.length - 1)} cy={toY(lastVal)} r={4} fill={alarm ? '#D93838' : warn ? '#F28C28' : trendColor} stroke="#fff" strokeWidth={2} />
                  </svg>
                  <div style={{ position: 'absolute', right: 0, top: 0, height: H, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: 10, color: '#9FA6AF', fontFamily: '"Inter Tight", sans-serif', textAlign: 'right' }}>
                    <span>{max.toFixed(0)}</span>
                    <span>{((max + min) / 2).toFixed(0)}</span>
                    <span>{min.toFixed(0)}</span>
                  </div>
                </div>
                {/* Legend row */}
                <div style={{ display: 'flex', gap: 16, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  {[
                    { label: `高高限 ${param.highHigh}`, color: '#D93838' },
                    { label: `高限 ${param.high}`,       color: '#F28C28' },
                    { label: `低限 ${param.low}`,        color: '#F28C28' },
                    { label: `低低限 ${param.lowLow}`,   color: '#D93838' },
                  ].map(({ label, color }) => (
                    <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color, fontFamily: '"Inter Tight", sans-serif', fontWeight: 600 }}>
                      <span style={{ width: 16, height: 2, background: color, display: 'inline-block', borderRadius: 1 }} />{label}
                    </span>
                  ))}
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9FA6AF' }}>扣分系数 {param.deductLimit}% · 数据点 {values.length}</span>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

// ── Operation Records: main list + query page ─────────────────────────────────

function OperationRecordsPage({ onActivate, role = 'supervisor' }: { onActivate?: (plan: string) => void; role?: 'engineer' | 'supervisor' }) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'custom'>('7d')
  const [fromDate, setFromDate] = useState('2026-08-07T00:00')
  const [toDate,   setToDate]   = useState('2026-08-14T23:59')
  const [keyword,  setKeyword]  = useState('')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [resetConfirmId, setResetConfirmId] = useState<string | null>(null)
  const [resetDone, setResetDone] = useState<Set<string>>(new Set())
  const [feedbackTargetId, setFeedbackTargetId] = useState<string | null>(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackDone, setFeedbackDone] = useState<Map<string, string>>(new Map())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [moreMenuId, setMoreMenuId] = useState<string | null>(null)
  const [viewFeedbackId, setViewFeedbackId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const cutoffs = { '7d': '2026-08-07T00:00', '30d': '2026-07-15T00:00', custom: fromDate }
    const caps    = { '7d': '2026-08-15T00:00', '30d': '2026-08-15T00:00', custom: toDate }
    const from = new Date(cutoffs[timeRange])
    const to   = new Date(caps[timeRange])
    const kw   = keyword.trim().toLowerCase()
    return OP_RECORDS.filter((r) => {
      const d = new Date(r.date)
      if (d < from || d > to) return false
      if (kw && !r.plan.toLowerCase().includes(kw) && !r.section.toLowerCase().includes(kw) && !r.operator.toLowerCase().includes(kw)) return false
      return true
    })
  }, [timeRange, fromDate, toDate, keyword])

  const confirmReset = () => {
    if (!resetConfirmId) return
    setResetDone((prev) => { const s = new Set(prev); s.add(resetConfirmId); return s })
    setResetConfirmId(null)
  }

  const toggleSelect = (id: string) => setSelected((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id))
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(filtered.map((r) => r.id)))

  const phaseLabel = (r: OpRecord): { label: string; bg: string; color: string; dot: string } => {
    const effective = resetDone.has(r.id) ? 'completed' : r.phase
    if (effective === 'pending-reset')    return { label: '待复位',   bg: '#FEF9EC', color: '#8B6200', dot: '#F2B544' }
    if (effective === 'pending-action')   return { label: '待处理',   bg: '#FCECEC', color: '#A52727', dot: '#D93838' }
    if (effective === 'manually-ended')   return { label: '手动结束', bg: '#F1F3F6', color: '#515760', dot: '#747A82' }
    return { label: '已完成', bg: '#EFF9EC', color: '#237D17', dot: '#39C523' }
  }

  const canFeedback = (r: OpRecord) => {
    const effective = resetDone.has(r.id) ? 'completed' : r.phase
    return effective === 'completed' || effective === 'manually-ended' || effective === 'pending-reset'
  }

  const resetTarget = resetConfirmId ? OP_RECORDS.find((r) => r.id === resetConfirmId) : null

  // Feedback modal (shared between list and detail view)
  const FeedbackModal = ({ recId, onClose }: { recId: string; onClose: () => void }) => {
    const rec = OP_RECORDS.find((r) => r.id === recId)
    if (!rec) return null
    const existing = feedbackDone.get(recId) ?? ''
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(23,26,30,0.4)' }}
        onClick={onClose}>
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 24px 60px rgba(20,34,48,0.22)', width: 440, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          onClick={(e) => e.stopPropagation()}>
          <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid #E0E4E9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: '#EEF5FB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#004B8D" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#171A1E' }}>填写操作反馈</div>
                <div style={{ fontSize: 11, color: '#9FA6AF', marginTop: 2 }}>{rec.plan} · {rec.date.slice(5)} · {rec.operator}</div>
              </div>
            </div>
          </div>
          <div style={{ padding: '16px 24px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {existing && (
              <div style={{ padding: '10px 14px', background: '#EFF9EC', borderRadius: 8, border: '1px solid rgba(57,197,35,0.2)', fontSize: 12, color: '#237D17', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}><polyline points="20 6 9 17 4 12" /></svg>
                <span>已有反馈：{existing}</span>
              </div>
            )}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#515760', display: 'block', marginBottom: 8 }}>反馈内容 <span style={{ fontWeight: 400, color: '#9FA6AF' }}>（选填）</span></label>
              <textarea
                autoFocus
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="请填写情况说明、异常记录、改进建议或其他备注…"
                rows={5}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #CDD2D9', borderRadius: 8, fontSize: 13, color: '#30353B', resize: 'vertical', outline: 'none', fontFamily: '"Noto Sans SC", "Microsoft YaHei", sans-serif', lineHeight: 1.65, boxSizing: 'border-box', transition: 'border-color 120ms ease' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#004B8D')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#CDD2D9')}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{ padding: '8px 20px', border: '1px solid #CDD2D9', borderRadius: 7, background: '#fff', color: '#515760', fontSize: 13, cursor: 'pointer' }}>取消</button>
              <button
                onClick={() => {
                  if (feedbackText.trim()) setFeedbackDone((prev) => { const m = new Map(prev); m.set(recId, feedbackText.trim()); return m })
                  setFeedbackText(''); onClose()
                }}
                style={{ padding: '8px 20px', border: 'none', borderRadius: 7, background: '#004B8D', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >提交反馈</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (detailId) {
    const rec = OP_RECORDS.find((r) => r.id === detailId)
    if (rec) return (
      <>
        <OpRecordDetail
          record={rec}
          onBack={() => setDetailId(null)}
          onFeedback={role === 'supervisor' && canFeedback(rec) ? () => { setFeedbackTargetId(rec.id); setFeedbackText(feedbackDone.get(rec.id) ?? '') } : undefined}
          hasFeedback={feedbackDone.has(rec.id)}
          onViewFeedback={() => setViewFeedbackId(rec.id)}
          role={role}
        />
        {feedbackTargetId && <FeedbackModal recId={feedbackTargetId} onClose={() => setFeedbackTargetId(null)} />}
        {viewFeedbackId && <FeedbackViewModal recId={viewFeedbackId} plan={rec.plan} onClose={() => setViewFeedbackId(null)} />}
      </>
    )
  }

  const COL = '28px 1fr 80px 120px 120px 72px 80px 96px 220px'

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#E9EDF2', position: 'relative' }}>

      {feedbackTargetId && <FeedbackModal recId={feedbackTargetId} onClose={() => setFeedbackTargetId(null)} />}
      {viewFeedbackId && <FeedbackViewModal recId={viewFeedbackId} plan={OP_RECORDS.find((r) => r.id === viewFeedbackId)?.plan ?? ''} onClose={() => setViewFeedbackId(null)} />}

      {/* ── Reset confirmation modal ── */}
      {resetConfirmId && resetTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(23,26,30,0.4)' }}
          onClick={() => setResetConfirmId(null)}>
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 24px 60px rgba(20,34,48,0.22)', padding: '28px 32px', width: 380, display: 'flex', flexDirection: 'column', gap: 18 }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FEF9EC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F2B544" strokeWidth="2" strokeLinecap="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" /></svg>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#171A1E', marginBottom: 4 }}>确认复位预案</div>
                <div style={{ fontSize: 13, color: '#515760', lineHeight: 1.6 }}>
                  确认对 <strong>{resetTarget.plan}</strong> 执行手动复位？复位后该预案状态将标记为已完成。
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setResetConfirmId(null)} style={{ padding: '8px 20px', border: '1px solid #CDD2D9', borderRadius: 7, background: '#fff', color: '#515760', fontSize: 13, cursor: 'pointer' }}>取消</button>
              <button onClick={confirmReset} style={{ padding: '8px 20px', border: 'none', borderRadius: 7, background: '#004B8D', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>确认复位</button>
            </div>
          </div>
        </div>
      )}

      {/* Close more menu on outside click */}
      {moreMenuId && <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setMoreMenuId(null)} />}

      {/* ── Toolbar ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E0E4E9', padding: '10px 20px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#171A1E', marginRight: 4, whiteSpace: 'nowrap' }}>操作记录</div>
        <div style={{ width: 1, height: 20, background: '#E0E4E9', flexShrink: 0 }} />
        <div style={{ display: 'flex', gap: 4 }}>
          {([['7d','近 7 天'],['30d','近 30 天'],['custom','自定义']] as const).map(([v, label]) => (
            <button key={v} onClick={() => setTimeRange(v)}
              style={{ padding: '5px 11px', border: '1px solid', borderRadius: 5, fontSize: 11, cursor: 'pointer', fontWeight: timeRange === v ? 600 : 400, background: timeRange === v ? '#004B8D' : '#fff', color: timeRange === v ? '#fff' : '#515760', borderColor: timeRange === v ? '#004B8D' : '#CDD2D9', transition: 'all 100ms ease', whiteSpace: 'nowrap' }}>
              {label}
            </button>
          ))}
        </div>
        {timeRange === 'custom' && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="datetime-local" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
              style={{ padding: '5px 8px', border: '1px solid #CDD2D9', borderRadius: 5, fontSize: 11, outline: 'none', fontFamily: '"JetBrains Mono", monospace', color: '#30353B' }} />
            <span style={{ color: '#9FA6AF', fontSize: 11 }}>—</span>
            <input type="datetime-local" value={toDate} onChange={(e) => setToDate(e.target.value)}
              style={{ padding: '5px 8px', border: '1px solid #CDD2D9', borderRadius: 5, fontSize: 11, outline: 'none', fontFamily: '"JetBrains Mono", monospace', color: '#30353B' }} />
          </div>
        )}
        <div style={{ position: 'relative', flex: '0 0 200px' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9FA6AF" strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜索预案名称、工段"
            style={{ width: '100%', padding: '6px 10px 6px 28px', border: '1px solid #CDD2D9', borderRadius: 6, fontSize: 12, outline: 'none', color: '#30353B', boxSizing: 'border-box' }} />
        </div>
        <div style={{ flex: 1 }} />
        {selected.size > 0 && (
          <span style={{ fontSize: 12, color: '#515760' }}>已选 <strong style={{ color: '#004B8D' }}>{selected.size}</strong> 条</span>
        )}
        <button
          onClick={() => { /* export stub */ }}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', border: '1px solid #CDD2D9', borderRadius: 6, background: '#fff', color: '#515760', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 100ms' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#82B9DD'; e.currentTarget.style.color = '#004B8D' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#CDD2D9'; e.currentTarget.style.color = '#515760' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          {selected.size > 0 ? `导出选中 (${selected.size})` : '批量导出'}
        </button>
      </div>

      {/* ── List ── */}
      <div style={{ flex: 1, overflow: 'auto', padding: '14px 20px' }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid rgba(96,108,122,0.12)', boxShadow: '0 4px 16px rgba(27,39,52,0.06)', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: COL, padding: '0 16px', height: 38, alignItems: 'center', background: '#F1F3F6', borderBottom: '1px solid #E0E4E9', fontSize: 11, color: '#747A82', fontWeight: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div
                onClick={toggleAll}
                style={{ width: 14, height: 14, border: `2px solid ${allSelected ? '#004B8D' : '#CDD2D9'}`, borderRadius: 3, background: allSelected ? '#004B8D' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 100ms' }}
              >
                {allSelected && <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>}
              </div>
            </div>
            <span>预案名称</span>
            <span>触发方式</span>
            <span>发生时间</span>
            <span>结束时间</span>
            <span>操作耗时</span>
            <span>历史均值</span>
            <span>状态</span>
            <span style={{ textAlign: 'right' }}>操作</span>
          </div>

          {filtered.map((r) => {
            const p = phaseLabel(r)
            const effective = resetDone.has(r.id) ? 'completed' : r.phase
            const isChecked = selected.has(r.id)
            const durationColor = r.duration > r.avgDuration ? '#F28C28' : '#237D17'
            const canFb = canFeedback(r)

            return (
              <div key={r.id}
                style={{ display: 'grid', gridTemplateColumns: COL, padding: '0 16px', minHeight: 52, alignItems: 'center', borderBottom: '1px solid #E9EDF2', transition: 'background 80ms', background: isChecked ? '#F5F9FE' : 'transparent' }}
                onMouseEnter={(e) => { if (!isChecked) e.currentTarget.style.background = '#F7F8FA' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = isChecked ? '#F5F9FE' : 'transparent' }}
              >
                {/* Checkbox */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div
                    onClick={() => toggleSelect(r.id)}
                    style={{ width: 14, height: 14, border: `2px solid ${isChecked ? '#004B8D' : '#CDD2D9'}`, borderRadius: 3, background: isChecked ? '#004B8D' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 100ms' }}
                  >
                    {isChecked && <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>}
                  </div>
                </div>

                {/* Plan name */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#171A1E' }}>{r.plan}</div>
                  <div style={{ fontSize: 11, color: '#9FA6AF', marginTop: 2 }}>{r.section} · {r.operator}</div>
                </div>

                {/* Trigger mode */}
                <div>
                  {r.triggerMode === 'auto' ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, background: '#EEF5FB', color: '#004B8D', fontSize: 11, fontWeight: 600, border: '1px solid rgba(0,75,141,0.18)', whiteSpace: 'nowrap' }}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                      自动
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, background: '#F7F8FA', color: '#515760', fontSize: 11, fontWeight: 500, border: '1px solid #E0E4E9', whiteSpace: 'nowrap' }}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
                      手动
                    </span>
                  )}
                </div>

                {/* Dates */}
                <span style={{ fontSize: 11, color: '#515760', fontFamily: '"JetBrains Mono", monospace' }}>{r.date.slice(5)}</span>
                <span style={{ fontSize: 11, color: r.endTime === '—' ? '#CDD2D9' : '#515760', fontFamily: '"JetBrains Mono", monospace' }}>{r.endTime === '—' ? '—' : r.endTime.slice(5)}</span>

                {/* Duration */}
                <span style={{ fontSize: 13, fontWeight: 700, color: effective === 'pending-action' ? '#9FA6AF' : durationColor, fontFamily: '"Inter Tight", sans-serif', fontVariantNumeric: 'tabular-nums' }}>
                  {effective === 'pending-action' ? '—' : `${r.duration}m`}
                </span>

                {/* Avg duration */}
                <span style={{ fontSize: 11, color: '#747A82', fontFamily: '"Inter Tight", sans-serif', fontVariantNumeric: 'tabular-nums' }}>
                  {r.avgDuration}m
                </span>

                {/* Status badge */}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 999, background: p.bg, color: p.color, fontSize: 11, fontWeight: 500, width: 'max-content' }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: p.dot, flexShrink: 0 }} />{p.label}
                </span>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                  {role === 'supervisor' && (effective === 'pending-reset' && (
                    <button onClick={() => setResetConfirmId(r.id)}
                      style={{ padding: '5px 11px', border: '1px solid #E8C0C0', borderRadius: 6, background: '#fff', color: '#A52727', fontSize: 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 100ms' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#FCECEC'; e.currentTarget.style.borderColor = '#D93838' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#E8C0C0' }}>复位</button>
                  ))}
                  {role === 'supervisor' && (effective === 'pending-action' && (
                    <button onClick={() => onActivate?.(r.plan)}
                      style={{ padding: '5px 11px', border: 'none', borderRadius: 6, background: '#004B8D', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background 100ms' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#005A9B')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#004B8D')}>处理</button>
                  ))}
                  <button onClick={() => setDetailId(r.id)}
                    style={{ padding: '5px 11px', border: '1px solid #CDD2D9', borderRadius: 6, background: '#fff', color: '#515760', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 100ms' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#82B9DD'; e.currentTarget.style.color = '#004B8D' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#CDD2D9'; e.currentTarget.style.color = '#515760' }}>查看详情</button>

                  {/* More (⋯) dropdown */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setMoreMenuId(moreMenuId === r.id ? null : r.id) }}
                      style={{ width: 28, height: 28, border: '1px solid #CDD2D9', borderRadius: 6, background: moreMenuId === r.id ? '#EEF5FB' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#515760', transition: 'all 100ms' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#82B9DD'; e.currentTarget.style.color = '#004B8D' }}
                      onMouseLeave={(e) => { if (moreMenuId !== r.id) { e.currentTarget.style.borderColor = '#CDD2D9'; e.currentTarget.style.color = '#515760' } }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="5" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="19" r="1" fill="currentColor" /></svg>
                    </button>
                    {moreMenuId === r.id && (
                      <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', zIndex: 200, background: '#fff', borderRadius: 8, border: '1px solid #E0E4E9', boxShadow: '0 8px 24px rgba(27,39,52,0.12)', minWidth: 140, padding: '4px 0', overflow: 'hidden' }}
                        onClick={(e) => e.stopPropagation()}>
                        {role === 'engineer' ? (
                          <button
                            onClick={() => { setViewFeedbackId(r.id); setMoreMenuId(null) }}
                            style={{ width: '100%', padding: '9px 14px', border: 'none', background: 'transparent', textAlign: 'left', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#171A1E', transition: 'background 80ms' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#F7F8FA' }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            查看反馈
                            {FEEDBACK_DATA[r.id] && <span style={{ fontSize: 10, color: '#39C523', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3 }}><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>{FEEDBACK_DATA[r.id].length} 条</span>}
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (!canFb) return
                              setFeedbackTargetId(r.id)
                              setFeedbackText(feedbackDone.get(r.id) ?? '')
                              setMoreMenuId(null)
                            }}
                            style={{ width: '100%', padding: '9px 14px', border: 'none', background: 'transparent', textAlign: 'left', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, cursor: canFb ? 'pointer' : 'not-allowed', color: canFb ? '#171A1E' : '#9FA6AF', transition: 'background 80ms' }}
                            onMouseEnter={(e) => { if (canFb) e.currentTarget.style.background = '#F7F8FA' }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                            {feedbackDone.has(r.id) ? '修改反馈' : '填写反馈'}
                            {!canFb && <span style={{ fontSize: 10, color: '#CDD2D9', marginLeft: 'auto' }}>未完成</span>}
                          </button>
                        )}
                        {role === 'supervisor' && feedbackDone.has(r.id) && (
                          <div style={{ padding: '3px 14px 8px', fontSize: 10, color: '#39C523', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                            已填写
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div style={{ padding: '48px 0', textAlign: 'center', color: '#9FA6AF', fontSize: 13 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#CDD2D9" strokeWidth="1.5" strokeLinecap="round" style={{ display: 'block', margin: '0 auto 12px' }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              该时段无操作记录
            </div>
          )}
        </div>
        <div style={{ marginTop: 10, fontSize: 11, color: '#9FA6AF', textAlign: 'right' }}>共 {filtered.length} 条</div>
      </div>
    </div>
  )
}

// ─── Feedback mock data ───────────────────────────────────────────────────────

const FEEDBACK_DATA: Record<string, { time: string; operator: string; text: string }[]> = {
  r1: [
    { time: '2026-08-14 12:00', operator: '张工', text: '执行顺利，启动 P021403A/B 时稍有延迟，现场确认后恢复正常。建议提前检查进口阀状态。' },
    { time: '2026-08-14 14:30', operator: '李班长', text: '已复核，步骤执行规范，归档备查。' },
  ],
  r3: [{ time: '2026-08-13 17:00', operator: '赵工', text: '紧急停车执行正常，操作时间较短，效果良好，无设备异常。' }],
  r5: [{ time: '2026-08-10 23:15', operator: '张工', text: '停电应急处理及时，全流程无设备损坏，各系统恢复正常。' }],
  r7: [{ time: '2026-08-05 09:10', operator: '王工', text: '空分跳车应急响应迅速，比历史平均节省 7 分钟，建议推广本次操作经验。' }],
}

function FeedbackViewModal({ recId, plan, onClose }: { recId: string; plan: string; onClose: () => void }) {
  const items = FEEDBACK_DATA[recId] ?? []
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(23,26,30,0.4)' }}
      onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 24px 60px rgba(20,34,48,0.22)', width: 480, maxHeight: '72vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #E0E4E9', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EEF5FB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#004B8D" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#171A1E' }}>查看反馈</div>
              <div style={{ fontSize: 11, color: '#9FA6AF', marginTop: 2 }}>{plan}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #E0E4E9', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#747A82', flexShrink: 0 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 22px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.length === 0 ? (
            <div style={{ padding: '36px 0', textAlign: 'center', color: '#9FA6AF', fontSize: 13 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#CDD2D9" strokeWidth="1.5" strokeLinecap="round" style={{ display: 'block', margin: '0 auto 10px' }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              暂无反馈记录
            </div>
          ) : (
            items.map((item, i) => (
              <div key={i} style={{ padding: '12px 14px', background: '#F7F8FA', borderRadius: 10, border: '1px solid #E0E4E9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#EEF5FB', border: '1px solid rgba(0,75,141,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700, color: '#004B8D' }}>
                    {item.operator.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#171A1E' }}>{item.operator}</div>
                    <div style={{ fontSize: 10, color: '#9FA6AF', fontFamily: '"JetBrains Mono", monospace', marginTop: 1 }}>{item.time}</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: '#30353B', lineHeight: 1.7, paddingLeft: 36 }}>{item.text}</div>
              </div>
            ))
          )}
        </div>
        <div style={{ padding: '12px 22px', borderTop: '1px solid #E0E4E9', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 22px', border: '1px solid #CDD2D9', borderRadius: 7, background: '#fff', color: '#515760', fontSize: 13, cursor: 'pointer' }}>关闭</button>
        </div>
      </div>
    </div>
  )
}

// ─── Manager Role Data ───────────────────────────────────────────────────────

const MGR_TRIGGERS = [
  { time: '08-14 14:32', section: '气化装置', plan: '08 烧嘴压差波动',      duration: 23, avg: 20, performer: '张工', result: 'ok'       as const },
  { time: '08-14 09:15', section: '甲醇装置', plan: '07 反应器床层温度高',  duration: 45, avg: 30, performer: '李工', result: 'overtime' as const },
  { time: '08-13 22:50', section: '气化装置', plan: '10 空分跳车应急',      duration: 18, avg: 25, performer: '王工', result: 'ok'       as const },
  { time: '08-13 16:20', section: '气化装置', plan: '06 紧急停车',          duration: 12, avg: 15, performer: '赵工', result: 'ok'       as const },
  { time: '08-12 11:05', section: '甲醇装置', plan: '05 压缩机跳停',        duration: 38, avg: 28, performer: '刘工', result: 'overtime' as const },
  { time: '08-12 08:30', section: '气化装置', plan: '05 停电应急',          duration: 16, avg: 18, performer: '张工', result: 'ok'       as const },
  { time: '08-11 19:45', section: '甲醇装置', plan: '09 汽包干烧紧急预案', duration: 22, avg: 20, performer: '陈工', result: 'ok'       as const },
]

const SECTION_FREQ = [
  { name: '气化装置', count: 28 },
  { name: '甲醇装置', count: 19 },
]

const SEC_EXEC = [
  { date: '08/14', plan: '08 烧嘴压差波动',   duration: 23, avg: 20, steps: 12, done: 12 },
  { date: '08/13', plan: '10 空分跳车应急',   duration: 18, avg: 25, steps: 15, done: 15 },
  { date: '08/13', plan: '06 紧急停车',       duration: 12, avg: 15, steps: 8,  done: 8  },
  { date: '08/10', plan: '01 气化冷态开车',   duration: 87, avg: 90, steps: 21, done: 21 },
  { date: '08/07', plan: '08 烧嘴压差波动',   duration: 26, avg: 20, steps: 12, done: 11 },
  { date: '08/03', plan: '05 停电应急',       duration: 20, avg: 18, steps: 10, done: 10 },
]

const FACILITY_TREE = [
  {
    id: 'f1', name: 'XX化工有限公司',
    devices: [
      {
        id: 'd1', name: '气化装置',
        sections: [
          { id: 's1', name: '气化工段 A', plans: 10, enabled: 8,  staff: 12, leader: '张三' },
          { id: 's2', name: '气化工段 B', plans: 10, enabled: 7,  staff: 10, leader: '李四' },
          { id: 's3', name: '激冷工段',   plans: 6,  enabled: 6,  staff: 8,  leader: '王五' },
        ],
      },
      {
        id: 'd2', name: '甲醇装置',
        sections: [
          { id: 's4', name: '合成工段', plans: 13, enabled: 10, staff: 14, leader: '赵六' },
          { id: 's5', name: '精馏工段', plans: 8,  enabled: 6,  staff: 9,  leader: '孙七' },
        ],
      },
    ],
  },
]

type ManagerPage = 'device-monitor' | 'section-monitor' | 'section-manage' | 'plan-manage' | 'hazard-manage'

// ─── Manager Sub-components ───────────────────────────────────────────────────

function KpiCard({ label, value, unit, sub, accent = '#171A1E' }: { label: string; value: string | number; unit: string; sub?: string; accent?: string }) {
  return (
    <div style={{ flex: 1, minWidth: 0, background: '#fff', borderRadius: 10, border: '1px solid rgba(96,108,122,0.12)', boxShadow: '0 4px 12px rgba(27,39,52,0.06)', padding: '16px 20px' }}>
      <div style={{ fontSize: 11, color: '#747A82', fontWeight: 500, marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, lineHeight: 1 }}>
        <span style={{ fontSize: 32, fontWeight: 700, color: accent, fontFamily: '"Inter Tight", sans-serif', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
        <span style={{ fontSize: 13, color: '#9FA6AF' }}>{unit}</span>
      </div>
      {sub && <div style={{ fontSize: 11, color: '#747A82', marginTop: 7 }}>{sub}</div>}
    </div>
  )
}

// ─── Nav icon helpers ─────────────────────────────────────────────────────────

const IconMonitor = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /><polyline points="7 10 10 7 13 11 16 8" /></svg>
const IconSection = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
const IconTree   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="6" cy="6" r="2" /><circle cx="18" cy="6" r="2" /><circle cx="12" cy="18" r="2" /><line x1="6" y1="8" x2="12" y2="16" /><line x1="18" y1="8" x2="12" y2="16" /></svg>
const IconBook   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 7.5C4 6.7 4.6 6 5.5 6H12V20H5.5C4.6 20 4 19.3 4 18.5V7.5Z" /><path d="M12 6H18.5C19.4 6 20 6.7 20 7.5V18.5C20 19.3 19.4 20 18.5 20H12V6Z" opacity={0.65} /><rect x="11.5" y="6" width="1" height="14" opacity={0.35} /></svg>
const IconRecords= () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
const IconPlan   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
const IconAlarmPri = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>

function DeviceMonitorPage() {
  const maxCount = Math.max(...SECTION_FREQ.map((s) => s.count))
  const overtimeCnt = MGR_TRIGGERS.filter((t) => t.result === 'overtime').length
  const avgDur = Math.round(MGR_TRIGGERS.reduce((s, t) => s + t.duration, 0) / MGR_TRIGGERS.length)

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, height: '100%', overflow: 'auto', boxSizing: 'border-box' }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#171A1E', marginBottom: 2 }}>装置预案监控</div>
        <div style={{ fontSize: 12, color: '#747A82' }}>最近 30 天 · XX化工有限公司</div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <KpiCard label="本月触发总数" value={47} unit="次" sub="较上月 +8 次" accent="#004B8D" />
        <KpiCard label="今日触发" value={3} unit="次" sub="最新：14:32 气化装置" accent="#171A1E" />
        <KpiCard label="平均执行时长" value={avgDur} unit="min" sub="基准 25 min" accent={avgDur > 25 ? '#F28C28' : '#237D17'} />
        <KpiCard label="超时率" value={Math.round((overtimeCnt / MGR_TRIGGERS.length) * 100)} unit="%" sub={`${overtimeCnt} 次超时`} accent={overtimeCnt > 0 ? '#F28C28' : '#237D17'} />
      </div>

      <div style={{ display: 'flex', gap: 12, flex: 1, minHeight: 0 }}>
        {/* Frequency chart */}
        <div style={{ width: 320, flexShrink: 0, background: '#fff', borderRadius: 10, border: '1px solid rgba(96,108,122,0.12)', boxShadow: '0 4px 12px rgba(27,39,52,0.06)', padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#171A1E' }}>各装置触发频率</div>
          <div style={{ fontSize: 11, color: '#747A82', marginTop: -6 }}>本月 · 次数</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 4 }}>
            {SECTION_FREQ.map((s) => (
              <div key={s.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: '#30353B' }}>{s.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#004B8D', fontFamily: '"Inter Tight", sans-serif' }}>{s.count}</span>
                </div>
                <div style={{ height: 8, background: '#E9EDF2', borderRadius: 999 }}>
                  <div style={{ width: `${(s.count / maxCount) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #004B8D, #0069A8)', borderRadius: 999 }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 'auto', padding: '12px 14px', background: '#EEF5FB', borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: '#515760', marginBottom: 4 }}>最高频装置</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#004B8D' }}>气化装置 · 28 次</div>
            <div style={{ fontSize: 11, color: '#5A7899', marginTop: 2 }}>占总触发量 59.6%</div>
          </div>
        </div>

        {/* Recent trigger list */}
        <div style={{ flex: 1, background: '#fff', borderRadius: 10, border: '1px solid rgba(96,108,122,0.12)', boxShadow: '0 4px 12px rgba(27,39,52,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #E0E4E9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#171A1E' }}>最近触发事件</span>
            <span style={{ fontSize: 11, color: '#747A82' }}>近 7 条</span>
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  {['时间', '装置', '预案名称', '执行人', '耗时', '结果'].map((h) => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#515760', borderBottom: '1px solid #E0E4E9', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MGR_TRIGGERS.map((t, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #E0E4E9' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F7F8FA')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '10px 14px', fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: '#747A82' }}>{t.time}</td>
                    <td style={{ padding: '10px 14px', color: '#515760' }}>{t.section}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 500, color: '#171A1E' }}>{t.plan}</td>
                    <td style={{ padding: '10px 14px', color: '#515760' }}>{t.performer}</td>
                    <td style={{ padding: '10px 14px', fontFamily: '"Inter Tight", sans-serif', fontWeight: 600, color: t.duration > t.avg ? '#F28C28' : '#237D17' }}>{t.duration} min</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: t.result === 'ok' ? '#EFF9EC' : '#FEF3E8', color: t.result === 'ok' ? '#237D17' : '#7A4000' }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: t.result === 'ok' ? '#39C523' : '#F28C28' }} />
                        {t.result === 'ok' ? '按时完成' : '超时'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function SectionMonitorPage() {
  const [selSec, setSelSec] = useState(Object.keys(PLANS_DATA)[0])
  const maxDur = Math.max(...SEC_EXEC.map((e) => Math.max(e.duration, e.avg))) * 1.15

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, height: '100%', overflow: 'auto', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#171A1E', marginBottom: 2 }}>工段预案监控</div>
          <div style={{ fontSize: 12, color: '#747A82' }}>执行分析 · 历史事件记录</div>
        </div>
        <select value={selSec} onChange={(e) => setSelSec(e.target.value)}
          style={{ padding: '7px 12px', border: '1px solid #CDD2D9', borderRadius: 7, fontSize: 13, color: '#30353B', background: '#fff', cursor: 'pointer', outline: 'none', fontFamily: '"Noto Sans SC", sans-serif' }}>
          {Object.keys(PLANS_DATA).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <KpiCard label="本月触发次数" value={28} unit="次" sub="较上月 +5" accent="#004B8D" />
        <KpiCard label="平均执行时长" value={27} unit="min" sub="基准 25 min · 超出 8%" accent="#F28C28" />
        <KpiCard label="准时完成率" value="78" unit="%" sub="近 6 次中 4 次按时完成" accent="#237D17" />
        <KpiCard label="最长单次" value={87} unit="min" sub="08/10 · 01 气化冷态开车" accent="#515760" />
      </div>

      {/* Execution timeline */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid rgba(96,108,122,0.12)', boxShadow: '0 4px 12px rgba(27,39,52,0.06)', padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#171A1E', marginBottom: 3 }}>执行耗时分析</div>
        <div style={{ fontSize: 11, color: '#747A82', marginBottom: 16 }}>绿色 = 按时；橙色 = 超时；蓝线 = 平均基准</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SEC_EXEC.map((e, i) => {
            const ot = e.duration > e.avg
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 10, color: '#9FA6AF', width: 38, flexShrink: 0, textAlign: 'right', fontFamily: '"Inter Tight", sans-serif' }}>{e.date}</span>
                <span style={{ fontSize: 11, color: '#515760', width: 190, flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.plan}</span>
                <div style={{ flex: 1, height: 14, background: '#F1F3F6', borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(e.duration / maxDur) * 100}%`, background: ot ? '#F28C28' : '#39C523', borderRadius: 4, opacity: 0.82 }} />
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${(e.avg / maxDur) * 100}%`, width: 2, background: '#004B8D', opacity: 0.45 }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: ot ? '#F28C28' : '#237D17', fontFamily: '"Inter Tight", sans-serif', width: 48, flexShrink: 0, textAlign: 'right' }}>{e.duration}m</span>
                <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 999, flexShrink: 0, background: ot ? '#FEF3E8' : '#EFF9EC', color: ot ? '#7A4000' : '#237D17', fontFamily: '"Inter Tight", sans-serif', fontWeight: 600, width: 36, textAlign: 'center' }}>
                  {ot ? `+${e.duration - e.avg}` : `-${e.avg - e.duration}`}
                </span>
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 14, fontSize: 11, color: '#747A82', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 12, height: 4, background: '#39C523', borderRadius: 2 }} />按时完成</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 12, height: 4, background: '#F28C28', borderRadius: 2 }} />超时</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 2, height: 12, background: '#004B8D', opacity: 0.5 }} />平均基准</div>
        </div>
      </div>

      {/* History table */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid rgba(96,108,122,0.12)', boxShadow: '0 4px 12px rgba(27,39,52,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '13px 20px', borderBottom: '1px solid #E0E4E9', fontSize: 13, fontWeight: 600, color: '#171A1E' }}>历史事件记录</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#F9FAFB' }}>
              {['日期', '预案名称', '耗时', '总步数', '完成步数', '完成率', '结果'].map((h) => (
                <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#515760', borderBottom: '1px solid #E0E4E9', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SEC_EXEC.map((e, i) => {
              const rate = Math.round((e.done / e.steps) * 100)
              const ot = e.duration > e.avg
              return (
                <tr key={i} style={{ borderBottom: '1px solid #E0E4E9' }}
                  onMouseEnter={(ev) => (ev.currentTarget.style.background = '#F7F8FA')}
                  onMouseLeave={(ev) => (ev.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '10px 14px', fontFamily: '"Inter Tight", sans-serif', fontSize: 11, color: '#747A82' }}>{e.date}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 500, color: '#171A1E' }}>{e.plan}</td>
                  <td style={{ padding: '10px 14px', fontFamily: '"Inter Tight", sans-serif', fontWeight: 700, color: ot ? '#F28C28' : '#237D17' }}>{e.duration} min</td>
                  <td style={{ padding: '10px 14px', textAlign: 'center', color: '#515760', fontFamily: '"Inter Tight", sans-serif' }}>{e.steps}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'center', color: '#515760', fontFamily: '"Inter Tight", sans-serif' }}>{e.done}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ flex: 1, height: 5, background: '#E9EDF2', borderRadius: 999 }}>
                        <div style={{ width: `${rate}%`, height: '100%', background: rate === 100 ? '#39C523' : '#F2B544', borderRadius: 999 }} />
                      </div>
                      <span style={{ fontSize: 11, fontFamily: '"Inter Tight", sans-serif', fontWeight: 600, color: rate === 100 ? '#237D17' : '#8B6200', width: 32 }}>{rate}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: ot ? '#FEF3E8' : '#EFF9EC', color: ot ? '#7A4000' : '#237D17' }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: ot ? '#F28C28' : '#39C523' }} />
                      {ot ? '超时' : '按时'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SectionManagePage({ matrix }: { matrix: AlarmPriority[] }) {
  const tree = FACILITY_TREE[0]
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ f1: true, d1: true, d2: false })
  const [selected, setSelected] = useState<{ type: 'factory' | 'device' | 'section'; id: string }>({ type: 'device', id: 'd1' })

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }))

  const selectedDev = selected.type === 'device' ? tree.devices.find((d) => d.id === selected.id) : null
  const selectedSec = selected.type === 'section' ? tree.devices.flatMap((d) => d.sections).find((s) => s.id === selected.id) : null

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, height: '100%', overflow: 'hidden', boxSizing: 'border-box' }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#171A1E', marginBottom: 2 }}>工段管理</div>
        <div style={{ fontSize: 12, color: '#747A82' }}>工厂 → 装置 → 工段 三级层级</div>
      </div>
      <div style={{ flex: 1, display: 'flex', gap: 12, minHeight: 0 }}>
        {/* Tree */}
        <div style={{ width: 260, flexShrink: 0, background: '#fff', borderRadius: 10, border: '1px solid rgba(96,108,122,0.12)', boxShadow: '0 4px 12px rgba(27,39,52,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #E0E4E9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#171A1E' }}>层级结构</span>
            <button style={{ padding: '3px 10px', border: '1px solid #CDD2D9', borderRadius: 5, background: '#fff', color: '#30353B', fontSize: 11, cursor: 'pointer' }}>+ 新增</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
            {/* Factory */}
            <div
              onClick={() => { toggle(tree.id); setSelected({ type: 'factory', id: tree.id }) }}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', cursor: 'pointer', background: selected.id === tree.id ? '#EEF5FB' : 'transparent', transition: 'background 80ms' }}
              onMouseEnter={(e) => { if (selected.id !== tree.id) e.currentTarget.style.background = '#F7F8FA' }}
              onMouseLeave={(e) => { if (selected.id !== tree.id) e.currentTarget.style.background = 'transparent' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#004B8D" strokeWidth="2.5" strokeLinecap="round" style={{ transform: expanded[tree.id] ? 'rotate(90deg)' : 'none', transition: 'transform 120ms', flexShrink: 0 }}><polyline points="9 18 15 12 9 6" /></svg>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#004B8D" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#171A1E', flex: 1 }}>{tree.name}</span>
            </div>
            {expanded[tree.id] && tree.devices.map((dev) => (
              <div key={dev.id}>
                <div
                  onClick={() => { toggle(dev.id); setSelected({ type: 'device', id: dev.id }) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px 7px 28px', cursor: 'pointer', background: selected.id === dev.id ? '#EEF5FB' : 'transparent', transition: 'background 80ms' }}
                  onMouseEnter={(e) => { if (selected.id !== dev.id) e.currentTarget.style.background = '#F7F8FA' }}
                  onMouseLeave={(e) => { if (selected.id !== dev.id) e.currentTarget.style.background = 'transparent' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#515760" strokeWidth="2.5" strokeLinecap="round" style={{ transform: expanded[dev.id] ? 'rotate(90deg)' : 'none', transition: 'transform 120ms', flexShrink: 0 }}><polyline points="9 18 15 12 9 6" /></svg>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0069A8" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
                  <span style={{ fontSize: 12, color: '#30353B', flex: 1, fontWeight: selected.id === dev.id ? 600 : 400 }}>{dev.name}</span>
                  <span style={{ fontSize: 10, color: '#9FA6AF', fontFamily: '"Inter Tight", sans-serif' }}>{dev.sections.length}</span>
                </div>
                {expanded[dev.id] && dev.sections.map((sec) => (
                  <div
                    key={sec.id}
                    onClick={() => setSelected({ type: 'section', id: sec.id })}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 14px 6px 48px', cursor: 'pointer', background: selected.id === sec.id ? '#EEF5FB' : 'transparent', borderLeft: selected.id === sec.id ? '2px solid #004B8D' : '2px solid transparent', transition: 'background 80ms' }}
                    onMouseEnter={(e) => { if (selected.id !== sec.id) e.currentTarget.style.background = '#F7F8FA' }}
                    onMouseLeave={(e) => { if (selected.id !== sec.id) e.currentTarget.style.background = 'transparent' }}
                  >
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#39C523', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: selected.id === sec.id ? '#004B8D' : '#515760', flex: 1, fontWeight: selected.id === sec.id ? 600 : 400 }}>{sec.name}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div style={{ flex: 1, background: '#fff', borderRadius: 10, border: '1px solid rgba(96,108,122,0.12)', boxShadow: '0 4px 12px rgba(27,39,52,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #E0E4E9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: 10, color: '#747A82', marginBottom: 3 }}>{{ factory: '工厂', device: '装置', section: '工段' }[selected.type]}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#171A1E' }}>
                {selected.type === 'factory' ? tree.name : selectedDev?.name ?? selectedSec?.name}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={{ padding: '6px 14px', border: '1px solid #CDD2D9', borderRadius: 6, background: '#fff', color: '#30353B', fontSize: 12, cursor: 'pointer' }}>编辑</button>
              {selected.type !== 'section' && (
                <button style={{ padding: '6px 14px', border: 'none', borderRadius: 6, background: '#004B8D', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  + 新增{selected.type === 'factory' ? '装置' : '工段'}
                </button>
              )}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            {/* Stat chips */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
              {selected.type === 'factory' && [
                ['装置数', tree.devices.length],
                ['工段总数', tree.devices.reduce((s, d) => s + d.sections.length, 0)],
                ['预案总数', tree.devices.reduce((s, d) => s + d.sections.reduce((ss, sec) => ss + sec.plans, 0), 0)],
              ].map(([k, v]) => (
                <div key={String(k)} style={{ background: '#F9FAFB', border: '1px solid #E0E4E9', borderRadius: 8, padding: '12px 18px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#747A82', marginBottom: 4 }}>{k}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#171A1E', fontFamily: '"Inter Tight", sans-serif' }}>{v}</div>
                </div>
              ))}
              {selected.type === 'device' && selectedDev && [
                ['工段数', selectedDev.sections.length],
                ['预案总数', selectedDev.sections.reduce((s, sec) => s + sec.plans, 0)],
                ['已启用', selectedDev.sections.reduce((s, sec) => s + sec.enabled, 0)],
              ].map(([k, v]) => (
                <div key={String(k)} style={{ background: '#F9FAFB', border: '1px solid #E0E4E9', borderRadius: 8, padding: '12px 18px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#747A82', marginBottom: 4 }}>{k}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#171A1E', fontFamily: '"Inter Tight", sans-serif' }}>{v}</div>
                </div>
              ))}
              {selected.type === 'section' && selectedSec && [
                ['预案总数', selectedSec.plans],
                ['已启用', selectedSec.enabled],
                ['在岗人数', `${selectedSec.staff} 人`],
                ['班长', selectedSec.leader],
              ].map(([k, v]) => (
                <div key={String(k)} style={{ background: '#F9FAFB', border: '1px solid #E0E4E9', borderRadius: 8, padding: '12px 18px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#747A82', marginBottom: 4 }}>{k}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#171A1E', fontFamily: '"Inter Tight", sans-serif' }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Children table */}
            {selected.type === 'factory' && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#171A1E', marginBottom: 12 }}>下属装置</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead><tr style={{ background: '#F1F3F6' }}>{['装置名称', '工段数', '预案总数', '操作'].map((h) => <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#515760', borderBottom: '1px solid #CDD2D9' }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {tree.devices.map((dev) => (
                      <tr key={dev.id} style={{ borderBottom: '1px solid #E0E4E9' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F7F8FA')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '10px 14px', fontWeight: 500, color: '#171A1E' }}>{dev.name}</td>
                        <td style={{ padding: '10px 14px', fontFamily: '"Inter Tight", sans-serif', color: '#515760' }}>{dev.sections.length}</td>
                        <td style={{ padding: '10px 14px', fontFamily: '"Inter Tight", sans-serif', color: '#515760' }}>{dev.sections.reduce((s, sec) => s + sec.plans, 0)}</td>
                        <td style={{ padding: '10px 14px' }}><button onClick={() => setSelected({ type: 'device', id: dev.id })} style={{ padding: '3px 10px', border: '1px solid #CDD2D9', borderRadius: 5, background: '#fff', color: '#30353B', fontSize: 11, cursor: 'pointer' }}>查看</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {selected.type === 'device' && selectedDev && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#171A1E', marginBottom: 12 }}>下属工段</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead><tr style={{ background: '#F1F3F6' }}>{['工段名称', '预案', '已启用', '在岗', '班长', '操作'].map((h) => <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#515760', borderBottom: '1px solid #CDD2D9' }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {selectedDev.sections.map((sec) => (
                      <tr key={sec.id} style={{ borderBottom: '1px solid #E0E4E9' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F7F8FA')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '10px 14px', fontWeight: 500, color: '#171A1E' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#39C523' }} />{sec.name}</div>
                        </td>
                        <td style={{ padding: '10px 14px', fontFamily: '"Inter Tight", sans-serif', color: '#515760' }}>{sec.plans}</td>
                        <td style={{ padding: '10px 14px' }}><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: '#EFF9EC', color: '#237D17' }}>{sec.enabled} 已启用</span></td>
                        <td style={{ padding: '10px 14px', fontFamily: '"Inter Tight", sans-serif', color: '#515760' }}>{sec.staff} 人</td>
                        <td style={{ padding: '10px 14px', color: '#515760' }}>{sec.leader}</td>
                        <td style={{ padding: '10px 14px' }}><button onClick={() => setSelected({ type: 'section', id: sec.id })} style={{ padding: '3px 10px', border: '1px solid #CDD2D9', borderRadius: 5, background: '#fff', color: '#30353B', fontSize: 11, cursor: 'pointer' }}>管理</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {selected.type === 'section' && selectedSec && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#171A1E', marginBottom: 12 }}>预案列表</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead><tr style={{ background: '#F1F3F6' }}>{['预案名称', '优先级', '状态', '更新日期'].map((h) => <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#515760', borderBottom: '1px solid #CDD2D9' }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {Object.values(PLANS_DATA).flat().slice(0, selectedSec.plans).map((plan) => (
                      <tr key={plan.id} style={{ borderBottom: '1px solid #E0E4E9' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F7F8FA')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '10px 14px', fontWeight: 500, color: '#171A1E' }}>{plan.name}</td>
                        <td style={{ padding: '10px 14px' }}><PriTag priorityId={plan.priority} matrix={matrix} /></td>
                        <td style={{ padding: '10px 14px' }}><StatusTag status={plan.status} /></td>
                        <td style={{ padding: '10px 14px', color: '#747A82', fontSize: 11, fontFamily: '"Inter Tight", sans-serif' }}>{plan.updatedAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function PlanManagePage({ sections, plans, setPlans, setConfigPlan, matrix }: {
  sections: string[]
  plans: Record<string, Plan[]>
  setPlans: React.Dispatch<React.SetStateAction<Record<string, Plan[]>>>
  setConfigPlan: (p: string | null) => void
  matrix: AlarmPriority[]
}) {
  const [selSec, setSelSec] = useState(sections[0] ?? '')
  const [viewPlan, setViewPlan] = useState<string | null>(null)
  const [moreMenuId, setMoreMenuId] = useState<string | null>(null)
  const current = plans[selSec] ?? []
  const handleToggle = (id: string) => {
    setPlans((prev) => {
      const updated = { ...prev }
      updated[selSec] = (updated[selSec] ?? []).map((p) => p.id !== id ? p : { ...p, status: p.status === 'enabled' ? 'disabled' as const : 'enabled' as const })
      return updated
    })
  }
  return (
    <>
    <div style={{ display: 'flex', gap: 12, padding: 12, height: '100%', overflow: 'hidden', boxSizing: 'border-box' }}>
      <div style={{ width: 200, flexShrink: 0, background: '#fff', borderRadius: 12, border: '1px solid rgba(96,108,122,0.14)', boxShadow: '0 8px 24px rgba(27,39,52,0.07)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid #E0E4E9', fontSize: 13, fontWeight: 600, color: '#171A1E' }}>工段</div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
          {sections.map((sec) => (
            <div key={sec} role="button" tabIndex={0} onClick={() => setSelSec(sec)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelSec(sec) }}
              style={{ padding: '8px 10px', borderRadius: 7, cursor: 'pointer', userSelect: 'none', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: selSec === sec ? 600 : 400, background: selSec === sec ? '#EEF5FB' : 'transparent', color: selSec === sec ? '#004B8D' : '#30353B', transition: 'background 80ms' }}
              onMouseEnter={(e) => { if (selSec !== sec) e.currentTarget.style.background = '#F7F8FA' }}
              onMouseLeave={(e) => { if (selSec !== sec) e.currentTarget.style.background = 'transparent' }}
            >
              {selSec === sec && <div style={{ width: 3, height: 14, background: '#004B8D', borderRadius: 2, flexShrink: 0 }} />}
              {sec}
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, background: '#fff', borderRadius: 12, border: '1px solid rgba(96,108,122,0.14)', boxShadow: '0 8px 24px rgba(27,39,52,0.07)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '10px 16px', borderBottom: '1px solid #E0E4E9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div><span style={{ fontSize: 14, fontWeight: 600, color: '#171A1E' }}>{selSec}</span><span style={{ marginLeft: 8, fontSize: 12, color: '#747A82' }}>共 {current.length} 条</span></div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => {
                const blob = new Blob([JSON.stringify(current, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a'); a.href = url; a.download = `${selSec}-预案.json`; a.click()
                URL.revokeObjectURL(url)
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', border: '1px solid #CDD2D9', borderRadius: 6, background: '#fff', color: '#515760', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              批量导出
            </button>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }} onClick={() => setMoreMenuId(null)}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F1F3F6', position: 'sticky', top: 0, zIndex: 1 }}>
                {['编号', '预案名称', '状态', '更新日期', '操作'].map((h, i) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: i === 4 ? 'right' : 'left', color: '#515760', fontWeight: 600, fontSize: 12, borderBottom: '1px solid #CDD2D9' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {current.map((plan) => (
                <tr key={plan.id}
                  onClick={() => setViewPlan(plan.name)}
                  style={{ borderBottom: '1px solid #E0E4E9', cursor: 'pointer', transition: 'background 80ms' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#F0F6FF')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '10px 14px', fontFamily: '"Inter Tight", sans-serif', fontSize: 11, fontWeight: 600, color: '#747A82', whiteSpace: 'nowrap' }}>{plan.id.toUpperCase()}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 500, color: '#171A1E' }}>{plan.name}</td>
                  <td style={{ padding: '12px 14px' }}><StatusTag status={plan.status} /></td>
                  <td style={{ padding: '12px 14px', color: '#747A82', fontSize: 12, fontFamily: '"Inter Tight", sans-serif' }}>{plan.updatedAt}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setMoreMenuId(moreMenuId === plan.id ? null : plan.id) }}
                          style={{ width: 28, height: 28, border: '1px solid #CDD2D9', borderRadius: 6, background: moreMenuId === plan.id ? '#EEF5FB' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#515760', transition: 'all 100ms' }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#82B9DD'; e.currentTarget.style.color = '#004B8D' }}
                          onMouseLeave={(e) => { if (moreMenuId !== plan.id) { e.currentTarget.style.borderColor = '#CDD2D9'; e.currentTarget.style.color = '#515760' } }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/></svg>
                        </button>
                        {moreMenuId === plan.id && (
                          <div
                            style={{ position: 'absolute', right: 0, top: 32, width: 120, background: '#fff', border: '1px solid #E0E4E9', borderRadius: 8, boxShadow: '0 8px 24px rgba(27,39,52,0.12)', zIndex: 100, overflow: 'hidden' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => { setMoreMenuId(null) }}
                              style={{ width: '100%', padding: '9px 14px', border: 'none', background: 'transparent', textAlign: 'left', fontSize: 13, color: '#30353B', cursor: 'pointer' }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = '#F7F8FA')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            >查看反馈</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {current.length === 0 && <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#9FA6AF', fontSize: 13 }}>暂无预案</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    {viewPlan && (
      <ViewDrawer plan={viewPlan} onClose={() => setViewPlan(null)} onActivate={() => setViewPlan(null)} />
    )}
    </>
  )
}

const IconHome = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>

// ── Manager overview data ──────────────────────────────────────────────────────

// Which plans have been triggered and how often (current month mock)
const PLAN_TRIGGER_FREQ = [
  { planName: '06 紧急停车',          section: '气化装置', sectionColor: '#004B8D', count: 8,  hazardId: 'h01', hazardName: '气化炉超温' },
  { planName: '08 烧嘴压差波动',      section: '气化装置', sectionColor: '#004B8D', count: 6,  hazardId: 'h02', hazardName: '烧嘴压差异常波动' },
  { planName: '05 压缩机跳停',        section: '甲醇装置', sectionColor: '#237D17', count: 5,  hazardId: 'h09', hazardName: '压缩机突然停车' },
  { planName: '07 反应器床层温度高',  section: '甲醇装置', sectionColor: '#237D17', count: 4,  hazardId: 'h07', hazardName: '反应器床层温度超高' },
  { planName: '10 空分跳车应急',      section: '气化装置', sectionColor: '#004B8D', count: 4,  hazardId: 'h04', hazardName: '空分系统意外跳车' },
  { planName: '05 停电应急',          section: '气化装置', sectionColor: '#004B8D', count: 3,  hazardId: 'h06', hazardName: '停电事故' },
  { planName: '09 汽包干烧紧急预案',  section: '甲醇装置', sectionColor: '#237D17', count: 2,  hazardId: 'h08', hazardName: '汽包干烧' },
  { planName: '09 激冷室底部堵渣操作',section: '气化装置', sectionColor: '#004B8D', count: 1,  hazardId: 'h03', hazardName: '激冷室底部堵渣' },
]

// Per-plan execution health evaluation
const PLAN_EXEC_HEALTH = [
  { planName: '08 烧嘴压差波动',      section: '气化装置', completionRate: 75, avgDur: 38, stdDur: 25, resolved: false, issue: '步序超时严重，现有SOP未能及时处置压差波动，建议增加快速泄压操作步骤' },
  { planName: '07 反应器床层温度高',  section: '甲醇装置', completionRate: 68, avgDur: 45, stdDur: 30, resolved: false, issue: '完成率偏低，操作人员反映温度继续升高后无后续处置指引，SOP缺少升级预案分支' },
  { planName: '06 紧急停车',          section: '气化装置', completionRate: 88, avgDur: 22, stdDur: 20, resolved: true,  issue: '' },
  { planName: '05 压缩机跳停',        section: '甲醇装置', completionRate: 92, avgDur: 18, stdDur: 20, resolved: true,  issue: '' },
  { planName: '10 空分跳车应急',      section: '气化装置', completionRate: 95, avgDur: 14, stdDur: 18, resolved: true,  issue: '' },
  { planName: '09 汽包干烧紧急预案',  section: '甲醇装置', completionRate: 80, avgDur: 28, stdDur: 25, resolved: true,  issue: '' },
]

function ManagerOverviewPage({ onPage }: { plans?: Record<string, Plan[]>; onPage?: (p: string) => void }) {
  const [expandedHazard, setExpandedHazard] = useState<string | null>(null)

  // ── Section 1: Hazard totals ──
  const unlinkedHazards = INIT_HAZARDS.filter(h => !h.linkedPlan)
  const linkedCount     = INIT_HAZARDS.length - unlinkedHazards.length

  // ── Section 2: Trigger frequency + high-freq identification ──
  const maxTriggerCount = Math.max(...PLAN_TRIGGER_FREQ.map(p => p.count))
  const highFreqThreshold = 4
  const highFreqItems = PLAN_TRIGGER_FREQ.filter(p => p.count >= highFreqThreshold)

  // ── Section 3: Execution health ──
  const needsSOPFix = PLAN_EXEC_HEALTH.filter(p => !p.resolved)
  const healthOk    = PLAN_EXEC_HEALTH.filter(p => p.resolved)

  // ── Section 4: Recent ops with duration comparison ──
  const recentRecords = OP_RECORDS.slice(0, 7)
  const globalAvgDur  = Math.round(recentRecords.reduce((s, r) => s + r.avgDuration, 0) / recentRecords.length)
  const belowAvgCount = recentRecords.filter(r => r.duration > r.avgDuration).length

  // shared card style
  const card: React.CSSProperties = {
    background: '#fff', borderRadius: 14,
    border: '1px solid rgba(96,108,122,0.1)',
    boxShadow: '0 4px 16px rgba(27,39,52,0.06)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  }
  const cardHead = (title: string, badge?: React.ReactNode, action?: React.ReactNode) => (
    <div style={{ padding: '13px 18px 11px', borderBottom: '1px solid #F2F4F7', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#171A1E', flex: 1 }}>{title}</span>
      {badge}
      {action}
    </div>
  )
  const NavChip = ({ label, page, color = '#004B8D' }: { label: string; page: string; color?: string }) => (
    <button onClick={() => onPage?.(page)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', border: `1px solid ${color}30`, borderRadius: 999, background: `${color}0D`, color, fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
      {label}
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
    </button>
  )

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#EDF0F5' }}>
      {/* ── Command header ── */}
      <div style={{ background: '#001D38', borderBottom: '1px solid rgba(0,75,141,0.35)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 28, flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.1em', fontWeight: 600, textTransform: 'uppercase', fontFamily: '"Inter Tight", sans-serif', marginBottom: 3 }}>装置经理工作台</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>隐患 · 预案 · 运行 总览</div>
        </div>
        <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
        {[
          { label: '隐患总数',     value: INIT_HAZARDS.length, unit: '项', color: '#82B9DD' },
          { label: '未关联预案',   value: unlinkedHazards.length, unit: '项', color: unlinkedHazards.length > 0 ? '#F28C28' : '#39C523' },
          { label: '本月触发',     value: PLAN_TRIGGER_FREQ.reduce((s, p) => s + p.count, 0), unit: '次', color: '#F2B544' },
          { label: '高频隐患',     value: highFreqItems.length, unit: '项', color: highFreqItems.length > 2 ? '#D93838' : '#F28C28' },
          { label: 'SOP待修正',   value: needsSOPFix.length, unit: '项', color: needsSOPFix.length > 0 ? '#D93838' : '#39C523' },
          { label: '近期超时执行', value: belowAvgCount, unit: '次', color: belowAvgCount > 2 ? '#D93838' : '#F2B544' },
        ].map(k => (
          <div key={k.label} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 500, letterSpacing: '0.04em' }}>{k.label}</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: k.color, fontFamily: '"Inter Tight", sans-serif', lineHeight: 1 }}>{k.value}</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{k.unit}</span>
            </div>
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)' }}>统计周期</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.65)', fontFamily: '"Inter Tight", sans-serif' }}>2026 年 8 月</div>
        </div>
      </div>

      {/* ── 2-column main grid ── */}
      <div style={{ padding: '18px 22px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* ══ SECTION 1: 隐患管理总计 ══ */}
        <div style={{ ...card }}>
          {cardHead(
            '隐患管理总计',
            <span style={{ fontSize: 11, color: '#9FA6AF' }}>共 {INIT_HAZARDS.length} 条登记隐患</span>,
            <NavChip label="去配置" page="hazard-manage" />,
          )}
          {/* Summary KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, borderBottom: '1px solid #F2F4F7', flexShrink: 0 }}>
            {[
              { label: '已关联预案', value: linkedCount,           color: '#237D17', bg: '#EFF9EC', border: 'rgba(57,197,35,0.18)' },
              { label: '未关联预案', value: unlinkedHazards.length, color: unlinkedHazards.length > 0 ? '#D93838' : '#237D17', bg: unlinkedHazards.length > 0 ? '#FFF0F0' : '#EFF9EC', border: unlinkedHazards.length > 0 ? 'rgba(217,56,56,0.15)' : 'rgba(57,197,35,0.18)' },
              { label: '已配置触发条件', value: INIT_HAZARDS.filter(h => h.triggers.length > 0).length, color: '#004B8D', bg: '#EEF5FB', border: 'rgba(0,75,141,0.15)' },
            ].map(k => (
              <div key={k.label} style={{ padding: '12px 0', textAlign: 'center', borderRight: '1px solid #F2F4F7', borderBottom: `3px solid ${k.color}40` }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: k.color, fontFamily: '"Inter Tight", sans-serif', lineHeight: 1 }}>{k.value}</div>
                <div style={{ fontSize: 10, color: '#747A82', marginTop: 4 }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Unlinked hazard list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 16px 14px' }}>
            {unlinkedHazards.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#237D17', fontSize: 12, fontWeight: 600 }}>✓ 所有隐患均已关联预案</div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <div style={{ width: 3, height: 12, background: '#D93838', borderRadius: 2 }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#D93838' }}>以下 {unlinkedHazards.length} 个隐患尚未关联处置预案，存在应急盲区</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {unlinkedHazards.map(h => (
                    <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#FFF8F8', borderRadius: 8, border: '1px solid rgba(217,56,56,0.15)' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D93838" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#1A2D45' }}>{h.name}</div>
                        <div style={{ fontSize: 10, color: '#9FA6AF', marginTop: 1 }}>{h.device} › {h.unit} · {h.triggers.length > 0 ? `已配置 ${h.triggers.length} 条触发条件` : '触发条件未配置'}</div>
                      </div>
                      <span style={{ fontSize: 10, color: '#D93838', background: 'rgba(217,56,56,0.08)', padding: '2px 7px', borderRadius: 999, fontWeight: 600, whiteSpace: 'nowrap' }}>无预案</span>
                    </div>
                  ))}
                </div>
              </>
            )}
            {/* All hazards donut text summary */}
            <div style={{ marginTop: 12, padding: '10px 12px', background: '#F7F8FA', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="36" height="36" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#F1F3F6" strokeWidth="6"/>
                <circle cx="18" cy="18" r="14" fill="none" stroke="#39C523" strokeWidth="6"
                  strokeDasharray={`${(linkedCount / INIT_HAZARDS.length) * 88} 88`}
                  strokeDashoffset="22" strokeLinecap="round"/>
                <circle cx="18" cy="18" r="14" fill="none" stroke="#D93838" strokeWidth="6"
                  strokeDasharray={`${(unlinkedHazards.length / INIT_HAZARDS.length) * 88} 88`}
                  strokeDashoffset={`${22 - (linkedCount / INIT_HAZARDS.length) * 88}`} strokeLinecap="round"/>
              </svg>
              <div>
                <div style={{ fontSize: 11, color: '#515760' }}>预案覆盖率</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#1A2D45', fontFamily: '"Inter Tight", sans-serif' }}>{Math.round((linkedCount / INIT_HAZARDS.length) * 100)}%</div>
              </div>
              <div style={{ flex: 1 }} />
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: '#39C523' }} />
                  <span style={{ fontSize: 10, color: '#515760' }}>已关联 {linkedCount}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: '#D93838' }} />
                  <span style={{ fontSize: 10, color: '#515760' }}>待关联 {unlinkedHazards.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══ SECTION 3: 预案执行评估 ══ */}
        <div style={{ ...card }}>
          {cardHead(
            '预案执行评估',
            <span style={{ fontSize: 11, color: '#9FA6AF' }}>基于完成率 · 超时分析</span>,
            needsSOPFix.length > 0 ? (
              <span style={{ padding: '3px 9px', borderRadius: 999, background: '#FFF0F0', color: '#D93838', fontSize: 11, fontWeight: 700, border: '1px solid rgba(217,56,56,0.2)' }}>
                {needsSOPFix.length} 项 SOP 待修正
              </span>
            ) : undefined,
          )}

          {/* SOP needs fix — warning items */}
          {needsSOPFix.length > 0 && (
            <div style={{ padding: '10px 16px', background: 'linear-gradient(135deg, #FFF8F8 0%, #FFFBF8 100%)', borderBottom: '1px solid #F2F4F7', flexShrink: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#D93838', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D93838" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                以下预案执行效果欠佳，建议修正 SOP
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {needsSOPFix.map(p => (
                  <div key={p.planName} style={{ background: '#fff', borderRadius: 9, border: '1px solid rgba(217,56,56,0.18)', overflow: 'hidden' }}>
                    <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                      onClick={() => setExpandedHazard(expandedHazard === p.planName ? null : p.planName)}>
                      <div style={{ width: 3, height: 30, borderRadius: 2, background: p.completionRate < 75 ? '#D93838' : '#F28C28', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#1A2D45' }}>{p.planName}</div>
                        <div style={{ fontSize: 10, color: '#9FA6AF', marginTop: 1 }}>{p.section}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: p.completionRate < 75 ? '#D93838' : '#F28C28', fontFamily: '"Inter Tight", sans-serif', lineHeight: 1 }}>{p.completionRate}%</div>
                          <div style={{ fontSize: 9, color: '#9FA6AF' }}>完成率</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#D93838', fontFamily: '"Inter Tight", sans-serif', lineHeight: 1 }}>{p.avgDur}m</div>
                          <div style={{ fontSize: 9, color: '#9FA6AF' }}>均耗时</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 11, color: '#9FA6AF' }}>标准</div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#747A82', fontFamily: '"Inter Tight", sans-serif' }}>{p.stdDur}m</div>
                        </div>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9FA6AF" strokeWidth="2" strokeLinecap="round" style={{ transform: expandedHazard === p.planName ? 'rotate(90deg)' : 'none', transition: 'transform 150ms ease' }}><polyline points="9 18 15 12 9 6"/></svg>
                      </div>
                    </div>
                    {expandedHazard === p.planName && (
                      <div style={{ padding: '0 12px 10px 28px', borderTop: '1px solid #F9ECEC' }}>
                        <div style={{ fontSize: 11, color: '#D93838', lineHeight: 1.5, marginBottom: 8 }}>{p.issue}</div>
                        <NavChip label="前往修正 SOP" page="plan-manage" color="#D93838" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Healthy plans */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 16px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#747A82', marginBottom: 8 }}>执行正常预案</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {healthOk.map(p => (
                <div key={p.planName} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', background: '#F7FCF7', borderRadius: 8, border: '1px solid rgba(57,197,35,0.15)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#39C523" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#1A2D45' }}>{p.planName}</span>
                  <span style={{ fontSize: 10, color: '#237D17', fontFamily: '"Inter Tight", sans-serif', fontWeight: 700 }}>{p.completionRate}%</span>
                  <span style={{ fontSize: 10, color: '#9FA6AF', fontFamily: '"Inter Tight", sans-serif' }}>{p.avgDur}m / {p.stdDur}m</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ SECTION 2: 高频触发预案 + 隐患识别 ══ */}
        <div style={{ ...card }}>
          {cardHead(
            '触发频次分析 · 高频隐患识别',
            <span style={{ fontSize: 11, color: '#9FA6AF' }}>本月 · 按触发次数排序</span>,
            <NavChip label="操作记录" page="op-records" />,
          )}

          {/* High-freq alert banner */}
          {highFreqItems.length > 0 && (
            <div style={{ padding: '9px 16px', background: 'linear-gradient(90deg, #FFF8F0 0%, #FFFCFA 100%)', borderBottom: '1px solid #F2F4F7', flexShrink: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8B6200', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F28C28" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                以下 {highFreqItems.length} 个隐患触发频繁，建议深入分析根因、研究工艺改造措施
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {highFreqItems.map(p => (
                  <span key={p.hazardId} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999, background: '#fff', border: '1px solid rgba(242,140,40,0.35)', fontSize: 11, fontWeight: 600, color: '#7A4000' }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#F28C28', flexShrink: 0 }} />
                    {p.hazardName}
                    <span style={{ fontFamily: '"Inter Tight", sans-serif', fontWeight: 700, color: '#D93838' }}>×{p.count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Frequency bar chart */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 18px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {PLAN_TRIGGER_FREQ.map((p, i) => {
                const barPct = (p.count / maxTriggerCount) * 100
                const isHigh = p.count >= highFreqThreshold
                const barColor = isHigh ? '#D93838' : p.count >= 3 ? '#F28C28' : '#82B9DD'
                return (
                  <div key={p.planName}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ width: 18, height: 18, borderRadius: 5, background: isHigh ? '#FFF0F0' : '#F7F8FA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: isHigh ? '#D93838' : '#9FA6AF', fontFamily: '"Inter Tight", sans-serif', flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#1A2D45', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.planName}</span>
                      <span style={{ fontSize: 10, color: p.sectionColor, fontWeight: 600 }}>{p.section}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: barColor, fontFamily: '"Inter Tight", sans-serif', minWidth: 24, textAlign: 'right' }}>{p.count}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: '#F1F3F6', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${barPct}%`, background: barColor, borderRadius: 999, transition: 'width 400ms ease' }} />
                      </div>
                      {/* Linked hazard badge */}
                      <span style={{ fontSize: 10, color: '#747A82', whiteSpace: 'nowrap', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        ⬦ {p.hazardName}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Action callout */}
            {highFreqItems.length > 0 && (
              <div style={{ marginTop: 14, padding: '10px 14px', background: 'linear-gradient(135deg, #FEF3E8 0%, #FFFCF8 100%)', borderRadius: 10, border: '1px solid rgba(242,140,40,0.25)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F28C28" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#7A4000', marginBottom: 3 }}>建议行动</div>
                  <div style={{ fontSize: 11, color: '#8B6200', lineHeight: 1.5 }}>
                    高频触发表明该隐患在工艺条件上尚未彻底消除。建议组织专题分析：排查设备磨损、工艺参数漂移或操作习惯问题，评估是否需要工艺改造或增设预防性维护措施。
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ══ SECTION 4: 近期操作情况 ══ */}
        <div style={{ ...card }}>
          {cardHead(
            '近期操作情况',
            belowAvgCount > 0 ? (
              <span style={{ padding: '3px 9px', borderRadius: 999, background: '#FFF8F0', color: '#8B6200', fontSize: 11, fontWeight: 700, border: '1px solid rgba(242,140,40,0.2)' }}>
                {belowAvgCount} 次超时
              </span>
            ) : (
              <span style={{ padding: '3px 9px', borderRadius: 999, background: '#EFF9EC', color: '#237D17', fontSize: 11, fontWeight: 700, border: '1px solid rgba(57,197,35,0.2)' }}>
                执行良好
              </span>
            ),
            <NavChip label="查看全部" page="op-records" />,
          )}

          {/* Avg duration context */}
          <div style={{ padding: '8px 18px', background: '#F9FAFB', borderBottom: '1px solid #F2F4F7', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 11, color: '#747A82' }}>历史平均完成时长</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#1A2D45', fontFamily: '"Inter Tight", sans-serif' }}>{globalAvgDur} min</div>
            <div style={{ width: 1, background: '#E0E4E9', height: 16 }} />
            <div style={{ fontSize: 11, color: '#747A82' }}>超时记录</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: belowAvgCount > 2 ? '#D93838' : '#F28C28', fontFamily: '"Inter Tight", sans-serif' }}>{belowAvgCount} 次</div>
            <div style={{ flex: 1 }} />
            <div style={{ fontSize: 10, color: '#9FA6AF' }}>近 {recentRecords.length} 条记录</div>
          </div>

          {/* Records table */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#F7F8FA', position: 'sticky', top: 0, zIndex: 1 }}>
                  {['预案名称', '执行人', '工段', '耗时 vs 均值', '完成情况'].map(h => (
                    <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#747A82', borderBottom: '1px solid #EAECED', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentRecords.map(r => {
                  const phase = r.phase as string
                  const overtime = r.duration > r.avgDuration
                  const diffMin  = r.duration - r.avgDuration
                  const diffPct  = Math.round(Math.abs(diffMin / r.avgDuration) * 100)
                  const statusLabel = { completed: '正常完成', 'pending-reset': '待复位', 'manually-ended': '手动结束', 'pending-action': '待处置' }[phase] ?? phase
                  const statusColor = { completed: '#237D17', 'pending-reset': '#F28C28', 'manually-ended': '#747A82', 'pending-action': '#D93838' }[phase] ?? '#747A82'
                  return (
                    <tr key={r.id}
                      style={{ borderBottom: '1px solid #F2F4F7', transition: 'background 80ms', background: overtime ? '#FFFAF7' : 'transparent', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background = overtime ? '#FFF5EE' : '#F7F9FC')}
                      onMouseLeave={e => (e.currentTarget.style.background = overtime ? '#FFFAF7' : 'transparent')}
                    >
                      <td style={{ padding: '9px 14px', fontWeight: 600, color: '#1A2D45', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.plan}</td>
                      <td style={{ padding: '9px 14px', color: '#515760' }}>{r.operator}</td>
                      <td style={{ padding: '9px 14px' }}>
                        <span style={{ fontSize: 11, color: r.section === '气化装置' ? '#004B8D' : '#237D17', fontWeight: 600 }}>{r.section}</span>
                      </td>
                      <td style={{ padding: '9px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontFamily: '"Inter Tight", sans-serif', fontWeight: 700, color: overtime ? '#D93838' : '#237D17', fontSize: 13 }}>{r.duration}m</span>
                          <span style={{ fontSize: 10, color: '#9FA6AF' }}>/ {r.avgDuration}m</span>
                          {phase !== 'pending-action' && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: overtime ? '#D93838' : '#237D17', background: overtime ? 'rgba(217,56,56,0.08)' : 'rgba(57,197,35,0.08)', padding: '1px 5px', borderRadius: 4, fontFamily: '"Inter Tight", sans-serif' }}>
                              {overtime ? '+' : '-'}{diffPct}%
                            </span>
                          )}
                        </div>
                        {/* Duration bar */}
                        <div style={{ marginTop: 3, height: 3, background: '#F1F3F6', borderRadius: 999, width: 80, overflow: 'visible', position: 'relative' }}>
                          <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${Math.min((r.avgDuration / Math.max(r.duration, r.avgDuration)) * 100, 100)}%`, background: '#CDD2D9', borderRadius: 999 }} />
                          <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${Math.min((r.duration / Math.max(r.duration, r.avgDuration)) * 100, 100)}%`, background: overtime ? '#D93838' : '#39C523', borderRadius: 999, opacity: 0.7 }} />
                        </div>
                      </td>
                      <td style={{ padding: '9px 14px' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: statusColor, background: `${statusColor}14`, padding: '3px 8px', borderRadius: 999, whiteSpace: 'nowrap' }}>{statusLabel}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Duration insight footer */}
          {belowAvgCount > 0 && (
            <div style={{ padding: '10px 16px', background: 'linear-gradient(135deg, #FEF9EC 0%, #FFFCF5 100%)', borderTop: '1px solid #F2F4F7', display: 'flex', alignItems: 'flex-start', gap: 10, flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F2B544" strokeWidth="2" strokeLinecap="round" style={{ marginTop: 1, flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <div style={{ fontSize: 11, color: '#8B6200', lineHeight: 1.5 }}>
                近期有 <strong>{belowAvgCount}</strong> 次操作超出历史平均时长。建议核查是否存在操作不熟练、步序跳过或设备响应延迟等问题，并结合操作记录详情进行溯源分析。
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

function OverviewPage({ role, plans, onPage }: { role: 'engineer' | 'supervisor' | 'manager'; plans?: Record<string, Plan[]>; onPage?: (p: string) => void }) {
  if (role === 'manager') {
    return <ManagerOverviewPage plans={plans} onPage={onPage} />
  }

  const totalPlans = plans ? Object.values(plans).reduce((s, arr) => s + arr.length, 0) : 0
  const enabledPlans = plans ? Object.values(plans).reduce((s, arr) => s + arr.filter(p => p.status === 'enabled').length, 0) : 0
  const recentRecords = OP_RECORDS.slice(0, 5)
  const normalRate = Math.round((OP_RECORDS.filter(r => r.phase === 'done').length / OP_RECORDS.length) * 100)
  const avgDur = Math.round(OP_RECORDS.reduce((s, r) => s + r.duration, 0) / OP_RECORDS.length)
  const pendingReset = OP_RECORDS.filter(r => r.phase === 'pending-reset').length

  const card = (label: string, value: string | number, unit: string, sub?: string, accent = '#171A1E') => (
    <KpiCard key={label} label={label} value={value} unit={unit} sub={sub} accent={accent} />
  )

  const Delta = ({ v, reverse = false }: { v: number; reverse?: boolean }) => {
    const good = reverse ? v <= 0 : v >= 0
    const color = v === 0 ? '#9FA6AF' : good ? '#237D17' : '#D93838'
    return (
      <span style={{ fontSize: 10, color, fontWeight: 600, fontFamily: '"Inter Tight", sans-serif' }}>
        {v > 0 ? '▲' : v < 0 ? '▼' : '–'} {Math.abs(v)}
      </span>
    )
  }

  const MiniBar = ({ pct, color, std }: { pct: number; color: string; std?: number }) => (
    <div style={{ flex: 1, height: 6, background: '#F1F3F6', borderRadius: 3, position: 'relative', overflow: 'visible' }}>
      <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 3, transition: 'width 400ms ease' }} />
      {std !== undefined && (
        <div style={{ position: 'absolute', top: -3, left: `${Math.min(std, 100)}%`, width: 1.5, height: 12, background: '#9FA6AF', borderRadius: 1 }} />
      )}
    </div>
  )

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Welcome banner */}
      <div style={{ background: 'linear-gradient(135deg, #004B8D 0%, #005A9B 100%)', borderRadius: 14, padding: '20px 24px', color: '#fff', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
            {role === 'engineer' ? '工艺工程师' : role === 'supervisor' ? '班长' : '装置经理'} · 总览
          </div>
          <div style={{ fontSize: 13, opacity: 0.75 }}>XX化工有限公司 · DCS 预案管理平台</div>
        </div>
        <div style={{ textAlign: 'right', opacity: 0.7 }}>
          <div style={{ fontSize: 11 }}>今日日期</div>
          <div style={{ fontSize: 14, fontWeight: 600, fontFamily: '"Inter Tight", monospace' }}>2026-08-31</div>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'flex', gap: 12 }}>
        {role === 'engineer' && <>
          {card('已编制预案数', totalPlans, '条', '含草稿与启用')}
          {card('已启用预案', enabledPlans, '条', `占比 ${Math.round(enabledPlans / Math.max(totalPlans, 1) * 100)}%`, '#237D17')}
          {card('本月知识库新增', 4, '篇', '文档 2 · 规程 2')}
          {card('报警优先级变更', 1, '次', '本月最近更新')}
        </>}
        {role === 'supervisor' && <>
          {card('本月操作记录', OP_RECORDS.length, '条', '含全部状态', '#004B8D')}
          {card('正常完成率', normalRate, '%', '已完成/总记录', normalRate >= 80 ? '#237D17' : '#F28C28')}
          {card('平均操作时长', avgDur, 'min', '基准 25 min', avgDur > 25 ? '#F28C28' : '#237D17')}
          {card('待复位预案', pendingReset, '条', '需手动复位', pendingReset > 0 ? '#F28C28' : '#237D17')}
        </>}
      </div>

      {/* Quick links (engineer) */}
      {role === 'engineer' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid rgba(96,108,122,0.12)', boxShadow: '0 4px 12px rgba(27,39,52,0.06)', padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#171A1E', marginBottom: 12 }}>快捷入口</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { key: 'op-records',     icon: <IconRecords />, label: '操作记录' },
              { key: 'plan-manage',    icon: <IconPlan />,    label: '预案管理' },
              { key: 'alarm-priority', icon: <IconAlarmPri />, label: '报警矩阵' },
              { key: 'knowledge-base', icon: <IconBook />,    label: '知识库' },
            ].map(({ key, icon, label }) => (
              <button key={key} onClick={() => onPage?.(key)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 8px', border: '1px solid #E0E4E9', borderRadius: 10, background: '#F7F8FA', cursor: 'pointer', transition: 'all 100ms', color: '#515760' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#EEF5FB'; e.currentTarget.style.borderColor = '#82B9DD'; e.currentTarget.style.color = '#004B8D' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#F7F8FA'; e.currentTarget.style.borderColor = '#E0E4E9'; e.currentTarget.style.color = '#515760' }}
              >
                {icon}
                <span style={{ fontSize: 12, fontWeight: 500 }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent records (supervisor) */}
      {role === 'supervisor' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid rgba(96,108,122,0.12)', boxShadow: '0 4px 12px rgba(27,39,52,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #E0E4E9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#171A1E' }}>最近操作记录</span>
            <button onClick={() => onPage?.('op-records')} style={{ fontSize: 12, color: '#004B8D', background: 'none', border: 'none', cursor: 'pointer' }}>查看全部 →</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ background: '#F1F3F6' }}>
              {['预案名称', '执行人', '开始时间', '耗时', '状态'].map(h => (
                <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#515760', borderBottom: '1px solid #CDD2D9' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {recentRecords.map(r => {
                const phase = r.phase as string
                const statusLabel = phase === 'completed' ? '已完成' : phase === 'pending-reset' ? '待复位' : phase === 'pending-action' ? '待处置' : '手动结束'
                const statusColor = phase === 'completed' ? '#237D17' : phase === 'pending-reset' ? '#F28C28' : '#D93838'
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid #E0E4E9' }} onMouseEnter={e => (e.currentTarget.style.background = '#F7F8FA')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '10px 14px', fontWeight: 500, color: '#171A1E' }}>{r.plan}</td>
                    <td style={{ padding: '10px 14px', color: '#515760' }}>{r.operator}</td>
                    <td style={{ padding: '10px 14px', color: '#747A82', fontFamily: '"Inter Tight", sans-serif', fontSize: 12 }}>{r.date}</td>
                    <td style={{ padding: '10px 14px', color: '#515760', fontFamily: '"Inter Tight", sans-serif' }}>{r.duration} min</td>
                    <td style={{ padding: '10px 14px' }}><span style={{ fontSize: 11, fontWeight: 600, color: statusColor, background: `${statusColor}18`, padding: '2px 8px', borderRadius: 999 }}>{statusLabel}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const MGR_NAV: NavItem[] = [
  { key: 'overview',        label: '总览',         sub: '数据看板 · 快捷入口',   icon: <IconHome /> },
  { key: 'device-monitor', label: '装置预案监控', sub: '触发 KPI · 工段频率',    icon: <IconMonitor /> },
  { key: 'section-monitor', label: '工段预案监控', sub: '执行分析 · 历史事件',   icon: <IconSection /> },
  { key: 'plan-manage',     label: '预案管理',     sub: '组态 · 启用 · 版本',    icon: <IconBook /> },
  { key: 'hazard-manage',   label: '隐患管理',     sub: '登记 · 预案关联 · 触发', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
  { key: 'op-records',      label: '操作记录',     sub: '历史执行 · 分析对比',   icon: <IconRecords /> },
]

function ManagerView({ sections, plans, setPlans, configPlan, setConfigPlan, matrix, onActivate }: {
  sections: string[]
  plans: Record<string, Plan[]>
  setPlans: React.Dispatch<React.SetStateAction<Record<string, Plan[]>>>
  configPlan: string | null
  setConfigPlan: (p: string | null) => void
  matrix: AlarmPriority[]
  onActivate?: (plan: string) => void
}) {
  const [page, setPage] = useState<ManagerPage | 'op-records' | 'overview'>('overview')

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      <SceneSidebar nav={MGR_NAV} page={configPlan ? 'plan-manage' : page} onPage={(p) => { setPage(p as ManagerPage | 'op-records' | 'overview'); if (p !== 'plan-manage') setConfigPlan(null) }} roleLabel="装置经理工作台" />
      <div style={{ flex: 1, overflow: 'hidden', background: '#E9EDF2', display: 'flex', flexDirection: 'column' }}>
        {configPlan ? (
          <div style={{ flex: 1, background: '#fff', overflow: 'hidden' }}>
            <ConfigPanel planName={configPlan} onClose={() => setConfigPlan(null)} />
          </div>
        ) : (
          <>
            {page === 'overview'        && <OverviewPage role="manager" plans={plans} onPage={(p) => setPage(p as ManagerPage | 'op-records' | 'overview')} />}
            {page === 'device-monitor'  && <DeviceMonitorPage />}
            {page === 'section-monitor' && <SectionMonitorPage />}
            {page === 'plan-manage'     && <PlanManagePage sections={sections} plans={plans} setPlans={setPlans} setConfigPlan={setConfigPlan} matrix={matrix} />}
            {page === 'hazard-manage'   && <HazardManagePage />}
            {page === 'op-records'      && <OperationRecordsPage onActivate={onActivate} />}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Plan History Sub-page ────────────────────────────────────────────────────

function PlanHistoryPage({ planName, onBack }: { planName: string; onBack: () => void }) {
  const records = OP_RECORDS.filter((r) => r.plan.includes(planName.split(' ')[0]) || r.plan === planName)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const phaseLabel = (p: OpRecord['phase']) => ({ completed: '正常完成', 'pending-reset': '待复位', 'manually-ended': '手动结束', 'pending-action': '待处理' }[p])
  const phaseColor = (p: OpRecord['phase']) => ({ completed: '#237D17', 'pending-reset': '#8B6200', 'manually-ended': '#747A82', 'pending-action': '#004B8D' }[p])

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#E9EDF2', overflow: 'hidden' }}>
      <div style={{ padding: '12px 20px', background: '#fff', borderBottom: '1px solid #E0E4E9', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ width: 32, height: 32, border: '1px solid #CDD2D9', borderRadius: 7, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#515760' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#171A1E' }}>历史执行记录</div>
          <div style={{ fontSize: 11, color: '#747A82', marginTop: 1 }}>{planName}</div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {records.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9FA6AF', fontSize: 13, paddingTop: 60 }}>暂无历史执行记录</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {records.map((rec) => {
              const expanded = expandedId === rec.id
              const stdDur = rec.avgDuration
              return (
                <div key={rec.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid rgba(96,108,122,0.13)', boxShadow: '0 4px 12px rgba(27,39,52,0.05)', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 100px 120px', alignItems: 'center', padding: '12px 16px', gap: 12 }}>
                    <span style={{ fontSize: 12, color: '#747A82', fontFamily: '"JetBrains Mono", monospace' }}>{rec.date}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#171A1E' }}>{rec.operator}</span>
                    <span style={{ fontSize: 12, color: '#515760' }}>{rec.duration} min</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: phaseColor(rec.phase) + '18', color: phaseColor(rec.phase), fontWeight: 500, width: 'max-content' }}>{phaseLabel(rec.phase)}</span>
                    <button onClick={() => setExpandedId(expanded ? null : rec.id)} style={{ border: '1px solid #CDD2D9', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 11, color: '#515760', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
                      偏差分析 {expanded ? '▲' : '▼'}
                    </button>
                  </div>
                  {expanded && (
                    <div style={{ borderTop: '1px solid #E0E4E9', padding: 14 }}>
                      <div style={{ fontSize: 12, color: '#515760', background: '#F5F9FE', border: '1px solid rgba(0,75,141,0.12)', borderRadius: 8, padding: '8px 12px', marginBottom: 10, lineHeight: 1.7 }}>
                        本次执行共 {rec.totalSteps} 步，正常完成 {rec.doneSteps} 步，偏差 {rec.totalSteps - rec.doneSteps} 步。
                        耗时 {rec.duration} min，标准 {stdDur} min，{rec.duration <= stdDur ? `提前 ${stdDur - rec.duration} min 完成` : `超时 ${rec.duration - stdDur} min`}。
                      </div>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                          <thead>
                            <tr style={{ background: '#F1F3F6' }}>
                              {['步序', '操作内容', '实际完成时刻', '标准用时', '偏差'].map((h) => (
                                <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontWeight: 600, color: '#515760', borderBottom: '1px solid #CDD2D9', whiteSpace: 'nowrap' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {rec.steps.map((step, si) => {
                              const stdMin = 3 + (si % 4)
                              const badge = si % 5 === 0 ? { label: '超时', color: '#F28C28', bg: '#FEF3E8' } : { label: '正常', color: '#237D17', bg: '#EFF9EC' }
                              return (
                                <tr key={step.seq} style={{ borderBottom: '1px solid #E9EDF2' }}>
                                  <td style={{ padding: '7px 12px', color: '#9FA6AF', fontWeight: 600, fontFamily: '"Inter Tight", sans-serif' }}>{step.seq}</td>
                                  <td style={{ padding: '7px 12px', color: '#515760', maxWidth: 260 }}>{step.content}</td>
                                  <td style={{ padding: '7px 12px', color: '#747A82', fontFamily: '"JetBrains Mono", monospace' }}>{step.time}</td>
                                  <td style={{ padding: '7px 12px', color: '#747A82' }}>{stdMin} min</td>
                                  <td style={{ padding: '7px 12px' }}>
                                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, background: badge.bg, color: badge.color, fontWeight: 500 }}>{badge.label}</span>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Engineer & Supervisor plan management panel ──────────────────────────────

function PlanManagementPanel({ role, sections, plans, setPlans, configPlan, setConfigPlan, matrix }: {
  role: 'engineer' | 'supervisor'
  sections: string[]
  plans: Record<string, Plan[]>
  setPlans: React.Dispatch<React.SetStateAction<Record<string, Plan[]>>>
  configPlan: string | null
  setConfigPlan: (p: string | null) => void
  matrix: AlarmPriority[]
}) {
  const [selectedSection, setSelectedSection] = useState(sections[0] ?? '')
  const [viewPlan,        setViewPlan]        = useState<string | null>(null)
  const [viewHistory,     setViewHistory]     = useState<string | null>(null)

  // resolve device key from tree selection
  const resolvedDevice = selectedSection === '全部' ? null
    : selectedSection.includes('::') ? selectedSection.split('::')[0]
    : selectedSection
  const currentPlans = resolvedDevice ? (plans[resolvedDevice] ?? []) : Object.values(plans).flat()

  const handleToggle = (planId: string) => {
    setPlans((prev) => {
      const updated = { ...prev }
      const devKey = resolvedDevice ?? Object.keys(prev).find(k => (prev[k] ?? []).some(p => p.id === planId)) ?? ''
      updated[devKey] = (updated[devKey] ?? []).map((p) => {
        if (p.id !== planId) return p
        return { ...p, status: p.status === 'enabled' ? ('disabled' as const) : ('enabled' as const) }
      })
      return updated
    })
  }

  const handlePriorityChange = (planId: string, priorityId: string) => {
    setPlans((prev) => {
      const updated = { ...prev }
      const devKey = resolvedDevice ?? Object.keys(prev).find(k => (prev[k] ?? []).some(p => p.id === planId)) ?? ''
      updated[devKey] = (updated[devKey] ?? []).map((p) =>
        p.id !== planId ? p : { ...p, priority: priorityId }
      )
      return updated
    })
  }

  if (viewHistory) {
    return <PlanHistoryPage planName={viewHistory} onBack={() => setViewHistory(null)} />
  }

  if (configPlan) {
    const editingPlan = Object.values(plans).flat().find((p) => p.name === configPlan)
    return (
      <div style={{ flex: 1, background: '#fff', overflow: 'hidden' }}>
        <ConfigPanel
          planName={configPlan}
          onClose={() => setConfigPlan(null)}
          matrix={matrix}
          priority={editingPlan?.priority}
          onPriorityChange={(v) => { if (editingPlan) handlePriorityChange(editingPlan.id, v) }}
        />
      </div>
    )
  }

  // ── plan list filter state ──
  const [planSearch,     setPlanSearch]     = useState('')
  const [filterStatus,   setFilterStatus]   = useState<'all' | 'enabled' | 'disabled' | 'draft'>('all')
  const [filterHazard,   setFilterHazard]   = useState<'all' | 'linked' | 'unlinked'>('all')
  // ── asset tree state ──
  const [treeExpanded, setTreeExpanded] = useState<Set<string>>(new Set(HAZARD_ASSET_TREE.map(d => d.id)))

  // map plan name → linked hazard name (from INIT_HAZARDS)
  const planHazardMap = useMemo(() => {
    const m: Record<string, string> = {}
    INIT_HAZARDS.forEach(h => { if (h.linkedPlan) m[h.linkedPlan] = h.name })
    return m
  }, [])

  const filteredPlans = useMemo(() => currentPlans.filter(p => {
    if (planSearch.trim() && !p.name.includes(planSearch.trim())) return false
    if (filterStatus !== 'all' && p.status !== filterStatus) return false
    if (filterHazard === 'linked'   && !planHazardMap[p.name]) return false
    if (filterHazard === 'unlinked' && !!planHazardMap[p.name]) return false
    return true
  }), [currentPlans, planSearch, filterStatus, filterHazard, planHazardMap])

  const PlanChip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button onClick={onClick} style={{ padding: '3px 9px', border: `1px solid ${active ? '#004B8D' : '#CDD2D9'}`, borderRadius: 999, fontSize: 11, fontWeight: active ? 600 : 400, background: active ? '#EEF5FB' : '#fff', color: active ? '#004B8D' : '#515760', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 80ms' }}>{label}</button>
  )

  return (
    <>
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', gap: 12, padding: 12, background: '#E9EDF2' }}>

      {/* ── Asset tree left panel ── */}
      <div style={{ width: 220, flexShrink: 0, background: '#fff', borderRadius: 12, border: '1px solid rgba(96,108,122,0.14)', boxShadow: '0 8px 24px rgba(27,39,52,0.07)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid #E0E4E9', flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#515760', letterSpacing: '0.07em', textTransform: 'uppercase' }}>资产层级</div>
          <div style={{ fontSize: 10, color: '#9FA6AF', marginTop: 2 }}>装置 · 工段</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
          {/* "全部" root */}
          <button
            onClick={() => setSelectedSection('全部')}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 7, padding: '8px 12px', border: 'none', borderLeft: `3px solid ${selectedSection === '全部' ? '#004B8D' : 'transparent'}`, background: selectedSection === '全部' ? 'rgba(0,75,141,0.07)' : 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'all 100ms' }}
            onMouseEnter={e => { if (selectedSection !== '全部') e.currentTarget.style.background = 'rgba(0,0,0,0.03)' }}
            onMouseLeave={e => { if (selectedSection !== '全部') e.currentTarget.style.background = 'transparent' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={selectedSection === '全部' ? '#004B8D' : '#9FA6AF'} strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            <span style={{ flex: 1, fontSize: 12, fontWeight: selectedSection === '全部' ? 700 : 500, color: selectedSection === '全部' ? '#004B8D' : '#30353B' }}>全部</span>
            <span style={{ fontSize: 10, fontFamily: '"Inter Tight", sans-serif', color: selectedSection === '全部' ? '#004B8D' : '#9FA6AF', background: selectedSection === '全部' ? 'rgba(0,75,141,0.12)' : '#F1F3F6', padding: '1px 6px', borderRadius: 999, fontWeight: 600 }}>
              {Object.values(plans).flat().length}
            </span>
          </button>

          {HAZARD_ASSET_TREE.map(device => {
            const devPlans = plans[device.name] ?? []
            const isDevSelected = selectedSection === device.name
            const expanded = treeExpanded.has(device.id)
            return (
              <div key={device.id}>
                {/* Device row */}
                <div style={{ display: 'flex', alignItems: 'center', borderLeft: `3px solid ${isDevSelected ? '#004B8D' : 'transparent'}`, background: isDevSelected ? 'rgba(0,75,141,0.07)' : 'transparent', transition: 'all 100ms' }}>
                  <button
                    onClick={() => setTreeExpanded(prev => { const s = new Set(prev); s.has(device.id) ? s.delete(device.id) : s.add(device.id); return s })}
                    style={{ width: 28, height: 36, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9FA6AF', paddingLeft: 8, flexShrink: 0 }}
                  >
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 150ms ease' }}><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                  <button
                    onClick={() => setSelectedSection(device.name)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px 8px 2px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
                    onMouseEnter={e => { if (!isDevSelected) e.currentTarget.parentElement!.style.background = 'rgba(0,0,0,0.03)' }}
                    onMouseLeave={e => { if (!isDevSelected) e.currentTarget.parentElement!.style.background = 'transparent' }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={isDevSelected ? '#004B8D' : '#747A82'} strokeWidth="1.8" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    <span style={{ flex: 1, fontSize: 12, fontWeight: isDevSelected ? 700 : 600, color: isDevSelected ? '#004B8D' : '#171A1E' }}>{device.name}</span>
                    <span style={{ fontSize: 10, fontFamily: '"Inter Tight", sans-serif', color: isDevSelected ? '#004B8D' : '#9FA6AF', background: isDevSelected ? 'rgba(0,75,141,0.12)' : '#F1F3F6', padding: '1px 5px', borderRadius: 999, fontWeight: 600 }}>{devPlans.length}</span>
                  </button>
                </div>
                {/* Unit sub-rows */}
                {expanded && device.units.map(unit => {
                  const unitKey = `${device.name}::${unit.name}`
                  const isUnitSelected = selectedSection === unitKey
                  return (
                    <button key={unit.id}
                      onClick={() => setSelectedSection(unitKey)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px 6px 36px', border: 'none', borderLeft: `3px solid ${isUnitSelected ? '#82B9DD' : 'transparent'}`, background: isUnitSelected ? 'rgba(0,75,141,0.05)' : 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'all 100ms' }}
                      onMouseEnter={e => { if (!isUnitSelected) e.currentTarget.style.background = 'rgba(0,0,0,0.03)' }}
                      onMouseLeave={e => { if (!isUnitSelected) e.currentTarget.style.background = 'transparent' }}
                    >
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: isUnitSelected ? '#004B8D' : '#CDD2D9', flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 11, fontWeight: isUnitSelected ? 600 : 400, color: isUnitSelected ? '#004B8D' : '#515760' }}>{unit.name}</span>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
        {/* Stats footer */}
        <div style={{ padding: '10px 12px', borderTop: '1px solid #E0E4E9', flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: '#9FA6AF', marginBottom: 6 }}>全厂预案概况</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ flex: 1, textAlign: 'center', padding: '5px 0', borderRadius: 6, background: '#EFF9EC' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#237D17', fontFamily: '"Inter Tight", sans-serif' }}>
                {Object.values(plans).flat().filter(p => p.status === 'enabled').length}
              </div>
              <div style={{ fontSize: 9, color: '#39C523' }}>已启用</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: '5px 0', borderRadius: 6, background: '#F1F3F6' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#515760', fontFamily: '"Inter Tight", sans-serif' }}>
                {Object.values(plans).flat().filter(p => p.status === 'draft').length}
              </div>
              <div style={{ fontSize: 9, color: '#747A82' }}>草稿</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Plan table right panel ── */}
      {(() => {
        // resolve selected device from tree node
        const isAll = selectedSection === '全部'
        const isUnit = selectedSection.includes('::')
        const displayDevice = isAll ? '全部' : isUnit ? selectedSection.split('::')[0] : selectedSection
        const displayUnit   = isUnit ? selectedSection.split('::')[1] : null
        const displayPlans  = isAll
          ? Object.values(plans).flat()
          : (plans[displayDevice] ?? [])

        const finalPlans = filteredPlans.filter(p =>
          isAll ? true : displayPlans.some(dp => dp.id === p.id)
        )

        // recompute filtered for current device scope
        const scopedFiltered = displayPlans.filter(p => {
          if (planSearch.trim() && !p.name.includes(planSearch.trim())) return false
          if (filterStatus !== 'all' && p.status !== filterStatus) return false
          if (filterHazard === 'linked'   && !planHazardMap[p.name]) return false
          if (filterHazard === 'unlinked' && !!planHazardMap[p.name]) return false
          return true
        })
        void finalPlans

        return (
          <div style={{ flex: 1, background: '#fff', borderRadius: 12, border: '1px solid rgba(96,108,122,0.14)', boxShadow: '0 8px 24px rgba(27,39,52,0.07)', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
            {/* Header */}
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #E0E4E9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexShrink: 0 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#9FA6AF', marginBottom: 2 }}>
                  <span>预案管理</span>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                  <span style={{ color: '#004B8D', fontWeight: 600 }}>{isAll ? '全部' : displayUnit ? `${displayDevice} › ${displayUnit}` : displayDevice}</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#171A1E' }}>
                  {isAll ? '全厂预案台账' : displayUnit ? `${displayUnit} · 预案列表` : `${displayDevice} · 预案列表`}
                </span>
                <span style={{ marginLeft: 8, fontSize: 12, color: '#747A82' }}>显示 {scopedFiltered.length} / {displayPlans.length} 条</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(displayPlans, null, 2)], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a'); a.href = url; a.download = `${displayDevice}-预案.json`; a.click()
                    URL.revokeObjectURL(url)
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', border: '1px solid #CDD2D9', borderRadius: 6, background: '#fff', color: '#515760', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  批量导出
                </button>
                {role === 'engineer' && (
                  <button style={{ padding: '5px 14px', border: 'none', borderRadius: 6, background: '#004B8D', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ 新增预案</button>
                )}
              </div>
            </div>

            {/* Filter bar */}
            <div style={{ padding: '8px 16px', borderBottom: '1px solid #E0E4E9', background: '#FAFBFC', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flexShrink: 0 }}>
              <div style={{ position: 'relative' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9FA6AF" strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input
                  value={planSearch}
                  onChange={e => setPlanSearch(e.target.value)}
                  placeholder="搜索预案名称…"
                  style={{ paddingLeft: 26, paddingRight: 8, paddingTop: 4, paddingBottom: 4, border: '1px solid #CDD2D9', borderRadius: 6, fontSize: 11, width: 180, outline: 'none', fontFamily: '"Noto Sans SC", sans-serif', color: '#171A1E', transition: 'border-color 120ms' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#004B8D')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#CDD2D9')}
                />
                {planSearch && <button onClick={() => setPlanSearch('')} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#9FA6AF', fontSize: 13, padding: 0, lineHeight: 1 }}>×</button>}
              </div>
              <div style={{ width: 1, background: '#E0E4E9', height: 16 }} />
              <span style={{ fontSize: 11, color: '#747A82' }}>状态</span>
              <PlanChip label="全部"   active={filterStatus === 'all'}      onClick={() => setFilterStatus('all')} />
              <PlanChip label="已启用" active={filterStatus === 'enabled'}  onClick={() => setFilterStatus('enabled')} />
              <PlanChip label="已禁用" active={filterStatus === 'disabled'} onClick={() => setFilterStatus('disabled')} />
              <PlanChip label="草稿"   active={filterStatus === 'draft'}    onClick={() => setFilterStatus('draft')} />
              <div style={{ width: 1, background: '#E0E4E9', height: 16 }} />
              <span style={{ fontSize: 11, color: '#747A82' }}>隐患关联</span>
              <PlanChip label="全部"   active={filterHazard === 'all'}      onClick={() => setFilterHazard('all')} />
              <PlanChip label="已关联" active={filterHazard === 'linked'}   onClick={() => setFilterHazard('linked')} />
              <PlanChip label="未关联" active={filterHazard === 'unlinked'} onClick={() => setFilterHazard('unlinked')} />
            </div>

            {/* Table */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F1F3F6', position: 'sticky', top: 0, zIndex: 1 }}>
                    {['编号', '预案名称', '状态', '启用状态', '关联隐患', '更新日期', '操作'].map((h, i) => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: i === 6 ? 'right' : 'left', color: '#515760', fontWeight: 600, fontSize: 12, borderBottom: '1px solid #CDD2D9', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scopedFiltered.map((plan) => {
                    const hazardName = planHazardMap[plan.name]
                    return (
                      <tr key={plan.id}
                        onClick={() => setViewPlan(plan.name)}
                        style={{ borderBottom: '1px solid #E0E4E9', transition: 'background 80ms ease', cursor: 'pointer' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F0F6FF')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '10px 14px', fontFamily: '"Inter Tight", sans-serif', fontSize: 11, fontWeight: 600, color: '#747A82', whiteSpace: 'nowrap' }}>{plan.id.toUpperCase()}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 500, color: '#171A1E' }}>{plan.name}</td>
                        <td style={{ padding: '12px 14px' }}><StatusTag status={plan.status} /></td>
                        <td style={{ padding: '12px 14px' }} onClick={(e) => e.stopPropagation()}>
                          <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', gap: 6, userSelect: 'none' }}>
                            <span style={{ position: 'relative', display: 'inline-block', width: 36, height: 20 }}>
                              <input type="checkbox" checked={plan.status === 'enabled'} onChange={() => handleToggle(plan.id)} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
                              <span style={{ position: 'absolute', inset: 0, borderRadius: 10, background: plan.status === 'enabled' ? '#39C523' : '#CDD2D9', transition: 'background 200ms ease' }} />
                              <span style={{ position: 'absolute', top: 2, left: plan.status === 'enabled' ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 200ms ease' }} />
                            </span>
                            <span style={{ fontSize: 11, color: plan.status === 'enabled' ? '#237D17' : '#9FA6AF' }}>{plan.status === 'enabled' ? '已启用' : '已禁用'}</span>
                          </label>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          {hazardName ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999, background: '#FEF3E8', color: '#7A4000', fontSize: 11, fontWeight: 500, border: '1px solid rgba(242,140,40,0.3)' }}>
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
                              {hazardName}
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, color: '#C4CAD2', fontStyle: 'italic' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#747A82', fontSize: 12, fontFamily: '"Inter Tight", sans-serif' }}>{plan.updatedAt}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            {role === 'engineer' ? (
                              <>
                                <ActionBtn label="编辑" onClick={() => setConfigPlan(plan.name)} primary />
                                <ActionBtn label="历史详情" onClick={() => setViewHistory(plan.name)} />
                              </>
                            ) : (
                              <ActionBtn label="历史详情" onClick={() => setViewHistory(plan.name)} />
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {scopedFiltered.length === 0 && (
                    <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#9FA6AF', fontSize: 13 }}>
                      {planSearch ? `未找到包含"${planSearch}"的预案` : '暂无预案'}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      })()}
    </div>
    {viewPlan && (
      <ViewDrawer plan={viewPlan} onClose={() => setViewPlan(null)} onActivate={() => setViewPlan(null)} />
    )}
    </>
  )
}

// ─── Alarm Priority Matrix Page ───────────────────────────────────────────────

const PRESET_COLORS = ['#D93838', '#F28C28', '#F2B544', '#39C523', '#82B9DD', '#9B59B6', '#1ABC9C', '#E91E63', '#3498DB', '#FF6B6B']

function AlarmPriorityMatrixPage({ matrix, setMatrix }: { matrix: AlarmPriority[]; setMatrix: React.Dispatch<React.SetStateAction<AlarmPriority[]>> }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  const startEdit = (p: AlarmPriority) => { setEditingId(p.id); setEditName(p.name); setEditColor(p.color) }
  const commitEdit = () => {
    if (!editingId) return
    setMatrix((prev) => prev.map((p) => p.id !== editingId ? p : { ...p, name: editName.trim() || p.name, color: editColor }))
    setEditingId(null)
  }
  const addRow = () => {
    const id = `p${Date.now()}`
    const color = PRESET_COLORS[matrix.length % PRESET_COLORS.length]
    setMatrix((prev) => [...prev, { id, name: `P${prev.length + 1}`, color }])
    setEditingId(id)
    setEditName(`P${matrix.length + 1}`)
    setEditColor(color)
  }
  const removeRow = (id: string) => {
    if (matrix.length <= 1) return
    setMatrix((prev) => prev.filter((p) => p.id !== id))
    if (editingId === id) setEditingId(null)
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#E9EDF2' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #E0E4E9', padding: '14px 20px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#171A1E' }}>报警优先级矩阵</div>
          <div style={{ fontSize: 12, color: '#747A82', marginTop: 2 }}>定义优先级名称与对应颜色，预案管理中可引用</div>
        </div>
        <button onClick={addRow} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: 'none', borderRadius: 7, background: '#004B8D', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> 新增优先级
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid rgba(96,108,122,0.14)', boxShadow: '0 4px 16px rgba(27,39,52,0.06)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '48px 2fr 2fr 200px 80px', padding: '10px 16px', background: '#F1F3F6', borderBottom: '1px solid #CDD2D9', fontSize: 11, fontWeight: 600, color: '#515760' }}>
            <span>序号</span><span>优先级名称</span><span>颜色</span><span>预览</span><span />
          </div>
          {matrix.map((p, idx) => {
            const isEditing = editingId === p.id
            return (
              <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '48px 2fr 2fr 200px 80px', padding: '10px 16px', borderBottom: '1px solid #E0E4E9', alignItems: 'center', background: isEditing ? '#F5F9FE' : 'transparent', transition: 'background 100ms' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#9FA6AF', fontFamily: '"Inter Tight", sans-serif' }}>{idx + 1}</span>
                {isEditing ? (
                  <>
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingId(null) }}
                      style={{ padding: '5px 8px', border: '1.5px solid #004B8D', borderRadius: 5, fontSize: 13, outline: 'none', fontFamily: '"Noto Sans SC", sans-serif', marginRight: 8 }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="color"
                          value={editColor}
                          onChange={(e) => setEditColor(e.target.value)}
                          style={{ width: 32, height: 28, border: '1px solid #CDD2D9', borderRadius: 4, cursor: 'pointer', padding: 2 }}
                        />
                        <span style={{ fontSize: 11, color: '#747A82', fontFamily: '"JetBrains Mono", monospace' }}>{editColor}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {PRESET_COLORS.map((c) => (
                          <button key={c} onClick={() => setEditColor(c)} style={{ width: 18, height: 18, borderRadius: 3, background: c, border: editColor === c ? '2px solid #171A1E' : '1.5px solid transparent', cursor: 'pointer', padding: 0 }} title={c} />
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#171A1E' }}>{p.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 20, height: 20, borderRadius: 4, background: p.color }} />
                      <span style={{ fontSize: 11, color: '#747A82', fontFamily: '"JetBrains Mono", monospace' }}>{p.color}</span>
                    </div>
                  </>
                )}
                <div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, background: p.color + '22', color: p.color, fontSize: 11, fontWeight: 600, border: `1px solid ${p.color}55` }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.color }} />{isEditing ? (editName || p.name) : p.name}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                  {isEditing ? (
                    <button onClick={commitEdit} style={{ width: 26, height: 26, border: 'none', borderRadius: 5, background: '#004B8D', color: '#fff', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</button>
                  ) : (
                    <>
                      <button onClick={() => startEdit(p)} style={{ width: 26, height: 26, border: '1px solid #CDD2D9', borderRadius: 5, background: '#fff', color: '#515760', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="编辑">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                      </button>
                      <button onClick={() => removeRow(p.id)} disabled={matrix.length <= 1} style={{ width: 26, height: 26, border: '1px solid #E8C0C0', borderRadius: 5, background: '#fff', color: matrix.length <= 1 ? '#CDD2D9' : '#A52727', fontSize: 14, cursor: matrix.length <= 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="删除">×</button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Hazard Management Page ───────────────────────────────────────────────────

interface HazardTrigger {
  seq: number; desc: string; judge: string; delay: string; changeRate: string
}

interface Hazard {
  id: string; name: string; device: string; unit: string
  linkedPlan: string | null; triggers: HazardTrigger[]
}

interface AssetUnit  { id: string; name: string }
interface AssetDevice { id: string; name: string; units: AssetUnit[] }

const HAZARD_ASSET_TREE: AssetDevice[] = [
  { id: 'gz', name: '气化装置', units: [
    { id: 'gza', name: '气化工段 A' },
    { id: 'gzb', name: '气化工段 B' },
    { id: 'lq',  name: '激冷工段'   },
  ]},
  { id: 'jc', name: '甲醇装置', units: [
    { id: 'hc', name: '合成工段' },
    { id: 'jl', name: '精馏工段' },
  ]},
]

const INIT_HAZARDS: Hazard[] = [
  { id: 'h01', name: '气化炉超温',         device: '气化装置', unit: '气化工段 A', linkedPlan: '06 紧急停车',           triggers: [{ seq: 1, desc: '气化炉出口温度高高', judge: '(*TI4101*>=1350)', delay: '3', changeRate: '' }] },
  { id: 'h02', name: '烧嘴压差异常波动',   device: '气化装置', unit: '气化工段 A', linkedPlan: '08 烧嘴压差波动',       triggers: [{ seq: 1, desc: '烧嘴差压突变', judge: '(*PDI4105*>=0.08)', delay: '2', changeRate: '0.01/min' }, { seq: 2, desc: '差压持续超限', judge: '(*PDI4105*>=0.12)', delay: '10', changeRate: '' }] },
  { id: 'h03', name: '激冷室底部堵渣',     device: '气化装置', unit: '激冷工段',   linkedPlan: '09 激冷室底部堵渣操作', triggers: [{ seq: 1, desc: '激冷室液位快速上升', judge: '(*LI4201*>=85)', delay: '5', changeRate: '2%/min' }] },
  { id: 'h04', name: '空分系统意外跳车',   device: '气化装置', unit: '气化工段 B', linkedPlan: '10 空分跳车应急',       triggers: [{ seq: 1, desc: '空分跳车联锁信号', judge: '(*MF_ASU_TRIP*=1)', delay: '0', changeRate: '' }] },
  { id: 'h05', name: '汽包液位低低',       device: '气化装置', unit: '气化工段 A', linkedPlan: null,                    triggers: [{ seq: 1, desc: '汽包液位低低联锁', judge: '(*LIC4205测量值*<=10)', delay: '2', changeRate: '' }] },
  { id: 'h06', name: '停电事故',           device: '气化装置', unit: '气化工段 B', linkedPlan: '05 停电应急',           triggers: [{ seq: 1, desc: '厂用电失电信号', judge: '(*MF_POWER_FAIL*=1)', delay: '0', changeRate: '' }] },
  { id: 'h07', name: '反应器床层温度超高', device: '甲醇装置', unit: '合成工段',   linkedPlan: '07 反应器床层温度高',   triggers: [{ seq: 1, desc: '床层温度超高高', judge: '(*TI4301*>=280)', delay: '3', changeRate: '5℃/min' }, { seq: 2, desc: '床层温差过大', judge: '(*TI4301*-*TI4305*>=60)', delay: '5', changeRate: '' }] },
  { id: 'h08', name: '汽包干烧',           device: '甲醇装置', unit: '合成工段',   linkedPlan: '09 汽包干烧紧急预案',   triggers: [{ seq: 1, desc: '汽包液位低低联锁', judge: '(*LIC4401测量值*<=5)', delay: '1', changeRate: '' }] },
  { id: 'h09', name: '压缩机突然停车',     device: '甲醇装置', unit: '合成工段',   linkedPlan: '05 压缩机跳停',         triggers: [{ seq: 1, desc: '压缩机跳车信号', judge: '(*MF_COMP_TRIP*=1)', delay: '0', changeRate: '' }, { seq: 2, desc: '出口压力骤降', judge: '(*PI4201*<=4.5)', delay: '3', changeRate: '0.5MPa/min' }] },
  { id: 'h10', name: '分离器液位超高',     device: '甲醇装置', unit: '精馏工段',   linkedPlan: null,                    triggers: [{ seq: 1, desc: '分离器液位高高', judge: '(*LI4201*>=90)', delay: '5', changeRate: '' }] },
  { id: 'h11', name: 'CO浓度超标',         device: '甲醇装置', unit: '精馏工段',   linkedPlan: null,                    triggers: [{ seq: 1, desc: '进塔气CO含量超标', judge: '(*AI4201B*>=0.8)', delay: '5', changeRate: '' }] },
]

const ALL_PLAN_NAMES = [
  '01 气化冷态开车', '02 气化停车', '03 气化热态开车', '05 停电应急', '06 紧急停车',
  '08 烧嘴压差波动', '09 激冷室底部堵渣操作', '10 空分跳车应急',
  '停车至热循环', '冷态开车', '05 压缩机跳停', '07 反应器床层温度高', '09 汽包干烧紧急预案', '汽包满水预案',
]

// selected node: 'all' | 'device:气化装置' | 'unit:气化工段 A'
type AssetNodeKey = string

function HazardManagePage() {
  const [hazards, setHazards] = useState<Hazard[]>(INIT_HAZARDS)
  const [selectedNode, setSelectedNode] = useState<AssetNodeKey>('all')
  const [expandedDevices, setExpandedDevices] = useState<Set<string>>(new Set(HAZARD_ASSET_TREE.map(d => d.id)))

  // search + filters
  const [searchText, setSearchText]   = useState('')
  const [filterPlan, setFilterPlan]   = useState<'all' | 'linked' | 'unlinked'>('all')
  const [filterTrig, setFilterTrig]   = useState<'all' | 'has' | 'none'>('all')

  // modal state
  const [editTarget,        setEditTarget]        = useState<Hazard | null>(null)
  const [detailTarget,      setDetailTarget]      = useState<Hazard | null>(null)
  const [editName,          setEditName]          = useState('')
  const [editPlan,          setEditPlan]          = useState('')
  const [editDevice,        setEditDevice]        = useState('')
  const [editUnit,          setEditUnit]          = useState('')
  const [detailTriggers,    setDetailTriggers]    = useState<HazardTrigger[]>([])
  const [selectedTriggerIdx,setSelectedTriggerIdx]= useState<number | null>(null)

  const openEdit = (h: Hazard) => {
    setEditTarget(h); setEditName(h.name); setEditPlan(h.linkedPlan ?? '')
    setEditDevice(h.device); setEditUnit(h.unit)
  }
  const saveEdit = () => {
    if (!editTarget) return
    setHazards(prev => prev.map(h => h.id === editTarget.id
      ? { ...h, name: editName.trim() || h.name, linkedPlan: editPlan || null, device: editDevice, unit: editUnit }
      : h))
    setEditTarget(null)
  }
  const openDetail = (h: Hazard) => { setDetailTarget(h); setDetailTriggers([...h.triggers]); setSelectedTriggerIdx(null) }
  const saveDetail = () => {
    if (!detailTarget) return
    setHazards(prev => prev.map(h => h.id === detailTarget.id ? { ...h, triggers: detailTriggers } : h))
    setDetailTarget(null)
  }
  const addTrigger = () => {
    const seq = detailTriggers.length + 1
    setDetailTriggers(prev => [...prev, { seq, desc: `新触发条件 ${seq}`, judge: '', delay: '', changeRate: '' }])
  }
  const toggleDevice = (id: string) => setExpandedDevices(prev => {
    const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s
  })

  // derive hazard count per node for badges
  const countFor = (key: AssetNodeKey) => {
    if (key === 'all') return hazards.length
    if (key.startsWith('device:')) return hazards.filter(h => h.device === key.slice(7)).length
    if (key.startsWith('unit:'))   return hazards.filter(h => h.unit   === key.slice(5)).length
    return 0
  }

  // apply tree selection + search + filter chips
  const filtered = useMemo(() => hazards.filter(h => {
    // tree scope
    if (selectedNode.startsWith('device:') && h.device !== selectedNode.slice(7)) return false
    if (selectedNode.startsWith('unit:')   && h.unit   !== selectedNode.slice(5))  return false
    // fuzzy search: name OR device OR unit OR linkedPlan
    if (searchText.trim()) {
      const q = searchText.trim()
      const hit = h.name.includes(q) || h.device.includes(q) || h.unit.includes(q) || (h.linkedPlan ?? '').includes(q)
      if (!hit) return false
    }
    // plan filter
    if (filterPlan === 'linked'   && !h.linkedPlan)  return false
    if (filterPlan === 'unlinked' && !!h.linkedPlan) return false
    // trigger filter
    if (filterTrig === 'has'  && h.triggers.length === 0) return false
    if (filterTrig === 'none' && h.triggers.length > 0)   return false
    return true
  }), [hazards, selectedNode, searchText, filterPlan, filterTrig])

  const totalLinked   = hazards.filter(h => !!h.linkedPlan).length
  const totalUnlinked = hazards.filter(h => !h.linkedPlan).length

  // breadcrumb label
  const breadcrumb = selectedNode === 'all' ? '全厂' :
    selectedNode.startsWith('device:') ? selectedNode.slice(7) :
    (() => {
      const unitName = selectedNode.slice(5)
      const dev = HAZARD_ASSET_TREE.find(d => d.units.some(u => u.name === unitName))
      return dev ? `${dev.name} › ${unitName}` : unitName
    })()

  // units for the edit device
  const editUnitOptions = HAZARD_ASSET_TREE.find(d => d.name === editDevice)?.units ?? []

  const ChipBtn = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button onClick={onClick} style={{ padding: '4px 11px', border: `1px solid ${active ? '#004B8D' : '#CDD2D9'}`, borderRadius: 999, fontSize: 11, fontWeight: active ? 600 : 400, background: active ? '#EEF5FB' : '#fff', color: active ? '#004B8D' : '#515760', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 80ms' }}>
      {label}
    </button>
  )

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: '#E9EDF2', position: 'relative' }}>

      {/* ── LEFT: asset tree ── */}
      <div style={{ width: 220, flexShrink: 0, background: '#fff', borderRight: '1px solid #E0E4E9', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Tree header */}
        <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid #E0E4E9', flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#515760', letterSpacing: '0.07em', textTransform: 'uppercase' }}>资产层级</div>
          <div style={{ fontSize: 10, color: '#9FA6AF', marginTop: 2 }}>装置 · 工段</div>
        </div>
        {/* Tree body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>

          {/* "全部" root */}
          <button
            onClick={() => setSelectedNode('all')}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', border: 'none', borderLeft: `3px solid ${selectedNode === 'all' ? '#004B8D' : 'transparent'}`, background: selectedNode === 'all' ? 'rgba(0,75,141,0.07)' : 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'all 100ms' }}
            onMouseEnter={e => { if (selectedNode !== 'all') e.currentTarget.style.background = 'rgba(0,0,0,0.03)' }}
            onMouseLeave={e => { if (selectedNode !== 'all') e.currentTarget.style.background = 'transparent' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={selectedNode === 'all' ? '#004B8D' : '#9FA6AF'} strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            <span style={{ flex: 1, fontSize: 12, fontWeight: selectedNode === 'all' ? 700 : 500, color: selectedNode === 'all' ? '#004B8D' : '#30353B' }}>全部</span>
            <span style={{ fontSize: 10, fontFamily: '"Inter Tight", sans-serif', color: selectedNode === 'all' ? '#004B8D' : '#9FA6AF', background: selectedNode === 'all' ? 'rgba(0,75,141,0.12)' : '#F1F3F6', padding: '1px 6px', borderRadius: 999, fontWeight: 600 }}>{hazards.length}</span>
          </button>

          {/* Devices + Units */}
          {HAZARD_ASSET_TREE.map(device => {
            const devKey  = `device:${device.name}`
            const devActive = selectedNode === devKey
            const expanded  = expandedDevices.has(device.id)
            const devCount  = countFor(devKey)

            return (
              <div key={device.id}>
                {/* Device row */}
                <div style={{ display: 'flex', alignItems: 'center', borderLeft: `3px solid ${devActive ? '#004B8D' : 'transparent'}`, background: devActive ? 'rgba(0,75,141,0.07)' : 'transparent', transition: 'all 100ms' }}>
                  <button
                    onClick={() => toggleDevice(device.id)}
                    style={{ width: 28, height: 36, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9FA6AF', flexShrink: 0, paddingLeft: 10 }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 150ms ease' }}>
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => setSelectedNode(devKey)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 7, padding: '8px 10px 8px 2px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
                    onMouseEnter={e => { if (!devActive) e.currentTarget.parentElement!.style.background = 'rgba(0,0,0,0.03)' }}
                    onMouseLeave={e => { if (!devActive) e.currentTarget.parentElement!.style.background = 'transparent' }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={devActive ? '#004B8D' : '#747A82'} strokeWidth="1.8" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    <span style={{ flex: 1, fontSize: 12, fontWeight: devActive ? 700 : 600, color: devActive ? '#004B8D' : '#171A1E' }}>{device.name}</span>
                    <span style={{ fontSize: 10, fontFamily: '"Inter Tight", sans-serif', color: devActive ? '#004B8D' : '#9FA6AF', background: devActive ? 'rgba(0,75,141,0.12)' : '#F1F3F6', padding: '1px 6px', borderRadius: 999, fontWeight: 600 }}>{devCount}</span>
                  </button>
                </div>

                {/* Unit rows */}
                {expanded && device.units.map(unit => {
                  const unitKey    = `unit:${unit.name}`
                  const unitActive = selectedNode === unitKey
                  const unitCount  = countFor(unitKey)
                  return (
                    <button
                      key={unit.id}
                      onClick={() => setSelectedNode(unitKey)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 7, padding: '7px 12px 7px 38px', border: 'none', borderLeft: `3px solid ${unitActive ? '#82B9DD' : 'transparent'}`, background: unitActive ? 'rgba(0,75,141,0.05)' : 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'all 100ms' }}
                      onMouseEnter={e => { if (!unitActive) e.currentTarget.style.background = 'rgba(0,0,0,0.03)' }}
                      onMouseLeave={e => { if (!unitActive) e.currentTarget.style.background = 'transparent' }}
                    >
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: unitActive ? '#004B8D' : '#CDD2D9', flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 11, fontWeight: unitActive ? 600 : 400, color: unitActive ? '#004B8D' : '#515760' }}>{unit.name}</span>
                      {unitCount > 0 && (
                        <span style={{ fontSize: 10, fontFamily: '"Inter Tight", sans-serif', color: unitActive ? '#004B8D' : '#9FA6AF', background: unitActive ? 'rgba(0,75,141,0.12)' : '#F1F3F6', padding: '1px 5px', borderRadius: 999, fontWeight: 600 }}>{unitCount}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Tree footer stats */}
        <div style={{ padding: '10px 14px', borderTop: '1px solid #E0E4E9', flexShrink: 0, display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, textAlign: 'center', padding: '5px 0', borderRadius: 6, background: '#EFF9EC' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#237D17', fontFamily: '"Inter Tight", sans-serif' }}>{totalLinked}</div>
            <div style={{ fontSize: 9, color: '#39C523' }}>已关联</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center', padding: '5px 0', borderRadius: 6, background: '#FEF3E8' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#7A4000', fontFamily: '"Inter Tight", sans-serif' }}>{totalUnlinked}</div>
            <div style={{ fontSize: 9, color: '#F28C28' }}>待关联</div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: config panel ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: '#fff', borderBottom: '1px solid #E0E4E9', padding: '12px 20px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Breadcrumb */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#9FA6AF', marginBottom: 3 }}>
              <span>隐患管理</span>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              <span style={{ color: '#004B8D', fontWeight: 600 }}>{breadcrumb}</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#171A1E' }}>
              {selectedNode === 'all' ? '全厂隐患台账' : breadcrumb + ' · 隐患台账'}
            </div>
          </div>
          <button
            onClick={() => {
              const defaultDevice = selectedNode.startsWith('device:') ? selectedNode.slice(7)
                : selectedNode.startsWith('unit:') ? (HAZARD_ASSET_TREE.find(d => d.units.some(u => u.name === selectedNode.slice(5)))?.name ?? '气化装置') : '气化装置'
              const defaultUnit = selectedNode.startsWith('unit:') ? selectedNode.slice(5)
                : HAZARD_ASSET_TREE.find(d => d.name === defaultDevice)?.units[0]?.name ?? ''
              const h: Hazard = { id: `h${Date.now()}`, name: '新隐患', device: defaultDevice, unit: defaultUnit, linkedPlan: null, triggers: [] }
              setHazards(prev => [...prev, h])
              openEdit(h)
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: 'none', borderRadius: 7, background: '#004B8D', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            新增隐患
          </button>
        </div>

        {/* Filter / search toolbar */}
        <div style={{ background: '#fff', borderBottom: '1px solid #E0E4E9', padding: '8px 20px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9FA6AF" strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="模糊搜索隐患名称、工段、预案…"
              style={{ paddingLeft: 28, paddingRight: 10, paddingTop: 5, paddingBottom: 5, border: '1px solid #CDD2D9', borderRadius: 6, fontSize: 12, width: 240, outline: 'none', fontFamily: '"Noto Sans SC", sans-serif', color: '#171A1E', transition: 'border-color 120ms' }}
              onFocus={e => (e.currentTarget.style.borderColor = '#004B8D')}
              onBlur={e => (e.currentTarget.style.borderColor = '#CDD2D9')}
            />
            {searchText && (
              <button onClick={() => setSearchText('')} style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#9FA6AF', padding: 0, lineHeight: 1, fontSize: 14 }}>×</button>
            )}
          </div>

          <div style={{ width: 1, background: '#E0E4E9', height: 18, flexShrink: 0 }} />

          <span style={{ fontSize: 11, color: '#747A82', whiteSpace: 'nowrap' }}>预案关联</span>
          <ChipBtn label="全部"   active={filterPlan === 'all'}     onClick={() => setFilterPlan('all')} />
          <ChipBtn label="已关联" active={filterPlan === 'linked'}   onClick={() => setFilterPlan('linked')} />
          <ChipBtn label="未关联" active={filterPlan === 'unlinked'} onClick={() => setFilterPlan('unlinked')} />

          <div style={{ width: 1, background: '#E0E4E9', height: 18, flexShrink: 0 }} />

          <span style={{ fontSize: 11, color: '#747A82', whiteSpace: 'nowrap' }}>触发条件</span>
          <ChipBtn label="全部"   active={filterTrig === 'all'}  onClick={() => setFilterTrig('all')} />
          <ChipBtn label="已配置" active={filterTrig === 'has'}  onClick={() => setFilterTrig('has')} />
          <ChipBtn label="未配置" active={filterTrig === 'none'} onClick={() => setFilterTrig('none')} />

          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: '#9FA6AF', whiteSpace: 'nowrap' }}>显示 {filtered.length} / {hazards.length} 条</span>
        </div>

        {/* Hazard table */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid rgba(96,108,122,0.13)', boxShadow: '0 4px 12px rgba(27,39,52,0.05)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F1F3F6' }}>
                  {['#', '隐患名称', '所属装置', '工段', '预案关联', '对应预案', '触发条件', '操作'].map(h => (
                    <th key={h} style={{ padding: '9px 12px', textAlign: 'left', color: '#515760', fontWeight: 600, fontSize: 11, borderBottom: '1px solid #CDD2D9', whiteSpace: 'nowrap', borderRight: '1px solid #E0E4E9' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((h, i) => (
                  <tr key={h.id}
                    style={{ borderBottom: '1px solid #E0E4E9', transition: 'background 80ms' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F7F8FA')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '10px 12px', borderRight: '1px solid #E0E4E9', color: '#C4CAD2', fontFamily: '"Inter Tight", sans-serif', fontWeight: 600, fontSize: 11, textAlign: 'center', width: 36 }}>{i + 1}</td>
                    <td style={{ padding: '10px 12px', borderRight: '1px solid #E0E4E9', fontWeight: 600, color: '#171A1E' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: h.linkedPlan ? '#39C523' : '#F28C28', flexShrink: 0 }} />
                        {searchText ? (
                          <span dangerouslySetInnerHTML={{ __html: h.name.replace(new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), m => `<mark style="background:#FFF3B0;color:#7A4000;border-radius:2px;padding:0 1px">${m}</mark>`) }} />
                        ) : h.name}
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', borderRight: '1px solid #E0E4E9' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 999, background: '#EEF5FB', color: '#004B8D', fontSize: 11, fontWeight: 500 }}>{h.device}</span>
                    </td>
                    <td style={{ padding: '10px 12px', borderRight: '1px solid #E0E4E9', fontSize: 11, color: '#515760' }}>{h.unit}</td>
                    <td style={{ padding: '10px 12px', borderRight: '1px solid #E0E4E9' }}>
                      {h.linkedPlan
                        ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, background: '#EFF9EC', color: '#237D17', fontSize: 11, fontWeight: 600, border: '1px solid rgba(57,197,35,0.3)' }}><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>已关联</span>
                        : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, background: '#FEF3E8', color: '#7A4000', fontSize: 11, border: '1px solid rgba(242,140,40,0.3)' }}><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>未关联</span>}
                    </td>
                    <td style={{ padding: '10px 12px', borderRight: '1px solid #E0E4E9', color: h.linkedPlan ? '#004B8D' : '#9FA6AF', fontSize: 11, fontStyle: h.linkedPlan ? 'normal' : 'italic', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {h.linkedPlan ?? '—'}
                    </td>
                    <td style={{ padding: '10px 12px', borderRight: '1px solid #E0E4E9', textAlign: 'center' }}>
                      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, background: h.triggers.length > 0 ? '#EEF5FB' : '#F1F3F6', color: h.triggers.length > 0 ? '#004B8D' : '#C4CAD2', fontSize: 11, fontWeight: 700, fontFamily: '"Inter Tight", sans-serif' }}>
                        {h.triggers.length}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        {[
                          { label: '编辑', icon: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>, onClick: () => openEdit(h) },
                          { label: '触发条件', icon: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>, onClick: () => openDetail(h) },
                        ].map(({ label, icon, onClick }) => (
                          <button key={label} onClick={onClick}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', border: '1px solid #CDD2D9', borderRadius: 5, background: '#fff', color: '#30353B', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 100ms' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#82B9DD'; e.currentTarget.style.color = '#004B8D' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#CDD2D9'; e.currentTarget.style.color = '#30353B' }}
                          >
                            {icon}{label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: '48px 0', textAlign: 'center', color: '#9FA6AF', fontSize: 13 }}>
                    {searchText ? `未找到包含"${searchText}"的隐患记录` : '当前节点暂无隐患记录'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Edit Modal ── */}
      {editTarget && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(23,26,30,0.45)' }}
          onClick={() => setEditTarget(null)}>
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 24px 64px rgba(20,34,48,0.24)', width: 480, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #E0E4E9', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: '#EEF5FB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#004B8D" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#171A1E' }}>编辑隐患配置</div>
                <div style={{ fontSize: 11, color: '#9FA6AF' }}>名称 · 归属资产 · 对应预案</div>
              </div>
              <button onClick={() => setEditTarget(null)} style={{ marginLeft: 'auto', width: 28, height: 28, border: '1px solid #E0E4E9', borderRadius: 7, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#747A82' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Name */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#515760', display: 'block', marginBottom: 5 }}>隐患名称 <span style={{ color: '#D93838' }}>*</span></label>
                <input autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                  placeholder="请输入隐患名称…"
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #CDD2D9', borderRadius: 7, fontSize: 13, outline: 'none', fontFamily: '"Noto Sans SC", sans-serif', boxSizing: 'border-box', transition: 'border-color 120ms', color: '#171A1E' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#004B8D')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#CDD2D9')} />
              </div>
              {/* Device + Unit row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#515760', display: 'block', marginBottom: 5 }}>所属装置</label>
                  <select value={editDevice} onChange={e => { setEditDevice(e.target.value); setEditUnit(HAZARD_ASSET_TREE.find(d => d.name === e.target.value)?.units[0]?.name ?? '') }}
                    style={{ width: '100%', padding: '9px 10px', border: '1.5px solid #CDD2D9', borderRadius: 7, fontSize: 12, background: '#fff', color: '#171A1E', cursor: 'pointer', outline: 'none', fontFamily: '"Noto Sans SC", sans-serif' }}>
                    {HAZARD_ASSET_TREE.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#515760', display: 'block', marginBottom: 5 }}>所属工段</label>
                  <select value={editUnit} onChange={e => setEditUnit(e.target.value)}
                    style={{ width: '100%', padding: '9px 10px', border: '1.5px solid #CDD2D9', borderRadius: 7, fontSize: 12, background: '#fff', color: '#171A1E', cursor: 'pointer', outline: 'none', fontFamily: '"Noto Sans SC", sans-serif' }}>
                    {editUnitOptions.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                  </select>
                </div>
              </div>
              {/* Plan */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#515760', display: 'block', marginBottom: 5 }}>对应预案</label>
                <div style={{ fontSize: 11, color: '#9FA6AF', marginBottom: 6 }}>选择该隐患触发时对应的处置预案</div>
                <select value={editPlan} onChange={e => setEditPlan(e.target.value)}
                  style={{ width: '100%', padding: '9px 10px', border: '1.5px solid #CDD2D9', borderRadius: 7, fontSize: 12, background: '#fff', color: '#171A1E', cursor: 'pointer', outline: 'none', fontFamily: '"Noto Sans SC", sans-serif' }}>
                  <option value="">— 暂未关联预案 —</option>
                  {ALL_PLAN_NAMES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                {editPlan && (
                  <div style={{ marginTop: 7, padding: '6px 10px', background: '#EEF5FB', borderRadius: 6, border: '1px solid rgba(0,75,141,0.15)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#004B8D" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <span style={{ fontSize: 11, color: '#004B8D', fontWeight: 500 }}>已关联：{editPlan}</span>
                  </div>
                )}
              </div>
            </div>
            <div style={{ padding: '12px 22px', borderTop: '1px solid #E0E4E9', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setEditTarget(null)} style={{ padding: '7px 18px', border: '1px solid #CDD2D9', borderRadius: 7, background: '#fff', color: '#515760', fontSize: 12, cursor: 'pointer' }}>取消</button>
              <button onClick={saveEdit} style={{ padding: '7px 18px', border: 'none', borderRadius: 7, background: '#004B8D', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>保存配置</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Trigger Conditions Modal ── */}
      {detailTarget && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(23,26,30,0.45)' }}
          onClick={() => setDetailTarget(null)}>
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 24px 64px rgba(20,34,48,0.24)', width: 800, maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #E0E4E9', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: '#FEF3E8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F28C28" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#171A1E' }}>触发条件配置</div>
                <div style={{ fontSize: 11, color: '#9FA6AF' }}>{detailTarget.name} · {detailTarget.device} › {detailTarget.unit}</div>
              </div>
              <button onClick={() => setDetailTarget(null)} style={{ width: 28, height: 28, border: '1px solid #E0E4E9', borderRadius: 7, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#747A82' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ padding: '8px 16px', borderBottom: '1px solid #E0E4E9', background: '#FAFBFC', display: 'flex', gap: 6, flexShrink: 0 }}>
              <ToolbarBtn label="+ 新增条件" onClick={addTrigger} />
              <ToolbarBtn label="整表粘贴" />
              <ToolbarBtn label="清空整表" />
              <div style={{ width: 1, background: '#E0E4E9', margin: '0 4px' }} />
              <ToolbarBtn label="上移" />
              <ToolbarBtn label="下移" />
              <ToolbarBtn label="序号重排" />
              <div style={{ flex: 1 }} />
              <ToolbarBtn label="删除选中" onClick={() => {
                if (selectedTriggerIdx !== null) {
                  setDetailTriggers(prev => prev.filter((_, i) => i !== selectedTriggerIdx).map((t, i) => ({ ...t, seq: i + 1 })))
                  setSelectedTriggerIdx(null)
                }
              }} />
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#F1F3F6', position: 'sticky', top: 0, zIndex: 2 }}>
                    {['序号', '故障说明', '故障判定表达式', '判定延迟 (s)', '参数变化率'].map(h => (
                      <th key={h} style={{ padding: '9px 12px', textAlign: 'left', color: '#515760', fontWeight: 600, fontSize: 11, borderBottom: '1px solid #CDD2D9', whiteSpace: 'nowrap', borderRight: '1px solid #E0E4E9' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detailTriggers.map((row, i) => (
                    <tr key={i} onClick={() => setSelectedTriggerIdx(selectedTriggerIdx === i ? null : i)}
                      style={{ borderBottom: '1px solid #E0E4E9', cursor: 'pointer', background: selectedTriggerIdx === i ? '#EEF5FB' : 'transparent', transition: 'background 80ms' }}
                      onMouseEnter={e => { if (selectedTriggerIdx !== i) e.currentTarget.style.background = '#F7F8FA' }}
                      onMouseLeave={e => { e.currentTarget.style.background = selectedTriggerIdx === i ? '#EEF5FB' : 'transparent' }}
                    >
                      <td style={{ padding: '9px 12px', borderRight: '1px solid #E0E4E9', textAlign: 'center', fontWeight: 700, color: selectedTriggerIdx === i ? '#004B8D' : '#747A82', fontFamily: '"Inter Tight", sans-serif' }}>{row.seq}</td>
                      {(['desc','judge','delay','changeRate'] as const).map((field, fi) => (
                        <td key={field} style={{ padding: '9px 12px', borderRight: fi < 3 ? '1px solid #E0E4E9' : 'none' }}>
                          <input value={row[field]} onChange={e => setDetailTriggers(prev => prev.map((t, j) => j === i ? { ...t, [field]: e.target.value } : t))}
                            onClick={e => e.stopPropagation()}
                            placeholder={field === 'judge' ? '例：(*TI4101*>=1350)' : field === 'delay' ? '0' : '—'}
                            style={{ width: field === 'delay' ? 60 : '100%', border: '1px solid transparent', borderRadius: 4, padding: '2px 6px', fontSize: field === 'judge' ? 11 : 12, fontFamily: field === 'judge' ? '"JetBrains Mono", monospace' : field === 'desc' ? '"Noto Sans SC", sans-serif' : 'inherit', background: 'transparent', color: field === 'judge' ? '#004B8D' : '#515760', outline: 'none', boxSizing: 'border-box', textAlign: field === 'delay' ? 'center' : 'left' }}
                            onFocus={e => { e.currentTarget.style.borderColor = '#004B8D'; e.currentTarget.style.background = '#fff' }}
                            onBlur={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'transparent' }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                  {detailTriggers.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: '36px 0', textAlign: 'center', color: '#9FA6AF', fontSize: 12 }}>暂无触发条件，点击"+ 新增条件"添加</td></tr>
                  )}
                  {Array.from({ length: Math.max(0, 5 - detailTriggers.length) }).map((_, i) => (
                    <tr key={`e${i}`} style={{ borderBottom: '1px solid #E0E4E9', height: 36 }}>
                      {[1,2,3,4,5].map(j => <td key={j} style={{ borderRight: '1px solid #E0E4E9' }} />)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '12px 22px', borderTop: '1px solid #E0E4E9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: '#9FA6AF' }}>点击行选中 · 单元格内直接编辑</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setDetailTarget(null)} style={{ padding: '7px 18px', border: '1px solid #CDD2D9', borderRadius: 7, background: '#fff', color: '#515760', fontSize: 12, cursor: 'pointer' }}>取消</button>
                <button onClick={saveDetail} style={{ padding: '7px 18px', border: 'none', borderRadius: 7, background: '#004B8D', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>保存触发条件</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Engineer & Supervisor sidebar views ─────────────────────────────────────

function KnowledgeBasePage() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#E9EDF2', gap: 16 }}>
      <div style={{ width: 56, height: 56, borderRadius: 14, background: '#EEF5FB', border: '1px solid rgba(0,75,141,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#004B8D" strokeWidth="1.6" strokeLinecap="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#171A1E', marginBottom: 6 }}>知识库管理</div>
        <div style={{ fontSize: 13, color: '#9FA6AF', lineHeight: 1.7 }}>文档 · 操作规程 · 经验积累<br />功能建设中，敬请期待</div>
      </div>
    </div>
  )
}

const ENG_NAV: NavItem[] = [
  { key: 'overview',       label: '总览',         sub: '数据看板 · 快捷入口',  icon: <IconHome /> },
  { key: 'op-records',     label: '操作记录',     sub: '历史执行 · 分析对比', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg> },
  { key: 'plan-manage',    label: '预案管理',     sub: '组态 · 启用 · 版本', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg> },
  { key: 'hazard-manage',  label: '隐患管理',     sub: '登记 · 预案关联 · 触发', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
  { key: 'knowledge-base', label: '知识库管理', sub: '文档 · 规程 · 知识积累', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
]

const ADMIN_NAV: NavItem[] = [
  { key: 'alarm-priority', label: '报警优先级矩阵', sub: '优先级 · 颜色配置',   icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg> },
  { key: 'section-manage', label: '工段管理',        sub: '工厂 · 装置 · 工段',  icon: <IconTree /> },
]

const SUP_NAV: NavItem[] = [
  { key: 'overview',    label: '总览',     sub: '数据看板 · 快捷入口',  icon: <IconHome /> },
  { key: 'op-records',  label: '操作记录', sub: '历史执行 · 分析对比', icon: <IconRecords /> },
  { key: 'plan-manage', label: '预案管理', sub: '工段 · 状态 · 启用',   icon: <IconPlan /> },
]

function EngineerView({ sections, plans, setPlans, configPlan, setConfigPlan, matrix, onActivate }: {
  sections: string[]
  plans: Record<string, Plan[]>
  setPlans: React.Dispatch<React.SetStateAction<Record<string, Plan[]>>>
  configPlan: string | null
  setConfigPlan: (p: string | null) => void
  matrix: AlarmPriority[]
  onActivate?: (plan: string) => void
}) {
  const [page, setPage] = useState<string>('overview')
  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      <SceneSidebar nav={ENG_NAV} page={configPlan ? 'plan-manage' : page} onPage={(p) => { setPage(p); if (p !== 'plan-manage') setConfigPlan(null) }} roleLabel="工艺工程师工作台" />
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {page === 'overview'       && <OverviewPage role="engineer" plans={plans} onPage={setPage} />}
        {page === 'plan-manage'    && <PlanManagementPanel role="engineer" sections={sections} plans={plans} setPlans={setPlans} configPlan={configPlan} setConfigPlan={setConfigPlan} matrix={matrix} />}
        {page === 'hazard-manage'  && <HazardManagePage />}
        {page === 'op-records'     && <OperationRecordsPage onActivate={onActivate} role="engineer" />}
        {page === 'knowledge-base' && <KnowledgeBasePage />}
      </div>
    </div>
  )
}

function SupervisorView({ sections, plans, setPlans, configPlan, setConfigPlan, matrix, onActivate }: {
  sections: string[]
  plans: Record<string, Plan[]>
  setPlans: React.Dispatch<React.SetStateAction<Record<string, Plan[]>>>
  configPlan: string | null
  setConfigPlan: (p: string | null) => void
  matrix: AlarmPriority[]
  onActivate?: (plan: string) => void
}) {
  const [page, setPage] = useState<string>('overview')
  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      <SceneSidebar nav={SUP_NAV} page={page} onPage={setPage} roleLabel="班长工作台" />
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {page === 'overview'      && <OverviewPage role="supervisor" plans={plans} onPage={setPage} />}
        {page === 'plan-manage'   && <PlanManagementPanel role="supervisor" sections={sections} plans={plans} setPlans={setPlans} configPlan={configPlan} setConfigPlan={setConfigPlan} matrix={matrix} />}
        {page === 'op-records'   && <OperationRecordsPage onActivate={onActivate} role="supervisor" />}
      </div>
    </div>
  )
}

function AdminView({ matrix, setMatrix }: {
  matrix: AlarmPriority[]
  setMatrix: React.Dispatch<React.SetStateAction<AlarmPriority[]>>
}) {
  const [page, setPage] = useState<string>('alarm-priority')
  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      <SceneSidebar nav={ADMIN_NAV} page={page} onPage={setPage} roleLabel="系统管理员工作台" />
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {page === 'alarm-priority' && <AlarmPriorityMatrixPage matrix={matrix} setMatrix={setMatrix} />}
        {page === 'section-manage' && <SectionManagePage matrix={matrix} />}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type Role = 'engineer' | 'supervisor' | 'manager' | 'admin'

interface Props {
  role?: Role
  onActivate?: (plan: string) => void
}

export default function Scene3({ role: defaultRole = 'engineer', onActivate }: Props) {
  const [role, setRole] = useState<Role>(defaultRole)
  const [sections] = useState(SECTIONS_INIT)
  const [plans, setPlans] = useState(PLANS_DATA)
  const [configPlan, setConfigPlan] = useState<string | null>(null)
  const [alarmMatrix, setAlarmMatrix] = useState<AlarmPriority[]>(DEFAULT_ALARM_PRIORITIES)

  // placeholder — not used in render but satisfies the return type check below
  const _unused = { plans, setPlans, sections, configPlan, setConfigPlan }
  void _unused

  // keep these to prevent "variable declared but never read" TS errors from old handleToggle
  const selectedSection = SECTIONS_INIT[0]
  const currentPlans = (plans[selectedSection] ?? []).filter((p) =>
    role === 'supervisor' ? p.status === 'enabled' : true
  )

  const handleToggle = (planId: string) => {
    setPlans((prev) => {
      const updated = { ...prev }
      updated[selectedSection] = (updated[selectedSection] ?? []).map((p) => {
        if (p.id !== planId) return p
        if (role === 'engineer') {
          return { ...p, status: p.status === 'enabled' ? 'disabled' : 'enabled' }
        }
        // supervisor can only toggle enabled<->disabled
        if (p.status === 'enabled') return { ...p, status: 'disabled' as const }
        if (p.status === 'disabled') return { ...p, status: 'enabled' as const }
        return p
      })
      return updated
    })
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#E9EDF2', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: '"Noto Sans SC", "Microsoft YaHei", sans-serif' }}>
      <style>{`@keyframes modalIn { from{opacity:0;transform:scale(0.96) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }`}</style>
      {/* Header */}
      <div style={{ background: '#002C55', borderBottom: '1px solid rgba(0,105,168,0.3)', display: 'flex', alignItems: 'center', padding: '0 20px', height: 52, gap: 16, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #005A9B 0%, #004B8D 100%)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,75,141,0.5), inset 0 1px 0 rgba(255,255,255,0.12)', border: '1px solid rgba(0,105,168,0.5)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 7.5C4 6.7 4.6 6 5.5 6H12V20H5.5C4.6 20 4 19.3 4 18.5V7.5Z" fill="white" />
              <path d="M12 6H18.5C19.4 6 20 6.7 20 7.5V18.5C20 19.3 19.4 20 18.5 20H12V6Z" fill="white" opacity={0.72} />
              <rect x="11.5" y="6" width="1" height="14" fill="white" opacity={0.4} />
              <path d="M8 1.5L8.6 3.4L10.5 4L8.6 4.6L8 6.5L7.4 4.6L5.5 4L7.4 3.4Z" fill="white" />
              <path d="M16.5 0.8L17 2.2L18.4 2.7L17 3.2L16.5 4.6L16 3.2L14.6 2.7L16 2.2Z" fill="white" />
              <path d="M13.5 2.5L13.8 3.3L14.6 3.6L13.8 3.9L13.5 4.7L13.2 3.9L12.4 3.6L13.2 3.3Z" fill="white" opacity={0.8} />
            </svg>
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, lineHeight: 1.1 }}>Emerson DCS</div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10 }}>预案管理系统</div>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        {/* Role switcher */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: 3 }}>
          {([['engineer', '工艺工程师'], ['supervisor', '班长'], ['manager', '装置经理'], ['admin', '系统管理员']] as [Role, string][]).map(([r, label]) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              style={{
                padding: '4px 12px',
                borderRadius: 6,
                border: 'none',
                background: role === r ? '#fff' : 'transparent',
                color: role === r ? '#004B8D' : 'rgba(255,255,255,0.6)',
                fontSize: 12,
                fontWeight: role === r ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 120ms ease',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Role-based sidebar views */}
      {role === 'manager' ? (
        <ManagerView sections={sections} plans={plans} setPlans={setPlans} configPlan={configPlan} setConfigPlan={setConfigPlan} matrix={alarmMatrix} onActivate={onActivate} />
      ) : role === 'engineer' ? (
        <EngineerView sections={sections} plans={plans} setPlans={setPlans} configPlan={configPlan} setConfigPlan={setConfigPlan} matrix={alarmMatrix} onActivate={onActivate} />
      ) : role === 'supervisor' ? (
        <SupervisorView sections={sections} plans={plans} setPlans={setPlans} configPlan={configPlan} setConfigPlan={setConfigPlan} matrix={alarmMatrix} onActivate={onActivate} />
      ) : role === 'admin' ? (
        <AdminView matrix={alarmMatrix} setMatrix={setAlarmMatrix} />
      ) : null}
    </div>
  )
}

function ActionBtn({ label, onClick, primary, danger }: { label: string; onClick: () => void; primary?: boolean; danger?: boolean }) {
  const base: React.CSSProperties = {
    padding: '5px 12px',
    borderRadius: 5,
    fontSize: 12,
    cursor: 'pointer',
    fontWeight: primary ? 600 : 400,
    transition: 'all 100ms ease',
    border: '1px solid',
    whiteSpace: 'nowrap',
  }
  const style: React.CSSProperties = primary
    ? { ...base, background: '#004B8D', color: '#fff', borderColor: '#004B8D' }
    : danger
    ? { ...base, background: '#fff', color: '#A52727', borderColor: '#E8C0C0' }
    : { ...base, background: '#fff', color: '#30353B', borderColor: '#CDD2D9' }

  return (
    <button
      style={style}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (primary) e.currentTarget.style.background = '#005A9B'
        else if (danger) { e.currentTarget.style.background = '#FCECEC'; e.currentTarget.style.borderColor = '#D93838' }
        else e.currentTarget.style.borderColor = '#82B9DD'
      }}
      onMouseLeave={(e) => {
        if (primary) e.currentTarget.style.background = '#004B8D'
        else if (danger) { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#E8C0C0' }
        else e.currentTarget.style.borderColor = '#CDD2D9'
      }}
    >
      {label}
    </button>
  )
}

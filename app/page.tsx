'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, ArrowLeft, ArrowRight, CalendarRange, CheckCircle2, Crown, FileText, HeartPulse, History, Lock, ShieldAlert, ShieldCheck, Sparkles, UserRoundCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { blankPerson } from '@/lib/defaults';
import { equipmentLabel, makePlan, patternLabel, phaseLabel, positionLabel, type Goal, type Person, type Position } from '@/lib/planner';

const positionOptions: {value: Position; label: string}[] = [
  { value: 'standing', label: '站姿' },
  { value: 'seated', label: '椅子坐姿' },
  { value: 'mat', label: '墊上' },
];
const equipmentOptions = [
  ['bodyweight', '徒手'], ['chair', '穩固椅子'], ['wall', '牆面'], ['bottle', '水瓶／啞鈴'],
  ['booty_band', '臀力帶'], ['ankle_weight', '綁腿沙袋'], ['resistance_band', '彈力帶'], ['pilates_ball', '皮拉提斯球'],
];
const goalOptions: {value: Goal; label: string; note: string}[] = [
  { value: 'prevent', label: '避免肌無力', note: '日常功能與平衡優先' },
  { value: 'health', label: '維持健康', note: '全身均衡活動' },
  { value: 'performance', label: '增加表現', note: '適度提高挑戰' },
];

const exerciseImages: Record<string, string> = {
  'standing-march':'standing:0', 'standing-shoulder-sweep':'standing:1', 'standing-wall-push':'standing:2', 'standing-band-row':'standing:3',
  'standing-booty-squat':'standing:4', 'standing-ankle-march':'standing:5', 'standing-ball-press':'standing:6', 'standing-chest-stretch':'standing:7',
  'standing-lat-stretch':'standing:8', 'standing-calf-stretch':'standing:9',
  'seated-march':'seated:0', 'seated-reach':'seated:1', 'seated-palm-press':'seated:2', 'seated-band-row':'seated:3',
  'seated-ball-squeeze':'seated:4', 'seated-ankle-extension':'seated:5', 'seated-booty-abduction':'seated:6', 'seated-chest-stretch':'seated:7',
  'seated-upper-back':'seated:8', 'seated-hamstring':'seated:9',
  'mat-cat-cow':'mat:0', 'mat-arm-sweep':'mat:1', 'mat-knee-push':'mat:2', 'mat-band-pullover':'mat:3', 'mat-ball-bridge':'mat:4',
  'mat-booty-clam':'mat:5', 'mat-ankle-leg-lift':'mat:6', 'mat-child-pose':'mat:7', 'mat-twist':'mat:8', 'mat-hip-flexor':'mat:9',
};

type HistoryEntry = { id: string; createdAt: string; person: string; sessions: number; goal: Goal };

function Field({label, children}: {label: string; children: React.ReactNode}) {
  return <label className="grid gap-2 text-sm font-bold">{label}{children}</label>;
}

function Choice({checked, onChange, label, note}: {checked: boolean; onChange: (v:boolean)=>void; label:string; note?:string}) {
  return <label className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${checked ? 'border-[#147D64] bg-[#E7F8F1]' : 'bg-white hover:border-[#9FB3C2]'}`}>
    <Checkbox checked={checked} onCheckedChange={(value)=>onChange(value === true)} />
    <span><span className="block text-sm font-bold">{label}</span>{note && <span className="block text-xs text-muted-foreground">{note}</span>}</span>
  </label>;
}

function Header({step, pro}: {step:number; pro:boolean}) {
  return <header className="no-print border-b border-white/10 bg-primary text-primary-foreground">
    <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
      <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#9FE3C2] text-[#102A43]"><Activity size={22}/></span><div><p className="font-extrabold tracking-tight">爸媽肌力入門課</p><p className="text-xs text-white/60">安全分流課表產生器</p></div></div>
      <div className="hidden gap-2 text-xs sm:flex">{['基本資料','安全確認','課表'].map((label,i)=><span key={label} className={`rounded-full px-3 py-2 ${step===i+1?'bg-white text-primary':'bg-white/10 text-white/60'}`}>{i+1} {label}</span>)}</div>
      <span className="rounded-full border border-[#9FE3C2]/30 bg-[#9FE3C2]/10 px-3 py-1 text-xs font-bold text-[#9FE3C2]">{pro?'Pro 測試版':'免費體驗'}</span>
    </div>
  </header>;
}

function ExerciseVisual({image, name}: {image: string; name: string}) {
  const [atlas, rawSlot] = image.split(':');
  const slot = Number(rawSlot);
  const column = slot % 4;
  const row = Math.floor(slot / 4);
  return <div
    role="img"
    aria-label={`${name}動作示意圖`}
    className="mb-3 aspect-[4/3] w-full rounded-xl border border-[#DDE8ED] bg-[#F3F7F8] bg-no-repeat"
    style={{
      backgroundImage: `url(/exercises/${atlas}-atlas.png)`,
      backgroundSize: '400% 300%',
      backgroundPosition: `${column * (100 / 3)}% ${row * 50}%`,
    }}
  />;
}

function PersonForm({person, update}: {person:Person; update:(patch:Partial<Person>)=>void}) {
  const toggle = <T extends string>(items:T[], value:T) => items.includes(value) ? items.filter((item)=>item!==value) : [...items,value];
  return <div className="space-y-7">
    <section>
      <h3 className="section-title">基本資料</h3>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="稱呼"><Input value={person.name} onChange={(e)=>update({name:e.target.value})} className="h-11 rounded-xl"/></Field>
        <Field label="年齡"><Input type="number" min={18} max={110} value={person.age} onChange={(e)=>update({age:Number(e.target.value)})} className="h-11 rounded-xl"/></Field>
        <Field label="性別"><select value={person.sex} onChange={(e)=>update({sex:e.target.value})} className="h-11 rounded-xl border bg-white px-3 font-normal"><option>男性</option><option>女性</option><option>其他／不透露</option></select></Field>
      </div>
    </section>
    <section>
      <h3 className="section-title">健康與限制</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="病史"><Textarea value={person.history} onChange={(e)=>update({history:e.target.value})} placeholder="例：高血壓、糖尿病" /></Field>
        <Field label="目前用藥"><Textarea value={person.medications} onChange={(e)=>update({medications:e.target.value})} placeholder="例：降血壓藥；沒有請填無" /></Field>
        <Field label="開刀史"><Textarea value={person.surgeries} onChange={(e)=>update({surgeries:e.target.value})} placeholder="例：右膝置換、年份" /></Field>
        <Field label="疼痛／身體限制"><Textarea value={person.pain} onChange={(e)=>update({pain:e.target.value})} placeholder="例：左膝上下樓會痛" /></Field>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Choice checked={person.recovering} onChange={(v)=>update({recovering:v})} label="受傷／術後恢復中" />
        <Choice checked={person.hasTube} onChange={(v)=>update({hasTube:v})} label="有管路／插管" />
        <Choice checked={person.dizziness} onChange={(v)=>update({dizziness:v})} label="近期暈眩／容易失去平衡" />
      </div>
      {person.recovering && <div className="mt-3 max-w-sm"><Choice checked={person.cleared} onChange={(v)=>update({cleared:v})} label="醫療專業人員已同意活動" /></div>}
    </section>
    <section>
      <h3 className="section-title">目標、姿勢與器材</h3>
      <p className="mb-2 text-sm font-bold">主要目標</p>
      <div className="grid gap-3 sm:grid-cols-3">{goalOptions.map((option)=><label key={option.value} className={`cursor-pointer rounded-xl border p-4 ${person.goal===option.value?'border-[#F97316] bg-[#FFF4E8]':'bg-white'}`}><input className="sr-only" type="radio" name={`goal-${person.id}`} checked={person.goal===option.value} onChange={()=>update({goal:option.value})}/><span className="font-bold">{option.label}</span><span className="mt-1 block text-xs text-muted-foreground">{option.note}</span></label>)}</div>
      <p className="mb-2 mt-5 text-sm font-bold">可接受姿勢（可複選）</p>
      <div className="grid gap-3 sm:grid-cols-3">{positionOptions.map((option)=><Choice key={option.value} checked={person.positions.includes(option.value)} onChange={()=>update({positions:toggle(person.positions,option.value)})} label={option.label}/>)}</div>
      <p className="mb-2 mt-5 text-sm font-bold">現有器材（可複選）</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{equipmentOptions.map(([value,label])=><Choice key={value} checked={person.equipment.includes(value)} onChange={()=>update({equipment:toggle(person.equipment,value)})} label={label}/>)}</div>
    </section>
  </div>;
}

export default function Home() {
  const [step,setStep] = useState(1);
  const [count,setCount] = useState(2);
  const [active,setActive] = useState(0);
  const [sessions,setSessions] = useState(2);
  const [people,setPeople] = useState<Person[]>([blankPerson(1),blankPerson(2)]);
  const [freeUsed,setFreeUsed] = useState(false);
  const [pro,setPro] = useState(false);
  const [dayIndex,setDayIndex] = useState(0);
  const [historyOpen,setHistoryOpen] = useState(false);
  const [historyEntries,setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [upgradeOpen,setUpgradeOpen] = useState(false);
  const [coachOpen,setCoachOpen] = useState(false);
  const plans = useMemo(()=>people.map((person)=>makePlan(person,sessions,pro?dayIndex:0)),[people,sessions,pro,dayIndex]);
  useEffect(()=>{
    setFreeUsed(localStorage.getItem('strength-planner-free-v2')==='used');
    try { setHistoryEntries(JSON.parse(localStorage.getItem('strength-planner-history') || '[]')); } catch { setHistoryEntries([]); }
    const beta = new URLSearchParams(window.location.search).get('pro') === 'beta';
    setPro(beta || localStorage.getItem('strength-planner-pro-beta') === 'enabled');
    if (beta) localStorage.setItem('strength-planner-pro-beta','enabled');
  },[]);
  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({
      name: 'start_basic_strength_plan',
      title: '建立基礎肌力課表',
      description: '以 1 至 3 位、無管路且非恢復期中的成人資料，建立固定 2＋3＋3 基礎課表並顯示結果。',
      inputSchema: {
        type: 'object',
        properties: {
          people: { type: 'array', minItems: 1, maxItems: 3, items: { type: 'object', properties: { name: {type:'string'}, age: {type:'number',minimum:18,maximum:110} }, required:['name','age'], additionalProperties:false } },
          sessions: { type: 'number', enum: [1,2,3] },
        },
        required: ['people','sessions'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input: unknown) {
        const value = input as { people?: {name?:string;age?:number}[]; sessions?:number };
        if (!Array.isArray(value.people) || value.people.length<1 || value.people.length>3 || ![1,2,3].includes(value.sessions ?? 0)) throw new Error('請提供 1 至 3 位訓練者與每週 1 至 3 次。');
        if (value.people.some((item)=>!item.name || typeof item.age!=='number' || item.age<18 || item.age>110)) throw new Error('稱呼與年齡格式不正確。');
        const next = value.people.map((item,index)=>({...blankPerson(index+1),name:item.name!,age:item.age!}));
        setPeople(next); setCount(next.length); setSessions(value.sessions!); setActive(0); setStep(3);
        return { status:'created', people:next.length, sessions:value.sessions, structure:'2 warmups + 3 strength + 3 stretches' };
      },
    }, { signal:lifecycle.signal })).catch(()=>undefined);
    return () => lifecycle.abort();
  }, []);
  const updateCount = (value:number) => {
    const next=Math.max(1,Math.min(pro?6:2,value || 1));
    setCount(next); setPeople((current)=>Array.from({length:next},(_,i)=>current[i]??blankPerson(i+1))); setActive((current)=>Math.min(current,next-1));
  };
  const updatePerson = (patch:Partial<Person>) => setPeople((current)=>current.map((person,i)=>i===active?{...person,...patch}:person));
  const generateFreePlan = () => {
    if (!pro && freeUsed) { setUpgradeOpen(true); return; }
    if (!pro) {
      localStorage.setItem('strength-planner-free-v2','used');
      setFreeUsed(true);
    }
    setDayIndex(0);
    setStep(3);
  };
  const saveHistory = () => {
    const entry: HistoryEntry = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), person: plan.person.name, sessions: plan.sessions, goal: plan.person.goal };
    const next = [entry,...historyEntries].slice(0,20);
    setHistoryEntries(next);
    localStorage.setItem('strength-planner-history',JSON.stringify(next));
    setHistoryOpen(true);
  };
  const hasPosition = people.every((person)=>person.positions.length>0);
  const allGreen = plans.every((plan)=>plan.safety!=='red');
  const plan = plans[active];
  return <main className="min-h-screen bg-background text-foreground">
    <Header step={step} pro={pro}/>
    {step===1 && <section className="no-print mx-auto max-w-6xl px-5 py-7 md:py-10">
      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="mb-2 text-sm font-bold text-[#147D64]">建立新課表</p><h1 className="max-w-3xl text-3xl font-black leading-tight tracking-tight md:text-5xl">先了解身體，再安排今天的動作。</h1><p className="mt-3 max-w-2xl leading-7 text-muted-foreground">不用懂運動處方，也能快速得到一堂考慮爸媽限制、有進退階、有圖片，而且知道下次怎麼調整的課。</p></div><span className="rounded-full bg-white px-4 py-2 text-sm font-bold shadow-sm">教練動作庫</span></div>
      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <Card className="rounded-[24px] border-0 p-5 shadow-[0_18px_50px_rgba(16,42,67,.08)] md:p-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><label htmlFor="people" className="text-sm font-bold">訓練人數</label><Input id="people" type="number" min={1} max={pro?6:2} value={count} onChange={(e)=>updateCount(Number(e.target.value))} className="mt-2 h-11 w-28 rounded-xl"/><p className="mt-1 text-xs text-muted-foreground">{pro?'測試版最多 6 位':'免費版最多 2 位'}</p></div><div className="flex flex-wrap gap-2">{people.map((person,i)=><Button key={person.id} variant={active===i?'default':'outline'} onClick={()=>setActive(i)} className="rounded-full">{person.name || `第 ${i+1} 位`}</Button>)}</div></div>
          <div className="mb-7 border-t pt-7"><h2 className="text-2xl font-black">{people[active].name || `訓練者 ${active+1}`}的資料</h2><p className="mt-1 text-sm text-muted-foreground">每位訓練者都會分別評估與產生課表。</p></div>
          <PersonForm person={people[active]} update={updatePerson}/>
          {!hasPosition && <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">每個人至少要選擇一種可接受姿勢。</p>}
          <div className="mt-8 flex justify-end"><Button disabled={!hasPosition} onClick={()=>setStep(2)} className="h-12 rounded-xl bg-[#F97316] px-6 font-bold text-white hover:bg-[#EA580C]">進行安全確認 <ArrowRight/></Button></div>
        </Card>
        <aside className="h-fit rounded-[24px] bg-primary p-6 text-white lg:sticky lg:top-5"><ShieldCheck className="mb-8 text-[#9FE3C2]" size={34}/><h2 className="text-2xl font-black">安全規則先行</h2><p className="mt-3 leading-7 text-white/70">系統先辨識需要醫療確認的狀況，再由教練動作庫安排合適內容，不讓 AI 臨場自由配課。</p><ul className="mt-7 space-y-3 text-sm text-white/70"><li>✓ 站姿／坐姿／墊上分類</li><li>✓ 推／拉／蹲／移動作主軸</li><li>✓ 徒手與多種居家器材</li></ul><div className="mt-6 rounded-2xl border border-white/15 bg-white/10 p-4"><p className="text-xs font-bold text-[#9FE3C2]">由 Esther 規劃</p><p className="mt-1 font-black">不只是 AI 產生器</p><p className="mt-2 text-sm leading-6 text-white/70">具運動醫學背景、體適能與樂齡運動資格，並有實際中高齡帶課經驗。</p></div><div className="mt-4 rounded-2xl border border-[#9FE3C2]/25 bg-[#9FE3C2]/10 p-4"><p className="text-xs font-bold text-[#9FE3C2]">目前方案 · {pro?'Pro 測試版':'免費體驗'}</p><p className="mt-1 font-black">{pro?'完整每週課表功能已啟用':'可產生 1 次基礎課表'}</p>{!pro&&<button onClick={()=>setUpgradeOpen(true)} className="mt-3 text-sm font-bold text-white underline underline-offset-4">查看進階方案</button>}</div><div className="mt-4 rounded-2xl border border-white/15 bg-white/10 p-4"><p className="text-xs font-bold text-[#9FE3C2]">需要教練協助？</p><p className="mt-1 font-black">預約客製評估</p><p className="mt-1 text-xs text-white/65">LINE ID：yp0905</p><div className="mt-3 grid gap-2"><a href="https://line.me/ti/p/~yp0905" target="_blank" rel="noreferrer" className="rounded-lg bg-[#06C755] px-3 py-2 text-center text-sm font-black text-white">加入 LINE</a><a href="https://docs.google.com/forms/d/e/1FAIpQLSerur4ao6NPy5bjPTzWacD7CTfcTHW1ZlIAtttyNvFribAnwQ/viewform?usp=publish-editor" target="_blank" rel="noreferrer" className="rounded-lg bg-white px-3 py-2 text-center text-sm font-black text-primary">填寫 Google 預約單</a></div></div></aside>
      </div>
    </section>}
    {step===2 && <section className="no-print mx-auto max-w-4xl px-5 py-8">
      <div className="mb-7"><p className="text-sm font-bold text-[#147D64]">安全確認</p><h1 className="mt-2 text-3xl font-black md:text-4xl">先看清楚，再開始。</h1><p className="mt-2 text-muted-foreground">這是運動規劃輔助，不是診斷或醫療處方。</p></div>
      <div className="space-y-4">{plans.map((item,i)=><Card key={item.person.id} className="rounded-2xl p-5"><div className="flex items-start gap-4"><span className={`grid size-12 shrink-0 place-items-center rounded-full ${item.safety==='red'?'bg-red-100 text-red-700':item.safety==='amber'?'bg-amber-100 text-amber-700':'bg-emerald-100 text-emerald-700'}`}>{item.safety==='red'?<ShieldAlert/>:item.safety==='amber'?<AlertTriangle/>:<CheckCircle2/>}</span><div><p className="text-sm font-bold text-muted-foreground">{item.person.name} · {item.person.age} 歲</p><h2 className="text-xl font-black">{item.safetyTitle}</h2><ul className="mt-2 space-y-1 text-sm text-muted-foreground">{item.safetyNotes.map((note)=><li key={note}>• {note}</li>)}</ul></div></div></Card>)}</div>
      <Card className="mt-5 rounded-2xl p-5"><div className="flex items-center justify-between"><label className="text-sm font-bold" htmlFor="sessions">希望每週訓練頻率</label><span className="rounded-full bg-[#FFF4E8] px-2.5 py-1 text-xs font-bold text-[#C2410C]">Pro 產出完整週表</span></div><div className="mt-3 grid grid-cols-3 gap-3">{[1,2,3].map((value)=><Button key={value} variant={sessions===value?'default':'outline'} onClick={()=>setSessions(value)} className="h-12 rounded-xl">{value} 次／週</Button>)}</div><p className="mt-3 text-xs text-muted-foreground">免費版記錄頻率偏好並產出一次基礎課；Pro 依頻率安排完整週課表與休息日。</p></Card>
      <div className="mt-7 flex flex-wrap justify-between gap-3"><Button variant="outline" onClick={()=>setStep(1)} className="h-11 rounded-xl"><ArrowLeft/> 返回修改</Button>{allGreen?<Button onClick={generateFreePlan} className="h-11 rounded-xl bg-[#F97316] px-6 font-bold text-white hover:bg-[#EA580C]">{pro?'產生 Pro 每週課表':freeUsed?'免費額度已使用':'免費產生 1 次基礎課表'} {!pro&&freeUsed?<Lock/>:<Sparkles/>}</Button>:<Button onClick={()=>setCoachOpen(true)} className="h-11 rounded-xl bg-[#F97316] px-6 font-bold text-white hover:bg-[#EA580C]">找教練協助客製 <UserRoundCheck/></Button>}</div>
      {!allGreen && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"><p className="font-black">不直接產生一般課表</p><p className="mt-1 text-sm">建議先取得醫療專業人員運動許可，或由教練依專業意見安排非常有限的活動選項。</p></div>}
    </section>}
    {step===3 && <section className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3"><div><div className="mb-1 flex items-center gap-2"><p className="text-sm font-bold text-[#147D64]">{pro?'Pro 每週課表已完成':'免費基礎課表已完成'}</p><span className="rounded-full bg-[#FFF4E8] px-2 py-1 text-xs font-bold text-[#C2410C]">{pro?'Pro 測試版':'1 次體驗'}</span></div><h1 className="text-3xl font-black">本週肌力入門課</h1></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={()=>setStep(1)} className="rounded-xl"><ArrowLeft/> 修改資料</Button>{pro?<><Button variant="outline" onClick={()=>window.print()} className="rounded-xl"><FileText/> 列印／另存 PDF</Button><Button variant="outline" onClick={saveHistory} className="rounded-xl"><History/> 儲存紀錄</Button><Button onClick={()=>setHistoryOpen(true)} className="rounded-xl bg-[#F97316] text-white hover:bg-[#EA580C]">歷次紀錄</Button></>:<Button onClick={()=>setUpgradeOpen(true)} className="rounded-xl bg-[#F97316] text-white hover:bg-[#EA580C]"><Lock/> 圖卡／PDF · Pro</Button>}</div></div>
      {pro?<div className="no-print mb-4 rounded-2xl border border-[#BFE8D5] bg-[#F0FBF6] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-black text-[#12624F]">選擇本週訓練日</p><p className="mt-1 text-sm text-[#397565]">每一天會依相同安全條件安排不同組合；中間請保留休息日。</p></div><CalendarRange className="shrink-0 text-[#147D64]"/></div><div className="mt-3 flex gap-2 overflow-x-auto">{Array.from({length:plan.sessions},(_,i)=><Button key={i} variant={dayIndex===i?'default':'outline'} onClick={()=>setDayIndex(i)} className="rounded-full">第 {i+1} 天</Button>)}</div></div>:<div className="no-print mb-4 flex items-center justify-between rounded-2xl border border-orange-200 bg-[#FFF9F3] p-4"><div><p className="font-black">完整每週課表已鎖定</p><p className="mt-1 text-sm text-muted-foreground">Pro 會依每週 {plan.sessions} 次安排不同訓練日、休息日與歷次紀錄。</p></div><CalendarRange className="shrink-0 text-[#F97316]"/></div>}
      <div className="no-print mb-4 flex gap-2 overflow-x-auto pb-1">{plans.map((item,i)=><Button key={item.person.id} variant={active===i?'default':'outline'} onClick={()=>setActive(i)} className="rounded-full">{item.person.name}</Button>)}</div>
      <article className="plan-sheet overflow-hidden rounded-[28px] bg-white shadow-[0_24px_70px_rgba(16,42,67,.14)]">
        <header className="grid gap-4 bg-primary p-6 text-white md:grid-cols-[1fr_auto] md:items-end"><div><div className="mb-3 flex items-center gap-2 text-sm font-bold text-[#9FE3C2]"><HeartPulse size={18}/> 個人化肌力課表{pro?` · 第 ${dayIndex+1} 天`:''}</div><h2 className="text-3xl font-black md:text-4xl">{plan.person.name}的 2＋3＋3 入門課</h2><p className="mt-2 text-white/65">{plan.person.age} 歲 · 每週 {plan.sessions} 次 · {goalOptions.find((g)=>g.value===plan.person.goal)?.label}</p></div><div className="rounded-2xl bg-white/10 px-4 py-3 text-sm"><p className="text-white/60">安全狀態</p><p className="mt-1 font-bold text-[#9FE3C2]">{plan.safetyTitle}</p></div></header>
        <div className="grid gap-px bg-[#D7E1E7] md:grid-cols-2 xl:grid-cols-4">{plan.exercises.map((exercise,index)=><section key={exercise.id} className="exercise-card bg-white p-4">
          <div className="mb-3 flex items-start justify-between"><span className={`rounded-full px-2.5 py-1 text-xs font-black ${exercise.phase==='warmup'?'bg-sky-100 text-sky-700':exercise.phase==='strength'?'bg-orange-100 text-orange-700':'bg-emerald-100 text-emerald-700'}`}>{phaseLabel(exercise.phase)} {exercise.phase==='warmup'?index+1:exercise.phase==='strength'?index-1:index-4}</span><span className="rounded-full bg-primary px-2 py-1 text-xs font-black text-white">{patternLabel(exercise.pattern)}</span></div>
          <ExerciseVisual image={exerciseImages[exercise.id]} name={exercise.name}/>
          <div className="mb-2 flex flex-wrap gap-1">{exercise.positions.map((position)=><span key={position} className="rounded bg-[#E7F8F1] px-1.5 py-1 text-[11px] font-bold text-[#12624F]">{positionLabel(position as Position)}</span>)}{exercise.equipment.map((equipment)=><span key={equipment} className="rounded bg-[#EEF2F6] px-1.5 py-1 text-[11px] font-bold text-[#52677A]">{equipmentLabel(equipment)}</span>)}</div>
          <h3 className="text-lg font-black">{exercise.name}</h3><p className="mt-1 text-sm font-bold text-[#147D64]">{exercise.dose}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{exercise.standard}</p>
          <details open className="pro-details mt-3 rounded-lg bg-[#F8FAFC] px-3 py-2 text-xs"><summary className="cursor-pointer font-black">進退階指引</summary><div className="mt-2 grid gap-1.5 leading-5"><p><b>退階：</b>{exercise.easier}</p><p><b>進階：</b>{exercise.harder}</p>{pro?<><p><b>呼吸：</b>{exercise.breathing}</p><p><b>注意：</b>{exercise.caution}</p></>:<button onClick={()=>setUpgradeOpen(true)} className="mt-1 flex w-full items-center justify-between rounded-md border bg-white px-2 py-1.5 text-left font-bold"><span>呼吸、注意事項與下次調整</span><Lock size={13}/></button>}</div></details>
        </section>)}</div>
        <footer className="flex flex-col gap-2 bg-[#E7F8F1] px-6 py-4 text-sm md:flex-row md:items-center md:justify-between"><p className="font-bold text-[#12624F]">原則：動作品質優先，疼痛增加、胸悶或暈眩時立即停止。</p><p className="text-xs text-[#397565]">課程規劃輔助工具 · 非醫療處方</p></footer>
      </article>
      {plan.exercises.length<8 && <p className="no-print mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">依目前條件只能找到 {plan.exercises.length} 個適合動作。可返回增加可接受姿勢或器材。</p>}
      <section className="no-print mt-7"><div className="mb-4"><p className="text-sm font-bold text-[#147D64]">選擇適合你的使用方式</p><h2 className="mt-1 text-2xl font-black">先免費帶一堂，再決定需要多少陪伴。</h2></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className={`rounded-2xl p-5 ${!pro?'border-2 border-[#147D64]':'border'}`}><div className="flex items-center justify-between"><h3 className="text-xl font-black">免費版</h3>{!pro&&<span className="rounded-full bg-[#E7F8F1] px-3 py-1 text-xs font-bold text-[#12624F]">目前方案</span>}</div><p className="mt-2 text-3xl font-black">$0</p><p className="mt-1 text-sm text-muted-foreground">第一次帶爸媽運動</p><ul className="mt-5 space-y-3 text-sm"><li>✓ 1–2 位家人</li><li>✓ 單堂 2＋3＋3 課表</li><li>✓ 動作圖片與進退階</li></ul></Card>
        <Card className="rounded-2xl border-2 border-[#F97316] p-5"><div className="flex items-center justify-between"><h3 className="text-xl font-black">Family Plus</h3><span className="rounded-full bg-[#FFF4E8] px-2 py-1 text-xs font-bold text-[#C2410C]">家庭長期使用</span></div><p className="mt-2 text-2xl font-black">$99<span className="text-sm font-bold">／月</span></p><p className="text-sm font-bold text-[#C2410C]">或 $790／年</p><ul className="mt-5 space-y-3 text-sm"><li>✓ 儲存 2 位家人</li><li>✓ 每週課表與訓練紀錄</li><li>✓ 疼痛／RPE 與課表圖卡</li></ul><Button onClick={()=>setUpgradeOpen(true)} variant="outline" className="mt-5 w-full rounded-xl">了解方案</Button></Card>
        <Card className="rounded-2xl bg-primary p-5 text-white"><div className="flex items-center justify-between"><h3 className="flex items-center gap-2 text-xl font-black"><Crown className="text-[#9FE3C2]"/> Coach Pro</h3><span className="rounded-full bg-white/10 px-2 py-1 text-xs font-bold">招募測試</span></div><p className="mt-2 text-2xl font-black">$299<span className="text-sm font-bold">／月</span></p><p className="text-sm font-bold text-[#9FE3C2]">或 $2,490／年</p><ul className="mt-5 space-y-3 text-sm text-white/80"><li>✓ 多個個案快速建檔</li><li>✓ 歷次課表、複製與修改</li><li>✓ 品牌圖卡與 PDF／圖片</li></ul><Button asChild className="mt-5 w-full rounded-xl bg-[#9FE3C2] font-black text-primary hover:bg-[#B9EDD3]"><a href="https://docs.google.com/forms/d/e/1FAIpQLSerur4ao6NPy5bjPTzWacD7CTfcTHW1ZlIAtttyNvFribAnwQ/viewform?usp=publish-editor" target="_blank" rel="noreferrer">申請早鳥測試</a></Button></Card>
        <Card className="rounded-2xl p-5"><div className="flex items-center justify-between"><h3 className="text-xl font-black">人工客製</h3><UserRoundCheck className="text-[#147D64]"/></div><p className="mt-2 text-2xl font-black">$699–1,500<span className="text-sm font-bold">／次</span></p><p className="mt-1 text-sm text-muted-foreground">限制較複雜、不知道怎麼安排</p><ul className="mt-5 space-y-3 text-sm"><li>✓ 真人評估資料</li><li>✓ 客製課表與說明</li><li>✓ 後續調整方向</li></ul><Button onClick={()=>setCoachOpen(true)} variant="outline" className="mt-5 w-full rounded-xl">找 Esther 協助</Button></Card>
      </div><p className="mt-3 text-xs text-muted-foreground">Coach Pro 年費早鳥預計 $1,490–1,990；目前先招募實際使用的教練，不開放線上付款。</p></section>
      <section className="no-print mt-6 grid gap-4 rounded-2xl border border-[#B8C8D3] bg-white p-5 md:grid-cols-[auto_1fr]"><HeartPulse className="text-[#147D64]"/><div><h2 className="font-black">開始前的貼心提醒</h2><p className="mt-2 leading-7 text-muted-foreground">每個人的身體狀況都不一樣，我們希望你安心、慢慢開始。這份內容是教練安排運動時的輔助建議；若目前有管路、仍在受傷或術後恢復期，會先邀請你取得醫療專業人員同意，再由教練陪你安排合適的活動。運動中若有胸悶、暈眩或疼痛加劇，請先停下來休息並尋求專業協助。</p></div></section>
      <div className="no-print mt-6 rounded-2xl border border-dashed border-[#9FB3C2] bg-white p-5"><p className="font-black">動作庫</p><p className="mt-1 text-sm leading-6 text-muted-foreground">由教練依照可接受姿勢、訓練目標與手邊器材，安排適合的暖身、主動作與伸展。</p></div>
    </section>}
    <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}><DialogContent className="sm:max-w-2xl"><DialogHeader><div className="mb-2 grid size-11 place-items-center rounded-xl bg-[#FFF4E8] text-[#F97316]"><Crown/></div><DialogTitle className="text-xl font-black">先免費帶完這堂，需要持續使用時再升級</DialogTitle><DialogDescription>不是為了多產生幾次課表，而是讓你保留家人或學員資料，知道上次做了什麼、這次該怎麼調整。</DialogDescription></DialogHeader><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-orange-200 bg-[#FFF9F3] p-4"><p className="font-black">Family Plus</p><p className="mt-1 text-sm font-bold text-[#C2410C]">$99／月或 $790／年</p><p className="mt-3 text-sm leading-6 text-muted-foreground">適合長期陪父母運動：每週課表、疼痛／RPE 紀錄、歷次調整與課表圖卡。</p></div><div className="rounded-xl bg-primary p-4 text-white"><p className="font-black">Coach Pro</p><p className="mt-1 text-sm font-bold text-[#9FE3C2]">$299／月或 $2,490／年</p><p className="mt-3 text-sm leading-6 text-white/70">適合教練一次管理多位學員，快速沿用資料、複製修改課表並匯出品牌講義。</p><p className="mt-2 text-xs text-[#9FE3C2]">首批教練年費早鳥 $1,490–1,990</p></div></div><DialogFooter className="gap-2 sm:justify-between"><Button onClick={()=>setUpgradeOpen(false)} variant="outline">繼續使用免費版</Button><Button asChild className="bg-[#F97316] text-white hover:bg-[#EA580C]"><a href="https://docs.google.com/forms/d/e/1FAIpQLSerur4ao6NPy5bjPTzWacD7CTfcTHW1ZlIAtttyNvFribAnwQ/viewform?usp=publish-editor" target="_blank" rel="noreferrer">申請 Coach Pro 早鳥測試</a></Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={historyOpen} onOpenChange={setHistoryOpen}><DialogContent className="sm:max-w-lg"><DialogHeader><div className="mb-2 grid size-11 place-items-center rounded-xl bg-[#E7F8F1] text-[#147D64]"><History/></div><DialogTitle className="text-xl font-black">歷次課表紀錄</DialogTitle><DialogDescription>紀錄只保存在這台裝置的瀏覽器，不會上傳病史、用藥或疼痛資料。</DialogDescription></DialogHeader><div className="max-h-80 space-y-2 overflow-y-auto">{historyEntries.length?historyEntries.map((entry)=><div key={entry.id} className="rounded-xl border bg-[#F8FAFC] p-3"><div className="flex items-center justify-between gap-3"><p className="font-black">{entry.person}</p><p className="text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleString('zh-TW')}</p></div><p className="mt-1 text-sm text-muted-foreground">每週 {entry.sessions} 次 · {goalOptions.find((goal)=>goal.value===entry.goal)?.label}</p></div>):<div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">還沒有紀錄。產生課表後按「儲存紀錄」即可保存。</div>}</div><DialogFooter><Button onClick={()=>setHistoryOpen(false)} className="bg-primary">完成</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={coachOpen} onOpenChange={setCoachOpen}><DialogContent className="sm:max-w-lg"><DialogHeader><div className="mb-2 grid size-11 place-items-center rounded-xl bg-[#E7F8F1] text-[#147D64]"><UserRoundCheck/></div><DialogTitle className="text-xl font-black">讓教練陪你安排</DialogTitle><DialogDescription>每個人的恢復節奏都不同。取得醫療專業人員同意後，教練會依你的疼痛、限制與可使用器材，安排適合的活動。</DialogDescription></DialogHeader><div className="rounded-xl border border-[#BFE8D5] bg-[#F0FBF6] p-4 text-sm text-[#12624F]"><p className="font-black">預約客製評估</p><p className="mt-1">LINE ID：yp0905</p><div className="mt-3 grid gap-2 sm:grid-cols-2"><Button asChild className="bg-[#06C755] text-white hover:bg-[#05B84E]"><a href="https://line.me/ti/p/~yp0905" target="_blank" rel="noreferrer">加入 LINE</a></Button><Button asChild variant="outline"><a href="https://docs.google.com/forms/d/e/1FAIpQLSerur4ao6NPy5bjPTzWacD7CTfcTHW1ZlIAtttyNvFribAnwQ/viewform?usp=publish-editor" target="_blank" rel="noreferrer">填寫預約單</a></Button></div><p className="mt-3 text-xs text-[#397565]">預約資料會由 Google 表單交給教練，本網站不會另外儲存。</p></div><DialogFooter><Button onClick={()=>setCoachOpen(false)} variant="outline">返回安全確認</Button></DialogFooter></DialogContent></Dialog>
  </main>;
}


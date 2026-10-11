import React, { useMemo, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Wallet, ArrowUpRight, ArrowDownRight, PiggyBank, Target, Sparkles, ShieldCheck,
  CalendarDays, Plus, SlidersHorizontal, Coffee, Bus, ShoppingBag, Home, HeartPulse,
  Clapperboard, Smartphone, Check, X, RotateCcw, ChevronRight, Zap, TrendingUp,
  AlertTriangle, CircleHelp, Bell, LayoutDashboard, ReceiptText, CreditCard, Menu,
  ArrowRight, CircleDollarSign, PartyPopper, Trash2, BadgeCheck, Gauge
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell
} from 'recharts';
import './styles.css';

const INR = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.round(n));
const initialTransactions = [
  { id: 1, name: 'Monthly allowance', category: 'Income', amount: 10000, date: 'Oct 1', type: 'income', icon: Wallet },
  { id: 2, name: 'Hostel / home contribution', category: 'Essentials', amount: 1800, date: 'Oct 2', type: 'expense', icon: Home },
  { id: 3, name: 'Bus pass & commute', category: 'Transport', amount: 850, date: 'Oct 3', type: 'expense', icon: Bus },
  { id: 4, name: 'Groceries & snacks', category: 'Food', amount: 620, date: 'Oct 4', type: 'expense', icon: ShoppingBag },
  { id: 5, name: 'Music subscription', category: 'Subscriptions', amount: 119, date: 'Oct 5', type: 'expense', icon: Smartphone },
];

const startingState = {
  day: 11, budget: 10000, transactions: initialTransactions,
  goals: [{ id: 1, name: 'Emergency cushion', target: 2000, saved: 650, icon: ShieldCheck }, { id: 2, name: 'New headphones', target: 3000, saved: 400, icon: Target }],
  subscriptions: [
    { id: 1, name: 'Music app', amount: 119, next: 'Oct 15', active: true },
    { id: 2, name: 'Video streaming', amount: 149, next: 'Oct 19', active: true },
    { id: 3, name: 'Cloud storage', amount: 79, next: 'Oct 22', active: true }
  ]
};
const categoryColors = { Essentials: '#6678e8', Food: '#f5a65b', Transport: '#41b9a7', Lifestyle: '#c18cf2', Subscriptions: '#ef7d9b', Health: '#6ca9e8', Other: '#9aa6b2' };
const iconFor = { Food: Coffee, Transport: Bus, Essentials: Home, Lifestyle: ShoppingBag, Subscriptions: Smartphone, Health: HeartPulse, Other: ReceiptText };

function loadState() {
  try { const saved = localStorage.getItem('rupeeflow-state'); return saved ? JSON.parse(saved) : startingState; }
  catch { return startingState; }
}

function App() {
  const [state, setState] = useState(loadState);
  const [activeTab, setActiveTab] = useState('Overview');
  const [showAdd, setShowAdd] = useState(false);
  const [showSim, setShowSim] = useState(false);
  const [showAllTx, setShowAllTx] = useState(false);
  const [toast, setToast] = useState('');
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('250');
  const [expenseCategory, setExpenseCategory] = useState('Food');
  const [simType, setSimType] = useState('buy');
  const [simAmount, setSimAmount] = useState(1200);
  const [simSave, setSimSave] = useState(false);
  const [goalAmount, setGoalAmount] = useState(300);
  const [goalId, setGoalId] = useState(1);

  useEffect(() => { localStorage.setItem('rupeeflow-state', JSON.stringify(state)); }, [state]);
  const expenses = state.transactions.filter(t => t.type === 'expense').reduce((s,t) => s+t.amount, 0);
  const income = state.transactions.filter(t => t.type === 'income').reduce((s,t) => s+t.amount, 0);
  const activeSubs = state.subscriptions.filter(s => s.active).reduce((s,x) => s+x.amount, 0);
  const balance = income - expenses;
  const daysLeft = Math.max(1, 30 - state.day + 1);
  const dailyAllowance = (balance - activeSubs) / daysLeft;
  const plannedCommitments = activeSubs;
  const projectedSpend = expenses + activeSubs + Math.max(0, dailyAllowance) * (30 - state.day);
  const projectedEnd = income - projectedSpend;
  const emergencyGoal = state.goals.find(g => g.name === 'Emergency cushion');
  const risk = balance < 1200 ? 'High' : balance < 3000 ? 'Moderate' : 'Low';
  const healthScore = Math.max(8, Math.min(100, Math.round(45 + (balance / 10000) * 35 + (emergencyGoal?.saved || 0) / 200 - (risk === 'High' ? 18 : risk === 'Moderate' ? 7 : 0))));
  const goalProgress = state.goals.reduce((s,g)=>s+g.saved,0);
  const spendByCategory = Object.keys(categoryColors).map(name => ({
    name, value: state.transactions.filter(t => t.type==='expense' && t.category===name).reduce((s,t)=>s+t.amount,0)
  })).filter(x=>x.value>0);
  const chartData = useMemo(() => {
    const spentByDay = [0, 1800, 2650, 3270, 3389, 3600, 4020, 4300, 4380, expenses];
    const remaining = [];
    let prev = income;
    for (let i=0;i<10;i++) { if (i>0) prev -= (spentByDay[i]-spentByDay[i-1]); remaining.push({ day: `D${i+1}`, balance: Math.max(0, prev), ideal: Math.max(0, income - (income/30)*(i+1)) }); }
    remaining[remaining.length-1] = { ...remaining[remaining.length-1], balance: Math.max(0,balance) };
    return remaining;
  }, [income, expenses, balance]);
  const notify = message => { setToast(message); window.setTimeout(()=>setToast(''), 2600); };
  const updateState = fn => setState(prev => fn(prev));
  const addExpense = e => {
    e.preventDefault();
    const amount = Number(expenseAmount);
    if (!expenseName.trim() || !amount || amount < 1) return;
    updateState(prev => ({ ...prev, transactions: [{ id: Date.now(), name: expenseName.trim(), category: expenseCategory, amount, date: `Oct ${prev.day}`, type: 'expense', icon: iconFor[expenseCategory] || ReceiptText }, ...prev.transactions] }));
    setExpenseName(''); setExpenseAmount('250'); setShowAdd(false); notify('Expense added. Your budget has been updated.');
  };
  const simulate = () => setShowSim(true);
  const applyDecision = () => {
    const amount = Number(simAmount);
    if (simType === 'buy' && amount > balance) { notify('That purchase is above your available balance. Try a smaller amount.'); return; }
    if (simType === 'buy') {
      updateState(prev => ({...prev, transactions:[{id:Date.now(),name:'Simulated purchase',category:'Lifestyle',amount,date:`Oct ${prev.day}`,type:'expense',icon:ShoppingBag},...prev.transactions]}));
    } else if (simType === 'save') {
      if (amount > balance) { notify('Not enough available balance for this savings transfer.'); return; }
      updateState(prev => ({...prev, transactions:[{id:Date.now(),name:'Moved to savings',category:'Other',amount,date:`Oct ${prev.day}`,type:'expense',icon:PiggyBank},...prev.transactions], goals:prev.goals.map(g=>g.id===goalId?{...g,saved:g.saved+amount}:g)}));
    } else {
      updateState(prev => ({...prev, transactions:[{id:Date.now(),name:'Unexpected expense',category:'Health',amount,date:`Oct ${prev.day}`,type:'expense',icon:HeartPulse},...prev.transactions]}));
    }
    setShowSim(false); notify('Decision applied. All projections recalculated.');
  };
  const reset = () => { setState(startingState); notify('Demo reset to the original ₹10,000 plan.'); };
  const spendPct = Math.min(100, expenses / Math.max(income,1) * 100);
  const moneyLeftForDay = Math.max(0, dailyAllowance);
  const tabItems = [{name:'Overview',icon:LayoutDashboard},{name:'Transactions',icon:ReceiptText},{name:'Goals & savings',icon:Target},{name:'Subscriptions',icon:CreditCard}];
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Wallet size={21}/></div><span>rupee<span className="brand-light">flow</span><i>.</i></span></div>
      <div className="profile-mini"><div className="avatar">A</div><div><b>Hey, Aanya 👋</b><small>Your money space</small></div><ChevronRight size={16} className="muted"/></div>
      <div className="side-label">YOUR SPACE</div>
      <nav>{tabItems.map(item=><button key={item.name} onClick={()=>setActiveTab(item.name)} className={`nav-item ${activeTab===item.name?'active':''}`}><item.icon size={18}/><span>{item.name}</span>{item.name==='Transactions'&&<span className="nav-count">{state.transactions.length}</span>}</button>)}</nav>
      <div className="side-promo"><div className="promo-icon"><Sparkles size={19}/></div><b>Small moves.<br/>Big main-character energy.</b><p>Your money has a plan. You’ve got this.</p><div className="promo-line"><span style={{width:`${healthScore}%`}}/></div><small>Money health · {healthScore}/100</small></div>
      <div className="sidebar-bottom"><button className="nav-item" onClick={reset}><RotateCcw size={17}/><span>Reset demo</span></button><div className="privacy-note"><ShieldCheck size={14}/> Demo data stays in this browser</div></div>
    </aside>

    <main className="main-area">
      <header className="topbar"><div className="breadcrumb">Your space <span>/</span> <b>{activeTab}</b></div><div className="top-actions"><span className="cycle-pill"><span className="live-dot"/> OCT 01 — OCT 30, 2026</span><button className="icon-btn" aria-label="Notifications" onClick={()=>notify('You’re all caught up. No urgent money alerts.')}><Bell size={18}/><i/></button><div className="avatar top-avatar">A</div></div></header>
      <div className="content">
        {activeTab==='Overview' && <>
          <div className="welcome-row"><div><div className="eyebrow"><Sparkles size={14}/> YOUR MONEY, IN MOTION</div><h1>Make your money <em>make sense.</em></h1><p className="subhead">30 days. ₹10,000. You’re in control of what happens next.</p></div><button className="primary-btn" onClick={()=>setShowAdd(true)}><Plus size={18}/> Add expense</button></div>
          <div className="hero-grid">
            <section className="balance-card">
              <div className="balance-top"><span className="overline">AVAILABLE BALANCE</span><span className="secure-tag"><ShieldCheck size={13}/> Looking good</span></div>
              <div className="balance-number">{INR(balance)}</div>
              <div className="balance-caption"><span className="balance-trend"><TrendingUp size={15}/> {Math.round(100-spendPct)}% left</span><span>of your ₹10,000 budget</span></div>
              <div className="budget-track"><div style={{width:`${spendPct}%`}}/></div>
              <div className="balance-footer"><div><small>INCOME</small><b>{INR(income)}</b></div><div><small>SPENT SO FAR</small><b>{INR(expenses)}</b></div><div><small>SAVING GOALS</small><b>{INR(goalProgress)}</b></div></div>
              <div className="balance-orb orb-one"/><div className="balance-orb orb-two"/>
            </section>
            <section className="daily-card"><div className="card-head"><div className="mini-icon purple"><CalendarDays size={18}/></div><span className="muted">DAILY ALLOWANCE</span><button className="dots" onClick={()=>notify('Allowance = available balance ÷ days remaining.')}>•••</button></div><div className="daily-number">{INR(moneyLeftForDay)}<small>/ day</small></div><p className="muted-text">For the next <b>{daysLeft} days</b>, if you want to stay on track.</p><div className="allowance-bottom"><div className="allowance-ring"><svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="17" className="ring-bg"/><circle cx="22" cy="22" r="17" className="ring-fg" style={{strokeDasharray:`${Math.min(100,Math.max(0,healthScore))/100*107} 107`}}/></svg><Zap size={15}/></div><div><b>{risk==='Low'?'You have breathing room':risk==='Moderate'?'Keep an eye on spending':'Time to slow spending'}</b><small>{risk==='Low'?'You’re pacing well.':risk==='Moderate'?'A few mindful choices can help.':'Protect essentials first.'}</small></div></div></section>
          </div>

          <div className="section-title-row"><div><h2>Your money snapshot</h2><p>One decision can change the whole picture.</p></div><button className="text-btn" onClick={()=>setShowSim(true)}><SlidersHorizontal size={16}/> Try a what-if <ArrowRight size={15}/></button></div>
          <div className="stats-grid">
            <Stat icon={PiggyBank} label="Savings goals" value={INR(goalProgress)} meta="Across your goals" tone="mint" />
            <Stat icon={CalendarDays} label="Bills & subscriptions" value={INR(plannedCommitments)} meta="Still scheduled this month" tone="violet" />
            <Stat icon={TrendingUp} label="Month-end forecast" value={INR(Math.max(0,projectedEnd))} meta={projectedEnd<0?'Budget may run short':'If your pace continues'} tone="blue" />
            <div className="stat-card risk-stat"><div className={`stat-icon ${risk==='Low'?'mint':risk==='Moderate'?'amber':'rose'}`}><Gauge size={18}/></div><div className="stat-label">Financial risk</div><div className={`risk-word ${risk.toLowerCase()}`}>{risk}</div><div className="stat-meta">{risk==='Low'?'Room for the unexpected':risk==='Moderate'?'Watch upcoming commitments':'Reduce non-essential spend'}</div></div>
          </div>

          <div className="dashboard-grid">
            <section className="panel forecast-panel"><div className="panel-head"><div><h3>Balance forecast</h3><p>Your runway, not just your receipts.</p></div><span className="legend"><i/> Balance <i className="legend-muted"/> Ideal pace</span></div><div className="chart-summary"><b>{INR(balance)}</b><span>available today</span><span className={`forecast-chip ${projectedEnd<2000?'warning':'positive'}`}>{projectedEnd<2000?'Tight runway':'On your way'} <ArrowUpRight size={13}/></span></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{top:10,right:8,left:-22,bottom:0}}><defs><linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6878e9" stopOpacity={0.24}/><stop offset="100%" stopColor="#6878e9" stopOpacity={0.01}/></linearGradient></defs><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#edf0f6"/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill:'#9ba3b4',fontSize:11}}/><YAxis axisLine={false} tickLine={false} tick={{fill:'#9ba3b4',fontSize:10}} tickFormatter={v=>`₹${v/1000}k`}/><Tooltip formatter={v=>INR(v)} contentStyle={{border:'1px solid #edf0f6',borderRadius:12,fontSize:12}}/><Area type="monotone" dataKey="ideal" stroke="#b7becd" strokeDasharray="5 5" fill="transparent" strokeWidth={2} name="Ideal pace"/><Area type="monotone" dataKey="balance" stroke="#6878e9" fill="url(#balanceFill)" strokeWidth={2.8} name="Balance" activeDot={{r:5}}/></AreaChart></ResponsiveContainer></div><div className="chart-foot"><span><i className="dot-purple"/> Your actual pace</span><span><i className="dot-grey"/> Even-spend plan</span><span className="foot-note">Illustrative forecast · updates with your choices</span></div></section>
            <section className="panel spend-panel"><div className="panel-head"><div><h3>Where it’s going</h3><p>Your spending, by category.</p></div><button className="circle-action" onClick={()=>setActiveTab('Transactions')}><ArrowUpRight size={17}/></button></div><div className="donut-wrap">{spendByCategory.length?<><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={spendByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={57} outerRadius={79} paddingAngle={3} stroke="none">{spendByCategory.map((entry,index)=><Cell key={entry.name} fill={categoryColors[entry.name]}/>)}</Pie><Tooltip formatter={v=>INR(v)}/></PieChart></ResponsiveContainer><div className="donut-center"><b>{INR(expenses)}</b><small>total spent</small></div></>:<div className="empty-donut">No expenses yet</div>}</div><div className="category-list">{spendByCategory.slice(0,4).map(c=><div className="category-row" key={c.name}><span className="category-name"><i style={{background:categoryColors[c.name]}}/>{c.name}</span><b>{INR(c.value)}</b><small>{Math.round(c.value/Math.max(1,expenses)*100)}%</small></div>)}</div></section>
          </div>

          <div className="lower-grid">
            <section className="panel transactions-panel"><div className="panel-head"><div><h3>Recent activity</h3><p>Every rupee has a story.</p></div><button className="text-btn small" onClick={()=>{setActiveTab('Transactions');setShowAllTx(true)}}>View all <ChevronRight size={15}/></button></div><div className="transaction-list">{state.transactions.slice(0,4).map(tx=><Transaction key={tx.id} tx={tx}/>)}</div></section>
            <section className="insight-card"><div className="insight-top"><div className="insight-icon"><Sparkles size={19}/></div><span>YOUR MONEY NUDGE</span><span className="insight-ai">SMART TIP</span></div><h3>{risk==='Low'?'You’re building a little breathing room.':risk==='Moderate'?'One mindful swap could help.':'Let’s protect your essentials first.'}</h3><p>{risk==='Low'?`You have ${INR(balance)} available. Keep your emergency cushion moving, even if it’s just ₹50 at a time.`:risk==='Moderate'?'Try pausing one non-essential purchase until your next allowance. Your daily allowance will recalculate automatically.':'Your current balance is getting tight. Review subscriptions and prioritise travel, food and essential bills before fun spending.'}</p><button onClick={()=>setShowSim(true)}>Explore a smarter move <ArrowRight size={15}/></button><div className="sparkle-bg">✳</div></section>
          </div>
        </>}

        {activeTab==='Transactions' && <><PageHeading title="Every rupee, accounted for." subtitle="Track what came in, what went out, and what changed." action={<button className="primary-btn" onClick={()=>setShowAdd(true)}><Plus size={18}/> Add expense</button>}/><div className="stats-grid"><Stat icon={ArrowDownRight} label="Total spent" value={INR(expenses)} meta="This budget cycle" tone="rose"/><Stat icon={ArrowUpRight} label="Money in" value={INR(income)} meta="Income & allowance" tone="mint"/><Stat icon={Wallet} label="Balance now" value={INR(balance)} meta="After recorded activity" tone="blue"/><Stat icon={ReceiptText} label="Transactions" value={state.transactions.length} meta="All recorded activity" tone="violet"/></div><section className="panel all-transactions"><div className="panel-head"><div><h3>Activity feed</h3><p>Newest transactions first</p></div><span className="cycle-pill">30-DAY PLAN</span></div>{state.transactions.map(tx=><Transaction key={tx.id} tx={tx} detailed onDelete={()=>updateState(p=>({...p,transactions:p.transactions.filter(t=>t.id!==tx.id)}))}/>)}</section></>}

        {activeTab==='Goals & savings' && <><PageHeading title="Future you says thanks." subtitle="Give your goals a little money and a lot of momentum." action={<button className="primary-btn" onClick={()=>setShowSim(true)}><Plus size={18}/> Add to savings</button>}/><div className="goals-banner"><div><div className="eyebrow"><Target size={14}/> THE LONG GAME</div><h2>Saving is a decision you make <em>today.</em></h2><p>Move money into a goal and we’ll update your available balance and daily allowance.</p></div><div className="goal-total"><small>TOTAL SAVED</small><b>{INR(goalProgress)}</b><span>of {INR(state.goals.reduce((s,g)=>s+g.target,0))} goal target</span></div></div><div className="goals-grid">{state.goals.map(g=><div className="goal-card" key={g.id}><div className="goal-card-top"><div className="goal-icon"><Target size={21}/></div><span className="goal-tag">{g.saved>=g.target?'Goal reached':'In progress'}</span></div><h3>{g.name}</h3><div className="goal-numbers"><b>{INR(g.saved)}</b><span>of {INR(g.target)}</span></div><div className="goal-track"><span style={{width:`${Math.min(100,g.saved/g.target*100)}%`}}/></div><div className="goal-foot"><span>{Math.round(g.saved/g.target*100)}% complete</span><button onClick={()=>{setGoalId(g.id);setSimType('save');setShowSim(true)}}>Add money <ArrowRight size={14}/></button></div></div>)}</div><div className="panel savings-note"><ShieldCheck size={21}/><div><b>Your emergency cushion is your financial seatbelt.</b><p>Even a small reserve can make an unexpected expense less stressful. Aim for consistency over perfection.</p></div></div></>}

        {activeTab==='Subscriptions' && <><PageHeading title="Subscriptions, on your terms." subtitle="Know what’s renewing before it surprises you." action={<span className="cycle-pill">MONTHLY COMMITMENTS</span>}/><div className="subscription-hero"><div className="sub-hero-icon"><CreditCard size={23}/></div><div><span>ACTIVE MONTHLY COMMITMENTS</span><h2>{INR(activeSubs)}<small>/ month</small></h2><p>{state.subscriptions.filter(s=>s.active).length} active subscriptions · Included in your forecast</p></div><div className="sub-hero-side"><span>Potential yearly spend</span><b>{INR(activeSubs*12)}</b></div></div><div className="panel subscription-list"><div className="panel-head"><div><h3>Your recurring payments</h3><p>Toggle a subscription to see how your plan changes.</p></div></div>{state.subscriptions.map(s=><div className="subscription-row" key={s.id}><div className="sub-app-icon"><Smartphone size={19}/></div><div className="sub-info"><b>{s.name}</b><small>Renews {s.next}</small></div><div className="sub-price"><b>{INR(s.amount)}</b><small>/ month</small></div><button className={`toggle ${s.active?'on':''}`} onClick={()=>updateState(p=>({...p,subscriptions:p.subscriptions.map(x=>x.id===s.id?{...x,active:!x.active}:x)}))} aria-label={`Toggle ${s.name}`}><span/></button><span className={`sub-status ${s.active?'active-status':'paused-status'}`}>{s.active?'Active':'Paused'}</span></div>)}</div><div className="insight-strip"><Zap size={19}/><p><b>Quick insight:</b> Pausing one subscription doesn’t just save the monthly amount — it gives your daily allowance a little more room too.</p></div></>}
      </div>
      <footer className="footer"><span>rupeeflow<i>.</i> · Made for real-life money moments</span><span>Demo experience · Not connected to a bank</span></footer>
    </main>

    {showAdd && <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&setShowAdd(false)}><div className="modal"><div className="modal-head"><div><span className="eyebrow">ADD TO YOUR STORY</span><h2>Log an expense</h2><p>Small spends count. No judgement here.</p></div><button className="icon-btn" onClick={()=>setShowAdd(false)}><X size={19}/></button></div><form onSubmit={addExpense}><label>What did you spend on?<input value={expenseName} onChange={e=>setExpenseName(e.target.value)} placeholder="e.g. Chai with friends" required autoFocus/></label><label>Amount (₹)<input type="number" min="1" max={Math.max(1,balance)} value={expenseAmount} onChange={e=>setExpenseAmount(e.target.value)} required/></label><label>Category<select value={expenseCategory} onChange={e=>setExpenseCategory(e.target.value)}>{['Food','Transport','Essentials','Lifestyle','Subscriptions','Health','Other'].map(c=><option key={c}>{c}</option>)}</select></label><div className="modal-impact"><CircleHelp size={17}/><span>This updates your available balance, daily allowance, forecast and risk level.</span></div><button className="primary-btn full-btn" type="submit">Save expense <ArrowRight size={16}/></button></form></div></div>}

    {showSim && <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&setShowSim(false)}><div className="modal simulator-modal"><div className="modal-head"><div><span className="eyebrow"><SlidersHorizontal size={13}/> DECISION LAB</span><h2>What if you did this?</h2><p>Try it on for size before real life does.</p></div><button className="icon-btn" onClick={()=>setShowSim(false)}><X size={19}/></button></div><div className="sim-tabs">{[{id:'buy',label:'Buy something',icon:ShoppingBag},{id:'save',label:'Save money',icon:PiggyBank},{id:'surprise',label:'Unexpected bill',icon:AlertTriangle}].map(t=><button className={simType===t.id?'selected':''} onClick={()=>setSimType(t.id)} key={t.id}><t.icon size={16}/>{t.label}</button>)}</div><div className="sim-amount-row"><label>{simType==='buy'?'Purchase amount':simType==='save'?'Move into savings':'Unexpected expense'}</label><strong>{INR(simAmount)}</strong></div><input className="range" type="range" min="50" max={Math.max(500,Math.min(5000,Math.max(balance,5000)))} step="50" value={simAmount} onChange={e=>setSimAmount(Number(e.target.value))}/><div className="range-labels"><span>₹50</span><span>₹5,000</span></div>{simType==='save'&&<label className="goal-select-label">Which goal?<select value={goalId} onChange={e=>setGoalId(Number(e.target.value))}>{state.goals.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></label>}<div className="impact-box"><div className="impact-heading"><Sparkles size={16}/> HERE’S WHAT CHANGES</div><div className="impact-row"><span>Balance after decision</span><b className={balance-simAmount<0?'negative':''}>{INR(balance-simAmount)}</b></div><div className="impact-row"><span>New daily allowance</span><b>{INR(Math.max(0,(balance-simAmount-activeSubs)/daysLeft))}<small>/ day</small></b></div><div className="impact-row"><span>Emergency cushion</span><b>{INR((emergencyGoal?.saved||0)+(simType==='save'&&goalId===1?simAmount:0))}</b></div><div className="impact-row"><span>Risk after decision</span><b className={(balance-simAmount)<1200?'negative':(balance-simAmount)<3000?'warning-text':''}>{balance-simAmount<1200?'High':balance-simAmount<3000?'Moderate':'Low'}</b></div>{balance-simAmount<1200&&simType!=='save'&&<div className="impact-warning"><AlertTriangle size={16}/> This leaves a thin buffer. Consider a smaller amount or wait until later.</div>}{simType==='save'&&<div className="impact-good"><BadgeCheck size={16}/> You’re building a goal — available spending money will decrease, but savings will grow.</div>}</div><button className="primary-btn full-btn" onClick={applyDecision}>{simType==='buy'?'Apply purchase':simType==='save'?'Move money to savings':'Record unexpected bill'} <ArrowRight size={16}/></button><p className="sim-disclaimer">This is a local demo simulation. Nothing is paid or transferred.</p></div></div>}
    {toast&&<div className="toast"><Check size={17}/>{toast}</div>}
  </div>;
}
function Stat({icon:Icon,label,value,meta,tone}) { return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={18}/></div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-meta">{meta}</div></div>; }
function Transaction({tx,detailed=false,onDelete}) { const Icon=tx.icon && typeof tx.icon==='function'?tx.icon:(iconFor[tx.category]||ReceiptText); return <div className="transaction-row"><div className={`tx-icon ${tx.type==='income'?'income-icon':tx.category.toLowerCase()}`}><Icon size={17}/></div><div className="tx-details"><b>{tx.name}</b><small>{tx.category} <span>·</span> {tx.date}</small></div><div className={`tx-amount ${tx.type==='income'?'income-amount':''}`}>{tx.type==='income'?'+':'−'}{INR(tx.amount)}</div>{detailed&&onDelete&&<button className="delete-btn" onClick={onDelete} aria-label="Delete transaction"><Trash2 size={15}/></button>}</div>; }
function PageHeading({title,subtitle,action}) { return <div className="welcome-row page-heading"><div><div className="eyebrow"><Sparkles size={14}/> YOUR MONEY, IN MOTION</div><h1>{title}</h1><p className="subhead">{subtitle}</p></div>{action}</div>; }

createRoot(document.getElementById('root')).render(<App/>);

import React, { useEffect, useMemo, useState } from 'react';
import { Leaf, Recycle, LogOut, LayoutDashboard, PlusCircle, ClipboardList, ShieldCheck, Search, RefreshCw } from 'lucide-react';
import { api } from './api';

const initialForm = {category_id:'',quantity:'',pickup_address:'',pickup_date:'',notes:''};
function App(){
 const [user,setUser]=useState(()=>{try{return JSON.parse(localStorage.getItem('ecotrack_user'))}catch{return null}});
 const [page,setPage]=useState('dashboard');
 const [authMode,setAuthMode]=useState('login');
 const [auth,setAuth]=useState({name:'',email:'',password:'',phone:''});
 const [form,setForm]=useState(initialForm);
 const [categories,setCategories]=useState([]);
 const [requests,setRequests]=useState([]);
 const [stats,setStats]=useState({});
 const [notice,setNotice]=useState('');
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const [filter,setFilter]=useState('');
 const [search,setSearch]=useState('');
 const isAdmin=user?.role==='admin';
 const flash=(msg)=>{setNotice(msg);setError('');};
 const fail=(e)=>{setError(e.message);setNotice('');};
 async function load(){
  try{
   const cats=await api('/requests/categories'); setCategories(cats);
   if(isAdmin){
    const [all,s]=await Promise.all([api('/requests/admin/all'),api('/requests/admin/stats')]);setRequests(all);setStats(s);
   }else setRequests(await api('/requests/mine'));
  }catch(e){fail(e);}
 }
 useEffect(()=>{if(user)load();},[user?.id,user?.role]);
 async function submitAuth(e){
  e.preventDefault();setBusy(true);
  try{
   const data=await api(`/auth/${authMode}`,{method:'POST',body:JSON.stringify(auth)});
   localStorage.setItem('ecotrack_token',data.token);localStorage.setItem('ecotrack_user',JSON.stringify(data.user));
   setUser(data.user);setAuth({name:'',email:'',password:'',phone:''});flash(`Welcome ${data.user.name}!`);
  }catch(e){fail(e)}finally{setBusy(false)}
 }
 function logout(){localStorage.removeItem('ecotrack_token');localStorage.removeItem('ecotrack_user');setUser(null);setRequests([]);setPage('dashboard');}
 async function createRequest(e){
  e.preventDefault();setBusy(true);
  try{await api('/requests',{method:'POST',body:JSON.stringify(form)});setForm(initialForm);flash('Pickup request submitted successfully.');await load();setPage('requests');}
  catch(e){fail(e)}finally{setBusy(false)}
 }
 async function updateStatus(id,status){
  try{await api(`/requests/admin/${id}/status`,{method:'PATCH',body:JSON.stringify({status})});flash(`Request #${id} updated to ${status}.`);await load();}
  catch(e){fail(e)}
 }
 const visible=useMemo(()=>requests.filter(r=>(!filter||r.status===filter)&&
  (`${r.category_name} ${r.pickup_address} ${r.user_name||''} ${r.id}`).toLowerCase().includes(search.toLowerCase())),[requests,filter,search]);
 const counts=isAdmin?stats:{total:requests.length,pending:requests.filter(r=>r.status==='Pending').length,approved:requests.filter(r=>r.status==='Approved'||r.status==='Scheduled').length,completed:requests.filter(r=>r.status==='Completed').length};
 if(!user) return <main className="auth-wrap"><section className="auth-card"><div className="brand big"><span className="brand-icon"><Leaf/></span><span>EcoTrack</span></div><p className="eyebrow">SMART WASTE MANAGEMENT</p><h1>{authMode==='login'?'Welcome back':'Create your account'}</h1><p className="muted">Make every pickup a step towards a cleaner planet.</p>
 {notice&&<div className="alert success">{notice}</div>}{error&&<div className="alert error">{error}</div>}
 <form onSubmit={submitAuth} className="stack">
 {authMode==='register'&&<><label>Full name<input required value={auth.name} onChange={e=>setAuth({...auth,name:e.target.value})} placeholder="Your name"/></label><label>Phone (optional)<input value={auth.phone} onChange={e=>setAuth({...auth,phone:e.target.value})} placeholder="Phone number"/></label></>}
 <label>Email address<input type="email" required value={auth.email} onChange={e=>setAuth({...auth,email:e.target.value})} placeholder="you@example.com"/></label>
 <label>Password<input type="password" required minLength="8" value={auth.password} onChange={e=>setAuth({...auth,password:e.target.value})} placeholder="At least 8 characters"/></label>
 <button className="primary" disabled={busy}>{busy?'Please wait…':authMode==='login'?'Log in':'Create account'}</button>
 </form><p className="switch">{authMode==='login'?"New to EcoTrack?":"Already have an account?"} <button className="link" onClick={()=>{setAuthMode(authMode==='login'?'register':'login');setError('')}}>{authMode==='login'?'Create an account':'Log in'}</button></p>
 <p className="tiny">Admin access is enabled by the database owner after account registration.</p></section></main>;
 return <div className="app-shell"><aside className="sidebar"><div className="brand"><span className="brand-icon"><Leaf/></span>EcoTrack</div><div className="side-label">WORKSPACE</div><button className={page==='dashboard'?'nav active':'nav'} onClick={()=>setPage('dashboard')}><LayoutDashboard size={18}/>Dashboard</button>{!isAdmin&&<button className={page==='new'?'nav active':'nav'} onClick={()=>setPage('new')}><PlusCircle size={18}/>New pickup</button>}<button className={page==='requests'?'nav active':'nav'} onClick={()=>setPage('requests')}><ClipboardList size={18}/>{isAdmin?'All requests':'My requests'}</button>{isAdmin&&<div className="admin-tag"><ShieldCheck size={16}/> Administrator</div>}<div className="sidebar-bottom"><div className="user-mini"><div className="avatar">{user.name?.[0]?.toUpperCase()}</div><div><strong>{user.name}</strong><small>{user.role}</small></div></div><button className="nav logout" onClick={logout}><LogOut size={18}/>Log out</button></div></aside>
 <main className="main"><header className="topbar"><div><p className="eyebrow">CLEANER HABITS. GREENER TOMORROW.</p><h2>{page==='new'?'Schedule a pickup':page==='requests'?(isAdmin?'All pickup requests':'My pickup requests'):'Dashboard'}</h2></div><button className="icon-btn" onClick={load} title="Refresh"><RefreshCw size={18}/></button></header>
 {notice&&<div className="alert success">{notice}</div>}{error&&<div className="alert error">{error}</div>}
 {page==='dashboard'&&<><section className="welcome"><div><span className="pill"><Recycle size={14}/> SMALL ACTIONS, BIG IMPACT</span><h1>{isAdmin?'Manage your collection activity':`Hello, ${user.name.split(' ')[0]}!`}</h1><p>{isAdmin?'Review pickup requests and keep collections moving.':'Ready to give your waste a better destination? Schedule a pickup in a few steps.'}</p>{!isAdmin&&<button className="primary compact" onClick={()=>setPage('new')}>Schedule a pickup <span>→</span></button>}</div><div className="welcome-art"><Recycle size={94}/><span>♻</span></div></section>
 <section className="stats-grid"><Stat title="Total requests" value={counts.total||0} tone="green"/><Stat title="Pending" value={counts.pending||0} tone="amber"/><Stat title="Approved / Scheduled" value={counts.approved||0} tone="blue"/><Stat title="Completed" value={counts.completed||0} tone="purple"/></section>
 <section className="panel"><div className="panel-head"><div><h3>Recent pickup requests</h3><p className="muted">Your latest waste collection activity</p></div><button className="link" onClick={()=>setPage('requests')}>View all →</button></div><RequestTable rows={requests.slice(0,5)} admin={isAdmin} updateStatus={updateStatus}/></section></>}
 {page==='new'&&!isAdmin&&<section className="panel form-panel"><div className="panel-head"><div><h3>Pickup details</h3><p className="muted">Tell us what needs to be collected.</p></div></div><form onSubmit={createRequest} className="form-grid"><label>Waste category *<select required value={form.category_id} onChange={e=>setForm({...form,category_id:e.target.value})}><option value="">Choose a category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Quantity / approximate amount *<input required value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})} placeholder="e.g. 2 bags, 5 kg"/></label><label>Preferred pickup date *<input type="date" required min={new Date().toISOString().slice(0,10)} value={form.pickup_date} onChange={e=>setForm({...form,pickup_date:e.target.value})}/></label><label className="full">Pickup address *<textarea required rows="3" value={form.pickup_address} onChange={e=>setForm({...form,pickup_address:e.target.value})} placeholder="House number, street, area, city"/></label><label className="full">Additional notes (optional)<textarea rows="2" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Any collection instructions…"/></label><div className="full form-actions"><button className="primary" disabled={busy}>{busy?'Submitting…':'Submit pickup request'}</button></div></form></section>}
 {page==='requests'&&<section className="panel"><div className="toolbar"><div className="searchbox"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search category, address, user…"/></div><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="">All statuses</option>{['Pending','Approved','Scheduled','Completed','Rejected'].map(s=><option key={s}>{s}</option>)}</select></div><RequestTable rows={visible} admin={isAdmin} updateStatus={updateStatus}/></section>}
 <section className="tips"><div className="tip-icon"><Leaf/></div><div><strong>Did you know?</strong><p>Separating waste at source helps more materials get reused or recycled. Keep wet, dry and electronic waste separate.</p></div></section>
 </main></div>;
}
function Stat({title,value,tone}){return <div className="stat-card"><span className={`stat-dot ${tone}`}></span><p>{title}</p><strong>{value}</strong></div>}
function RequestTable({rows,admin,updateStatus}){
 if(!rows.length)return <div className="empty"><Recycle size={30}/><strong>No pickup requests yet</strong><span>When a request is submitted, it will appear here.</span></div>;
 return <div className="table-wrap"><table><thead><tr><th>Request</th>{admin&&<th>Customer</th>}<th>Category</th><th>Pickup date</th><th>Status</th>{admin&&<th>Update status</th>}</tr></thead><tbody>{rows.map(r=><tr key={r.id}><td><strong>#{r.id}</strong><small>{r.quantity}</small></td>{admin&&<td>{r.user_name}<small>{r.user_email}</small></td>}<td>{r.category_name}</td><td>{new Date(r.pickup_date).toLocaleDateString()}</td><td><span className={`status ${r.status.toLowerCase()}`}>{r.status}</span></td>{admin&&<td><select className="status-select" value={r.status} onChange={e=>updateStatus(r.id,e.target.value)}>{['Pending','Approved','Scheduled','Completed','Rejected'].map(s=><option key={s}>{s}</option>)}</select></td>}</tr>)}</tbody></table></div>;
}
export default App;

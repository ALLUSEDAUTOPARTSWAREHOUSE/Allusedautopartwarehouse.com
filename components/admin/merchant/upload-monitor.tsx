'use client'
import { useCallback, useEffect, useState, useTransition } from 'react'
import { syncProducts } from '@/app/admin/catalog-actions'
import type { BrandFeedStats } from '@/lib/merchant'
type Status = { checkedAt: string; catalog: BrandFeedStats[] | null; uploads: {brand:string;records:number;missing_prices:number;missing_images:number;invalid_image_urls:number}[] | null; note: string }
export function UploadMonitor() {
 const [data,setData]=useState<Status|null>(null)
 const [error,setError]=useState('')
 const [message,setMessage]=useState('')
 const [tv,setTv]=useState(false)
 const [pending,startTransition]=useTransition()
 const refresh=useCallback(async()=>{
  try { const response=await fetch('/api/admin/upload-monitor',{cache:'no-store'}); if(!response.ok) throw Error(); setData(await response.json());setError('') }
  catch {setError('Monitor refresh failed. Previously shown counts may be stale. Check your session and database.')}
 },[])
 useEffect(()=>{void refresh();const timer=setInterval(()=>{if(document.visibilityState === 'visible')void refresh()},30_000);return()=>clearInterval(timer)},[refresh])
 const sum=(key:'records'|'missing_prices'|'missing_images'|'invalid_image_urls')=>data?.uploads?.reduce((n,row)=>n+Number(row[key]),0)
 function report(){
  if(!data?.uploads)return
  const csv=['brand,uploaded_records,missing_prices,missing_images,invalid_image_url_format',...data.uploads.map(row=>[row.brand,row.records,row.missing_prices,row.missing_images,row.invalid_image_urls].map(value=>'"'+String(value).replaceAll('"','""')+'"').join(','))].join('\r\n')
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));const a=document.createElement('a');a.href=url;a.download='brand-upload-health.csv';a.click();URL.revokeObjectURL(url)
 }
 return <section className={`${tv?'fixed inset-0 z-50 overflow-auto bg-slate-950 p-8 text-white':'rounded-2xl border bg-card p-5'} space-y-5`} aria-label="Upload and sync monitor">
  <header className="flex flex-wrap items-center justify-between gap-3"><div><h2 className={tv?'text-4xl font-bold':'text-xl font-bold'}>Upload & sync monitor</h2><p className="mt-2 text-sm">Refreshes every 30 seconds · {data?new Date(data.checkedAt).toLocaleString():'Loading…'}</p></div><button onClick={()=>setTv(!tv)} className="rounded border px-3 py-2">{tv?'Exit TV view':'TV view'}</button></header>
  <div className="flex flex-wrap gap-2 text-sm">
   <button disabled={pending} onClick={()=>startTransition(async()=>{try{const result=await syncProducts({ok:false,message:''});setMessage(result.ok?'Website/feed refresh requested. This does not import staged files or confirm Google publication.':result.message);await refresh()}catch{setMessage('Website refresh failed. Retry after checking your session.')}})} className="rounded border px-3 py-2 disabled:opacity-40">{pending?'Refreshing website…':'Website sync'}</button>
   <button disabled title="Google account authorization is not implemented" className="rounded border px-3 py-2 opacity-40">Google Merchant · not connected</button>
   <button disabled className="rounded border px-3 py-2 opacity-40">Other channels · not connected</button>
   <button onClick={()=>void refresh()} className="rounded border px-3 py-2">Refresh status</button>
   <button disabled={!data?.uploads} onClick={report} className="rounded border px-3 py-2 disabled:opacity-40">Download brand health CSV</button>
  </div>
  <p role="status">{message}</p>{error&&<p role="alert" className="rounded border border-red-500 p-3">{error}</p>}
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[['Uploaded records (includes archives)',sum('records')],['Missing/nonpositive prices',sum('missing_prices')],['Missing image URLs',sum('missing_images')],['Invalid image URL format',sum('invalid_image_urls')]].map(([label,value])=><article key={label} className="rounded-xl border p-5"><p className="text-sm">{label}</p><p className={tv?'mt-3 text-6xl font-bold':'mt-3 text-3xl font-bold'}>{value===undefined?'Unavailable':Number(value).toLocaleString()}</p></article>)}</div>
  <p className="text-sm">{data?.note} Image accessibility, product accuracy and individual spreadsheet-row errors are not checked by this monitor. The CSV is a brand summary, not a row-level error report.</p>
  <div className="overflow-auto"><table className="w-full text-left text-sm"><caption className="mb-3 text-left">Uploaded database records and separately computed catalog counts</caption><thead><tr>{['Brand','Uploaded records','Missing prices','Missing images','Bad URL format','Visible catalog','Feed eligible'].map(label=><th key={label} className="p-3">{label}</th>)}</tr></thead><tbody>{data?.uploads?.map(row=>{const brand=data.catalog?.find(item=>item.slug===row.brand);return <tr key={row.brand} className="border-t">{[row.brand,row.records,row.missing_prices,row.missing_images,row.invalid_image_urls,brand?brand.total-brand.issues.hidden:'Unavailable',brand?.eligible??'Unavailable'].map((value,index)=><td key={index} className="p-3">{typeof value==='number'?value.toLocaleString():value}</td>)}</tr>})}</tbody></table></div>
  <p className="text-sm">File transfer progress and storage confirmation appear in the large-upload panel below. Staging, importing, refreshing the website and external publication are separate steps.</p>
 </section>
}

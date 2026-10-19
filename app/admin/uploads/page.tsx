import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin-auth'
import { BRAND_DIRECTORY } from '@/lib/brand-catalog'
import { UploadMonitor } from '@/components/admin/merchant/upload-monitor'
import { LargeCatalogUpload } from '@/components/admin/merchant/large-catalog-upload'
import { UploadSheetForm } from '@/components/admin/merchant/catalog-sync-panel'
export const dynamic = 'force-dynamic'
export default async function UploadWorkspace() {
 if(!(await getAdminSession()))redirect('/admin/login')
 const brands=BRAND_DIRECTORY.map(({slug,label})=>({slug,label}))
 return <div className="mx-auto max-w-6xl space-y-6"><h1 className="text-3xl font-bold">Upload control center</h1><UploadMonitor/><LargeCatalogUpload brands={brands}/><section className="space-y-4 rounded-xl border p-5"><h2 className="text-xl font-bold">Spreadsheet preview & import</h2><p>Use this form within the deployed direct-import size limit. Large-file staging above does not import products.</p><UploadSheetForm brands={brands}/></section></div>
}

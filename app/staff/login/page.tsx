import { redirect } from 'next/navigation'
export default function StaffLoginRedirect() {
  redirect('/admin/login')
}

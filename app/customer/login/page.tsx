import { redirect } from 'next/navigation'

export default function CustomerLoginPage() {
  // Use Better Auth's signed, httpOnly session cookies instead of the old
  // client-generated base64 token flow.
  redirect('/sign-in?redirectTo=%2Fcustomer%2Fdashboard')
}

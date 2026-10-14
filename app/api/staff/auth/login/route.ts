import { NextRequest } from 'next/server'
import { handleStaffLogin } from '@/lib/staff-login'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  return handleStaffLogin(request, 'error')
}

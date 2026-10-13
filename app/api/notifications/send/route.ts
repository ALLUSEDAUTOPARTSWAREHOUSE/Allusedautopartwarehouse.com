import { NextRequest, NextResponse } from 'next/server'
import { sendNotification } from '@/lib/notifications'
import { verifyAdminToken } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  try {
    // Verify admin token
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.slice(7)
    const tokenVerification = await verifyAdminToken(token)
    
    if (!tokenVerification.valid) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type, recipient, subject, data, sendEmail, sendTeams, priority } = body

    if (!type || !recipient || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: type, recipient, data' },
        { status: 400 }
      )
    }

    // Send notification
    const result = await sendNotification({
      type,
      recipient,
      subject: subject || 'AUAPW Notification',
      data,
      priority,
      sendEmail,
      sendTeams,
    })

    return NextResponse.json({
      success: true,
      message: `${type} notification sent`,
      result,
    })
  } catch (error) {
    console.error('[v0] Notification API error:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}

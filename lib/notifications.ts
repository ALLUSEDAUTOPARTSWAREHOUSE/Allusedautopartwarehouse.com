import { createElement } from 'react'
import NotificationEmail from '@/emails/notification'
import { db } from './db'
import { auditLog } from './db/schema'
import { emailFromAddress, sendReactEmail } from './mailer'

export type NotificationType = 
  | 'new_customer'
  | 'new_order'
  | 'payment_success'
  | 'payment_failure'
  | 'high_risk_order'
  | 'chargeback'
  | 'refund'
  | 'contact_form'
  | 'quote_request'
  | 'ticket_created'
  | 'shipment'
  | 'daily_report'
  | 'weekly_report'

export interface NotificationPayload {
  type: NotificationType
  recipient: string | string[]
  subject: string
  data: Record<string, any>
  priority?: 'low' | 'normal' | 'high' | 'critical'
  sendEmail?: boolean
  sendSMS?: boolean
  sendTeams?: boolean
}

export interface EmailTemplate {
  subject: string
  htmlBody: string
  textBody: string
}

/**
 * Generate email template based on notification type
 */
export function generateEmailTemplate(
  type: NotificationType,
  data: Record<string, any>
): EmailTemplate {
  const templates: Record<NotificationType, (data: any) => EmailTemplate> = {
    new_customer: (data) => ({
      subject: `Welcome to AUAPW - New Account Created`,
      htmlBody: `
        <h2>Welcome to AUAPW!</h2>
        <p>Hello ${data.customerName},</p>
        <p>Your account has been successfully created.</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p>Start browsing our inventory of OEM used auto parts.</p>
      `,
      textBody: `Welcome to AUAPW! Your account has been created with email: ${data.email}`,
    }),
    
    new_order: (data) => ({
      subject: `Order Confirmation #${data.orderNumber}`,
      htmlBody: `
        <h2>Order Confirmed</h2>
        <p>Order #${data.orderNumber}</p>
        <p><strong>Total:</strong> $${data.total}</p>
        <p><strong>Items:</strong> ${data.itemCount}</p>
        <p>Your order will be processed and shipped soon.</p>
      `,
      textBody: `Order #${data.orderNumber} confirmed. Total: $${data.total}`,
    }),
    
    payment_success: (data) => ({
      subject: `Payment Received - Order #${data.orderNumber}`,
      htmlBody: `
        <h2>Payment Received</h2>
        <p>Payment successful for order #${data.orderNumber}</p>
        <p><strong>Amount:</strong> $${data.amount}</p>
        <p><strong>Transaction ID:</strong> ${data.transactionId}</p>
      `,
      textBody: `Payment received for order #${data.orderNumber}: $${data.amount}`,
    }),
    
    payment_failure: (data) => ({
      subject: `Payment Failed - Order #${data.orderNumber}`,
      htmlBody: `
        <h2>Payment Failed</h2>
        <p>Your payment could not be processed.</p>
        <p><strong>Reason:</strong> ${data.reason}</p>
        <p>Please try again or contact support.</p>
      `,
      textBody: `Payment failed for order #${data.orderNumber}. Reason: ${data.reason}`,
    }),
    
    high_risk_order: (data) => ({
      subject: `High-Risk Order Alert - ${data.orderNumber}`,
      htmlBody: `
        <h2>High-Risk Order Detected</h2>
        <p>Order #${data.orderNumber}</p>
        <p><strong>Risk Score:</strong> ${data.riskScore}/100</p>
        <p><strong>Amount:</strong> $${data.amount}</p>
        <p>Manual review recommended.</p>
      `,
      textBody: `High-risk order #${data.orderNumber}. Risk score: ${data.riskScore}/100`,
    }),
    
    chargeback: (data) => ({
      subject: `🚨 Chargeback Alert - Immediate Action Required`,
      htmlBody: `
        <h2>Chargeback Received</h2>
        <p><strong>Order:</strong> ${data.orderNumber}</p>
        <p><strong>Amount:</strong> $${data.amount}</p>
        <p><strong>Reason:</strong> ${data.reason}</p>
        <p><strong>Deadline:</strong> ${data.deadline}</p>
        <p>Action required immediately.</p>
      `,
      textBody: `Chargeback for order #${data.orderNumber}. Amount: $${data.amount}. Deadline: ${data.deadline}`,
    }),
    
    refund: (data) => ({
      subject: `Refund Processed - Order #${data.orderNumber}`,
      htmlBody: `
        <h2>Refund Processed</h2>
        <p><strong>Order:</strong> ${data.orderNumber}</p>
        <p><strong>Refund Amount:</strong> $${data.amount}</p>
        <p><strong>Reason:</strong> ${data.reason}</p>
        <p>Refund has been initiated and will appear in your account within 5-7 business days.</p>
      `,
      textBody: `Refund of $${data.amount} processed for order #${data.orderNumber}`,
    }),
    
    contact_form: (data) => ({
      subject: `New Contact Form Submission`,
      htmlBody: `
        <h2>New Contact Submission</h2>
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Phone:</strong> ${data.phone}</p>
        <p><strong>Subject:</strong> ${data.subject}</p>
        <p><strong>Message:</strong></p>
        <p>${data.message}</p>
      `,
      textBody: `Contact form from ${data.name} (${data.email}): ${data.message}`,
    }),
    
    quote_request: (data) => ({
      subject: `New Quote Request - ${data.make} ${data.model}`,
      htmlBody: `
        <h2>Quote Request Received</h2>
        <p><strong>Customer:</strong> ${data.customerName}</p>
        <p><strong>Vehicle:</strong> ${data.year} ${data.make} ${data.model}</p>
        <p><strong>VIN:</strong> ${data.vin}</p>
        <p><strong>Requested Part:</strong> ${data.requestedPart}</p>
        <p><strong>Contact:</strong> ${data.phone}</p>
      `,
      textBody: `Quote request from ${data.customerName} for ${data.year} ${data.make} ${data.model}`,
    }),
    
    ticket_created: (data) => ({
      subject: `Support Ticket #${data.ticketNumber} Created`,
      htmlBody: `
        <h2>Support Ticket Created</h2>
        <p><strong>Ticket #:</strong> ${data.ticketNumber}</p>
        <p><strong>Priority:</strong> ${data.priority}</p>
        <p><strong>Subject:</strong> ${data.subject}</p>
        <p>Our team will respond within 24 hours.</p>
      `,
      textBody: `Support ticket #${data.ticketNumber} has been created`,
    }),
    
    shipment: (data) => ({
      subject: `Your Order is ${data.status} - Order #${data.orderNumber}`,
      htmlBody: `
        <h2>Shipment Update</h2>
        <p>Order #${data.orderNumber}</p>
        <p><strong>Status:</strong> ${data.status}</p>
        ${data.trackingNumber ? `<p><strong>Tracking:</strong> ${data.trackingNumber}</p>` : ''}
        ${data.carrier ? `<p><strong>Carrier:</strong> ${data.carrier}</p>` : ''}
      `,
      textBody: `Order #${data.orderNumber} ${data.status}. Tracking: ${data.trackingNumber}`,
    }),
    
    daily_report: (data) => ({
      subject: `Daily Business Report - ${data.date}`,
      htmlBody: `
        <h2>Daily Report - ${data.date}</h2>
        <p><strong>Revenue:</strong> $${data.revenue}</p>
        <p><strong>Orders:</strong> ${data.orders}</p>
        <p><strong>Customers:</strong> ${data.customers}</p>
        <p><strong>Failed Payments:</strong> ${data.failedPayments}</p>
        <p><strong>High-Risk Orders:</strong> ${data.highRiskOrders}</p>
      `,
      textBody: `Daily Report: $${data.revenue} revenue, ${data.orders} orders`,
    }),
    
    weekly_report: (data) => ({
      subject: `Weekly Executive Report - Week of ${data.weekStart}`,
      htmlBody: `
        <h2>Weekly Report</h2>
        <p><strong>Revenue:</strong> $${data.revenue}</p>
        <p><strong>Profit:</strong> $${data.profit}</p>
        <p><strong>Orders:</strong> ${data.orders}</p>
        <p><strong>Fraud Rate:</strong> ${data.fraudRate}%</p>
        <p><strong>Customer Satisfaction:</strong> ${data.satisfaction}/5</p>
      `,
      textBody: `Weekly Report: $${data.revenue} revenue, ${data.orders} orders`,
    }),
  }

  const generator = templates[type]
  if (!generator) {
    return {
      subject: 'AUAPW Notification',
      htmlBody: 'Notification from AUAPW',
      textBody: 'Notification from AUAPW',
    }
  }

  return generator(data)
}

/**
 * Log notification
 */
export async function logNotification(
  type: NotificationType,
  recipient: string | string[],
  status: 'sent' | 'failed' | 'pending',
  data: Record<string, any>
) {
  try {
    await db.insert(auditLog).values({
      id: `notif_${Date.now()}`,
      action: 'notification_sent',
      userId: 'system',
      resource: 'notification',
      resourceId: `${type}_${Date.now()}`,
      changes: {
        type,
        recipient: Array.isArray(recipient) ? recipient : [recipient],
        status,
        data,
      },
    })
  } catch (error) {
    console.error('[v0] Failed to log notification:', error)
  }
}

/**
 * Send notification (orchestrator)
 */
export async function sendNotification(payload: NotificationPayload) {
  const { type, recipient, subject, data, priority = 'normal' } = payload

  console.log(`[v0] Sending ${type} notification to ${recipient}`)

  const template = generateEmailTemplate(type, data)

  if (payload.sendEmail !== false) {
    await sendEmailNotification(recipient, template)
  }

  if (payload.sendTeams) {
    await sendTeamsNotification(type, recipient, data, priority)
  }

  // Log notification
  await logNotification(type, recipient, 'sent', data)

  return { success: true, type, recipient }
}

/**
 * Send email notification
 */
async function sendEmailNotification(
  recipient: string | string[],
  template: EmailTemplate,
) {
  const recipients = Array.isArray(recipient) ? recipient : [recipient]

  for (const email of recipients) {
    const result = await sendReactEmail({
      from: emailFromAddress(),
      to: email,
      subject: template.subject,
      replyTo: 'support@allusedautopartswarehouse.com',
      react: createElement(NotificationEmail, {
        title: template.subject,
        preview: template.subject,
        intro: template.textBody,
      }),
    })
    if (!result.ok) {
      console.error(`[v0] Failed to send email to ${email}:`, result.error)
    }
  }
}

/**
 * Send Teams notification
 */
async function sendTeamsNotification(
  type: NotificationType,
  recipient: string | string[],
  data: Record<string, any>,
  priority: string
) {
  try {
    const webhookUrl = process.env.TEAMS_WEBHOOK_URL
    if (!webhookUrl) return

    const color = priority === 'critical' ? 'FF0000' : 
                 priority === 'high' ? 'FFA500' : '0078D4'

    const message = {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: `${type} notification`,
      themeColor: color,
      sections: [{
        activityTitle: `${type.replace(/_/g, ' ').toUpperCase()}`,
        facts: Object.entries(data).slice(0, 5).map(([key, value]) => ({
          name: key,
          value: String(value),
        })),
      }],
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    })
  } catch (error) {
    console.error('[v0] Teams notification error:', error)
  }
}

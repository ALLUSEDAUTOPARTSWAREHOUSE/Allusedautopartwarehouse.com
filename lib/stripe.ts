let Stripe: any
let stripe: any

try {
  Stripe = require('stripe').default || require('stripe')
  
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('[v0] STRIPE_SECRET_KEY is not set - Stripe features will be disabled')
    stripe = null
  } else {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  }
} catch (error) {
  console.warn('[v0] Stripe module not available - Stripe features will be disabled', error)
  stripe = null
}

export { stripe }

/**
 * Create a Stripe Connect account for a seller
 */
export async function createStripeConnectAccount(sellerData: {
  email: string
  businessName: string
  businessType: string
  businessAddress: string
  businessCity: string
  businessState: string
  businessZip: string
  taxId: string
}) {
  if (!stripe) {
    return {
      success: false,
      error: 'Stripe is not configured',
    }
  }
  try {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: sellerData.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: {
        mcc: '5411', // Default MCC for auto parts
        name: sellerData.businessName,
        product_description: 'Used automotive parts',
        support_address: {
          line1: sellerData.businessAddress,
          city: sellerData.businessCity,
          state: sellerData.businessState,
          postal_code: sellerData.businessZip,
          country: 'US',
        },
      },
      business_type: 'individual', // or 'company' if not sole proprietor
      individual: {
        address: {
          line1: sellerData.businessAddress,
          city: sellerData.businessCity,
          state: sellerData.businessState,
          postal_code: sellerData.businessZip,
          country: 'US',
        },
        email: sellerData.email,
        verification: {
          document: {
            front: undefined, // Will be uploaded via onboarding link
          },
        },
      },
      tos_acceptance: {
        date: Math.floor(Date.now() / 1000),
        ip: '0.0.0.0', // Should be actual user IP
      },
    })

    return {
      success: true,
      accountId: account.id,
    }
  } catch (error) {
    console.error('[v0] Create Stripe Connect account error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create Stripe Connect account',
    }
  }
}

/**
 * Generate Stripe Connect onboarding link for seller
 */
export async function generateStripeOnboardingLink(
  accountId: string,
  refreshUrl: string,
  returnUrl: string
) {
  if (!stripe) {
    return { success: false, error: 'Stripe is not configured' }
  }
  try {
    const link = await stripe.accountLinks.create({
      account: accountId,
      type: 'account_onboarding',
      refresh_url: refreshUrl,
      return_url: returnUrl,
    })

    return {
      success: true,
      url: link.url,
    }
  } catch (error) {
    console.error('[v0] Generate onboarding link error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate onboarding link',
    }
  }
}

/**
 * Process a charge/payment (buyer to AUAPW)
 */
export async function processPayment(input: {
  amount: number
  currency: string
  source: string // token from Stripe.js
  description: string
  metadata?: Record<string, string>
}) {
  if (!stripe) {
    return { success: false, error: 'Stripe is not configured' }
  }
  try {
    const charge = await stripe.charges.create({
      amount: Math.round(input.amount * 100), // Stripe uses cents
      currency: input.currency,
      source: input.source,
      description: input.description,
      metadata: input.metadata,
    })

    return {
      success: true,
      chargeId: charge.id,
      amount: charge.amount / 100,
      status: charge.status,
    }
  } catch (error) {
    console.error('[v0] Process payment error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process payment',
    }
  }
}

/**
 * Initiate a payout to a seller's connected account
 */
export async function initiatePayout(input: {
  connectedAccountId: string
  amount: number
  description: string
  metadata?: Record<string, string>
}) {
  if (!stripe) {
    return { success: false, error: 'Stripe is not configured' }
  }
  try {
    const transfer = await stripe.transfers.create({
      amount: Math.round(input.amount * 100),
      currency: 'usd',
      destination: input.connectedAccountId,
      description: input.description,
      metadata: input.metadata,
    })

    return {
      success: true,
      transferId: transfer.id,
      amount: transfer.amount / 100,
    }
  } catch (error) {
    console.error('[v0] Initiate payout error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initiate payout',
    }
  }
}

/**
 * Handle Stripe webhook for fraud detection (chargebacks, disputes)
 */
export async function handleStripeWebhook(event: any) {
  switch (event.type) {
    case 'charge.dispute.created':
      const dispute = event.data.object as any
      console.log('[v0] Dispute created:', dispute.id, dispute.amount / 100)
      // TODO: Create fraud flag
      break

    case 'charge.refunded':
      const refund = event.data.object as any
      console.log('[v0] Charge refunded:', refund.id)
      // TODO: Process refund in ledger
      break

    case 'account.updated':
      const account = event.data.object as any
      console.log('[v0] Stripe account updated:', account.id)
      // TODO: Update seller Stripe verification status
      break

    default:
      console.log('[v0] Unhandled Stripe event:', event.type)
  }
}

/**
 * Retrieve account details (for verification status, etc)
 */
export async function getAccountDetails(accountId: string) {
  if (!stripe) {
    return { success: false, error: 'Stripe is not configured' }
  }
  try {
    const account = await stripe.accounts.retrieve(accountId)

    return {
      success: true,
      account: {
        id: account.id,
        country: account.country,
        type: account.type,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        verification: account.requirements,
      },
    }
  } catch (error) {
    console.error('[v0] Get account details error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get account details',
    }
  }
}

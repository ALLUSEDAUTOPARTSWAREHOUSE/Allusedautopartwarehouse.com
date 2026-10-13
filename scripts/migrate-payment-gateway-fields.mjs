import pg from 'pg'

const { Pool } = pg

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required')

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    console.log('[v0] Altering payment_gateways table...')

    await pool.query('ALTER TABLE payment_gateways ADD COLUMN IF NOT EXISTS "instructions" text')
    await pool.query('ALTER TABLE payment_gateways ADD COLUMN IF NOT EXISTS "paymentLink" text')
    await pool.query(`ALTER TABLE payment_gateways ADD COLUMN IF NOT EXISTS "envVarsRequired" json DEFAULT '[]'::json`)

    console.log('[v0] Columns ensured. Seeding additional presets...')

    const presets = [
      {
        id: 'gtw_google_pay',
        name: 'Google Pay',
        slug: 'google_pay',
        type: 'wallet',
        description: 'Fast, secure checkout using a saved Google Pay card.',
        isEnabled: false,
        isDefault: false,
        sortOrder: 20,
        envVarsRequired: ['GOOGLE_PAY_MERCHANT_ID'],
      },
      {
        id: 'gtw_apple_pay',
        name: 'Apple Pay',
        slug: 'apple_pay',
        type: 'wallet',
        description: 'Fast, secure checkout using Face ID, Touch ID, or passcode.',
        isEnabled: false,
        isDefault: false,
        sortOrder: 21,
        envVarsRequired: ['APPLE_PAY_MERCHANT_ID'],
      },
      {
        id: 'gtw_venmo',
        name: 'Venmo',
        slug: 'venmo',
        type: 'wallet',
        description: 'Pay directly from your Venmo balance or linked card.',
        isEnabled: false,
        isDefault: false,
        sortOrder: 22,
        envVarsRequired: [],
      },
      {
        id: 'gtw_wire_transfer',
        name: 'Wire Transfer',
        slug: 'wire_transfer',
        type: 'bank',
        description: 'Pay directly from your bank account via wire transfer.',
        isEnabled: false,
        isDefault: false,
        sortOrder: 30,
        instructions:
          'Our team will email wire instructions (bank name, routing number, account number) after checkout. Orders ship once funds are confirmed.',
        envVarsRequired: [],
      },
      {
        id: 'gtw_payment_link',
        name: 'Payment Link',
        slug: 'payment_link',
        type: 'link',
        description: 'Pay via a secure hosted payment link (supports EPS and other local methods).',
        isEnabled: false,
        isDefault: false,
        sortOrder: 31,
        paymentLink: '',
        envVarsRequired: [],
      },
    ]

    for (const preset of presets) {
      await pool.query(
        `INSERT INTO payment_gateways
          (id, name, slug, type, description, "isEnabled", "isDefault", "sortOrder", instructions, "paymentLink", "envVarsRequired")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (slug) DO NOTHING`,
        [
          preset.id,
          preset.name,
          preset.slug,
          preset.type,
          preset.description,
          preset.isEnabled,
          preset.isDefault,
          preset.sortOrder,
          preset.instructions ?? null,
          preset.paymentLink ?? null,
          JSON.stringify(preset.envVarsRequired),
        ],
      )
    }

    console.log('[v0] Payment gateway presets seeded.')
  } finally {
    await pool.end()
  }
}

main()
  .then(() => console.log('[v0] Migration complete.'))
  .catch((error) => {
    console.error('[v0] Migration failed:', error)
    process.exitCode = 1
  })

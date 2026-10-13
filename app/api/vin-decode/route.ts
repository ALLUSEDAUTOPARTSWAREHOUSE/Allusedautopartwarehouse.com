const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/
const NHTSA_URL = 'https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const submittedVin = (body as { vin?: unknown } | null)?.vin
  if (typeof submittedVin !== 'string') {
    return Response.json({ error: 'Invalid VIN. Must be 17 characters.' }, { status: 400 })
  }

  const vin = submittedVin.trim().toUpperCase()
  if (!VIN_PATTERN.test(vin)) {
    return Response.json({ error: 'Invalid VIN. Must be 17 valid characters.' }, { status: 400 })
  }

  try {
    const response = await fetch(`${NHTSA_URL}/${encodeURIComponent(vin)}?format=json`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    })
    if (!response.ok) throw new Error(`NHTSA decoder returned ${response.status}`)

    const result = (await response.json()).Results?.[0]
    const year = Number.parseInt(result?.ModelYear, 10)
    const make = result?.Make?.trim()
    const model = result?.Model?.trim()
    if (!Number.isFinite(year) || !make || !model) {
      return Response.json({ error: 'This VIN could not be decoded.' }, { status: 422 })
    }

    return Response.json({
      vin,
      vehicle: {
        vin,
        year,
        make,
        model,
        trim: result.Trim || result.Series || result.Series2 || null,
        engine: result.DisplacementL ? `${result.DisplacementL}L` : null,
        transmission: result.TransmissionStyle || null,
        body_type: result.BodyClass || null,
        drive_type: result.DriveType || null,
      },
      decoded: true,
    })
  } catch (error) {
    console.error('[vin-decode] NHTSA request failed:', error instanceof Error ? error.message : error)
    return Response.json({ error: 'VIN decoding is temporarily unavailable.' }, { status: 502 })
  }
}

'use client'

import { useState, useTransition } from 'react'
import { saveVehicle } from '@/app/actions/customer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'

export function VehicleDetails({ vehicle }: { vehicle: any }) {
  const [isSaving, startSaving] = useTransition()
  const [saveMessage, setSaveMessage] = useState('')

  if (!vehicle) return null

  const handleSave = () => {
    startSaving(async () => {
      try {
        await saveVehicle({
          year: Number(vehicle.year),
          make: vehicle.make,
          model: vehicle.model,
          vin: vehicle.vin,
          engine: vehicle.engine,
          transmission: vehicle.transmission,
        })
        setSaveMessage('Vehicle saved to your dashboard.')
      } catch {
        setSaveMessage('Sign in to save this vehicle.')
      }
    })
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Vehicle Information</h3>
      
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 mb-6">
        <p className="text-3xl font-bold text-foreground">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </p>
        {vehicle.trim && (
          <p className="text-foreground/70 mt-2">{vehicle.trim}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {vehicle.engine && (
          <div>
            <p className="text-sm font-medium text-foreground/70">Engine</p>
            <p className="text-foreground">{vehicle.engine}</p>
          </div>
        )}
        {vehicle.transmission && (
          <div>
            <p className="text-sm font-medium text-foreground/70">Transmission</p>
            <p className="text-foreground">{vehicle.transmission}</p>
          </div>
        )}
        {vehicle.body_type && (
          <div>
            <p className="text-sm font-medium text-foreground/70">Body Type</p>
            <p className="text-foreground">{vehicle.body_type}</p>
          </div>
        )}
        {vehicle.drive_type && (
          <div>
            <p className="text-sm font-medium text-foreground/70">Drive Type</p>
            <p className="text-foreground">{vehicle.drive_type}</p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button asChild className="flex-1">
          <Link href={`/parts?year=${vehicle.year}&make=${vehicle.make}&model=${vehicle.model}`}>
            Find Compatible Parts
          </Link>
        </Button>
        <Button variant="outline" className="flex-1" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save Vehicle'}
        </Button>
      </div>
      {saveMessage && <p className="mt-3 text-sm text-muted-foreground" role="status">{saveMessage}</p>}
    </Card>
  )
}

"use client"

import { Button } from "@/components/ui/button"

export function PrintInvoiceButton() {
  return (
    <Button type="button" onClick={() => window.print()}>
      Print / Save PDF
    </Button>
  )
}

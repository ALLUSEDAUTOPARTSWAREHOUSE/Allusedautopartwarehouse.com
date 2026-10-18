"use client"

export function PrintInvoiceButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white"
    >
      Print / Save PDF
    </button>
  )
}

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/lib/stores/cart-store'
import { SHIPPING } from '@/lib/site-policy'
import { Phone, MessageSquare, ShoppingCart, Zap, HelpCircle, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface ProductCardActionsProps {
  productId: string
  productName: string
  productPrice: number
  productImage?: string
  productType?: string
  make?: string
  shipping?: string
  /** Where the "Details" button links; the button is hidden without one. */
  detailsHref?: string
  purchaseDisabled?: boolean
  isQuoteOnly?: boolean
}

const PHONE_SALES = '708-896-2383'
const PHONE_DISPLAY = '(708) 896-2383'
const CONTACT_EMAIL = 'auapworld@gmail.com'

export function ProductCardActions({
  productId,
  productName,
  productPrice,
  productImage,
  productType,
  make,
  shipping,
  detailsHref,
  purchaseDisabled = false,
  isQuoteOnly = false,
}: ProductCardActionsProps) {
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)
  const addItem = useCartStore((state) => state.addItem)

  const handleAddToCart = () => {
    if (purchaseDisabled) return
    const shippingCost = SHIPPING.price
    addItem({
      id: productId,
      name: productName,
      price: productPrice,
      quantity,
      image: productImage,
      make,
      partType: productType,
      shippingCost,
    })
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  const handleBuyNow = () => {
    handleAddToCart()
    // Redirect to cart after brief delay
    setTimeout(() => {
      window.location.href = '/cart'
    }, 500)
  }

  const handleCall = () => {
    window.location.href = `tel:${PHONE_SALES}`
  }

  const handleMessage = () => {
    const message = `Hi, I'm interested in: ${productName}${isQuoteOnly ? '' : ` - $${productPrice}`}`
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=Product Inquiry: ${productName}&body=${encodeURIComponent(message)}`
  }

  const handleGetQuote = () => {
    const normalizedPart = productType?.toLowerCase().includes('transmission')
      ? 'Transmission'
      : productType?.toLowerCase().includes('engine')
        ? 'Engine'
        : ''
    const quoteParams = new URLSearchParams({
      part: normalizedPart,
      make: make || '',
      productName,
      productUrl: detailsHref || '',
      productId,
      referrer: 'product-page',
    })
    window.location.href = `/quote?${quoteParams.toString()}`
  }

  return (
    <div className="flex flex-col gap-3 pt-4 border-t border-border/30">
      {/* Quantity Selector */}
      {!isQuoteOnly && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Qty:</span>
          <input
            type="number"
            min="1"
            max="5"
            aria-label="Quantity"
            disabled={purchaseDisabled}
            value={quantity}
            onChange={(e) => setQuantity(Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
            className="w-16 px-2 py-1 rounded border border-border bg-background text-foreground text-sm"
          />
        </div>
      )}

      {/* Primary Actions */}
      {!isQuoteOnly && (
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handleAddToCart}
            disabled={purchaseDisabled}
            className={`text-xs font-bold transition-all ${
              addedToCart
                ? 'bg-green-600 hover:bg-green-700'
                : 'auapw-btn auapw-btn-blue'
            }`}
            title="Add to cart for bulk orders"
          >
            <ShoppingCart className="w-3 h-3" />
            {addedToCart ? 'Added!' : 'Add to Cart'}
          </Button>
          <Button
            onClick={handleBuyNow}
            disabled={purchaseDisabled}
            className="auapw-btn auapw-btn-green text-xs font-bold"
            title="Add to cart and proceed to checkout"
          >
            <Zap className="w-3 h-3" />
            Buy Now
          </Button>
        </div>
      )}

      {/* Secondary Actions */}
      <div className={`grid gap-2 ${detailsHref ? 'grid-cols-4' : 'grid-cols-3'}`}>
        <Button
          onClick={handleCall}
          variant="outline"
          className="text-xs font-bold border-primary/50 hover:border-primary hover:bg-primary/10"
          title="Call sales team"
        >
          <Phone className="w-3 h-3" />
          Call
        </Button>
        <Button
          onClick={handleMessage}
          variant="outline"
          className="text-xs font-bold border-primary/50 hover:border-primary hover:bg-primary/10"
          title="Send email inquiry"
        >
          <MessageSquare className="w-3 h-3" />
          Message
        </Button>
        <Button
          onClick={handleGetQuote}
          variant="outline"
          className="text-xs font-bold border-primary/50 hover:border-primary hover:bg-primary/10"
          title="Request a detailed quote"
        >
          <HelpCircle className="w-3 h-3" />
          Quote
        </Button>
        {detailsHref && (
          <Button
            variant="outline"
            className="text-xs font-bold border-primary/50 hover:border-primary hover:bg-primary/10"
            title="View full product details"
            asChild
          >
            <Link href={detailsHref}>
              <ExternalLink className="w-3 h-3" />
              Details
            </Link>
          </Button>
        )}
      </div>

      {/* Info Badges */}
      <div className="flex flex-wrap gap-1">
        <Badge variant="secondary" className="text-[10px]">
          90-Day Warranty
        </Badge>
        <Badge variant="secondary" className="text-[10px]">
          Shipping: {shipping}
        </Badge>
      </div>
    </div>
  )
}

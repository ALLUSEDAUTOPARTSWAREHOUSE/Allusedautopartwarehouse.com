'use client'

import { Truck, Clock, DollarSign, Package, MapPin, Shield } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RETURNS, SHIPPING } from '@/lib/site-policy'

export function ShippingInfo() {
  const shippingOptions = [
    {
      icon: Truck,
      title: 'Flat-Rate Shipping',
      description: SHIPPING.transit,
      price: '$240',
      details: 'A fixed $240 shipping charge applies to every part'
    },
    {
      icon: Clock,
      title: 'Tracking Included',
      description: 'Sent After Dispatch',
      price: 'Included',
      details: 'Carrier and tracking details are emailed when your order ships'
    },
    {
      icon: Package,
      title: 'Secure Packaging',
      description: 'All Orders',
      price: 'Included',
      details: 'Each part is packed for safe transportation and delivery'
    },
    {
      icon: MapPin,
      title: 'Nationwide Coverage',
      description: 'United States',
      price: '$240',
      details: 'The same flat shipping charge is shown in your cart and at checkout'
    }
  ]

  const shippingProcess = [
    {
      step: '1',
      title: 'Order Confirmed',
      description: 'Your order is verified and payment processed'
    },
    {
      step: '2',
      title: 'Quality Check',
      description: 'Parts are inspected and tested before packing'
    },
    {
      step: '3',
      title: 'Secure Packing',
      description: 'Professional packaging ensures safe delivery'
    },
    {
      step: '4',
      title: 'Shipment',
      description: 'Tracking number emailed with carrier details'
    },
    {
      step: '5',
      title: 'Delivery',
      description: 'Parts arrive at your location on time'
    },
    {
      step: '6',
      title: 'Installation',
      description: '90-day warranty begins from delivery date'
    }
  ]

  return (
    <section className="py-16 bg-background border-t border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Shipping & Delivery</h2>
          <p className="text-lg text-muted-foreground">Fast, secure, and insured shipping across the USA</p>
        </div>

        {/* Shipping Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {shippingOptions.map((option, index) => {
            const IconComponent = option.icon
            return (
              <Card key={index} className="border-border hover:border-primary/50 transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <IconComponent className="w-6 h-6 text-primary flex-shrink-0" />
                  </div>
                  <CardTitle className="text-lg">{option.title}</CardTitle>
                  <CardDescription>{option.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-2xl font-bold text-primary">{option.price}</div>
                  <p className="text-sm text-muted-foreground">{option.details}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Shipping Process Timeline */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold mb-8">Shipping Process</h3>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {shippingProcess.map((item, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-3 flex-shrink-0">
                  {item.step}
                </div>
                <h4 className="font-semibold text-center mb-1">{item.title}</h4>
                <p className="text-xs text-muted-foreground text-center">{item.description}</p>
                {index < shippingProcess.length - 1 && (
                  <div className="hidden md:block w-full h-1 bg-border my-4 relative">
                    <div className="absolute top-1/2 right-0 transform translate-x-6 -translate-y-1/2">
                      →
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Guarantees */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-border bg-primary/5">
            <CardHeader>
              <Shield className="w-8 h-8 text-primary mb-2" />
              <CardTitle>90-Day Warranty</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                All parts covered by our comprehensive warranty against manufacturing defects. No questions asked.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-primary/5">
            <CardHeader>
              <DollarSign className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Money-Back Guarantee</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {RETURNS.detail}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-primary/5">
            <CardHeader>
              <Package className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Damage Protection</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                $2 million in transit insurance. If your part arrives damaged, we replace it free within 48 hours.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Important Info */}
        <div className="mt-12 p-6 bg-card border border-border rounded-lg">
          <h3 className="font-semibold mb-4">Important Shipping Information</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="text-primary font-bold">•</span>
              <span>All shipments require a signature or delivery confirmation</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary font-bold">•</span>
              <span>Tracking information is sent via email within 1 hour of shipment</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary font-bold">•</span>
              <span>A flat $240 shipping charge is applied to every part in the cart</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary font-bold">•</span>
              <span>International shipping available. Contact us for quotes and details</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}

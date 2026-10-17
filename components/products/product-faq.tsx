'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FAQItem {
  question: string
  answer: string
}

interface ProductFAQProps {
  productType: string
}

const faqsByType: Record<string, FAQItem[]> = {
  engine: [
    {
      question: 'How long is the warranty on used engines?',
      answer: 'All our engines come with a 90-day warranty covering defects in workmanship and materials. Extended warranties are available upon request.'
    },
    {
      question: 'Can I install the engine myself?',
      answer: 'While some customers choose DIY installation, we recommend professional installation by a certified mechanic to ensure proper setup and warranty validity.'
    },
    {
      question: 'What are the mileage categories?',
      answer: 'Low Mileage: 0-80k miles | Medium Mileage: 80k-150k miles | High Mileage: 150k+ miles. Each category is priced differently based on expected remaining life.'
    },
    {
      question: 'Is the engine tested before shipping?',
      answer: 'Yes, all engines undergo comprehensive testing including compression tests, leak detection, and operation verification before shipping.'
    },
    {
      question: 'Do you offer core charges?',
      answer: 'Yes, we offer core charges on most engine cores. Contact us for current core prices and the core return process.'
    }
  ],
  transmission: [
    {
      question: 'What\'s the difference between automatic and manual transmissions?',
      answer: 'Automatic transmissions shift gears automatically without driver input, while manual transmissions require the driver to shift gears manually using a clutch pedal.'
    },
    {
      question: 'Are transmissions tested before shipping?',
      answer: 'Absolutely. Each transmission is pressure tested, inspected for leaks, and test-driven to ensure smooth shifting and proper operation.'
    },
    {
      question: 'How is the transmission shipped to me?',
      answer: 'We use specialized heavy-duty shipping with full insurance coverage. Most transmissions arrive within 3-5 business days via freight carrier.'
    },
    {
      question: 'Can you help me identify my transmission type?',
      answer: 'Yes! Provide your vehicle year, make, model, and engine size, and we\'ll identify the correct transmission type for your vehicle.'
    },
    {
      question: 'What if the transmission doesn\'t fit my vehicle?',
      answer: 'Contact us immediately. We have a 14-day return window for compatibility issues with no restocking fee.'
    }
  ],
  default: [
    {
      question: 'How do I know if this part fits my vehicle?',
      answer: 'All parts are listed with compatible vehicle years, makes, and models. Use our search feature to filter by your specific vehicle information.'
    },
    {
      question: 'What is your shipping timeframe?',
      answer: 'Standard shipping takes 3-5 business days. Expedited options available. Tracking information is provided upon shipment.'
    },
    {
      question: 'Do you offer returns?',
      answer: 'Yes, we offer a 14-day return window for parts that don\'t fit or meet your expectations. Parts must be unused and in original condition.'
    },
    {
      question: 'Can I get a refund?',
      answer: 'Refunds are processed within 7-10 business days of return receipt. Return shipping is free within the continental US.'
    },
    {
      question: 'How can I track my order?',
      answer: 'A tracking number is emailed to you upon shipment. Track your package directly through our website or the carrier\'s website.'
    }
  ]
}

export function ProductFAQ({ productType }: ProductFAQProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const faqs = faqsByType[productType.toLowerCase()] || faqsByType.default

  return (
    <section className="py-16 bg-card/30 border-t border-border">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Frequently Asked Questions</h2>
          <p className="text-lg text-muted-foreground">Get answers to common questions about {productType} products</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-background border border-border rounded-lg overflow-hidden transition-all duration-200 hover:border-primary/50"
            >
              <button
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-primary/5 transition-colors"
              >
                <h3 className="text-left font-semibold text-foreground pr-4">{faq.question}</h3>
                <ChevronDown
                  className={`w-5 h-5 text-primary flex-shrink-0 transition-transform duration-200 ${
                    expandedIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {expandedIndex === index && (
                <div className="px-6 py-4 bg-primary/5 border-t border-border">
                  <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-primary/10 border border-primary/30 rounded-lg">
          <h3 className="font-semibold mb-2">Still have questions?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Our customer support team is available 24/7 to help you find the right part.
          </p>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" asChild>
              <a href="tel:+18888874199">Call 1-888-887-4199</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="mailto:support@allusedautopartswarehouse.com">Email Support</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

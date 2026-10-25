import Link from "next/link"
import Image from "next/image"
import { Warehouse, Truck, Calendar, Boxes, ArrowRight } from "lucide-react"

const GALLERY = [
  {
    title: "Nationwide Warehouse Network",
    desc: "Millions of quality-tested components stored across 2,000+ partner facilities in all 50 states.",
    image: "/images/hero-warehouse.png",
    Icon: Warehouse,
    span: "lg:col-span-2 lg:row-span-2",
    height: "h-64 lg:h-full",
  },
  {
    title: "Fast Nationwide Delivery",
    desc: "Same-day shipping when available, delivered to your door or local shop.",
    image: "/images/section-delivery.png",
    Icon: Truck,
    span: "",
    height: "h-64",
  },
  {
    title: "Book an Appointment",
    desc: "Schedule a call with our parts specialists for expert fitment guidance.",
    image: "/images/section-appointment.png",
    Icon: Calendar,
    span: "",
    height: "h-64",
  },
  {
    title: "Precision Parts Assembly",
    desc: "Every component inspected, cataloged, and matched to your exact vehicle.",
    image: "/images/hero-parts-assembly.png",
    Icon: Boxes,
    span: "lg:col-span-2",
    height: "h-64",
  },
]

export function ShowcaseGallerySection() {
  return (
    <section className="py-20 bg-[#3a3d44]">
      <div className="mx-auto max-w-[1280px] px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6 mb-10 sm:mb-14">
          <div>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-8 h-px bg-gradient-to-r from-transparent to-primary/50" />
              <span className="text-[0.65rem] font-bold tracking-[0.3em] uppercase text-primary">Inside Our Operation</span>
            </div>
            <h2 className="font-serif text-[clamp(1.75rem,4vw,3rem)] font-bold text-foreground text-3d-section text-balance">
              How We Deliver Quality
            </h2>
          </div>
          <Link href="/parts" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-bold text-sm">
            Browse Parts <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Bento gallery grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-[minmax(0,1fr)] gap-4 sm:gap-5">
          {GALLERY.map(({ title, desc, image, Icon, span, height }) => (
            <div
              key={title}
              className={`group relative overflow-hidden rounded-xl glass-card border border-primary/10 hover:border-primary/25 transition-all duration-300 ${span}`}
            >
              <div className={`relative w-full ${height} min-h-64 overflow-hidden`}>
                <Image
                  src={image}
                  alt={title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-primary/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="text-white font-bold tracking-tight text-base sm:text-lg drop-shadow">{title}</h3>
                  </div>
                  <p className="text-white/80 text-[0.8rem] sm:text-[0.85rem] leading-relaxed max-w-md">{desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

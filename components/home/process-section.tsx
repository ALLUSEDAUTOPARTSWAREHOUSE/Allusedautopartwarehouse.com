"use client"

const steps = [
  { num: "01", title: "Select Your Vehicle", desc: "Choose year, make, model and the exact part you need from our smart search form.", delay: "0s" },
  { num: "02", title: "We Source It", desc: "Our system searches 2,000+ verified yards and returns the best available options.", delay: "0.6s" },
  { num: "03", title: "Confirm & Order", desc: "Review listings, prices and condition. Request a quote with zero obligation.", delay: "1.2s" },
  { num: "04", title: "Delivered to Door", desc: "Your part ships directly from the yard to your address — anywhere in the US.", delay: "1.8s" },
]

export function ProcessSection() {
  return (
    <section className="py-20 relative overflow-hidden bg-[#0d0f16]">
      <div className="metal-line absolute top-0 left-0 right-0" />
      <div className="metal-line absolute bottom-0 left-0 right-0" />

      <div className="mx-auto max-w-[1280px] px-6 relative z-10">

        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="process-heading-led font-sans text-[clamp(1.6rem,4vw,2.8rem)] font-black tracking-[0.08em] uppercase text-3d-bold">
            How It Works
          </h2>
          <p className="process-desc-led text-[0.78rem] font-medium tracking-[0.12em] uppercase mt-4 max-w-[420px] mx-auto">
            Finding quality used auto parts has never been this straightforward
          </p>
        </div>

        {/* Step cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step) => (
            <div
              key={step.num}
              className="process-card group relative flex flex-col gap-4 border border-border/30 rounded-sm p-7 overflow-hidden"
              style={{ animationDelay: step.delay }}
            >
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-white/10" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-white/10" />

              {/* Step number — 8D extrusion + diamond LED flash */}
              <div
                className="process-step-num font-black leading-none select-none"
                style={{ animationDelay: step.delay }}
              >
                {step.num}
              </div>

              {/* Thin chrome rule */}
              <div className="process-rule" />

              {/* Title — mercury chrome + LED pulse */}
              <h3
                className="process-step-title font-black tracking-[0.16em] uppercase leading-tight"
                style={{ animationDelay: step.delay }}
              >
                {step.title}
              </h3>

              {/* Description */}
              <p
                className="process-step-desc text-[0.72rem] leading-relaxed tracking-[0.04em]"
                style={{ animationDelay: step.delay }}
              >
                {step.desc}
              </p>

              {/* Ghost scan sweep */}
              <span className="ghost-scan-bar" aria-hidden="true" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

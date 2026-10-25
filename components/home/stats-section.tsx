export function StatsSection() {
  const stats = [
    { value: "2,000+", label: "Verified Yards", sub: "Nationwide network" },
    { value: "90-Day", label: "Warranty", sub: "Every part covered" },
    { value: "< 24hrs", label: "Response Time", sub: "Guaranteed" },
    { value: "50+", label: "Car Brands", sub: "All makes & models" },
  ]

  return (
    <section className="bg-[rgba(15,17,25,0.85)] border-b border-border/30 backdrop-blur-xl">
      <div className="mx-auto max-w-[1280px] grid grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`text-center py-10 px-6 transition-colors hover:bg-foreground/5 ${
              i < stats.length - 1 ? "border-r border-border/30" : ""
            }`}
          >
            <span className="block font-serif text-4xl font-semibold text-foreground">{stat.value}</span>
            <span className="block text-[0.7rem] font-bold tracking-[0.12em] uppercase text-foreground mt-1 mb-0.5">{stat.label}</span>
            <span className="block text-[0.7rem] text-muted-foreground">{stat.sub}</span>
          </div>
        ))}
      </div>
      <div className="metal-line" />
    </section>
  )
}

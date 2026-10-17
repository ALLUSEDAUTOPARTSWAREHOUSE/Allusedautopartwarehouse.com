"use client"

import Link from "next/link"
import { Menu, X, Zap, ShoppingCart, Heart, Home, ChevronDown, Globe, MessageSquare, Phone, Sparkles } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { BrandWordmark } from "@/components/brand-wordmark"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { useCartStore } from "@/lib/stores/cart-store"
import { useWishlistStore } from "@/lib/stores/wishlist-store"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [mounted, setMounted] = useState(false)
  const lastScrollY = useRef(0)
  const cartItems = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0)
  )
  const wishlistCount = useWishlistStore((state) => state.items.length)

  // Persisted browser counts must not change the server's initial badge markup.
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY
      const diff = currentY - lastScrollY.current
      // Only hide on desktop scroll down; always visible on mobile
      const isMobile = window.innerWidth < 640
      if (isMobile) {
        setHidden(false)
      } else if (currentY < 80) {
        setHidden(false)
      } else if (diff > 4) {
        setHidden(true)
        if (mobileOpen) setMobileOpen(false)
      } else if (diff < -4) {
        setHidden(false)
      }
      lastScrollY.current = currentY
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [mobileOpen])

  const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Car Brands", href: "/brands" },
  { label: "Used Parts", href: "/parts" },
  { label: "Engines", href: "/used-engines" },
  { label: "Transmissions", href: "/used-transmissions" },
  ]

  const allPages = [
    { label: "Home", href: "/" },
    { label: "About Us", href: "/about" },
    { label: "Used Parts", href: "/parts" },
    { label: "Used Engines", href: "/used-engines" },
    { label: "Used Transmissions", href: "/used-transmissions" },
    { label: "All Makes", href: "/makes" },
    { label: "Inventory", href: "/inventory" },
    { label: "Search", href: "/ai-search" },
    { label: "Get a Quote", href: "/quote" },
    { label: "Contact", href: "/contact" },
    { label: "Blog", href: "/blog" },
    { label: "Cart", href: "/cart" },
  ]

  const partsCategories = [
    { label: "Engine Parts", href: "/parts/engines" },
    { label: "Transmission Parts", href: "/parts/transmissions" },
    { label: "Drivetrain Parts", href: "/parts/drivetrain" },
    { label: "Electrical Parts", href: "/parts/electrical" },
    { label: "Cooling & Climate", href: "/parts/cooling" },
    { label: "Brakes & Safety", href: "/parts/brakes" },
    { label: "Suspension & Steering", href: "/parts/suspension" },
    { label: "Body & Interior", href: "/parts/body" },
    { label: "Exhaust System", href: "/parts/exhaust" },
  ]

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out"
      style={{ transform: hidden ? "translateY(-110%)" : "translateY(0)" }}
    >
      {/* ── Animated premium banner with scrolling text ────────────────────────── */}
      <div className="header-boss-banner">
        <div className="header-boss-banner-scroll">
          <div className="header-boss-banner-item">
            <Zap className="w-3 h-3" />
            <span>2,000+ Verified Yards</span>
          </div>
          <div className="header-boss-banner-item">
            <Zap className="w-3 h-3" />
            <span>$240 Flat Shipping Per Part</span>
          </div>
          <div className="header-boss-banner-item">
            <Zap className="w-3 h-3" />
            <span>24/7 Customer Support</span>
          </div>
          <div className="header-boss-banner-item">
            <Zap className="w-3 h-3" />
            <span>2,000+ Verified Yards</span>
          </div>
          <div className="header-boss-banner-item">
            <Zap className="w-3 h-3" />
            <span>$240 Flat Shipping Per Part</span>
          </div>
        </div>
      </div>

      {/* ── Premium glassmorphic header ────────────────────────── */}
      <div className="header-boss-container">
        <div className="header-boss-bg" />

        <div className="mx-auto w-full px-2 sm:px-4 md:px-6 lg:px-8 flex items-center h-full justify-between gap-1 sm:gap-4 relative z-10">

          {/* Logo + Wordmark */}
          <Link href="/" className="on-dark flex items-center gap-2 sm:gap-4 shrink-0 group header-boss-logo-group min-w-0">
            {/* Single responsive logo */}
            <div className="header-boss-logo-ring w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center flex-shrink-0">
              <Logo size="sm" priority showGlow />
            </div>
            {/* Mobile: full brand name */}
            <div className="flex flex-col justify-center sm:hidden min-w-0">
              <span className="wordmark-3d leading-tight font-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.01em' }}>AUAPW LLC</span>
              <span className="wordmark-sub font-bold uppercase leading-tight" style={{ fontSize: '0.5rem', letterSpacing: '0.06em' }}>ALL USED AUTO PARTS</span>
              <span className="wordmark-sub font-bold uppercase leading-tight" style={{ fontSize: '0.5rem', letterSpacing: '0.06em' }}>WAREHOUSE</span>
            </div>
            {/* Desktop: full wordmark */}
            <div className="hidden sm:flex flex-col justify-center pt-[2px]">
              <BrandWordmark size="nav" showSubline />
            </div>
          </Link>

          {/* Center — embossed typography navigation (desktop only) */}
          <div className="hidden min-[1600px]:flex items-center gap-1 flex-1 justify-center">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="header-boss-nav-text group relative"
              >
                <span className="header-boss-nav-label">{item.label}</span>
                <span className="header-boss-nav-glow" />
              </Link>
            ))}

            {/* Parts Categories Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="header-boss-nav-text group relative flex items-center gap-1.5 outline-none">
                <span className="header-boss-nav-label">Parts</span>
                <ChevronDown className="w-3 h-3 opacity-50 transition-transform group-data-[state=open]:rotate-180" />
                <span className="header-boss-nav-glow" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56 bg-card/95 backdrop-blur-xl border-border/50">
                <DropdownMenuLabel className="text-xs font-bold tracking-widest uppercase text-muted-foreground">
                  Parts by Category
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {partsCategories.map((cat) => (
                  <DropdownMenuItem key={cat.href} asChild>
                    <Link
                      href={cat.href}
                      className="flex items-center gap-2 cursor-pointer text-sm"
                    >
                      {cat.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href="/parts"
                    className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-primary"
                  >
                    View All Parts
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* AI Smart Search */}
            <Link
              href="/ai-search"
              className="header-boss-nav-text group relative flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="header-boss-nav-label">AI Search</span>
              <span className="header-boss-nav-glow" />
            </Link>

            {/* Review All Website Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="header-boss-nav-text group relative flex items-center gap-1.5 outline-none">
                <Globe className="w-3.5 h-3.5 opacity-70" />
                <span className="header-boss-nav-label">All Pages</span>
                <ChevronDown className="w-3 h-3 opacity-50 transition-transform group-data-[state=open]:rotate-180" />
                <span className="header-boss-nav-glow" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56 bg-card/95 backdrop-blur-xl border-border/50">
                <DropdownMenuLabel className="text-xs font-bold tracking-widest uppercase text-muted-foreground">
                  Review All Website
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {allPages.map((page) => (
                  <DropdownMenuItem key={page.href} asChild>
                    <Link
                      href={page.href}
                      className="flex items-center gap-2 cursor-pointer text-sm"
                    >
                      {page.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right — CTA, phone, menu */}
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            {/* Theme toggle — desktop only */}
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            {/* Cart indicator — desktop only */}
            <Link href="/cart" className="relative hidden sm:flex items-center justify-center w-9 h-9 rounded-lg hover:bg-white/10 transition-colors" title="Cart">
              <ShoppingCart className="w-5 h-5 text-foreground" />
              {mounted && cartItems > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">
                  {cartItems}
                </span>
              )}
            </Link>

            {/* Desktop: FREE QUOTE button */}
            <Link href="/quote" className="hidden sm:flex auapw-btn auapw-btn-amber auapw-btn-sm">
              <MessageSquare className="w-4 h-4" />
              <span>Free Quote</span>
            </Link>

            {/* Mobile menu toggle */}
            <button
              className="min-[1600px]:hidden flex flex-col items-center justify-center rounded-md border border-white/25 bg-white/8 hover:bg-white/15 active:scale-90 transition-all duration-150 cursor-pointer gap-[4px] px-1.5"
              style={{ width: '1.75rem', height: '1.75rem' }}
              onClick={() => setMobileOpen(!mobileOpen)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setMobileOpen(!mobileOpen)
                }
              }}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              type="button"
            >
              {mobileOpen ? (
                <X className="w-3 h-3 text-white" />
              ) : (
                <>
                  <span className="w-full h-[1.5px] bg-white rounded-full" />
                  <span className="w-3/4 h-[1.5px] bg-white/70 rounded-full" />
                  <span className="w-full h-[1.5px] bg-white rounded-full" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bottom shimmer rule */}
        <div className="header-boss-rule" />
      </div>

      {/* ── Mobile drawer ──────────────────────── */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 min-[1600px]:hidden"
            onClick={() => setMobileOpen(false)}
            style={{ zIndex: 9998 }}
            aria-hidden="true"
          />

          <div
            className="fixed left-0 right-0 min-[1600px]:hidden"
            style={{
              top: '92px',
              zIndex: 9999,
              maxHeight: 'calc(100vh - 92px)',
              overflowY: 'auto',
              background: 'rgba(8,10,16,0.97)',
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div className="px-3 py-3 flex flex-col gap-2.5">

              {/* ── Quick-contact strip ── */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href="tel:+18888874199"
                  className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-green-500/15 border border-green-500/30 hover:bg-green-500/25 active:scale-95 transition-all"
                >
                  <Phone className="w-4 h-4 text-green-400 shrink-0" />
                  <span className="text-xs font-black text-green-300 tracking-wide">1-888-887-4199</span>
                </a>
                <Link
                  href="/quote"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 active:scale-95 transition-all"
                >
                  <MessageSquare className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs font-black text-amber-300 tracking-wide">FREE QUOTE</span>
                </Link>
              </div>

              {/* ── Divider ── */}
              <div className="h-px bg-white/8" />

              {/* ── Main nav ── */}
              <div>
                <p className="text-[9px] font-black tracking-[0.2em] uppercase text-white/30 px-1 mb-1.5">Navigate</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 active:bg-white/15 transition-colors"
                    >
                      {item.icon && <item.icon className="w-3.5 h-3.5 text-white/50 shrink-0" />}
                      <span className="text-xs font-semibold text-white/80">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* ── Divider ── */}
              <div className="h-px bg-white/8" />

              {/* ── Parts categories ── */}
              <div>
                <p className="text-[9px] font-black tracking-[0.2em] uppercase text-primary/60 px-1 mb-1.5">Parts by Category</p>
                <div className="grid grid-cols-3 gap-1">
                  {partsCategories.map((cat) => (
                    <Link
                      key={cat.href}
                      href={cat.href}
                      onClick={() => setMobileOpen(false)}
                      className="px-1.5 py-2 text-[10px] font-semibold rounded-md bg-primary/10 hover:bg-primary/20 active:bg-primary/30 transition-colors truncate text-center text-primary/90 leading-tight"
                    >
                      {cat.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* ── Divider ── */}
              <div className="h-px bg-white/8" />

              {/* ── All pages ── */}
              <div>
                <p className="text-[9px] font-black tracking-[0.2em] uppercase text-blue-400/60 px-1 mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3 h-3" />
                  All Pages
                </p>
                <div className="grid grid-cols-3 gap-1">
                  {allPages.map((page) => (
                    <Link
                      key={page.href}
                      href={page.href}
                      onClick={() => setMobileOpen(false)}
                      className="px-1.5 py-2 text-[10px] font-medium rounded-md bg-white/5 hover:bg-white/10 active:bg-white/15 transition-colors truncate text-center text-white/60"
                    >
                      {page.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* ── Divider ── */}
              <div className="h-px bg-white/8" />

              {/* ── Cart / Wishlist / Theme ── */}
              <div className="grid grid-cols-3 gap-1.5 pb-1">
                <Link
                  href="/cart"
                  onClick={() => setMobileOpen(false)}
                  className="relative flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 active:scale-95 transition-all"
                >
                  <ShoppingCart className="w-4 h-4 text-blue-400" />
                  <span className="text-[10px] font-bold text-blue-300">Cart</span>
                  {mounted && cartItems > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] font-black flex items-center justify-center">
                      {cartItems}
                    </span>
                  )}
                </Link>
                <Link
                  href="/wishlist"
                  onClick={() => setMobileOpen(false)}
                  className="relative flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-pink-500/10 border border-pink-500/20 hover:bg-pink-500/20 active:scale-95 transition-all"
                >
                  <Heart className="w-4 h-4 text-pink-400" />
                  <span className="text-[10px] font-bold text-pink-300">Saved</span>
                  {mounted && wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-pink-500 text-white text-[9px] font-black flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
                <div className="flex items-center justify-center py-2.5 rounded-lg bg-white/5 border border-white/10">
                  <ThemeToggle />
                </div>
              </div>

            </div>
          </div>
        </>
      )}
    </nav>
  )
}

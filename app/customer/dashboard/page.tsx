'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LogOut,
  ShoppingCart,
  Heart,
  Package,
  Settings,
  FileText,
  Clock,
  Search,
} from 'lucide-react'

interface Order {
  id: string
  orderNumber: string
  date: string
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled'
  total: number
  items: number
  trackingNumber?: string
}

interface WishlistItem {
  id: string
  partName: string
  make: string
  model: string
  price: number
  image: string
}

export default function CustomerDashboard() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'wishlist' | 'profile'>('overview')
  const [customerEmail, setCustomerEmail] = useState('')

  const [orders, setOrders] = useState<Order[]>([
    {
      id: '1',
      orderNumber: 'ORD-001234',
      date: '2024-01-15',
      status: 'delivered',
      total: 287.50,
      items: 2,
      trackingNumber: 'TRK123456789',
    },
    {
      id: '2',
      orderNumber: 'ORD-001235',
      date: '2024-01-18',
      status: 'shipped',
      total: 450.00,
      items: 1,
      trackingNumber: 'TRK987654321',
    },
  ])

  const [wishlist, setWishlist] = useState<WishlistItem[]>([
    {
      id: '1',
      partName: 'Engine Block',
      make: 'Honda',
      model: 'Civic',
      price: 2450.00,
      image: '/images/product-engine-1.png',
    },
    {
      id: '2',
      partName: 'Transmission',
      make: 'Toyota',
      model: 'Camry',
      price: 1850.00,
      image: '/images/product-transmission-1.png',
    },
  ])

  useEffect(() => {
    let active = true

    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/get-session')
        const session = response.ok ? await response.json() : null
        if (!active) return
        if (!session?.user?.email) {
          router.push('/customer/login')
          return
        }
        setCustomerEmail(session.user.email)
        setIsAuthenticated(true)
      } catch {
        if (active) router.push('/customer/login')
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void checkSession()
    return () => {
      active = false
    }
  }, [router])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/sign-out', { method: 'POST' })
    } catch (error) {
      console.error('[customer-dashboard] Sign out failed:', error)
    } finally {
      router.push('/customer/login')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-full px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Account</h1>
            <p className="text-sm text-muted-foreground">{customerEmail}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-full px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-border">
          {[
            { id: 'overview', label: 'Overview', icon: ShoppingCart },
            { id: 'orders', label: 'Order History', icon: Package },
            { id: 'wishlist', label: 'Wishlist', icon: Heart },
            { id: 'profile', label: 'Account Settings', icon: Settings },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
                activeTab === id
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-lg p-6">
                <p className="text-sm text-muted-foreground mb-2">Total Orders</p>
                <p className="text-3xl font-bold text-foreground">{orders.length}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <p className="text-sm text-muted-foreground mb-2">Total Spent</p>
                <p className="text-3xl font-bold text-foreground">
                  ${orders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <p className="text-sm text-muted-foreground mb-2">Wishlist Items</p>
                <p className="text-3xl font-bold text-foreground">{wishlist.length}</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  href="/search"
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium transition-colors"
                >
                  <Search className="w-4 h-4" />
                  Search Parts
                </Link>
                <Link
                  href="/customer/orders"
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium transition-colors"
                >
                  <Package className="w-4 h-4" />
                  Track Orders
                </Link>
                <Link
                  href="/customer/wishlist"
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium transition-colors"
                >
                  <Heart className="w-4 h-4" />
                  View Wishlist
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-8 text-center">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No orders yet</p>
                <Link
                  href="/search"
                  className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
                >
                  Browse Parts
                </Link>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-semibold text-foreground">{order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">{order.date}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        order.status === 'delivered'
                          ? 'bg-green-500/10 text-green-500'
                          : order.status === 'shipped'
                          ? 'bg-blue-500/10 text-blue-500'
                          : 'bg-yellow-500/10 text-yellow-500'
                      }`}
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{order.items} item(s)</p>
                      {order.trackingNumber && (
                        <p className="text-sm text-muted-foreground">Track: {order.trackingNumber}</p>
                      )}
                    </div>
                    <p className="text-lg font-bold text-foreground">${order.total.toFixed(2)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Wishlist Tab */}
        {activeTab === 'wishlist' && (
          <div className="space-y-4">
            {wishlist.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-8 text-center">
                <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No items in your wishlist</p>
              </div>
            ) : (
              wishlist.map((item) => (
                <div key={item.id} className="bg-card border border-border rounded-lg p-6 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{item.partName}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.make} {item.model}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-lg font-bold text-foreground">${item.price.toFixed(2)}</p>
                    <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium">
                      Get Quote
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-card border border-border rounded-lg p-6 max-w-2xl">
            <h2 className="text-lg font-semibold text-foreground mb-6">Account Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
                <input
                  type="email"
                  value={customerEmail}
                  disabled
                  className="w-full px-4 py-2 border border-border rounded-lg bg-muted text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Password</label>
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium">
                  Change Password
                </button>
              </div>
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-4">Delete your account</p>
                <button className="px-4 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 font-medium">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

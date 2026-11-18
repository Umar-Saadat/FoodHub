import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  HelpCircle, ChevronDown, ChevronUp, Search, MessageSquare,
  Sparkles, ArrowRight, ShieldQuestion
} from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'

export default function FaqPage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [openIds, setOpenIds] = useState(new Set([1])) // First FAQ open by default

  const toggleFaq = (id) => {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const categories = [
    { id: 'all', label: 'All Questions' },
    { id: 'orders', label: 'Orders & Tracking' },
    { id: 'payments', label: 'Payments & Promos' },
    { id: 'delivery', label: 'Delivery & Fleet' },
    { id: 'accounts', label: 'Account & Addresses' },
  ]

  const faqs = [
    {
      id: 1,
      cat: 'orders',
      q: 'How does live order tracking work on FoodHub?',
      a: 'Once your order is confirmed, our kitchen updates its progress across 7 transparent stages: Pending, Confirmed, Preparing, Ready for pickup, Picked up, Out for delivery, and Delivered. When assigned to a rider, you can view the live GPS location of the driver on an interactive map in real time via WebSockets.'
    },
    {
      id: 2,
      cat: 'orders',
      q: 'Can I cancel an order after placing it?',
      a: 'Yes, orders can be cancelled directly from the Order Details page as long as the status is "Pending" or "Confirmed". Once the restaurant begins "Preparing" your dish, cancellation is closed to prevent kitchen food waste.'
    },
    {
      id: 3,
      cat: 'orders',
      q: 'Can I add special cooking instructions to my meal?',
      a: 'Absolutely! When adding any dish to your cart, click the special instructions field to add notes like "Mild spice", "Sauce on the side", or "No onions". These notes are printed directly onto the kitchen order ticket.'
    },
    {
      id: 4,
      cat: 'payments',
      q: 'What payment options does FoodHub accept?',
      a: 'We accept Cash on Delivery (COD) for all orders without any extra convenience surcharge. You can also pay seamlessly online using Credit/Debit Cards powered by Stripe when enabled.'
    },
    {
      id: 5,
      cat: 'payments',
      q: 'How do I redeem promotional discount codes like WELCOME10?',
      a: 'Enter your voucher code in the "Promo Code" box on the Shopping Cart or Checkout page and click "Apply". Valid codes instantly apply a discount percentage or waive the delivery fee on your order summary before payment.'
    },
    {
      id: 6,
      cat: 'delivery',
      q: 'What is the average delivery time?',
      a: 'Our average delivery time is between 25 and 35 minutes depending on distance and dish preparation time. Each restaurant displays an estimated prep time right on its card before you order.'
    },
    {
      id: 7,
      cat: 'delivery',
      q: 'Is contactless delivery supported?',
      a: 'Yes! Simply check "Contactless Delivery" or leave a note on the checkout page (e.g., "Leave at front gate / ring bell"). Our riders will drop off your package safely.'
    },
    {
      id: 8,
      cat: 'accounts',
      q: 'Can I save multiple delivery addresses?',
      a: 'Yes, in your Profile under "Saved Addresses", you can save Home, Work, Apartment, or custom locations with street details and set a default one for 1-click checkout.'
    },
    {
      id: 9,
      cat: 'accounts',
      q: 'How do I become an admin or delivery partner?',
      a: 'Administrators have access to the dedicated Admin Panel to manage orders, catalog, and fleet operations. If you are interested in becoming a delivery driver or partner restaurant, contact us via the Contact Us page.'
    },
  ]

  const filteredFaqs = useMemo(() => {
    return faqs.filter((item) => {
      const matchCat = activeCategory === 'all' || item.cat === activeCategory
      const matchSearch =
        item.q.toLowerCase().includes(search.toLowerCase()) ||
        item.a.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })
  }, [activeCategory, search])

  return (
    <MainLayout>
      {/* Hero */}
      <div className="relative bg-gradient-to-b from-orange-50/70 via-white to-white py-16 sm:py-20 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-50 text-brand-600 border border-brand-200 shadow-sm mb-4">
            <HelpCircle size={14} className="text-brand-500" /> Help Center
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="mt-3 text-base sm:text-lg text-gray-600 max-w-xl mx-auto">
            Everything you need to know about ordering, live GPS delivery, payments, and account settings.
          </p>

          {/* Search Bar */}
          <div className="mt-8 max-w-md mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search questions (e.g. tracking, payment, promo)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm shadow-card focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-2 mb-10">
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === c.id
                  ? 'bg-brand-500 text-white shadow-lift'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 shadow-sm'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion List */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200 p-8">
            <p className="text-sm font-bold text-gray-700">No questions found matching your search</p>
            <p className="text-xs text-gray-400 mt-1">Try searching with other keywords or clear the search filter.</p>
            <button
              onClick={() => { setSearch(''); setActiveCategory('all') }}
              className="mt-4 px-4 py-2 rounded-xl bg-brand-500 text-white text-xs font-bold hover:bg-brand-600 transition"
            >
              Reset Search
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFaqs.map((faq) => {
              const isOpen = openIds.has(faq.id)
              return (
                <div
                  key={faq.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-gray-50/70 transition"
                  >
                    <span className="font-bold text-gray-900 text-sm sm:text-base">
                      {faq.q}
                    </span>
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isOpen ? 'bg-brand-50 text-brand-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-50">
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Still Need Help Box */}
        <div className="mt-12 bg-gradient-to-r from-orange-50 via-white to-orange-50 rounded-3xl p-8 border border-orange-100 text-center shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-brand-500 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
            <MessageSquare size={22} />
          </div>
          <h3 className="text-xl font-extrabold text-gray-900">Still have a question?</h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-md mx-auto">
            Can’t find the answer you’re looking for? Our customer support agents are ready 24/7 to help you.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow-lift hover:scale-105 transition-all"
            >
              Contact Support <ArrowRight size={14} />
            </Link>
            <Link
              to="/restaurants"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-white hover:bg-gray-50 text-gray-800 font-bold text-xs rounded-xl border border-gray-200 shadow-sm transition"
            >
              Browse Restaurants
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

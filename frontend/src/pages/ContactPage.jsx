import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Mail, Phone, MapPin, Send, MessageSquare, Clock,
  HelpCircle, CheckCircle2, Sparkles, Headphones
} from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import { useToast } from '../contexts/ToastContext'

export default function ContactPage() {
  const { addToast } = useToast()

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    topic: 'order_issue',
    order_number: '',
    message: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      addToast('Please fill out all required fields', 'warning')
      return
    }
    setSubmitting(true)

    // Simulate sending message
    setTimeout(() => {
      setSubmitting(false)
      setSubmitted(true)
      addToast('Your message has been sent! Our support team will reply within 30 minutes.', 'success')
    }, 800)
  }

  const channels = [
    {
      icon: Headphones,
      title: 'Customer Support 24/7',
      desc: 'Got an urgent question about an active order or delivery?',
      contact: '+92 42 111 000 100',
      action: 'Call Helpline',
      href: 'tel:+9242111000100',
      color: 'bg-orange-50 text-brand-500 border-orange-200'
    },
    {
      icon: Mail,
      title: 'Email Inquiries',
      desc: 'For feedback, receipts, or general questions.',
      contact: 'support@foodhub.com',
      action: 'Email Us',
      href: 'mailto:support@foodhub.com',
      color: 'bg-blue-50 text-blue-600 border-blue-200'
    },
    {
      icon: MessageSquare,
      title: 'Restaurant Partnerships',
      desc: 'Want to list your restaurant and reach thousands of customers?',
      contact: 'partners@foodhub.com',
      action: 'Partner With Us',
      href: 'mailto:partners@foodhub.com',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200'
    },
    {
      icon: MapPin,
      title: 'Headquarters',
      desc: 'Visit our regional culinary logistics hub.',
      contact: 'MM Alam Road, Gulberg III, Lahore, Pakistan',
      action: 'Get Directions',
      href: '#',
      color: 'bg-purple-50 text-purple-600 border-purple-200'
    },
  ]

  return (
    <MainLayout>
      {/* Header */}
      <div className="relative bg-gradient-to-b from-orange-50/70 via-white to-white py-16 sm:py-20 text-center overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-50 text-brand-600 border border-brand-200 shadow-sm mb-4">
            <Sparkles size={14} className="text-brand-500" /> We're here to help
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
            Contact FoodHub Support
          </h1>
          <p className="mt-3 text-base sm:text-lg text-gray-600 max-w-xl mx-auto">
            Have a question about an order, restaurant partner inquiry, or just want to say hello? We’re always listening.
          </p>
        </div>
      </div>

      {/* Support Channels Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {channels.map((ch, i) => {
            const Icon = ch.icon
            return (
              <div
                key={i}
                className="bg-white rounded-3xl p-6 border border-gray-100 shadow-card card-hover flex flex-col justify-between"
              >
                <div>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border ${ch.color}`}>
                    <Icon size={22} />
                  </div>
                  <h3 className="font-extrabold text-gray-900 text-base">{ch.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{ch.desc}</p>
                  <p className="text-xs font-bold text-gray-800 mt-3 font-mono break-all">{ch.contact}</p>
                </div>
                <div className="mt-5 pt-3 border-t border-gray-50">
                  <a
                    href={ch.href}
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 transition"
                  >
                    {ch.action} →
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Contact Form Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Form (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-card">
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Send us a Message
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 mb-6">
              Fill in your details below and our team will get back to you shortly.
            </p>

            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto text-2xl border border-emerald-200">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Message Received!</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                  Thank you, <strong>{form.name}</strong>. A support specialist has been notified and will reply to <strong>{form.email}</strong> shortly.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false)
                    setForm({ name: '', email: '', phone: '', topic: 'order_issue', order_number: '', message: '' })
                  }}
                  className="mt-4 px-6 py-2.5 rounded-xl bg-brand-500 text-white font-bold text-xs hover:bg-brand-600 transition"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ali Ahmed"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="ali@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="+92 300 1234567"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Topic
                    </label>
                    <select
                      value={form.topic}
                      onChange={(e) => setForm({ ...form, topic: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                    >
                      <option value="order_issue">Current Order Issue</option>
                      <option value="delivery_delay">Delivery Timing Inquiry</option>
                      <option value="restaurant_partner">Restaurant Partnership</option>
                      <option value="rider_application">Become a Delivery Driver</option>
                      <option value="general_feedback">General Feedback</option>
                    </select>
                  </div>
                </div>

                {(form.topic === 'order_issue' || form.topic === 'delivery_delay') && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Order Number (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. FH-20261118-F6D60E"
                      value={form.order_number}
                      onChange={(e) => setForm({ ...form, order_number: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    How can we help? *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe your inquiry or order details in detail..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <p className="text-[11px] text-gray-400">
                    Average response time: ~20 minutes
                  </p>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-7 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lift hover:scale-105 transition-all"
                  >
                    <Send size={15} />
                    {submitting ? 'Sending…' : 'Send Message'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right Info Box (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-500/80 text-white inline-block mb-4">
                Fast Answers
              </span>
              <h3 className="text-xl font-extrabold tracking-tight">
                Frequently Asked First
              </h3>
              <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                Before reaching out, check our self-service guides for instant solutions:
              </p>

              <div className="mt-5 space-y-3">
                <Link
                  to="/faq"
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 flex items-center justify-between text-xs text-gray-200 transition"
                >
                  <span>How can I live-track my driver?</span>
                  <span className="text-brand-400 font-bold">→</span>
                </Link>
                <Link
                  to="/faq"
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 flex items-center justify-between text-xs text-gray-200 transition"
                >
                  <span>What are the accepted payment methods?</span>
                  <span className="text-brand-400 font-bold">→</span>
                </Link>
                <Link
                  to="/faq"
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 flex items-center justify-between text-xs text-gray-200 transition"
                >
                  <span>How do promotional discount codes work?</span>
                  <span className="text-brand-400 font-bold">→</span>
                </Link>
              </div>

              <div className="mt-6 pt-5 border-t border-white/10 flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Customer Support is Currently Active
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-3xl p-6 space-y-2">
              <h4 className="font-bold text-brand-900 text-sm">Operating Hours</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Our customer hotline operates <strong>24 hours a day, 7 days a week</strong>. Restaurant delivery hours depend on each individual partner kitchen's schedule.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

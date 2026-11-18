import Navbar from './Navbar'
import Footer from './Footer'

export default function MainLayout({ children, noFooter = false }) {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      {!noFooter && <Footer />}
    </div>
  )
}

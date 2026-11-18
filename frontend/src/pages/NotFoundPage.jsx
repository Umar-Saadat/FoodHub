import { Link } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout'

export default function NotFoundPage() {
  return (
    <MainLayout>
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <div className="text-9xl mb-6">🍽️</div>
        <h1 className="text-5xl font-extrabold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Page Not Found</h2>
        <p className="text-gray-500 mb-8 max-w-md">
          Looks like this page went missing, like the last piece of pizza.
          Let's get you back to something delicious.
        </p>
        <Link
          to="/"
          className="bg-brand-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-brand-600 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </MainLayout>
  )
}

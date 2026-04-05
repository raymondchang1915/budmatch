import Link from 'next/link'

export default function Navbar() {
  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
      <nav className="bg-white border border-gray-200 rounded-full px-6 py-3 flex items-center justify-between w-full max-w-3xl shadow-sm">
        <Link href="/" className="font-bold text-gray-900 text-lg tracking-tight">
          BudMatch
        </Link>
        <div className="flex items-center gap-8">
          <Link href="/browse" className="text-sm text-gray-500 hover:text-gray-900 transition">
            Browse
          </Link>
          <Link href="/listings/new" className="text-sm text-gray-500 hover:text-gray-900 transition">
            Add a bud
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/browse" className="text-sm text-gray-500 hover:text-gray-900 transition">
            Sign in
          </Link>
          <Link
            href="/listings/new"
            className="bg-gray-900 text-white text-sm px-5 py-2 rounded-full hover:bg-black transition"
          >
            Post listing
          </Link>
        </div>
      </nav>
    </div>
  )
}
import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between">
      <Link href="/" className="font-bold text-xl text-black">
        BudMatch
      </Link>
      <div className="flex items-center gap-6">
        <Link href="/browse" className="text-sm text-gray-500 hover:text-black transition">
          Browse
        </Link>
        <Link
          href="/listings/new"
          className="bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 transition"
        >
          Post listing
        </Link>
      </div>
    </nav>
  )
}
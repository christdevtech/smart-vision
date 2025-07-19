import Link from 'next/link'
import React from 'react'
import './styles.css'

const BeforeAdminDashboard: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 justify-center items-center p-4 bg-gray-100 rounded-md md:flex-row md:justify-between">
      <h1 className="text-2xl font-bold text-left">Welcome to the Admin Dashboard</h1>
      <div className="flex flex-wrap gap-4 items-center">
        <Link
          href="/"
          className="px-4 py-2 font-medium text-center text-white no-underline bg-indigo-600 rounded-lg transition-colors hover:bg-indigo-700"
        >
          Home Page
        </Link>
        <Link
          href="/dashboard"
          className="px-4 py-2 font-medium text-center text-white no-underline bg-emerald-600 rounded-lg transition-colors hover:bg-emerald-700"
        >
          Admin Dashboard
        </Link>
      </div>
    </div>
  )
}

export default BeforeAdminDashboard

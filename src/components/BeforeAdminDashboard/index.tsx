import Link from 'next/link'
import React from 'react'
import './styles.css'

const BeforeAdminDashboard: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 justify-center items-center rounded-md bg-muted md:flex-row md:justify-between">
      <h1 className="text-2xl font-bold text-left text-foreground">
        Welcome to the Admin Dashboard
      </h1>
      <div className="flex flex-wrap gap-4 items-center">
        <Link
          href="/"
          className="px-4 py-2 font-medium text-center no-underline rounded-xl transition-colors text-primary-foreground bg-slate-200 hover:bg-slate-300"
        >
          Home Page
        </Link>
        <Link
          href="/dashboard"
          className="px-4 py-2 font-medium text-center text-white no-underline bg-emerald-600 rounded-xl transition-colors text-primary-foreground hover:bg-emerald-700"
        >
          Admin Dashboard
        </Link>
      </div>
    </div>
  )
}

export default BeforeAdminDashboard

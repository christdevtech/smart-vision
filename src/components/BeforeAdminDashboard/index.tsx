import Link from 'next/link'
import React from 'react'
import './styles.css'

const BeforeAdminDashboard: React.FC = () => {
  return (
    <div className="smartvision-admin-welcome">
      <h1 className="smartvision-admin-welcome__title">Welcome to the Admin Dashboard</h1>
      <div className="smartvision-admin-welcome__actions">
        <Link
          href="/"
          className="smartvision-admin-welcome__button smartvision-admin-welcome__button--secondary"
        >
          Home Page
        </Link>
        <Link
          href="/dashboard"
          className="smartvision-admin-welcome__button smartvision-admin-welcome__button--primary"
        >
          Admin Dashboard
        </Link>
      </div>
    </div>
  )
}

export default BeforeAdminDashboard

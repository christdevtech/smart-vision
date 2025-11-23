import React from 'react'
import Link from 'next/link'
import { Home, ArrowLeft, Search, BookOpen } from 'lucide-react'

export default function DashboardNotFound() {
  return (
    <div className="flex justify-center items-center p-4 min-h-screen bg-dashboard-background text-foreground">
      <div className="space-y-8 w-full max-w-md text-center">
        {/* 404 Illustration */}
        <div className="space-y-4">
          <div className="text-8xl font-bold select-none text-primary/20">404</div>
          <div className="mx-auto w-24 h-1 rounded-full bg-primary"></div>
        </div>

        {/* Error Message */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Page Not Found</h1>
          <p className="leading-relaxed text-muted-foreground">
            The dashboard page you are looking for does not exist or has been moved. Let us get you
            back on track with your learning journey.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="inline-flex gap-2 justify-center items-center px-6 py-3 w-full font-medium rounded-lg transition-colors bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex gap-2 justify-center items-center px-6 py-3 w-full font-medium rounded-lg border transition-colors border-border hover:bg-accent hover:text-accent-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Link>
        </div>

        {/* Quick Links */}
        <div className="pt-8 border-t border-border">
          <p className="mb-4 text-sm text-muted-foreground">Quick access to popular sections:</p>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/dashboard"
              className="flex gap-2 items-center p-3 text-sm rounded-lg border transition-colors border-border hover:bg-accent hover:text-accent-foreground"
            >
              <BookOpen className="w-4 h-4" />
              <span>Study Materials</span>
            </Link>
            <Link
              href="/dashboard"
              className="flex gap-2 items-center p-3 text-sm rounded-lg border transition-colors border-border hover:bg-accent hover:text-accent-foreground"
            >
              <Search className="w-4 h-4" />
              <span>Search Content</span>
            </Link>
          </div>
        </div>

        {/* Help Text */}
        <div className="pt-4">
          <p className="text-xs text-muted-foreground">
            If you believe this is an error, please contact support or try refreshing the page.
          </p>
        </div>
      </div>
    </div>
  )
}

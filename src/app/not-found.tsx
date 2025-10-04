import React from 'react'
import Link from 'next/link'
import { Home, ArrowLeft, Search, BookOpen } from 'lucide-react'

export default function DashboardNotFound() {
  return (
    <div className="min-h-screen bg-dashboard-background text-foreground flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* 404 Illustration */}
        <div className="space-y-4">
          <div className="text-8xl font-bold text-primary/20 select-none">
            404
          </div>
          <div className="w-24 h-1 bg-primary mx-auto rounded-full"></div>
        </div>

        {/* Error Message */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-foreground">
            Page Not Found
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            The dashboard page you're looking for doesn't exist or has been moved. 
            Let's get you back on track with your learning journey.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Link>
          
          <Link
            href="/dashboard"
            className="w-full inline-flex items-center justify-center gap-2 border border-border hover:bg-accent hover:text-accent-foreground px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Link>
        </div>

        {/* Quick Links */}
        <div className="pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4">
            Quick access to popular sections:
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
            >
              <BookOpen className="w-4 h-4" />
              <span>Study Materials</span>
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
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
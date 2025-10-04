import React from 'react'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'

export default function Footer() {
  return (
    <footer className="flex flex-col gap-2 items-center pt-5 mt-8 border-t border-border">
      <div className="flex items-center gap-4">
        <p className="m-0 text-sm text-muted-foreground">
          © 2024 SmartVision - Empowering Secondary Education
        </p>
        <ThemeSwitcher />
      </div>
      <div className="flex gap-2 items-center text-xs text-muted-foreground md:flex-col md:gap-1">
        <span>Supports MTN & Orange Money</span>
        <span className="md:hidden">•</span>
        <span>Earn 10% from referrals</span>
      </div>
    </footer>
  )
}

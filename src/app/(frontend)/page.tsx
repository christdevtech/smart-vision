import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'
import { redirect } from 'next/navigation'

import config from '@/payload.config'
import './styles.css'
import Link from 'next/link'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  // Redirect logged-in users to dashboard
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="flex flex-col justify-between items-center min-h-screen bg-black text-white px-11 py-11 max-w-4xl mx-auto overflow-hidden md:px-6">
      <div className="flex flex-col items-center justify-center flex-grow text-center max-w-5xl w-full">
        <div className="mb-5">
          <svg
            width="80"
            height="80"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-[0_4px_8px_rgba(79,70,229,0.3)]"
          >
            <circle cx="50" cy="50" r="45" fill="#4F46E5" stroke="#6366F1" strokeWidth="2" />
            <path d="M35 40h30v5H35v-5zm0 10h25v5H35v-5zm0 10h20v5H35v-5z" fill="white" />
            <circle cx="75" cy="25" r="8" fill="#10B981" />
            <path d="M72 25l2 2 4-4" stroke="white" strokeWidth="2" fill="none" />
          </svg>
        </div>

        <h1 className="xl:text-6xl lg:text-4xl md:text-4xl text-3xl font-bold bg-gradient-to-br from-indigo-500 to-emerald-500 bg-clip-text text-transparent mb-2.5 mt-5">
          SmartVision
        </h1>
        <p className="text-xl md:text-base text-white/80 mb-10 md:mb-7 max-w-2xl">
          Comprehensive Mobile Learning Platform for Secondary Education
        </p>

        <div className="my-10 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-left transition-all duration-300 hover:bg-white/8 hover:border-indigo-500/30 hover:-translate-y-0.5">
              <h3 className="text-lg font-medium text-white mb-3">📚 Personalized Learning</h3>
              <p className="text-sm text-white/70 leading-relaxed m-0">
                Customized study programs and timetables based on your goals
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-left transition-all duration-300 hover:bg-white/8 hover:border-indigo-500/30 hover:-translate-y-0.5">
              <h3 className="text-lg font-medium text-white mb-3">📱 Interactive Testing</h3>
              <p className="text-sm text-white/70 leading-relaxed m-0">
                MCQ testing with performance tracking and comprehensive question banks
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-left transition-all duration-300 hover:bg-white/8 hover:border-indigo-500/30 hover:-translate-y-0.5">
              <h3 className="text-lg font-medium text-white mb-3">🎥 Tutorial Videos</h3>
              <p className="text-sm text-white/70 leading-relaxed m-0">
                Extensive video library with offline viewing capability
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-left transition-all duration-300 hover:bg-white/8 hover:border-indigo-500/30 hover:-translate-y-0.5">
              <h3 className="text-lg font-medium text-white mb-3">📖 Digital Library</h3>
              <p className="text-sm text-white/70 leading-relaxed m-0">
                Downloadable PDF books with secure in-app reading
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-left transition-all duration-300 hover:bg-white/8 hover:border-indigo-500/30 hover:-translate-y-0.5">
              <h3 className="text-lg font-medium text-white mb-3">📴 Offline Access</h3>
              <p className="text-sm text-white/70 leading-relaxed m-0">
                Complete offline functionality after initial download
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-left transition-all duration-300 hover:bg-white/8 hover:border-indigo-500/30 hover:-translate-y-0.5">
              <h3 className="text-lg font-medium text-white mb-3">🔒 Content Security</h3>
              <p className="text-sm text-white/70 leading-relaxed m-0">
                Advanced protection with encrypted local storage
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-10 md:gap-5 md:flex-wrap md:justify-center my-10">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-emerald-500 mb-1">99.5%</span>
            <span className="text-xs text-white/60 uppercase tracking-wider">Uptime</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-emerald-500 mb-1">iOS 12.0+</span>
            <span className="text-xs text-white/60 uppercase tracking-wider">& Android 9.0+</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-emerald-500 mb-1">2GB</span>
            <span className="text-xs text-white/60 uppercase tracking-wider">Min Storage</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 mt-10 md:gap-3">
          {user ? (
            <>{/* - */}</>
          ) : (
            <>
              <Link
                className="text-white bg-gradient-to-br from-indigo-500 to-emerald-500 no-underline px-6 py-3 rounded-lg font-medium transition-all duration-300 min-w-40 text-center text-base hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(79,70,229,0.3)] md:w-full md:max-w-70"
                href="#download"
              >
                App Coming soon!
              </Link>
              <Link
                className="text-white bg-white/10 border border-white/20 no-underline px-6 py-3 rounded-lg font-medium transition-all duration-300 min-w-40 text-center hover:bg-white/15 hover:border-white/30 md:w-full md:max-w-70"
                href={payloadConfig.routes.admin}
                rel="noopener noreferrer"
                target="_blank"
              >
                Admin Login
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 pt-5 border-t border-white/10">
        <p className="m-0 text-white/60 text-sm">
          © 2024 SmartVision - Empowering Secondary Education
        </p>
        <div className="flex items-center gap-2 text-xs text-white/50 md:flex-col md:gap-1">
          <span>Supports MTN & Orange Money</span>
          <span className="md:hidden">•</span>
          <span>Referral Rewards Available</span>
        </div>
      </div>
    </div>
  )
}

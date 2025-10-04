import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'
import { redirect } from 'next/navigation'

import config from '@/payload.config'
import Link from 'next/link'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  // Redirect logged-in users to dashboard
  if (user) {
    // redirect('/dashboard')
  }

  return (
    <div className="flex overflow-hidden flex-col justify-between items-center px-11 py-11 mx-auto max-w-4xl min-h-screen text-white bg-black md:px-6">
      <div className="flex flex-col flex-grow justify-center items-center w-full max-w-5xl text-center">
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
        <p className="mb-10 max-w-2xl text-xl md:text-base text-white/80 md:mb-7">
          Comprehensive Mobile Learning Platform for Secondary Education
        </p>

        <div className="my-10 w-full">
          <h3 className="pb-8 text-2xl font-bold">Features Coming Soon!</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-left transition-all duration-300 hover:bg-white/8 hover:border-indigo-500/30 hover:-translate-y-0.5">
              <h3 className="mb-3 text-lg font-medium text-white">📚 Personalized Learning</h3>
              <p className="m-0 text-sm leading-relaxed text-white/70">
                Customized study programs and timetables based on your goals
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-left transition-all duration-300 hover:bg-white/8 hover:border-indigo-500/30 hover:-translate-y-0.5">
              <h3 className="mb-3 text-lg font-medium text-white">📱 Interactive Testing</h3>
              <p className="m-0 text-sm leading-relaxed text-white/70">
                MCQ testing with performance tracking and comprehensive question banks
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-left transition-all duration-300 hover:bg-white/8 hover:border-indigo-500/30 hover:-translate-y-0.5">
              <h3 className="mb-3 text-lg font-medium text-white">🎥 Tutorial Videos</h3>
              <p className="m-0 text-sm leading-relaxed text-white/70">
                Extensive video library with offline viewing capability
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-left transition-all duration-300 hover:bg-white/8 hover:border-indigo-500/30 hover:-translate-y-0.5">
              <h3 className="mb-3 text-lg font-medium text-white">📖 Digital Library</h3>
              <p className="m-0 text-sm leading-relaxed text-white/70">
                Downloadable PDF books with secure in-app reading
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-left transition-all duration-300 hover:bg-white/8 hover:border-indigo-500/30 hover:-translate-y-0.5">
              <h3 className="mb-3 text-lg font-medium text-white">📴 Offline Access</h3>
              <p className="m-0 text-sm leading-relaxed text-white/70">
                Complete offline functionality after initial download
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-left transition-all duration-300 hover:bg-white/8 hover:border-indigo-500/30 hover:-translate-y-0.5">
              <h3 className="mb-3 text-lg font-medium text-white">🔒 Content Security</h3>
              <p className="m-0 text-sm leading-relaxed text-white/70">
                Advanced protection with encrypted local storage
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-10 my-10 md:gap-5 md:flex-wrap md:justify-center">
          <div className="flex flex-col items-center">
            <span className="mb-1 text-2xl font-bold text-emerald-500">99.5%</span>
            <span className="text-xs tracking-wider uppercase text-white/60">Uptime</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="mb-1 text-2xl font-bold text-emerald-500">iOS 12.0+</span>
            <span className="text-xs tracking-wider uppercase text-white/60">& Android 9.0+</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="mb-1 text-2xl font-bold text-emerald-500">2GB</span>
            <span className="text-xs tracking-wider uppercase text-white/60">Min Storage</span>
          </div>
        </div>

        <div className="flex flex-col gap-4 items-center mt-10 md:gap-3">
          {user ? (
            <>
              <Link
                className="text-white bg-gradient-to-br from-indigo-500 to-emerald-500 no-underline px-6 py-3 rounded-lg font-medium transition-all duration-300 min-w-40 text-center text-base hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(79,70,229,0.3)] md:w-full md:max-w-70"
                href="/dashboard"
              >
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                className="text-white bg-gradient-to-br from-indigo-500 to-emerald-500 no-underline px-6 py-3 rounded-lg font-medium transition-all duration-300 min-w-40 text-center text-base hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(79,70,229,0.3)] md:w-full md:max-w-70"
                href="/auth/register"
              >
                Get Started
              </Link>
              <Link
                className="px-6 py-3 font-medium text-center text-white no-underline rounded-lg border transition-all duration-300 bg-white/10 border-white/20 min-w-40 hover:bg-white/15 hover:border-white/30 md:w-full md:max-w-70"
                href="/auth/login"
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 items-center pt-5 mt-8 border-t border-white/10">
        <p className="m-0 text-sm text-white/60">
          © 2024 SmartVision - Empowering Secondary Education
        </p>
        <div className="flex gap-2 items-center text-xs text-white/50 md:flex-col md:gap-1">
          <span>Supports MTN & Orange Money</span>
          <span className="md:hidden">•</span>
          <span>Referral Rewards Available</span>
        </div>
      </div>
    </div>
  )
}
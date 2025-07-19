import payloadConfig from '@/payload.config'
import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import Link from 'next/link'
import config from '@/payload.config'

export async function Header() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })
  return (
    <header className="sticky top-0 z-10 border-b backdrop-blur-sm border-white/10 bg-black/50">
      <div className="flex justify-between items-center px-6 py-4 mx-auto max-w-6xl">
        <Link href="/" className="flex gap-3 items-center no-underline">
          <svg
            width="40"
            height="40"
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
          <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-emerald-500">
            SmartVision
          </span>
        </Link>

        <div className="flex gap-4 items-center">
          {user && (
            <span className="text-sm text-white/80">Welcome, {user.firstName || user.email}</span>
          )}
          {user ? (
            user.role !== 'user' && (
              <>
                <Link
                  href={payloadConfig.routes.admin}
                  className="px-4 py-2 text-sm font-medium text-white no-underline rounded-lg border transition-all duration-300 bg-white/10 border-white/20 hover:bg-white/15 hover:border-white/30"
                  //   target="_blank"
                  rel="noopener noreferrer"
                >
                  Admin
                </Link>
              </>
            )
          ) : (
            <Link
              href="/auth/login"
              className="px-4 py-2 text-sm font-medium text-white no-underline rounded-lg border transition-all duration-300 bg-white/10 border-white/20 hover:bg-white/15 hover:border-white/30"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

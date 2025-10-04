'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Setting, Subscription, Transaction, User } from '@/payload-types'
import { toast } from 'sonner'

export interface SubscriptionDashboardProps {
  user: User
  transactions?: Transaction[]
  subscription?: Subscription
  subscriptionData: Setting['subscriptionCosts']
}

export default function SubscriptionDashboard({
  user,
  transactions = [],
  subscription,
  subscriptionData,
}: SubscriptionDashboardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [phone, setPhone] = useState('')
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly')
  const [showTransactions, setShowTransactions] = useState(false)
  const [verifyingTransaction, setVerifyingTransaction] = useState<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  // console.log(subscription)

  // Calculate subscription amount based on selected plan
  const subscriptionAmount =
    selectedPlan === 'monthly'
      ? subscriptionData?.monthly || 3000
      : subscriptionData?.yearly || 30000

  // Check if user has an active subscription
  const hasActiveSubscription =
    subscription &&
    subscription.paymentStatus === 'paid' &&
    new Date(subscription.endDate) > new Date()

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  useEffect(() => {
    const txId = searchParams.get('transactionId')
    if (txId && txId !== transactionId) {
      setTransactionId(txId)
      setIsPolling(true)
      pollStatus(txId)
    }
  }, [searchParams, transactionId])

  const initiatePayment = async () => {
    if (!phone) {
      setError('Please enter your phone number')
      return
    }
    setIsLoading(true)
    setError(null)

    try {
      const userId = user.id
      const response = await fetch('/api/custom/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount: subscriptionAmount,
          phone,
          medium: 'mobile money',
          message: `${selectedPlan === 'monthly' ? 'Monthly' : 'Yearly'} subscription payment`,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`${errorData.error} - ${errorData.details}` || 'Failed to initiate payment')
      }

      const data = await response.json()
      setTransactionId(data.transactionId)
      setIsPolling(true)
      router.push(`?transactionId=${data.transactionId}`) // Persist in URL
      pollStatus(data.transactionId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const pollStatus = async (id: string) => {
    try {
      const response = await fetch(`/api/custom/payments/status-check?transactionId=${id}`)
      if (!response.ok) throw new Error('Failed to check status')

      const data = await response.json()
      setStatus(data.newStatus || data.status)

      if (data.newStatus === 'pending' || data.status === 'pending') {
        setTimeout(() => pollStatus(id), 5000)
      } else {
        setIsPolling(false)
        // Remove transaction ID from URL after verification
        router.push(window.location.pathname)
        
        if (data.newStatus === 'successful' || data.status === 'successful') {
          toast.success('Payment successful! Your subscription has been activated.', {
            duration: 5000,
          })
          router.refresh()
        } else if (data.newStatus === 'failed' || data.status === 'failed') {
          toast.error('Payment failed. Please try again.', {
            duration: 5000,
          })
        }
      }
    } catch (err) {
      console.error(err)
      setError('Error checking status. Retrying...')
      setTimeout(() => pollStatus(id), 5000) // Retry on error
    }
  }

  const verifyTransaction = async (id: string) => {
    setVerifyingTransaction(id)
    try {
      const response = await fetch(`/api/custom/payments/status-check?transactionId=${id}`)
      if (!response.ok) throw new Error('Failed to check status')

      const data = await response.json()

      if (data.updated) {
        toast.success(`Transaction status updated from ${data.oldStatus} to ${data.newStatus}`, {
          duration: 4000,
        })
      } else {
        toast.info(`Transaction status is still ${data.newStatus || data.status}`, {
          duration: 3000,
        })
      }

      if (data.newStatus === 'successful' || data.status === 'successful') {
        // Remove transaction ID from URL if this was the current transaction
        if (transactionId === id) {
          router.push(window.location.pathname)
        }
        router.refresh()
      }
    } catch (err) {
      toast.error(
        'Error verifying transaction: ' + (err instanceof Error ? err.message : 'Unknown error'),
        {
          duration: 4000,
        },
      )
    } finally {
      setVerifyingTransaction(null)
    }
  }

  return (
    <div className="p-6 rounded-xl border bg-white/5 border-white/10">
      <h3 className="mb-4 text-xl font-semibold text-white">Subscription</h3>

      {/* Subscription Status */}
      {hasActiveSubscription ? (
        <div className="mb-6 p-4 rounded-lg bg-emerald-900/20 border border-emerald-500/30">
          <div className="flex items-center mb-2">
            <span className="mr-2 text-emerald-400 text-xl">✓</span>
            <h4 className="font-medium text-emerald-400">Active Subscription</h4>
          </div>
          <p className="text-white/80 text-sm">
            Your {subscription?.plan} subscription is active until{' '}
            {formatDate(subscription?.endDate || '')}
          </p>
        </div>
      ) : (
        <div className="mb-6 p-4 rounded-lg bg-amber-900/20 border border-amber-500/30">
          <div className="flex items-center mb-2">
            <span className="mr-2 text-amber-400 text-xl">!</span>
            <h4 className="font-medium text-amber-400">No Active Subscription</h4>
          </div>
          <p className="text-white/80 text-sm">
            Subscribe now to access all premium features and content.
          </p>
        </div>
      )}

      {/* Subscription Options */}
      <div className="mb-6">
        <h4 className="mb-3 font-medium text-white">Select Subscription Plan</h4>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => setSelectedPlan('monthly')}
            className={`p-3 text-center rounded-lg border transition-all ${
              selectedPlan === 'monthly'
                ? 'bg-indigo-600 border-indigo-400'
                : 'bg-white/5 border-white/10 hover:bg-white/8'
            }`}
          >
            <div className="mb-1 text-lg font-medium">Monthly</div>
            <div className="text-2xl font-bold">{subscriptionData?.monthly || 3000} XAF</div>
            <div className="mt-1 text-xs text-white/60">Billed monthly</div>
          </button>

          <button
            onClick={() => setSelectedPlan('yearly')}
            className={`p-3 text-center rounded-lg border transition-all ${
              selectedPlan === 'yearly'
                ? 'bg-indigo-600 border-indigo-400'
                : 'bg-white/5 border-white/10 hover:bg-white/8'
            }`}
          >
            <div className="mb-1 text-lg font-medium">Yearly</div>
            <div className="text-2xl font-bold">{subscriptionData?.yearly || 30000} XAF</div>
            <div className="mt-1 text-xs text-white/60">Save up to 20%</div>
          </button>
        </div>
      </div>

      {/* Payment Form */}
      <div className="mb-6">
        <h4 className="mb-3 font-medium text-white">Payment Information</h4>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Enter phone number (e.g., 677123456)"
          className="px-3 py-2 mb-3 w-full text-white rounded border bg-white/5 border-white/10"
        />
        <button
          onClick={initiatePayment}
          disabled={isLoading || isPolling}
          className="px-4 py-2 w-full text-white bg-indigo-500 rounded hover:bg-indigo-600 transition-colors"
        >
          {isLoading
            ? 'Initiating...'
            : isPolling
              ? 'Checking status...'
              : `Subscribe Now - ${subscriptionAmount} XAF`}
        </button>
        {error && <p className="mt-2 text-red-500">{error}</p>}
        {transactionId && status && (
          <div className="mt-3 p-3 rounded-lg bg-white/5 border border-white/10">
            <p className="text-sm">
              Transaction ID: <span className="text-indigo-400">{transactionId}</span>
            </p>
            <p className="text-sm">
              Status:{' '}
              <span
                className={`font-medium ${status === 'successful' ? 'text-emerald-400' : status === 'failed' ? 'text-red-400' : 'text-amber-400'}`}
              >
                {status}
              </span>
            </p>
          </div>
        )}
        {isPolling && <p className="mt-2 text-yellow-500">Awaiting payment confirmation...</p>}
      </div>

      {/* Transaction History */}
      {transactions.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-white">Transaction History</h4>
            <button
              onClick={() => setShowTransactions(!showTransactions)}
              className="text-sm text-indigo-400 hover:text-indigo-300"
            >
              {showTransactions ? 'Hide' : 'Show'}
            </button>
          </div>

          {showTransactions && (
            <div className="mt-2 space-y-3 max-h-60 overflow-y-auto">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="p-3 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-medium">{transaction.amount} XAF</p>
                      <p className="text-xs text-white/60">
                        {formatDate(transaction.dateInitiated)}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${transaction.status === 'successful' ? 'bg-emerald-900/30 text-emerald-400' : transaction.status === 'failed' ? 'bg-red-900/30 text-red-400' : 'bg-amber-900/30 text-amber-400'}`}
                    >
                      {transaction.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-white/60">
                      ID: {transaction.transactionId?.substring(0, 10)}...
                    </p>
                    {(transaction.status === 'pending' || transaction.status === 'created') && (
                      <button
                        onClick={() => verifyTransaction(transaction.id)}
                        disabled={verifyingTransaction === transaction.id}
                        className="px-2 py-1 text-xs text-white bg-indigo-500 rounded hover:bg-indigo-600 transition-colors"
                      >
                        {verifyingTransaction === transaction.id ? 'Verifying...' : 'Verify'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

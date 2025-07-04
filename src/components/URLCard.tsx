'use client'

import { useState } from 'react'

interface URLCardProps {
  url: {
    id: number
    url: string
    name: string
    check_interval: number
    is_active: boolean
    last_check: string | null
    last_content_hash: string | null
    created_at: string
    last_check_time: string | null
    last_changes_detected: boolean | null
    last_error: string | null
  }
  onDelete: (id: number) => void
  onToggleActive: (id: number, isActive: boolean) => void
  onManualCheck: (id: number) => void
}

export function URLCard({ url, onDelete, onToggleActive, onManualCheck }: URLCardProps) {
  const [checking, setChecking] = useState(false)

  const handleManualCheck = async () => {
    setChecking(true)
    try {
      await onManualCheck(url.id)
    } finally {
      setChecking(false)
    }
  }

  const getStatusColor = () => {
    if (!url.is_active) return 'glass-card border-2 border-neutral-200'
    if (url.last_error) return 'glass-card border-2 border-red-300 bg-gradient-to-br from-red-50/80 to-pink-50/80'
    if (url.last_changes_detected) return 'glass-card border-2 border-amber-300 bg-gradient-to-br from-amber-50/80 to-orange-50/80'
    if (url.last_check_time) return 'glass-card border-2 border-accent-300 bg-gradient-to-br from-accent-50/80 to-emerald-50/80'
    return 'glass-card border-2 border-primary-300 bg-gradient-to-br from-primary-50/80 to-blue-50/80'
  }

  const getStatusText = () => {
    if (!url.is_active) return 'Inactive'
    if (url.last_error) return 'Error'
    if (url.last_changes_detected) return 'Changes Detected'
    if (url.last_check_time) return 'Monitored'
    return 'Pending First Check'
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className={`rounded-2xl p-6 ${getStatusColor()} shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-[1.02] backdrop-blur-sm group`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-3">
            <div className={`w-3 h-3 rounded-full ${
              url.last_error ? 'bg-red-400 animate-pulse' : 
              url.last_changes_detected ? 'bg-amber-400 animate-pulse' : 
              !url.is_active ? 'bg-neutral-400' :
              'bg-accent-400 animate-pulse-soft'
            }`}></div>
            <h3 className="text-xl font-bold text-neutral-800 group-hover:text-primary-700 transition-colors duration-200 truncate">{url.name}</h3>
          </div>
          <div className="glass-card rounded-lg px-3 py-2 border border-white/40">
            <p className="text-sm text-neutral-600 break-all font-mono">
              {url.url}
            </p>
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold shadow-sm ${
              url.last_error ? 'bg-red-100 text-red-800 border-2 border-red-200' : 
              url.last_changes_detected ? 'bg-amber-100 text-amber-800 border-2 border-amber-200' : 
              !url.is_active ? 'bg-neutral-100 text-neutral-800 border-2 border-neutral-200' :
              'bg-accent-100 text-accent-800 border-2 border-accent-200'
            }`}>
              {getStatusText()}
            </span>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => onToggleActive(url.id, !url.is_active)}
              className={`p-2.5 rounded-xl font-medium transition-all duration-200 hover:scale-110 ${
                url.is_active 
                  ? 'glass-card hover:bg-red-100 text-red-700 border border-red-200 hover:border-red-300' 
                  : 'glass-card hover:bg-accent-100 text-accent-700 border border-accent-200 hover:border-accent-300'
              }`}
              title={url.is_active ? 'Pause monitoring' : 'Resume monitoring'}
            >
              {url.is_active ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            <button
              onClick={() => onDelete(url.id)}
              className="p-2.5 rounded-xl font-medium glass-card hover:bg-red-100 text-red-700 border border-red-200 hover:border-red-300 transition-all duration-200 hover:scale-110"
              title="Delete URL"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414L7.586 12l-1.293 1.293a1 1 0 101.414 1.414L9 13.414l2.293 2.293a1 1 0 001.414-1.414L11.414 12l1.293-1.293z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-4 text-sm">
        <div className="glass-card rounded-xl p-4 border border-white/40">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600 mb-1">{url.check_interval}m</div>
              <div className="text-neutral-500 font-medium">Interval</div>
            </div>
            <div className="text-center">
              <div className="text-xs font-semibold text-neutral-800 mb-1">{formatDate(url.last_check_time)}</div>
              <div className="text-neutral-500 font-medium">Last Check</div>
            </div>
          </div>
        </div>

        {url.last_error && (
          <div className="glass-card bg-red-50/80 border border-red-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-red-800 mb-1">Error</h4>
                <p className="text-red-700 text-sm">{url.last_error}</p>
              </div>
            </div>
          </div>
        )}

        {url.last_content_hash && (
          <div className="glass-card rounded-xl p-4 border border-white/40">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-neutral-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-xs text-neutral-500 font-medium">Content Hash</div>
                <div className="font-mono text-sm text-neutral-800 font-semibold">
                  {url.last_content_hash.substring(0, 12)}...
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-8 flex gap-3">
        <button
          onClick={handleManualCheck}
          disabled={checking || !url.is_active}
          className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <span className="flex items-center justify-center space-x-2">
            <svg className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            <span>{checking ? 'Checking...' : 'Check Now'}</span>
          </span>
        </button>
        <a
          href={url.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 btn-secondary flex items-center justify-center space-x-2"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
          </svg>
          <span>Visit Site</span>
        </a>
      </div>
    </div>
  )
}
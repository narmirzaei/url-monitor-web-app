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
    if (!url.is_active) return 'bg-gray-100 border-gray-300'
    if (url.last_error) return 'bg-red-50 border-red-300'
    if (url.last_changes_detected) return 'bg-yellow-50 border-yellow-300'
    if (url.last_check_time) return 'bg-green-50 border-green-300'
    return 'bg-blue-50 border-blue-300'
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
    <div className={`border-2 rounded-lg p-6 ${getStatusColor()}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">{url.name}</h3>
          <p className="text-sm text-gray-600 break-all">{url.url}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onToggleActive(url.id, !url.is_active)}
            className={`px-3 py-1 rounded text-sm ${
              url.is_active 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {url.is_active ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={() => onDelete(url.id)}
            className="px-3 py-1 rounded text-sm bg-red-500 hover:bg-red-600 text-white"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Status:</span>
          <span className={`font-medium ${
            url.last_error ? 'text-red-600' : 
            url.last_changes_detected ? 'text-yellow-600' : 
            'text-green-600'
          }`}>
            {getStatusText()}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Check Interval:</span>
          <span>{url.check_interval} minutes</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Last Check:</span>
          <span>{formatDate(url.last_check_time)}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Created:</span>
          <span>{formatDate(url.created_at)}</span>
        </div>

        {url.last_error && (
          <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded">
            <p className="text-red-700 text-xs">{url.last_error}</p>
          </div>
        )}

        {url.last_content_hash && (
          <div className="flex justify-between">
            <span className="text-gray-600">Content Hash:</span>
            <span className="font-mono text-xs">
              {url.last_content_hash.substring(0, 8)}...
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={handleManualCheck}
          disabled={checking || !url.is_active}
          className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded text-sm"
        >
          {checking ? 'Checking...' : 'Check Now'}
        </button>
        <a
          href={url.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm text-center"
        >
          Visit Site
        </a>
      </div>
    </div>
  )
}
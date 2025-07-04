'use client'

import { useState, useEffect } from 'react'
import { URLCard } from './URLCard'
import { AddURLForm } from './AddURLForm'

interface MonitoredURL {
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

export function Dashboard() {
  const [urls, setUrls] = useState<MonitoredURL[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [checkingAll, setCheckingAll] = useState(false)

  const fetchUrls = async () => {
    try {
      setError(null)
      const response = await fetch('/api/urls')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setUrls(data.urls || [])
    } catch (error) {
      console.error('Error fetching URLs:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch URLs')
      setUrls([]) // Ensure urls is always an array
    } finally {
      setLoading(false)
    }
  }

  const handleAddURL = async (urlData: { url: string; name: string; checkInterval: number }) => {
    try {
      const response = await fetch('/api/urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(urlData)
      })

      if (response.ok) {
        setShowAddForm(false)
        fetchUrls()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add URL')
      }
    } catch (error) {
      console.error('Error adding URL:', error)
      setError(error instanceof Error ? error.message : 'Failed to add URL')
    }
  }

  const handleCheckAll = async () => {
    setCheckingAll(true)
    try {
      const response = await fetch('/api/monitor/check-all', {
        method: 'POST'
      })
      
      if (response.ok) {
        await fetchUrls()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to check URLs')
      }
    } catch (error) {
      console.error('Error checking all URLs:', error)
      setError(error instanceof Error ? error.message : 'Failed to check URLs')
    } finally {
      setCheckingAll(false)
    }
  }

  const handleDeleteURL = async (id: number) => {
    try {
      const response = await fetch(`/api/urls/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchUrls()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete URL')
      }
    } catch (error) {
      console.error('Error deleting URL:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete URL')
    }
  }

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      const url = urls.find(u => u.id === id)
      if (!url) return

      const response = await fetch(`/api/urls/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...url,
          is_active: isActive
        })
      })

      if (response.ok) {
        fetchUrls()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to toggle URL')
      }
    } catch (error) {
      console.error('Error toggling URL:', error)
      setError(error instanceof Error ? error.message : 'Failed to toggle URL')
    }
  }

  const handleManualCheck = async (id: number) => {
    try {
      const response = await fetch('/api/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urlId: id })
      })

      if (response.ok) {
        fetchUrls()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to check URL')
      }
    } catch (error) {
      console.error('Error checking URL:', error)
      setError(error instanceof Error ? error.message : 'Failed to check URL')
    }
  }

  useEffect(() => {
    fetchUrls()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">URL Monitor Dashboard</h1>
        </div>
        
        <div className="bg-red-50 border border-red-300 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Configuration Error</h2>
          <p className="text-red-700 mb-4">{error}</p>
          
          <div className="bg-red-100 rounded p-4 mb-4">
            <h3 className="font-semibold text-red-800 mb-2">Setup Required:</h3>
            <ol className="list-decimal list-inside text-red-700 space-y-1">
              <li>Add PostgreSQL database in Vercel dashboard</li>
              <li>Environment variables should be automatically configured</li>
              <li>Refresh this page after setup</li>
            </ol>
          </div>
          
          <button
            onClick={fetchUrls}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">URL Monitor Dashboard</h1>
        <div className="flex gap-4">
          <button
            onClick={handleCheckAll}
            disabled={checkingAll}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg"
          >
            {checkingAll ? 'Checking...' : 'Check All'}
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
          >
            Add URL
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {urls.map(url => (
          <URLCard
            key={url.id}
            url={url}
            onDelete={handleDeleteURL}
            onToggleActive={handleToggleActive}
            onManualCheck={handleManualCheck}
          />
        ))}
      </div>

      {urls.length === 0 && !error && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No URLs being monitored yet.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg"
          >
            Add Your First URL
          </button>
        </div>
      )}

      {showAddForm && (
        <AddURLForm
          onSubmit={handleAddURL}
          onCancel={() => setShowAddForm(false)}
        />
      )}
    </div>
  )
}
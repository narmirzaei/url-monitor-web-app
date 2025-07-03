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
  const [showAddForm, setShowAddForm] = useState(false)
  const [checkingAll, setCheckingAll] = useState(false)

  const fetchUrls = async () => {
    try {
      const response = await fetch('/api/urls')
      const data = await response.json()
      setUrls(data.urls)
    } catch (error) {
      console.error('Error fetching URLs:', error)
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
      }
    } catch (error) {
      console.error('Error adding URL:', error)
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
      }
    } catch (error) {
      console.error('Error checking all URLs:', error)
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
      }
    } catch (error) {
      console.error('Error deleting URL:', error)
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
      }
    } catch (error) {
      console.error('Error toggling URL:', error)
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
      }
    } catch (error) {
      console.error('Error checking URL:', error)
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

      {urls.length === 0 && (
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
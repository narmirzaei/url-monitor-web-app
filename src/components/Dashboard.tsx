'use client'

import { useState, useEffect } from 'react'
import { URLCard } from './URLCard'
import { AddURLForm } from './AddURLForm'
import { authenticatedFetch } from '@/lib/api'

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

interface DashboardProps {
  onLogout?: () => void
}

export function Dashboard({ onLogout }: DashboardProps) {
  const [urls, setUrls] = useState<MonitoredURL[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [checkingAll, setCheckingAll] = useState(false)

  const fetchUrls = async () => {
    try {
      setError(null)
      const response = await authenticatedFetch('/api/urls')
      
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
      setUrls([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddURL = async (urlData: { url: string; name: string; checkInterval: number }) => {
    try {
      const response = await authenticatedFetch('/api/urls', {
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
      const response = await authenticatedFetch('/api/monitor/check-all', {
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
      const response = await authenticatedFetch(`/api/urls/${id}`, {
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

      const response = await authenticatedFetch(`/api/urls/${id}`, {
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
      const response = await authenticatedFetch('/api/monitor', {
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card-solid rounded-2xl p-12 text-center animate-fade-in">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-soft">
            <svg className="w-8 h-8 text-white animate-spin" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gradient mb-3">Loading Dashboard</h3>
          <p className="text-neutral-600">Fetching your monitored URLs...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen px-8 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="glass-card-solid rounded-3xl p-12 text-center mb-8 animate-fade-in">
            <h1 className="text-5xl font-bold text-gradient mb-4">
              URL Monitor Dashboard
            </h1>
            <p className="text-xl text-neutral-600">
              Monitor websites for content changes and receive instant notifications
            </p>
          </div>
          
          {/* Error Card */}
          <div className="glass-card rounded-3xl p-12 border-2 border-red-300 bg-gradient-to-br from-red-50 to-pink-50">
            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-pink-400 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-red-800 mb-4">Configuration Error</h2>
                <p className="text-red-700 mb-8 text-lg">{error}</p>
                
                <div className="glass-card rounded-xl p-6 mb-8 border border-red-200">
                  <h3 className="font-bold text-red-800 mb-4 flex items-center text-lg">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                    Quick Setup Guide:
                  </h3>
                  <ol className="list-decimal list-inside text-red-700 space-y-3 ml-7">
                    <li>Go to your <strong>Vercel Dashboard</strong></li>
                    <li>Navigate to the <strong>Storage</strong> tab</li>
                    <li>Add <strong>PostgreSQL</strong> database</li>
                    <li>Environment variables will be <strong>automatically configured</strong></li>
                    <li>Refresh this page after setup</li>
                  </ol>
                </div>
                
                <button
                  onClick={fetchUrls}
                  className="btn-primary inline-flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  <span>Retry Connection</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-8 py-12">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="glass-card-solid rounded-3xl p-12 text-center animate-fade-in">
          <div className="flex items-center justify-center mb-8">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-2xl flex items-center justify-center animate-float">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div className="absolute -inset-2 bg-gradient-to-r from-primary-400 to-secondary-500 rounded-2xl blur-lg opacity-30 animate-pulse-soft"></div>
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gradient mb-4">
            URL Monitor Dashboard
          </h1>
          <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto">
            Monitor websites for content changes and receive instant notifications when something important happens.
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="glass-card rounded-xl p-6">
              <div className="text-3xl font-bold text-primary-600 mb-2">{urls.length}</div>
              <div className="text-neutral-600 font-medium">Monitored URLs</div>
            </div>
            <div className="glass-card rounded-xl p-6">
              <div className="text-3xl font-bold text-accent-600 mb-2">{urls.filter(u => u.is_active).length}</div>
              <div className="text-neutral-600 font-medium">Active Monitors</div>
            </div>
            <div className="glass-card rounded-xl p-6">
              <div className="text-3xl font-bold text-secondary-600 mb-2">{urls.filter(u => u.last_changes_detected).length}</div>
              <div className="text-neutral-600 font-medium">Recent Changes</div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleCheckAll}
              disabled={checkingAll}
              className="btn-primary inline-flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className={`w-5 h-5 ${checkingAll ? 'animate-spin' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              <span>{checkingAll ? 'Checking All URLs...' : 'Check All URLs'}</span>
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-accent inline-flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span>Add New URL</span>
            </button>
            {onLogout && (
              <button
                onClick={onLogout}
                className="btn-secondary inline-flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                </svg>
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* URLs Grid */}
      {urls.length > 0 && (
        <div className="max-w-7xl mx-auto mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gradient">Your Monitored URLs</h2>
            <div className="text-neutral-500">
              {urls.filter(u => u.is_active).length} of {urls.length} active
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {urls.map((url, index) => (
              <div key={url.id} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                <URLCard
                  url={url}
                  onDelete={handleDeleteURL}
                  onToggleActive={handleToggleActive}
                  onManualCheck={handleManualCheck}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {urls.length === 0 && !error && (
        <div className="max-w-2xl mx-auto">
          <div className="glass-card-solid rounded-3xl p-16 text-center animate-fade-in">
            <div className="relative mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center mx-auto animate-bounce-soft">
                <svg className="w-16 h-16 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="absolute -inset-4 bg-gradient-to-r from-primary-300 to-secondary-300 rounded-full blur-2xl opacity-20 animate-pulse-soft"></div>
            </div>
            <h3 className="text-4xl font-bold text-gradient mb-4">Start Monitoring</h3>
            <p className="text-xl text-neutral-600 mb-8 leading-relaxed">
              Add your first website to begin monitoring for content changes. Get instant notifications when something important happens.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-secondary inline-flex items-center space-x-3 text-lg px-8 py-4"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span>Add Your First URL</span>
            </button>
          </div>
        </div>
      )}

      {/* Add URL Form Modal */}
      {showAddForm && (
        <AddURLForm
          onSubmit={handleAddURL}
          onCancel={() => setShowAddForm(false)}
        />
      )}
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'

interface LogEntry {
  id: number
  url_id: number
  content_hash: string
  content_preview: string
  changes_detected: boolean
  check_time: string
  error_message: string | null
  url_name: string
  url: string
  email_sent: boolean | null
  email_sent_at: string | null
  changes_summary: string | null
}

export function LogsView() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'changes' | 'errors'>('all')

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/logs')
      const data = await response.json()
      setLogs(data.logs)
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const filteredLogs = logs.filter(log => {
    if (filter === 'changes') return log.changes_detected
    if (filter === 'errors') return log.error_message
    return true
  })

  const getLogTypeColor = (log: LogEntry) => {
    if (log.error_message) return 'border-red-300 bg-red-50'
    if (log.changes_detected) return 'border-yellow-300 bg-yellow-50'
    return 'border-green-300 bg-green-50'
  }

  const getLogTypeIcon = (log: LogEntry) => {
    if (log.error_message) return '❌'
    if (log.changes_detected) return '⚠️'
    return '✅'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card-solid rounded-2xl p-12 text-center animate-fade-in">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-soft">
            <svg className="w-8 h-8 text-white animate-spin" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gradient mb-3">Loading Logs</h3>
          <p className="text-neutral-600">Fetching monitoring activity...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-8 py-12">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="glass-card-solid rounded-3xl p-12 animate-fade-in">
          <div className="text-center mb-8">
            <div className="relative mx-auto mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-2xl flex items-center justify-center mx-auto animate-float">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="absolute -inset-2 bg-gradient-to-r from-primary-400 to-secondary-500 rounded-2xl blur-lg opacity-30 animate-pulse-soft"></div>
            </div>
            <h2 className="text-5xl font-bold text-gradient mb-4">
              Monitoring Logs
            </h2>
            <p className="text-xl text-neutral-600 mb-8">
              Track all monitoring activities and detected changes across your websites
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                filter === 'all' 
                  ? 'btn-primary' 
                  : 'glass-card text-neutral-700 hover:bg-white/80 border border-neutral-200 hover:border-primary-300'
              }`}
            >
              <span className="flex items-center space-x-2">
                <span>All</span>
                <span className="bg-neutral-200 text-neutral-700 px-2 py-1 rounded-lg text-xs font-bold">{logs.length}</span>
              </span>
            </button>
            <button
              onClick={() => setFilter('changes')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                filter === 'changes' 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1' 
                  : 'glass-card text-neutral-700 hover:bg-white/80 border border-neutral-200 hover:border-amber-300'
              }`}
            >
              <span className="flex items-center space-x-2">
                <span>Changes</span>
                <span className="bg-neutral-200 text-neutral-700 px-2 py-1 rounded-lg text-xs font-bold">{logs.filter(l => l.changes_detected).length}</span>
              </span>
            </button>
            <button
              onClick={() => setFilter('errors')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                filter === 'errors' 
                  ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1' 
                  : 'glass-card text-neutral-700 hover:bg-white/80 border border-neutral-200 hover:border-red-300'
              }`}
            >
              <span className="flex items-center space-x-2">
                <span>Errors</span>
                <span className="bg-neutral-200 text-neutral-700 px-2 py-1 rounded-lg text-xs font-bold">{logs.filter(l => l.error_message).length}</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Logs */}
      <div className="max-w-7xl mx-auto">
        {filteredLogs.length === 0 ? (
          <div className="glass-card-solid rounded-3xl p-16 text-center animate-fade-in">
            <div className="relative mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-neutral-100 to-slate-100 rounded-full flex items-center justify-center mx-auto animate-bounce-soft">
                <svg className="w-12 h-12 text-neutral-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="absolute -inset-4 bg-gradient-to-r from-neutral-300 to-slate-300 rounded-full blur-2xl opacity-20 animate-pulse-soft"></div>
            </div>
            <h3 className="text-3xl font-bold text-gradient mb-4">No Logs Found</h3>
            <p className="text-xl text-neutral-600">
              No monitoring activities found for the selected filter.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
          {filteredLogs.map((log, index) => (
            <div key={log.id} className={`glass-card-solid rounded-2xl p-8 ${getLogTypeColor(log)} shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-slide-up`} style={{ animationDelay: `${index * 100}ms` }}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{getLogTypeIcon(log)}</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-800">{log.url_name}</h3>
                      <span className="text-sm text-gray-500 bg-white/60 backdrop-blur-sm rounded-lg px-2 py-1">
                        {new Date(log.check_time).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  {/* URL */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 break-all bg-white/60 backdrop-blur-sm rounded-lg px-3 py-2 border">
                      {log.url}
                    </p>
                  </div>
                  
                  {/* Error Message */}
                  {log.error_message && (
                    <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                      <div className="flex items-start space-x-2">
                        <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <p className="text-red-700 font-medium">{log.error_message}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Changes Detected */}
                  {log.changes_detected && log.changes_summary && (
                    <div className="mb-4 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
                      <div className="flex items-start space-x-2">
                        <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-amber-800 font-medium">{log.changes_summary}</p>
                          {log.email_sent && (
                            <div className="mt-2 flex items-center space-x-2 text-amber-700">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                              </svg>
                              <span className="text-sm">
                                Email sent at {new Date(log.email_sent_at!).toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Content Preview */}
                  {log.content_preview && (
                    <div className="mt-4">
                      <details className="group">
                        <summary className="cursor-pointer text-purple-600 hover:text-purple-800 font-medium flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-lg px-3 py-2 border transition-all duration-200 hover:bg-white/80">
                          <svg className="w-4 h-4 transform group-open:rotate-90 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>Content Preview</span>
                        </summary>
                        <div className="mt-3 p-4 bg-gray-50 border-2 border-gray-200 rounded-xl font-mono text-xs overflow-x-auto">
                          {log.content_preview}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
                
                {/* Metadata */}
                <div className="text-right text-sm text-gray-500 bg-white/60 backdrop-blur-sm rounded-lg p-3 border">
                  <p className="font-medium">Check #{log.id}</p>
                  <p className="font-mono text-xs">
                    {log.content_hash.substring(0, 8)}...
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}

        {/* Refresh Button */}
        <div className="text-center mt-12">
          <button
            onClick={fetchLogs}
            className="btn-secondary inline-flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            <span>Refresh Logs</span>
          </button>
        </div>
      </div>
    </div>
  )
}
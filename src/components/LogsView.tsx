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
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading logs...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Monitoring Logs</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded ${
              filter === 'all' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All ({logs.length})
          </button>
          <button
            onClick={() => setFilter('changes')}
            className={`px-4 py-2 rounded ${
              filter === 'changes' 
                ? 'bg-yellow-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Changes ({logs.filter(l => l.changes_detected).length})
          </button>
          <button
            onClick={() => setFilter('errors')}
            className={`px-4 py-2 rounded ${
              filter === 'errors' 
                ? 'bg-red-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Errors ({logs.filter(l => l.error_message).length})
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No logs found for the selected filter.
          </div>
        ) : (
          filteredLogs.map(log => (
            <div key={log.id} className={`border-2 rounded-lg p-4 ${getLogTypeColor(log)}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{getLogTypeIcon(log)}</span>
                    <h3 className="font-semibold">{log.url_name}</h3>
                    <span className="text-sm text-gray-500">
                      {new Date(log.check_time).toLocaleString()}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2 break-all">{log.url}</p>
                  
                  {log.error_message && (
                    <div className="mb-2 p-2 bg-red-100 border border-red-300 rounded">
                      <p className="text-red-700 text-sm">{log.error_message}</p>
                    </div>
                  )}
                  
                  {log.changes_detected && log.changes_summary && (
                    <div className="mb-2 p-2 bg-yellow-100 border border-yellow-300 rounded">
                      <p className="text-yellow-800 text-sm">{log.changes_summary}</p>
                      {log.email_sent && (
                        <p className="text-yellow-700 text-xs mt-1">
                          📧 Email sent at {new Date(log.email_sent_at!).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {log.content_preview && (
                    <div className="mt-2">
                      <details className="text-sm">
                        <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                          Content Preview
                        </summary>
                        <div className="mt-2 p-3 bg-gray-100 rounded font-mono text-xs overflow-x-auto">
                          {log.content_preview}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
                
                <div className="text-right text-sm text-gray-500">
                  <p>Check ID: {log.id}</p>
                  <p>Hash: {log.content_hash.substring(0, 8)}...</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="text-center">
        <button
          onClick={fetchLogs}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Refresh Logs
        </button>
      </div>
    </div>
  )
}
'use client'

import { useState } from 'react'

interface AddURLFormProps {
  onSubmit: (urlData: { url: string; name: string; checkInterval: number }) => void
  onCancel: () => void
}

export function AddURLForm({ onSubmit, onCancel }: AddURLFormProps) {
  const [formData, setFormData] = useState({
    url: '',
    name: '',
    checkInterval: 60
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit(formData)
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'checkInterval' ? parseInt(value) || 60 : value
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="glass-card-solid rounded-3xl shadow-2xl border border-white/30 p-10 w-full max-w-lg transform transition-all duration-300 animate-slide-up">
        <div className="text-center mb-8">
          <div className="relative mx-auto mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-2xl flex items-center justify-center mx-auto animate-bounce-soft">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="absolute -inset-2 bg-gradient-to-r from-primary-400 to-secondary-500 rounded-2xl blur-lg opacity-30 animate-pulse-soft"></div>
          </div>
          <h2 className="text-3xl font-bold text-gradient mb-2">
            Add New URL
          </h2>
          <p className="text-neutral-600">
            Start monitoring a new website for content changes
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label htmlFor="name" className="block text-sm font-bold text-neutral-700 mb-3 flex items-center space-x-2">
              <svg className="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
              <span>Display Name</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input-field focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., Company Blog, News Site"
              required
            />
          </div>

          <div>
            <label htmlFor="url" className="block text-sm font-bold text-neutral-700 mb-3 flex items-center space-x-2">
              <svg className="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
              </svg>
              <span>Website URL</span>
            </label>
            <input
              type="url"
              id="url"
              name="url"
              value={formData.url}
              onChange={handleChange}
              className="input-field focus:ring-primary-500 focus:border-primary-500"
              placeholder="https://example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="checkInterval" className="block text-sm font-bold text-neutral-700 mb-3 flex items-center space-x-2">
              <svg className="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span>Check Interval</span>
            </label>
            <div className="relative">
              <input
                type="number"
                id="checkInterval"
                name="checkInterval"
                value={formData.checkInterval}
                onChange={handleChange}
                min="1"
                max="1440"
                className="input-field focus:ring-primary-500 focus:border-primary-500 pr-20"
                required
              />
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-500 text-sm font-bold">
                minutes
              </span>
            </div>
            <div className="mt-3 glass-card rounded-lg p-3 border border-primary-200">
              <p className="text-sm text-primary-700 flex items-start space-x-2">
                <svg className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>How often to check for changes (1-1440 minutes). Recommended: 60 minutes for most sites.</span>
              </p>
            </div>
          </div>

          <div className="flex gap-4 pt-8">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-4 glass-card border-2 border-neutral-200 rounded-xl text-neutral-700 hover:bg-neutral-50 font-semibold transition-all duration-200 hover:border-neutral-300 hover:scale-105"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 btn-secondary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <span className="flex items-center justify-center space-x-2">
                {submitting ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    <span>Adding URL...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    <span>Add URL</span>
                  </>
                )}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
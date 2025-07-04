// Simple diff utility for content comparison
export function generateContentDiff(oldContent: string, newContent: string): string {
  if (!oldContent || !newContent) {
    return 'Unable to generate diff - missing content data'
  }

  // Split content into lines for better diff visualization
  const oldLines = oldContent.split('\n')
  const newLines = newContent.split('\n')
  
  let diff = ''
  let addedLines = 0
  let removedLines = 0
  
  // Simple line-by-line comparison
  const maxLines = Math.max(oldLines.length, newLines.length)
  
  for (let i = 0; i < maxLines; i++) {
    const oldLine = oldLines[i] || ''
    const newLine = newLines[i] || ''
    
    if (oldLine !== newLine) {
      if (oldLine && !newLine) {
        // Line was removed
        diff += `- ${oldLine}\n`
        removedLines++
      } else if (!oldLine && newLine) {
        // Line was added
        diff += `+ ${newLine}\n`
        addedLines++
      } else {
        // Line was modified
        diff += `- ${oldLine}\n`
        diff += `+ ${newLine}\n`
        removedLines++
        addedLines++
      }
    } else {
      // Lines are the same
      diff += `  ${oldLine}\n`
    }
  }
  
  // Add summary
  const summary = `\n--- DIFF SUMMARY ---\n`
  const summaryDetails = `Added: ${addedLines} lines | Removed: ${removedLines} lines | Total changes: ${addedLines + removedLines} lines\n`
  
  return summary + summaryDetails + '\n--- CONTENT DIFF ---\n' + diff
}

// Generate a more readable diff for email
export function generateEmailDiff(oldContent: string, newContent: string): {
  summary: string
  diff: string
  hasChanges: boolean
} {
  if (!oldContent || !newContent) {
    return {
      summary: 'Unable to generate diff - missing content data',
      diff: '',
      hasChanges: false
    }
  }

  // Clean and normalize content
  const cleanOld = oldContent.trim().replace(/\s+/g, ' ')
  const cleanNew = newContent.trim().replace(/\s+/g, ' ')
  
  if (cleanOld === cleanNew) {
    return {
      summary: 'No text content changes detected (may be formatting or whitespace changes)',
      diff: '',
      hasChanges: false
    }
  }

  // Split into words for better granularity
  const oldWords = cleanOld.split(' ')
  const newWords = cleanNew.split(' ')
  
  let diff = ''
  let addedWords = 0
  let removedWords = 0
  
  // Find common prefix and suffix
  let commonPrefix = 0
  let commonSuffix = 0
  
  // Find common prefix
  while (commonPrefix < oldWords.length && commonPrefix < newWords.length && 
         oldWords[commonPrefix] === newWords[commonPrefix]) {
    commonPrefix++
  }
  
  // Find common suffix
  while (commonSuffix < oldWords.length - commonPrefix && commonSuffix < newWords.length - commonPrefix &&
         oldWords[oldWords.length - 1 - commonSuffix] === newWords[newWords.length - 1 - commonSuffix]) {
    commonSuffix++
  }
  
  // Build diff
  if (commonPrefix > 0) {
    diff += `... ${oldWords.slice(0, commonPrefix).join(' ')} ...\n\n`
  }
  
  // Show removed words
  if (commonPrefix < oldWords.length - commonSuffix) {
    const removed = oldWords.slice(commonPrefix, oldWords.length - commonSuffix)
    diff += `❌ REMOVED: ${removed.join(' ')}\n\n`
    removedWords += removed.length
  }
  
  // Show added words
  if (commonPrefix < newWords.length - commonSuffix) {
    const added = newWords.slice(commonPrefix, newWords.length - commonSuffix)
    diff += `✅ ADDED: ${added.join(' ')}\n\n`
    addedWords += added.length
  }
  
  if (commonSuffix > 0) {
    diff += `... ${oldWords.slice(oldWords.length - commonSuffix).join(' ')} ...\n`
  }
  
  const summary = `Content changes detected: ${addedWords} words added, ${removedWords} words removed`
  
  return {
    summary,
    diff: diff.trim(),
    hasChanges: true
  }
}

// Generate a simple character-level diff for short content
export function generateSimpleDiff(oldContent: string, newContent: string): string {
  if (!oldContent || !newContent) {
    return 'No content available for comparison'
  }
  
  // For very long content, show just the first and last parts
  const maxLength = 1000
  let diff = ''
  
  if (oldContent.length > maxLength || newContent.length > maxLength) {
    diff += `Content is very long (${oldContent.length} → ${newContent.length} characters)\n\n`
    
    // Show first 200 characters
    diff += `📄 OLD (first 200 chars):\n${oldContent.substring(0, 200)}...\n\n`
    diff += `📄 NEW (first 200 chars):\n${newContent.substring(0, 200)}...\n\n`
    
    // Show last 200 characters if different
    const oldEnd = oldContent.substring(oldContent.length - 200)
    const newEnd = newContent.substring(newContent.length - 200)
    
    if (oldEnd !== newEnd) {
      diff += `📄 OLD (last 200 chars):\n...${oldEnd}\n\n`
      diff += `📄 NEW (last 200 chars):\n...${newEnd}\n`
    }
  } else {
    // For shorter content, show full comparison
    diff += `📄 OLD CONTENT:\n${oldContent}\n\n`
    diff += `📄 NEW CONTENT:\n${newContent}\n`
  }
  
  return diff
} 
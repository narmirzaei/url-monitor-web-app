# URL Monitor Daemon - Technical Specification

## Overview

URL Monitor Daemon is a professional Node.js application that monitors web pages for content changes and sends intelligent email notifications when changes are detected. It uses headless browser technology for reliable monitoring of JavaScript-heavy websites and provides comprehensive process management capabilities.

## Architecture

### Core Components

1. **Main Daemon Process** (`index.js`) - Central monitoring orchestrator
2. **Process Manager** (`process-manager.js`) - Daemon lifecycle management
3. **Control Interface** (`control.js`) - Interactive command system
4. **URL Monitor** (`lib/urlMonitor.js`) - Content fetching and change detection
5. **Email Sender** (`lib/emailSender.js`) - Notification system
6. **Config Loader** (`lib/configLoader.js`) - Configuration management

### System Design

- **Event-driven architecture** with independent timers per URL
- **Headless browser monitoring** using Puppeteer for JavaScript-rendered content
- **Process isolation** with background daemon execution
- **File-based communication** for control commands and status updates
- **Stateful monitoring** with persistent content hash storage

## Features and Capabilities

### 1. Intelligent Content Monitoring

#### Headless Browser Technology
- **Puppeteer-based rendering** - Executes JavaScript and renders dynamic content
- **Cookie popup dismissal** - Automatically clicks "Accept", "Agree", "OK" buttons
- **Content stabilization** - Waits for dynamic content to load and settle
- **Realistic browser simulation** - Uses proper user agent and viewport settings

#### Content Processing
- **Smart content filtering** - Removes ads, banners, scripts, and dynamic elements
- **Main content extraction** - Focuses on `<main>`, `<article>`, and content areas
- **Hash-based change detection** - Uses SHA-256 for reliable content comparison
- **Diff analysis** - Line-by-line comparison of content changes

#### Change Detection Features
- **First-run baseline** - Establishes initial content hash without false positives
- **Significant change filtering** - Ignores minor/cosmetic changes
- **Content persistence** - Stores both hash and full content for comparison
- **Change categorization** - Identifies added vs removed content sections

### 2. Professional Process Management

#### Daemon Lifecycle
- **Background execution** - Runs as detached process with PID tracking
- **Graceful shutdown** - Handles SIGTERM/SIGINT with proper cleanup
- **Resource management** - Closes browser instances and cleans up files
- **Orphan detection** - Finds and manages orphaned processes

#### Process Operations
- **Start/Stop/Restart** - Standard daemon operations via npm scripts
- **Status monitoring** - Real-time daemon health and statistics
- **Log management** - Centralized logging to `daemon.log`
- **PID file management** - Prevents duplicate instances

### 3. Interactive Control System

#### Real-time Commands
- **Pause/Resume URLs** - Temporarily stop monitoring specific URLs
- **Manual checks** - Trigger immediate checks outside schedule
- **Status queries** - Real-time daemon and URL status information
- **Statistics display** - Uptime, check counts, and performance metrics

#### Control Interface Features
- **Command queueing** - File-based command communication
- **Status persistence** - JSON-based status file updates
- **URL management** - Individual control over each monitored URL
- **Help system** - Built-in documentation and examples

### 4. Advanced Email Notifications

#### Rich HTML Notifications
- **Professional styling** - Clean, responsive HTML email templates
- **Change summaries** - Intelligent categorization of content changes
- **Color-coded diffs** - Green for added content, red for removed content
- **Content previews** - Truncated snippets of actual changed content

#### Email Features
- **SendGrid integration** - Professional email delivery service
- **Custom branding** - Configurable sender name and email
- **Change quantification** - Counts of added/removed sections
- **Timestamp tracking** - Precise detection time information

### 5. Configuration Management

#### Flexible URL Configuration
- **Multiple URL support** - Unlimited URLs with unique identifiers
- **Individual intervals** - Per-URL check frequency in minutes
- **Dynamic loading** - Runtime configuration validation
- **Error handling** - Comprehensive validation and error reporting

#### Environment-based Configuration
- **`.env` file format** - Simple key-value configuration
- **Required field validation** - Ensures all necessary settings are present
- **URL format validation** - Validates URL syntax and accessibility
- **Interval validation** - Ensures positive integer intervals

## Technical Implementation

### Browser Automation
```javascript
// Puppeteer configuration with security and performance options
const browser = await puppeteer.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-web-security'
  ]
});
```

### Content Extraction Strategy
1. **Navigate to URL** with `networkidle2` wait condition
2. **Initial content load** with 2-second stabilization
3. **Cookie popup dismissal** using comprehensive selectors
4. **Final stabilization** with 3-second wait
5. **Content filtering** removing dynamic elements
6. **Main content extraction** with fallback hierarchy

### Change Detection Algorithm
1. **Fetch current content** using browser automation
2. **Generate SHA-256 hash** of cleaned content
3. **Compare with stored hash** from previous check
4. **If different, generate diff** showing added/removed content
5. **Save new hash and content** for next comparison
6. **Send notification** with detailed change information

### Process Communication
- **Status file** (`daemon-status.json`) - Real-time daemon state
- **Command file** (`daemon-commands.json`) - Control command queue
- **PID file** (`daemon.pid`) - Process identification
- **Log file** (`daemon.log`) - Comprehensive activity logging

## Data Storage

### File Structure
```
project/
├── data/
│   ├── URL_001-hash.txt      # Content hash for URL_001
│   ├── URL_001-content.txt   # Full content for URL_001
│   ├── URL_002-hash.txt      # Content hash for URL_002
│   └── URL_002-content.txt   # Full content for URL_002
├── daemon-status.json        # Real-time daemon status
├── daemon-commands.json      # Command queue
├── daemon.pid               # Process ID file
├── daemon.log               # Activity log
└── .env                     # Configuration file
```

### Status Information
- **Daemon state** - Running status, PID, start time, uptime
- **URL details** - Individual URL status, last check, next check
- **Statistics** - Total checks, changes detected, emails sent
- **Performance metrics** - Active URLs, paused URLs, error counts

## Security Considerations

### Browser Security
- **Sandboxed execution** - Browser runs with restricted permissions
- **Disabled features** - Web security and extensions disabled for headless operation
- **Resource limits** - Proper cleanup and resource management
- **Timeout protection** - 30-second navigation timeout

### Configuration Security
- **API key protection** - SendGrid API key in environment variables
- **Input validation** - URL format and interval validation
- **Error handling** - Graceful failure without exposing sensitive information
- **File permissions** - Proper file system access controls

## Performance Characteristics

### Resource Usage
- **Memory efficient** - Single browser instance shared across URLs
- **CPU optimized** - Independent timers prevent overlap
- **Disk minimal** - Only stores hashes and essential content
- **Network respectful** - Configurable intervals prevent excessive requests

### Scalability
- **Multiple URLs** - Unlimited URL monitoring capability
- **Configurable intervals** - From 1 minute to 24+ hours
- **Concurrent monitoring** - Independent timers for each URL
- **Resource cleanup** - Proper browser and file handle management

## Dependencies

### Core Dependencies
- **puppeteer** (^24.11.2) - Headless browser automation
- **@sendgrid/mail** (^8.1.0) - Email notification service
- **crypto** (^1.0.1) - Hash generation for content comparison
- **fs** (^0.0.1-security) - File system operations
- **path** (^0.12.7) - File path manipulation

### System Requirements
- **Node.js** - Version 14 or higher
- **Operating System** - Cross-platform (Windows, macOS, Linux)
- **Memory** - Minimum 512MB RAM for browser operation
- **Disk Space** - Minimal storage for content hashes and logs

## Extensibility

### Plugin Architecture
The modular design allows for easy extension:
- **Custom content processors** - Add new content extraction methods
- **Alternative notification channels** - Slack, Discord, webhooks
- **Enhanced diff algorithms** - Semantic content comparison
- **Custom change filters** - Domain-specific change detection

### Integration Points
- **API endpoints** - Add REST API for external control
- **Database storage** - Replace file-based storage with database
- **Monitoring systems** - Integration with Prometheus, Grafana
- **CI/CD pipelines** - Automated deployment and configuration

## Use Cases

### Professional Monitoring
- **Website change tracking** - Monitor competitor websites
- **Content publication alerts** - Track blog posts and news updates
- **Service status monitoring** - Monitor status pages and announcements
- **Documentation tracking** - Watch for API and documentation updates

### Business Intelligence
- **Price monitoring** - Track product pricing changes
- **Policy updates** - Monitor terms of service and privacy policy changes
- **Market research** - Track competitor feature announcements
- **Compliance monitoring** - Ensure website compliance requirements

### Development and Operations
- **Production monitoring** - Track live website changes
- **Content deployment verification** - Ensure content updates are live
- **Error page detection** - Monitor for 404s and error conditions
- **Performance tracking** - Monitor website availability and content

## Limitations and Considerations

### Technical Limitations
- **JavaScript dependency** - Requires websites to be JavaScript-compatible
- **Browser overhead** - Puppeteer requires significant system resources
- **Rate limiting** - Aggressive monitoring may trigger rate limits
- **Dynamic content** - Some single-page applications may not be fully supported

### Monitoring Considerations
- **Content stability** - Highly dynamic sites may produce false positives
- **Authentication** - No built-in support for authenticated pages
- **Geographic restrictions** - May not work with geo-blocked content
- **Legal compliance** - Users must ensure compliance with website terms of service

This specification provides a comprehensive overview of the URL Monitor Daemon's capabilities, architecture, and implementation details. The system is designed for professional use cases requiring reliable, intelligent website monitoring with rich notification capabilities.
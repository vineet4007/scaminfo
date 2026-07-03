

Project Name

ScamInfo – Scam Awareness & Visitor Analytics Platform

Module 1 - Educational Website
🟥 Homepage
Hero section
Navigation bar
Scam statistics
Featured scam categories
Latest scam alerts
Educational cards
CTA section
Footer
Responsive design
SEO metadata
🟥 Crypto Scam Page
What is a crypto scam
Types of crypto scams
Red flags
Prevention tips
Scam examples
Recovery scam warning
Useful resources
FAQ
🟧 Romance Scam Page
Romance scams explained
Warning signs
Case studies
Prevention
🟧 Dating Scam Page
Dating app scams
Fake profiles
Sextortion
Safety checklist
🟧 Fake Website Page
Common fake websites
Domain verification tips
HTTPS myths
WHOIS explanation
Red flags
🟧 Report Scam Page
How to report scams
Country-wise reporting resources
Cybercrime portal links
🟨 Verify Website Tool

User enters a URL.

System shows:

Domain age
Registrar
HTTPS
DNS
Basic reputation checks
WHOIS information
Module 2 - Analytics Collector
🟥 Automatic Tracking

Collect on first page load.

🟥 Browser Information
Browser
Browser version
Rendering engine
Engine version
🟥 Operating System
OS
OS version
Platform
CPU architecture
🟥 Device Information
Desktop/mobile/tablet
Vendor (if available)
Model (if available)
Max touch points
🟥 Screen Information
Screen width
Screen height
Viewport width
Viewport height
Pixel ratio
Orientation
Color depth
🟥 Locale
Language
Languages
Timezone
UTC offset
🟥 Browser Features
Cookies enabled
JavaScript enabled
LocalStorage
SessionStorage
IndexedDB
PDF viewer
Service Worker support
🟥 Performance
Hardware concurrency
Device memory
Network type (if supported)
Downlink
RTT
Save-Data preference
🟥 Visitor Information
Visitor ID
Session ID
Fingerprint
Referrer
Current page
Page title
URL
Hostname
Timestamp
🟧 Advanced Fingerprinting
Canvas fingerprint
WebGL vendor
WebGL renderer
Audio fingerprint (optional)
Font detection (optional)
Module 3 - Server Analytics
🟥 IP Information
IP Address
User-Agent
Timestamp
🟧 IP Enrichment
Country
Country code
State/Region
City
Postal code
Latitude
Longitude
Timezone
ISP
Organization
ASN
🟧 Network Intelligence
VPN detection
Proxy detection
Tor detection
Hosting provider detection
Residential/Data center classification
Mobile carrier (where available)
Module 4 - Database
🟥 Visitor
Unique visitor
🟥 Session
Browsing session
🟥 Page View
Every visited page
🟥 Event
Click
Scroll
Download
Copy
Exit
Page load
🟧 Event Metadata

Store additional JSON metadata.

Module 5 - Dashboard
🟥 Overview
Visitors today
Total visitors
Unique visitors
Sessions
Page views
Average session duration
Bounce rate
🟥 Charts
Daily visitors
Browser distribution
OS distribution
Device distribution
Country distribution
🟧 Maps
Visitor world map
Heat map by country
🟧 Tables
Recent visitors
Recent sessions
Recent page views
🟧 Filters
Date range
Country
Browser
Device
Page
Module 6 - Threat Intelligence
🟧 Dashboard
VPN visitors
Proxy visitors
Tor visitors
Hosting IPs
Residential IPs
🟧 Suspicious Behaviour
Repeated fingerprints
Repeated IPs
High-frequency visitors
Bot indicators
Module 7 - User Behaviour
🟧 Session Analytics
Time on page
Exit page
Landing page
Returning visitor
Visit number
🟧 Scroll Analytics
Scroll depth
Scroll completion
🟧 Click Analytics
External link clicks
CTA clicks
Download clicks
Module 8 - Admin
🟧 Dashboard
Login (optional for v1)
Search visitors
Search sessions
Search IP
Search fingerprint
🟧 Export
CSV
JSON
Module 9 - APIs
🟥
POST /api/analytics
GET /api/dashboard
GET /api/visitors
GET /api/sessions
🟧
GET /api/countries
GET /api/browsers
GET /api/os
GET /api/pages
GET /api/threats
Module 10 - Deployment
🟥
Docker Compose
PostgreSQL
Prisma
GitHub
Vercel
Neon
Module 11 - Engineering Quality
🟥
TypeScript
Prisma
Zod validation
Pino logging
Environment validation
Error handling
Repository pattern
Service layer
Controller layer
Module 12 - Performance
🟧
Request batching
Pagination
Indexes
Query optimization
Module 13 - Security
🟥
Input validation
Rate limiting
CORS
Security headers
SQL injection protection (via Prisma)
Module 14 - Documentation
🟥
README
Setup guide
Architecture diagram
API documentation
ER diagram
Deployment guide
Module 15 - Testing
🟧
Unit tests
API tests
Integration tests
Module 16 - Future Enhancements
🟩
Redis queue
Background workers
WebSockets
Live visitors
Heatmaps
Session replay
Scheduled reports
AI-based anomaly detection
Domain reputation engine
Scam website submission workflow
Multi-language support
Estimated Timeline
Priority	Features	Estimated Time
🟥 P0	Core platform (website, analytics collection, backend, dashboard, deployment)	
🟧 P1	IP enrichment, threat dashboard, additional pages, filters	
🟨 P2	Website verifier, advanced fingerprinting, testing, optimization	
🟩 P3	Real-time analytics, Redis, workers, AI, session replay
My recommendation


 produce a functioning application, but  gives you time to build something you can confidently present in interviews, with cleaner code, documentation, testing, and a dashboard that demonstrates real engineering rather than just feature completeness.
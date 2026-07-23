

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

Current Repo Status

Completed
- Core public pages are present: homepage, about, crypto scams, romance scams, dating scams, fake websites, report scam, privacy, verify, dashboard, and admin login.
- API routes are present for analytics, dashboard, visitors, sessions, countries, browsers, OS, pages, export, verify-url, admin login, and admin logout.
- The analytics data model exists in Prisma with Visitor, Session, PageView, and Event tables plus device and event enums.
- The app already has supporting UI and service layers: site chrome, topic pages, verify URL form, dashboard charts, analytics tracker, analytics controller, analytics service, analytics repository, and URL verification service.
- Basic deployment and infrastructure foundations are in place through Docker Compose, PostgreSQL, Prisma, and the existing migration history.
- API rate limiting is applied centrally in `proxy.ts` using per-client token buckets for admin login, URL verification, analytics ingestion, and authenticated analytics reads/exports. Route handlers remain independent of rate-limit infrastructure. Rejected requests return HTTP 429 with `Retry-After` and rate-limit headers.

Left To Do
- Threat intelligence features are not implemented yet, including the threats dashboard and suspicious-behaviour insights.
- The advanced user-behaviour module is still incomplete, especially scroll analytics, click analytics, and richer session analytics.
- Some dashboard depth is still missing, such as maps, heat maps, and broader filtering/reporting views.
- The public verification tool still needs stronger enrichment and reputation checks to fully match the planned feature list.
- Documentation is incomplete, especially architecture diagrams, ER diagrams, API docs, and a full setup guide.
- Testing is still incomplete, including unit tests, API tests, and integration tests.
- Performance and security hardening still needs work, such as pagination, indexing, distributed rate-limit storage, and security headers.

Rate limiting

The default token-bucket policies are:

- Admin login: burst of 5 requests, refilling at 1 token per minute.
- URL verification: burst of 8 requests, refilling at 8 tokens per minute.
- Analytics ingestion: burst of 120 requests, refilling at 2 tokens per second.
- Authenticated analytics reads and exports: burst of 60 requests, refilling at 1 token per second.

Limits can be changed with `RATE_LIMIT_LOGIN_CAPACITY`, `RATE_LIMIT_LOGIN_REFILL_PER_SECOND`, `RATE_LIMIT_VERIFY_CAPACITY`, `RATE_LIMIT_VERIFY_REFILL_PER_SECOND`, `RATE_LIMIT_ANALYTICS_CAPACITY`, `RATE_LIMIT_ANALYTICS_REFILL_PER_SECOND`, `RATE_LIMIT_ADMIN_READ_CAPACITY`, and `RATE_LIMIT_ADMIN_READ_REFILL_PER_SECOND`.

Buckets are held in the application process and are suitable for a single running instance. A multi-instance production deployment should replace the in-memory bucket store with shared storage such as Redis so every instance enforces the same limits.

#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================
user_problem_statement: "Surrey Opticians loyalty app — iteration 2: Wallet Pass (Apple/Google), Expiry Reminders (60 days), Refer A Friend, Real scannable QR codes. Wallet signing keys are NOT configured in this environment (expected), so the app falls back to a pass preview + simulate control."

backend:
  - task: "GET /api/wallet/status returns apple/google flags + missing lists"
    implemented: true
    working: "NA"
    file: "backend/wallet.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Expect {apple:false, google:false, missing:{...}} since no keys configured."
  - task: "GET /api/wallet/apple/{code}.pkpass and /api/wallet/google/{code} return 503 when unconfigured"
    implemented: true
    working: "NA"
    file: "backend/wallet.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Signing paths verified by main agent with self-signed test keys (PKCS#7 verifies, JWT decodes)."

frontend:
  - task: "Voucher sheet wallet badges → preview → simulate → 'In … Wallet' chip"
    implemented: true
    working: "NA"
    file: "frontend/app/(tabs)/rewards.tsx, src/ui/WalletBadge.tsx, src/components/WalletPassPreview.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "testIDs: add-to-apple-wallet, add-to-google-wallet, wallet-pass-preview, simulate-wallet-button, wallet-preview-back, voucher-<id>-wallet-chip"
  - task: "Expiry reminders: Home nudge, voucher card 'Expires in N days', sheet note"
    implemented: true
    working: "NA"
    file: "frontend/src/components/ExpiryNudge.tsx, src/components/VoucherCard.tsx, app/(tabs)/index.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Voucher SO-9K2T-08MW (v-9k2t08mw) always expires 41 days from today. testIDs: expiry-nudge, voucher-v-9k2t08mw-expiring, voucher-sheet-expiry-note"
  - task: "Refer a friend screen (/refer) with share, copy code, how-it-works, invites list; entry from Home card and Account row"
    implemented: true
    working: "NA"
    file: "frontend/app/refer.tsx, src/components/ReferCard.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "testIDs: home-refer-card, link-refer, refer-share-button, refer-copy-button, referral-r-01..r-03. Share on web may be unsupported (toast fallback)."
  - task: "Real QR codes (qrcode lib) on card, sheet and wallet preview"
    implemented: true
    working: "NA"
    file: "frontend/src/lib/qr.ts, src/ui/QRCode.tsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Main agent decoded the sheet QR from a screenshot with OpenCV → 'SO-9K2T-08MW'."

metadata:
  created_by: "main_agent"
  version: "1.1"
  test_sequence: 2

test_plan:
  current_focus:
    - "Wallet badges flow"
    - "Expiry reminders"
    - "Refer a friend"
    - "Wallet status API"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: "Iteration 1 (core app) already passed. Please test only the four new features above plus a regression on the till-scan simulation (now a GhostButton, testID simulate-till-scan-button)."

# ---- Iteration 3: responsive fixes + premium polish (main agent) ----
# User bug report: text overflow / responsiveness on Home ("survey results" = Home screen with ring + reward cards).
# Fixes: Txt flexShrink:1; TabBar items wrapped in flex:1 Views (labels no longer collide); buttons use minHeight + wrapping labels;
# ring size responsive (useWindowDimensions); tiles stack < 360px; voucher sheet fully scrollable; welcome lens responsive;
# Card flexGrow so paired tiles match height; account metaRow wraps. Polish: heavier serif headings, roomier line-height,
# uppercase labels, Skeleton loaders (Home/Rewards/Activity/Account/Refer), EmptyState component, hover/press states, ring glow.
# testIDs unchanged. Must verify: no horizontal scroll at 320/375/390/430/768/1280; nothing clipped; all previous flows still pass.

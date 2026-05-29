# SmartVision App — Client Modification Requests

> **Date:** 28 May 2026  
> **Status:** In Progress

---

## 1. Study Planner ✅

### 1.1 Persist & Display Generated Timetable ✅
- **Status:** Implemented
- Timetable is persisted in the `study-plans` collection and displayed via a **7-day rolling view** (replaced monthly calendar)
- Auto-extension logic re-unrolls expired timetables on page load

### 1.2 Session Notifications ✅ (Partial)
- **Status:** Auto-tracking notifications implemented
- When a student studies on the platform (≥5 min engagement), their planner session is auto-marked and a notification is created ("📍 Attendance marked for [Subject] study session")
- Push notifications for upcoming sessions still pending (separate infrastructure concern)

### 1.3 Additional Improvements (implemented)
- **7-day rolling planner** replaced the monthly calendar as the primary view
- **"Study Now" deep links** from planner sessions and dashboard directly to `/dashboard/learning/[subject]`
- **Automated session tracking** via `UserProgress` → `StudyPlan` hook bridge

---

## 2. Question Bank ✅

### 2.1 Content Scope & Dedicated Viewer ✅
- **Status:** Implemented
- The Question Bank contains only uploaded PDF question papers, displayed in a browse-first grid.
- Replaced the inline viewer with a **dedicated single-page viewer** (`/dashboard/question-bank/[paperId]`).
- Implemented a highly robust **Secure PDF Proxy + Canvas Renderer**:
  - The server encodes PDFs as a JSON Base64 response (`/api/secure-pdf/[mediaId]`) to completely bypass aggressive download managers like IDM.
  - `react-pdf` renders the decoded bytes into HTML5 canvas elements, preventing native browser downloads, right-click saves, and print options.
- The UI differentiates between free and premium papers, showing a golden 👑 for premium content.

### 2.2 UI Label Change ✅
- **Status:** Implemented
- Renamed "Topic" to "Paper Number".

---

## 3. Testing Centre ✅

### 3.1 MCQ-Only Practice ✅
- **Status:** Implemented
- Stripped out "Exam Papers" logic. The Testing Centre is now exclusively focused on MCQ practice.
- Browsing Exam Papers is completely moved to the Question Bank.

### 3.2 Question Count Selector (Mobile UX) ✅
- **Status:** Implemented
- Replaced the standard number input with **Mobile-Friendly Stepper Buttons** (+ / -) for easy interaction on touch screens.

---

## 4. Digital Library

### 4.1 Level-Based Subject Arrangement
- **Required Change:**
  - Subjects must be **arranged/grouped according to levels**.

### 4.2 Uploaded Documents Not Visible
- **Issue:** Documents uploaded by the user are **not appearing** in the Digital Library.
- **Required Change:**
  - Investigate and fix the upload/display pipeline so that **all uploaded documents are visible** to the user.

---

## 5. Video Library

### 5.1 Level & Topic Organisation
- **Required Change:**
  - Subjects should be **arranged according to levels**.
  - Within each subject, videos should be **arranged according to topics**.

---

## 6. Learning Hub / Study Material

### 6.1 Level-Based Subject Arrangement
- **Required Change:**
  - Subjects must be **arranged according to levels**.

### 6.2 Fix Question Bank Redirect
- **Issue:** The Learning Hub currently redirects users to other features **but not to the Question Bank**.
- **Required Change:**
  - Ensure there is a clear navigation path / redirect **from the Learning Hub to the Question Bank**.

---

## 7. Subscription

### 7.1 Pricing
| Plan | Price |
|---|---|
| Monthly | **500 FCFA** |
| Annually (September – June) | **3,500 FCFA** |

### 7.2 Admin-Configurable Pricing
- **Required Change:**
  - The subscription amounts above must be **configurable at any time** by an administrator, without requiring a code change or app update.

---

## 8. Global Academic Level Context

### 8.1 Context-Aware Academic Level
- **Issue:** The student's academic level is already stored in their user profile (`users.academicLevel`), but some features (e.g., Study Planner creation, content browsing) still ask the student to select or re-enter their academic level.
- **Required Change:**
  - **All pages and features** must read the student's academic level from their authenticated user document.
  - Content listings (Learning Hub, Video Library, Digital Library, Question Bank, Testing Centre) should **automatically filter by the user's academic level** without requiring manual selection.
  - The Study Planner should **pre-fill** the academic level from the user profile when creating a plan, not ask for it again.
  - If the student's academic level is not yet set, prompt them to set it **once** (e.g., in onboarding or profile settings), then use it everywhere.

---

## Summary Table

| # | Feature | Changes | Priority |
|---|---|---|---|
| 1 | Study Planner | ~~Persist timetable; add session notifications~~ + 7-day view, auto-tracking, deep links | ✅ Done |
| 2 | Question Bank | PDF-only papers by level/number; rename "Topic" → "Paper Number"; added robust secure inline PDF viewer to bypass IDM | ✅ Done |
| 3 | Testing Centre | MCQ-only; move exam papers to Question Bank; fix mobile number input using steppers | ✅ Done |
| 4 | Digital Library | Arrange by level; fix uploaded documents not showing | — |
| 5 | Video Library | Arrange subjects by level, videos by topic | — |
| 6 | Learning Hub | Arrange by level; fix missing Question Bank redirect | — |
| 7 | Subscription | Set prices (500/3500 FCFA); make amounts admin-configurable | — |
| 8 | Global Context | Auto-apply user's academic level across all features; no re-entry | — |

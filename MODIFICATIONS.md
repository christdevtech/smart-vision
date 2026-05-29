# SmartVision App — Client Modification Requests

> **Date:** 28 May 2026  
> **Status:** Pending Implementation

---

## 1. Study Planner

### 1.1 Persist & Display Generated Timetable
- **Issue:** After using the AI assistant to create a study plan, the generated timetable is **not visible** when the user revisits the feature.
- **Required Change:**
  - The AI-generated timetable must be **persisted** and displayed whenever the Study Planner feature is opened.
  - If an in-app download option is provided, the downloaded timetable should appear under the **Downloaded** folder.

### 1.2 Session Notifications
- **Required Change:**
  - Students should receive a **push notification before each scheduled session**.
  - Alternatively, a single notification summarising **all sessions programmed for that day** should be sent (e.g., at the start of the day).

---

## 2. Question Bank

### 2.1 Content Scope
- **Required Change:**
  - The Question Bank should contain **only uploaded PDF question papers**.
  - Papers must be **arranged/grouped by level and paper number**.

### 2.2 UI Label Change
- **Required Change:**
  - Rename the **"Topic"** field/box to **"Paper Number"**.

---

## 3. Testing Centre

### 3.1 MCQ-Only Practice
- **Required Change:**
  - The Testing Centre should be used **exclusively for MCQ practice**.
  - The **"Exam Paper"** section/option currently in the Testing Centre must be **moved to the Question Bank** feature.

### 3.2 Question Count Selector (Mobile UX)
- **Issue:** On mobile phones, it is difficult to change the number of questions from the default value (e.g., changing `1` to another number).
- **Required Change:**
  - Replace or improve the number input control so it is **easily usable on mobile devices** (e.g., use a dropdown, stepper buttons, or a slider).

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
| 1 | Study Planner | Persist timetable; add session notifications | — |
| 2 | Question Bank | PDF-only papers by level/number; rename "Topic" → "Paper Number" | — |
| 3 | Testing Centre | MCQ-only; move exam papers to Question Bank; fix mobile number input | — |
| 4 | Digital Library | Arrange by level; fix uploaded documents not showing | — |
| 5 | Video Library | Arrange subjects by level, videos by topic | — |
| 6 | Learning Hub | Arrange by level; fix missing Question Bank redirect | — |
| 7 | Subscription | Set prices (500/3500 FCFA); make amounts admin-configurable | — |
| 8 | Global Context | Auto-apply user's academic level across all features; no re-entry | — |

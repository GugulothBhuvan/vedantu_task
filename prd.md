# AdaptiveNEET — Product Requirements Document (PRD)

# Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Context & Opportunity](#3-context--opportunity)
4. [Product Vision](#4-product-vision)
5. [Target Users](#5-target-users)
6. [User Pain Points](#6-user-pain-points)
7. [Product Goals & Success Metrics](#7-product-goals--success-metrics)
8. [Product Principles](#8-product-principles)
9. [Core Product Loop](#9-core-product-loop)
10. [Information Architecture (IA)](#10-information-architecture-ia)
11. [User Flows](#11-user-flows)
12. [Core Features](#12-core-features)
    * [12.1 Home](#121-home)
    * [12.2 Practice Mode](#122-practice-mode)
    * [12.3 Quiz Mode](#123-quiz-mode)
    * [12.4 Test Mode](#124-test-mode)
    * [12.5 Question Bank](#125-question-bank)
    * [12.6 Progress Tracking](#126-progress-tracking)
13. [Adaptive Learning System](#13-adaptive-learning-system)
14. [AI Explanation Engine](#14-ai-explanation-engine)
15. [Progress & Motivation System](#15-progress--motivation-system)
16. [UX Philosophy & Design Decisions](#16-ux-philosophy--design-decisions)
17. [Gamification & Retention Strategy](#17-gamification--retention-strategy)
18. [Technical Architecture](#18-technical-architecture)
19. [Database Schema Overview](#19-database-schema-overview)
20. [API & Backend Overview](#20-api--backend-overview)
21. [State Management Approach](#21-state-management-approach)
22. [Analytics & Tracking](#22-analytics--tracking)
23. [MVP Scope](#23-mvp-scope)
24. [Stretch Features](#24-stretch-features)
25. [Assumptions & Constraints](#25-assumptions--constraints)
26. [Risks & Tradeoffs](#26-risks--tradeoffs)
27. [Future Roadmap](#27-future-roadmap)
28. [Why AdaptiveNEET Matters](#28-why-adaptiveneet-matters)
29. [Appendix](#29-appendix)

---

# 1. Executive Summary
AdaptiveNEET is a premium, AI-enhanced adaptive MCQ practice platform designed specifically for NEET aspirants. Positioned as **"A LeetCode for NEET"**, the platform shifts focus from passive content consumption to active, personalized testing. It incorporates client-side adaptive item sequencing, real-time AI-powered concept explanations, and comprehensive progress dashboards to enable highly efficient, weak-area-focused revision cycles.

---

# 2. Problem Statement
NEET aspirants face massive syllabus volumes with static study tools. Traditional practice sets and mock tests serve generic question sequences, forcing students to waste time on mastered concepts while leaving crucial weaknesses unreinforced. Furthermore, students lack immediate, conceptual explanations for mistakes, resulting in repeated errors, low study efficiency, and cognitive burnout.

---

# 3. Context & Opportunity
Following high-pressure scenarios like Re-NEET, preparation windows are compressed, and student anxiety is amplified. This context creates a massive market demand for hyper-focused revision tools. The rise of advanced LLMs (like Google Gemini) presents a unique technical opportunity to replace generic text solutions with interactive, context-aware AI tutors that explain the exact scientific misconceptions in a student's answer.

---

# 4. Product Vision
To empower every NEET aspirant to practice smarter, build unbreakable concept confidence, and boost revision efficiency by continuously aligning practice questions to their personal boundary of competence.

---

# 5. Target Users
* **Primary Persona**: **Aarav Sharma (18)**, a dedicated NEET dropper preparing from home using an Android smartphone.
* **Attributes**:
  * Highly motivated but frequently feels overwhelmed by the 97+ chapters of syllabus.
  * Struggles to diagnose why he gets specific physical chemistry/physics formula problems wrong.
  * Demands lightweight, fast-loading, distraction-free study sessions.
  * Prefers short, highly targeted practice intervals (15-30 minutes) over bulk mock tests.

---

# 6. User Pain Points
* **Cognitive Overload**: Sifting through thousands of pages of text or videos to revise single weak concepts.
* **Syllabus Disorganization**: Inability to identify which precise sub-topic (e.g., Capacitance within Electrostatics) is dropping their mock test score.
* **Static Question Banks**: Wasting energy answering "Easy" level questions repeatedly instead of advancing to "Medium" or "Hard".
* **Generic Solutions**: Standard answer keys stating the correct option without explaining *why* the user's specific wrong selection was conceptually flawed.

---

# 7. Product Goals & Success Metrics
### Goals
* **G1: Adaptive practice personalization** based on active correctness patterns.
* **G2: Concept reinforcement** via instant, contextual AI explanations.
* **G3: Precise diagnostics** mapping weak topics for immediate remediation.
* **G4: Lag-free mobile experience** suitable for low-connectivity environments.

### Key Performance Indicators (KPIs)
* **Accuracy Improvement Rate**: Average percentage increase in correct answers over a 14-day user cycle.
* **Session Completion Rate**: Percentage of users who complete their customized/timed question targets.
* **Engagement with AI Explanations**: Ratio of submitted questions where the user expands and reads the AI Explanation card.
* **Daily Active User (DAU) Streak Continuation**: Frequency of consecutive days active.

---

# 8. Product Principles
* **Practice-First**: Get the user directly into a question loop within 2 clicks of launching the app.
* **Real-time Reinforcement**: Evaluate answers immediately; explain while the student's train of thought is still active.
* **Absolute Clarity**: Eliminate visual clutter. Use clean spacing, cohesive HSL-based colors, and legible typography (Outfit/Inter).
* **Supportive & Encouraging**: Gamification should celebrate efforts and consistency rather than penalizing mistakes.

---

# 9. Core Product Loop
```
   ┌────────────────────────────────────────────────────────┐
   │                                                        │
   ▼                                                        │
┌──────────────────────┐      ┌──────────────────────┐      │
│   Serve Adaptive     │ ───> │  User Submits MCQ    │      │
│      Question        │      │        Answer        │      │
└──────────────────────┘      └──────────┬───────────┘      │
                                         │                  │
                                         ▼                  │
┌──────────────────────┐      ┌──────────────────────┐      │
│ Update Topic Mastery │ <─── │ Evaluate & Render AI │      │
│      and Streak      │      │     Explanation      │ ─────┘
└──────────────────────┘      └──────────────────────┘
```
Each user action updates the store state, which feeds back into the adaptive engine to dictate the next question's metadata parameters (subject, chapter, and difficulty).

---

# 10. Information Architecture (IA)
```
[App Entry]
   │
   ├── [Onboarding / Registration]
   │
   ├── [Home Dashboard]
   │     ├── Continue Practicing Card (Quick Link)
   │     ├── Practice Categories (Physics, Chemistry, Biology, Mixed)
   │     ├── Practice Utilities (Custom Practice, Weak Areas, Wrong Questions)
   │     └── Recent Results List
   │
   ├── [Practice Hub / Chapter Selection]
   │     └── Syllabus Progress and Chapter Progress Lists
   │
   ├── [Active Practice Screen]
   │     ├── Split-Screen Pane (Web) / Stacked Layout (Mobile)
   │     ├── Question Card & Option Select
   │     ├── AI Explanation Viewer
   │     └── Modal Overlay (Custom Configuration, Session Completed Summary)
   │
   └── [Analytics Screen]
         └── Mastery breakdowns, Speed analytics, and Weak-topic insights
```

---

# 11. User Flows
1. **Onboarding**: Open App -> Enter Name, Target Score, and Preferred Subject -> Direct landing on Home Dashboard.
2. **Standard Chapter Practice**: Home -> Choose Physics -> Select "Current Electricity" -> Practice Screen -> Solve Questions (1 to 20) -> Show Session Completed Modal -> Return to Hub.
3. **Custom Practice**: Home -> Click "Custom Practice" -> Open Modal -> Set Subject (Physics), Question Limit (5), Chapters (Laws of Motion), Difficulty (Medium) -> Solve 5 targeted questions -> View Session Summary -> Return to Hub.

---

# 12. Core Features

### 12.1 Home
* **Hero Carousel**: Banners displaying syllabus progress, mock challenges, and a prominent "Continue Practicing" shortcut.
* **Subject Grid**: High-yield entry points for Physics, Chemistry, and Biology showing overall chapter progress.
* **Utilities Deck**: Instant configuration buttons for Custom Practice, Weak Areas practice, and revision cards.

### 12.2 Practice Mode
* **Adaptive Progress Tracking**: Resets active session counts to 0 on launch to ensure numbering sequence starts at 1.
* **Dual Layout Engine**: Auto-adapts from a single-column layout on mobile to a professional split-pane layout on desktop screens (left for question, right for AI explanation).
* **Mark for Review**: Quick bookmark toggling that persists locally.

### 12.3 Quiz Mode
* **Timed Mode**: 45-second timer per question.
* **Sudden Death / Sprints**: Short-duration question sprints (5 min, 15 min) configured to mimic high-pressure exam environments.

### 12.4 Test Mode
* **Full Syllabus Simulation**: Simulated 180-question mock tests with detailed post-exam sectional analyses (Physics, Chemistry, Biology).

### 12.5 Question Bank
* **Physics DB Expansion**: Fully populated database containing 20 mathematically verified, unique questions for each of the 23 core NEET Physics chapters (totaling 460 questions).
* **Chemistry & Biology DBs**: Curated collections of organic/inorganic pathways and high-yield physiology MCQs.

### 12.6 Progress Tracking
* **Mastery Metrics**: Dynamically calculated accuracy rates per topic.
* **Weak-Topic Logging**: Automatic classification of a topic as "Weak" if consecutive correctness falls below 50%.

---

# 13. Adaptive Learning System
The platform utilizes a local, performance-driven algorithm implemented in [adaptiveEngine.ts](file:///d:/nomad%20archives/vedantu_task/services/adaptiveEngine.ts):
* **Initial State**: Fetches baseline questions from the user's preferred subject or custom configured chapters.
* **Progression Rules**:
  * Answering a question correctly advances the difficulty (Easy -> Medium -> Hard).
  * Answering incorrectly pulls a similar question from the same topic at a lower difficulty (Hard -> Medium -> Easy) to rebuild confidence.
  * Weak topics are automatically queued into the practice stream with higher priority.
* **Custom Overrides**: Honors selected chapter pools (`allowedTopics`) and difficulty lockers (`customDifficulty`).

---

# 14. AI Explanation Engine
Rather than hosting heavy client-side AI modules, requests are routed to a secure Express.js gateway. The API:
* Intercepts payload: Question text, correct option, option selected by user, subject, topic, and difficulty.
* Submits structured system prompts to the Google Gemini API.
* Generates clear, structured Markdown explanations containing a solution walkthrough, formula callouts, and NEET mnemonics.
* Automatically falls back to local offline explanation templates if network latency is detected or the API is rate-limited.

---

# 15. Progress & Motivation System
* **Streak Tracking**: Continuous activity tracker using local storage. Shows flame emojis and alerts if a user hasn't completed their daily target.
* **Score-to-Points Calibration**: Users earn +10 points per correct answer, instantly updated in the Zustand store and rendered on the HUD.
* **Trophy Modal**: Success overlay displaying completed question details, accuracy ratios, and earned points.

---

# 16. UX Philosophy & Design Decisions
* **Harmony of Colors**: Custom HSL-based palettes representing subjects (Physics = Indigo, Chemistry = Emerald, Biology = Orange).
* **Clear Hierarchy**: High-contrast, large text sizes for formula variables, code snippets, and question headers.
* **Glassmorphism & Blurs**: Sleek card layouts with subtle border translucency for a premium, modern aesthetic.
* **Typography**: Outfit font family for headers and clean sans-serif interfaces.

---

# 17. Gamification & Retention Strategy
* **Streak Flame Widget**: Visual feedback of daily preparation consistency.
* **Dynamic Points HUD**: Gamified rewards system updating instantly.
* **Interactive Chapter Checklists**: Highlighting progress percentages to induce a completionist motivation loop.

---

# 18. Technical Architecture
```
┌────────────────────────────────────────────────────────┐
│                     Frontend (Client)                  │
│  - React Native / Expo Bare Workflow                   │
│  - Zustand State Management (useQuizStore, Progress)   │
│  - TypeScript & NativeWind                             │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTPS (Fetch)
                           ▼
┌────────────────────────────────────────────────────────┐
│                     Backend Gateway                    │
│  - Node.js & Express API                               │
│  - Render / Railway Server Deployment                  │
└──────────────────────────┬─────────────────────────────┘
                           │ Google Generative AI SDK
                           ▼
┌────────────────────────────────────────────────────────┐
│                     AI Provider                        │
│  - Google Gemini API (gemini-1.5-flash / pro models)   │
└────────────────────────────────────────────────────────┘
```

---

# 19. Database Schema Overview
The questions are managed locally via a structured JSON schema in [questions.json](file:///d:/nomad%20archives/vedantu_task/data/questions.json):
```json
{
  "id": "phy_es_001",
  "subject": "Physics",
  "topic": "Electrostatics",
  "difficulty": "medium",
  "questionText": "Two point charges Q1 and Q2 are placed...",
  "options": [
    "Increases by 4 times",
    "Decreases by 2 times",
    "Remains constant",
    "Increases by 2 times"
  ],
  "correctOptionIndex": 0,
  "conceptualTags": ["Coulomb's Law", "Permittivity"]
}
```

---

# 20. API & Backend Overview
The gateway exposes two core endpoints in Express:
* **`GET /health`**: Health monitor checking API connectivity and SDK availability.
* **`POST /api/explain`**: Explanation generation. Accepts the question payload and user choice, returns a structured Markdown explanation.

---

# 21. State Management Approach
Handled via two dedicated Zustand stores:
1. **`useQuizStore`**: Session-specific variables (current question, selected option, session question counter, evaluation state, AI explanation strings, and custom configs).
2. **`useProgressStore`**: Persistent student statistics (total solved questions, topic mastery history, weak topics lists, daily streaks, preferred subjects, and target scores).

---

# 22. Analytics & Tracking
* **Active Topic Diagnosis**: Tracks consecutive correct/incorrect answers per topic to calculate dynamic mastery levels.
* **Speed Analytics**: Logs the seconds spent per question to construct an average answering speed report on the analytics dashboard.

---

# 23. MVP Scope
* **Core MCQ Adaptive Practice** with immediate evaluation.
* **Gemini-powered AI explanation** on Render backend.
* **Physics questions database** (23 chapters with 20 questions each).
* **Zustand local persistence** for streaks and topic history.
* **Custom practice modal** with chapter checklists and difficulty selectors.
* **EAS compilation** outputting a preview APK.

---

# 24. Stretch Features
* **Daily Spaced Repetition**: Re-queueing bookmarked or failed questions at 1, 3, and 7-day intervals.
* **AI Chat Sandbox**: An interactive workspace where students can ask follow-up questions to the Gemini tutor about a solved MCQ.
* **Real-time Peer Battles**: Instant MCQ speed matches between users on common topics.

---

# 25. Assumptions & Constraints
* **Assumption**: Users have periodic internet access (to call Render gateway for AI explanations).
* **Constraint**: Gemini API key is bound by rate limits; local offline templates must serve as a functional fallback.

---

# 26. Risks & Tradeoffs
* **Risk**: High latency from Render's free-tier servers.
* **Tradeoff**: Serve offline explanations immediately to maintain practice flow speed, rendering the AI explanation asynchronously when the API response finishes.

---

# 27. Future Roadmap
* **Phase 1 (Current)**: Local database practice, custom configurations, and AI explanation gateway.
* **Phase 2**: Spaced-repetition revision schedule, timed sectional mocks, and dashboard enhancements.
* **Phase 3**: Complete cloud database syncing (Firebase integration) and cross-platform web app release.

---

# 28. Why AdaptiveNEET Matters
By adopting an active test-first model, AdaptiveNEET optimizes student revision. It provides an personalized practice experience that ensures every minutes spent on the platform targets the student's highest-yield improvement areas, drastically boosting final NEET scores.

---

# 29. Appendix
### Gemini System Prompt Template
```text
You are an expert NEET Physics, Chemistry, and Biology tutor.
Analyze the following question from Subject: {subject}, Topic: {topic}, Difficulty: {difficulty}.
The correct option index is {correctOptionIndex} (options: {options}).
The user selected index {userAnswerIndex}.

Provide a clear conceptual explanation using Markdown format. 
Focus on:
1. Correct conceptual model.
2. Direct step-by-step mathematical or reasoning walkthrough.
3. Where the student's selected wrong answer likely derived from.
Keep the language extremely encouraging, concise, and professional.
```

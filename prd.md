# AdaptiveNEET — Final Product Requirements Document (PRD)

# 1. Executive Summary

## Product Name

AdaptiveNEET

## Product Category

AI-Enhanced Adaptive Test-Series Application for NEET Aspirants

## Product Positioning

“A LeetCode for NEET” — an AI-enhanced adaptive MCQ practice platform focused on revision efficiency, weak-area reinforcement, and personalized conceptual feedback.

## Product Vision

To help NEET aspirants prepare smarter under compressed timelines through adaptive question sequencing, AI-powered explanations, and personalized reinforcement loops.

---

# 2. Problem Definition

# 2.1 Context

Following the Re-NEET scenario, aspirants face:

* increased stress,
* compressed preparation windows,
* revision overload,
* and reduced confidence.

Most existing platforms already provide:

* large question banks,
* mock tests,
* lectures,
* static analytics dashboards.

However, students still struggle with:

* identifying weak areas,
* prioritizing revision,
* receiving personalized guidance,
* and practicing efficiently under time pressure.

---

# 2.2 Core Problem Statement

NEET aspirants struggle to efficiently improve weak areas because current practice systems are static, non-adaptive, and lack personalized reinforcement.

---

# 2.3 Product Thesis

AdaptiveNEET is not designed to maximize content consumption.

It is designed to maximize revision efficiency under pressure.

---

# 3. Product Goals

# Primary Goals

## Goal 1 — Adaptive Practice

Deliver personalized question sequencing based on user performance.

---

## Goal 2 — AI-Powered Reinforcement

Provide AI-generated conceptual explanations and learning reinforcement.

---

## Goal 3 — Weak Area Identification

Continuously detect and reinforce weak topics.

---

## Goal 4 — Fast Learning Feedback

Provide immediate answer evaluation and contextual explanations.

---

## Goal 5 — Lightweight Mobile Experience

Create a focused, fast, and motivating adaptive practice environment.

---

# 4. Product Scope

# 4.1 In Scope

## Core Features

### A. Adaptive MCQ Solving Loop

* One question at a time
* Multiple-choice interaction
* Instant correctness evaluation
* AI-generated explanation
* Adaptive next-question logic

---

### B. Adaptive Difficulty Engine

* Difficulty progression
* Weak-topic prioritization
* Performance-aware sequencing

---

### C. AI Explanation Engine

* Conceptual explanations
* Simplified reasoning
* Wrong-answer reinforcement
* Educational feedback

---

### D. Progress Tracking

* Accuracy %
* Questions solved
* Streak tracking
* Topic mastery
* Weak-topic visibility

---

### E. Weak Area Reinforcement

* Topic weakness detection
* Personalized recommendations
* Adaptive practice prioritization

---

### F. Lightweight Dashboard

* Continue practice
* Progress visibility
* Weak-topic insights

---

# 4.2 Out of Scope

The following are intentionally excluded from MVP:

| Feature                   | Reason                                     |
| ------------------------- | ------------------------------------------ |
| Video lectures            | Not aligned with practice-first philosophy |
| Full syllabus learning    | Scope expansion                            |
| Community/social features | Low MVP value                              |
| Large mock ecosystem      | Outside assignment scope                   |
| Advanced gamification     | Lower priority                             |
| Multi-device sync         | Future scope                               |
| Full AI tutor chatbot     | Over-engineering                           |

---

# 5. User Personas

# Persona — Aarav Sharma

| Attribute          | Details                             |
| ------------------ | ----------------------------------- |
| Age                | 18                                  |
| Device             | Android Smartphone                  |
| Goal               | Improve weak areas efficiently      |
| Pain Point         | Doesn’t know what to revise next    |
| Behavioral Pattern | Practices in short focused sessions |

---

# 6. User Pain Points

| Pain Point                    | Impact               |
| ----------------------------- | -------------------- |
| Too much syllabus             | Cognitive overload   |
| Static mock tests             | Inefficient practice |
| No adaptive guidance          | Random revision      |
| Repeated mistakes             | Confidence reduction |
| No personalized reinforcement | Weak retention       |

---

# 7. Jobs To Be Done (JTBD)

# Functional Job

Help me efficiently improve weak areas through adaptive practice.

---

# Emotional Job

Help me feel confident and less overwhelmed.

---

# Social Job

Help me feel prepared compared to peers.

---

# 8. Core Product Philosophy

AdaptiveNEET is:

* practice-first,
* adaptive,
* reinforcement-oriented,
* AI-enhanced.

The product focuses on:

* personalized question-solving,
* adaptive prioritization,
* and conceptual reinforcement.

---

# 9. Core Product Loop

The entire application revolves around one continuous loop:

Serve Adaptive Question
→
User Solves Question
→
Evaluate Correctness
→
Generate AI Explanation
→
Update Mastery Metrics
→
Serve Adaptive Next Question
→
Repeat

Everything in the product supports this loop.

---

# 10. Feature Requirements

# 10.1 Adaptive Question Engine

## Description

The system dynamically selects the next question based on user performance patterns.

---

## Inputs

* previous answer correctness,
* topic accuracy,
* streak count,
* recent failures,
* current difficulty level.

---

## Difficulty Levels

* Easy
* Medium
* Hard

---

## Adaptive Rules

| User Behavior               | System Action              |
| --------------------------- | -------------------------- |
| Consecutive correct answers | Increase difficulty        |
| Wrong answer                | Reinforce same topic       |
| Multiple failures           | Mark weak topic            |
| Strong topic mastery        | Introduce harder questions |

---

# 10.2 AI Explanation Engine

## Description

An AI-powered explanation system provides concise conceptual reinforcement after every question attempt.

---

## Responsibilities

* Explain correct answers
* Simplify concepts
* Clarify misconceptions
* Reinforce learning

---

## Example AI Output

### Incorrect Answer

“You confused voltage with current flow. Remember: voltage pushes current through resistance. Use V = IR.”

---

## AI Provider

* Gemini API (preferred)
  OR
* OpenAI API

---

## Backend Role

AI requests are routed through backend APIs for:

* API key security,
* prompt control,
* request management.

---

# 10.3 Progress Tracking

## Metrics

* Accuracy %
* Questions solved
* Current streak
* Topic mastery
* Weak-topic frequency

---

## Purpose

* motivate users,
* create visible progress,
* encourage consistency.

---

# 10.4 Weak Area Reinforcement

## Responsibilities

* identify weak topics,
* prioritize weak-topic questions,
* generate revision suggestions.

---

## Example Recommendations

* “Focus on Thermodynamics”
* “Practice Plant Physiology”

---

# 11. Information Architecture

# Primary Navigation

## 1. Home Dashboard

Purpose:

* progress visibility,
* continue practice,
* weak-topic overview.

---

## 2. Practice Screen

Purpose:

* adaptive solving flow,
* instant feedback,
* AI explanations,
* adaptive progression.

---

## 3. Analytics Screen

Purpose:

* mastery visibility,
* topic insights,
* weak-area tracking.

---

## 4. Settings Screen

Purpose:

* preferences,
* reset progress.

---

# 12. User Journey

# First-Time User Flow

## Step 1 — Open Application

User launches app.

---

## Step 2 — Lightweight Onboarding

User enters:

* name,
* target score,
* preferred subject.

---

## Step 3 — Dashboard

User sees:

* progress,
* streak,
* continue practice CTA.

---

## Step 4 — Adaptive Practice

User:

* solves questions,
* receives AI explanations,
* progresses adaptively.

---

## Step 5 — Performance Review

User reviews:

* weak areas,
* mastery,
* recommendations.

---

## Step 6 — Continuous Adaptive Loop

User repeatedly practices through adaptive sessions.

---

# 13. UX Strategy

# UX Goals

The application should feel:

* lightweight,
* fast,
* motivating,
* supportive,
* distraction-free.

---

# UX Principles

## Practice First

Users should begin solving within seconds.

---

## Fast Reinforcement

Immediate answer feedback and explanations.

---

## Visible Progress

Users should feel measurable improvement.

---

## Reduced Cognitive Load

Simplify revision priorities and navigation.

---

## Encouraging Emotional Design

The app should feel supportive rather than stressful.

---

# 14. Technical Architecture

# Frontend Stack

| Layer            | Technology        |
| ---------------- | ----------------- |
| Mobile Framework | Expo React Native |
| Language         | TypeScript        |
| Styling          | NativeWind        |
| Navigation       | Expo Router       |
| State Management | Zustand           |

---

# Backend Stack

| Layer           | Technology       |
| --------------- | ---------------- |
| Backend Runtime | Node.js          |
| Framework       | Express.js       |
| Hosting         | Render / Railway |

---

# Database

| Layer       | Technology         |
| ----------- | ------------------ |
| Persistence | Firebase Firestore |

---

# AI Layer

| Layer        | Technology              |
| ------------ | ----------------------- |
| LLM Provider | Gemini API / OpenAI API |

---

# Deployment

| Layer            | Technology      |
| ---------------- | --------------- |
| Mobile Build     | Expo EAS Build  |
| APK Distribution | Expo Build Link |

---

# 15. System Design Philosophy

# Lightweight Cloud-Backed Architecture

The MVP intentionally adopts:

* lightweight backend infrastructure,
* client-side adaptive logic,
* cloud-backed persistence,
* AI-enhanced reinforcement.

---

# Why Adaptive Logic Remains Client-Side

Reasons:

* lower latency,
* smoother interactions,
* faster feedback loops,
* simpler MVP implementation.

---

# Backend Responsibilities

The backend handles:

* AI explanation generation,
* API security,
* request orchestration,
* user persistence integration.

---

# 16. High-Level System Architecture

```txt id="p58c5k"
                ┌──────────────────┐
                │  Expo React App  │
                └────────┬─────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌────────────────┐ ┌──────────────┐ ┌─────────────────┐
│ Adaptive Engine │ │ Firestore DB │ │ Gemini/OpenAI   │
└────────────────┘ └──────────────┘ └─────────────────┘
```

---

# 17. Project Root Directory

```txt id="ybj68o"
adaptive-neet/
│
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── practice.tsx
│   ├── analytics.tsx
│   └── settings.tsx
│
├── components/
│   ├── QuestionCard.tsx
│   ├── FeedbackModal.tsx
│   ├── AIExplanationCard.tsx
│   ├── ProgressCard.tsx
│   ├── WeakTopicCard.tsx
│   └── StreakWidget.tsx
│
├── services/
│   ├── adaptiveEngine.ts
│   ├── scoringService.ts
│   ├── aiService.ts
│   └── firebaseService.ts
│
├── store/
│   ├── useQuizStore.ts
│   └── useProgressStore.ts
│
├── hooks/
│   └── useAdaptiveQuestion.ts
│
├── data/
│   └── questions.json
│
├── utils/
│   ├── analyticsUtils.ts
│   ├── storageUtils.ts
│   └── difficultyUtils.ts
│
├── constants/
│   ├── colors.ts
│   └── config.ts
│
├── assets/
│
├── backend/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── prompts/
│   ├── app.js
│   └── package.json
│
├── package.json
├── app.json
├── eas.json
├── tsconfig.json
└── README.md
```

---

# 18. KPIs & Success Metrics

# Learning Metrics

* Accuracy improvement
* Weak-topic reduction
* Difficulty progression

---

# Engagement Metrics

* Questions solved/session
* Daily streak continuation
* Session completion rate

---

# Product Metrics

* Time-to-practice
* Adaptive session completion
* Explanation engagement rate

---

# 19. Risks & Mitigations

| Risk            | Mitigation                |
| --------------- | ------------------------- |
| Over-scoping    | Strict MVP prioritization |
| AI latency      | Lightweight prompts       |
| APK instability | Expo-managed workflow     |
| Poor adaptivity | Simple explainable rules  |
| Weak UX clarity | Minimal navigation        |

---

# 20. Future Scope

# Phase 2

* spaced repetition,
* daily challenge,
* timed mock mode.

---

# Phase 3

* AI tutor mode,
* advanced analytics,
* revision planner,
* cloud sync,
* collaborative learning.

---

# 21. Final Product Insight

AdaptiveNEET does not aim to replace coaching or teaching platforms.

It aims to:

* optimize revision efficiency,
* personalize practice,
* reinforce concepts adaptively,
* and reduce cognitive overload during high-pressure preparation.

The product succeeds when students feel:

“I know exactly what I should practice next — and why.”

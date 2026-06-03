# AdaptiveNEET

An AI-Enhanced Adaptive MCQ Practice Platform for NEET Aspirants — "A LeetCode for NEET".

## Table of Contents
1. [Overview](#1-overview)  
2. [Problem Statement](#2-problem-statement)  
3. [Core Product Loop](#3-core-product-loop)  
4. [Features](#4-features)  
   * [Adaptive Practice](#adaptive-practice)  
   * [AI Explanations](#ai-explanations)  
   * [Quiz Mode](#quiz-mode)  
   * [Test Mode](#test-mode)  
   * [Question Bank](#question-bank)  
   * [Progress Tracking](#progress-tracking)  
5. [Product Philosophy](#5-product-philosophy)  
6. [Tech Stack](#6-tech-stack)  
7. [Project Structure](#7-project-structure)  
8. [Adaptive Logic](#8-adaptive-logic)  
9. [Installation & Setup](#9-installation--setup)  
10. [APK Build Instructions](#10-apk-build-instructions)  
11. [Demo](#11-demo)  
12. [Future Scope](#12-future-scope)  
13. [AI Tooling Used](#13-ai-tooling-used)  
14. [Why AdaptiveNEET Matters](#14-why-adaptiveneet-matters)  

---

## 1. Overview
AdaptiveNEET is a premium React Native / Expo application designed to maximize revision efficiency for NEET aspirants. By replacing passive learning with active, performance-aligned practice, it continuously adapts the difficulty and topic selection to match the user's boundary of competence, reinforced by real-time AI-powered concept explanations.

---

## 2. Problem Statement
NEET preparation requires mastering over 97 chapters across Physics, Chemistry, and Biology. Standard practice test suites serve generic question sequences, which:
1. Waste the student's time on concepts they have already mastered.
2. Under-prepare them in their weak areas.
3. Fail to explain the specific misconceptions leading to incorrect answers.

AdaptiveNEET addresses this by tailoring every session directly to the individual student's performance data.

---

## 3. Core Product Loop
The entire application centers on a single high-efficiency learning loop:
1. **Serve Adaptive Question**: Engine retrieves a question tailored to the user's current topic mastery and target difficulty.
2. **User Solves MCQ**: Student submits their answer choice.
3. **Immediate Evaluation**: System checks correctness and updates statistics.
4. **AI-Powered Review**: The gateway queries the Google Gemini API to explain step-by-step reasoning and resolve misconceptions.
5. **Update State**: Updates local storage stats, recalculates streaks/mastery, and dynamically sequences the next question.

---

## 4. Features

### Adaptive Practice
* **Custom Configurator Modal**: Allows setting subjects, target question counts (5, 10, 15, 20), difficulty limits, and custom topic checklist toggles.
* **Intelligent Difficulty Scaling**: Automatically steps difficulty up or down based on consecutive correctness metrics.

### AI Explanations
* **Concept-Aware Explanations**: Uses a custom Gemini system prompt to break down formulas, mathematical derivations, and wrong-choice analysis.
* **Offline Fallbacks**: Includes pre-templated explanations if the network is unavailable.

### Quiz Mode
* **Timed Mode**: Limits answering time to 45 seconds per question to build speed.
* **Quiz Sprints**: Time-boxed mock sprints (5 minutes or 15 minutes) to practice under pressure.

### Test Mode
* **Mock Exam Simulations**: Standardized mock formats simulating complete NEET papers (coming soon).

### Question Bank
* **Physics DB Expansion**: Dynamic question generator populated with 20 distinct, mathematically formatted, and verified questions for all 23 NEET Physics topics (460 total questions).

### Progress Tracking
* **Detailed Dashboards**: Displays overall accuracy %, daily streaks, solved question metrics, and flagged "Weak Topics".

---

## 5. Product Philosophy
* **Practice-First**: Minimizes onboarding and navigation; gets students solving problems immediately.
* **Fast Reinforcement**: Answers are explained instantly while the student's train of thought is still fresh.
* **Motivation-Oriented**: Positive gamified elements (daily streaks, points, trophy cards) reinforce habit building.

---

## 6. Tech Stack
* **Frontend**: Expo React Native (TypeScript), Tailwind CSS (NativeWind), Zustand (State Management), Expo Router (Navigation).
* **Backend**: Node.js, Express API gateway.
* **Hosting**: Render (Live backend deployment).
* **AI Engine**: Google Gemini API (via `@google/generative-ai` SDK).
* **Build Pipeline**: Expo EAS Build (Android Keystores and APK compilation).

---

## 7. Project Structure
```txt
adaptive-neet/
├── app/                  # Expo Router navigation pages (Home, Practice, Analytics, Settings)
├── backend/              # Node/Express AI gateway server
│   ├── controllers/      # AI prompt handlers
│   ├── app.js            # Express entry file
│   └── package.json
├── components/           # Reusable UI widgets (TopBar, Progress bars, Modals)
├── data/                 # Questions JSON database (Physics, Chemistry, Biology)
├── services/             # Dynamic adaptive engine and API connection scripts
├── store/                # Zustand state stores (useQuizStore, useProgressStore)
├── assets/               # Icon and splash screens
├── eas.json              # EAS build configurations
├── package.json          # Dependency configurations
└── README.md
```

---

## 8. Adaptive Logic
The adaptive question selection resides in [adaptiveEngine.ts](file:///d:/nomad%20archives/vedantu_task/services/adaptiveEngine.ts):
* **Step-Up**: Increases difficulty (Easy ➜ Medium ➜ Hard) only after the user answers **two consecutive questions correctly** on the same topic.
* **Step-Down**: On a wrong answer, the engine instantly drops the difficulty level to keep the user from becoming discouraged.
* **Weak Area Bias**: Applies a **50% probability check** to serve questions targeting identified weak topics to force active revision.
* **Cascade Fallback**: Cascades search filters down from specific topic/difficulty matches to general subject matching so that the solving deck never runs dry.

---

## 9. Installation & Setup

### Prerequisites
* Install Node.js (v18+)
* Install Expo CLI globally: `npm install -g expo-cli`

### 1. Backend Setup
```bash
cd backend
npm install
# Create a .env file and add your Gemini API Key:
# GEMINI_API_KEY="your_api_key"
npm start
```
*The backend runs on port 5000 by default.*

### 2. Frontend Setup
```bash
# From the root directory:
npm install
npm run web
```
*Metro bundler will launch the web client at http://localhost:8081.*

---

## 10. APK Build Instructions
The project is set up with Expo EAS build. To compile the production Android preview APK:
1. Make sure you are logged into EAS CLI: `npx eas-cli login`.
2. Run the build command from the root directory:
   ```bash
   npx eas-cli build -p android --profile preview
   ```
3. Once completed, EAS will output a direct download URL pointing to the compiled `.apk` file.

---

## 11. Demo
* **Live Render API**: `https://vedantu-task.onrender.com`
* **Direct APK Download**: [Download Android App (fPkgdt4FvGX5FhytHeTEEX.apk)](https://expo.dev/artifacts/eas/fPkgdt4FvGX5FhytHeTEEX.apk)
* **Build Details & QR Code**: [Expo EAS Build Log](https://expo.dev/accounts/bhuvanraj05/projects/adaptive-neet/builds/77fbc4ee-3f70-4943-91e2-b2677b5a3953)

---

## 12. Future Scope
* **Spaced Repetition Scheduler**: Systematically re-queuing weak/failed questions at 1, 3, and 7-day intervals.
* **AI Chat Sandbox**: Enabling a chat drawer for students to ask follow-up questions to the Gemini tutor about a solved MCQ.
* **Real-time Peer Battles**: Instant multiplayer speed challenges on common subjects.

---

## 13. AI Tooling Used
* **Antigravity**: Primary agentic AI coding companion for codebase edits, TypeScript compiler checks, and workflow configurations.
* **Google Gemini API**: Dynamic conceptual explanation generator.

---

## 14. Why AdaptiveNEET Matters
Under compressed preparation windows, efficiency is everything. AdaptiveNEET guarantees that every minute spent practicing directly targets the student's highest-yield improvement areas, eliminating passive review and helping them conquer their weak topics before exam day.

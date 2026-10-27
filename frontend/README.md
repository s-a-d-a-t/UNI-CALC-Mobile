# 🎓 UniCalc Ethio Mobile

> **Next-Generation Academic GPA/CGPA Calculator & Analytics Suite for Ethiopian Higher Education**  
> Built with **Expo (React Native)**, **TypeScript**, and **Expo Router**. Designed for high performance, smooth 60 FPS visual analytics, offline-first reliability, and full Ethiopian Ministry of Education (MoE / HERQA) grading compliance.

---

## 📋 Table of Contents
1. [Overview & Core Value](#overview--core-value)
2. [Key Features](#key-features)
3. [Ethiopian University Grading Scale (HERQA Standards)](#ethiopian-university-grading-scale-herqa-standards)
4. [Architecture & Project Structure](#architecture--project-structure)
5. [Visual Analytics Suite](#visual-analytics-suite)
6. [Theme Engine (Light & Dark Mode)](#theme-engine-light--dark-mode)
7. [Getting Started (Local Development)](#getting-started-local-development)
8. [Backend API Integration](#backend-api-integration)
9. [Building Standalone APK (Expo EAS Build)](#building-standalone-apk-expo-eas-build)
10. [Troubleshooting & Common Questions](#troubleshooting--common-questions)

---

## 🌟 Overview & Core Value

**UniCalc Ethio** bridges the gap between traditional web portals and modern mobile experiences for university students across Ethiopia (AAU, ASTU, AASTU, BDU, HU, JU, etc.). 

Most students struggle with complex credit-hour weightings, repeated course policies, academic warning thresholds, and predicting graduation honors. UniCalc Mobile provides an intuitive, high-speed, and offline-capable companion to track semester GPAs, visualize multi-year cumulative trends, and plan academic targets.

---

## ✨ Key Features

- **🏛️ Ethiopian Higher Education Grading**:
  - Full support for the standard 4.0 scale ($A^+, A, A^-, B^+, B, B^-, C^+, C, C^-, D, F, F_x$).
  - Accurate credit-hour multiplication, truncated/rounded GPA formatting.
  - Academic status calculations: *Very Great Distinction*, *Great Distinction*, *Distinction*, *Satisfactory*, *Academic Warning*, and *Dismissal Thresholds*.
- **📊 60 FPS Visual Analytics Suite (Zero-Dependency)**:
  - **Catmull-Rom Spline GPA/CGPA Trend curves**: Smooth mathematical curves linking semester trajectories with target benchmark reference lines ($4.0$, $3.5$, $3.0$, $2.0$).
  - **Grade Distribution Chart**: Interactive breakdown comparing course counts vs. earned credits.
  - **Credit Load vs. GPA Analysis**: Understand term intensity impact on academic performance.
  - **Pass / Fail Completion Ratio**: Real-time academic health progress gauge.
- **🎨 Warm Paper & GitHub Slate Theming**:
  - **Light Mode**: `#FAF6EE` background inspired by warm editorial print.
  - **Dark Mode**: `#0D1117` background inspired by GitHub dark theme for low-light battery conservation.
  - Dedicated one-tap toggle buttons on the landing page, tab bar, and profile screen.
  - Persistent theme state via local storage.
- **🚀 Mobile-First Navigation**:
  - Interactive Landing Page featuring animated hero typography, feature cards, and instant guest/auth entry.
  - Bottom tab navigation: **Dashboard (Overview & Analytics)**, **Semesters (Course Management)**, **Calculator (Target Estimator)**, and **Profile (Settings & Export)**.
- **📱 Standalone APK Cloud Compilation**:
  - Pre-configured EAS build profiles to compile direct, shareable `.apk` packages in the cloud without needing local Android Studio or gigabytes of Android SDK downloads.

---

## 📐 Ethiopian University Grading Scale (HERQA Standards)

UniCalc follows the standard modular curriculum grading policy approved by the Ethiopian Ministry of Education:

| Letter Grade | Mark Range (%) | Grade Points (GP) | Status / Definition |
| :---: | :---: | :---: | :--- |
| **A+** | $90 - 100$ | **4.0** | Excellent / Highest Distinction |
| **A**  | $85 - 89$  | **4.0** | Excellent |
| **A-** | $80 - 84$  | **3.75**| Very Good |
| **B+** | $75 - 79$  | **3.5** | Very Good |
| **B**  | $70 - 74$  | **3.0** | Good |
| **B-** | $65 - 69$  | **2.75**| Good |
| **C+** | $60 - 64$  | **2.5** | Satisfactory |
| **C**  | $50 - 59$  | **2.0** | Satisfactory (Minimum Pass for Major Courses) |
| **C-** | $45 - 49$  | **1.5** | Unsatisfactory |
| **D**  | $40 - 44$  | **1.0** | Very Weak Pass |
| **Fx** | $30 - 39$  | **0.0** | Fail (Eligible for Retest / Supplementary Exam) |
| **F**  | $< 30$     | **0.0** | Complete Fail (Must Repeat Course) |

### Graduation Honors Thresholds
* **Very Great Distinction**: $\text{CGPA} \ge 3.75$ (with no 'F', 'Fx', or 'D' in any semester)
* **Great Distinction**: $3.50 \le \text{CGPA} < 3.75$
* **Distinction**: $3.25 \le \text{CGPA} < 3.50$
* **Pass / Clear Status**: $\text{CGPA} \ge 2.00$ and Semester $\text{GPA} \ge 1.75$ (First Year) / $\ge 2.00$ (Second Year & above)

---

## 🏗️ Architecture & Project Structure

The project is structured cleanly into a decoupled mobile frontend and an API backend:

```
UNI-CALC Mobile/
├── README.md                     # Comprehensive project documentation
├── backend/                      # Node.js / Express API server
│   ├── index.js                  # Main Express entry point & middleware
│   ├── db.js                     # SQLite/Database query abstraction
│   ├── validation.js             # Request validation schemas
│   ├── package.json              # Backend dependencies
│   └── .env                      # Server configuration & port
│
└── frontend/                     # Expo React Native client application
    ├── app/                      # Expo Router File-Based Routing
    │   ├── _layout.tsx           # Root navigation provider, Theme wrapper & Splash
    │   ├── index.tsx             # Root redirect (points directly to /landing)
    │   ├── landing.tsx           # High-impact Mobile Landing Page
    │   ├── modal.tsx             # Pop-up modal screen
    │   └── (tabs)/               # Bottom Tab Navigator
    │       ├── _layout.tsx       # Bottom tabs shell & header controls
    │       ├── index.tsx         # Dashboard Overview & Visual Analytics
    │       ├── semesters.tsx     # Semester & Course CRUD operations
    │       ├── calculator.tsx    # Target GPA Predictor
    │       └── profile.tsx       # User preferences, Theme & Data export
    │
    ├── assets/                   # App icons, splash images & branding
    │   └── images/
    │       ├── logo1.png         # Primary UniCalc Ethio logo
    │       ├── icon.png          # App launcher icon
    │       └── splash-icon.png   # Launch screen visual
    │
    ├── src/
    │   ├── components/           # Reusable UI elements
    │   │   └── charts/           # Pure 60 FPS SVG/Canvas charting suite
    │   │       ├── GpaTrendChart.tsx            # Curvy Catmull-Rom spline trajectory
    │   │       ├── GradeDistributionBarChart.tsx# Letter grade histogram (Count/Credits)
    │   │       ├── CreditLoadGpaChart.tsx       # Credit workload vs. GPA correlation
    │   │       └── PassFailRatioChart.tsx       # Academic completion health bar
    │   ├── context/
    │   │   └── ThemeContext.tsx  # Global light/dark theme provider & persistence
    │   ├── constants/
    │   │   ├── Colors.ts         # Brand palette tokens (Light/Dark)
    │   │   └── EthiopianGrading.ts # HERQA grade-points mapping & constants
    │   ├── api/
    │   │   ├── client.ts         # Axios HTTP client with interceptors
    │   │   └── auth.ts           # Authentication & token management
    │   └── types/                # TypeScript interface definitions
    │
    ├── app.json                  # Expo application configuration & branding
    ├── eas.json                  # Expo Application Services (EAS) build profiles
    ├── .npmrc                    # NPM peer dependency configuration
    ├── package.json              # Client dependencies & scripts
    └── tsconfig.json             # TypeScript compiler settings
```

---

## 📈 Visual Analytics Suite

All charts in UniCalc Mobile are custom-engineered without heavy third-party charting libraries, guaranteeing instant renders, 60 FPS scroll performance, and zero dependency breakages:

1. **`GpaTrendChart.tsx`**:
   - Uses **Catmull-Rom cubic spline interpolation** ($10$ micro-segments per semester interval) to construct smooth, natural curves instead of harsh zigzag lines.
   - Dual-trajectory visualization: Renders both **Term GPA** and **Cumulative CGPA** side-by-side.
   - Interactive touch cards revealing precise semester GPA, credits taken, and cumulative standing.
   - Benchmark threshold lines ($4.0$ Max, $3.5$ Distinction, $2.0$ Pass).

2. **`GradeDistributionBarChart.tsx`**:
   - Vertical bar histogram categorized into Ethiopian grades ($A, B, C, D, F$).
   - Toggle switch between **Course Count** view and **Credit Load** view.

3. **`CreditLoadGpaChart.tsx`**:
   - Proportional bar heights comparing term workload ($15-22+$ credits) with academic yield.

4. **`PassFailRatioChart.tsx`**:
   - High-contrast visual ratio meter displaying successfully completed credits vs. failed or pending credits.

---

## 🌓 Theme Engine (Light & Dark Mode)

UniCalc Mobile features a comprehensive, system-wide theming engine powered by `ThemeContext.tsx`:

- **Brand Light Palette**:
  - Background: `#FAF6EE` (Warm Antique Cream)
  - Surface Card: `#FFFFFF` with `#E8E2D2` soft borders
  - Primary Accent: `#1B4D3E` (Deep Ethiopian Forest Emerald)
  - Secondary Accent: `#D4AF37` (Imperial Gold)
  - Text Primary: `#1A202C`

- **Brand Dark Palette**:
  - Background: `#0D1117` (GitHub Dark Slate)
  - Surface Card: `#161B22` with `#30363D` borders
  - Primary Accent: `#2EA043` (Vibrant Emerald)
  - Secondary Accent: `#F0883E` (Warm Amber)
  - Text Primary: `#F0F6FC`

Theme preference is automatically saved locally to device storage so the user's choice persists across app restarts.

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- **Node.js** ($\ge 20.x$)
- **npm** ($\ge 10.x$)
- **Expo Go** mobile app (available on Google Play Store & Apple App Store)

### 1. Installation
Clone the repository and install client dependencies:
```bash
cd "UNI-CALC Mobile/frontend"
npm install
```

### 2. Run the Development Server
```bash
npx expo start
```
From the interactive terminal:
- Press **`a`** to open on an Android Emulator or connected physical device via USB debugging.
- Press **`w`** to run in a desktop web browser.
- Scan the printed **QR Code** using the **Expo Go** app on your Android phone to load the app instantly over Wi-Fi.

### 3. Running Web Preview Directly
```bash
npm run web
```

### 4. TypeScript Verification
To verify type consistency across all routes and components:
```bash
npx tsc --noEmit
```

---

## 🔌 Backend API Integration

The app includes an optional Node.js Express backend (`/backend`) providing user accounts, secure cloud synchronization, and semester backups.

### Starting the Backend Server
```bash
cd "UNI-CALC Mobile/backend"
npm install
npm start
```
By default, the backend runs on `http://localhost:5000` (or the port defined in `backend/.env`).

### Mobile Network Configuration
When running on a physical phone via Expo Go, replace `localhost` in `frontend/src/api/client.ts` with your computer's local Wi-Fi IP address (e.g., `http://192.168.1.XX:5000/api`).

---

## 📦 Building Standalone APK (Expo EAS Build)

You can compile a standalone, shareable Android `.apk` file using Expo's cloud build infrastructure **without needing Android Studio or local Android SDKs**.

### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

### Step 2: Log In to Expo
```bash
eas login
```
*(If you do not have an Expo account yet, create one for free at [expo.dev](https://expo.dev)).*

### Step 3: Trigger the Cloud APK Build
Ensure all changes are committed to Git, then run from the `frontend` folder:
```bash
cd "UNI-CALC Mobile"
git add .
git commit -m "chore: trigger apk build"

cd frontend
npx eas-cli build -p android --profile preview
```

### Step 4: Download Your APK
1. EAS will display a live build URL in your terminal:
   ```
   See logs: https://expo.dev/accounts/<your-username>/projects/unicalc-mobile/builds/<build-id>
   ```
2. You can safely close your terminal or turn off your computer; the build executes independently on Expo's AWS cloud builders (~8–12 minutes).
3. Once completed, visit the build URL to download the `.apk` or scan the QR code to install it directly on your Android phone.

---

## 🛠️ Troubleshooting & Common Questions

### Q: Why did `./gradlew assembleDebug` fail with `SDK location not found`?
**A**: Local Gradle builds require Android Studio to have downloaded the full Android SDK to `/home/<user>/Android/Sdk`. If you don't want to install gigabytes of SDK tools locally, use **EAS Cloud Build** (`npx eas-cli build -p android --profile preview`), which handles the entire compilation in the cloud.

### Q: Why does EAS Build fail during "Install dependencies"?
**A**: React 19 uses stricter peer dependency validation in clean environments. The project includes `legacy-peer-deps=true` in `frontend/.npmrc` and `"eas-build-pre-install": "npm config set legacy-peer-deps true"` in `package.json` to resolve this automatically.

### Q: How do I change the app icon or splash screen?
**A**: Replace `frontend/assets/images/logo1.png` with your new 1024x1024 PNG logo. The icon is mapped across `icon`, `adaptiveIcon`, and `splash-screen` in `frontend/app.json`.

---

## 📄 License
This project is licensed under the MIT License. Developed for Ethiopian university students.

# 🚨 RapidRelief — Emergency & Disaster Reporting System

**RapidRelief** is a high-performance, rapid emergency and disaster reporting web application. The platform enables citizens to instantly report hazards (such as fires, flash floods, vehicle collisions, and medical emergencies) via live camera captures or file uploads. 

The system leverages the **Gemini 2.5 Flash** vision model to automatically scan snapshots, classify the incident category/severity, write reports to a **MongoDB Atlas** database, and dispatch alerts to connected responder dashboards.

---

## 🌟 Key Features

*   **De-Cluttered Master-Detail Workspace:** A professional, responsive split layout. A compact search-and-filter incident feed on the left (5/12 width) updates a highly detailed command monitor view on the right (7/12 width).
*   **Gemini AI Emergency Scene Analysis:** Snapshots and camera images are converted to base64, proxied through Node, and analyzed by the Python Flask microservice to automatically identify the incident type, threat severity, details description, and recommended response action.
*   **GPS Locator Map Lightbox:** Integrates a toggleable Leaflet map in a modal centered dynamically on the coordinate beacon of the selected emergency.
*   **Google SMTP Responder Passcodes:** Unlocks portal responder features securely via nodemailer-driven 6-digit numeric OTP email verifications with a 60s cooldown limit.
*   **Universal Light / Dark Mode Toggle:** Instantly switches CSS variables, filters, scrollbars, and inputs. Swapping to light mode dynamically disables Leaflet's dark map filters to show standard voyager layouts.
*   **Administrative Route Safeguards:** Locks incident deletions behind an admin security code validator.
*   **Automated Database Seeding:** Populates the MongoDB collections with default mock incidents on start if the database is blank.

---

## 📐 Project Structure & Architecture

```
RapidRelife/
├── frontend/       # React + Vite + Tailwind CSS v4 + Leaflet (Port 5173)
├── backend/        # Node.js + Express + Mongoose + Nodemailer (Port 5000)
└── ai/             # Python + Flask + OpenCV + Google Generative AI (Port 5001)
```

---

## ⚙️ Environment Variables Configuration

Create a `.env` file inside the `backend/` directory:

### Backend Configuration (`backend/.env`)
```properties
PORT=5000
MONGODB_URI="your-mongodb-atlas-connection-string"
JWT_SECRET="your-jwt-signing-secret"

# Secret passcode required to register/login as a System Administrator
ADMIN_CODE="vedugreat"

# Google SMTP Credentials (required for responder email verification)
# Generate a 16-character Google App Password at: https://myaccount.google.com/apppasswords
SMTP_USER="dontstudy09@gmail.com"
SMTP_PASS="wsfouvfmfzmpwykn"
SMTP_FROM="Emergency Support Team <dontstudy09@gmail.com>"
```

### AI Configuration (`ai/.env` or System Environment)
Ensure the `GEMINI_API_KEY` variable is available. The AI service includes a secure fallback key for testing out-of-the-box.
```bash
export GEMINI_API_KEY="your-google-gemini-api-key"
```

---

## 🚀 Installation & Getting Started

Open three separate terminals to start the ecosystem:

### 1. Start the Flask AI Service
```bash
cd ai
# Install required Python dependencies
pip install flask pillow google-generativeai opencv-python

# Launch the service
python app.py
```
*The AI service will run on `http://localhost:5001`.*

### 2. Start the Express Backend
```bash
cd backend
# Install packages (nodemailer, express, mongoose, bcryptjs, cors, etc.)
npm install

# Start the Node server
npm start
```
*The API gateway will launch on `http://localhost:5000`.*

### 3. Start the Vite Frontend
```bash
cd frontend
# Install packages
npm install

# Launch React compiler
npm run dev
```
*The UI panel will run locally on `http://localhost:5173`.*

---

## 📋 End-to-End Test Walkthrough

1.  **Launch all three services** and navigate to `http://localhost:5173/` in your browser.
2.  Click **Portal Login** -> **Register**. Set your role to **System Admin** (passcode: `vedugreat`) and fill in a valid email address.
3.  Check your inbox to receive the styled **6-digit verification code** sent via Gmail SMTP. Enter the passcode on the glassmorphic OTP screen to sign in.
4.  Once inside, click **Report Emergency** on the Navbar.
5.  Upload a disaster photo (e.g. fire, crash) or click **Capture Live Webcam**. 
6.  The **AI Analyzing Emergency Scene** loader will appear while the Gemini model extracts metadata. 
7.  Once resolved, the category, severity level, description, and recommended actions will automatically populate in the form.
8.  Submit the report, and watch the list feed update dynamically across the master-detail workspace!
9.  Click **View Live GPS Location Map** in the Command Monitor to review leafeted maps. Click the **Sun/Moon** button in the header to swap light/dark aesthetics.

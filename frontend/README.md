# NidhiSetu - Frontend Web Application

**NidhiSetu** ("Bridge for Financial Assistance") is a modern, accessible, government-themed portal designed to match marginalized entrepreneurs (with a primary focus on Scheduled Caste beneficiaries) to concessional financial schemes and route them to optimal authorized Channel Partners (SCAs, PSBs, RRBs, NBFC-MFIs).

---

## 🚀 Tech Stack

- **Framework**: Next.js 16+ (App Router, React 19, TypeScript)
- **Styling**: Tailwind CSS v4 + Government Portal CSS Design System
- **Icons**: Lucide React (`lucide-react`)
- **Geospatial Maps**: Leaflet & React-Leaflet (with OpenStreetMap tiles & dynamic client SSR import)
- **Charts & Visualizations**: Recharts
- **Voice Assistance**: Web Speech API (`SpeechRecognition` & `SpeechSynthesis`)

---

## 🛠️ Environment Configuration

Create a `.env.local` file in `frontend/`:

```env
# Toggle between Client-Side Mock Engine and Live Backend API
NEXT_PUBLIC_USE_MOCK_API=true

# Live Backend Base URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

---

## 📡 Backend API Specifications & Data Contracts

The frontend is built with a decoupled API Service Layer (`src/services/apiClient.ts`). Below are the exact endpoint specifications and JSON payload contracts required from the backend service.

---

### 1. Requirements NLP Extraction
**Endpoint:** `POST /api/v1/requirements/extract`

**Description:** Converts natural language text or voice transcript into structured profile parameters.

**Request Payload:**
```json
{
  "prompt": "I want to start a small tailoring business in Jaipur. I need 2 lakh loan and my annual family income is 3 lakh.",
  "language": "en"
}
```

**Response Payload (200 OK):**
```json
{
  "purpose": "Business",
  "business_type": "Tailoring & Garments",
  "project_cost": 220000,
  "loan_required": 200000,
  "family_income": 300000,
  "category": "SC",
  "location": "Jaipur, Rajasthan",
  "pincode": "302001"
}
```

---

### 2. Scheme Eligibility & Recommendation Engine
**Endpoint:** `POST /api/v1/schemes/match`

**Description:** Evaluates an applicant's profile against scheme eligibility rules and returns matching schemes sorted by suitability score with rule evaluation details.

**Request Payload:**
```json
{
  "category": "SC",
  "family_income": 300000,
  "age": 28,
  "education": "High School",
  "project_type": "Micro-Enterprise",
  "project_cost": 220000,
  "loan_required": 200000,
  "pincode": "302001",
  "latitude": 26.9124,
  "longitude": 75.7873
}
```

**Response Payload (200 OK):**
```json
{
  "total_matches": 3,
  "schemes": [
    {
      "id": "SCH-2026-MF01",
      "title": "NSFDC Micro Finance Scheme",
      "department": "Ministry of Social Justice & Empowerment",
      "max_loan": 140000,
      "max_project_cost": 150000,
      "interest_rate": 5.0,
      "moratorium_months": 6,
      "tenure_years": 3,
      "max_financing_percent": 90,
      "suitability_score": 95,
      "eligibility_status": "Eligible",
      "rule_checklist": [
        { "criteria": "Scheduled Caste (SC) Beneficiary", "passed": true },
        { "criteria": "Annual Family Income <= ₹3,00,000", "passed": true },
        { "criteria": "Age between 18 and 50 years", "passed": true },
        { "criteria": "Micro-enterprise Project Type", "passed": true }
      ],
      "why_recommended": "Income and project cost criteria are fully satisfied. Interest rate is concessional at 5% p.a."
    }
  ]
}
```

---

### 3. Scheme-Aware Financial Calculator
**Endpoint:** `POST /api/v1/financial/calculate`

**Description:** Calculates exact loan financing, beneficiary contribution, and estimated EMI based on specific scheme parameters.

**Request Payload:**
```json
{
  "scheme_id": "SCH-2026-MF01",
  "project_cost": 200000,
  "loan_required": 180000,
  "tenure_years": 3,
  "moratorium_months": 6
}
```

**Response Payload (200 OK):**
```json
{
  "project_cost": 200000,
  "eligible_financing": 180000,
  "own_contribution": 20000,
  "financing_percentage": 90,
  "interest_rate": 5.0,
  "tenure_years": 3,
  "moratorium_months": 6,
  "estimated_emi": 5395,
  "total_repayment": 194220,
  "total_interest": 14220
}
```

---

### 4. Channel Partner Search & 6-Factor Ranking Engine
**Endpoint:** `GET /api/v1/partners/search`

**Query Parameters:**
`?scheme_id=SCH-2026-MF01&lat=26.9124&lng=75.7873&radius_km=10`

**Response Payload (200 OK):**
```json
{
  "total_found": 3,
  "partners": [
    {
      "id": "CP-101",
      "name": "Rajasthan Scheduled Castes Development Corp (SCA)",
      "type": "State Channelizing Agency",
      "branch_code": "SCA-JPR-01",
      "address": "Nehru Bazar, Jaipur",
      "latitude": 26.9180,
      "longitude": 75.8150,
      "distance_km": 2.8,
      "suitability_score": 92,
      "score_factors": {
        "scheme_compatibility": 98,
        "availability": 90,
        "distance": 95,
        "processing_performance": 88,
        "reliability": 90,
        "capacity": 85
      },
      "status": "Active Allocation Node",
      "phone": "+91-141-2601122"
    }
  ]
}
```

---

### 5. Application Submission & Tracking
**Endpoint:** `POST /api/v1/applications/submit`

**Request Payload:**
```json
{
  "applicant_name": "Ramesh Kumar",
  "mobile": "9876543210",
  "scheme_id": "SCH-2026-MF01",
  "channel_partner_id": "CP-101",
  "project_cost": 200000,
  "loan_amount": 180000,
  "documents_uploaded": ["Aadhaar", "Income Certificate", "Caste Certificate", "Project Proposal"]
}
```

**Response Payload (201 Created):**
```json
{
  "application_id": "NIDHI-2026-89412",
  "status": "Submitted",
  "submitted_at": "2026-09-03T21:40:00Z",
  "assigned_partner": "Rajasthan Scheduled Castes Development Corp (SCA)",
  "estimated_processing_days": 7
}
```

---

### 6. Admin & National Analytics
**Endpoint:** `GET /api/v1/admin/analytics`

**Response Payload (200 OK):**
```json
{
  "total_applications": 14250,
  "total_sanctioned_amount_lakhs": 2840.5,
  "active_partners": 320,
  "avg_processing_days": 6.2,
  "district_heatmaps": [
    { "district": "Jaipur", "applications": 1240, "sanctioned_lakhs": 248.0 },
    { "district": "Lucknow", "applications": 980, "sanctioned_lakhs": 196.0 }
  ]
}
```

---

## 🏃 Getting Started (Frontend Development)

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

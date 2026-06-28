# NagarNiti

AI-powered civic issue reporting and accountability platform for Bengaluru.

## Overview

NagarNiti helps citizens report civic issues such as potholes, water leaks, garbage overflow, damaged footpaths, or broken streetlights. Users simply upload an image, and AI analyzes the issue, determines its severity and responsible authority, detects recurring hotspots, generates a formal complaint, and guides the user through the official BBMP complaint submission process.


## Features

- AI-powered civic issue detection from images
- Smart issue prioritization based on severity and risk
- Google Maps location integration
- Ward-wise hotspot detection
- Civic intelligence dashboard
- AI-generated formal complaint letters
- Official BBMP Sahaaya submission guidance
- One-click complaint copy
- BBMP helpline integration
- Multi-level escalation planning

## Tech Stack

- React + Vite
- Firebase Firestore
- Groq API (Llama)
- Google Maps JavaScript API
- Google Cloud Run (Deployment)


## Workflow

1. Upload an image of a civic issue.
2. AI analyzes the image and identifies the issue.
3. NagarNiti determines severity, category, authority, and priority.
4. Similar unresolved reports are analyzed to detect hotspots.
5. A formal complaint letter is automatically generated.
6. Users can:
   - Copy the complaint
   - Open the official BBMP Sahaaya portal
   - Call the BBMP helpline (1533)
7. Step-by-step guidance assists users in submitting the complaint through the official BBMP process.

## AI Agents

### Vision Agent
Analyzes uploaded images and identifies the civic issue.

### Reasoning Agent
Evaluates severity, detects recurring issues, identifies hotspots, and assigns priority.

### Complaint Agent
Generates a professional complaint letter ready for submission to BBMP.

## Future Improvements

- Predictive hotspot forecasting
- Integration with official civic APIs (when available)
- Complaint status synchronization
- Analytics for ward-level civic trends

## Deployment

Hosted on **Google Cloud Run**.

# 🚦 AcciPredict: Full-Stack Traffic Risk Analytics PWA
AcciPredict is a **Progressive Web App (PWA)** that leverages Machine Learning to predict and visualize traffic accident risks. It features a complete pipeline from model training in Python to a real-time interactive dashboard served via Node.js.
## 🏗️ Project Architecture
- **Machine Learning:** Python-based training pipeline using `AcciPredict_Model_Training.py` and Jupyter Notebooks.
- **Backend:** Node.js server (`server.js`) handling API requests and data serving.
- **Frontend:** Responsive Vanilla HTML/CSS/JS dashboard with **Service Worker (`sw.js`)** integration for PWA capabilities.
- **Data:** Geospatial mapping generated via `build_map.py` using accident datasets.
## 🚀 Key Features
- **PWA Ready:** Installable on mobile and desktop with offline support via Service Workers.
- **Predictive Analytics:** Real-time risk scoring based on environmental and temporal features.
- **Interactive Mapping:** Geospatial visualization of accident-prone "hotspots."
- **Data-Driven Insights:** Integrated `dataset.csv` processing for historical trend analysis.
## System Architecture

<img width="481" height="430" alt="image" src="https://github.com/user-attachments/assets/37897fe1-9fc8-47cf-8afc-f5dc304840fc" />

## 🛠️ Tech Stack
- **Languages:** JavaScript (ES6+), Python 3.x, HTML5, CSS3
- **Runtime:** Node.js
- **ML Libraries:** Scikit-learn, Pandas, NumPy (trained via `.ipynb`)
- **Web APIs:** Service Workers, Manifest API, Fetch API
## 📂 File Structure Highlights
- `sw.js` & `manifest.json`: Core files for Progressive Web App functionality.
- `server.js`: Node.js backend to bridge the ML insights with the UI.
- `build_map.py`: Script for generating geospatial risk visualizations.
- `AcciPredict_Model_Training.py`: The "brain" of the project where the ML model is refined.
## 📥 Getting Started
1. **Install Dependencies:**
   ```bash
   npm install
Train the Model (Optional):
bash
python AcciPredict_Model_Training.py
Start the Server:
bash
node server.js
Access the Dashboard: Open http://localhost:3000 in your browser.

import csv
import random
import re

coords = {
    "Lucknow": [26.8467, 80.9462], "Jodhpur": [26.2389, 73.0243], "Kanpur": [26.4499, 80.3319],
    "Tirupati": [13.6288, 79.4192], "Bangalore": [12.9716, 77.5946], "Varanasi": [25.3176, 82.9739],
    "Nagpur": [21.1458, 79.0882], "Madurai": [9.9252, 78.1198], "Surat": [21.1702, 72.8311],
    "Mumbai": [19.0760, 72.8777], "Durgapur": [23.5204, 87.3119], "Kolkata": [22.5726, 88.3639],
    "Ahmedabad": [23.0225, 72.5714], "Mangalore": [12.8732, 74.8436], "Vijayawada": [16.5062, 80.6480],
    "Siliguri": [26.7271, 88.3953], "Mysore": [12.2958, 76.6394], "Chennai": [13.0827, 80.2707],
    "Dwarka": [28.5921, 77.0460], "Rohini": [28.7041, 77.1025], "New Delhi": [28.6139, 77.2090],
    "Pune": [18.5204, 73.8567], "Coimbatore": [11.0168, 76.9558], "Jaipur": [26.9124, 75.7873],
    "Udaipur": [24.5854, 73.7125]
}

markers = []
with open('dataset.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        city = row.get("City Name")
        if city in coords:
            markers.append({
                "city": city,
                "state": row.get("State Name"),
                "severity": row.get("Accident Severity"),
                "vehicle": row.get("Vehicle Type Involved"),
                "weather": row.get("Weather Conditions"),
                "lat": coords[city][0],
                "lng": coords[city][1]
            })

js_markers = []
for m in markers[:800]: # Limit to 800 purely so map doesn't freeze
    jitter_lat = m["lat"] + random.uniform(-0.1, 0.1)
    jitter_lng = m["lng"] + random.uniform(-0.1, 0.1)
    
    color = "#3B82F6" # Minor
    if m["severity"] == "Fatal": color = "#EF4444"
    elif m["severity"] == "Serious": color = "#F59E0B"
    
    popup = f"<b>{m['city']}, {m['state']}</b><br>Severity: {m['severity']}<br>Vehicle: {m['vehicle']}<br>Weather: {m['weather']}"
    
    js = f"    L.circle([{jitter_lat:.5f}, {jitter_lng:.5f}], {{ color: '{color}', fillColor: '{color}', fillOpacity: 0.3, radius: {random.randint(1500, 4000)} }}).addTo(map).bindPopup(\"{popup}\");"
    js_markers.append(js)

js_code = """// --- 5. Leaflet Live Map Setup ---
let map;
let mapInitialized = false;

window.addEventListener('load', () => {
    map = L.map('map').setView([22.9074872, 78.65345], 5);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap & CARTO', subdomains: 'abcd', maxZoom: 20
    }).addTo(map);
""" + "\n".join(js_markers) + """
    mapInitialized = true;
});
"""

with open('script.js', 'r') as f:
    content = f.read()

new_content = re.sub(r'// --- 5\. Leaflet Live Map Setup ---.*', js_code, content, flags=re.DOTALL)

with open('script.js', 'w') as f:
    f.write(new_content)

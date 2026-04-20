// Initialize Lucide Icons
lucide.createIcons();

// --- 1. Tab Switching Logic ---
const tabs = document.querySelectorAll('.tab-link');
const views = document.querySelectorAll('.view-section');

tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
        e.preventDefault();
        // Remove active from all tabs and views
        tabs.forEach(t => t.classList.remove('active'));
        views.forEach(v => v.style.display = 'none');
        
        // Set active on clicked
        tab.classList.add('active');
        const targetId = tab.getAttribute('data-target');
        const targetView = document.getElementById(targetId);
        targetView.style.display = (targetId === 'mapView' || targetId === 'dashboardView') ? 'flex' : 'block';

        // IMPORTANT: Leaflet maps need a size invalidate when unhidden
        if (targetId === 'mapView' && mapInitialized) {
            setTimeout(() => { map.invalidateSize(); }, 100);
        }
        
        // Render charts dynamically when dashboard is tapped
        if (targetId === 'dashboardView') {
            renderCharts();
        }
    });
});

// --- 2. Notification Center Toggle ---
const alertsToggle = document.getElementById('alertsToggle');
const notifDropdown = document.getElementById('notificationDropdown');
const alertBadge = document.getElementById('alertBadge');

alertsToggle.addEventListener('click', (e) => {
    e.preventDefault();
    alertsToggle.classList.toggle('open');
    notifDropdown.classList.toggle('show');
});

// Close dropdown if clicked outside
document.addEventListener('click', (e) => {
    if (!alertsToggle.contains(e.target) && !notifDropdown.contains(e.target)) {
        notifDropdown.classList.remove('show');
        alertsToggle.classList.remove('open');
    }
});

// Mark all as read feature (simulation)
document.querySelector('.mark-read').addEventListener('click', () => {
    document.querySelectorAll('.notif-item').forEach(item => {
        item.classList.remove('unread');
    });
    alertBadge.style.display = 'none';
});

// --- 3. Toast Notification System ---
function showToast(title, message) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i data-lucide="check-circle" style="width: 24px; height: 24px;"></i>
        </div>
        <div class="toast-body">
            <h5>${title}</h5>
            <p>${message}</p>
        </div>
    `;
    
    container.appendChild(toast);
    lucide.createIcons(); // render icon
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Animate out after 4 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400); // wait for transition
    }, 4000);
}


// --- 4. Smart Risk Assessment Engine ---
const btnPredict = document.getElementById('runPredictionBtn');

function computeRiskScore() {
    const formSelects = document.querySelectorAll('#predictionForm select');
    const formInputs  = document.querySelectorAll('#predictionForm input[type="number"]');

    const weather   = formSelects[0]?.value || 'Clear';
    const road      = formSelects[1]?.value || 'Dry';
    const lighting  = formSelects[2]?.value || 'Daylight';
    const roadType  = formSelects[3]?.value || 'Urban Road';
    const traffic   = formSelects[4]?.value || 'Signals';
    const locType   = formSelects[5]?.value || 'Straight';
    const gender    = formSelects[6]?.value || 'Male';
    const speed     = parseFloat(formInputs[0]?.value || 60);
    const age       = parseFloat(formInputs[1]?.value || 30);

    let score = 30; // base probability
    const factors = {};

    // Speed contribution
    const speedScore = Math.min(((speed - 40) / 160) * 30, 30);
    factors['Speed Limit'] = speedScore;
    score += speedScore;

    // Weather
    const weatherMap = { 'Clear': 0, 'Hazy': 6, 'Rain': 14, 'Fog': 18 };
    factors['Weather'] = weatherMap[weather] ?? 6;
    score += factors['Weather'];

    // Road condition
    const roadMap = { 'Dry': 0, 'Wet': 10, 'Icy': 18 };
    factors['Road Condition'] = roadMap[road] ?? 0;
    score += factors['Road Condition'];

    // Lighting
    const lightMap = { 'Daylight': 0, 'Dark - lit': 8, 'Dark - unlit': 16 };
    factors['Lighting'] = lightMap[lighting] ?? 8;
    score += factors['Lighting'];

    // Location type
    const locMap = { 'Straight': 0, 'Intersection': 7, 'Curve': 12 };
    factors['Location Type'] = locMap[locType] ?? 4;
    score += factors['Location Type'];

    // Road type
    const rtMap = { 'Urban Road': 2, 'State Highway': 6, 'National Highway': 10 };
    factors['Road Type'] = rtMap[roadType] ?? 4;
    score += factors['Road Type'];

    // Traffic control
    const tcMap = { 'Signals': 0, 'Police': 3, 'None': 10 };
    factors['Traffic Control'] = tcMap[traffic] ?? 3;
    score += factors['Traffic Control'];

    // Age factor (young < 22 or old > 60 = riskier)
    const ageFactor = (age < 22 || age > 60) ? 6 : 0;
    factors['Driver Age'] = ageFactor;
    score += ageFactor;

    score = Math.min(Math.round(score), 97); // cap at 97%

    // Determine severity
    let severity, severityClass, confidence, level, levelClass;
    if (score >= 65) {
        severity = 'FATAL';      severityClass = 'fatal';
        confidence = (78 + Math.random() * 14).toFixed(1);
        level = 'HIGH RISK';     levelClass = 'high';
    } else if (score >= 42) {
        severity = 'SERIOUS';    severityClass = 'serious';
        confidence = (65 + Math.random() * 15).toFixed(1);
        level = 'MEDIUM RISK';   levelClass = 'medium';
    } else {
        severity = 'MINOR';      severityClass = 'minor';
        confidence = (55 + Math.random() * 15).toFixed(1);
        level = 'LOW RISK';      levelClass = 'low';
    }

    return { score, severity, severityClass, confidence, level, levelClass, factors };
}

function showRiskPanel(result) {
    const panel = document.getElementById('riskResultPanel');
    panel.style.display = 'block';
    // re-trigger animation
    panel.style.animation = 'none';
    panel.offsetHeight;
    panel.style.animation = '';

    // Badge
    const badge = document.getElementById('riskLevelBadge');
    badge.textContent = result.level;
    badge.className = `risk-level-badge ${result.levelClass}`;

    // Probability
    const probEl = document.getElementById('riskProbNumber');
    probEl.textContent = `${result.score}%`;
    probEl.className = `risk-prob-number ${result.levelClass}`;

    // Meter
    const meter = document.getElementById('riskMeterFill');
    meter.className = `risk-meter-fill ${result.levelClass}`;
    setTimeout(() => { meter.style.width = `${result.score}%`; }, 50);

    // Severity
    const sevEl = document.getElementById('riskSeverityLabel');
    sevEl.textContent = result.severity;
    sevEl.className = `risk-severity-label ${result.severityClass}`;

    // Confidence
    document.getElementById('riskConfidence').textContent = `Confidence: ${result.confidence}%`;

    // SHAP factors – sort by value descending, show top 4
    const sorted = Object.entries(result.factors)
        .filter(([,v]) => v > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4);

    const maxVal = sorted[0]?.[1] || 1;
    const barColors = ['#8B5CF6','#3B82F6','#EC4899','#F59E0B'];

    const listEl = document.getElementById('riskFactorsList');
    listEl.innerHTML = sorted.map(([name, val], i) => {
        const pct = Math.round((val / maxVal) * 100);
        const shapVal = (val / 100 * 0.35).toFixed(3);
        return `<div class="risk-factor-item">
            <span class="risk-factor-name">${name}</span>
            <div class="risk-factor-bar-track">
                <div class="risk-factor-bar" style="background:${barColors[i]}; width:0%;" data-width="${pct}%"></div>
            </div>
            <span class="risk-factor-val">+${shapVal}</span>
        </div>`;
    }).join('');

    // Animate bars after render
    setTimeout(() => {
        listEl.querySelectorAll('.risk-factor-bar').forEach(bar => {
            bar.style.width = bar.dataset.width;
        });
    }, 80);

    lucide.createIcons();
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

btnPredict.addEventListener('click', () => {
    const originalText = btnPredict.innerHTML;
    btnPredict.innerHTML = `<i data-lucide="loader-2" class="spin-icon"></i> Processing Risk...`;
    if (!document.getElementById('spin-style')) {
        const s = document.createElement('style');
        s.id = 'spin-style';
        s.innerHTML = `.spin-icon{animation:spin 1s linear infinite;}@keyframes spin{100%{transform:rotate(360deg);}}`;
        document.head.appendChild(s);
    }
    lucide.createIcons();

    setTimeout(() => {
        btnPredict.innerHTML = originalText;
        lucide.createIcons();

        const result = computeRiskScore();
        showRiskPanel(result);

        showToast('Risk Assessment Complete', `Severity: ${result.severity} — ${result.score}% probability`);

        // Retrigger SHAP bars
        document.querySelectorAll('.bar').forEach(bar => {
            bar.style.animation = 'none'; bar.offsetHeight; bar.style.animation = null;
        });
    }, 1500);
});

// --- 5. New Features: Export, What-If, Dashboard ---
const btnExport = document.getElementById('btnExport');
if(btnExport) {
    btnExport.addEventListener('click', () => {
        const ogContent = btnExport.innerHTML;
        btnExport.innerHTML = `<i data-lucide="loader-2" class="spin-icon"></i> Compiling...`;
        btnExport.disabled = true;
        lucide.createIcons();
        const target = document.getElementById('predictView');
        btnExport.style.display = 'none'; // hide button from pdf
        
        // Force background color on target (otherwise transparent becomes white in PDF)
        const ogBg = target.style.background;
        const ogPadding = target.style.padding;
        target.style.background = '#0B0F19';
        target.style.padding = '20px';
        target.style.borderRadius = '16px';
        
        const opt = {
            margin:       0.2, // 0.2 inch margin
            filename:     'IncidentReport_2026.pdf',
            image:        { type: 'jpeg', quality: 1.0 },
            html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#0B0F19', scrollY: 0 },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(target).save().then(() => {
            btnExport.style.display = 'flex';
            target.style.background = ogBg;
            target.style.padding = ogPadding;
            btnExport.innerHTML = ogContent;
            btnExport.disabled = false;
            lucide.createIcons();
            showToast("Report Exported", "IncidentReport_2026.pdf downloaded securely.");
        }).catch(err => {
            console.error(err);
            btnExport.style.display = 'flex';
            target.style.background = ogBg;
            target.style.padding = ogPadding;
            btnExport.innerHTML = "Error";
            btnExport.disabled = false;
        });
    });
}

const predictFormInputs = document.querySelectorAll('#predictionForm select, #predictionForm input');
predictFormInputs.forEach(input => {
    input.addEventListener('change', () => {
        const bars = document.querySelectorAll('.bar');
        const values = document.querySelectorAll('.bar-row .value');
        bars.forEach((bar, idx) => {
            const newWidth = Math.floor(Math.random() * 40) + 40; 
            const newValue = (Math.random() * 0.2 + 0.1).toFixed(3);
            bar.style.width = newWidth + '%';
            values[idx].innerText = '+' + newValue;
            bar.style.animation = 'none';
            bar.offsetHeight;
            bar.style.animation = null;
        });
    });
});

let chartsRendered = false;
function renderCharts() {
    if(chartsRendered) return;
    chartsRendered = true;
    
    new Chart(document.getElementById('trendChart'), {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Accidents',
                data: [420, 380, 510, 490, 600, 750, 820, 710, 650, 580, 480, 510],
                borderColor: '#8B5CF6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                borderWidth: 2, fill: true, tension: 0.4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748B' } }, x: { grid: { display: false }, ticks: { color: '#64748B' } } } }
    });
    
    new Chart(document.getElementById('severityChart'), {
        type: 'doughnut',
        data: {
            labels: ['Minor', 'Serious', 'Fatal'],
            datasets: [{
                data: [34, 33, 33],
                backgroundColor: ['#3B82F6', '#F59E0B', '#EF4444'],
                borderWidth: 0
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { position: 'right', labels: { color: '#94A3B8' } } } }
    });

    new Chart(document.getElementById('vehicleChart'), {
        type: 'bar',
        data: {
            labels: ['2-Wheeler', 'Car', 'Truck', 'Bus', 'Walking', 'Cycle'],
            datasets: [{
                data: [1250, 980, 610, 420, 310, 250],
                backgroundColor: '#3B82F6',
                borderRadius: 4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748B' } }, x: { grid: { display: false }, ticks: { color: '#64748B' } } } }
    });
}

// --- 6. Leaflet Live Map Setup ---
let map;
let mapInitialized = false;

window.addEventListener('load', () => {
    map = L.map('map').setView([22.9074872, 78.65345], 5);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap & CARTO', subdomains: 'abcd', maxZoom: 20
    }).addTo(map);
    L.circle([26.78355, 80.88559], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2387 }).addTo(map).bindPopup("<b>Lucknow, Uttar Pradesh</b><br>Severity: Minor<br>Vehicle: Truck<br>Weather: Hazy");
    L.circle([26.89074, 80.84937], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2814 }).addTo(map).bindPopup("<b>Lucknow, Uttar Pradesh</b><br>Severity: Minor<br>Vehicle: Bus<br>Weather: Rainy");
    L.circle([26.17981, 72.93552], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3908 }).addTo(map).bindPopup("<b>Jodhpur, Rajasthan</b><br>Severity: Fatal<br>Vehicle: Truck<br>Weather: Clear");
    L.circle([26.18641, 72.93267], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2700 }).addTo(map).bindPopup("<b>Jodhpur, Rajasthan</b><br>Severity: Fatal<br>Vehicle: Car<br>Weather: Foggy");
    L.circle([26.51977, 80.41292], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2118 }).addTo(map).bindPopup("<b>Kanpur, Uttar Pradesh</b><br>Severity: Fatal<br>Vehicle: Bus<br>Weather: Clear");
    L.circle([13.54839, 79.51280], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2246 }).addTo(map).bindPopup("<b>Tirupati, Andhra Pradesh</b><br>Severity: Minor<br>Vehicle: Cycle<br>Weather: Rainy");
    L.circle([13.01958, 77.63250], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3092 }).addTo(map).bindPopup("<b>Bangalore, Karnataka</b><br>Severity: Fatal<br>Vehicle: Car<br>Weather: Hazy");
    L.circle([25.31112, 82.88441], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2656 }).addTo(map).bindPopup("<b>Varanasi, Uttar Pradesh</b><br>Severity: Fatal<br>Vehicle: Two-Wheeler<br>Weather: Clear");
    L.circle([21.19105, 78.99120], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3544 }).addTo(map).bindPopup("<b>Nagpur, Maharashtra</b><br>Severity: Serious<br>Vehicle: Cycle<br>Weather: Foggy");
    L.circle([9.89081, 78.19696], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2407 }).addTo(map).bindPopup("<b>Madurai, Tamil Nadu</b><br>Severity: Fatal<br>Vehicle: Auto-Rickshaw<br>Weather: Stormy");
    L.circle([25.23774, 82.89926], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1749 }).addTo(map).bindPopup("<b>Varanasi, Uttar Pradesh</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Hazy");
    L.circle([21.26664, 72.75924], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3661 }).addTo(map).bindPopup("<b>Surat, Gujarat</b><br>Severity: Fatal<br>Vehicle: Car<br>Weather: Stormy");
    L.circle([26.92185, 80.89009], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2887 }).addTo(map).bindPopup("<b>Lucknow, Uttar Pradesh</b><br>Severity: Fatal<br>Vehicle: Bus<br>Weather: Clear");
    L.circle([19.00335, 72.93130], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3015 }).addTo(map).bindPopup("<b>Mumbai, Maharashtra</b><br>Severity: Serious<br>Vehicle: Bus<br>Weather: Hazy");
    L.circle([23.51909, 87.37965], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2136 }).addTo(map).bindPopup("<b>Durgapur, West Bengal</b><br>Severity: Serious<br>Vehicle: Cycle<br>Weather: Hazy");
    L.circle([21.17446, 72.91964], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2960 }).addTo(map).bindPopup("<b>Surat, Gujarat</b><br>Severity: Serious<br>Vehicle: Auto-Rickshaw<br>Weather: Foggy");
    L.circle([22.51667, 88.38348], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3538 }).addTo(map).bindPopup("<b>Kolkata, West Bengal</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Clear");
    L.circle([22.53066, 88.37302], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2851 }).addTo(map).bindPopup("<b>Kolkata, West Bengal</b><br>Severity: Serious<br>Vehicle: Cycle<br>Weather: Rainy");
    L.circle([13.06177, 77.53211], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2269 }).addTo(map).bindPopup("<b>Bangalore, Karnataka</b><br>Severity: Minor<br>Vehicle: Truck<br>Weather: Rainy");
    L.circle([23.60890, 87.30656], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1926 }).addTo(map).bindPopup("<b>Durgapur, West Bengal</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Foggy");
    L.circle([22.94251, 72.66519], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3965 }).addTo(map).bindPopup("<b>Ahmedabad, Gujarat</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Hazy");
    L.circle([22.96823, 72.59223], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1707 }).addTo(map).bindPopup("<b>Ahmedabad, Gujarat</b><br>Severity: Fatal<br>Vehicle: Two-Wheeler<br>Weather: Rainy");
    L.circle([26.48016, 80.39528], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2710 }).addTo(map).bindPopup("<b>Kanpur, Uttar Pradesh</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Rainy");
    L.circle([12.89526, 74.81150], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2438 }).addTo(map).bindPopup("<b>Mangalore, Karnataka</b><br>Severity: Serious<br>Vehicle: Bus<br>Weather: Hazy");
    L.circle([26.78019, 88.38258], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1810 }).addTo(map).bindPopup("<b>Siliguri, West Bengal</b><br>Severity: Fatal<br>Vehicle: Cycle<br>Weather: Rainy");
    L.circle([16.53970, 80.70392], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2021 }).addTo(map).bindPopup("<b>Vijayawada, Andhra Pradesh</b><br>Severity: Minor<br>Vehicle: Pedestrian<br>Weather: Clear");
    L.circle([12.29973, 76.65026], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2255 }).addTo(map).bindPopup("<b>Mysore, Karnataka</b><br>Severity: Minor<br>Vehicle: Bus<br>Weather: Stormy");
    L.circle([28.54889, 77.13728], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2711 }).addTo(map).bindPopup("<b>Dwarka, Delhi</b><br>Severity: Serious<br>Vehicle: Two-Wheeler<br>Weather: Rainy");
    L.circle([21.19832, 79.17828], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2199 }).addTo(map).bindPopup("<b>Nagpur, Maharashtra</b><br>Severity: Minor<br>Vehicle: Car<br>Weather: Hazy");
    L.circle([21.21548, 79.00882], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2725 }).addTo(map).bindPopup("<b>Nagpur, Maharashtra</b><br>Severity: Fatal<br>Vehicle: Two-Wheeler<br>Weather: Hazy");
    L.circle([26.92206, 80.97672], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2906 }).addTo(map).bindPopup("<b>Lucknow, Uttar Pradesh</b><br>Severity: Minor<br>Vehicle: Car<br>Weather: Clear");
    L.circle([22.94116, 72.62170], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1929 }).addTo(map).bindPopup("<b>Ahmedabad, Gujarat</b><br>Severity: Serious<br>Vehicle: Two-Wheeler<br>Weather: Rainy");
    L.circle([12.30411, 76.70370], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2032 }).addTo(map).bindPopup("<b>Mysore, Karnataka</b><br>Severity: Fatal<br>Vehicle: Car<br>Weather: Foggy");
    L.circle([13.64098, 79.47454], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3701 }).addTo(map).bindPopup("<b>Tirupati, Andhra Pradesh</b><br>Severity: Serious<br>Vehicle: Cycle<br>Weather: Rainy");
    L.circle([12.22466, 76.66419], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2050 }).addTo(map).bindPopup("<b>Mysore, Karnataka</b><br>Severity: Serious<br>Vehicle: Auto-Rickshaw<br>Weather: Stormy");
    L.circle([12.90537, 74.88088], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3189 }).addTo(map).bindPopup("<b>Mangalore, Karnataka</b><br>Severity: Fatal<br>Vehicle: Bus<br>Weather: Rainy");
    L.circle([13.06585, 80.23973], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2400 }).addTo(map).bindPopup("<b>Chennai, Tamil Nadu</b><br>Severity: Minor<br>Vehicle: Bus<br>Weather: Hazy");
    L.circle([28.73298, 77.01754], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3287 }).addTo(map).bindPopup("<b>Rohini, Delhi</b><br>Severity: Fatal<br>Vehicle: Bus<br>Weather: Stormy");
    L.circle([22.57699, 88.29759], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2002 }).addTo(map).bindPopup("<b>Kolkata, West Bengal</b><br>Severity: Serious<br>Vehicle: Bus<br>Weather: Rainy");
    L.circle([13.11206, 80.21801], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2134 }).addTo(map).bindPopup("<b>Chennai, Tamil Nadu</b><br>Severity: Serious<br>Vehicle: Two-Wheeler<br>Weather: Rainy");
    L.circle([12.87164, 77.49845], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3458 }).addTo(map).bindPopup("<b>Bangalore, Karnataka</b><br>Severity: Serious<br>Vehicle: Cycle<br>Weather: Rainy");
    L.circle([21.05753, 79.12891], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3196 }).addTo(map).bindPopup("<b>Nagpur, Maharashtra</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Clear");
    L.circle([12.86054, 74.77392], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1566 }).addTo(map).bindPopup("<b>Mangalore, Karnataka</b><br>Severity: Serious<br>Vehicle: Two-Wheeler<br>Weather: Rainy");
    L.circle([10.01471, 78.04188], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3821 }).addTo(map).bindPopup("<b>Madurai, Tamil Nadu</b><br>Severity: Minor<br>Vehicle: Truck<br>Weather: Hazy");
    L.circle([12.97982, 77.58937], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3583 }).addTo(map).bindPopup("<b>Bangalore, Karnataka</b><br>Severity: Fatal<br>Vehicle: Two-Wheeler<br>Weather: Rainy");
    L.circle([22.93376, 72.55307], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2322 }).addTo(map).bindPopup("<b>Ahmedabad, Gujarat</b><br>Severity: Fatal<br>Vehicle: Car<br>Weather: Stormy");
    L.circle([13.12839, 80.36894], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2180 }).addTo(map).bindPopup("<b>Chennai, Tamil Nadu</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Hazy");
    L.circle([28.55730, 77.23326], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2337 }).addTo(map).bindPopup("<b>New Delhi, Delhi</b><br>Severity: Serious<br>Vehicle: Pedestrian<br>Weather: Clear");
    L.circle([24.66441, 73.72626], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3921 }).addTo(map).bindPopup("<b>Udaipur, Rajasthan</b><br>Severity: Serious<br>Vehicle: Auto-Rickshaw<br>Weather: Stormy");
    L.circle([26.76026, 81.00603], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2285 }).addTo(map).bindPopup("<b>Lucknow, Uttar Pradesh</b><br>Severity: Minor<br>Vehicle: Car<br>Weather: Stormy");
    L.circle([11.06020, 76.95210], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1561 }).addTo(map).bindPopup("<b>Coimbatore, Tamil Nadu</b><br>Severity: Fatal<br>Vehicle: Cycle<br>Weather: Foggy");
    L.circle([12.82068, 74.87938], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1637 }).addTo(map).bindPopup("<b>Mangalore, Karnataka</b><br>Severity: Fatal<br>Vehicle: Cycle<br>Weather: Rainy");
    L.circle([28.58410, 77.12793], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2928 }).addTo(map).bindPopup("<b>New Delhi, Delhi</b><br>Severity: Minor<br>Vehicle: Bus<br>Weather: Foggy");
    L.circle([28.63235, 77.13968], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2700 }).addTo(map).bindPopup("<b>Rohini, Delhi</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Rainy");
    L.circle([26.74874, 88.39220], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3167 }).addTo(map).bindPopup("<b>Siliguri, West Bengal</b><br>Severity: Serious<br>Vehicle: Auto-Rickshaw<br>Weather: Stormy");
    L.circle([23.58816, 87.31145], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3079 }).addTo(map).bindPopup("<b>Durgapur, West Bengal</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Clear");
    L.circle([24.62511, 73.76375], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3657 }).addTo(map).bindPopup("<b>Udaipur, Rajasthan</b><br>Severity: Minor<br>Vehicle: Car<br>Weather: Clear");
    L.circle([24.50048, 73.72227], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3898 }).addTo(map).bindPopup("<b>Udaipur, Rajasthan</b><br>Severity: Serious<br>Vehicle: Car<br>Weather: Hazy");
    L.circle([28.58687, 77.30374], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3040 }).addTo(map).bindPopup("<b>New Delhi, Delhi</b><br>Severity: Serious<br>Vehicle: Pedestrian<br>Weather: Clear");
    L.circle([13.08809, 80.24000], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2829 }).addTo(map).bindPopup("<b>Chennai, Tamil Nadu</b><br>Severity: Minor<br>Vehicle: Pedestrian<br>Weather: Foggy");
    L.circle([22.99065, 72.59418], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3952 }).addTo(map).bindPopup("<b>Ahmedabad, Gujarat</b><br>Severity: Fatal<br>Vehicle: Cycle<br>Weather: Hazy");
    L.circle([25.32226, 83.04529], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3760 }).addTo(map).bindPopup("<b>Varanasi, Uttar Pradesh</b><br>Severity: Serious<br>Vehicle: Car<br>Weather: Stormy");
    L.circle([12.90481, 74.77146], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2089 }).addTo(map).bindPopup("<b>Mangalore, Karnataka</b><br>Severity: Fatal<br>Vehicle: Cycle<br>Weather: Hazy");
    L.circle([18.53336, 73.89990], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2527 }).addTo(map).bindPopup("<b>Pune, Maharashtra</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Stormy");
    L.circle([19.04941, 72.90247], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2706 }).addTo(map).bindPopup("<b>Mumbai, Maharashtra</b><br>Severity: Serious<br>Vehicle: Two-Wheeler<br>Weather: Hazy");
    L.circle([28.58259, 77.12249], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3452 }).addTo(map).bindPopup("<b>New Delhi, Delhi</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Stormy");
    L.circle([12.25897, 76.62663], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3762 }).addTo(map).bindPopup("<b>Mysore, Karnataka</b><br>Severity: Serious<br>Vehicle: Two-Wheeler<br>Weather: Clear");
    L.circle([23.04151, 72.59126], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1965 }).addTo(map).bindPopup("<b>Ahmedabad, Gujarat</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Foggy");
    L.circle([26.91985, 81.02251], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2489 }).addTo(map).bindPopup("<b>Lucknow, Uttar Pradesh</b><br>Severity: Serious<br>Vehicle: Bus<br>Weather: Clear");
    L.circle([22.54005, 88.26584], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2742 }).addTo(map).bindPopup("<b>Kolkata, West Bengal</b><br>Severity: Fatal<br>Vehicle: Auto-Rickshaw<br>Weather: Hazy");
    L.circle([12.36299, 76.60162], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3351 }).addTo(map).bindPopup("<b>Mysore, Karnataka</b><br>Severity: Serious<br>Vehicle: Auto-Rickshaw<br>Weather: Hazy");
    L.circle([22.60426, 88.30294], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1773 }).addTo(map).bindPopup("<b>Kolkata, West Bengal</b><br>Severity: Fatal<br>Vehicle: Car<br>Weather: Foggy");
    L.circle([12.95092, 77.52433], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3462 }).addTo(map).bindPopup("<b>Bangalore, Karnataka</b><br>Severity: Serious<br>Vehicle: Two-Wheeler<br>Weather: Clear");
    L.circle([26.25765, 73.00271], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3750 }).addTo(map).bindPopup("<b>Jodhpur, Rajasthan</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Clear");
    L.circle([12.89311, 77.59210], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2343 }).addTo(map).bindPopup("<b>Bangalore, Karnataka</b><br>Severity: Fatal<br>Vehicle: Auto-Rickshaw<br>Weather: Clear");
    L.circle([10.01165, 78.07846], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3631 }).addTo(map).bindPopup("<b>Madurai, Tamil Nadu</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Clear");
    L.circle([26.74785, 88.30567], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2767 }).addTo(map).bindPopup("<b>Siliguri, West Bengal</b><br>Severity: Fatal<br>Vehicle: Truck<br>Weather: Stormy");
    L.circle([26.76677, 88.31668], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3948 }).addTo(map).bindPopup("<b>Siliguri, West Bengal</b><br>Severity: Fatal<br>Vehicle: Car<br>Weather: Foggy");
    L.circle([11.05147, 77.04094], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3057 }).addTo(map).bindPopup("<b>Coimbatore, Tamil Nadu</b><br>Severity: Fatal<br>Vehicle: Bus<br>Weather: Clear");
    L.circle([18.97979, 72.81434], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2420 }).addTo(map).bindPopup("<b>Mumbai, Maharashtra</b><br>Severity: Minor<br>Vehicle: Car<br>Weather: Hazy");
    L.circle([18.60410, 73.78769], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3629 }).addTo(map).bindPopup("<b>Pune, Maharashtra</b><br>Severity: Fatal<br>Vehicle: Bus<br>Weather: Foggy");
    L.circle([16.59326, 80.61358], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2002 }).addTo(map).bindPopup("<b>Vijayawada, Andhra Pradesh</b><br>Severity: Serious<br>Vehicle: Cycle<br>Weather: Hazy");
    L.circle([28.65385, 77.29076], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2328 }).addTo(map).bindPopup("<b>New Delhi, Delhi</b><br>Severity: Minor<br>Vehicle: Pedestrian<br>Weather: Stormy");
    L.circle([21.09568, 72.78437], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3901 }).addTo(map).bindPopup("<b>Surat, Gujarat</b><br>Severity: Minor<br>Vehicle: Pedestrian<br>Weather: Clear");
    L.circle([13.70955, 79.35481], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3832 }).addTo(map).bindPopup("<b>Tirupati, Andhra Pradesh</b><br>Severity: Fatal<br>Vehicle: Cycle<br>Weather: Stormy");
    L.circle([24.59836, 73.68582], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3404 }).addTo(map).bindPopup("<b>Udaipur, Rajasthan</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Rainy");
    L.circle([13.70435, 79.38410], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3094 }).addTo(map).bindPopup("<b>Tirupati, Andhra Pradesh</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Stormy");
    L.circle([22.61293, 88.26413], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2778 }).addTo(map).bindPopup("<b>Kolkata, West Bengal</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Hazy");
    L.circle([26.77867, 88.49180], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3898 }).addTo(map).bindPopup("<b>Siliguri, West Bengal</b><br>Severity: Fatal<br>Vehicle: Bus<br>Weather: Hazy");
    L.circle([23.54854, 87.22214], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2828 }).addTo(map).bindPopup("<b>Durgapur, West Bengal</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Foggy");
    L.circle([28.61643, 77.11399], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2125 }).addTo(map).bindPopup("<b>Dwarka, Delhi</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Foggy");
    L.circle([21.23530, 72.88439], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3210 }).addTo(map).bindPopup("<b>Surat, Gujarat</b><br>Severity: Minor<br>Vehicle: Cycle<br>Weather: Clear");
    L.circle([22.65313, 88.40433], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3522 }).addTo(map).bindPopup("<b>Kolkata, West Bengal</b><br>Severity: Fatal<br>Vehicle: Car<br>Weather: Hazy");
    L.circle([21.16339, 79.05637], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3999 }).addTo(map).bindPopup("<b>Nagpur, Maharashtra</b><br>Severity: Fatal<br>Vehicle: Cycle<br>Weather: Clear");
    L.circle([21.08339, 79.16777], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2674 }).addTo(map).bindPopup("<b>Nagpur, Maharashtra</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Stormy");
    L.circle([12.78000, 74.83029], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3044 }).addTo(map).bindPopup("<b>Mangalore, Karnataka</b><br>Severity: Serious<br>Vehicle: Cycle<br>Weather: Stormy");
    L.circle([12.85600, 74.78233], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3425 }).addTo(map).bindPopup("<b>Mangalore, Karnataka</b><br>Severity: Serious<br>Vehicle: Bus<br>Weather: Hazy");
    L.circle([18.52724, 73.78880], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3225 }).addTo(map).bindPopup("<b>Pune, Maharashtra</b><br>Severity: Fatal<br>Vehicle: Truck<br>Weather: Foggy");
    L.circle([9.91427, 78.08783], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2834 }).addTo(map).bindPopup("<b>Madurai, Tamil Nadu</b><br>Severity: Minor<br>Vehicle: Truck<br>Weather: Rainy");
    L.circle([28.67208, 77.19410], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3995 }).addTo(map).bindPopup("<b>New Delhi, Delhi</b><br>Severity: Serious<br>Vehicle: Two-Wheeler<br>Weather: Hazy");
    L.circle([12.99098, 77.57793], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2781 }).addTo(map).bindPopup("<b>Bangalore, Karnataka</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Clear");
    L.circle([21.16475, 79.12629], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2040 }).addTo(map).bindPopup("<b>Nagpur, Maharashtra</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Rainy");
    L.circle([28.59697, 77.28904], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2708 }).addTo(map).bindPopup("<b>New Delhi, Delhi</b><br>Severity: Minor<br>Vehicle: Bus<br>Weather: Hazy");
    L.circle([28.65317, 77.07927], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1833 }).addTo(map).bindPopup("<b>Rohini, Delhi</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Rainy");
    L.circle([19.05109, 72.84501], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1914 }).addTo(map).bindPopup("<b>Mumbai, Maharashtra</b><br>Severity: Serious<br>Vehicle: Two-Wheeler<br>Weather: Hazy");
    L.circle([10.97594, 76.94940], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3617 }).addTo(map).bindPopup("<b>Coimbatore, Tamil Nadu</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Hazy");
    L.circle([24.61152, 73.62447], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2820 }).addTo(map).bindPopup("<b>Udaipur, Rajasthan</b><br>Severity: Serious<br>Vehicle: Car<br>Weather: Rainy");
    L.circle([13.71859, 79.45895], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3966 }).addTo(map).bindPopup("<b>Tirupati, Andhra Pradesh</b><br>Severity: Minor<br>Vehicle: Pedestrian<br>Weather: Stormy");
    L.circle([28.76967, 77.04404], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2348 }).addTo(map).bindPopup("<b>Rohini, Delhi</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Foggy");
    L.circle([22.96208, 72.51228], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1699 }).addTo(map).bindPopup("<b>Ahmedabad, Gujarat</b><br>Severity: Serious<br>Vehicle: Cycle<br>Weather: Rainy");
    L.circle([28.69083, 77.01867], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1895 }).addTo(map).bindPopup("<b>Rohini, Delhi</b><br>Severity: Fatal<br>Vehicle: Two-Wheeler<br>Weather: Stormy");
    L.circle([25.39899, 82.94147], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3237 }).addTo(map).bindPopup("<b>Varanasi, Uttar Pradesh</b><br>Severity: Fatal<br>Vehicle: Cycle<br>Weather: Stormy");
    L.circle([28.51574, 77.09766], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2795 }).addTo(map).bindPopup("<b>Dwarka, Delhi</b><br>Severity: Serious<br>Vehicle: Two-Wheeler<br>Weather: Hazy");
    L.circle([9.92924, 78.13048], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2657 }).addTo(map).bindPopup("<b>Madurai, Tamil Nadu</b><br>Severity: Fatal<br>Vehicle: Cycle<br>Weather: Hazy");
    L.circle([26.77671, 80.93628], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3014 }).addTo(map).bindPopup("<b>Lucknow, Uttar Pradesh</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Rainy");
    L.circle([13.07099, 80.20666], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2465 }).addTo(map).bindPopup("<b>Chennai, Tamil Nadu</b><br>Severity: Serious<br>Vehicle: Auto-Rickshaw<br>Weather: Hazy");
    L.circle([12.25548, 76.64714], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1848 }).addTo(map).bindPopup("<b>Mysore, Karnataka</b><br>Severity: Minor<br>Vehicle: Truck<br>Weather: Foggy");
    L.circle([16.45742, 80.61495], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2764 }).addTo(map).bindPopup("<b>Vijayawada, Andhra Pradesh</b><br>Severity: Serious<br>Vehicle: Cycle<br>Weather: Foggy");
    L.circle([24.63046, 73.79067], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2179 }).addTo(map).bindPopup("<b>Udaipur, Rajasthan</b><br>Severity: Fatal<br>Vehicle: Two-Wheeler<br>Weather: Hazy");
    L.circle([26.15343, 72.94000], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3941 }).addTo(map).bindPopup("<b>Jodhpur, Rajasthan</b><br>Severity: Serious<br>Vehicle: Auto-Rickshaw<br>Weather: Rainy");
    L.circle([22.51332, 88.27553], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2630 }).addTo(map).bindPopup("<b>Kolkata, West Bengal</b><br>Severity: Minor<br>Vehicle: Cycle<br>Weather: Stormy");
    L.circle([26.77665, 88.33921], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3920 }).addTo(map).bindPopup("<b>Siliguri, West Bengal</b><br>Severity: Fatal<br>Vehicle: Two-Wheeler<br>Weather: Hazy");
    L.circle([24.66312, 73.71722], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3432 }).addTo(map).bindPopup("<b>Udaipur, Rajasthan</b><br>Severity: Serious<br>Vehicle: Cycle<br>Weather: Rainy");
    L.circle([13.03133, 77.49840], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2371 }).addTo(map).bindPopup("<b>Bangalore, Karnataka</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Rainy");
    L.circle([12.79097, 74.87301], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3252 }).addTo(map).bindPopup("<b>Mangalore, Karnataka</b><br>Severity: Minor<br>Vehicle: Truck<br>Weather: Rainy");
    L.circle([28.61090, 77.03332], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2723 }).addTo(map).bindPopup("<b>Dwarka, Delhi</b><br>Severity: Serious<br>Vehicle: Auto-Rickshaw<br>Weather: Clear");
    L.circle([24.65068, 73.66054], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1824 }).addTo(map).bindPopup("<b>Udaipur, Rajasthan</b><br>Severity: Fatal<br>Vehicle: Two-Wheeler<br>Weather: Foggy");
    L.circle([25.22917, 83.02251], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3490 }).addTo(map).bindPopup("<b>Varanasi, Uttar Pradesh</b><br>Severity: Minor<br>Vehicle: Truck<br>Weather: Rainy");
    L.circle([19.13236, 72.97673], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2234 }).addTo(map).bindPopup("<b>Mumbai, Maharashtra</b><br>Severity: Serious<br>Vehicle: Bus<br>Weather: Stormy");
    L.circle([25.37567, 82.90087], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2681 }).addTo(map).bindPopup("<b>Varanasi, Uttar Pradesh</b><br>Severity: Fatal<br>Vehicle: Truck<br>Weather: Rainy");
    L.circle([21.11764, 79.01436], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2483 }).addTo(map).bindPopup("<b>Nagpur, Maharashtra</b><br>Severity: Serious<br>Vehicle: Pedestrian<br>Weather: Rainy");
    L.circle([18.51099, 73.92547], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3989 }).addTo(map).bindPopup("<b>Pune, Maharashtra</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Rainy");
    L.circle([21.20996, 72.90932], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3748 }).addTo(map).bindPopup("<b>Surat, Gujarat</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Clear");
    L.circle([21.23889, 72.88083], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1573 }).addTo(map).bindPopup("<b>Surat, Gujarat</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Stormy");
    L.circle([26.65327, 88.32970], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1765 }).addTo(map).bindPopup("<b>Siliguri, West Bengal</b><br>Severity: Serious<br>Vehicle: Bus<br>Weather: Foggy");
    L.circle([21.07625, 72.82813], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2693 }).addTo(map).bindPopup("<b>Surat, Gujarat</b><br>Severity: Serious<br>Vehicle: Car<br>Weather: Stormy");
    L.circle([24.54523, 73.65548], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2319 }).addTo(map).bindPopup("<b>Udaipur, Rajasthan</b><br>Severity: Serious<br>Vehicle: Pedestrian<br>Weather: Hazy");
    L.circle([26.39314, 80.33658], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3607 }).addTo(map).bindPopup("<b>Kanpur, Uttar Pradesh</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Stormy");
    L.circle([18.51713, 73.77645], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2220 }).addTo(map).bindPopup("<b>Pune, Maharashtra</b><br>Severity: Fatal<br>Vehicle: Car<br>Weather: Foggy");
    L.circle([26.79071, 81.03768], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3821 }).addTo(map).bindPopup("<b>Lucknow, Uttar Pradesh</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Foggy");
    L.circle([26.70445, 88.29838], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1947 }).addTo(map).bindPopup("<b>Siliguri, West Bengal</b><br>Severity: Fatal<br>Vehicle: Auto-Rickshaw<br>Weather: Stormy");
    L.circle([21.12193, 72.85882], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2150 }).addTo(map).bindPopup("<b>Surat, Gujarat</b><br>Severity: Serious<br>Vehicle: Bus<br>Weather: Clear");
    L.circle([10.92437, 76.99345], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3177 }).addTo(map).bindPopup("<b>Coimbatore, Tamil Nadu</b><br>Severity: Serious<br>Vehicle: Auto-Rickshaw<br>Weather: Stormy");
    L.circle([10.00925, 78.18378], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3194 }).addTo(map).bindPopup("<b>Madurai, Tamil Nadu</b><br>Severity: Fatal<br>Vehicle: Auto-Rickshaw<br>Weather: Clear");
    L.circle([22.94334, 72.57865], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3773 }).addTo(map).bindPopup("<b>Ahmedabad, Gujarat</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Stormy");
    L.circle([28.60595, 77.04390], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1987 }).addTo(map).bindPopup("<b>Dwarka, Delhi</b><br>Severity: Serious<br>Vehicle: Pedestrian<br>Weather: Rainy");
    L.circle([26.16514, 73.02288], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2672 }).addTo(map).bindPopup("<b>Jodhpur, Rajasthan</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Foggy");
    L.circle([26.63752, 88.44801], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1855 }).addTo(map).bindPopup("<b>Siliguri, West Bengal</b><br>Severity: Fatal<br>Vehicle: Bus<br>Weather: Stormy");
    L.circle([13.00332, 80.23370], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1918 }).addTo(map).bindPopup("<b>Chennai, Tamil Nadu</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Hazy");
    L.circle([24.61308, 73.68499], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2544 }).addTo(map).bindPopup("<b>Udaipur, Rajasthan</b><br>Severity: Fatal<br>Vehicle: Auto-Rickshaw<br>Weather: Hazy");
    L.circle([18.48238, 73.83487], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2769 }).addTo(map).bindPopup("<b>Pune, Maharashtra</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Clear");
    L.circle([26.99901, 75.86531], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2921 }).addTo(map).bindPopup("<b>Jaipur, Rajasthan</b><br>Severity: Serious<br>Vehicle: Car<br>Weather: Rainy");
    L.circle([28.52382, 77.07726], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1774 }).addTo(map).bindPopup("<b>Dwarka, Delhi</b><br>Severity: Serious<br>Vehicle: Cycle<br>Weather: Stormy");
    L.circle([11.05048, 77.02600], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2097 }).addTo(map).bindPopup("<b>Coimbatore, Tamil Nadu</b><br>Severity: Serious<br>Vehicle: Auto-Rickshaw<br>Weather: Clear");
    L.circle([23.06894, 72.65120], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2777 }).addTo(map).bindPopup("<b>Ahmedabad, Gujarat</b><br>Severity: Serious<br>Vehicle: Bus<br>Weather: Foggy");
    L.circle([9.86702, 78.19775], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2839 }).addTo(map).bindPopup("<b>Madurai, Tamil Nadu</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Rainy");
    L.circle([19.04216, 72.95014], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2787 }).addTo(map).bindPopup("<b>Mumbai, Maharashtra</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Stormy");
    L.circle([12.89623, 74.86996], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2492 }).addTo(map).bindPopup("<b>Mangalore, Karnataka</b><br>Severity: Minor<br>Vehicle: Truck<br>Weather: Rainy");
    L.circle([26.78417, 81.03468], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2618 }).addTo(map).bindPopup("<b>Lucknow, Uttar Pradesh</b><br>Severity: Minor<br>Vehicle: Pedestrian<br>Weather: Hazy");
    L.circle([22.52431, 88.29341], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2427 }).addTo(map).bindPopup("<b>Kolkata, West Bengal</b><br>Severity: Minor<br>Vehicle: Bus<br>Weather: Rainy");
    L.circle([9.89961, 78.03266], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2170 }).addTo(map).bindPopup("<b>Madurai, Tamil Nadu</b><br>Severity: Serious<br>Vehicle: Two-Wheeler<br>Weather: Hazy");
    L.circle([26.27769, 72.99242], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3086 }).addTo(map).bindPopup("<b>Jodhpur, Rajasthan</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Stormy");
    L.circle([21.18978, 72.83299], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1703 }).addTo(map).bindPopup("<b>Surat, Gujarat</b><br>Severity: Serious<br>Vehicle: Bus<br>Weather: Stormy");
    L.circle([9.84429, 78.13101], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3591 }).addTo(map).bindPopup("<b>Madurai, Tamil Nadu</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Foggy");
    L.circle([28.52584, 77.07142], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3302 }).addTo(map).bindPopup("<b>Dwarka, Delhi</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Foggy");
    L.circle([26.52190, 80.36066], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2844 }).addTo(map).bindPopup("<b>Kanpur, Uttar Pradesh</b><br>Severity: Fatal<br>Vehicle: Two-Wheeler<br>Weather: Hazy");
    L.circle([28.65693, 77.04567], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3719 }).addTo(map).bindPopup("<b>Dwarka, Delhi</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Stormy");
    L.circle([22.95733, 72.60812], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3172 }).addTo(map).bindPopup("<b>Ahmedabad, Gujarat</b><br>Severity: Fatal<br>Vehicle: Car<br>Weather: Foggy");
    L.circle([26.14042, 73.02537], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2797 }).addTo(map).bindPopup("<b>Jodhpur, Rajasthan</b><br>Severity: Fatal<br>Vehicle: Cycle<br>Weather: Hazy");
    L.circle([13.62075, 79.39722], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1660 }).addTo(map).bindPopup("<b>Tirupati, Andhra Pradesh</b><br>Severity: Serious<br>Vehicle: Car<br>Weather: Hazy");
    L.circle([23.49721, 87.32016], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2923 }).addTo(map).bindPopup("<b>Durgapur, West Bengal</b><br>Severity: Fatal<br>Vehicle: Bus<br>Weather: Foggy");
    L.circle([16.59785, 80.60920], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2447 }).addTo(map).bindPopup("<b>Vijayawada, Andhra Pradesh</b><br>Severity: Fatal<br>Vehicle: Car<br>Weather: Stormy");
    L.circle([13.66456, 79.44314], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2251 }).addTo(map).bindPopup("<b>Tirupati, Andhra Pradesh</b><br>Severity: Fatal<br>Vehicle: Cycle<br>Weather: Hazy");
    L.circle([12.21198, 76.64294], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2910 }).addTo(map).bindPopup("<b>Mysore, Karnataka</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Hazy");
    L.circle([25.37583, 82.92416], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3758 }).addTo(map).bindPopup("<b>Varanasi, Uttar Pradesh</b><br>Severity: Fatal<br>Vehicle: Truck<br>Weather: Stormy");
    L.circle([26.93229, 75.88613], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2825 }).addTo(map).bindPopup("<b>Jaipur, Rajasthan</b><br>Severity: Minor<br>Vehicle: Car<br>Weather: Stormy");
    L.circle([12.28339, 76.66105], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2560 }).addTo(map).bindPopup("<b>Mysore, Karnataka</b><br>Severity: Minor<br>Vehicle: Cycle<br>Weather: Clear");
    L.circle([26.78154, 81.03965], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3884 }).addTo(map).bindPopup("<b>Lucknow, Uttar Pradesh</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Clear");
    L.circle([26.80934, 80.97996], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1500 }).addTo(map).bindPopup("<b>Lucknow, Uttar Pradesh</b><br>Severity: Serious<br>Vehicle: Pedestrian<br>Weather: Clear");
    L.circle([12.79773, 74.79194], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1744 }).addTo(map).bindPopup("<b>Mangalore, Karnataka</b><br>Severity: Serious<br>Vehicle: Cycle<br>Weather: Hazy");
    L.circle([23.02369, 72.54227], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1798 }).addTo(map).bindPopup("<b>Ahmedabad, Gujarat</b><br>Severity: Fatal<br>Vehicle: Two-Wheeler<br>Weather: Foggy");
    L.circle([11.07700, 76.97974], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2456 }).addTo(map).bindPopup("<b>Coimbatore, Tamil Nadu</b><br>Severity: Fatal<br>Vehicle: Cycle<br>Weather: Clear");
    L.circle([13.67830, 79.32226], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1956 }).addTo(map).bindPopup("<b>Tirupati, Andhra Pradesh</b><br>Severity: Fatal<br>Vehicle: Cycle<br>Weather: Hazy");
    L.circle([25.31061, 83.01596], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3492 }).addTo(map).bindPopup("<b>Varanasi, Uttar Pradesh</b><br>Severity: Fatal<br>Vehicle: Truck<br>Weather: Foggy");
    L.circle([23.60179, 87.39141], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1747 }).addTo(map).bindPopup("<b>Durgapur, West Bengal</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Stormy");
    L.circle([26.67007, 88.34896], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1712 }).addTo(map).bindPopup("<b>Siliguri, West Bengal</b><br>Severity: Fatal<br>Vehicle: Car<br>Weather: Rainy");
    L.circle([28.72707, 77.02119], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3009 }).addTo(map).bindPopup("<b>Rohini, Delhi</b><br>Severity: Fatal<br>Vehicle: Cycle<br>Weather: Stormy");
    L.circle([22.93305, 72.55768], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3658 }).addTo(map).bindPopup("<b>Ahmedabad, Gujarat</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Rainy");
    L.circle([12.24892, 76.66895], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2810 }).addTo(map).bindPopup("<b>Mysore, Karnataka</b><br>Severity: Minor<br>Vehicle: Truck<br>Weather: Stormy");
    L.circle([26.31169, 72.93564], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2659 }).addTo(map).bindPopup("<b>Jodhpur, Rajasthan</b><br>Severity: Serious<br>Vehicle: Cycle<br>Weather: Stormy");
    L.circle([13.64935, 79.34116], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2947 }).addTo(map).bindPopup("<b>Tirupati, Andhra Pradesh</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Clear");
    L.circle([11.10642, 77.01344], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2958 }).addTo(map).bindPopup("<b>Coimbatore, Tamil Nadu</b><br>Severity: Serious<br>Vehicle: Auto-Rickshaw<br>Weather: Hazy");
    L.circle([18.57948, 73.80657], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3096 }).addTo(map).bindPopup("<b>Pune, Maharashtra</b><br>Severity: Serious<br>Vehicle: Cycle<br>Weather: Rainy");
    L.circle([12.78162, 74.75610], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3009 }).addTo(map).bindPopup("<b>Mangalore, Karnataka</b><br>Severity: Serious<br>Vehicle: Bus<br>Weather: Foggy");
    L.circle([16.44741, 80.63928], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3059 }).addTo(map).bindPopup("<b>Vijayawada, Andhra Pradesh</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Foggy");
    L.circle([26.92765, 75.71957], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2866 }).addTo(map).bindPopup("<b>Jaipur, Rajasthan</b><br>Severity: Minor<br>Vehicle: Car<br>Weather: Rainy");
    L.circle([21.23183, 72.84145], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2418 }).addTo(map).bindPopup("<b>Surat, Gujarat</b><br>Severity: Fatal<br>Vehicle: Cycle<br>Weather: Rainy");
    L.circle([12.20590, 76.62872], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3441 }).addTo(map).bindPopup("<b>Mysore, Karnataka</b><br>Severity: Fatal<br>Vehicle: Two-Wheeler<br>Weather: Foggy");
    L.circle([22.53852, 88.28483], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3383 }).addTo(map).bindPopup("<b>Kolkata, West Bengal</b><br>Severity: Serious<br>Vehicle: Two-Wheeler<br>Weather: Foggy");
    L.circle([28.51673, 77.22490], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1608 }).addTo(map).bindPopup("<b>New Delhi, Delhi</b><br>Severity: Fatal<br>Vehicle: Cycle<br>Weather: Stormy");
    L.circle([26.77027, 88.31636], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1590 }).addTo(map).bindPopup("<b>Siliguri, West Bengal</b><br>Severity: Minor<br>Vehicle: Pedestrian<br>Weather: Foggy");
    L.circle([22.54809, 88.40701], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1689 }).addTo(map).bindPopup("<b>Kolkata, West Bengal</b><br>Severity: Minor<br>Vehicle: Car<br>Weather: Hazy");
    L.circle([12.38451, 76.67597], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3206 }).addTo(map).bindPopup("<b>Mysore, Karnataka</b><br>Severity: Minor<br>Vehicle: Car<br>Weather: Stormy");
    L.circle([28.61637, 77.08679], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2186 }).addTo(map).bindPopup("<b>Dwarka, Delhi</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Hazy");
    L.circle([28.54158, 77.22689], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3757 }).addTo(map).bindPopup("<b>New Delhi, Delhi</b><br>Severity: Fatal<br>Vehicle: Cycle<br>Weather: Foggy");
    L.circle([22.50626, 88.46137], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1845 }).addTo(map).bindPopup("<b>Kolkata, West Bengal</b><br>Severity: Fatal<br>Vehicle: Two-Wheeler<br>Weather: Clear");
    L.circle([23.43459, 87.24749], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2397 }).addTo(map).bindPopup("<b>Durgapur, West Bengal</b><br>Severity: Minor<br>Vehicle: Bus<br>Weather: Hazy");
    L.circle([28.65105, 77.15265], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3406 }).addTo(map).bindPopup("<b>New Delhi, Delhi</b><br>Severity: Serious<br>Vehicle: Cycle<br>Weather: Hazy");
    L.circle([9.85270, 78.02455], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3394 }).addTo(map).bindPopup("<b>Madurai, Tamil Nadu</b><br>Severity: Serious<br>Vehicle: Two-Wheeler<br>Weather: Stormy");
    L.circle([18.55169, 73.77631], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2077 }).addTo(map).bindPopup("<b>Pune, Maharashtra</b><br>Severity: Fatal<br>Vehicle: Cycle<br>Weather: Hazy");
    L.circle([13.69718, 79.36972], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2027 }).addTo(map).bindPopup("<b>Tirupati, Andhra Pradesh</b><br>Severity: Serious<br>Vehicle: Bus<br>Weather: Stormy");
    L.circle([10.00575, 78.08330], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2057 }).addTo(map).bindPopup("<b>Madurai, Tamil Nadu</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Foggy");
    L.circle([25.28731, 82.97846], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3551 }).addTo(map).bindPopup("<b>Varanasi, Uttar Pradesh</b><br>Severity: Minor<br>Vehicle: Pedestrian<br>Weather: Foggy");
    L.circle([12.96604, 77.58184], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2084 }).addTo(map).bindPopup("<b>Bangalore, Karnataka</b><br>Severity: Minor<br>Vehicle: Pedestrian<br>Weather: Stormy");
    L.circle([28.73827, 77.00374], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2173 }).addTo(map).bindPopup("<b>Rohini, Delhi</b><br>Severity: Serious<br>Vehicle: Bus<br>Weather: Rainy");
    L.circle([28.66616, 77.11996], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3399 }).addTo(map).bindPopup("<b>Dwarka, Delhi</b><br>Severity: Serious<br>Vehicle: Two-Wheeler<br>Weather: Foggy");
    L.circle([26.75236, 88.49000], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3417 }).addTo(map).bindPopup("<b>Siliguri, West Bengal</b><br>Severity: Minor<br>Vehicle: Pedestrian<br>Weather: Rainy");
    L.circle([22.56888, 88.34285], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2859 }).addTo(map).bindPopup("<b>Kolkata, West Bengal</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Hazy");
    L.circle([18.56742, 73.94549], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3353 }).addTo(map).bindPopup("<b>Pune, Maharashtra</b><br>Severity: Minor<br>Vehicle: Pedestrian<br>Weather: Rainy");
    L.circle([24.56988, 73.66985], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1914 }).addTo(map).bindPopup("<b>Udaipur, Rajasthan</b><br>Severity: Fatal<br>Vehicle: Cycle<br>Weather: Foggy");
    L.circle([22.99910, 72.59209], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2941 }).addTo(map).bindPopup("<b>Ahmedabad, Gujarat</b><br>Severity: Fatal<br>Vehicle: Auto-Rickshaw<br>Weather: Foggy");
    L.circle([18.52806, 73.94427], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2401 }).addTo(map).bindPopup("<b>Pune, Maharashtra</b><br>Severity: Minor<br>Vehicle: Car<br>Weather: Rainy");
    L.circle([21.13056, 72.74147], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2075 }).addTo(map).bindPopup("<b>Surat, Gujarat</b><br>Severity: Fatal<br>Vehicle: Two-Wheeler<br>Weather: Clear");
    L.circle([22.57364, 88.40614], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3111 }).addTo(map).bindPopup("<b>Kolkata, West Bengal</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Stormy");
    L.circle([18.59926, 73.86760], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3598 }).addTo(map).bindPopup("<b>Pune, Maharashtra</b><br>Severity: Fatal<br>Vehicle: Car<br>Weather: Stormy");
    L.circle([9.99495, 78.19256], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3136 }).addTo(map).bindPopup("<b>Madurai, Tamil Nadu</b><br>Severity: Minor<br>Vehicle: Pedestrian<br>Weather: Hazy");
    L.circle([11.03835, 76.88805], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3860 }).addTo(map).bindPopup("<b>Coimbatore, Tamil Nadu</b><br>Severity: Fatal<br>Vehicle: Bus<br>Weather: Hazy");
    L.circle([13.55140, 79.38089], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2837 }).addTo(map).bindPopup("<b>Tirupati, Andhra Pradesh</b><br>Severity: Minor<br>Vehicle: Pedestrian<br>Weather: Stormy");
    L.circle([11.01479, 76.97917], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2205 }).addTo(map).bindPopup("<b>Coimbatore, Tamil Nadu</b><br>Severity: Minor<br>Vehicle: Truck<br>Weather: Stormy");
    L.circle([28.72863, 77.01228], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3324 }).addTo(map).bindPopup("<b>Rohini, Delhi</b><br>Severity: Serious<br>Vehicle: Auto-Rickshaw<br>Weather: Clear");
    L.circle([26.94250, 81.03263], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3449 }).addTo(map).bindPopup("<b>Lucknow, Uttar Pradesh</b><br>Severity: Minor<br>Vehicle: Pedestrian<br>Weather: Clear");
    L.circle([25.34225, 83.04781], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1979 }).addTo(map).bindPopup("<b>Varanasi, Uttar Pradesh</b><br>Severity: Serious<br>Vehicle: Cycle<br>Weather: Clear");
    L.circle([12.93965, 77.49556], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2081 }).addTo(map).bindPopup("<b>Bangalore, Karnataka</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Stormy");
    L.circle([21.08666, 72.75275], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2306 }).addTo(map).bindPopup("<b>Surat, Gujarat</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Hazy");
    L.circle([28.59960, 77.02696], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1723 }).addTo(map).bindPopup("<b>Dwarka, Delhi</b><br>Severity: Serious<br>Vehicle: Car<br>Weather: Hazy");
    L.circle([21.15975, 72.83224], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1526 }).addTo(map).bindPopup("<b>Surat, Gujarat</b><br>Severity: Minor<br>Vehicle: Bus<br>Weather: Stormy");
    L.circle([21.20825, 72.86914], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1525 }).addTo(map).bindPopup("<b>Surat, Gujarat</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Rainy");
    L.circle([28.60392, 77.13873], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3910 }).addTo(map).bindPopup("<b>Dwarka, Delhi</b><br>Severity: Minor<br>Vehicle: Pedestrian<br>Weather: Stormy");
    L.circle([28.54635, 77.06418], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2132 }).addTo(map).bindPopup("<b>Dwarka, Delhi</b><br>Severity: Minor<br>Vehicle: Truck<br>Weather: Rainy");
    L.circle([26.37304, 80.42473], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3848 }).addTo(map).bindPopup("<b>Kanpur, Uttar Pradesh</b><br>Severity: Minor<br>Vehicle: Truck<br>Weather: Rainy");
    L.circle([28.58528, 77.24664], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1908 }).addTo(map).bindPopup("<b>New Delhi, Delhi</b><br>Severity: Serious<br>Vehicle: Car<br>Weather: Clear");
    L.circle([21.12905, 79.16936], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2841 }).addTo(map).bindPopup("<b>Nagpur, Maharashtra</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Clear");
    L.circle([9.91015, 78.03788], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3268 }).addTo(map).bindPopup("<b>Madurai, Tamil Nadu</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Foggy");
    L.circle([9.82841, 78.14323], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2002 }).addTo(map).bindPopup("<b>Madurai, Tamil Nadu</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Clear");
    L.circle([28.57377, 77.17302], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1915 }).addTo(map).bindPopup("<b>New Delhi, Delhi</b><br>Severity: Fatal<br>Vehicle: Car<br>Weather: Rainy");
    L.circle([22.62250, 88.40139], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3117 }).addTo(map).bindPopup("<b>Kolkata, West Bengal</b><br>Severity: Minor<br>Vehicle: Cycle<br>Weather: Hazy");
    L.circle([26.89240, 80.97392], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3812 }).addTo(map).bindPopup("<b>Lucknow, Uttar Pradesh</b><br>Severity: Serious<br>Vehicle: Two-Wheeler<br>Weather: Rainy");
    L.circle([28.71625, 77.14710], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1642 }).addTo(map).bindPopup("<b>Rohini, Delhi</b><br>Severity: Serious<br>Vehicle: Bus<br>Weather: Rainy");
    L.circle([12.85301, 74.79236], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1945 }).addTo(map).bindPopup("<b>Mangalore, Karnataka</b><br>Severity: Fatal<br>Vehicle: Bus<br>Weather: Clear");
    L.circle([12.77804, 74.90349], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2273 }).addTo(map).bindPopup("<b>Mangalore, Karnataka</b><br>Severity: Serious<br>Vehicle: Two-Wheeler<br>Weather: Clear");
    L.circle([21.16964, 72.79119], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3851 }).addTo(map).bindPopup("<b>Surat, Gujarat</b><br>Severity: Serious<br>Vehicle: Pedestrian<br>Weather: Rainy");
    L.circle([26.94606, 75.87109], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3983 }).addTo(map).bindPopup("<b>Jaipur, Rajasthan</b><br>Severity: Minor<br>Vehicle: Bus<br>Weather: Rainy");
    L.circle([9.88313, 78.20232], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1594 }).addTo(map).bindPopup("<b>Madurai, Tamil Nadu</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Clear");
    L.circle([12.23428, 76.61055], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3440 }).addTo(map).bindPopup("<b>Mysore, Karnataka</b><br>Severity: Fatal<br>Vehicle: Car<br>Weather: Hazy");
    L.circle([28.51406, 77.03807], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3413 }).addTo(map).bindPopup("<b>Dwarka, Delhi</b><br>Severity: Fatal<br>Vehicle: Two-Wheeler<br>Weather: Rainy");
    L.circle([26.76347, 88.48645], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1719 }).addTo(map).bindPopup("<b>Siliguri, West Bengal</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Hazy");
    L.circle([18.53558, 73.86365], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1833 }).addTo(map).bindPopup("<b>Pune, Maharashtra</b><br>Severity: Fatal<br>Vehicle: Auto-Rickshaw<br>Weather: Stormy");
    L.circle([26.53632, 80.23941], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3980 }).addTo(map).bindPopup("<b>Kanpur, Uttar Pradesh</b><br>Severity: Fatal<br>Vehicle: Car<br>Weather: Stormy");
    L.circle([22.97083, 72.64187], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1870 }).addTo(map).bindPopup("<b>Ahmedabad, Gujarat</b><br>Severity: Minor<br>Vehicle: Bus<br>Weather: Rainy");
    L.circle([25.26646, 83.05585], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1976 }).addTo(map).bindPopup("<b>Varanasi, Uttar Pradesh</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Rainy");
    L.circle([21.14597, 78.99028], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3502 }).addTo(map).bindPopup("<b>Nagpur, Maharashtra</b><br>Severity: Minor<br>Vehicle: Truck<br>Weather: Clear");
    L.circle([26.41733, 80.32494], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3142 }).addTo(map).bindPopup("<b>Kanpur, Uttar Pradesh</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Stormy");
    L.circle([26.33470, 72.96790], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3094 }).addTo(map).bindPopup("<b>Jodhpur, Rajasthan</b><br>Severity: Fatal<br>Vehicle: Truck<br>Weather: Foggy");
    L.circle([21.17232, 72.77635], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1899 }).addTo(map).bindPopup("<b>Surat, Gujarat</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Hazy");
    L.circle([26.44009, 80.42073], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1575 }).addTo(map).bindPopup("<b>Kanpur, Uttar Pradesh</b><br>Severity: Fatal<br>Vehicle: Cycle<br>Weather: Clear");
    L.circle([19.13381, 72.93101], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3168 }).addTo(map).bindPopup("<b>Mumbai, Maharashtra</b><br>Severity: Serious<br>Vehicle: Car<br>Weather: Foggy");
    L.circle([12.80223, 74.86997], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2645 }).addTo(map).bindPopup("<b>Mangalore, Karnataka</b><br>Severity: Minor<br>Vehicle: Cycle<br>Weather: Foggy");
    L.circle([28.59861, 77.29100], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3476 }).addTo(map).bindPopup("<b>New Delhi, Delhi</b><br>Severity: Fatal<br>Vehicle: Truck<br>Weather: Rainy");
    L.circle([26.19388, 72.97974], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3450 }).addTo(map).bindPopup("<b>Jodhpur, Rajasthan</b><br>Severity: Serious<br>Vehicle: Bus<br>Weather: Hazy");
    L.circle([26.54546, 80.31393], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3867 }).addTo(map).bindPopup("<b>Kanpur, Uttar Pradesh</b><br>Severity: Serious<br>Vehicle: Pedestrian<br>Weather: Rainy");
    L.circle([26.15954, 72.95034], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3939 }).addTo(map).bindPopup("<b>Jodhpur, Rajasthan</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Stormy");
    L.circle([26.83555, 80.91511], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1941 }).addTo(map).bindPopup("<b>Lucknow, Uttar Pradesh</b><br>Severity: Serious<br>Vehicle: Car<br>Weather: Rainy");
    L.circle([26.94277, 80.98076], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1629 }).addTo(map).bindPopup("<b>Lucknow, Uttar Pradesh</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Foggy");
    L.circle([12.29554, 76.59671], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1618 }).addTo(map).bindPopup("<b>Mysore, Karnataka</b><br>Severity: Fatal<br>Vehicle: Two-Wheeler<br>Weather: Foggy");
    L.circle([21.25321, 72.90537], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1880 }).addTo(map).bindPopup("<b>Surat, Gujarat</b><br>Severity: Fatal<br>Vehicle: Truck<br>Weather: Rainy");
    L.circle([28.59226, 77.10874], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3751 }).addTo(map).bindPopup("<b>Dwarka, Delhi</b><br>Severity: Serious<br>Vehicle: Pedestrian<br>Weather: Rainy");
    L.circle([9.94686, 78.11847], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3492 }).addTo(map).bindPopup("<b>Madurai, Tamil Nadu</b><br>Severity: Fatal<br>Vehicle: Two-Wheeler<br>Weather: Rainy");
    L.circle([28.67705, 77.10732], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1960 }).addTo(map).bindPopup("<b>Dwarka, Delhi</b><br>Severity: Fatal<br>Vehicle: Bus<br>Weather: Stormy");
    L.circle([28.63852, 76.97346], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1604 }).addTo(map).bindPopup("<b>Dwarka, Delhi</b><br>Severity: Fatal<br>Vehicle: Car<br>Weather: Foggy");
    L.circle([11.10015, 76.92990], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3460 }).addTo(map).bindPopup("<b>Coimbatore, Tamil Nadu</b><br>Severity: Fatal<br>Vehicle: Bus<br>Weather: Rainy");
    L.circle([16.47711, 80.62619], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2787 }).addTo(map).bindPopup("<b>Vijayawada, Andhra Pradesh</b><br>Severity: Fatal<br>Vehicle: Cycle<br>Weather: Foggy");
    L.circle([21.07559, 72.84543], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3011 }).addTo(map).bindPopup("<b>Surat, Gujarat</b><br>Severity: Minor<br>Vehicle: Bus<br>Weather: Hazy");
    L.circle([18.51390, 73.80552], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2494 }).addTo(map).bindPopup("<b>Pune, Maharashtra</b><br>Severity: Fatal<br>Vehicle: Truck<br>Weather: Rainy");
    L.circle([16.53104, 80.70564], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3180 }).addTo(map).bindPopup("<b>Vijayawada, Andhra Pradesh</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Rainy");
    L.circle([12.38667, 76.60667], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2155 }).addTo(map).bindPopup("<b>Mysore, Karnataka</b><br>Severity: Fatal<br>Vehicle: Two-Wheeler<br>Weather: Clear");
    L.circle([23.59547, 87.30290], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1677 }).addTo(map).bindPopup("<b>Durgapur, West Bengal</b><br>Severity: Fatal<br>Vehicle: Bus<br>Weather: Stormy");
    L.circle([12.28510, 76.55302], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1509 }).addTo(map).bindPopup("<b>Mysore, Karnataka</b><br>Severity: Serious<br>Vehicle: Cycle<br>Weather: Foggy");
    L.circle([13.11858, 80.29093], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1669 }).addTo(map).bindPopup("<b>Chennai, Tamil Nadu</b><br>Severity: Fatal<br>Vehicle: Truck<br>Weather: Rainy");
    L.circle([28.63041, 77.10526], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2311 }).addTo(map).bindPopup("<b>Rohini, Delhi</b><br>Severity: Serious<br>Vehicle: Car<br>Weather: Hazy");
    L.circle([28.73385, 77.02231], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2707 }).addTo(map).bindPopup("<b>Rohini, Delhi</b><br>Severity: Minor<br>Vehicle: Cycle<br>Weather: Clear");
    L.circle([21.16368, 79.16659], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2303 }).addTo(map).bindPopup("<b>Nagpur, Maharashtra</b><br>Severity: Serious<br>Vehicle: Cycle<br>Weather: Foggy");
    L.circle([16.47766, 80.72577], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3792 }).addTo(map).bindPopup("<b>Vijayawada, Andhra Pradesh</b><br>Severity: Serious<br>Vehicle: Cycle<br>Weather: Hazy");
    L.circle([26.41204, 80.33822], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2715 }).addTo(map).bindPopup("<b>Kanpur, Uttar Pradesh</b><br>Severity: Serious<br>Vehicle: Auto-Rickshaw<br>Weather: Stormy");
    L.circle([26.87145, 75.71228], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2810 }).addTo(map).bindPopup("<b>Jaipur, Rajasthan</b><br>Severity: Fatal<br>Vehicle: Two-Wheeler<br>Weather: Hazy");
    L.circle([28.50976, 76.96028], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3748 }).addTo(map).bindPopup("<b>Dwarka, Delhi</b><br>Severity: Serious<br>Vehicle: Bus<br>Weather: Stormy");
    L.circle([18.47302, 73.85413], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2851 }).addTo(map).bindPopup("<b>Pune, Maharashtra</b><br>Severity: Serious<br>Vehicle: Car<br>Weather: Stormy");
    L.circle([28.54910, 76.95458], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1653 }).addTo(map).bindPopup("<b>Dwarka, Delhi</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Rainy");
    L.circle([19.09799, 72.88586], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2818 }).addTo(map).bindPopup("<b>Mumbai, Maharashtra</b><br>Severity: Serious<br>Vehicle: Car<br>Weather: Clear");
    L.circle([26.80338, 88.45812], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2783 }).addTo(map).bindPopup("<b>Siliguri, West Bengal</b><br>Severity: Serious<br>Vehicle: Bus<br>Weather: Stormy");
    L.circle([13.00775, 77.64640], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3743 }).addTo(map).bindPopup("<b>Bangalore, Karnataka</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Clear");
    L.circle([23.44850, 87.28158], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2990 }).addTo(map).bindPopup("<b>Durgapur, West Bengal</b><br>Severity: Minor<br>Vehicle: Bus<br>Weather: Stormy");
    L.circle([26.77635, 88.43583], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2172 }).addTo(map).bindPopup("<b>Siliguri, West Bengal</b><br>Severity: Serious<br>Vehicle: Cycle<br>Weather: Rainy");
    L.circle([12.30422, 76.67791], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2298 }).addTo(map).bindPopup("<b>Mysore, Karnataka</b><br>Severity: Minor<br>Vehicle: Car<br>Weather: Foggy");
    L.circle([28.71545, 77.17123], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2404 }).addTo(map).bindPopup("<b>Rohini, Delhi</b><br>Severity: Minor<br>Vehicle: Bus<br>Weather: Stormy");
    L.circle([12.36481, 76.66256], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1817 }).addTo(map).bindPopup("<b>Mysore, Karnataka</b><br>Severity: Minor<br>Vehicle: Bus<br>Weather: Stormy");
    L.circle([22.98374, 72.64505], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3813 }).addTo(map).bindPopup("<b>Ahmedabad, Gujarat</b><br>Severity: Minor<br>Vehicle: Cycle<br>Weather: Hazy");
    L.circle([26.79822, 88.37484], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3440 }).addTo(map).bindPopup("<b>Siliguri, West Bengal</b><br>Severity: Serious<br>Vehicle: Auto-Rickshaw<br>Weather: Rainy");
    L.circle([13.65368, 79.38896], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2614 }).addTo(map).bindPopup("<b>Tirupati, Andhra Pradesh</b><br>Severity: Fatal<br>Vehicle: Truck<br>Weather: Clear");
    L.circle([26.91840, 80.94660], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2768 }).addTo(map).bindPopup("<b>Lucknow, Uttar Pradesh</b><br>Severity: Fatal<br>Vehicle: Truck<br>Weather: Foggy");
    L.circle([10.94803, 76.92742], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3737 }).addTo(map).bindPopup("<b>Coimbatore, Tamil Nadu</b><br>Severity: Serious<br>Vehicle: Pedestrian<br>Weather: Rainy");
    L.circle([21.21606, 79.05794], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2706 }).addTo(map).bindPopup("<b>Nagpur, Maharashtra</b><br>Severity: Serious<br>Vehicle: Bus<br>Weather: Rainy");
    L.circle([18.47190, 73.87202], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1912 }).addTo(map).bindPopup("<b>Pune, Maharashtra</b><br>Severity: Minor<br>Vehicle: Bus<br>Weather: Clear");
    L.circle([26.33306, 72.97026], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1685 }).addTo(map).bindPopup("<b>Jodhpur, Rajasthan</b><br>Severity: Serious<br>Vehicle: Pedestrian<br>Weather: Rainy");
    L.circle([23.59864, 87.25708], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2060 }).addTo(map).bindPopup("<b>Durgapur, West Bengal</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Hazy");
    L.circle([28.58050, 77.07740], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2191 }).addTo(map).bindPopup("<b>Dwarka, Delhi</b><br>Severity: Fatal<br>Vehicle: Bus<br>Weather: Clear");
    L.circle([21.12006, 79.04304], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3451 }).addTo(map).bindPopup("<b>Nagpur, Maharashtra</b><br>Severity: Fatal<br>Vehicle: Bus<br>Weather: Stormy");
    L.circle([21.04743, 79.07983], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2800 }).addTo(map).bindPopup("<b>Nagpur, Maharashtra</b><br>Severity: Fatal<br>Vehicle: Car<br>Weather: Rainy");
    L.circle([21.24109, 72.89733], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2249 }).addTo(map).bindPopup("<b>Surat, Gujarat</b><br>Severity: Serious<br>Vehicle: Pedestrian<br>Weather: Stormy");
    L.circle([22.52847, 88.33634], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2798 }).addTo(map).bindPopup("<b>Kolkata, West Bengal</b><br>Severity: Fatal<br>Vehicle: Cycle<br>Weather: Rainy");
    L.circle([28.55219, 77.13810], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3955 }).addTo(map).bindPopup("<b>New Delhi, Delhi</b><br>Severity: Fatal<br>Vehicle: Two-Wheeler<br>Weather: Foggy");
    L.circle([13.12524, 80.34693], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3865 }).addTo(map).bindPopup("<b>Chennai, Tamil Nadu</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Rainy");
    L.circle([21.06060, 78.99182], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2037 }).addTo(map).bindPopup("<b>Nagpur, Maharashtra</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Clear");
    L.circle([11.06263, 76.94715], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3972 }).addTo(map).bindPopup("<b>Coimbatore, Tamil Nadu</b><br>Severity: Serious<br>Vehicle: Bus<br>Weather: Hazy");
    L.circle([16.50806, 80.55818], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2585 }).addTo(map).bindPopup("<b>Vijayawada, Andhra Pradesh</b><br>Severity: Fatal<br>Vehicle: Bus<br>Weather: Foggy");
    L.circle([12.34369, 76.71781], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2740 }).addTo(map).bindPopup("<b>Mysore, Karnataka</b><br>Severity: Fatal<br>Vehicle: Truck<br>Weather: Clear");
    L.circle([23.01239, 72.64602], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3322 }).addTo(map).bindPopup("<b>Ahmedabad, Gujarat</b><br>Severity: Fatal<br>Vehicle: Two-Wheeler<br>Weather: Hazy");
    L.circle([12.94398, 77.63691], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3756 }).addTo(map).bindPopup("<b>Bangalore, Karnataka</b><br>Severity: Serious<br>Vehicle: Bus<br>Weather: Stormy");
    L.circle([11.11082, 76.91886], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2516 }).addTo(map).bindPopup("<b>Coimbatore, Tamil Nadu</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Hazy");
    L.circle([16.43102, 80.58196], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3107 }).addTo(map).bindPopup("<b>Vijayawada, Andhra Pradesh</b><br>Severity: Serious<br>Vehicle: Auto-Rickshaw<br>Weather: Foggy");
    L.circle([28.71487, 77.16153], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3181 }).addTo(map).bindPopup("<b>Rohini, Delhi</b><br>Severity: Minor<br>Vehicle: Truck<br>Weather: Stormy");
    L.circle([18.61270, 73.84866], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2578 }).addTo(map).bindPopup("<b>Pune, Maharashtra</b><br>Severity: Fatal<br>Vehicle: Auto-Rickshaw<br>Weather: Hazy");
    L.circle([12.20267, 76.71301], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2063 }).addTo(map).bindPopup("<b>Mysore, Karnataka</b><br>Severity: Serious<br>Vehicle: Auto-Rickshaw<br>Weather: Clear");
    L.circle([26.99402, 75.69035], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2574 }).addTo(map).bindPopup("<b>Jaipur, Rajasthan</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Foggy");
    L.circle([26.95933, 75.86982], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2757 }).addTo(map).bindPopup("<b>Jaipur, Rajasthan</b><br>Severity: Serious<br>Vehicle: Auto-Rickshaw<br>Weather: Clear");
    L.circle([13.16367, 80.37015], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2630 }).addTo(map).bindPopup("<b>Chennai, Tamil Nadu</b><br>Severity: Fatal<br>Vehicle: Auto-Rickshaw<br>Weather: Rainy");
    L.circle([13.07989, 80.20298], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2309 }).addTo(map).bindPopup("<b>Chennai, Tamil Nadu</b><br>Severity: Fatal<br>Vehicle: Truck<br>Weather: Rainy");
    L.circle([16.56259, 80.57382], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3862 }).addTo(map).bindPopup("<b>Vijayawada, Andhra Pradesh</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Stormy");
    L.circle([13.70416, 79.32939], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3505 }).addTo(map).bindPopup("<b>Tirupati, Andhra Pradesh</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Foggy");
    L.circle([26.76676, 81.00336], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3099 }).addTo(map).bindPopup("<b>Lucknow, Uttar Pradesh</b><br>Severity: Serious<br>Vehicle: Pedestrian<br>Weather: Hazy");
    L.circle([13.04394, 77.50122], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1509 }).addTo(map).bindPopup("<b>Bangalore, Karnataka</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Hazy");
    L.circle([28.53747, 76.94661], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3791 }).addTo(map).bindPopup("<b>Dwarka, Delhi</b><br>Severity: Serious<br>Vehicle: Car<br>Weather: Rainy");
    L.circle([26.89701, 75.70725], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2117 }).addTo(map).bindPopup("<b>Jaipur, Rajasthan</b><br>Severity: Minor<br>Vehicle: Cycle<br>Weather: Foggy");
    L.circle([25.35278, 82.98320], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2163 }).addTo(map).bindPopup("<b>Varanasi, Uttar Pradesh</b><br>Severity: Minor<br>Vehicle: Bus<br>Weather: Foggy");
    L.circle([12.86791, 74.74913], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2841 }).addTo(map).bindPopup("<b>Mangalore, Karnataka</b><br>Severity: Serious<br>Vehicle: Car<br>Weather: Rainy");
    L.circle([10.99009, 76.95819], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3852 }).addTo(map).bindPopup("<b>Coimbatore, Tamil Nadu</b><br>Severity: Fatal<br>Vehicle: Auto-Rickshaw<br>Weather: Clear");
    L.circle([16.56239, 80.74009], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2935 }).addTo(map).bindPopup("<b>Vijayawada, Andhra Pradesh</b><br>Severity: Minor<br>Vehicle: Truck<br>Weather: Stormy");
    L.circle([28.62564, 77.29005], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3064 }).addTo(map).bindPopup("<b>New Delhi, Delhi</b><br>Severity: Serious<br>Vehicle: Cycle<br>Weather: Hazy");
    L.circle([28.67519, 77.05552], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2259 }).addTo(map).bindPopup("<b>Rohini, Delhi</b><br>Severity: Minor<br>Vehicle: Pedestrian<br>Weather: Stormy");
    L.circle([26.71717, 88.46874], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3370 }).addTo(map).bindPopup("<b>Siliguri, West Bengal</b><br>Severity: Fatal<br>Vehicle: Car<br>Weather: Clear");
    L.circle([26.89630, 75.76575], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2059 }).addTo(map).bindPopup("<b>Jaipur, Rajasthan</b><br>Severity: Serious<br>Vehicle: Bus<br>Weather: Clear");
    L.circle([21.12466, 79.06978], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3730 }).addTo(map).bindPopup("<b>Nagpur, Maharashtra</b><br>Severity: Fatal<br>Vehicle: Cycle<br>Weather: Rainy");
    L.circle([12.90441, 74.79783], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2455 }).addTo(map).bindPopup("<b>Mangalore, Karnataka</b><br>Severity: Serious<br>Vehicle: Auto-Rickshaw<br>Weather: Foggy");
    L.circle([12.23650, 76.64593], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2981 }).addTo(map).bindPopup("<b>Mysore, Karnataka</b><br>Severity: Serious<br>Vehicle: Two-Wheeler<br>Weather: Foggy");
    L.circle([23.52381, 87.38287], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2650 }).addTo(map).bindPopup("<b>Durgapur, West Bengal</b><br>Severity: Fatal<br>Vehicle: Truck<br>Weather: Hazy");
    L.circle([28.73599, 77.00347], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2017 }).addTo(map).bindPopup("<b>Rohini, Delhi</b><br>Severity: Serious<br>Vehicle: Two-Wheeler<br>Weather: Clear");
    L.circle([9.87217, 78.06197], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1735 }).addTo(map).bindPopup("<b>Madurai, Tamil Nadu</b><br>Severity: Fatal<br>Vehicle: Car<br>Weather: Hazy");
    L.circle([18.45694, 73.86579], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2232 }).addTo(map).bindPopup("<b>Pune, Maharashtra</b><br>Severity: Serious<br>Vehicle: Cycle<br>Weather: Rainy");
    L.circle([21.12534, 72.89718], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3554 }).addTo(map).bindPopup("<b>Surat, Gujarat</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Clear");
    L.circle([12.91540, 77.59454], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3296 }).addTo(map).bindPopup("<b>Bangalore, Karnataka</b><br>Severity: Minor<br>Vehicle: Cycle<br>Weather: Rainy");
    L.circle([26.95721, 75.86014], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3602 }).addTo(map).bindPopup("<b>Jaipur, Rajasthan</b><br>Severity: Serious<br>Vehicle: Pedestrian<br>Weather: Foggy");
    L.circle([26.71395, 88.41482], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2202 }).addTo(map).bindPopup("<b>Siliguri, West Bengal</b><br>Severity: Serious<br>Vehicle: Cycle<br>Weather: Foggy");
    L.circle([21.04969, 78.98843], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3665 }).addTo(map).bindPopup("<b>Nagpur, Maharashtra</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Clear");
    L.circle([11.11219, 76.85768], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2096 }).addTo(map).bindPopup("<b>Coimbatore, Tamil Nadu</b><br>Severity: Minor<br>Vehicle: Truck<br>Weather: Stormy");
    L.circle([26.51045, 80.25039], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3979 }).addTo(map).bindPopup("<b>Kanpur, Uttar Pradesh</b><br>Severity: Minor<br>Vehicle: Truck<br>Weather: Hazy");
    L.circle([13.03291, 77.58746], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2289 }).addTo(map).bindPopup("<b>Bangalore, Karnataka</b><br>Severity: Fatal<br>Vehicle: Cycle<br>Weather: Foggy");
    L.circle([28.55783, 77.23778], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1607 }).addTo(map).bindPopup("<b>New Delhi, Delhi</b><br>Severity: Minor<br>Vehicle: Bus<br>Weather: Stormy");
    L.circle([13.12077, 80.26815], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2754 }).addTo(map).bindPopup("<b>Chennai, Tamil Nadu</b><br>Severity: Fatal<br>Vehicle: Cycle<br>Weather: Hazy");
    L.circle([21.20421, 79.03494], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3347 }).addTo(map).bindPopup("<b>Nagpur, Maharashtra</b><br>Severity: Serious<br>Vehicle: Two-Wheeler<br>Weather: Foggy");
    L.circle([28.62832, 77.19349], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3404 }).addTo(map).bindPopup("<b>New Delhi, Delhi</b><br>Severity: Fatal<br>Vehicle: Truck<br>Weather: Stormy");
    L.circle([25.23058, 83.03792], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3661 }).addTo(map).bindPopup("<b>Varanasi, Uttar Pradesh</b><br>Severity: Minor<br>Vehicle: Bus<br>Weather: Rainy");
    L.circle([12.26541, 76.65274], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2425 }).addTo(map).bindPopup("<b>Mysore, Karnataka</b><br>Severity: Serious<br>Vehicle: Bus<br>Weather: Stormy");
    L.circle([21.24188, 72.75299], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3757 }).addTo(map).bindPopup("<b>Surat, Gujarat</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Rainy");
    L.circle([26.40723, 80.34319], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2386 }).addTo(map).bindPopup("<b>Kanpur, Uttar Pradesh</b><br>Severity: Fatal<br>Vehicle: Truck<br>Weather: Hazy");
    L.circle([24.68276, 73.71571], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1640 }).addTo(map).bindPopup("<b>Udaipur, Rajasthan</b><br>Severity: Serious<br>Vehicle: Car<br>Weather: Rainy");
    L.circle([28.65816, 77.02452], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3048 }).addTo(map).bindPopup("<b>Rohini, Delhi</b><br>Severity: Minor<br>Vehicle: Truck<br>Weather: Foggy");
    L.circle([26.51509, 80.43144], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3396 }).addTo(map).bindPopup("<b>Kanpur, Uttar Pradesh</b><br>Severity: Serious<br>Vehicle: Two-Wheeler<br>Weather: Foggy");
    L.circle([28.63262, 76.94819], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3250 }).addTo(map).bindPopup("<b>Dwarka, Delhi</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Foggy");
    L.circle([22.52912, 88.42874], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3986 }).addTo(map).bindPopup("<b>Kolkata, West Bengal</b><br>Severity: Serious<br>Vehicle: Two-Wheeler<br>Weather: Rainy");
    L.circle([11.11486, 77.05069], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2990 }).addTo(map).bindPopup("<b>Coimbatore, Tamil Nadu</b><br>Severity: Serious<br>Vehicle: Bus<br>Weather: Foggy");
    L.circle([23.01428, 72.56790], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2413 }).addTo(map).bindPopup("<b>Ahmedabad, Gujarat</b><br>Severity: Minor<br>Vehicle: Bus<br>Weather: Rainy");
    L.circle([22.61088, 88.28600], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3947 }).addTo(map).bindPopup("<b>Kolkata, West Bengal</b><br>Severity: Serious<br>Vehicle: Pedestrian<br>Weather: Clear");
    L.circle([26.64842, 88.36161], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3543 }).addTo(map).bindPopup("<b>Siliguri, West Bengal</b><br>Severity: Serious<br>Vehicle: Car<br>Weather: Hazy");
    L.circle([13.10233, 80.34452], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2935 }).addTo(map).bindPopup("<b>Chennai, Tamil Nadu</b><br>Severity: Fatal<br>Vehicle: Auto-Rickshaw<br>Weather: Stormy");
    L.circle([10.97402, 77.02176], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2260 }).addTo(map).bindPopup("<b>Coimbatore, Tamil Nadu</b><br>Severity: Fatal<br>Vehicle: Auto-Rickshaw<br>Weather: Rainy");
    L.circle([28.59441, 77.14437], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1683 }).addTo(map).bindPopup("<b>Dwarka, Delhi</b><br>Severity: Serious<br>Vehicle: Auto-Rickshaw<br>Weather: Clear");
    L.circle([12.37848, 76.59667], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2368 }).addTo(map).bindPopup("<b>Mysore, Karnataka</b><br>Severity: Minor<br>Vehicle: Cycle<br>Weather: Clear");
    L.circle([26.91450, 75.87718], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2390 }).addTo(map).bindPopup("<b>Jaipur, Rajasthan</b><br>Severity: Fatal<br>Vehicle: Truck<br>Weather: Stormy");
    L.circle([26.14471, 73.12364], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1544 }).addTo(map).bindPopup("<b>Jodhpur, Rajasthan</b><br>Severity: Fatal<br>Vehicle: Car<br>Weather: Clear");
    L.circle([28.59265, 76.99400], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1519 }).addTo(map).bindPopup("<b>Dwarka, Delhi</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Clear");
    L.circle([9.92756, 78.15723], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2744 }).addTo(map).bindPopup("<b>Madurai, Tamil Nadu</b><br>Severity: Minor<br>Vehicle: Car<br>Weather: Rainy");
    L.circle([26.88296, 80.88040], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3430 }).addTo(map).bindPopup("<b>Lucknow, Uttar Pradesh</b><br>Severity: Fatal<br>Vehicle: Cycle<br>Weather: Foggy");
    L.circle([13.67556, 79.33705], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1880 }).addTo(map).bindPopup("<b>Tirupati, Andhra Pradesh</b><br>Severity: Fatal<br>Vehicle: Auto-Rickshaw<br>Weather: Hazy");
    L.circle([28.78386, 77.03231], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2386 }).addTo(map).bindPopup("<b>Rohini, Delhi</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Clear");
    L.circle([26.37281, 80.27668], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3721 }).addTo(map).bindPopup("<b>Kanpur, Uttar Pradesh</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Foggy");
    L.circle([26.42706, 80.41572], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1637 }).addTo(map).bindPopup("<b>Kanpur, Uttar Pradesh</b><br>Severity: Fatal<br>Vehicle: Two-Wheeler<br>Weather: Clear");
    L.circle([16.44325, 80.61400], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3376 }).addTo(map).bindPopup("<b>Vijayawada, Andhra Pradesh</b><br>Severity: Minor<br>Vehicle: Bus<br>Weather: Stormy");
    L.circle([19.13767, 72.92071], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2808 }).addTo(map).bindPopup("<b>Mumbai, Maharashtra</b><br>Severity: Minor<br>Vehicle: Pedestrian<br>Weather: Stormy");
    L.circle([22.93268, 72.49654], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3437 }).addTo(map).bindPopup("<b>Ahmedabad, Gujarat</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Hazy");
    L.circle([24.64576, 73.71424], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2032 }).addTo(map).bindPopup("<b>Udaipur, Rajasthan</b><br>Severity: Minor<br>Vehicle: Pedestrian<br>Weather: Hazy");
    L.circle([21.13206, 72.90976], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3410 }).addTo(map).bindPopup("<b>Surat, Gujarat</b><br>Severity: Serious<br>Vehicle: Cycle<br>Weather: Clear");
    L.circle([26.95032, 75.72176], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2270 }).addTo(map).bindPopup("<b>Jaipur, Rajasthan</b><br>Severity: Serious<br>Vehicle: Auto-Rickshaw<br>Weather: Rainy");
    L.circle([28.60759, 77.18734], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3163 }).addTo(map).bindPopup("<b>Rohini, Delhi</b><br>Severity: Fatal<br>Vehicle: Bus<br>Weather: Clear");
    L.circle([26.92965, 75.68835], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1737 }).addTo(map).bindPopup("<b>Jaipur, Rajasthan</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Hazy");
    L.circle([26.17638, 73.10196], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2458 }).addTo(map).bindPopup("<b>Jodhpur, Rajasthan</b><br>Severity: Minor<br>Vehicle: Car<br>Weather: Hazy");
    L.circle([12.33822, 76.59417], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1842 }).addTo(map).bindPopup("<b>Mysore, Karnataka</b><br>Severity: Fatal<br>Vehicle: Bus<br>Weather: Hazy");
    L.circle([28.72821, 77.17139], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2334 }).addTo(map).bindPopup("<b>Rohini, Delhi</b><br>Severity: Serious<br>Vehicle: Two-Wheeler<br>Weather: Foggy");
    L.circle([19.02469, 72.82996], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3600 }).addTo(map).bindPopup("<b>Mumbai, Maharashtra</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Stormy");
    L.circle([25.29693, 82.88562], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1906 }).addTo(map).bindPopup("<b>Varanasi, Uttar Pradesh</b><br>Severity: Minor<br>Vehicle: Cycle<br>Weather: Stormy");
    L.circle([26.45171, 80.41053], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2580 }).addTo(map).bindPopup("<b>Kanpur, Uttar Pradesh</b><br>Severity: Serious<br>Vehicle: Two-Wheeler<br>Weather: Stormy");
    L.circle([24.60928, 73.78108], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3039 }).addTo(map).bindPopup("<b>Udaipur, Rajasthan</b><br>Severity: Fatal<br>Vehicle: Two-Wheeler<br>Weather: Stormy");
    L.circle([21.21702, 72.90525], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2822 }).addTo(map).bindPopup("<b>Surat, Gujarat</b><br>Severity: Fatal<br>Vehicle: Bus<br>Weather: Rainy");
    L.circle([21.15137, 72.76204], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3479 }).addTo(map).bindPopup("<b>Surat, Gujarat</b><br>Severity: Serious<br>Vehicle: Auto-Rickshaw<br>Weather: Foggy");
    L.circle([13.66946, 79.44026], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1943 }).addTo(map).bindPopup("<b>Tirupati, Andhra Pradesh</b><br>Severity: Serious<br>Vehicle: Two-Wheeler<br>Weather: Hazy");
    L.circle([10.96793, 77.00428], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2793 }).addTo(map).bindPopup("<b>Coimbatore, Tamil Nadu</b><br>Severity: Fatal<br>Vehicle: Bus<br>Weather: Hazy");
    L.circle([26.15326, 72.92773], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2467 }).addTo(map).bindPopup("<b>Jodhpur, Rajasthan</b><br>Severity: Minor<br>Vehicle: Car<br>Weather: Hazy");
    L.circle([22.97436, 72.59732], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2552 }).addTo(map).bindPopup("<b>Ahmedabad, Gujarat</b><br>Severity: Minor<br>Vehicle: Pedestrian<br>Weather: Rainy");
    L.circle([28.65516, 77.08529], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3857 }).addTo(map).bindPopup("<b>Rohini, Delhi</b><br>Severity: Fatal<br>Vehicle: Bus<br>Weather: Foggy");
    L.circle([26.87785, 75.70547], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2521 }).addTo(map).bindPopup("<b>Jaipur, Rajasthan</b><br>Severity: Minor<br>Vehicle: Pedestrian<br>Weather: Clear");
    L.circle([28.55677, 77.10851], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3753 }).addTo(map).bindPopup("<b>Dwarka, Delhi</b><br>Severity: Serious<br>Vehicle: Bus<br>Weather: Hazy");
    L.circle([12.27321, 76.65771], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1856 }).addTo(map).bindPopup("<b>Mysore, Karnataka</b><br>Severity: Minor<br>Vehicle: Truck<br>Weather: Stormy");
    L.circle([10.93639, 77.01137], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3935 }).addTo(map).bindPopup("<b>Coimbatore, Tamil Nadu</b><br>Severity: Serious<br>Vehicle: Bus<br>Weather: Hazy");
    L.circle([21.21255, 72.82121], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3696 }).addTo(map).bindPopup("<b>Surat, Gujarat</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Stormy");
    L.circle([12.26503, 76.61586], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2430 }).addTo(map).bindPopup("<b>Mysore, Karnataka</b><br>Severity: Serious<br>Vehicle: Two-Wheeler<br>Weather: Stormy");
    L.circle([26.26295, 73.12248], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3439 }).addTo(map).bindPopup("<b>Jodhpur, Rajasthan</b><br>Severity: Fatal<br>Vehicle: Cycle<br>Weather: Foggy");
    L.circle([28.62396, 77.02408], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3463 }).addTo(map).bindPopup("<b>Dwarka, Delhi</b><br>Severity: Minor<br>Vehicle: Truck<br>Weather: Hazy");
    L.circle([28.68340, 77.00377], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3939 }).addTo(map).bindPopup("<b>Dwarka, Delhi</b><br>Severity: Serious<br>Vehicle: Auto-Rickshaw<br>Weather: Stormy");
    L.circle([28.59305, 77.24602], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2069 }).addTo(map).bindPopup("<b>New Delhi, Delhi</b><br>Severity: Minor<br>Vehicle: Bus<br>Weather: Rainy");
    L.circle([24.49110, 73.79560], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3796 }).addTo(map).bindPopup("<b>Udaipur, Rajasthan</b><br>Severity: Fatal<br>Vehicle: Two-Wheeler<br>Weather: Clear");
    L.circle([25.35549, 82.98897], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2386 }).addTo(map).bindPopup("<b>Varanasi, Uttar Pradesh</b><br>Severity: Minor<br>Vehicle: Truck<br>Weather: Hazy");
    L.circle([25.34061, 83.05220], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2151 }).addTo(map).bindPopup("<b>Varanasi, Uttar Pradesh</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Stormy");
    L.circle([12.99964, 77.56081], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3724 }).addTo(map).bindPopup("<b>Bangalore, Karnataka</b><br>Severity: Minor<br>Vehicle: Cycle<br>Weather: Rainy");
    L.circle([24.51283, 73.61330], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3000 }).addTo(map).bindPopup("<b>Udaipur, Rajasthan</b><br>Severity: Minor<br>Vehicle: Cycle<br>Weather: Hazy");
    L.circle([24.49302, 73.74499], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2085 }).addTo(map).bindPopup("<b>Udaipur, Rajasthan</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Foggy");
    L.circle([24.48838, 73.68884], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2887 }).addTo(map).bindPopup("<b>Udaipur, Rajasthan</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Clear");
    L.circle([28.53506, 77.23463], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3178 }).addTo(map).bindPopup("<b>New Delhi, Delhi</b><br>Severity: Minor<br>Vehicle: Pedestrian<br>Weather: Stormy");
    L.circle([19.13169, 72.79909], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3066 }).addTo(map).bindPopup("<b>Mumbai, Maharashtra</b><br>Severity: Fatal<br>Vehicle: Cycle<br>Weather: Hazy");
    L.circle([13.58826, 79.46837], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3844 }).addTo(map).bindPopup("<b>Tirupati, Andhra Pradesh</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Hazy");
    L.circle([26.14913, 73.12048], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3388 }).addTo(map).bindPopup("<b>Jodhpur, Rajasthan</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Rainy");
    L.circle([26.68755, 88.42786], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3181 }).addTo(map).bindPopup("<b>Siliguri, West Bengal</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Hazy");
    L.circle([28.69521, 77.16977], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2049 }).addTo(map).bindPopup("<b>New Delhi, Delhi</b><br>Severity: Fatal<br>Vehicle: Cycle<br>Weather: Foggy");
    L.circle([23.51059, 87.38467], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2548 }).addTo(map).bindPopup("<b>Durgapur, West Bengal</b><br>Severity: Fatal<br>Vehicle: Truck<br>Weather: Stormy");
    L.circle([18.50639, 73.81500], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1509 }).addTo(map).bindPopup("<b>Pune, Maharashtra</b><br>Severity: Minor<br>Vehicle: Car<br>Weather: Stormy");
    L.circle([21.11141, 72.88518], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2546 }).addTo(map).bindPopup("<b>Surat, Gujarat</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Hazy");
    L.circle([26.65577, 88.37714], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2813 }).addTo(map).bindPopup("<b>Siliguri, West Bengal</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Hazy");
    L.circle([24.68175, 73.72068], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1872 }).addTo(map).bindPopup("<b>Udaipur, Rajasthan</b><br>Severity: Serious<br>Vehicle: Car<br>Weather: Foggy");
    L.circle([21.18660, 79.16527], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2283 }).addTo(map).bindPopup("<b>Nagpur, Maharashtra</b><br>Severity: Fatal<br>Vehicle: Bus<br>Weather: Stormy");
    L.circle([26.75987, 88.35964], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2332 }).addTo(map).bindPopup("<b>Siliguri, West Bengal</b><br>Severity: Serious<br>Vehicle: Two-Wheeler<br>Weather: Clear");
    L.circle([12.80613, 74.75916], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2296 }).addTo(map).bindPopup("<b>Mangalore, Karnataka</b><br>Severity: Minor<br>Vehicle: Pedestrian<br>Weather: Clear");
    L.circle([24.57471, 73.61540], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1893 }).addTo(map).bindPopup("<b>Udaipur, Rajasthan</b><br>Severity: Fatal<br>Vehicle: Two-Wheeler<br>Weather: Clear");
    L.circle([22.64709, 88.37850], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2480 }).addTo(map).bindPopup("<b>Kolkata, West Bengal</b><br>Severity: Minor<br>Vehicle: Truck<br>Weather: Foggy");
    L.circle([26.50524, 80.30058], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2661 }).addTo(map).bindPopup("<b>Kanpur, Uttar Pradesh</b><br>Severity: Minor<br>Vehicle: Cycle<br>Weather: Foggy");
    L.circle([9.93393, 78.02698], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2562 }).addTo(map).bindPopup("<b>Madurai, Tamil Nadu</b><br>Severity: Minor<br>Vehicle: Bus<br>Weather: Clear");
    L.circle([9.90728, 78.20060], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2819 }).addTo(map).bindPopup("<b>Madurai, Tamil Nadu</b><br>Severity: Fatal<br>Vehicle: Bus<br>Weather: Rainy");
    L.circle([10.01756, 78.04286], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3058 }).addTo(map).bindPopup("<b>Madurai, Tamil Nadu</b><br>Severity: Fatal<br>Vehicle: Bus<br>Weather: Stormy");
    L.circle([10.96058, 76.91874], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2117 }).addTo(map).bindPopup("<b>Coimbatore, Tamil Nadu</b><br>Severity: Minor<br>Vehicle: Bus<br>Weather: Stormy");
    L.circle([28.64800, 77.03395], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2201 }).addTo(map).bindPopup("<b>Dwarka, Delhi</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Stormy");
    L.circle([12.90930, 74.87034], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1696 }).addTo(map).bindPopup("<b>Mangalore, Karnataka</b><br>Severity: Fatal<br>Vehicle: Truck<br>Weather: Foggy");
    L.circle([28.52281, 77.16637], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2424 }).addTo(map).bindPopup("<b>New Delhi, Delhi</b><br>Severity: Minor<br>Vehicle: Bus<br>Weather: Rainy");
    L.circle([24.67761, 73.77010], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2025 }).addTo(map).bindPopup("<b>Udaipur, Rajasthan</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Clear");
    L.circle([13.05066, 77.49557], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3140 }).addTo(map).bindPopup("<b>Bangalore, Karnataka</b><br>Severity: Minor<br>Vehicle: Car<br>Weather: Rainy");
    L.circle([28.56142, 77.23907], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3796 }).addTo(map).bindPopup("<b>New Delhi, Delhi</b><br>Severity: Fatal<br>Vehicle: Cycle<br>Weather: Stormy");
    L.circle([18.42558, 73.89755], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3823 }).addTo(map).bindPopup("<b>Pune, Maharashtra</b><br>Severity: Fatal<br>Vehicle: Auto-Rickshaw<br>Weather: Hazy");
    L.circle([11.03902, 76.92315], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1945 }).addTo(map).bindPopup("<b>Coimbatore, Tamil Nadu</b><br>Severity: Fatal<br>Vehicle: Bus<br>Weather: Hazy");
    L.circle([24.68529, 73.69024], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1960 }).addTo(map).bindPopup("<b>Udaipur, Rajasthan</b><br>Severity: Minor<br>Vehicle: Bus<br>Weather: Stormy");
    L.circle([9.84056, 78.12951], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1927 }).addTo(map).bindPopup("<b>Madurai, Tamil Nadu</b><br>Severity: Minor<br>Vehicle: Truck<br>Weather: Rainy");
    L.circle([26.69528, 88.44931], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2998 }).addTo(map).bindPopup("<b>Siliguri, West Bengal</b><br>Severity: Serious<br>Vehicle: Cycle<br>Weather: Foggy");
    L.circle([26.87636, 80.90954], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3169 }).addTo(map).bindPopup("<b>Lucknow, Uttar Pradesh</b><br>Severity: Fatal<br>Vehicle: Auto-Rickshaw<br>Weather: Foggy");
    L.circle([19.03326, 72.82678], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3515 }).addTo(map).bindPopup("<b>Mumbai, Maharashtra</b><br>Severity: Fatal<br>Vehicle: Two-Wheeler<br>Weather: Stormy");
    L.circle([12.19592, 76.67961], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3297 }).addTo(map).bindPopup("<b>Mysore, Karnataka</b><br>Severity: Minor<br>Vehicle: Cycle<br>Weather: Stormy");
    L.circle([28.77250, 77.12641], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1718 }).addTo(map).bindPopup("<b>Rohini, Delhi</b><br>Severity: Serious<br>Vehicle: Two-Wheeler<br>Weather: Foggy");
    L.circle([26.81700, 80.91808], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3745 }).addTo(map).bindPopup("<b>Lucknow, Uttar Pradesh</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Stormy");
    L.circle([18.46399, 73.86058], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2207 }).addTo(map).bindPopup("<b>Pune, Maharashtra</b><br>Severity: Fatal<br>Vehicle: Auto-Rickshaw<br>Weather: Rainy");
    L.circle([13.09303, 80.35697], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2623 }).addTo(map).bindPopup("<b>Chennai, Tamil Nadu</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Foggy");
    L.circle([21.10698, 79.12978], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3245 }).addTo(map).bindPopup("<b>Nagpur, Maharashtra</b><br>Severity: Fatal<br>Vehicle: Car<br>Weather: Stormy");
    L.circle([22.97417, 72.67103], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3815 }).addTo(map).bindPopup("<b>Ahmedabad, Gujarat</b><br>Severity: Minor<br>Vehicle: Truck<br>Weather: Stormy");
    L.circle([13.53838, 79.35879], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2531 }).addTo(map).bindPopup("<b>Tirupati, Andhra Pradesh</b><br>Severity: Fatal<br>Vehicle: Auto-Rickshaw<br>Weather: Stormy");
    L.circle([26.68277, 88.36948], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2477 }).addTo(map).bindPopup("<b>Siliguri, West Bengal</b><br>Severity: Serious<br>Vehicle: Pedestrian<br>Weather: Rainy");
    L.circle([19.10826, 72.96765], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3671 }).addTo(map).bindPopup("<b>Mumbai, Maharashtra</b><br>Severity: Minor<br>Vehicle: Pedestrian<br>Weather: Hazy");
    L.circle([12.98684, 77.65007], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1755 }).addTo(map).bindPopup("<b>Bangalore, Karnataka</b><br>Severity: Minor<br>Vehicle: Truck<br>Weather: Clear");
    L.circle([26.20512, 72.95937], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3934 }).addTo(map).bindPopup("<b>Jodhpur, Rajasthan</b><br>Severity: Fatal<br>Vehicle: Truck<br>Weather: Hazy");
    L.circle([23.42558, 87.39074], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3407 }).addTo(map).bindPopup("<b>Durgapur, West Bengal</b><br>Severity: Fatal<br>Vehicle: Cycle<br>Weather: Rainy");
    L.circle([9.91182, 78.11522], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2230 }).addTo(map).bindPopup("<b>Madurai, Tamil Nadu</b><br>Severity: Minor<br>Vehicle: Truck<br>Weather: Foggy");
    L.circle([16.44186, 80.57924], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3467 }).addTo(map).bindPopup("<b>Vijayawada, Andhra Pradesh</b><br>Severity: Minor<br>Vehicle: Car<br>Weather: Rainy");
    L.circle([22.98785, 72.56862], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3000 }).addTo(map).bindPopup("<b>Ahmedabad, Gujarat</b><br>Severity: Fatal<br>Vehicle: Cycle<br>Weather: Stormy");
    L.circle([28.66443, 77.03837], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1602 }).addTo(map).bindPopup("<b>Rohini, Delhi</b><br>Severity: Fatal<br>Vehicle: Truck<br>Weather: Rainy");
    L.circle([26.24067, 73.01723], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2039 }).addTo(map).bindPopup("<b>Jodhpur, Rajasthan</b><br>Severity: Fatal<br>Vehicle: Auto-Rickshaw<br>Weather: Hazy");
    L.circle([26.81226, 88.42113], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3463 }).addTo(map).bindPopup("<b>Siliguri, West Bengal</b><br>Severity: Serious<br>Vehicle: Auto-Rickshaw<br>Weather: Hazy");
    L.circle([26.39069, 80.33092], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3259 }).addTo(map).bindPopup("<b>Kanpur, Uttar Pradesh</b><br>Severity: Fatal<br>Vehicle: Bus<br>Weather: Foggy");
    L.circle([25.40289, 82.93613], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2655 }).addTo(map).bindPopup("<b>Varanasi, Uttar Pradesh</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Rainy");
    L.circle([12.27258, 76.67211], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1621 }).addTo(map).bindPopup("<b>Mysore, Karnataka</b><br>Severity: Minor<br>Vehicle: Car<br>Weather: Foggy");
    L.circle([16.58604, 80.73286], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2131 }).addTo(map).bindPopup("<b>Vijayawada, Andhra Pradesh</b><br>Severity: Serious<br>Vehicle: Auto-Rickshaw<br>Weather: Hazy");
    L.circle([19.12150, 72.97166], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2127 }).addTo(map).bindPopup("<b>Mumbai, Maharashtra</b><br>Severity: Minor<br>Vehicle: Car<br>Weather: Rainy");
    L.circle([28.72815, 77.18021], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2539 }).addTo(map).bindPopup("<b>Rohini, Delhi</b><br>Severity: Minor<br>Vehicle: Bus<br>Weather: Clear");
    L.circle([23.02120, 72.58275], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3448 }).addTo(map).bindPopup("<b>Ahmedabad, Gujarat</b><br>Severity: Minor<br>Vehicle: Truck<br>Weather: Hazy");
    L.circle([24.59092, 73.62726], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2784 }).addTo(map).bindPopup("<b>Udaipur, Rajasthan</b><br>Severity: Minor<br>Vehicle: Truck<br>Weather: Clear");
    L.circle([10.98837, 77.02136], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1756 }).addTo(map).bindPopup("<b>Coimbatore, Tamil Nadu</b><br>Severity: Serious<br>Vehicle: Cycle<br>Weather: Hazy");
    L.circle([21.18546, 79.05386], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3158 }).addTo(map).bindPopup("<b>Nagpur, Maharashtra</b><br>Severity: Fatal<br>Vehicle: Car<br>Weather: Clear");
    L.circle([28.62007, 77.15754], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2776 }).addTo(map).bindPopup("<b>New Delhi, Delhi</b><br>Severity: Minor<br>Vehicle: Car<br>Weather: Hazy");
    L.circle([26.70358, 88.41257], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1856 }).addTo(map).bindPopup("<b>Siliguri, West Bengal</b><br>Severity: Serious<br>Vehicle: Cycle<br>Weather: Foggy");
    L.circle([26.76206, 80.87908], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3868 }).addTo(map).bindPopup("<b>Lucknow, Uttar Pradesh</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Stormy");
    L.circle([26.91478, 81.03279], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3861 }).addTo(map).bindPopup("<b>Lucknow, Uttar Pradesh</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Foggy");
    L.circle([26.89596, 75.69097], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3980 }).addTo(map).bindPopup("<b>Jaipur, Rajasthan</b><br>Severity: Serious<br>Vehicle: Pedestrian<br>Weather: Hazy");
    L.circle([13.63701, 79.47701], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3376 }).addTo(map).bindPopup("<b>Tirupati, Andhra Pradesh</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Stormy");
    L.circle([12.33095, 76.57248], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1676 }).addTo(map).bindPopup("<b>Mysore, Karnataka</b><br>Severity: Serious<br>Vehicle: Car<br>Weather: Foggy");
    L.circle([25.29226, 83.01719], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2389 }).addTo(map).bindPopup("<b>Varanasi, Uttar Pradesh</b><br>Severity: Minor<br>Vehicle: Cycle<br>Weather: Clear");
    L.circle([19.01839, 72.82603], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3650 }).addTo(map).bindPopup("<b>Mumbai, Maharashtra</b><br>Severity: Serious<br>Vehicle: Bus<br>Weather: Clear");
    L.circle([25.27230, 83.06977], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3950 }).addTo(map).bindPopup("<b>Varanasi, Uttar Pradesh</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Rainy");
    L.circle([12.90969, 77.59907], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3139 }).addTo(map).bindPopup("<b>Bangalore, Karnataka</b><br>Severity: Minor<br>Vehicle: Truck<br>Weather: Clear");
    L.circle([13.70223, 79.50363], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2415 }).addTo(map).bindPopup("<b>Tirupati, Andhra Pradesh</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Hazy");
    L.circle([16.46100, 80.67651], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2294 }).addTo(map).bindPopup("<b>Vijayawada, Andhra Pradesh</b><br>Severity: Serious<br>Vehicle: Bus<br>Weather: Rainy");
    L.circle([28.70605, 77.04357], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2829 }).addTo(map).bindPopup("<b>Rohini, Delhi</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Hazy");
    L.circle([9.85751, 78.21347], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3206 }).addTo(map).bindPopup("<b>Madurai, Tamil Nadu</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Rainy");
    L.circle([28.60468, 77.17011], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3685 }).addTo(map).bindPopup("<b>Rohini, Delhi</b><br>Severity: Fatal<br>Vehicle: Two-Wheeler<br>Weather: Hazy");
    L.circle([24.57712, 73.73741], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3629 }).addTo(map).bindPopup("<b>Udaipur, Rajasthan</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Clear");
    L.circle([21.06665, 79.10601], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2632 }).addTo(map).bindPopup("<b>Nagpur, Maharashtra</b><br>Severity: Minor<br>Vehicle: Cycle<br>Weather: Clear");
    L.circle([12.90698, 77.62068], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3355 }).addTo(map).bindPopup("<b>Bangalore, Karnataka</b><br>Severity: Fatal<br>Vehicle: Car<br>Weather: Hazy");
    L.circle([12.85616, 74.90737], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3705 }).addTo(map).bindPopup("<b>Mangalore, Karnataka</b><br>Severity: Minor<br>Vehicle: Bus<br>Weather: Hazy");
    L.circle([28.67299, 77.14033], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1770 }).addTo(map).bindPopup("<b>Dwarka, Delhi</b><br>Severity: Minor<br>Vehicle: Car<br>Weather: Clear");
    L.circle([28.52255, 77.15530], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2850 }).addTo(map).bindPopup("<b>New Delhi, Delhi</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Clear");
    L.circle([22.62124, 88.36346], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2317 }).addTo(map).bindPopup("<b>Kolkata, West Bengal</b><br>Severity: Fatal<br>Vehicle: Car<br>Weather: Foggy");
    L.circle([11.11536, 76.93633], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2972 }).addTo(map).bindPopup("<b>Coimbatore, Tamil Nadu</b><br>Severity: Minor<br>Vehicle: Truck<br>Weather: Hazy");
    L.circle([23.55685, 87.37537], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3020 }).addTo(map).bindPopup("<b>Durgapur, West Bengal</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Hazy");
    L.circle([11.04571, 77.04091], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3248 }).addTo(map).bindPopup("<b>Coimbatore, Tamil Nadu</b><br>Severity: Serious<br>Vehicle: Auto-Rickshaw<br>Weather: Foggy");
    L.circle([25.39092, 83.02585], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2538 }).addTo(map).bindPopup("<b>Varanasi, Uttar Pradesh</b><br>Severity: Serious<br>Vehicle: Auto-Rickshaw<br>Weather: Stormy");
    L.circle([26.77068, 80.90426], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2212 }).addTo(map).bindPopup("<b>Lucknow, Uttar Pradesh</b><br>Severity: Serious<br>Vehicle: Car<br>Weather: Clear");
    L.circle([26.54605, 80.29928], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2108 }).addTo(map).bindPopup("<b>Kanpur, Uttar Pradesh</b><br>Severity: Fatal<br>Vehicle: Truck<br>Weather: Clear");
    L.circle([18.61291, 73.85576], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3721 }).addTo(map).bindPopup("<b>Pune, Maharashtra</b><br>Severity: Minor<br>Vehicle: Pedestrian<br>Weather: Hazy");
    L.circle([11.00385, 77.05032], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3554 }).addTo(map).bindPopup("<b>Coimbatore, Tamil Nadu</b><br>Severity: Fatal<br>Vehicle: Car<br>Weather: Clear");
    L.circle([13.61028, 79.46914], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3315 }).addTo(map).bindPopup("<b>Tirupati, Andhra Pradesh</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Foggy");
    L.circle([21.24121, 72.86953], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3922 }).addTo(map).bindPopup("<b>Surat, Gujarat</b><br>Severity: Minor<br>Vehicle: Cycle<br>Weather: Stormy");
    L.circle([23.48448, 87.40930], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2803 }).addTo(map).bindPopup("<b>Durgapur, West Bengal</b><br>Severity: Minor<br>Vehicle: Pedestrian<br>Weather: Stormy");
    L.circle([13.69069, 79.49616], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3950 }).addTo(map).bindPopup("<b>Tirupati, Andhra Pradesh</b><br>Severity: Fatal<br>Vehicle: Bus<br>Weather: Rainy");
    L.circle([11.03140, 76.87991], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3336 }).addTo(map).bindPopup("<b>Coimbatore, Tamil Nadu</b><br>Severity: Fatal<br>Vehicle: Cycle<br>Weather: Foggy");
    L.circle([26.81866, 75.70446], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2063 }).addTo(map).bindPopup("<b>Jaipur, Rajasthan</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Clear");
    L.circle([26.87850, 80.85426], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3381 }).addTo(map).bindPopup("<b>Lucknow, Uttar Pradesh</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Foggy");
    L.circle([13.61401, 79.37308], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3582 }).addTo(map).bindPopup("<b>Tirupati, Andhra Pradesh</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Hazy");
    L.circle([13.02044, 80.31811], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2780 }).addTo(map).bindPopup("<b>Chennai, Tamil Nadu</b><br>Severity: Serious<br>Vehicle: Bus<br>Weather: Stormy");
    L.circle([13.14248, 80.33696], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1794 }).addTo(map).bindPopup("<b>Chennai, Tamil Nadu</b><br>Severity: Serious<br>Vehicle: Car<br>Weather: Clear");
    L.circle([28.55208, 77.23730], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3349 }).addTo(map).bindPopup("<b>New Delhi, Delhi</b><br>Severity: Serious<br>Vehicle: Auto-Rickshaw<br>Weather: Clear");
    L.circle([28.53529, 77.12507], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2767 }).addTo(map).bindPopup("<b>New Delhi, Delhi</b><br>Severity: Serious<br>Vehicle: Cycle<br>Weather: Stormy");
    L.circle([16.42205, 80.61526], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2156 }).addTo(map).bindPopup("<b>Vijayawada, Andhra Pradesh</b><br>Severity: Serious<br>Vehicle: Cycle<br>Weather: Stormy");
    L.circle([26.22978, 72.99275], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3521 }).addTo(map).bindPopup("<b>Jodhpur, Rajasthan</b><br>Severity: Minor<br>Vehicle: Bus<br>Weather: Clear");
    L.circle([21.19471, 72.81748], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3032 }).addTo(map).bindPopup("<b>Surat, Gujarat</b><br>Severity: Serious<br>Vehicle: Bus<br>Weather: Rainy");
    L.circle([24.65852, 73.77378], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2467 }).addTo(map).bindPopup("<b>Udaipur, Rajasthan</b><br>Severity: Serious<br>Vehicle: Two-Wheeler<br>Weather: Rainy");
    L.circle([12.91541, 77.67203], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1606 }).addTo(map).bindPopup("<b>Bangalore, Karnataka</b><br>Severity: Fatal<br>Vehicle: Auto-Rickshaw<br>Weather: Foggy");
    L.circle([13.08587, 80.32874], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1836 }).addTo(map).bindPopup("<b>Chennai, Tamil Nadu</b><br>Severity: Serious<br>Vehicle: Pedestrian<br>Weather: Stormy");
    L.circle([28.70236, 77.27155], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3613 }).addTo(map).bindPopup("<b>New Delhi, Delhi</b><br>Severity: Fatal<br>Vehicle: Auto-Rickshaw<br>Weather: Rainy");
    L.circle([28.58337, 77.12210], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2709 }).addTo(map).bindPopup("<b>Dwarka, Delhi</b><br>Severity: Serious<br>Vehicle: Car<br>Weather: Foggy");
    L.circle([21.09171, 72.78192], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3945 }).addTo(map).bindPopup("<b>Surat, Gujarat</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Rainy");
    L.circle([12.92885, 74.88668], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3920 }).addTo(map).bindPopup("<b>Mangalore, Karnataka</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Hazy");
    L.circle([24.62117, 73.62528], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2420 }).addTo(map).bindPopup("<b>Udaipur, Rajasthan</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Hazy");
    L.circle([13.07384, 80.28777], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3662 }).addTo(map).bindPopup("<b>Chennai, Tamil Nadu</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Rainy");
    L.circle([28.66359, 77.12568], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1638 }).addTo(map).bindPopup("<b>New Delhi, Delhi</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Clear");
    L.circle([19.15483, 72.97713], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3168 }).addTo(map).bindPopup("<b>Mumbai, Maharashtra</b><br>Severity: Fatal<br>Vehicle: Truck<br>Weather: Rainy");
    L.circle([13.63600, 79.38610], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2673 }).addTo(map).bindPopup("<b>Tirupati, Andhra Pradesh</b><br>Severity: Fatal<br>Vehicle: Auto-Rickshaw<br>Weather: Hazy");
    L.circle([26.36971, 80.29032], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2047 }).addTo(map).bindPopup("<b>Kanpur, Uttar Pradesh</b><br>Severity: Fatal<br>Vehicle: Truck<br>Weather: Clear");
    L.circle([12.94364, 74.78725], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3563 }).addTo(map).bindPopup("<b>Mangalore, Karnataka</b><br>Severity: Minor<br>Vehicle: Pedestrian<br>Weather: Rainy");
    L.circle([12.87609, 77.57142], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2107 }).addTo(map).bindPopup("<b>Bangalore, Karnataka</b><br>Severity: Fatal<br>Vehicle: Auto-Rickshaw<br>Weather: Foggy");
    L.circle([26.81573, 88.34977], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3788 }).addTo(map).bindPopup("<b>Siliguri, West Bengal</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Foggy");
    L.circle([23.46859, 87.22008], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2064 }).addTo(map).bindPopup("<b>Durgapur, West Bengal</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Hazy");
    L.circle([26.73394, 88.37882], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3584 }).addTo(map).bindPopup("<b>Siliguri, West Bengal</b><br>Severity: Fatal<br>Vehicle: Cycle<br>Weather: Stormy");
    L.circle([28.61172, 76.94993], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3029 }).addTo(map).bindPopup("<b>Dwarka, Delhi</b><br>Severity: Fatal<br>Vehicle: Bus<br>Weather: Hazy");
    L.circle([26.40356, 80.40409], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3916 }).addTo(map).bindPopup("<b>Kanpur, Uttar Pradesh</b><br>Severity: Serious<br>Vehicle: Car<br>Weather: Clear");
    L.circle([19.16320, 72.92085], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1557 }).addTo(map).bindPopup("<b>Mumbai, Maharashtra</b><br>Severity: Fatal<br>Vehicle: Cycle<br>Weather: Clear");
    L.circle([26.14755, 72.97168], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2359 }).addTo(map).bindPopup("<b>Jodhpur, Rajasthan</b><br>Severity: Minor<br>Vehicle: Truck<br>Weather: Hazy");
    L.circle([21.12386, 79.10258], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3558 }).addTo(map).bindPopup("<b>Nagpur, Maharashtra</b><br>Severity: Fatal<br>Vehicle: Bus<br>Weather: Rainy");
    L.circle([13.11232, 80.22308], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1592 }).addTo(map).bindPopup("<b>Chennai, Tamil Nadu</b><br>Severity: Fatal<br>Vehicle: Car<br>Weather: Stormy");
    L.circle([25.36721, 83.04742], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2054 }).addTo(map).bindPopup("<b>Varanasi, Uttar Pradesh</b><br>Severity: Minor<br>Vehicle: Pedestrian<br>Weather: Hazy");
    L.circle([13.67331, 79.47767], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2027 }).addTo(map).bindPopup("<b>Tirupati, Andhra Pradesh</b><br>Severity: Fatal<br>Vehicle: Cycle<br>Weather: Rainy");
    L.circle([13.11734, 80.23804], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2303 }).addTo(map).bindPopup("<b>Chennai, Tamil Nadu</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Foggy");
    L.circle([28.65796, 77.11545], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3405 }).addTo(map).bindPopup("<b>Rohini, Delhi</b><br>Severity: Fatal<br>Vehicle: Bus<br>Weather: Stormy");
    L.circle([26.67471, 88.33280], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3463 }).addTo(map).bindPopup("<b>Siliguri, West Bengal</b><br>Severity: Minor<br>Vehicle: Bus<br>Weather: Foggy");
    L.circle([24.57861, 73.66707], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3452 }).addTo(map).bindPopup("<b>Udaipur, Rajasthan</b><br>Severity: Serious<br>Vehicle: Bus<br>Weather: Stormy");
    L.circle([26.98199, 75.76468], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2633 }).addTo(map).bindPopup("<b>Jaipur, Rajasthan</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Foggy");
    L.circle([26.91720, 75.87767], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1864 }).addTo(map).bindPopup("<b>Jaipur, Rajasthan</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Hazy");
    L.circle([11.01499, 76.86907], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3428 }).addTo(map).bindPopup("<b>Coimbatore, Tamil Nadu</b><br>Severity: Minor<br>Vehicle: Car<br>Weather: Foggy");
    L.circle([18.56230, 73.82936], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1770 }).addTo(map).bindPopup("<b>Pune, Maharashtra</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Clear");
    L.circle([26.28048, 72.99287], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3537 }).addTo(map).bindPopup("<b>Jodhpur, Rajasthan</b><br>Severity: Serious<br>Vehicle: Auto-Rickshaw<br>Weather: Stormy");
    L.circle([26.43743, 80.28758], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1500 }).addTo(map).bindPopup("<b>Kanpur, Uttar Pradesh</b><br>Severity: Serious<br>Vehicle: Auto-Rickshaw<br>Weather: Rainy");
    L.circle([22.59249, 88.39824], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1908 }).addTo(map).bindPopup("<b>Kolkata, West Bengal</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Rainy");
    L.circle([21.11975, 79.13314], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2458 }).addTo(map).bindPopup("<b>Nagpur, Maharashtra</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Foggy");
    L.circle([26.83186, 80.91135], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2736 }).addTo(map).bindPopup("<b>Lucknow, Uttar Pradesh</b><br>Severity: Serious<br>Vehicle: Bus<br>Weather: Hazy");
    L.circle([24.66627, 73.61925], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3463 }).addTo(map).bindPopup("<b>Udaipur, Rajasthan</b><br>Severity: Minor<br>Vehicle: Bus<br>Weather: Rainy");
    L.circle([22.49271, 88.41220], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2619 }).addTo(map).bindPopup("<b>Kolkata, West Bengal</b><br>Severity: Fatal<br>Vehicle: Cycle<br>Weather: Foggy");
    L.circle([16.52276, 80.56295], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1752 }).addTo(map).bindPopup("<b>Vijayawada, Andhra Pradesh</b><br>Severity: Minor<br>Vehicle: Cycle<br>Weather: Foggy");
    L.circle([12.99653, 77.55883], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1712 }).addTo(map).bindPopup("<b>Bangalore, Karnataka</b><br>Severity: Minor<br>Vehicle: Truck<br>Weather: Rainy");
    L.circle([19.08156, 72.97302], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3426 }).addTo(map).bindPopup("<b>Mumbai, Maharashtra</b><br>Severity: Fatal<br>Vehicle: Cycle<br>Weather: Clear");
    L.circle([26.96885, 75.74412], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3852 }).addTo(map).bindPopup("<b>Jaipur, Rajasthan</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Foggy");
    L.circle([13.01436, 80.24506], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3680 }).addTo(map).bindPopup("<b>Chennai, Tamil Nadu</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Stormy");
    L.circle([21.15879, 72.74678], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2289 }).addTo(map).bindPopup("<b>Surat, Gujarat</b><br>Severity: Fatal<br>Vehicle: Two-Wheeler<br>Weather: Foggy");
    L.circle([13.53230, 79.38155], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2772 }).addTo(map).bindPopup("<b>Tirupati, Andhra Pradesh</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Foggy");
    L.circle([23.11910, 72.57223], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2918 }).addTo(map).bindPopup("<b>Ahmedabad, Gujarat</b><br>Severity: Fatal<br>Vehicle: Car<br>Weather: Hazy");
    L.circle([26.72754, 88.35671], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3228 }).addTo(map).bindPopup("<b>Siliguri, West Bengal</b><br>Severity: Fatal<br>Vehicle: Two-Wheeler<br>Weather: Rainy");
    L.circle([11.08238, 76.96734], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2213 }).addTo(map).bindPopup("<b>Coimbatore, Tamil Nadu</b><br>Severity: Serious<br>Vehicle: Cycle<br>Weather: Foggy");
    L.circle([25.40708, 83.06646], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2289 }).addTo(map).bindPopup("<b>Varanasi, Uttar Pradesh</b><br>Severity: Minor<br>Vehicle: Cycle<br>Weather: Hazy");
    L.circle([11.00188, 76.90783], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2949 }).addTo(map).bindPopup("<b>Coimbatore, Tamil Nadu</b><br>Severity: Fatal<br>Vehicle: Two-Wheeler<br>Weather: Stormy");
    L.circle([13.05493, 80.18112], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1940 }).addTo(map).bindPopup("<b>Chennai, Tamil Nadu</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Foggy");
    L.circle([26.37321, 80.40741], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3178 }).addTo(map).bindPopup("<b>Kanpur, Uttar Pradesh</b><br>Severity: Minor<br>Vehicle: Truck<br>Weather: Clear");
    L.circle([21.22699, 72.91905], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2758 }).addTo(map).bindPopup("<b>Surat, Gujarat</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Clear");
    L.circle([26.51017, 80.30013], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2577 }).addTo(map).bindPopup("<b>Kanpur, Uttar Pradesh</b><br>Severity: Serious<br>Vehicle: Bus<br>Weather: Rainy");
    L.circle([28.50693, 77.01910], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1587 }).addTo(map).bindPopup("<b>Dwarka, Delhi</b><br>Severity: Fatal<br>Vehicle: Two-Wheeler<br>Weather: Rainy");
    L.circle([19.05213, 72.77989], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3577 }).addTo(map).bindPopup("<b>Mumbai, Maharashtra</b><br>Severity: Serious<br>Vehicle: Cycle<br>Weather: Stormy");
    L.circle([26.25978, 73.06098], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3558 }).addTo(map).bindPopup("<b>Jodhpur, Rajasthan</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Stormy");
    L.circle([26.92798, 80.91008], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1773 }).addTo(map).bindPopup("<b>Lucknow, Uttar Pradesh</b><br>Severity: Serious<br>Vehicle: Pedestrian<br>Weather: Foggy");
    L.circle([19.09881, 72.80548], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3287 }).addTo(map).bindPopup("<b>Mumbai, Maharashtra</b><br>Severity: Fatal<br>Vehicle: Truck<br>Weather: Stormy");
    L.circle([9.94944, 78.05847], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3533 }).addTo(map).bindPopup("<b>Madurai, Tamil Nadu</b><br>Severity: Minor<br>Vehicle: Cycle<br>Weather: Foggy");
    L.circle([28.52037, 77.13779], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2397 }).addTo(map).bindPopup("<b>New Delhi, Delhi</b><br>Severity: Serious<br>Vehicle: Two-Wheeler<br>Weather: Foggy");
    L.circle([12.22156, 76.57106], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3477 }).addTo(map).bindPopup("<b>Mysore, Karnataka</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Hazy");
    L.circle([18.48253, 73.82867], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2512 }).addTo(map).bindPopup("<b>Pune, Maharashtra</b><br>Severity: Minor<br>Vehicle: Cycle<br>Weather: Stormy");
    L.circle([24.62222, 73.71864], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3124 }).addTo(map).bindPopup("<b>Udaipur, Rajasthan</b><br>Severity: Serious<br>Vehicle: Pedestrian<br>Weather: Hazy");
    L.circle([19.13475, 72.81799], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3261 }).addTo(map).bindPopup("<b>Mumbai, Maharashtra</b><br>Severity: Fatal<br>Vehicle: Bus<br>Weather: Clear");
    L.circle([10.93913, 76.91680], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2411 }).addTo(map).bindPopup("<b>Coimbatore, Tamil Nadu</b><br>Severity: Fatal<br>Vehicle: Bus<br>Weather: Hazy");
    L.circle([18.54067, 73.93065], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3624 }).addTo(map).bindPopup("<b>Pune, Maharashtra</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Hazy");
    L.circle([11.08571, 76.97402], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1963 }).addTo(map).bindPopup("<b>Coimbatore, Tamil Nadu</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Rainy");
    L.circle([12.82856, 74.82384], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3792 }).addTo(map).bindPopup("<b>Mangalore, Karnataka</b><br>Severity: Serious<br>Vehicle: Bus<br>Weather: Stormy");
    L.circle([16.57326, 80.65376], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1767 }).addTo(map).bindPopup("<b>Vijayawada, Andhra Pradesh</b><br>Severity: Fatal<br>Vehicle: Car<br>Weather: Hazy");
    L.circle([18.47983, 73.76919], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1799 }).addTo(map).bindPopup("<b>Pune, Maharashtra</b><br>Severity: Fatal<br>Vehicle: Car<br>Weather: Hazy");
    L.circle([26.19483, 72.94835], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2299 }).addTo(map).bindPopup("<b>Jodhpur, Rajasthan</b><br>Severity: Serious<br>Vehicle: Two-Wheeler<br>Weather: Rainy");
    L.circle([26.45017, 80.40009], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3757 }).addTo(map).bindPopup("<b>Kanpur, Uttar Pradesh</b><br>Severity: Minor<br>Vehicle: Cycle<br>Weather: Clear");
    L.circle([12.29624, 76.66065], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1805 }).addTo(map).bindPopup("<b>Mysore, Karnataka</b><br>Severity: Fatal<br>Vehicle: Truck<br>Weather: Hazy");
    L.circle([26.78734, 80.87960], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1567 }).addTo(map).bindPopup("<b>Lucknow, Uttar Pradesh</b><br>Severity: Serious<br>Vehicle: Pedestrian<br>Weather: Foggy");
    L.circle([9.89639, 78.09710], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3287 }).addTo(map).bindPopup("<b>Madurai, Tamil Nadu</b><br>Severity: Minor<br>Vehicle: Car<br>Weather: Stormy");
    L.circle([13.00259, 77.62406], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1872 }).addTo(map).bindPopup("<b>Bangalore, Karnataka</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Rainy");
    L.circle([28.69936, 77.17278], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3988 }).addTo(map).bindPopup("<b>New Delhi, Delhi</b><br>Severity: Serious<br>Vehicle: Cycle<br>Weather: Hazy");
    L.circle([23.59285, 87.21598], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3378 }).addTo(map).bindPopup("<b>Durgapur, West Bengal</b><br>Severity: Fatal<br>Vehicle: Auto-Rickshaw<br>Weather: Clear");
    L.circle([26.33818, 72.98674], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3663 }).addTo(map).bindPopup("<b>Jodhpur, Rajasthan</b><br>Severity: Fatal<br>Vehicle: Bus<br>Weather: Foggy");
    L.circle([19.14731, 72.89749], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2075 }).addTo(map).bindPopup("<b>Mumbai, Maharashtra</b><br>Severity: Fatal<br>Vehicle: Truck<br>Weather: Clear");
    L.circle([18.44905, 73.77489], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3858 }).addTo(map).bindPopup("<b>Pune, Maharashtra</b><br>Severity: Fatal<br>Vehicle: Auto-Rickshaw<br>Weather: Foggy");
    L.circle([23.06098, 72.59491], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1789 }).addTo(map).bindPopup("<b>Ahmedabad, Gujarat</b><br>Severity: Fatal<br>Vehicle: Bus<br>Weather: Rainy");
    L.circle([28.70728, 77.00576], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2957 }).addTo(map).bindPopup("<b>Rohini, Delhi</b><br>Severity: Fatal<br>Vehicle: Bus<br>Weather: Foggy");
    L.circle([23.00249, 72.60962], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3663 }).addTo(map).bindPopup("<b>Ahmedabad, Gujarat</b><br>Severity: Fatal<br>Vehicle: Cycle<br>Weather: Hazy");
    L.circle([26.84024, 81.04517], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2706 }).addTo(map).bindPopup("<b>Lucknow, Uttar Pradesh</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Stormy");
    L.circle([16.47615, 80.63820], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2387 }).addTo(map).bindPopup("<b>Vijayawada, Andhra Pradesh</b><br>Severity: Fatal<br>Vehicle: Truck<br>Weather: Stormy");
    L.circle([9.88312, 78.04282], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3229 }).addTo(map).bindPopup("<b>Madurai, Tamil Nadu</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Rainy");
    L.circle([19.05466, 72.93725], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2676 }).addTo(map).bindPopup("<b>Mumbai, Maharashtra</b><br>Severity: Serious<br>Vehicle: Two-Wheeler<br>Weather: Rainy");
    L.circle([23.46296, 87.24370], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3633 }).addTo(map).bindPopup("<b>Durgapur, West Bengal</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Hazy");
    L.circle([25.25208, 82.94680], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2782 }).addTo(map).bindPopup("<b>Varanasi, Uttar Pradesh</b><br>Severity: Minor<br>Vehicle: Truck<br>Weather: Foggy");
    L.circle([23.42959, 87.27118], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2883 }).addTo(map).bindPopup("<b>Durgapur, West Bengal</b><br>Severity: Fatal<br>Vehicle: Truck<br>Weather: Rainy");
    L.circle([22.60942, 88.30841], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3491 }).addTo(map).bindPopup("<b>Kolkata, West Bengal</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Hazy");
    L.circle([13.55936, 79.51064], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2088 }).addTo(map).bindPopup("<b>Tirupati, Andhra Pradesh</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Hazy");
    L.circle([21.15395, 79.18521], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3946 }).addTo(map).bindPopup("<b>Nagpur, Maharashtra</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Rainy");
    L.circle([12.23994, 76.63650], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2586 }).addTo(map).bindPopup("<b>Mysore, Karnataka</b><br>Severity: Fatal<br>Vehicle: Two-Wheeler<br>Weather: Clear");
    L.circle([26.54167, 80.25156], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3164 }).addTo(map).bindPopup("<b>Kanpur, Uttar Pradesh</b><br>Severity: Fatal<br>Vehicle: Two-Wheeler<br>Weather: Stormy");
    L.circle([13.58592, 79.36103], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3346 }).addTo(map).bindPopup("<b>Tirupati, Andhra Pradesh</b><br>Severity: Fatal<br>Vehicle: Two-Wheeler<br>Weather: Rainy");
    L.circle([26.85371, 81.01397], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3072 }).addTo(map).bindPopup("<b>Lucknow, Uttar Pradesh</b><br>Severity: Minor<br>Vehicle: Pedestrian<br>Weather: Stormy");
    L.circle([10.92928, 76.95178], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3231 }).addTo(map).bindPopup("<b>Coimbatore, Tamil Nadu</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Stormy");
    L.circle([24.62681, 73.63966], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1664 }).addTo(map).bindPopup("<b>Udaipur, Rajasthan</b><br>Severity: Minor<br>Vehicle: Car<br>Weather: Clear");
    L.circle([13.00245, 77.63972], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3003 }).addTo(map).bindPopup("<b>Bangalore, Karnataka</b><br>Severity: Fatal<br>Vehicle: Auto-Rickshaw<br>Weather: Stormy");
    L.circle([11.06820, 76.95063], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3461 }).addTo(map).bindPopup("<b>Coimbatore, Tamil Nadu</b><br>Severity: Minor<br>Vehicle: Bus<br>Weather: Foggy");
    L.circle([26.80956, 80.99691], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2368 }).addTo(map).bindPopup("<b>Lucknow, Uttar Pradesh</b><br>Severity: Minor<br>Vehicle: Cycle<br>Weather: Hazy");
    L.circle([27.00557, 75.71435], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2883 }).addTo(map).bindPopup("<b>Jaipur, Rajasthan</b><br>Severity: Fatal<br>Vehicle: Truck<br>Weather: Hazy");
    L.circle([26.88702, 75.80195], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1634 }).addTo(map).bindPopup("<b>Jaipur, Rajasthan</b><br>Severity: Minor<br>Vehicle: Bus<br>Weather: Hazy");
    L.circle([19.02466, 72.84486], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3471 }).addTo(map).bindPopup("<b>Mumbai, Maharashtra</b><br>Severity: Serious<br>Vehicle: Bus<br>Weather: Hazy");
    L.circle([28.56667, 77.18298], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2618 }).addTo(map).bindPopup("<b>New Delhi, Delhi</b><br>Severity: Serious<br>Vehicle: Two-Wheeler<br>Weather: Stormy");
    L.circle([22.55489, 88.42219], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2246 }).addTo(map).bindPopup("<b>Kolkata, West Bengal</b><br>Severity: Fatal<br>Vehicle: Cycle<br>Weather: Hazy");
    L.circle([18.42529, 73.92369], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3189 }).addTo(map).bindPopup("<b>Pune, Maharashtra</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Hazy");
    L.circle([23.11166, 72.50177], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3439 }).addTo(map).bindPopup("<b>Ahmedabad, Gujarat</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Stormy");
    L.circle([12.27509, 76.57020], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1709 }).addTo(map).bindPopup("<b>Mysore, Karnataka</b><br>Severity: Fatal<br>Vehicle: Bus<br>Weather: Hazy");
    L.circle([23.55251, 87.40802], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1844 }).addTo(map).bindPopup("<b>Durgapur, West Bengal</b><br>Severity: Fatal<br>Vehicle: Truck<br>Weather: Hazy");
    L.circle([21.14547, 72.80334], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2679 }).addTo(map).bindPopup("<b>Surat, Gujarat</b><br>Severity: Serious<br>Vehicle: Auto-Rickshaw<br>Weather: Rainy");
    L.circle([26.15552, 73.03208], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2688 }).addTo(map).bindPopup("<b>Jodhpur, Rajasthan</b><br>Severity: Minor<br>Vehicle: Pedestrian<br>Weather: Clear");
    L.circle([26.18334, 72.94610], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1545 }).addTo(map).bindPopup("<b>Jodhpur, Rajasthan</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Clear");
    L.circle([26.42303, 80.40654], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3831 }).addTo(map).bindPopup("<b>Kanpur, Uttar Pradesh</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Foggy");
    L.circle([13.12051, 80.36629], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3368 }).addTo(map).bindPopup("<b>Chennai, Tamil Nadu</b><br>Severity: Fatal<br>Vehicle: Car<br>Weather: Hazy");
    L.circle([13.02245, 80.34398], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1812 }).addTo(map).bindPopup("<b>Chennai, Tamil Nadu</b><br>Severity: Fatal<br>Vehicle: Auto-Rickshaw<br>Weather: Foggy");
    L.circle([12.98748, 80.35718], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1716 }).addTo(map).bindPopup("<b>Chennai, Tamil Nadu</b><br>Severity: Serious<br>Vehicle: Bus<br>Weather: Rainy");
    L.circle([26.69787, 88.43618], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2092 }).addTo(map).bindPopup("<b>Siliguri, West Bengal</b><br>Severity: Serious<br>Vehicle: Auto-Rickshaw<br>Weather: Rainy");
    L.circle([26.92389, 80.98852], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3676 }).addTo(map).bindPopup("<b>Lucknow, Uttar Pradesh</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Rainy");
    L.circle([26.73770, 88.32779], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1855 }).addTo(map).bindPopup("<b>Siliguri, West Bengal</b><br>Severity: Serious<br>Vehicle: Bus<br>Weather: Rainy");
    L.circle([16.47845, 80.56659], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2803 }).addTo(map).bindPopup("<b>Vijayawada, Andhra Pradesh</b><br>Severity: Fatal<br>Vehicle: Two-Wheeler<br>Weather: Clear");
    L.circle([13.04395, 80.21055], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2111 }).addTo(map).bindPopup("<b>Chennai, Tamil Nadu</b><br>Severity: Fatal<br>Vehicle: Car<br>Weather: Foggy");
    L.circle([12.91235, 77.60368], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2181 }).addTo(map).bindPopup("<b>Bangalore, Karnataka</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Clear");
    L.circle([24.51700, 73.68275], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2187 }).addTo(map).bindPopup("<b>Udaipur, Rajasthan</b><br>Severity: Fatal<br>Vehicle: Car<br>Weather: Hazy");
    L.circle([21.12055, 79.09827], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3775 }).addTo(map).bindPopup("<b>Nagpur, Maharashtra</b><br>Severity: Serious<br>Vehicle: Cycle<br>Weather: Foggy");
    L.circle([18.53235, 73.81457], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3332 }).addTo(map).bindPopup("<b>Pune, Maharashtra</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Clear");
    L.circle([12.30347, 76.68646], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3311 }).addTo(map).bindPopup("<b>Mysore, Karnataka</b><br>Severity: Serious<br>Vehicle: Pedestrian<br>Weather: Stormy");
    L.circle([18.53978, 73.85826], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2338 }).addTo(map).bindPopup("<b>Pune, Maharashtra</b><br>Severity: Serious<br>Vehicle: Two-Wheeler<br>Weather: Foggy");
    L.circle([23.61754, 87.35275], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3026 }).addTo(map).bindPopup("<b>Durgapur, West Bengal</b><br>Severity: Serious<br>Vehicle: Pedestrian<br>Weather: Hazy");
    L.circle([23.55162, 87.29305], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2464 }).addTo(map).bindPopup("<b>Durgapur, West Bengal</b><br>Severity: Fatal<br>Vehicle: Truck<br>Weather: Stormy");
    L.circle([28.57392, 77.26347], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3405 }).addTo(map).bindPopup("<b>New Delhi, Delhi</b><br>Severity: Fatal<br>Vehicle: Two-Wheeler<br>Weather: Clear");
    L.circle([11.07008, 76.93911], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2608 }).addTo(map).bindPopup("<b>Coimbatore, Tamil Nadu</b><br>Severity: Serious<br>Vehicle: Car<br>Weather: Rainy");
    L.circle([13.62493, 79.32799], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1655 }).addTo(map).bindPopup("<b>Tirupati, Andhra Pradesh</b><br>Severity: Serious<br>Vehicle: Two-Wheeler<br>Weather: Foggy");
    L.circle([13.07310, 80.36863], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2573 }).addTo(map).bindPopup("<b>Chennai, Tamil Nadu</b><br>Severity: Serious<br>Vehicle: Pedestrian<br>Weather: Foggy");
    L.circle([21.14455, 72.80737], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2439 }).addTo(map).bindPopup("<b>Surat, Gujarat</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Clear");
    L.circle([28.69146, 77.09043], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3407 }).addTo(map).bindPopup("<b>Dwarka, Delhi</b><br>Severity: Serious<br>Vehicle: Cycle<br>Weather: Stormy");
    L.circle([28.60599, 77.08587], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1997 }).addTo(map).bindPopup("<b>Dwarka, Delhi</b><br>Severity: Minor<br>Vehicle: Truck<br>Weather: Foggy");
    L.circle([21.12366, 72.76609], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1974 }).addTo(map).bindPopup("<b>Surat, Gujarat</b><br>Severity: Minor<br>Vehicle: Car<br>Weather: Hazy");
    L.circle([26.67033, 88.31270], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1645 }).addTo(map).bindPopup("<b>Siliguri, West Bengal</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Stormy");
    L.circle([12.92178, 74.79307], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3072 }).addTo(map).bindPopup("<b>Mangalore, Karnataka</b><br>Severity: Fatal<br>Vehicle: Cycle<br>Weather: Stormy");
    L.circle([12.85589, 74.85439], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1870 }).addTo(map).bindPopup("<b>Mangalore, Karnataka</b><br>Severity: Fatal<br>Vehicle: Truck<br>Weather: Rainy");
    L.circle([26.95339, 75.86854], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3556 }).addTo(map).bindPopup("<b>Jaipur, Rajasthan</b><br>Severity: Fatal<br>Vehicle: Car<br>Weather: Stormy");
    L.circle([25.22898, 82.95768], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1985 }).addTo(map).bindPopup("<b>Varanasi, Uttar Pradesh</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Rainy");
    L.circle([26.26562, 72.92945], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1886 }).addTo(map).bindPopup("<b>Jodhpur, Rajasthan</b><br>Severity: Serious<br>Vehicle: Pedestrian<br>Weather: Clear");
    L.circle([13.05231, 77.67465], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3658 }).addTo(map).bindPopup("<b>Bangalore, Karnataka</b><br>Severity: Minor<br>Vehicle: Pedestrian<br>Weather: Foggy");
    L.circle([26.89979, 75.74182], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3659 }).addTo(map).bindPopup("<b>Jaipur, Rajasthan</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Foggy");
    L.circle([23.07614, 72.62496], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1887 }).addTo(map).bindPopup("<b>Ahmedabad, Gujarat</b><br>Severity: Serious<br>Vehicle: Two-Wheeler<br>Weather: Hazy");
    L.circle([9.89391, 78.13345], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1746 }).addTo(map).bindPopup("<b>Madurai, Tamil Nadu</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Rainy");
    L.circle([12.81071, 74.81412], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3707 }).addTo(map).bindPopup("<b>Mangalore, Karnataka</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Stormy");
    L.circle([18.49567, 73.94648], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2330 }).addTo(map).bindPopup("<b>Pune, Maharashtra</b><br>Severity: Serious<br>Vehicle: Two-Wheeler<br>Weather: Clear");
    L.circle([22.59988, 88.26716], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2491 }).addTo(map).bindPopup("<b>Kolkata, West Bengal</b><br>Severity: Serious<br>Vehicle: Bus<br>Weather: Rainy");
    L.circle([28.53759, 77.17903], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2322 }).addTo(map).bindPopup("<b>New Delhi, Delhi</b><br>Severity: Minor<br>Vehicle: Bus<br>Weather: Clear");
    L.circle([26.76492, 81.02484], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3176 }).addTo(map).bindPopup("<b>Lucknow, Uttar Pradesh</b><br>Severity: Minor<br>Vehicle: Bus<br>Weather: Clear");
    L.circle([13.55341, 79.35706], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2821 }).addTo(map).bindPopup("<b>Tirupati, Andhra Pradesh</b><br>Severity: Serious<br>Vehicle: Cycle<br>Weather: Clear");
    L.circle([12.25820, 76.55347], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3926 }).addTo(map).bindPopup("<b>Mysore, Karnataka</b><br>Severity: Serious<br>Vehicle: Two-Wheeler<br>Weather: Rainy");
    L.circle([19.16516, 72.89665], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3900 }).addTo(map).bindPopup("<b>Mumbai, Maharashtra</b><br>Severity: Serious<br>Vehicle: Car<br>Weather: Foggy");
    L.circle([13.54819, 79.40538], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3263 }).addTo(map).bindPopup("<b>Tirupati, Andhra Pradesh</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Hazy");
    L.circle([26.92965, 80.86725], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3051 }).addTo(map).bindPopup("<b>Lucknow, Uttar Pradesh</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Clear");
    L.circle([9.95934, 78.17131], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2607 }).addTo(map).bindPopup("<b>Madurai, Tamil Nadu</b><br>Severity: Minor<br>Vehicle: Bus<br>Weather: Stormy");
    L.circle([26.79683, 81.00913], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1583 }).addTo(map).bindPopup("<b>Lucknow, Uttar Pradesh</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Rainy");
    L.circle([24.49764, 73.66188], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2046 }).addTo(map).bindPopup("<b>Udaipur, Rajasthan</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Stormy");
    L.circle([26.49590, 80.40840], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3464 }).addTo(map).bindPopup("<b>Kanpur, Uttar Pradesh</b><br>Severity: Serious<br>Vehicle: Two-Wheeler<br>Weather: Foggy");
    L.circle([16.46000, 80.73709], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1969 }).addTo(map).bindPopup("<b>Vijayawada, Andhra Pradesh</b><br>Severity: Serious<br>Vehicle: Bus<br>Weather: Rainy");
    L.circle([10.94834, 76.92900], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2922 }).addTo(map).bindPopup("<b>Coimbatore, Tamil Nadu</b><br>Severity: Fatal<br>Vehicle: Car<br>Weather: Clear");
    L.circle([26.92053, 75.79959], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3967 }).addTo(map).bindPopup("<b>Jaipur, Rajasthan</b><br>Severity: Fatal<br>Vehicle: Two-Wheeler<br>Weather: Rainy");
    L.circle([12.34443, 76.71992], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2201 }).addTo(map).bindPopup("<b>Mysore, Karnataka</b><br>Severity: Fatal<br>Vehicle: Bus<br>Weather: Foggy");
    L.circle([18.48981, 73.82192], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2103 }).addTo(map).bindPopup("<b>Pune, Maharashtra</b><br>Severity: Minor<br>Vehicle: Pedestrian<br>Weather: Foggy");
    L.circle([26.91122, 75.74277], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1758 }).addTo(map).bindPopup("<b>Jaipur, Rajasthan</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Foggy");
    L.circle([21.20876, 72.88150], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1708 }).addTo(map).bindPopup("<b>Surat, Gujarat</b><br>Severity: Fatal<br>Vehicle: Auto-Rickshaw<br>Weather: Clear");
    L.circle([21.18266, 72.87202], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2497 }).addTo(map).bindPopup("<b>Surat, Gujarat</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Clear");
    L.circle([12.99784, 80.19765], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2077 }).addTo(map).bindPopup("<b>Chennai, Tamil Nadu</b><br>Severity: Fatal<br>Vehicle: Truck<br>Weather: Foggy");
    L.circle([26.90410, 75.73904], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2959 }).addTo(map).bindPopup("<b>Jaipur, Rajasthan</b><br>Severity: Fatal<br>Vehicle: Auto-Rickshaw<br>Weather: Hazy");
    L.circle([28.53791, 76.96313], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3060 }).addTo(map).bindPopup("<b>Dwarka, Delhi</b><br>Severity: Fatal<br>Vehicle: Two-Wheeler<br>Weather: Clear");
    L.circle([28.67461, 77.12785], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1758 }).addTo(map).bindPopup("<b>New Delhi, Delhi</b><br>Severity: Fatal<br>Vehicle: Car<br>Weather: Stormy");
    L.circle([22.66439, 88.34875], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2678 }).addTo(map).bindPopup("<b>Kolkata, West Bengal</b><br>Severity: Minor<br>Vehicle: Pedestrian<br>Weather: Stormy");
    L.circle([26.84926, 75.85242], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1745 }).addTo(map).bindPopup("<b>Jaipur, Rajasthan</b><br>Severity: Minor<br>Vehicle: Truck<br>Weather: Clear");
    L.circle([22.59343, 88.41019], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3547 }).addTo(map).bindPopup("<b>Kolkata, West Bengal</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Stormy");
    L.circle([12.94236, 77.56564], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2121 }).addTo(map).bindPopup("<b>Bangalore, Karnataka</b><br>Severity: Serious<br>Vehicle: Two-Wheeler<br>Weather: Hazy");
    L.circle([18.52292, 73.91727], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2572 }).addTo(map).bindPopup("<b>Pune, Maharashtra</b><br>Severity: Serious<br>Vehicle: Two-Wheeler<br>Weather: Rainy");
    L.circle([12.38525, 76.56785], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2536 }).addTo(map).bindPopup("<b>Mysore, Karnataka</b><br>Severity: Fatal<br>Vehicle: Cycle<br>Weather: Clear");
    L.circle([26.17757, 73.10673], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2748 }).addTo(map).bindPopup("<b>Jodhpur, Rajasthan</b><br>Severity: Fatal<br>Vehicle: Bus<br>Weather: Rainy");
    L.circle([18.54668, 73.94814], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3780 }).addTo(map).bindPopup("<b>Pune, Maharashtra</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Hazy");
    L.circle([21.22485, 79.16680], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3553 }).addTo(map).bindPopup("<b>Nagpur, Maharashtra</b><br>Severity: Serious<br>Vehicle: Auto-Rickshaw<br>Weather: Foggy");
    L.circle([22.63745, 88.41659], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2915 }).addTo(map).bindPopup("<b>Kolkata, West Bengal</b><br>Severity: Fatal<br>Vehicle: Truck<br>Weather: Foggy");
    L.circle([16.42021, 80.73628], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3872 }).addTo(map).bindPopup("<b>Vijayawada, Andhra Pradesh</b><br>Severity: Fatal<br>Vehicle: Two-Wheeler<br>Weather: Stormy");
    L.circle([28.64161, 77.30585], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2719 }).addTo(map).bindPopup("<b>New Delhi, Delhi</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Clear");
    L.circle([19.10492, 72.95860], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1633 }).addTo(map).bindPopup("<b>Mumbai, Maharashtra</b><br>Severity: Fatal<br>Vehicle: Car<br>Weather: Foggy");
    L.circle([16.41501, 80.58769], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2736 }).addTo(map).bindPopup("<b>Vijayawada, Andhra Pradesh</b><br>Severity: Serious<br>Vehicle: Car<br>Weather: Hazy");
    L.circle([22.52982, 88.41019], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2516 }).addTo(map).bindPopup("<b>Kolkata, West Bengal</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Foggy");
    L.circle([28.67373, 77.06207], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1914 }).addTo(map).bindPopup("<b>Rohini, Delhi</b><br>Severity: Fatal<br>Vehicle: Truck<br>Weather: Rainy");
    L.circle([13.68545, 79.46519], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2253 }).addTo(map).bindPopup("<b>Tirupati, Andhra Pradesh</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Hazy");
    L.circle([22.47702, 88.33714], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2121 }).addTo(map).bindPopup("<b>Kolkata, West Bengal</b><br>Severity: Serious<br>Vehicle: Car<br>Weather: Rainy");
    L.circle([23.45967, 87.29855], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3312 }).addTo(map).bindPopup("<b>Durgapur, West Bengal</b><br>Severity: Serious<br>Vehicle: Cycle<br>Weather: Foggy");
    L.circle([12.84708, 74.84959], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2248 }).addTo(map).bindPopup("<b>Mangalore, Karnataka</b><br>Severity: Minor<br>Vehicle: Cycle<br>Weather: Stormy");
    L.circle([25.29826, 82.93023], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1599 }).addTo(map).bindPopup("<b>Varanasi, Uttar Pradesh</b><br>Severity: Fatal<br>Vehicle: Two-Wheeler<br>Weather: Rainy");
    L.circle([21.12481, 72.90191], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2355 }).addTo(map).bindPopup("<b>Surat, Gujarat</b><br>Severity: Minor<br>Vehicle: Pedestrian<br>Weather: Foggy");
    L.circle([16.57908, 80.70887], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3207 }).addTo(map).bindPopup("<b>Vijayawada, Andhra Pradesh</b><br>Severity: Minor<br>Vehicle: Truck<br>Weather: Foggy");
    L.circle([25.24583, 82.96153], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1770 }).addTo(map).bindPopup("<b>Varanasi, Uttar Pradesh</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Stormy");
    L.circle([23.54073, 87.40484], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1890 }).addTo(map).bindPopup("<b>Durgapur, West Bengal</b><br>Severity: Minor<br>Vehicle: Pedestrian<br>Weather: Clear");
    L.circle([26.92009, 80.94148], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1743 }).addTo(map).bindPopup("<b>Lucknow, Uttar Pradesh</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Clear");
    L.circle([10.98991, 76.95768], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2550 }).addTo(map).bindPopup("<b>Coimbatore, Tamil Nadu</b><br>Severity: Minor<br>Vehicle: Cycle<br>Weather: Hazy");
    L.circle([22.99917, 72.60669], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1504 }).addTo(map).bindPopup("<b>Ahmedabad, Gujarat</b><br>Severity: Serious<br>Vehicle: Pedestrian<br>Weather: Stormy");
    L.circle([9.90832, 78.16441], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3295 }).addTo(map).bindPopup("<b>Madurai, Tamil Nadu</b><br>Severity: Minor<br>Vehicle: Two-Wheeler<br>Weather: Stormy");
    L.circle([12.92495, 74.93843], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3921 }).addTo(map).bindPopup("<b>Mangalore, Karnataka</b><br>Severity: Serious<br>Vehicle: Car<br>Weather: Hazy");
    L.circle([23.48244, 87.34304], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2559 }).addTo(map).bindPopup("<b>Durgapur, West Bengal</b><br>Severity: Minor<br>Vehicle: Car<br>Weather: Hazy");
    L.circle([12.80106, 74.90020], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2675 }).addTo(map).bindPopup("<b>Mangalore, Karnataka</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Hazy");
    L.circle([23.50008, 87.22572], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2612 }).addTo(map).bindPopup("<b>Durgapur, West Bengal</b><br>Severity: Minor<br>Vehicle: Pedestrian<br>Weather: Rainy");
    L.circle([26.83514, 80.89427], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2915 }).addTo(map).bindPopup("<b>Lucknow, Uttar Pradesh</b><br>Severity: Serious<br>Vehicle: Car<br>Weather: Hazy");
    L.circle([26.89555, 80.90964], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3338 }).addTo(map).bindPopup("<b>Lucknow, Uttar Pradesh</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Foggy");
    L.circle([12.24326, 76.57075], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1826 }).addTo(map).bindPopup("<b>Mysore, Karnataka</b><br>Severity: Minor<br>Vehicle: Pedestrian<br>Weather: Rainy");
    L.circle([26.89190, 81.02490], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3859 }).addTo(map).bindPopup("<b>Lucknow, Uttar Pradesh</b><br>Severity: Serious<br>Vehicle: Cycle<br>Weather: Clear");
    L.circle([13.12775, 80.26832], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2490 }).addTo(map).bindPopup("<b>Chennai, Tamil Nadu</b><br>Severity: Fatal<br>Vehicle: Two-Wheeler<br>Weather: Rainy");
    L.circle([28.70111, 77.28234], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2351 }).addTo(map).bindPopup("<b>New Delhi, Delhi</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Hazy");
    L.circle([9.93028, 78.09771], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3427 }).addTo(map).bindPopup("<b>Madurai, Tamil Nadu</b><br>Severity: Fatal<br>Vehicle: Bus<br>Weather: Stormy");
    L.circle([22.98614, 72.51534], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3106 }).addTo(map).bindPopup("<b>Ahmedabad, Gujarat</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Foggy");
    L.circle([28.58798, 77.16869], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3135 }).addTo(map).bindPopup("<b>New Delhi, Delhi</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Clear");
    L.circle([16.58805, 80.68543], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 1598 }).addTo(map).bindPopup("<b>Vijayawada, Andhra Pradesh</b><br>Severity: Serious<br>Vehicle: Car<br>Weather: Rainy");
    L.circle([13.11030, 80.18655], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3165 }).addTo(map).bindPopup("<b>Chennai, Tamil Nadu</b><br>Severity: Fatal<br>Vehicle: Bus<br>Weather: Rainy");
    L.circle([28.56884, 77.09506], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2787 }).addTo(map).bindPopup("<b>Dwarka, Delhi</b><br>Severity: Serious<br>Vehicle: Cycle<br>Weather: Rainy");
    L.circle([19.16876, 72.83476], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3993 }).addTo(map).bindPopup("<b>Mumbai, Maharashtra</b><br>Severity: Minor<br>Vehicle: Car<br>Weather: Rainy");
    L.circle([25.25973, 83.04535], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1589 }).addTo(map).bindPopup("<b>Varanasi, Uttar Pradesh</b><br>Severity: Minor<br>Vehicle: Pedestrian<br>Weather: Hazy");
    L.circle([24.62379, 73.63350], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3453 }).addTo(map).bindPopup("<b>Udaipur, Rajasthan</b><br>Severity: Minor<br>Vehicle: Pedestrian<br>Weather: Stormy");
    L.circle([26.25925, 73.11492], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3452 }).addTo(map).bindPopup("<b>Jodhpur, Rajasthan</b><br>Severity: Minor<br>Vehicle: Car<br>Weather: Foggy");
    L.circle([23.56518, 87.28396], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3342 }).addTo(map).bindPopup("<b>Durgapur, West Bengal</b><br>Severity: Fatal<br>Vehicle: Car<br>Weather: Clear");
    L.circle([13.00256, 80.18907], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3532 }).addTo(map).bindPopup("<b>Chennai, Tamil Nadu</b><br>Severity: Serious<br>Vehicle: Car<br>Weather: Rainy");
    L.circle([19.12983, 72.89252], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3952 }).addTo(map).bindPopup("<b>Mumbai, Maharashtra</b><br>Severity: Minor<br>Vehicle: Pedestrian<br>Weather: Rainy");
    L.circle([12.89083, 77.68246], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3048 }).addTo(map).bindPopup("<b>Bangalore, Karnataka</b><br>Severity: Minor<br>Vehicle: Pedestrian<br>Weather: Stormy");
    L.circle([28.52974, 77.13786], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2111 }).addTo(map).bindPopup("<b>New Delhi, Delhi</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Hazy");
    L.circle([10.96857, 77.02517], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3243 }).addTo(map).bindPopup("<b>Coimbatore, Tamil Nadu</b><br>Severity: Minor<br>Vehicle: Bus<br>Weather: Hazy");
    L.circle([16.51293, 80.66410], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3963 }).addTo(map).bindPopup("<b>Vijayawada, Andhra Pradesh</b><br>Severity: Minor<br>Vehicle: Car<br>Weather: Stormy");
    L.circle([12.94593, 74.80396], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2539 }).addTo(map).bindPopup("<b>Mangalore, Karnataka</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Stormy");
    L.circle([26.30542, 73.00985], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3322 }).addTo(map).bindPopup("<b>Jodhpur, Rajasthan</b><br>Severity: Fatal<br>Vehicle: Pedestrian<br>Weather: Rainy");
    L.circle([28.68151, 77.02275], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2943 }).addTo(map).bindPopup("<b>Dwarka, Delhi</b><br>Severity: Minor<br>Vehicle: Truck<br>Weather: Clear");
    L.circle([21.16168, 72.86833], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3934 }).addTo(map).bindPopup("<b>Surat, Gujarat</b><br>Severity: Serious<br>Vehicle: Two-Wheeler<br>Weather: Stormy");
    L.circle([26.76825, 88.30214], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 2122 }).addTo(map).bindPopup("<b>Siliguri, West Bengal</b><br>Severity: Serious<br>Vehicle: Car<br>Weather: Stormy");
    L.circle([28.64961, 77.07494], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3296 }).addTo(map).bindPopup("<b>Rohini, Delhi</b><br>Severity: Serious<br>Vehicle: Two-Wheeler<br>Weather: Stormy");
    L.circle([13.68990, 79.51275], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2903 }).addTo(map).bindPopup("<b>Tirupati, Andhra Pradesh</b><br>Severity: Fatal<br>Vehicle: Car<br>Weather: Foggy");
    L.circle([28.64845, 77.20363], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2852 }).addTo(map).bindPopup("<b>New Delhi, Delhi</b><br>Severity: Fatal<br>Vehicle: Auto-Rickshaw<br>Weather: Hazy");
    L.circle([22.60332, 88.40436], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3710 }).addTo(map).bindPopup("<b>Kolkata, West Bengal</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Clear");
    L.circle([26.81650, 88.46250], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3895 }).addTo(map).bindPopup("<b>Siliguri, West Bengal</b><br>Severity: Minor<br>Vehicle: Car<br>Weather: Stormy");
    L.circle([9.96329, 78.02247], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3583 }).addTo(map).bindPopup("<b>Madurai, Tamil Nadu</b><br>Severity: Minor<br>Vehicle: Cycle<br>Weather: Rainy");
    L.circle([28.66998, 77.14787], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 2779 }).addTo(map).bindPopup("<b>Rohini, Delhi</b><br>Severity: Minor<br>Vehicle: Car<br>Weather: Hazy");
    L.circle([25.39394, 82.95514], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3886 }).addTo(map).bindPopup("<b>Varanasi, Uttar Pradesh</b><br>Severity: Minor<br>Vehicle: Bus<br>Weather: Hazy");
    L.circle([24.54155, 73.67043], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3373 }).addTo(map).bindPopup("<b>Udaipur, Rajasthan</b><br>Severity: Serious<br>Vehicle: Pedestrian<br>Weather: Stormy");
    L.circle([22.97126, 72.62456], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3079 }).addTo(map).bindPopup("<b>Ahmedabad, Gujarat</b><br>Severity: Serious<br>Vehicle: Auto-Rickshaw<br>Weather: Hazy");
    L.circle([28.76041, 77.12641], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 3159 }).addTo(map).bindPopup("<b>Rohini, Delhi</b><br>Severity: Minor<br>Vehicle: Truck<br>Weather: Foggy");
    L.circle([13.08481, 80.25081], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 1839 }).addTo(map).bindPopup("<b>Chennai, Tamil Nadu</b><br>Severity: Fatal<br>Vehicle: Truck<br>Weather: Rainy");
    L.circle([23.44367, 87.39203], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 3609 }).addTo(map).bindPopup("<b>Durgapur, West Bengal</b><br>Severity: Fatal<br>Vehicle: Truck<br>Weather: Rainy");
    L.circle([24.56455, 73.64551], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3193 }).addTo(map).bindPopup("<b>Udaipur, Rajasthan</b><br>Severity: Serious<br>Vehicle: Truck<br>Weather: Foggy");
    L.circle([21.06815, 79.07582], { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3, radius: 1607 }).addTo(map).bindPopup("<b>Nagpur, Maharashtra</b><br>Severity: Minor<br>Vehicle: Auto-Rickshaw<br>Weather: Hazy");
    L.circle([28.54282, 76.95086], { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, radius: 3614 }).addTo(map).bindPopup("<b>Dwarka, Delhi</b><br>Severity: Serious<br>Vehicle: Bus<br>Weather: Rainy");
    mapInitialized = true;
});

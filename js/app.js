/**
 * Thai Astrology UI Manager & Interactions
 * Manages:
 * 1. Form inputs and submissions for Destiny & Compatibility.
 * 2. Dynamic SVG drawing of the traditional circular Thai Zodiac Chart.
 * 3. Life Graph Canvas rendering with smooth bezier curves, gradients, and custom themes.
 * 4. Interactive Siemsee cup shaking animation with Web Audio API sound synthesis.
 * 5. Tab swapping and responsive design helpers.
 */

// Global State for current Natal Chart
let currentNatalAscendant = 2; // Default Gemini
let currentNatalPlanets = [
  { num: '๑', sign: 2 },
  { num: '๒', sign: 5 },
  { num: '๓', sign: 0 },
  { num: '๔', sign: 2 },
  { num: '๕', sign: 8 },
  { num: '๖', sign: 3 },
  { num: '๗', sign: 9 },
  { num: '๘', sign: 10 },
  { num: '๙', sign: 11 },
  { num: '๐', sign: 1 }
];
let hasCalculatedDestiny = true; // Enabled by default to allow interaction on preview load

document.addEventListener('DOMContentLoaded', () => {
  initThaiDatePickers();
  initThaiTimePickers();
  initTabs();

  // Destiny Form handler
  const destinyForm = document.getElementById('destiny-form');
  if (destinyForm) {
    destinyForm.addEventListener('submit', handleDestinySubmit);
  }

  // Compatibility Form handler
  const loveForm = document.getElementById('love-form');
  if (loveForm) {
    loveForm.addEventListener('submit', handleCompatibilitySubmit);
  }

  // Initialize Siemsee sticks and interactions
  initSiemsee();

  // Initialize new Phase 2 & 3 features
  initThaksa();
  initNumerology();
  initDream();
  initColors();
  initChinese();

  // Populate default dates to forms for quick testing
  initDefaultDates();

  // Initialize Planet Transits listeners
  initTransits();

  // Draw a default chart for visual aesthetics on load
  drawDefaultZodiacOnLoad();
});


// Setup current dates as default value
function initDefaultDates() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const dateVal = `${yyyy}-${mm}-${dd}`;

  window.setThaiDate('birth-date', dateVal);
  window.setThaiDate('love-p1-date', dateVal);
  
  const transitDateInput = document.getElementById('transit-date');
  if (transitDateInput) {
    window.setThaiDate('transit-date', dateVal);
  }
  
  // Partner's default date (2 years ago from today)
  const partnerDate = new Date();
  partnerDate.setFullYear(yyyy - 2);
  const pY = partnerDate.getFullYear();
  const pM = String(partnerDate.getMonth() + 1).padStart(2, '0');
  const pD = String(partnerDate.getDate()).padStart(2, '0');
  window.setThaiDate('love-p2-date', `${pY}-${pM}-${pD}`);
}

/**
 * Manage Tab switching
 */
function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const views = document.querySelectorAll('.view-section');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-target');

      tabs.forEach(t => t.classList.remove('active'));
      views.forEach(v => v.classList.remove('active'));

      tab.classList.add('active');
      const targetView = document.getElementById(target);
      targetView.classList.add('active');

      // If switching to Life Graph view, render or adjust the graph canvas
      if (target === 'graph-view') {
        const birthDate = document.getElementById('birth-date').value;
        renderLifeGraph(birthDate || new Date().toISOString().split('T')[0]);
      }
      
      // If switching to History view, load data from Supabase
      if (target === 'history-view') {
        if (typeof loadHistory === 'function') loadHistory();
      }
    });
  });

  // Reading sub-tabs switching (inside Destiny results)
  const subTabs = document.querySelectorAll('.sub-tab-btn');
  subTabs.forEach(subTab => {
    subTab.addEventListener('click', () => {
      const targetSub = subTab.getAttribute('data-sub');
      const container = subTab.closest('#destiny-result-details');
      
      container.querySelectorAll('.sub-tab-btn').forEach(btn => btn.classList.remove('active'));
      container.querySelectorAll('.sub-tab-content').forEach(content => content.style.display = 'none');

      subTab.classList.add('active');
      document.getElementById(targetSub).style.display = 'block';

      // Auto-enable transits display overlay if user clicks on the transits tab
      if (targetSub === 'tab-transits') {
        const transitDisplay = document.getElementById('transit-display');
        if (transitDisplay) {
          transitDisplay.value = 'show';
        }
        updateTransits();
      }
    });
  });
}

/**
 * Handles Destiny Calculation submission
 */
function handleDestinySubmit() {
  const name = document.getElementById('user-name').value || 'เจ้าชะตา';
  const birthDate = document.getElementById('birth-date').value;
  const birthTime = document.getElementById('birth-time').value;
  const province = document.getElementById('birth-province').value;

  if (!birthDate || !birthTime) return;

  // 1. Calculate Astrological features
  const zodiacIdx = ThaiAstrology.getZodiacSign(
    Number(birthDate.split('-')[2]),
    Number(birthDate.split('-')[1])
  );
  const ascendantIdx = ThaiAstrology.calculateAscendant(birthDate, birthTime);
  const dayIdx = ThaiAstrology.getThaiDayOfWeek(birthDate, birthTime);

  const dayDetails = ThaiAstrology.DAYS[dayIdx];
  const zodiacDetails = ThaiAstrology.ZODIACS[zodiacIdx];
  const ascendantDetails = ThaiAstrology.ZODIACS[ascendantIdx];

  // Calculate planetary placements
  const planets = ThaiAstrology.calculatePlanets(birthDate, birthTime);

  // 2. Update Global Natal state & Render Zodiac Chart with Transits
  currentNatalAscendant = ascendantIdx;
  currentNatalPlanets = planets;
  hasCalculatedDestiny = true;
  updateTransits();

  // 3. Populate Results
  document.getElementById('badge-ascendant').innerText = `ราศี${ascendantDetails.name}`;
  document.getElementById('badge-zodiac').innerText = `ราศี${zodiacDetails.name}`;
  document.getElementById('badge-day').innerText = dayDetails.name;

  // Save to Supabase DB (if configured)
  if (typeof DB !== 'undefined' && DB.isConfigured()) {
    DB.saveChart(name, birthDate, birthTime, province, zodiacDetails.name, ascendantDetails.name)
      .then(res => {
        if (res) console.log("Chart saved to Supabase.");
      });
  }

  // Auspicious Guides
  document.getElementById('guide-lucky-color').innerText = dayDetails.color;
  document.getElementById('guide-bad-color').innerText = dayDetails.badColor;
  document.getElementById('guide-lucky-no').innerText = dayDetails.luckyNo;
  document.getElementById('guide-deity').innerText = dayDetails.deity;

  // Text readings
  document.getElementById('personality-summary').innerHTML = `<strong>วาสนาลัคนาปะทะราศีเกิด:</strong> ลัคนาสถิตราศี${ascendantDetails.name} ธาตุ${ascendantDetails.element} (ดาวเจ้าเรือนคือดาว ${ascendantDetails.ruler}) ร่วมกับราศีเกิดคือราศี${zodiacDetails.name}`;
  document.getElementById('personality-desc').innerHTML = `${ThaiAstrology.READINGS.ascendants[ascendantIdx]}<br><br>${ThaiAstrology.READINGS.zodiacs[zodiacIdx]}`;
  
  document.getElementById('career-desc').innerHTML = `${ThaiAstrology.READINGS.zodiacs[zodiacIdx]} วิเคราะห์ร่วมกับเรือนกัมมะ ชี้ขาดว่า ${ThaiAstrology.READINGS.houses.กัมมะ}`;
  document.getElementById('wealth-desc').innerHTML = `ตามตำแหน่งดาวเกษตรเจ้าเรือนและดาวจรจำลองในระบบดวงชะตา บ่งบอกเกณฑ์ด้านทรัพย์สินไว้ว่า: ${ThaiAstrology.READINGS.houses.กดุมภะ}`;
  document.getElementById('love-desc').innerHTML = `พิจารณาเนื้อคู่คนรักตามหลักคู่ครองสัมพันธ์ (ปัตนิ) บ่งบอกลักษณะคู่ชะตาว่า: ${ThaiAstrology.READINGS.houses.ปัตนิ}`;

  // 12 Houses list generator
  const housesList = document.getElementById('houses-list');
  housesList.innerHTML = '';
  
  // Starting from the Ascendant sign, map the 12 houses sequentially
  for (let i = 0; i < 12; i++) {
    const currentZodiacIdx = (ascendantIdx + i) % 12;
    const houseInfo = ThaiAstrology.HOUSES[i];
    const zodiacName = ThaiAstrology.ZODIACS[currentZodiacIdx].name;
    
    const li = document.createElement('li');
    li.innerHTML = `<strong>เรือนที่ ${i+1} [${houseInfo.name}]</strong> (${houseInfo.meaning}) - สถิตในราศี${zodiacName} : <span style="color: var(--text-secondary);">${ThaiAstrology.READINGS.houses[houseInfo.name] || ''}</span>`;
    housesList.appendChild(li);
  }

  // Display result panel
  const resultPanel = document.getElementById('destiny-result-details');
  resultPanel.style.display = 'block';
  resultPanel.scrollIntoView({ behavior: 'smooth' });

  // Update Life Graph in background
  renderLifeGraph(birthDate);

  // Auto-fill Thaksa birthday and age
  const thaksaBdaySelect = document.getElementById('thaksa-birthday');
  if (thaksaBdaySelect) {
    thaksaBdaySelect.value = dayIdx;
  }
  const thaksaAgeInput = document.getElementById('thaksa-age');
  if (thaksaAgeInput) {
    const bYear = new Date(birthDate).getFullYear();
    const cYear = new Date().getFullYear();
    const computedAge = cYear - bYear;
    thaksaAgeInput.value = computedAge > 0 ? computedAge : 25;
  }
  // Automatically trigger Thaksa calculation
  triggerThaksaCalculation();

  // Auto-fill Chinese birth date
  const chineseBirthDateInput = document.getElementById('chinese-birth-date');
  if (chineseBirthDateInput) {
    window.setThaiDate('chinese-birth-date', birthDate);
  }
  // Automatically trigger Chinese calculation
  triggerChineseCalculation();
}

/**
 * Handle Love Compatibility form submission
 */
function handleCompatibilitySubmit() {
  const name1 = document.getElementById('love-p1-name').value || 'ฝ่ายแรก';
  const name2 = document.getElementById('love-p2-name').value || 'อีกฝ่าย';

  const date1 = document.getElementById('love-p1-date').value;
  const time1 = document.getElementById('love-p1-time').value;

  const date2 = document.getElementById('love-p2-date').value;
  const time2 = document.getElementById('love-p2-time').value;

  if (!date1 || !date2) return;

  const user1 = {
    day: Number(date1.split('-')[2]),
    month: Number(date1.split('-')[1]),
    dayOfWeek: ThaiAstrology.getThaiDayOfWeek(date1, time1)
  };

  const user2 = {
    day: Number(date2.split('-')[2]),
    month: Number(date2.split('-')[1]),
    dayOfWeek: ThaiAstrology.getThaiDayOfWeek(date2, time2)
  };

  // Perform calculation
  const compat = ThaiAstrology.getCompatibility(user1, user2);

  // Render compatibility results
  document.getElementById('love-percent').innerText = `${compat.score}%`;
  document.getElementById('love-matching-summary').innerText = `ธาตุ ${compat.elements} • วัน ${compat.days}`;
  document.getElementById('love-description').innerHTML = `ดวงชะตาสมพงษ์ของ <strong>${name1}</strong> และ <strong>${name2}</strong>:<br><br>${compat.description}`;

  const resultBox = document.getElementById('love-result-box');
  resultBox.style.display = 'block';
  resultBox.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Draw dynamic traditional Thai circular Zodiac Chart using SVG
 */
function drawZodiacChart(ascendantIdx, natalPlanets, transitPlanets = [], showTransits = 'none') {
  const svg = document.getElementById('zodiac-svg');
  if (!svg) return;
  svg.innerHTML = ''; // Clear SVG

  // Width and height properties
  const w = 400;
  const h = 400;
  const cx = w / 2;
  const cy = h / 2;

  // Custom styled SVG gradients & filters
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <radialGradient id="bg-grad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#18203a" />
      <stop offset="100%" stop-color="#090d1a" />
    </radialGradient>
    <linearGradient id="gold-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#b8860b" />
      <stop offset="50%" stop-color="#ffd700" stop-opacity="1" />
      <stop offset="100%" stop-color="#c5a059" />
    </linearGradient>
    <filter id="glow-effect" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <filter id="transit-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  `;
  svg.appendChild(defs);

  // 1. Chart Background Circle
  const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  bgCircle.setAttribute('cx', cx);
  bgCircle.setAttribute('cy', cy);
  bgCircle.setAttribute('r', 190);
  bgCircle.setAttribute('fill', 'url(#bg-grad)');
  bgCircle.setAttribute('stroke', 'url(#gold-stroke)');
  bgCircle.setAttribute('stroke-width', '2');
  svg.appendChild(bgCircle);

  // 2. Outer decorative ring (dashed)
  const outerRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  outerRing.setAttribute('cx', cx);
  outerRing.setAttribute('cy', cy);
  outerRing.setAttribute('r', 182);
  outerRing.setAttribute('fill', 'none');
  outerRing.setAttribute('stroke', '#ffd700');
  outerRing.setAttribute('stroke-width', '1');
  outerRing.setAttribute('stroke-dasharray', '5, 5');
  outerRing.setAttribute('opacity', '0.6');
  svg.appendChild(outerRing);

  // 3. Middle ring for dividers
  const midCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  midCircle.setAttribute('cx', cx);
  midCircle.setAttribute('cy', cy);
  midCircle.setAttribute('r', 145);
  midCircle.setAttribute('fill', 'none');
  midCircle.setAttribute('stroke', '#c5a059');
  midCircle.setAttribute('stroke-width', '1.5');
  midCircle.setAttribute('opacity', '0.7');
  svg.appendChild(midCircle);

  // 3.5. Extra dashed divider ring between Natal (inner) and Transit (outer) layers
  if (showTransits === 'show') {
    const transitDivider = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    transitDivider.setAttribute('cx', cx);
    transitDivider.setAttribute('cy', cy);
    transitDivider.setAttribute('r', 122);
    transitDivider.setAttribute('fill', 'none');
    transitDivider.setAttribute('stroke', 'rgba(197, 160, 89, 0.35)');
    transitDivider.setAttribute('stroke-width', '1');
    transitDivider.setAttribute('stroke-dasharray', '3, 3');
    svg.appendChild(transitDivider);
  }

  // 4. Center Circle
  const centerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  centerCircle.setAttribute('cx', cx);
  centerCircle.setAttribute('cy', cy);
  centerCircle.setAttribute('r', 55);
  centerCircle.setAttribute('fill', '#090d1a');
  centerCircle.setAttribute('stroke', 'url(#gold-stroke)');
  centerCircle.setAttribute('stroke-width', '2');
  svg.appendChild(centerCircle);

  // 5. Draw 12 radial dividers (every 30 degrees)
  for (let i = 0; i < 12; i++) {
    const angle = i * 30 - 90;
    const rad = (angle * Math.PI) / 180;
    const x1 = cx + 55 * Math.cos(rad);
    const y1 = cy + 55 * Math.sin(rad);
    const x2 = cx + 190 * Math.cos(rad);
    const y2 = cy + 190 * Math.sin(rad);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', 'rgba(197, 160, 89, 0.3)');
    line.setAttribute('stroke-width', '1');
    svg.appendChild(line);
  }

  // Separate placements for Natal and Transit items
  let natalPlacements = {};
  let transitPlacements = {};
  for (let i = 0; i < 12; i++) {
    natalPlacements[i] = [];
    transitPlacements[i] = [];
  }

  // Add Ascendant "ล" to the natal placements list
  if (ascendantIdx !== undefined && ascendantIdx !== null) {
    natalPlacements[ascendantIdx].push('ล');
  }

  // Add natal planets to their calculated sign indices
  if (natalPlanets) {
    natalPlanets.forEach(p => {
      natalPlacements[p.sign].push(p.num);
    });
  }

  // Add transit planets to their calculated sign indices if enabled
  if (showTransits === 'show' && transitPlanets) {
    transitPlanets.forEach(p => {
      transitPlacements[p.sign].push(p.num);
    });
  }

  // 6. Draw Zodiac labels, Natal items, and Transit items
  for (let i = 0; i < 12; i++) {
    const signInfo = ThaiAstrology.ZODIACS[i];
    const angle = i * 30 - 75; // Centered in the 30-degree sector
    const rad = (angle * Math.PI) / 180;

    // A. Draw Zodiac Name Label
    const xLabel = cx + 168 * Math.cos(rad);
    const yLabel = cy + 168 * Math.sin(rad);

    const textLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textLabel.setAttribute('x', xLabel);
    textLabel.setAttribute('y', yLabel);
    textLabel.setAttribute('fill', '#f5f6fa');
    textLabel.setAttribute('font-family', "'Bai Jamjuree', sans-serif");
    textLabel.setAttribute('font-size', '11');
    textLabel.setAttribute('font-weight', '500');
    textLabel.setAttribute('text-anchor', 'middle');
    textLabel.setAttribute('dominant-baseline', 'middle');
    textLabel.textContent = signInfo.name;
    svg.appendChild(textLabel);

    // B. Draw Natal Planets & Ascendant (ล)
    const natalItems = natalPlacements[i];
    if (natalItems && natalItems.length > 0) {
      natalItems.forEach((item, itemIdx) => {
        let rOffset = 100;
        let angleOffset = 0;

        if (natalItems.length > 1) {
          rOffset = 95 + (itemIdx % 2) * 22;
          angleOffset = ((itemIdx - (natalItems.length - 1) / 2) * 7.5);
        }

        const radPlacement = ((angle + angleOffset) * Math.PI) / 180;
        const xPlacement = cx + rOffset * Math.cos(radPlacement);
        const yPlacement = cy + rOffset * Math.sin(radPlacement);

        const textItem = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textItem.setAttribute('x', xPlacement);
        textItem.setAttribute('y', yPlacement);
        textItem.setAttribute('text-anchor', 'middle');
        textItem.setAttribute('dominant-baseline', 'middle');
        textItem.setAttribute('font-family', "'Bai Jamjuree', sans-serif");

        if (item === 'ล') {
          // Ascendant style
          textItem.setAttribute('fill', '#ffd700');
          textItem.setAttribute('font-size', '18');
          textItem.setAttribute('font-weight', '700');
          textItem.setAttribute('filter', 'url(#glow-effect)');
          textItem.textContent = 'ล';

          const pulseCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          pulseCircle.setAttribute('cx', xPlacement);
          pulseCircle.setAttribute('cy', yPlacement - 2);
          pulseCircle.setAttribute('r', '13');
          pulseCircle.setAttribute('fill', 'none');
          pulseCircle.setAttribute('stroke', 'rgba(255, 215, 0, 0.45)');
          pulseCircle.setAttribute('stroke-width', '1.5');
          svg.appendChild(pulseCircle);
        } else {
          // Planet style
          let color = '#00f2fe';
          if (item === '๑') color = '#ffd700'; // Sun
          if (item === '๒') color = '#e2e8f0'; // Moon
          if (item === '๓') color = '#ff4757'; // Mars
          if (item === '๔') color = '#2ed573'; // Mercury
          if (item === '๕') color = '#ffa502'; // Jupiter
          if (item === '๖') color = '#ff6b81'; // Venus
          if (item === '๗') color = '#a55eea'; // Saturn
          if (item === '๘') color = '#747d8c'; // Rahu
          if (item === '๙') color = '#10ac84'; // Ketu
          if (item === '๐') color = '#00d2d3'; // Uranus

          textItem.setAttribute('fill', color);
          textItem.setAttribute('font-size', '15');
          textItem.setAttribute('font-weight', '600');
          textItem.textContent = item;
        }
        svg.appendChild(textItem);
      });
    }

    // C. Draw Transit Planets on Outer Layer
    if (showTransits === 'show') {
      const transitItems = transitPlacements[i];
      if (transitItems && transitItems.length > 0) {
        transitItems.forEach((item, itemIdx) => {
          let rOffset = 136;
          let angleOffset = 0;

          if (transitItems.length > 1) {
            rOffset = 130 + (itemIdx % 2) * 16;
            angleOffset = ((itemIdx - (transitItems.length - 1) / 2) * 7);
          }

          const radPlacement = ((angle + angleOffset) * Math.PI) / 180;
          const xPlacement = cx + rOffset * Math.cos(radPlacement);
          const yPlacement = cy + rOffset * Math.sin(radPlacement);

          // Small ring around transit planet
          const transitCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          transitCircle.setAttribute('cx', xPlacement);
          transitCircle.setAttribute('cy', yPlacement - 1);
          transitCircle.setAttribute('r', '10');
          transitCircle.setAttribute('fill', 'rgba(255, 159, 67, 0.05)');
          transitCircle.setAttribute('stroke', 'rgba(255, 159, 67, 0.4)');
          transitCircle.setAttribute('stroke-width', '1');
          svg.appendChild(transitCircle);

          const textItem = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          textItem.setAttribute('x', xPlacement);
          textItem.setAttribute('y', yPlacement);
          textItem.setAttribute('text-anchor', 'middle');
          textItem.setAttribute('dominant-baseline', 'middle');
          textItem.setAttribute('font-family', "'Bai Jamjuree', sans-serif");
          textItem.setAttribute('fill', '#ff9f43'); // Coral/Orange for transit
          textItem.setAttribute('font-size', '13');
          textItem.setAttribute('font-weight', '700');
          textItem.setAttribute('filter', 'url(#transit-glow)');
          textItem.textContent = item;

          svg.appendChild(textItem);
        });
      }
    }
  }

  // 7. Decorative center symbol
  const centerSymbol = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  centerSymbol.setAttribute('cx', cx);
  centerSymbol.setAttribute('cy', cy);
  centerSymbol.setAttribute('r', 8);
  centerSymbol.setAttribute('fill', '#ffd700');
  centerSymbol.setAttribute('opacity', '0.2');
  centerSymbol.setAttribute('filter', 'url(#glow-effect)');
  svg.appendChild(centerSymbol);

  const centerDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  centerDot.setAttribute('cx', cx);
  centerDot.setAttribute('cy', cy);
  centerDot.setAttribute('r', 3);
  centerDot.setAttribute('fill', '#ffd700');
  svg.appendChild(centerDot);
}

/**
 * Initialize Planet Transits listeners
 */
function initTransits() {
  const transitDisplay = document.getElementById('transit-display');
  if (transitDisplay) {
    transitDisplay.addEventListener('change', updateTransits);
  }
  const transitDate = document.getElementById('transit-date');
  if (transitDate) {
    transitDate.addEventListener('change', updateTransits);
  }
}

/**
 * Update the zodiac chart with transit positions and update interpretations
 */
function updateTransits() {
  if (!hasCalculatedDestiny) return;

  const transitDisplay = document.getElementById('transit-display').value;
  const transitDate = document.getElementById('transit-date').value;
  
  if (!transitDate) return;

  // Calculate transit planets for the selected date at noon
  const transitPlanets = ThaiAstrology.calculatePlanets(transitDate, "12:00");

  // Re-draw chart with transits
  drawZodiacChart(currentNatalAscendant, currentNatalPlanets, transitPlanets, transitDisplay);

  // Render transit readings
  renderTransitReadings(transitPlanets);
}

/**
 * Renders the transit interpretations inside the result details
 */
function renderTransitReadings(transitPlanets) {
  const transitsList = document.getElementById('transits-list');
  if (!transitsList) return;

  transitsList.innerHTML = '';
  
  const interpretations = ThaiAstrology.calculateTransitInterpretations(currentNatalAscendant, transitPlanets);
  
  if (interpretations.length === 0) {
    transitsList.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">ไม่มีดาวดวงใหญ่ย้ายตำแหน่งที่ส่งผลกระทบโดยตรงในขณะนี้</p>';
    return;
  }

  interpretations.forEach(item => {
    const card = document.createElement('div');
    card.className = 'highlight-box';
    
    // Custom colors for major slow-moving planets (พฤหัสบดี ๕, เสาร์ ๗, ราหู ๘, มฤตยู ๐)
    let planetColor = '#ffd700'; // Jupiter (๕) - Gold
    if (item.planet === '๗') planetColor = '#a55eea'; // Saturn (๗) - Purple
    if (item.planet === '๘') planetColor = '#ff6b81'; // Rahu (๘) - Pinkish Red
    if (item.planet === '๐') planetColor = '#00d2d3'; // Uranus (๐) - Cyan

    card.style.borderLeftColor = planetColor;
    card.style.background = 'rgba(255, 255, 255, 0.02)';
    card.style.marginBottom = '12px';
    card.style.borderRadius = '6px';
    card.style.padding = '12px 15px';

    card.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px dashed rgba(255,255,255,0.06); padding-bottom: 6px; margin-bottom: 8px;">
        <span style="color: ${planetColor}; font-weight: bold; font-size: 1.05rem;">
          ดาว${item.planetName} (${item.planet}) จรเข้าเรือน${item.houseName}
        </span>
        <span style="background: rgba(255, 215, 0, 0.08); color: var(--gold-primary); font-size: 0.8rem; padding: 2px 8px; border-radius: 4px; font-weight: 500;">
          เรือนที่ ${ThaiAstrology.HOUSES.findIndex(h => h.name === item.houseName) + 1}
        </span>
      </div>
      <p style="margin: 0; font-size: 0.95rem; line-height: 1.6; color: var(--text-secondary);">${item.text}</p>
    `;
    transitsList.appendChild(card);
  });
}

/**
 * Draw a default empty/sample chart when application loads for aesthetic completeness
 */
function drawDefaultZodiacOnLoad() {
  const defaultPlanets = [
    { num: '๑', sign: 2 },
    { num: '๒', sign: 5 },
    { num: '๓', sign: 0 },
    { num: '๔', sign: 2 },
    { num: '๕', sign: 8 },
    { num: '๖', sign: 3 },
    { num: '๗', sign: 9 },
    { num: '๘', sign: 10 },
    { num: '๙', sign: 11 },
    { num: '๐', sign: 1 }
  ];
  drawZodiacChart(2, defaultPlanets); // Default ascendant in Gemini
}

/**
 * Draw Life Graph on HTML5 Canvas
 */
function renderLifeGraph(birthDateStr) {
  const canvas = document.getElementById('life-graph-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  
  // High-DPI support
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * 2;
  canvas.height = 350 * 2; // Fixed height ratio
  canvas.style.width = '100%';
  canvas.style.height = '350px';
  ctx.scale(2, 2);

  const cw = rect.width;
  const ch = 350;

  // Retrieve calculated dataset
  const data = ThaiAstrology.calculateLifeGraph(birthDateStr);

  // UI styling tokens matching CSS style variables
  const colors = {
    career: '#8a2be2',
    money: '#ffd700',
    love: '#ff4757',
    health: '#2ed573',
    luck: '#00f2fe',
    grid: 'rgba(255, 255, 255, 0.08)',
    text: '#a0a5b5'
  };

  // Clear canvas
  ctx.clearRect(0, 0, cw, ch);

  // Setup bounds
  const paddingLeft = 50;
  const paddingRight = 30;
  const paddingTop = 40;
  const paddingBottom = 40;
  const graphWidth = cw - paddingLeft - paddingRight;
  const graphHeight = ch - paddingTop - paddingBottom;

  // Draw Grid background lines (Levels 1 to 7)
  ctx.lineWidth = 1;
  ctx.strokeStyle = colors.grid;
  ctx.font = "11px 'Bai Jamjuree', sans-serif";
  ctx.fillStyle = colors.text;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  for (let level = 1; level <= 7; level++) {
    // Math: Level 7 is at the top, Level 1 is at the bottom
    const y = paddingTop + graphHeight - ((level - 1) / 6) * graphHeight;
    
    ctx.beginPath();
    ctx.moveTo(paddingLeft, y);
    ctx.lineTo(cw - paddingRight, y);
    ctx.stroke();

    ctx.fillText(level + ' คะแนน', paddingLeft - 10, y);
  }

  // Draw Vertical lines for age periods
  const ptsCount = data.labels.length;
  const xCoords = [];
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  for (let i = 0; i < ptsCount; i++) {
    const x = paddingLeft + (i / (ptsCount - 1)) * graphWidth;
    xCoords.push(x);

    ctx.beginPath();
    ctx.moveTo(x, paddingTop);
    ctx.lineTo(x, paddingTop + graphHeight);
    ctx.stroke();

    // Rotate text slightly or offset vertically for breathing space
    ctx.fillText(data.labels[i].replace('อายุ ', ''), x, paddingTop + graphHeight + 10);
  }

  // Function to draw smooth lines (quadratic/bezier curve helper)
  function drawSmoothLine(yValues, strokeColor) {
    ctx.beginPath();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = strokeColor;
    
    // Draw line shadow/glow
    ctx.shadowColor = strokeColor;
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;

    const points = [];
    for (let i = 0; i < ptsCount; i++) {
      const x = xCoords[i];
      const yVal = yValues[i];
      const y = paddingTop + graphHeight - ((yVal - 1) / 6) * graphHeight;
      points.push({ x, y });
    }

    // Begin drawing curve
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const xc = (p0.x + p1.x) / 2;
      const yc = (p0.y + p1.y) / 2;
      ctx.quadraticCurveTo(p0.x, p0.y, xc, yc);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.stroke();

    // Reset shadow for dots
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Draw circular nodes on data coordinates
    points.forEach(pt => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#090d1a'; // Dark core
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }

  // Render the 5 lines
  drawSmoothLine(data.career, colors.career);
  drawSmoothLine(data.money, colors.money);
  drawSmoothLine(data.love, colors.love);
  drawSmoothLine(data.health, colors.health);
  drawSmoothLine(data.luck, colors.luck);
}

/**
 * Initialize Siemsee (เซียมซี) cup, sticks, shaking logic and sound synthesis
 */
function initSiemsee() {
  const sticksContainer = document.getElementById('siemsee-sticks-container');
  if (!sticksContainer) return;

  // Generate 25 visual sticks inside the cup with staggered angles & offsets
  sticksContainer.innerHTML = '';
  const sticksCount = 25;
  for (let i = 0; i < sticksCount; i++) {
    const stick = document.createElement('div');
    stick.className = 'siemsee-stick';
    
    // Spread angles from -15 to +15 degrees
    const rotate = (i - sticksCount / 2) * 1.6 + (Math.random() - 0.5) * 2;
    // Spread horizontal position slightly
    const leftOffset = 60 + (i - sticksCount / 2) * 3 + (Math.random() - 0.5) * 5;
    
    stick.style.transform = `rotate(${rotate}deg)`;
    stick.style.left = `${leftOffset}px`;
    
    sticksContainer.appendChild(stick);
  }

  // Shaking elements trigger
  const cup = document.getElementById('siemsee-cup-container');
  const shakeBtn = document.getElementById('btn-shake-siemsee');
  const modal = document.getElementById('siemsee-modal');
  const closeModalBtn = document.getElementById('btn-close-modal');

  let isShaking = false;

  function shakeSiemsee() {
    if (isShaking) return;
    isShaking = true;

    // Start UI shake animation
    cup.classList.add('siemsee-shaking');
    document.getElementById('siemsee-hint').innerText = '🔮 กำลังตั้งจิตอธิษฐานเขย่าติ้วเซียมซี...';

    // Play synthesized shaking sound using Web Audio API!
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    playShakeSound(audioContext);

    // After 1.8 seconds, stop shaking and slide one stick out
    setTimeout(() => {
      cup.classList.remove('siemsee-shaking');
      
      // Select a random stick visual element to animate outwards
      const sticks = sticksContainer.querySelectorAll('.siemsee-stick');
      const randomStickIdx = Math.floor(Math.random() * sticks.length);
      const chosenStick = sticks[randomStickIdx];
      
      chosenStick.classList.add('siemsee-stick-out');

      // Synthesize drop/slide sound
      playStickOutSound(audioContext);

      // After stick slide completes, show the Modal with fortune reading
      setTimeout(() => {
        // Randomly pick a stick reading (1 to 28)
        const fortuneNo = Math.floor(Math.random() * 28) + 1;
        const reading = ThaiAstrology.SIEMSEE[fortuneNo];

        // Convert fortune number to Thai numerals for the badge
        const thaiNums = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
        const formattedThaiNo = String(fortuneNo).split('').map(n => thaiNums[Number(n)]).join('');

        document.getElementById('modal-stick-number').innerText = formattedThaiNo;
        document.getElementById('modal-stick-title').innerText = reading.title;
        document.getElementById('modal-stick-verse').innerText = reading.verse;
        document.getElementById('modal-stick-reading').innerText = reading.reading;

        // Open Modal
        modal.style.display = 'flex';

        // Clean up classes
        isShaking = false;
        chosenStick.classList.remove('siemsee-stick-out');
        document.getElementById('siemsee-hint').innerText = '✨ เสี่ยงทายสำเร็จแล้ว! คลิกเพื่อเริ่มเสี่ยงครั้งใหม่';
      }, 1000);
      
    }, 1800);
  }

  // Event Listeners
  cup.addEventListener('click', shakeSiemsee);
  shakeBtn.addEventListener('click', shakeSiemsee);

  closeModalBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  // Close modal when clicking background
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
}

/**
 * Synthesize wood rattling sound using Web Audio API
 * Generates rhythmic envelope filters over a White Noise buffer
 */
function playShakeSound(ctx) {
  if (!ctx) return;

  const bufferSize = ctx.sampleRate * 0.15; // 0.15 seconds buffer
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  // Fill buffer with white noise
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  // Play rattle bursts repeatedly for 1.6 seconds
  let startTime = ctx.currentTime;
  const shakeDuration = 1.6; // duration in seconds
  const interval = 0.08;     // rattle every 80ms

  for (let timeOffset = 0; timeOffset < shakeDuration; timeOffset += interval) {
    const playTime = startTime + timeOffset;

    // Create noise source
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;

    // Gain node for volume envelope
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.04, playTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, playTime + 0.06);

    // Bandpass filter to make it sound dry, like wooden sticks
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200 + (Math.random() - 0.5) * 400, playTime);
    filter.Q.setValueAtTime(3.0, playTime);

    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noiseSource.start(playTime);
  }
}

/**
 * Synthesize stick slide sound (pitch slide/clink)
 */
function playStickOutSound(ctx) {
  if (!ctx) return;

  const startTime = ctx.currentTime;

  // Synthesize a wood sliding/hitting note
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(600, startTime);
  osc.frequency.exponentialRampToValueAtTime(350, startTime + 0.3);

  gainNode.gain.setValueAtTime(0.06, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1000, startTime);

  osc.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + 0.3);
}

/**
 * Initialize Thaksa (ทักษา) grid calculation & highlights
 */
function initThaksa() {
  const form = document.getElementById('thaksa-form');
  if (!form) return;
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    triggerThaksaCalculation();
  });
}

function triggerThaksaCalculation() {
  const birthDayEl = document.getElementById('thaksa-birthday');
  const ageEl = document.getElementById('thaksa-age');
  const genderEl = document.getElementById('thaksa-gender');
  
  if (!birthDayEl || !ageEl || !genderEl) return;

  const birthDayIdx = Number(birthDayEl.value);
  const age = Number(ageEl.value);
  const gender = genderEl.value;

  const thaksaMap = ThaiAstrology.calculateThaksa(birthDayIdx, age, gender);

  const thaksaResultEl = document.getElementById('thaksa-result');
  if (thaksaResultEl) thaksaResultEl.style.display = 'block';

  // Standard outer 8 cell indices matching Day Index
  const cellMap = {
    0: 0, // Sun -> Cell 0
    1: 1, // Mon -> Cell 1
    2: 2, // Tue -> Cell 2
    3: 3, // WedD -> Cell 3
    4: 7, // Fri -> Cell 7
    5: 5, // Thu -> Cell 5
    6: 4, // Sat -> Cell 4
    7: 6  // WedN (Rahu) -> Cell 6
  };

  // Clear existing highlight classes
  for (let i = 0; i < 8; i++) {
    const cell = document.getElementById(`thaksa-cell-${i}`);
    if (cell) {
      cell.className = 'thaksa-cell';
    }
  }

  let sriDayName = '';
  let kaliDayName = '';

  // Update categories inside 3x3 cells
  for (let dayVal in thaksaMap) {
    const catName = thaksaMap[dayVal];
    const cellId = cellMap[dayVal];
    const catLabelEl = document.getElementById(`thaksa-cat-${cellId}`);
    const cellEl = document.getElementById(`thaksa-cell-${cellId}`);

    if (catLabelEl) {
      catLabelEl.innerText = catName;
    }

    if (cellEl) {
      if (catName === 'ศรี') {
        cellEl.classList.add('sri-highlight');
        sriDayName = ThaiAstrology.DAYS[dayVal].name;
      } else if (catName === 'กาลกิณี') {
        cellEl.classList.add('kali-highlight');
        kaliDayName = ThaiAstrology.DAYS[dayVal].name;
      } else if (catName === 'เดช') {
        cellEl.classList.add('dej-highlight');
      } else if (catName === 'มนตรี') {
        cellEl.classList.add('montri-highlight');
      } else if (catName === 'มูละ') {
        cellEl.classList.add('moola-highlight');
      }
    }
  }

  // Set description
  const summaryDescEl = document.getElementById('thaksa-summary-desc');
  if (summaryDescEl) {
    summaryDescEl.innerHTML = `
      <strong>วิเคราะห์ดาวนำโชคและข้อระวังในปีนี้ (อายุเต็ม ${age} ปี):</strong><br>
      ✨ <strong>ดาวเด่นนำโชค (ศรี):</strong> คือดาวประจำ<strong>${sriDayName}</strong> ส่งผลให้ปีนี้เป็นปีทองในเรื่องของเสน่ห์เมตตา โชคลาภ และความสุขสมหวัง หยิบจับสิ่งใดจะมีผู้คนสนับสนุนเอ็นดูเป็นพิเศษ<br>
      ⚠️ <strong>ข้อควรระวังสูงสุด (กาลกิณี):</strong> คือดาวประจำ<strong>${kaliDayName}</strong> ในปีนี้ควรระมัดระวังเรื่องอุปสรรคขัดขวาง การมีปากเสียงขัดแย้งกับผู้อื่น หรือปัญหาสุขภาพ แนะนำหลีกเลี่ยงการทำสัญญาระยะยาวหรือค้ำประกันใดๆ ในช่วงปีนี้
    `;
  }
}

/**
 * Initialize Phone / License plate Numerology (เลขศาสตร์)
 */
function initNumerology() {
  const form = document.getElementById('number-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const numberStr = document.getElementById('input-number').value;
    const result = ThaiAstrology.analyzeNumerology(numberStr);
    if (!result) return;

    document.getElementById('number-sum-badge').innerText = result.sum;
    document.getElementById('number-sum-meaning').innerText = result.sumMeaning;

    const pairsContainer = document.getElementById('number-pairs-container');
    pairsContainer.innerHTML = '';

    if (result.pairs.length === 0) {
      pairsContainer.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 15px;">ไม่พบเลขคู่ที่มีอิทธิพลเด่นชัด ตัวเลขอยู่ในเกณฑ์ปานกลางราบเรียบ</div>';
    } else {
      result.pairs.forEach(p => {
        const isBad = p.meaning.includes('⚠️') || p.meaning.includes('🚫');
        const card = document.createElement('div');
        card.className = isBad ? 'auspicious-item pair-bad-card' : 'auspicious-item pair-good-card';
        card.style.background = isBad ? 'rgba(255, 71, 87, 0.05)' : 'rgba(197, 160, 89, 0.08)';
        card.style.borderColor = isBad ? 'rgba(255, 71, 87, 0.15)' : 'rgba(197, 160, 89, 0.2)';
        card.innerHTML = `
          <div class="auspicious-icon" style="color: ${isBad ? 'var(--accent-red)' : 'var(--gold-primary)'}; background: ${isBad ? 'rgba(255, 71, 87, 0.12)' : 'rgba(197, 160, 89, 0.12)'};">
            ${isBad ? '🚫' : '✦'}
          </div>
          <div class="auspicious-content">
            <h5 style="color: #fff; font-size: 1.1rem; font-family: var(--font-eng); font-weight: bold;">${p.pair}</h5>
            <p style="color: var(--text-secondary); font-size: 0.95rem; margin-top: 2px;">${p.meaning}</p>
          </div>
        `;
        pairsContainer.appendChild(card);
      });
    }

    const resultBox = document.getElementById('number-result');
    if (resultBox) {
      resultBox.style.display = 'block';
      resultBox.scrollIntoView({ behavior: 'smooth' });
    }
  });
}

/**
 * Initialize Dream Forecaster (ทำนายฝัน)
 */
function initDream() {
  const searchInput = document.getElementById('dream-search');
  const popularContainer = document.getElementById('popular-dreams');
  if (!searchInput || !popularContainer) return;

  // Generate popular buttons
  popularContainer.innerHTML = '';
  ThaiAstrology.DREAM_DATABASE.forEach(d => {
    const btn = document.createElement('button');
    btn.className = 'tab-btn';
    btn.style.padding = '6px 14px';
    btn.style.fontSize = '0.85rem';
    btn.innerText = d.keyword;
    btn.addEventListener('click', () => {
      searchInput.value = d.keyword;
      displayDream(d);
    });
    popularContainer.appendChild(btn);
  });

  // Typing event
  searchInput.addEventListener('input', () => {
    const val = searchInput.value.trim().toLowerCase();
    if (val === '') {
      document.getElementById('dream-result').style.display = 'none';
      return;
    }

    const match = ThaiAstrology.DREAM_DATABASE.find(d => 
      d.keyword.toLowerCase().includes(val) || 
      d.title.toLowerCase().includes(val) || 
      d.meaning.toLowerCase().includes(val)
    );

    if (match) {
      displayDream(match);
    } else {
      // Fallback response
      document.getElementById('dream-result-title').innerText = `ฝันเกี่ยวกับ "${val}"`;
      document.getElementById('dream-result-meaning').innerText = `ตำราทำนายฝันชี้ว่า ช่วงนี้คุณกำลังจะก้าวข้ามผ่านเรื่องยุ่งยากลำบากใจ และได้พบการเริ่มต้นสิ่งใหม่ที่เป็นประโยชน์ มีโชคทางการเสี่ยงโชคระยะสั้นเด่นชัด แนะนำให้ทำบุญเสริมดวงด้วยการปล่อยปลาคู่อุดมลาภ`;
      document.getElementById('dream-lucky-2').innerText = '14, 48';
      document.getElementById('dream-lucky-3').innerText = '148, 841';
      document.getElementById('dream-result').style.display = 'block';
    }
  });
}

function displayDream(dream) {
  document.getElementById('dream-result-title').innerText = dream.title;
  document.getElementById('dream-result-meaning').innerText = dream.meaning;
  document.getElementById('dream-lucky-2').innerText = dream.lucky2;
  document.getElementById('dream-lucky-3').innerText = dream.lucky3;
  document.getElementById('dream-result').style.display = 'block';
}

/**
 * Initialize Daily outfit colors (สีเสื้อมงคล)
 */
function initColors() {
  const selectorsContainer = document.getElementById('colors-day-selectors');
  if (!selectorsContainer) return;

  selectorsContainer.innerHTML = '';

  const dayOptions = [
    { idx: 0, name: 'วันอาทิตย์', color: 'rgba(255, 71, 87, 0.15)' },
    { idx: 1, name: 'วันจันทร์', color: 'rgba(255, 215, 0, 0.15)' },
    { idx: 2, name: 'วันอังคาร', color: 'rgba(255, 107, 129, 0.15)' },
    { idx: 3, name: 'วันพุธกลางวัน', color: 'rgba(46, 213, 115, 0.15)' },
    { idx: 7, name: 'วันพุธกลางคืน', color: 'rgba(116, 125, 140, 0.15)' },
    { idx: 5, name: 'วันพฤหัสบดี', color: 'rgba(255, 165, 2, 0.15)' },
    { idx: 4, name: 'วันศุกร์', color: 'rgba(0, 242, 254, 0.15)' },
    { idx: 6, name: 'rgba(138, 43, 226, 0.15)' }
  ];
  
  // Actually Saturday is idx 6, let's make it clean:
  const daysConfig = [
    { idx: 0, name: 'วันอาทิตย์', color: '#ff4757' },
    { idx: 1, name: 'วันจันทร์', color: '#eccc68' },
    { idx: 2, name: 'วันอังคาร', color: '#ff6b81' },
    { idx: 3, name: 'วันพุธกลางวัน', color: '#2ed573' },
    { idx: 7, name: 'วันพุธกลางคืน', color: '#747d8c' },
    { idx: 5, name: 'วันพฤหัสฯ', color: '#ffa502' },
    { idx: 4, name: 'วันศุกร์', color: '#70a1ff' },
    { idx: 6, name: 'วันเสาร์', color: '#a55eea' }
  ];

  daysConfig.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'tab-btn';
    btn.style.padding = '8px 16px';
    btn.style.fontSize = '0.9rem';
    btn.style.border = `1px solid ${opt.color}44`;
    btn.innerText = opt.name.replace('วัน', '');
    btn.addEventListener('click', () => {
      selectorsContainer.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      displayColors(opt.idx);
    });
    selectorsContainer.appendChild(btn);
  });

  // Select today
  const todayDay = new Date().getDay(); // 0-6
  let defaultIdx = todayDay;
  if (todayDay === 3 && new Date().getHours() >= 18) {
    defaultIdx = 7;
  }
  
  const defaultBtn = Array.from(selectorsContainer.children).find((_, idx) => daysConfig[idx].idx === defaultIdx);
  if (defaultBtn) {
    defaultBtn.click();
  }
}

function displayColors(dayIdx) {
  const data = ThaiAstrology.DAILY_COLORS[dayIdx];
  if (!data) return;

  document.getElementById('colors-result-day-title').innerText = `สีเสื้อผ้าเครื่องประดับมงคลประจำ${data.day}`;
  document.getElementById('color-outfit-work').innerText = data.work;
  document.getElementById('color-outfit-money').innerText = data.money;
  document.getElementById('color-outfit-love').innerText = data.love;
  document.getElementById('color-outfit-bad').innerText = data.bad;
}

/**
 * Initialize Chinese Astrology features
 */
function initChinese() {
  const form = document.getElementById('chinese-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    triggerChineseCalculation();
  });

  // Chinese element compatibility checking
  const compatBtn = document.getElementById('btn-check-chinese-compat');
  if (compatBtn) {
    compatBtn.addEventListener('click', () => {
      const userDate = document.getElementById('chinese-birth-date').value;
      if (!userDate) return;
      const userDetails = ChineseAstrology.getChineseYearDetails(userDate);
      const partnerElem = document.getElementById('chinese-compat-element').value;
      
      const compat = ChineseAstrology.getElementCompatibility(userDetails.element, partnerElem);
      
      document.getElementById('chinese-compat-score').innerText = `${compat.score}%`;
      document.getElementById('chinese-compat-status').innerText = compat.status;
      document.getElementById('chinese-compat-desc').innerHTML = compat.desc;
      document.getElementById('chinese-compat-result').style.display = 'block';
    });
  }

  // Pre-fill Chinese birth date from main form value
  const birthDateInput = document.getElementById('birth-date');
  const chineseDateInput = document.getElementById('chinese-birth-date');
  if (birthDateInput && chineseDateInput) {
    window.setThaiDate('chinese-birth-date', birthDateInput.value);
  }
}

function triggerChineseCalculation() {
  const birthDate = document.getElementById('chinese-birth-date').value;
  if (!birthDate) return;

  const details = ChineseAstrology.getChineseYearDetails(birthDate);
  const clash = ChineseAstrology.checkTaiSuiClash(details.animalIdx);

  // Update elements
  document.getElementById('chinese-badge-animal').innerText = `ปี${details.animalName} (${details.animalEng})`;
  document.getElementById('chinese-badge-element').innerText = `${details.element} (${ChineseAstrology.ELEMENTS[details.element].name})`;

  document.getElementById('chinese-animal-traits').innerText = details.traits;
  document.getElementById('chinese-element-traits').innerText = details.elementTraits;

  // Clash card update
  const clashCard = document.getElementById('chinese-clash-card');
  document.getElementById('chinese-clash-status').innerText = clash.status;
  document.getElementById('chinese-clash-desc').innerHTML = clash.desc;
  document.getElementById('chinese-clash-remedy').innerText = clash.remedy;

  // Style the clash card dynamically
  clashCard.className = 'love-partner-card'; // reset
  if (clash.class === 'clash-100') {
    clashCard.style.borderColor = 'var(--accent-red)';
    clashCard.style.background = 'rgba(255, 71, 87, 0.05)';
    document.getElementById('chinese-clash-status').style.color = 'var(--accent-red)';
    document.getElementById('chinese-clash-status').style.textShadow = '0 0 10px rgba(255, 71, 87, 0.4)';
  } else if (clash.class === 'clash-co') {
    clashCard.style.borderColor = 'var(--accent-purple)';
    clashCard.style.background = 'rgba(138, 43, 226, 0.05)';
    document.getElementById('chinese-clash-status').style.color = '#ffa502';
    document.getElementById('chinese-clash-status').style.textShadow = '0 0 10px rgba(255, 165, 2, 0.4)';
  } else if (clash.class === 'clash-harmony') {
    clashCard.style.borderColor = 'var(--accent-green)';
    clashCard.style.background = 'rgba(46, 213, 115, 0.05)';
    document.getElementById('chinese-clash-status').style.color = 'var(--accent-green)';
    document.getElementById('chinese-clash-status').style.textShadow = '0 0 10px rgba(46, 213, 115, 0.4)';
  } else {
    clashCard.style.borderColor = 'rgba(255, 255, 255, 0.08)';
    clashCard.style.background = 'rgba(255, 255, 255, 0.01)';
    document.getElementById('chinese-clash-status').style.color = 'var(--text-secondary)';
    document.getElementById('chinese-clash-status').style.textShadow = 'none';
  }

  // Show result box
  document.getElementById('chinese-result').style.display = 'block';
}

/**
 * Thai Date Picker Helper Functions
 */
function initThaiDatePickers() {
  const months = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  const currentYearBE = new Date().getFullYear() + 543;
  
  document.querySelectorAll('.thai-date-picker').forEach(container => {
    const targetId = container.getAttribute('data-id');
    const isRequired = container.hasAttribute('data-required');
    
    let html = `<div style="display: flex; gap: 8px;">`;
    
    // Day
    html += `<select class="td-day" ${isRequired?'required':''} style="flex: 1; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.5); color: #fff; font-family: inherit;"><option value="">วัน</option>`;
    for(let i=1; i<=31; i++) {
      html += `<option value="${String(i).padStart(2,'0')}">${i}</option>`;
    }
    html += `</select>`;
    
    // Month
    html += `<select class="td-month" ${isRequired?'required':''} style="flex: 1.5; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.5); color: #fff; font-family: inherit;"><option value="">เดือน</option>`;
    months.forEach((m, i) => {
      html += `<option value="${String(i+1).padStart(2,'0')}">${m}</option>`;
    });
    html += `</select>`;
    
    // Year
    html += `<select class="td-year" ${isRequired?'required':''} style="flex: 1.5; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.5); color: #fff; font-family: inherit;"><option value="">ปี พ.ศ.</option>`;
    for(let y = currentYearBE + 10; y >= currentYearBE - 100; y--) {
      html += `<option value="${y}">${y}</option>`;
    }
    html += `</select>`;
    
    html += `</div>`;
    html += `<input type="hidden" id="${targetId}" value="">`;
    
    container.innerHTML = html;
    
    const daySel = container.querySelector('.td-day');
    const monSel = container.querySelector('.td-month');
    const yrSel = container.querySelector('.td-year');
    const hiddenInp = container.querySelector(`#${targetId}`);
    
    const updateHidden = () => {
      if (daySel.value && monSel.value && yrSel.value) {
        const adYear = parseInt(yrSel.value) - 543;
        hiddenInp.value = `${adYear}-${monSel.value}-${daySel.value}`;
      } else {
        hiddenInp.value = '';
      }
    };
    
    daySel.addEventListener('change', updateHidden);
    monSel.addEventListener('change', updateHidden);
    yrSel.addEventListener('change', updateHidden);
  });
}

function initThaiTimePickers() {
  document.querySelectorAll('.thai-time-picker').forEach(container => {
    const targetId = container.getAttribute('data-id');
    const defaultVal = container.getAttribute('data-default') || '09:00';
    const isRequired = true; // usually required
    
    let html = `<div style="display: flex; gap: 8px; align-items: center;">`;
    
    // Hour
    html += `<select class="tt-hour" ${isRequired?'required':''} style="flex: 1; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.5); color: #fff; font-family: inherit;"><option value="">ชั่วโมง</option>`;
    for(let h=0; h<24; h++) {
      html += `<option value="${String(h).padStart(2,'0')}">${String(h).padStart(2,'0')}</option>`;
    }
    html += `</select>`;
    
    html += `<span style="color: white; font-weight: bold;">:</span>`;
    
    // Minute
    html += `<select class="tt-minute" ${isRequired?'required':''} style="flex: 1; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.5); color: #fff; font-family: inherit;"><option value="">นาที</option>`;
    for(let m=0; m<60; m++) {
      html += `<option value="${String(m).padStart(2,'0')}">${String(m).padStart(2,'0')}</option>`;
    }
    html += `</select>`;
    
    html += `</div>`;
    html += `<input type="hidden" id="${targetId}" value="${defaultVal}">`;
    
    container.innerHTML = html;
    
    const hrSel = container.querySelector('.tt-hour');
    const minSel = container.querySelector('.tt-minute');
    const hiddenInp = container.querySelector(`#${targetId}`);
    
    if (defaultVal) {
      const [defHr, defMin] = defaultVal.split(':');
      hrSel.value = defHr;
      minSel.value = defMin;
    }
    
    const updateHidden = () => {
      if (hrSel.value && minSel.value) {
        hiddenInp.value = `${hrSel.value}:${minSel.value}`;
      } else {
        hiddenInp.value = '';
      }
    };
    
    hrSel.addEventListener('change', updateHidden);
    minSel.addEventListener('change', updateHidden);
  });
}

window.setThaiTime = function(id, hhmm) {
  const hiddenInp = document.getElementById(id);
  if (!hiddenInp) return;
  hiddenInp.value = hhmm;
  const container = hiddenInp.closest('.thai-time-picker');
  if (container) {
    const parts = hhmm.split(':');
    if (parts.length >= 2) {
      container.querySelector('.tt-hour').value = parts[0];
      container.querySelector('.tt-minute').value = parts[1];
    }
  }
};
window.setThaiDate = function(id, yyyymmdd) {
  const hiddenInp = document.getElementById(id);
  if (!hiddenInp) return;
  
  hiddenInp.value = yyyymmdd;
  
  const container = hiddenInp.closest('.thai-date-picker');
  if (container) {
    const parts = yyyymmdd.split('-');
    if (parts.length === 3) {
      const adYear = parseInt(parts[0]);
      const mon = parts[1];
      const day = parts[2];
      
      container.querySelector('.td-year').value = (adYear + 543).toString();
      container.querySelector('.td-month').value = mon;
      container.querySelector('.td-day').value = day;
    }
  }
};

/**
 * History / Supabase Functions
 */
async function loadHistory() {
  const warningEl = document.getElementById('history-config-warning');
  const loadingEl = document.getElementById('history-loading');
  const listEl = document.getElementById('history-list');
  
  if (!warningEl || !loadingEl || !listEl) return;
  
  if (typeof DB === 'undefined' || !DB.isConfigured()) {
    warningEl.style.display = 'block';
    return;
  }
  
  warningEl.style.display = 'none';
  loadingEl.style.display = 'block';
  listEl.innerHTML = '';
  
  const charts = await DB.getSavedCharts();
  loadingEl.style.display = 'none';
  
  if (charts.length === 0) {
    listEl.innerHTML = '<div style="text-align: center; padding: 30px; color: var(--text-secondary); font-style: italic;">ยังไม่มีประวัติการบันทึกดวงชะตา</div>';
    return;
  }
  
  charts.forEach(chart => {
    const d = new Date(chart.birth_date);
    const dateStr = `${d.getDate()} ${ThaiAstrology.MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
    
    const div = document.createElement('div');
    div.className = 'love-partner-card';
    div.style.position = 'relative';
    div.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h4 style="color: var(--gold-primary); margin-bottom: 5px; font-size: 1.1rem;">👤 ${chart.name}</h4>
          <p style="font-size: 0.9rem; color: var(--text-secondary);">เกิด: ${dateStr} เวลา ${chart.birth_time} น. จ.${chart.province}</p>
          <div style="display: flex; gap: 10px; margin-top: 10px;">
            <span class="result-badge" style="padding: 4px 10px; font-size: 0.85rem; flex: 0 1 auto; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);">ราศี${chart.zodiac_sign}</span>
            <span class="result-badge" style="padding: 4px 10px; font-size: 0.85rem; flex: 0 1 auto; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);">ลัคนา${chart.ascendant_sign}</span>
          </div>
        </div>
        <button class="delete-btn" data-id="${chart.id}" style="background: transparent; border: none; color: var(--accent-red); cursor: pointer; font-size: 1.2rem;" title="ลบประวัติ">🗑️</button>
      </div>
    `;
    listEl.appendChild(div);
  });
  
  // Attach delete listeners
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.closest('.delete-btn').getAttribute('data-id');
      if (confirm('คุณต้องการลบประวัตินี้ใช่หรือไม่?')) {
        await DB.deleteChart(id);
        loadHistory();
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const refreshBtn = document.getElementById('btn-refresh-history');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', loadHistory);
  }
  
  if (typeof initAuth === 'function') {
    initAuth();
  }
});

/**
 * Authentication UI Logic
 */
function initAuth() {
  const btnOpenLogin = document.getElementById('btn-open-login');
  const btnLogout = document.getElementById('btn-logout');
  const authModal = document.getElementById('auth-modal');
  const btnCloseAuth = document.getElementById('btn-close-auth-modal');
  const authForm = document.getElementById('auth-form');
  const authToggleBtn = document.getElementById('auth-toggle-btn');
  const authModalTitle = document.getElementById('auth-modal-title');
  const btnAuthSubmit = document.getElementById('btn-auth-submit');
  const authErrorMsg = document.getElementById('auth-error-msg');
  const authUserInfo = document.getElementById('auth-user-info');
  const authUserEmail = document.getElementById('auth-user-email');
  
  let isRegisterMode = false;

  if (!DB || !DB.isConfigured()) return; // Don't init auth if DB not ready

  // Listen to Auth State changes
  DB.onAuthStateChange((event, session) => {
    if (session && session.user) {
      btnOpenLogin.style.display = 'none';
      authUserInfo.style.display = 'flex';
      authUserEmail.style.display = 'block';
      authUserEmail.innerText = session.user.email;
      
      // Close modal if open
      authModal.style.display = 'none';
      
      // Reload history if currently on history tab
      const historyTab = document.querySelector('.tab-btn[data-target="history-view"]');
      if (historyTab && historyTab.classList.contains('active')) {
        loadHistory();
      }
    } else {
      btnOpenLogin.style.display = 'block';
      authUserInfo.style.display = 'none';
      authUserEmail.innerText = '';
      
      // Clear history list if logged out
      const listEl = document.getElementById('history-list');
      if (listEl) {
        listEl.innerHTML = '<div style="text-align: center; padding: 30px; color: var(--text-secondary); font-style: italic;">กรุณาเข้าสู่ระบบเพื่อดูประวัติบันทึกดวงชะตา</div>';
      }
    }
  });

  // Check initial session
  DB.getSession().then(({ data: { session } }) => {
    if (!session) {
      const listEl = document.getElementById('history-list');
      if (listEl) {
        listEl.innerHTML = '<div style="text-align: center; padding: 30px; color: var(--text-secondary); font-style: italic;">กรุณาเข้าสู่ระบบเพื่อดูประวัติบันทึกดวงชะตา</div>';
      }
    }
  });

  // Open Modal
  btnOpenLogin.addEventListener('click', () => {
    authErrorMsg.style.display = 'none';
    authModal.style.display = 'flex';
  });

  // Close Modal
  btnCloseAuth.addEventListener('click', () => {
    authModal.style.display = 'none';
  });

  // Toggle Login/Register
  authToggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    isRegisterMode = !isRegisterMode;
    authErrorMsg.style.display = 'none';
    
    if (isRegisterMode) {
      authModalTitle.innerText = 'สมัครสมาชิก';
      btnAuthSubmit.innerText = 'สมัครสมาชิก';
      document.getElementById('auth-toggle-text').innerText = 'มีบัญชีอยู่แล้วใช่หรือไม่?';
      authToggleBtn.innerText = 'เข้าสู่ระบบ';
    } else {
      authModalTitle.innerText = 'เข้าสู่ระบบ';
      btnAuthSubmit.innerText = 'เข้าสู่ระบบ';
      document.getElementById('auth-toggle-text').innerText = 'ยังไม่มีบัญชีใช่หรือไม่?';
      authToggleBtn.innerText = 'สมัครสมาชิก';
    }
  });

  // Handle Submit
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    
    btnAuthSubmit.disabled = true;
    btnAuthSubmit.innerText = 'กำลังประมวลผล...';
    authErrorMsg.style.display = 'none';
    
    let result;
    if (isRegisterMode) {
      result = await DB.signUp(email, password);
      if (result.data?.user && result.data?.user?.identities?.length === 0) {
        // User already exists
        result.error = { message: 'อีเมลนี้ถูกใช้งานแล้ว' };
      } else if (!result.error) {
        alert('สมัครสมาชิกสำเร็จ! กรุณายืนยันอีเมลของคุณ (หากตั้งค่าไว้) หรือเข้าสู่ระบบได้เลย');
        authToggleBtn.click(); // Switch back to login
      }
    } else {
      result = await DB.signIn(email, password);
    }
    
    if (result.error) {
      authErrorMsg.innerText = 'เกิดข้อผิดพลาด: ' + (result.error.message === 'Invalid login credentials' ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' : result.error.message);
      authErrorMsg.style.display = 'block';
    }
    
    btnAuthSubmit.disabled = false;
    btnAuthSubmit.innerText = isRegisterMode ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ';
  });

  // Handle Logout
  btnLogout.addEventListener('click', async () => {
    if (confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
      await DB.signOut();
      // Reset to destiny view
      document.querySelector('.tab-btn[data-target="destiny-view"]').click();
    }
  });
}

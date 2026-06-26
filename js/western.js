/**
 * Western Astrology Calculation Engine
 * Uses Tropical Zodiac (No Ayanamsa) and Exact Astronomical Formulas
 */

const WesternAstrology = {
  ZODIACS: [
    { sign: 'Aries', th: 'เมษ', symbol: '♈', element: 'Fire', quality: 'Cardinal' },
    { sign: 'Taurus', th: 'พฤษภ', symbol: '♉', element: 'Earth', quality: 'Fixed' },
    { sign: 'Gemini', th: 'เมถุน', symbol: '♊', element: 'Air', quality: 'Mutable' },
    { sign: 'Cancer', th: 'กรกฎ', symbol: '♋', element: 'Water', quality: 'Cardinal' },
    { sign: 'Leo', th: 'สิงห์', symbol: '♌', element: 'Fire', quality: 'Fixed' },
    { sign: 'Virgo', th: 'กันย์', symbol: '♍', element: 'Earth', quality: 'Mutable' },
    { sign: 'Libra', th: 'ตุลย์', symbol: '♎', element: 'Air', quality: 'Cardinal' },
    { sign: 'Scorpio', th: 'พิจิก', symbol: '♏', element: 'Water', quality: 'Fixed' },
    { sign: 'Sagittarius', th: 'ธนู', symbol: '♐', element: 'Fire', quality: 'Mutable' },
    { sign: 'Capricorn', th: 'มังกร', symbol: '♑', element: 'Earth', quality: 'Cardinal' },
    { sign: 'Aquarius', th: 'กุมภ์', symbol: '♒', element: 'Air', quality: 'Fixed' },
    { sign: 'Pisces', th: 'มีน', symbol: '♓', element: 'Water', quality: 'Mutable' }
  ],

  PLANETS: [
    { id: 'sun', symbol: '☉', name: 'Sun', th: 'อาทิตย์' },
    { id: 'moon', symbol: '☽', name: 'Moon', th: 'จันทร์' },
    { id: 'mercury', symbol: '☿', name: 'Mercury', th: 'พุธ' },
    { id: 'venus', symbol: '♀', name: 'Venus', th: 'ศุกร์' },
    { id: 'mars', symbol: '♂', name: 'Mars', th: 'อังคาร' },
    { id: 'jupiter', symbol: '♃', name: 'Jupiter', th: 'พฤหัสบดี' },
    { id: 'saturn', symbol: '♄', name: 'Saturn', th: 'เสาร์' },
    { id: 'uranus', symbol: '♅', name: 'Uranus', th: 'มฤตยู' },
    // Node: True Node usually used in Western
    { id: 'node', symbol: '☊', name: 'North Node', th: 'ราหู' }
  ],

  /**
   * Main calculation function
   */
  calculateChart: function(dateStr, timeStr) {
    if (!window.ThaiAstrology) {
      console.error("WesternAstrology requires ThaiAstrology math library to be loaded first.");
      return null;
    }

    const am = window.ThaiAstrology.AstroMath;
    const date = new Date(`${dateStr}T${timeStr}:00+07:00`); // Force BKK Time
    const jd = am.getJulianDay(date);
    const t = am.getJulianCenturies(jd);

    // 1. Calculate Tropical Ascendant
    const gmst = am.normalizeAngle(280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * t * t);
    const lst = am.normalizeAngle(gmst + 100.5018); // Bangkok
    const latRad = 13.7563 * Math.PI / 180;
    const obliqRad = 23.439 * Math.PI / 180;
    
    const y = Math.cos(lst * Math.PI / 180);
    const x = -Math.sin(lst * Math.PI / 180) * Math.cos(obliqRad) - Math.tan(latRad) * Math.sin(obliqRad);
    let ascRad = Math.atan2(y, x);
    let ascDeg = ascRad * 180 / Math.PI;
    if (ascDeg < 0) ascDeg += 360;

    const ascSign = Math.floor(ascDeg / 30);

    // 2. Calculate Planets (Tropical)
    let placements = [];

    // Sun
    const sunDeg = am.getSunLongitude(jd);
    placements.push({ ...this.PLANETS.find(p => p.id === 'sun'), degree: sunDeg, sign: Math.floor(sunDeg / 30) });

    // Moon
    const moonDeg = am.getMoonLongitude(jd);
    placements.push({ ...this.PLANETS.find(p => p.id === 'moon'), degree: moonDeg, sign: Math.floor(moonDeg / 30) });

    // Others
    ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus'].forEach(pid => {
      const deg = am.getPlanetLongitude(jd, pid);
      placements.push({ ...this.PLANETS.find(p => p.id === pid), degree: deg, sign: Math.floor(deg / 30) });
    });

    // North Node (Rahu)
    const nodeDeg = am.getPlanetLongitude(jd, 'rahu');
    placements.push({ ...this.PLANETS.find(p => p.id === 'node'), degree: nodeDeg, sign: Math.floor(nodeDeg / 30) });

    // 3. Whole Sign Houses
    // House 1 is the sign of the Ascendant.
    // E.g., if Asc is 15 deg Leo (Sign 4), then Leo is House 1 (0° - 30° of Leo).
    // House 2 is Virgo, House 3 is Libra, etc.
    placements.forEach(p => {
      p.house = (p.sign - ascSign + 12) % 12 + 1; // House 1 to 12
    });

    // 4. Calculate Major Aspects
    // 0(Conjunction), 60(Sextile), 90(Square), 120(Trine), 180(Opposition)
    const aspects = [];
    const orbs = { 0: 8, 60: 6, 90: 8, 120: 8, 180: 8 };

    for(let i=0; i<placements.length; i++) {
      for(let j=i+1; j<placements.length; j++) {
        const p1 = placements[i];
        const p2 = placements[j];
        
        let diff = Math.abs(p1.degree - p2.degree);
        if (diff > 180) diff = 360 - diff;
        
        const aspectTypes = [
          { angle: 0, name: 'Conjunction', symbol: '☌' },
          { angle: 60, name: 'Sextile', symbol: '⚹' },
          { angle: 90, name: 'Square', symbol: '□' },
          { angle: 120, name: 'Trine', symbol: '△' },
          { angle: 180, name: 'Opposition', symbol: '☍' }
        ];

        aspectTypes.forEach(asp => {
          if (Math.abs(diff - asp.angle) <= orbs[asp.angle]) {
            aspects.push({
              p1: p1,
              p2: p2,
              type: asp.name,
              symbol: asp.symbol,
              orb: Math.abs(diff - asp.angle).toFixed(1)
            });
          }
        });
      }
    }

    return {
      ascendantDegree: ascDeg,
      ascendantSign: ascSign,
      zodiac: this.ZODIACS[ascSign],
      placements: placements,
      aspects: aspects,
      readings: {
        ascendant: `ลัคนา (Ascendant) ของคุณสถิตราศี${this.ZODIACS[ascSign].th} (${this.ZODIACS[ascSign].element} / ${this.ZODIACS[ascSign].quality}) บ่งบอกถึงบุคลิกภาพภายนอกที่คุณแสดงออกให้โลกเห็น และวิธีที่คุณรับมือกับสิ่งใหม่ๆ ลักษณะเด่นคือความเป็น${this.ZODIACS[ascSign].element === 'Fire' ? 'ผู้นำ กระตือรือร้น' : this.ZODIACS[ascSign].element === 'Earth' ? 'คนหนักแน่น จริงจัง' : this.ZODIACS[ascSign].element === 'Air' ? 'คนช่างคิด มีมนุษยสัมพันธ์' : 'คนอ่อนไหว มีความเห็นอกเห็นใจ'}`,
        sun: `ราศีเกิด (Sun Sign) ของคุณคือราศี${this.ZODIACS[Math.floor(sunDeg / 30)].th} บ่งบอกถึงตัวตนที่แท้จริง พลังงานหลัก และเป้าหมายสูงสุดในชีวิต`,
        moon: `ราศีจันทร์ (Moon Sign) ของคุณคือราศี${this.ZODIACS[Math.floor(moonDeg / 30)].th} บ่งบอกถึงอารมณ์ความรู้สึกส่วนลึก สัญชาตญาณ และสิ่งที่ทำให้คุณรู้สึกปลอดภัยทางใจ`
      }
    };
  }
};

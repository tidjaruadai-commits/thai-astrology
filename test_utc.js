const fs = require('fs');
const code = fs.readFileSync('./js/astrology.js', 'utf8');
const window = {};
eval(code);

const date = new Date('2024-04-15T06:00+07:00'); // Force Bangkok Time
const jd = window.ThaiAstrology.AstroMath.getJulianDay(date);
const t = window.ThaiAstrology.AstroMath.getJulianCenturies(jd);
const gmst = window.ThaiAstrology.AstroMath.normalizeAngle(280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * t * t);
const lst = window.ThaiAstrology.AstroMath.normalizeAngle(gmst + 100.5018);

console.log("JD:", jd);
console.log("GMST:", gmst);
console.log("LST:", lst);

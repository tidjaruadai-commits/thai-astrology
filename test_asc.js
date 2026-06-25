const fs = require('fs');
const code = fs.readFileSync('./js/astrology.js', 'utf8');
const context = {};
// mock window
const window = {};
eval(code);

const asc = window.ThaiAstrology.calculateAscendant('2024-04-15', '06:00');
console.log("Ascendant Index:", asc, "Sign:", window.ThaiAstrology.ZODIACS[asc].name);

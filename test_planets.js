const fs = require('fs');
const code = fs.readFileSync('./js/astrology.js', 'utf8');
eval(code);
console.log(ThaiAstrology.calculateAscendant('2024-04-15', '06:00'));
console.log(ThaiAstrology.calculatePlanets('2024-04-15', '06:00'));

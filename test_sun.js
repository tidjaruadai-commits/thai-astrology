const fs = require('fs');
const code = fs.readFileSync('./js/astrology.js', 'utf8');
const context = {};
const window = {};
eval(code);

const planets = window.ThaiAstrology.calculatePlanets('2024-04-15', '06:00');
console.log(planets.find(p => p.planetSymbol === '๑'));

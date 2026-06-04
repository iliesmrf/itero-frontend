// Meeus/Jones/Butcher Easter algorithm
function easterDate(year) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100
  const d = Math.floor(b / 4), e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4), k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day   = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

function frenchHolidays(year) {
  const easter = easterDate(year)
  const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r }
  const iso = (d) => d.toISOString().slice(0, 10)
  return new Set([
    `${year}-01-01`, // Jour de l'An
    `${year}-05-01`, // Fête du Travail
    `${year}-05-08`, // Victoire 1945
    `${year}-07-14`, // Fête Nationale
    `${year}-08-15`, // Assomption
    `${year}-11-01`, // Toussaint
    `${year}-11-11`, // Armistice
    `${year}-12-25`, // Noël
    iso(addDays(easter,  1)), // Lundi de Pâques
    iso(addDays(easter, 39)), // Ascension
    iso(addDays(easter, 50)), // Lundi de Pentecôte
  ])
}

/**
 * Count working days (Mon–Fri, excluding French public holidays) between two ISO date strings.
 */
export function workingDays(startIso, endIso) {
  const s = new Date(startIso + 'T00:00:00')
  const e = new Date(endIso   + 'T00:00:00')
  const cache = {}
  let count = 0
  const cur = new Date(s)
  while (cur <= e) {
    const year = cur.getFullYear()
    if (!cache[year]) cache[year] = frenchHolidays(year)
    const wd = cur.getDay()
    if (wd !== 0 && wd !== 6 && !cache[year].has(cur.toISOString().slice(0, 10))) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

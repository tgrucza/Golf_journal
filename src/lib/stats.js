export function calcAutoScore(d, par) {
  if (!d.approach) return par;
  let strokes = Math.max(1, par - 2);
  if (d.approach !== 'green') strokes += 1;
  strokes += d.putts || 0;
  if (d.teeTrouble === 'water' || d.teeTrouble === 'ob') strokes += 1;
  if (d.approachTrouble === 'water' || d.approachTrouble === 'ob') strokes += 1;
  return Math.max(1, strokes);
}

// ---------- Stats aggregation ----------
export function aggregateHoleStats(allRounds, holesConfig) {
  const stats = {};
  holesConfig.forEach(h => {
    stats[h.number] = {
      number: h.number, par: h.par, rounds: 0, totalToPar: 0,
      teeLeft: 0, teeRight: 0, teeFairway: 0, teeCount: 0,
      apShort: 0, apLong: 0, apLeft: 0, apRight: 0, apGreen: 0, apCount: 0,
      teeBunker: 0, teeWater: 0, teeOB: 0, apBunker: 0, apWater: 0, apOB: 0,
      shortSided: 0,
    };
  });
  allRounds.forEach(round => {
    Object.entries(round.holes || {}).forEach(([num, h]) => {
      const s = stats[num];
      if (!s) return;
      if (h.score != null) { s.rounds += 1; s.totalToPar += (h.score - s.par); }
      if (h.teeShot) {
        s.teeCount += 1;
        if (h.teeShot === 'fairway') s.teeFairway += 1;
        else if (h.teeShot === 'left') s.teeLeft += 1;
        else if (h.teeShot === 'right') s.teeRight += 1;
      }
      if (h.teeTrouble === 'bunker') s.teeBunker += 1;
      else if (h.teeTrouble === 'water') s.teeWater += 1;
      else if (h.teeTrouble === 'ob') s.teeOB += 1;
      if (h.approach) {
        s.apCount += 1;
        if (h.approach === 'green') s.apGreen += 1;
        else if (h.approach === 'short') s.apShort += 1;
        else if (h.approach === 'long') s.apLong += 1;
        else if (h.approach === 'left') s.apLeft += 1;
        else if (h.approach === 'right') s.apRight += 1;
      }
      if (h.approachTrouble === 'bunker') s.apBunker += 1;
      else if (h.approachTrouble === 'water') s.apWater += 1;
      else if (h.approachTrouble === 'ob') s.apOB += 1;
      if (h.shortSided) s.shortSided += 1;
    });
  });
  return Object.values(stats).map(s => {
    const misses = [
      { label: 'misses left off the tee', count: s.teeLeft },
      { label: 'misses right off the tee', count: s.teeRight },
      { label: 'finds the fairway bunker', count: s.teeBunker },
      { label: 'finds the water off the tee', count: s.teeWater },
      { label: 'goes O.B. off the tee', count: s.teeOB },
      { label: 'comes up short into the green', count: s.apShort },
      { label: 'goes long into the green', count: s.apLong },
      { label: 'misses left into the green', count: s.apLeft },
      { label: 'misses right into the green', count: s.apRight },
      { label: 'ends up in a greenside bunker', count: s.apBunker },
      { label: 'finds water into the green', count: s.apWater },
      { label: 'goes O.B. into the green', count: s.apOB },
    ].sort((a, b) => b.count - a.count);
    return {
      ...s,
      avgToPar: s.rounds ? s.totalToPar / s.rounds : 0,
      dominantMiss: misses[0].count > 0 ? misses[0] : null,
    };
  });
}


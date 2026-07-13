import React, { useState, useEffect, useMemo, useRef } from "react";

/* ============================================================
   LOADOUT — Harry's training tracker
   Single-file React artifact. Persists via window.storage.
   Week runs Sat -> Fri. Colours: red < MEV, green = MEV, blue = target.
   ============================================================ */

const C = {
  bg: "#0B0F14", surface: "#141B23", surface2: "#1B242E", surface3: "#222D38",
  border: "#27323D", borderLite: "#323F4C",
  text: "#E8EDF2", muted: "#8A97A6", faint: "#5A6675",
  red: "#F0564E", green: "#34C77B", blue: "#4AA3F0", amber: "#E2A93B",
  redDim: "#33201F", greenDim: "#10301E", blueDim: "#11283A", neutral: "#3A4654",
  violet: "#A78BFA", violetDim: "#241F3A",
};

/* ---------- Muscle model ---------- */
const MUSCLES = [
  { key: "chest", name: "Chest", mev: 6, target: 10 },
  { key: "lats", name: "Lats", mev: 6, target: 10 },
  { key: "quads", name: "Quads", mev: 6, target: 10 },
  { key: "midback", name: "Mid-back", mev: 6, target: 8 },
  { key: "hamstrings", name: "Hamstrings", mev: 6, target: 8 },
  { key: "sidedelts", name: "Side delts", mev: 6, target: 8 },
  { key: "reardelts", name: "Rear delts", mev: 6, target: 8 },
  { key: "biceps", name: "Biceps", mev: 6, target: 8 },
  { key: "triceps", name: "Triceps", mev: 6, target: 8 },
  { key: "glutes", name: "Glutes", mev: 4, target: 6 },
  { key: "calves", name: "Calves", mev: 6, target: 10 },
  { key: "core", name: "Core", mev: 6, target: 8 },
  { key: "frontdelts", name: "Front delts", mev: 0, target: 4 },
];
const M_BY_KEY = Object.fromEntries(MUSCLES.map((m) => [m.key, m]));

/* ---------- Exercise library ---------- */
const EXERCISES = [
  { id: "floorpress", name: "DB Floor Press", loc: ["home"], unit: "db", w: 18, credits: { chest: 1, triceps: 0.5, frontdelts: 0.5 } },
  { id: "narrowfloorpress", name: "Narrow Floor Press", loc: ["home"], unit: "db", w: 16, credits: { chest: 1, triceps: 0.75, frontdelts: 0.5 }, note: "Close grip — triceps/elbow loader; watch the elbow signal." },
  { id: "sofapress", name: "Sofa Incline Press-up", loc: ["home"], unit: "bw", w: 0, credits: { chest: 1, triceps: 0.5, frontdelts: 0.5 } },
  { id: "narrowpressup", name: "Narrow Press-up", loc: ["home"], unit: "bw", w: 0, credits: { chest: 1, triceps: 0.75, frontdelts: 0.5 }, note: "Close grip — triceps/elbow loader; watch the elbow signal." },
  { id: "widepressup", name: "Wide Press-up", loc: ["home", "outdoor", "gym"], unit: "bw", w: 0, credits: { chest: 1, triceps: 0.25, frontdelts: 0.5 }, note: "Wide hands bias the pecs; easy on the elbows, keep shoulders packed." },
  { id: "widepressupincline", name: "Wide Press-up (incline)", loc: ["home", "outdoor", "gym"], unit: "bw", w: 0, credits: { chest: 1, triceps: 0.25, frontdelts: 0.5 }, note: "Hands elevated — easier regression of the wide press-up, same chest bias." },
  { id: "floorflye", name: "DB Floor Flye", loc: ["home"], unit: "db", w: 9, credits: { chest: 1 }, note: "Lower to a deep stretch; the floor clips the very bottom of the ROM." },
  { id: "inclinepushup", name: "Incline Push-up (bar)", loc: ["outdoor"], unit: "bw", w: 0, credits: { chest: 1, triceps: 0.5, frontdelts: 0.5 } },
  { id: "rdl", name: "DB RDL", loc: ["home"], unit: "db", w: 16, capSets: 4, credits: { hamstrings: 1, glutes: 1 }, note: "Grip-capped (no straps). Max 4 sets — erector fatigue." },
  { id: "gobletsquat", name: "Goblet Squat", loc: ["home"], unit: "db", w: 16, credits: { quads: 1, glutes: 0.5 } },
  { id: "frontsquat", name: "DB Front Squat", loc: ["home"], unit: "db", w: 10, credits: { quads: 1, glutes: 0.5 } },
  { id: "frontsquatalt", name: "DB Front Squat (single)", loc: ["home"], unit: "db", w: 9, credits: { quads: 1, glutes: 0.5, core: 0.25 } },
  { id: "sumosquat", name: "Sumo Squat", loc: ["home"], unit: "db", w: 16, credits: { quads: 1, glutes: 0.75 } },
  { id: "bwsquat", name: "BW Squat", loc: ["home", "outdoor"], unit: "bw", w: 0, credits: { quads: 1, glutes: 0.5 } },
  { id: "reverselunge", name: "Reverse Lunge", loc: ["home", "outdoor"], unit: "bw", w: 0, credits: { quads: 1, glutes: 0.5 }, note: "Knee on watch-list." },
  { id: "onearmrow", name: "1-Arm DB Row", loc: ["home"], unit: "db", w: 13.5, credits: { lats: 0.75, midback: 1, biceps: 0.5, reardelts: 0.25 } },
  { id: "bentrow", name: "Bent-over Row", loc: ["home"], unit: "db", w: 10, credits: { lats: 0.75, midback: 1, biceps: 0.5, reardelts: 0.25 } },
  { id: "renegaderow", name: "Renegade Row", loc: ["home"], unit: "db", w: 10, retired: true, credits: { lats: 0.75, midback: 1, biceps: 0.5, reardelts: 0.25 }, note: "Wrist-dependent; form before load." },
  { id: "ohp", name: "Strict OHP", loc: ["home"], unit: "db", w: 10, credits: { frontdelts: 1, sidedelts: 0.5, triceps: 0.5 } },
  { id: "arnold", name: "Arnold Press", loc: ["home"], unit: "db", w: 10, credits: { frontdelts: 1, sidedelts: 0.5, triceps: 0.5 } },
  { id: "seatedpress", name: "Seated DB Shoulder Press", loc: ["home"], unit: "db", w: 10, retired: true, credits: { frontdelts: 1, sidedelts: 0.5, triceps: 0.5 } },
  { id: "lateral", name: "Lateral Raise", loc: ["home"], unit: "db", w: 5.5, credits: { sidedelts: 1 } },
  { id: "fly", name: "Reverse Fly", loc: ["home"], unit: "db", w: 5.5, credits: { reardelts: 1 } },
  { id: "wraise", name: "W-Raise", loc: ["home"], unit: "db", w: 5.5, credits: { reardelts: 1 } },
  { id: "frontraise", name: "Front Raise", loc: ["home"], unit: "db", w: 5.5, credits: { frontdelts: 1 } },
  { id: "uprightrow", name: "Upright Row", loc: ["home"], unit: "db", w: 10, credits: { sidedelts: 0.75, midback: 0.5, biceps: 0.25 }, note: "Keep elbows below shoulder height — wrist/shoulder watch-list." },
  { id: "curl", name: "DB Curl", loc: ["home"], unit: "db", w: 10, credits: { biceps: 1 } },
  { id: "curlalt", name: "DB Curl (alternating)", loc: ["home"], unit: "db", w: 9, credits: { biceps: 1 } },
  { id: "skullcrusher", name: "Skullcrusher", loc: ["home"], unit: "db", w: 18, credits: { triceps: 1 }, note: "Elbow tingling x2 — one more signal benches this for OHTE." },
  { id: "ohte", name: "OHTE", loc: ["home"], unit: "db", w: 16, maint: true, credits: { triceps: 1 } },
  { id: "ohtesingle", name: "OHTE (single DB)", loc: ["home"], unit: "db", w: 13.5, credits: { triceps: 1, core: 0.25 } },
  { id: "pullover", name: "DB Pullover", loc: ["home"], unit: "db", w: 11.5, credits: { lats: 0.5, chest: 0.5 } },
  { id: "glutebridge", name: "SL Glute Bridge", loc: ["home"], unit: "db", w: 13.5, credits: { glutes: 1, hamstrings: 0.5 } },
  { id: "dlglutebridge", name: "Glute Bridge (double leg)", loc: ["home"], unit: "db", w: 16, credits: { glutes: 1, hamstrings: 0.5 } },
  { id: "calfraise", name: "Standing Calf Raise", loc: ["home", "outdoor"], unit: "db", w: 24, maint: true, credits: { calves: 1 }, note: "Equipment ceiling (2x24kg). Use step for ROM, not load." },
  { id: "bicycle", name: "Bicycle Crunch", loc: ["home", "outdoor"], unit: "bw", w: 0, credits: { core: 1 } },
  { id: "plank", name: "Plank (hold)", loc: ["home", "outdoor"], unit: "bw", w: 0, credits: { core: 1 }, note: "Retired at 120s for bicycle crunch. Log as reps (seconds) if needed." },
  { id: "russiantwist", name: "Russian Twist", loc: ["home"], unit: "bw", w: 0, credits: { core: 1 } },
  { id: "hangingknee", name: "Hanging Knee Raise", loc: ["outdoor", "gym"], unit: "bw", w: 0, credits: { core: 1 } },
  { id: "latpulldown", name: "Lat Pulldown", loc: ["gym"], unit: "db", w: 40, credits: { lats: 1, midback: 0.5, biceps: 0.5 } },
  { id: "legpress", name: "Leg Press", loc: ["gym"], unit: "db", w: 50, credits: { quads: 1, glutes: 0.5 } },
  { id: "legext", name: "Leg Extension", loc: ["gym"], unit: "db", w: 35, credits: { quads: 1 } },
  { id: "tripushdown", name: "Tricep Pushdown", loc: ["gym"], unit: "db", w: 15, credits: { triceps: 1 } },
  { id: "bbsquat", name: "Barbell Back Squat", loc: ["gym"], unit: "db", w: 60, credits: { quads: 1, glutes: 0.5 } },
  { id: "bbrdl", name: "Barbell RDL", loc: ["gym"], unit: "db", w: 60, credits: { hamstrings: 1, glutes: 1 } },
  { id: "bbbench", name: "Barbell Bench Press", loc: ["gym"], unit: "db", w: 50, credits: { chest: 1, triceps: 0.5, frontdelts: 0.5 } },
  { id: "bbohp", name: "Barbell Overhead Press", loc: ["gym"], unit: "db", w: 35, credits: { frontdelts: 1, sidedelts: 0.5, triceps: 0.5 } },
  { id: "bbrow", name: "Barbell Row", loc: ["gym"], unit: "db", w: 50, credits: { lats: 0.75, midback: 1, biceps: 0.5, reardelts: 0.25 } },
  { id: "hipthrust", name: "Barbell Hip Thrust", loc: ["gym"], unit: "db", w: 60, credits: { glutes: 1, hamstrings: 0.5 } },
  { id: "hacksquat", name: "Hack Squat", loc: ["gym"], unit: "db", w: 50, credits: { quads: 1, glutes: 0.5 } },
  { id: "legcurl", name: "Leg Curl", loc: ["gym"], unit: "db", w: 35, credits: { hamstrings: 1 } },
  { id: "cablerow", name: "Seated Cable Row", loc: ["gym"], unit: "db", w: 45, credits: { lats: 0.75, midback: 1, biceps: 0.5, reardelts: 0.25 } },
  { id: "chestpress", name: "Chest Press (machine)", loc: ["gym"], unit: "db", w: 40, credits: { chest: 1, triceps: 0.5, frontdelts: 0.5 } },
  { id: "shoulderpress", name: "Shoulder Press (machine)", loc: ["gym"], unit: "db", w: 30, credits: { frontdelts: 1, sidedelts: 0.5, triceps: 0.5 } },
  { id: "pecdeck", name: "Pec Deck", loc: ["gym"], unit: "db", w: 35, credits: { chest: 1 } },
  { id: "cablefly", name: "Cable Fly", loc: ["gym"], unit: "db", w: 15, credits: { chest: 1 } },
  { id: "cablelateral", name: "Cable Lateral Raise", loc: ["gym"], unit: "db", w: 7.5, credits: { sidedelts: 1 } },
  { id: "reardeltmachine", name: "Rear Delt Machine", loc: ["gym"], unit: "db", w: 25, credits: { reardelts: 1 } },
  { id: "facepull", name: "Face Pull (cable)", loc: ["gym"], unit: "db", w: 20, credits: { reardelts: 1 } },
  { id: "cablecurl", name: "Cable Curl", loc: ["gym"], unit: "db", w: 20, credits: { biceps: 1 } },
  { id: "calfmachine", name: "Calf Raise (machine)", loc: ["gym"], unit: "db", w: 60, credits: { calves: 1 } },
  { id: "cablecrunch", name: "Cable Crunch", loc: ["gym"], unit: "db", w: 35, credits: { core: 1 } },
  { id: "pullup", name: "Pull-up (standard)", loc: ["outdoor"], unit: "load", w: 0, credits: { lats: 1, midback: 0.5, biceps: 0.5 } },
  { id: "widepullup", name: "Wide Pull-up", loc: ["outdoor"], unit: "load", w: 0, credits: { lats: 0.75, midback: 0.75, biceps: 0.25 } },
  { id: "widepullupassist", name: "Wide Pull-up (assisted)", loc: ["outdoor"], unit: "load", w: 0, credits: { lats: 0.75, midback: 0.75, biceps: 0.25 } },
  { id: "chinup", name: "Chin-up", loc: ["outdoor"], unit: "load", w: 0, credits: { lats: 1, midback: 0.5, biceps: 1 } },
];
const EX_BY_ID = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));
// Gym normally sees everything (home + outdoor + gym-only); strict mode shows only gym-specific kit.
// Home/outdoor always filter to their own kit (strict is a no-op for them).
const exTotal = (e) => Object.values(e.credits).reduce((s, c) => s + c, 0);
const exForLoc = (loc, strict) => {
  const live = EXERCISES.filter((e) => !e.retired);
  if (loc === "gym") return strict ? live.filter((e) => e.loc.includes("gym")) : live;
  return live.filter((e) => e.loc.includes(loc));
};

/* ---------- Date helpers (local, YYYY-MM-DD) ---------- */
const pad = (n) => String(n).padStart(2, "0");
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function parseISO(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d, 12); }
function isoFromDate(dt) { return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`; }
function addDaysISO(s, n) { const dt = parseISO(s); dt.setDate(dt.getDate() + n); return isoFromDate(dt); }
function startOfWeekISO(s) { const dt = parseISO(s); const sub = (dt.getDay() + 1) % 7; dt.setDate(dt.getDate() - sub); return isoFromDate(dt); }
function weeksBetween(a, b) { return Math.round((parseISO(startOfWeekISO(b)) - parseISO(startOfWeekISO(a))) / (7 * 864e5)); }
function prettyDate(s) {
  const dt = parseISO(s);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const mons = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${days[dt.getDay()]} ${dt.getDate()} ${mons[dt.getMonth()]}`;
}

/* ---------- Credit / tier maths ---------- */
function sessionCredits(sess) {
  const t = {};
  for (const ex of sess.exercises) {
    const meta = EX_BY_ID[ex.exId];
    if (!meta) continue;
    const n = ex.sets.length;
    for (const [mk, c] of Object.entries(meta.credits)) t[mk] = (t[mk] || 0) + c * n;
  }
  return t;
}
function weekTotals(sessions, weekStart) {
  const end = addDaysISO(weekStart, 7);
  const t = {};
  for (const s of sessions) {
    if (s.date >= weekStart && s.date < end) {
      const c = sessionCredits(s);
      for (const [k, v] of Object.entries(c)) t[k] = (t[k] || 0) + v;
    }
  }
  return t;
}
function tierOf(val, mev, target) {
  if (target > 0 && val >= target) return "blue";
  if (mev > 0 && val >= mev) return "green";
  if (mev === 0) return val > 0 ? "green" : "neutral";
  return "red";
}
const tierColor = (t) => (t === "blue" ? C.blue : t === "green" ? C.green : t === "neutral" ? C.neutral : C.red);

/* ---------- Recovery: muscles worked in the last day → Map(muscle → latest date) ---------- */
function recentMuscles(sessions, refISO) {
  const prev = addDaysISO(refISO, -1);
  const map = new Map();
  for (const s of sessions) {
    if (s.date === refISO || s.date === prev) {
      for (const ex of s.exercises) {
        const meta = EX_BY_ID[ex.exId];
        if (!meta) continue;
        for (const mk of Object.keys(meta.credits)) {
          const cur = map.get(mk);
          if (!cur || s.date > cur) map.set(mk, s.date);
        }
      }
    }
  }
  return map;
}

/* ---------- Suggester: greedy fill to MEV, worst 4-week trend first ---------- */
// Average of weekly sets ÷ (deload-adjusted) target over the last `weeks` completed weeks.
function trendAverages(sessions, deloadWeeks, weeks = 4) {
  const cur = startOfWeekISO(todayISO());
  const cols = [];
  for (let i = weeks; i >= 1; i--) {
    const wk = addDaysISO(cur, -7 * i);
    cols.push({ t: weekTotals(sessions, wk), f: (deloadWeeks || []).includes(wk) ? 0.5 : 1 });
  }
  const avg = {};
  for (const m of MUSCLES) {
    avg[m.key] = cols.reduce((s, c) => s + Math.min(1, (c.t[m.key] || 0) / (m.target * c.f)), 0) / weeks;
  }
  return avg;
}
function suggestPlan(weekT, location, excludeMuscles, strict, trendAvg = {}) {
  const plan = []; // {exId, sets}
  const ptot = {};
  const total = (mk) => (weekT[mk] || 0) + (ptot[mk] || 0);
  const recompute = () => {
    for (const k of Object.keys(ptot)) delete ptot[k];
    for (const p of plan) {
      const meta = EX_BY_ID[p.exId];
      for (const [mk, c] of Object.entries(meta.credits)) ptot[mk] = (ptot[mk] || 0) + c * p.sets;
    }
  };
  const avail = exForLoc(location, strict);
  const uncoverable = [];
  let guard = 0;
  while (guard++ < 40) {
    // Muscles still below this week's MEV, worst 4-week trend first (tie: bigger current gap).
    const below = MUSCLES.filter((m) => m.mev > 0 && !excludeMuscles.has(m.key) && m.mev - total(m.key) > 0.01)
      .sort((a, b) => (trendAvg[a.key] ?? 0) - (trendAvg[b.key] ?? 0) || (b.mev - total(b.key)) - (a.mev - total(a.key)));
    const pick = below[0];
    if (!pick) break;
    // Primary movers first (highest credit for this muscle), then the most compound (highest total credits).
    const cands = avail
      .filter((e) => (e.credits[pick.key] || 0) > 0)
      .sort((a, b) => (b.credits[pick.key] || 0) - (a.credits[pick.key] || 0) || exTotal(b) - exTotal(a) || (a.maint ? 1 : 0) - (b.maint ? 1 : 0));
    if (!cands.length) {
      uncoverable.push(pick.key);
      excludeMuscles.add(pick.key); // skip so loop terminates
      continue;
    }
    let ex = cands.find((e) => !plan.some((p) => p.exId === e.id)) || cands[0];
    let need = Math.ceil((pick.mev - total(pick.key)) / ex.credits[pick.key]);
    need = Math.max(2, Math.min(need, ex.capSets || 4));
    const existing = plan.find((p) => p.exId === ex.id);
    if (existing) existing.sets = Math.min(ex.capSets || 6, existing.sets + need);
    else plan.push({ exId: ex.id, sets: need });
    recompute();
  }
  return { plan, uncoverable };
}

/* ---------- PB check (against stored pbs, pre-session) ---------- */
function pbCheck(pbs, exId, weight, reps) {
  const meta = EX_BY_ID[exId];
  const rec = pbs[exId] || { maxW: -1, byW: {} };
  const w = Number(weight) || 0, r = Number(reps) || 0;
  if (r <= 0) return null;
  if (meta.unit === "load") {
    // bodyweight / weighted: weight = added load
    const best = rec.byW[w];
    if (w > 0 && (rec.maxW < 0 || w > rec.maxW)) return { kind: "weighted", label: `${r} reps + ${w}kg` };
    if (best == null || r > best) return { kind: w > 0 ? "weighted" : "reps", label: w > 0 ? `${r} reps + ${w}kg` : `${r} reps` };
    return null;
  }
  if (rec.maxW >= 0 && w > rec.maxW) return { kind: "load", label: `${w}kg x ${r}` };
  const best = rec.byW[w];
  if (best == null) return rec.maxW >= 0 && w < rec.maxW ? null : null; // lighter unseen weight isn't a PB
  if (r > best) return { kind: "reps", label: `${w}kg x ${r}` };
  return null;
}
function mergePB(pbs, exId, weight, reps) {
  const w = Number(weight) || 0, r = Number(reps) || 0;
  if (r <= 0) return pbs;
  const next = { ...pbs };
  const rec = next[exId] ? { maxW: next[exId].maxW, byW: { ...next[exId].byW } } : { maxW: -1, byW: {} };
  if (w > rec.maxW) rec.maxW = w;
  if (rec.byW[w] == null || r > rec.byW[w]) rec.byW[w] = r;
  next[exId] = rec;
  return next;
}

/* ---------- Seed (first run) ---------- */
// Historical W3-W5 sessions (parsed from CSV)
function seedHistorical() {
  return [
    { id: "hist-hotel-gym-1", date: "2026-05-04", location: "gym", exercises: [{ exId: "floorpress", sets: [{ weight: 12.0, reps: 8 }, { weight: 12.0, reps: 8 }, { weight: 14.0, reps: 10 }] }, { exId: "onearmrow", sets: [{ weight: 12.0, reps: 5 }, { weight: 12.0, reps: 5 }] }, { exId: "gobletsquat", sets: [{ weight: 10.0, reps: 8 }, { weight: 12.0, reps: 8 }, { weight: 10.0, reps: 6 }] }, { exId: "seatedpress", sets: [{ weight: 14.0, reps: 4 }, { weight: 12.0, reps: 5 }, { weight: 10.0, reps: 6 }] }, { exId: "latpulldown", sets: [{ weight: 35.0, reps: 12 }, { weight: 40.0, reps: 5 }, { weight: 35.0, reps: 7 }] }, { exId: "tripushdown", sets: [{ weight: 12.5, reps: 13 }, { weight: 15.0, reps: 5 }, { weight: 12.5, reps: 5 }] }] },
    { id: "hist-hotel-gym-2", date: "2026-05-06", location: "gym", exercises: [{ exId: "floorpress", sets: [{ weight: 16.0, reps: 9 }, { weight: 14.0, reps: 9 }, { weight: 14.0, reps: 6 }] }, { exId: "onearmrow", sets: [{ weight: 12.0, reps: 10 }, { weight: 12.0, reps: 7 }, { weight: 10.0, reps: 9 }] }, { exId: "legext", sets: [{ weight: 35.0, reps: 10 }, { weight: 30.0, reps: 8 }, { weight: 30.0, reps: 7 }] }, { exId: "legpress", sets: [{ weight: 40.0, reps: 10 }, { weight: 50.0, reps: 8 }] }, { exId: "gobletsquat", sets: [{ weight: 14.0, reps: 10 }, { weight: 16.0, reps: 7 }, { weight: 14.0, reps: 9 }] }, { exId: "latpulldown", sets: [{ weight: 35.0, reps: 12 }, { weight: 40.0, reps: 8 }, { weight: 40.0, reps: 5 }] }, { exId: "seatedpress", sets: [{ weight: 10.0, reps: 8 }, { weight: 10.0, reps: 6 }, { weight: 8.0, reps: 10 }] }, { exId: "hangingknee", sets: [{ weight: 0, reps: 5 }, { weight: 0, reps: 4 }] }] },
    { id: "hist-hotel-gym-3", date: "2026-05-08", location: "gym", exercises: [{ exId: "floorpress", sets: [{ weight: 18.0, reps: 5 }, { weight: 16.0, reps: 8 }, { weight: 14.0, reps: 10 }] }, { exId: "onearmrow", sets: [{ weight: 14.0, reps: 6 }, { weight: 12.0, reps: 10 }, { weight: 12.0, reps: 9 }] }, { exId: "rdl", sets: [{ weight: 20.0, reps: 8 }, { weight: 18.0, reps: 10 }, { weight: 18.0, reps: 6 }] }, { exId: "latpulldown", sets: [{ weight: 45.0, reps: 6 }, { weight: 40.0, reps: 9 }, { weight: 35.0, reps: 11 }] }, { exId: "gobletsquat", sets: [{ weight: 14.0, reps: 8 }, { weight: 14.0, reps: 5 }] }, { exId: "seatedpress", sets: [{ weight: 10.0, reps: 8 }, { weight: 10.0, reps: 7 }, { weight: 10.0, reps: 8 }] }, { exId: "tripushdown", sets: [{ weight: 15.0, reps: 11 }, { weight: 15.0, reps: 9 }, { weight: 15.0, reps: 3 }] }, { exId: "hangingknee", sets: [{ weight: 0, reps: 3 }] }] },
    { id: "hist-w1-nursery", date: "2026-05-09", location: "outdoor", exercises: [{ exId: "chinup", sets: [{ weight: 0, reps: 12 }, { weight: 0, reps: 10 }, { weight: 0, reps: 9 }, { weight: 0, reps: 8 }] }, { exId: "widepullupassist", sets: [{ weight: 0, reps: 11 }, { weight: 0, reps: 8 }, { weight: 0, reps: 8 }] }] },
    { id: "hist-w1-home-1", date: "2026-05-11", location: "home", exercises: [{ exId: "floorpress", sets: [{ weight: 13.5, reps: 12 }, { weight: 13.5, reps: 10 }, { weight: 16.0, reps: 10 }] }, { exId: "gobletsquat", sets: [{ weight: 13.5, reps: 8 }, { weight: 13.5, reps: 8 }, { weight: 16.0, reps: 6 }] }, { exId: "rdl", sets: [{ weight: 13.5, reps: 8 }, { weight: 13.5, reps: 10 }, { weight: 16.0, reps: 7 }] }, { exId: "arnold", sets: [{ weight: 8.0, reps: 10 }, { weight: 9.0, reps: 8 }, { weight: 9.0, reps: 6 }] }, { exId: "fly", sets: [{ weight: 5.5, reps: 12 }, { weight: 5.5, reps: 10 }, { weight: 4.5, reps: 15 }] }, { exId: "plank", sets: [{ weight: 0, reps: 60 }, { weight: 0, reps: 70 }] }, { exId: "skullcrusher", sets: [{ weight: 4.5, reps: 12 }, { weight: 6.5, reps: 9 }, { weight: 6.5, reps: 8 }] }, { exId: "lateral", sets: [{ weight: 4.5, reps: 12 }, { weight: 5.5, reps: 10 }, { weight: 4.5, reps: 13 }] }] },
    { id: "hist-w1-home-2", date: "2026-05-12", location: "home", exercises: [{ exId: "floorpress", sets: [{ weight: 16.0, reps: 8 }, { weight: 16.0, reps: 9 }, { weight: 16.0, reps: 10 }] }, { exId: "gobletsquat", sets: [{ weight: 16.0, reps: 8 }, { weight: 16.0, reps: 5 }, { weight: 13.5, reps: 7 }] }, { exId: "arnold", sets: [{ weight: 9.0, reps: 8 }, { weight: 9.0, reps: 7 }, { weight: 9.0, reps: 6 }] }, { exId: "plank", sets: [{ weight: 0, reps: 90 }, { weight: 0, reps: 65 }] }, { exId: "lateral", sets: [{ weight: 5.5, reps: 9 }, { weight: 5.5, reps: 6 }, { weight: 5.5, reps: 11 }] }, { exId: "fly", sets: [{ weight: 5.5, reps: 8 }, { weight: 5.5, reps: 12 }, { weight: 5.5, reps: 4 }] }, { exId: "glutebridge", sets: [{ weight: 13.5, reps: 8 }, { weight: 13.5, reps: 8 }] }] },
    { id: "hist-w1-nursery-2", date: "2026-05-13", location: "outdoor", exercises: [{ exId: "pullup", sets: [{ weight: 0, reps: 13 }, { weight: 0, reps: 9 }] }, { exId: "widepullup", sets: [{ weight: 0, reps: 12 }, { weight: 0, reps: 8 }] }, { exId: "chinup", sets: [{ weight: 0, reps: 10 }, { weight: 0, reps: 12 }] }, { exId: "inclinepushup", sets: [{ weight: 0, reps: 10 }, { weight: 0, reps: 8 }, { weight: 0, reps: 6 }] }] },
    { id: "hist-w1-home-3", date: "2026-05-14", location: "home", exercises: [{ exId: "onearmrow", sets: [{ weight: 13.5, reps: 8 }, { weight: 13.5, reps: 10 }, { weight: 13.5, reps: 7 }] }, { exId: "rdl", sets: [{ weight: 16.0, reps: 8 }, { weight: 16.0, reps: 12 }, { weight: 18.0, reps: 7 }] }, { exId: "fly", sets: [{ weight: 5.5, reps: 13 }, { weight: 5.5, reps: 12 }, { weight: 5.5, reps: 9 }] }, { exId: "glutebridge", sets: [{ weight: 13.5, reps: 8 }, { weight: 13.5, reps: 9 }] }, { exId: "calfraise", sets: [{ weight: 13.5, reps: 15 }] }, { exId: "plank", sets: [{ weight: 0, reps: 100 }, { weight: 0, reps: 90 }] }] },
    { id: "hist-w1-home-4", date: "2026-05-15", location: "home", exercises: [{ exId: "gobletsquat", sets: [{ weight: 16.0, reps: 5 }, { weight: 13.5, reps: 8 }, { weight: 13.5, reps: 6 }] }, { exId: "onearmrow", sets: [{ weight: 13.5, reps: 8 }, { weight: 13.5, reps: 8 }, { weight: 13.5, reps: 4 }] }, { exId: "reverselunge", sets: [{ weight: 9.0, reps: 12 }, { weight: 0, reps: 10 }] }, { exId: "lateral", sets: [{ weight: 5.5, reps: 10 }, { weight: 5.5, reps: 9 }, { weight: 4.5, reps: 15 }] }, { exId: "glutebridge", sets: [{ weight: 13.5, reps: 9 }, { weight: 13.5, reps: 8 }] }, { exId: "curl", sets: [{ weight: 10.0, reps: 7 }, { weight: 8.0, reps: 7 }] }, { exId: "calfraise", sets: [{ weight: 13.5, reps: 15 }, { weight: 16.0, reps: 15 }] }, { exId: "skullcrusher", sets: [{ weight: 6.5, reps: 12 }] }, { exId: "bicycle", sets: [{ weight: 0, reps: 27 }, { weight: 0, reps: 20 }] }, { exId: "fly", sets: [{ weight: 4.5, reps: 13 }, { weight: 4.5, reps: 12 }] }, { exId: "plank", sets: [{ weight: 0, reps: 70 }, { weight: 0, reps: 120 }] }] },
    { id: "hist-w2-am-push", date: "2026-05-18", location: "home", exercises: [{ exId: "floorpress", sets: [{ weight: 16.0, reps: 12 }, { weight: 18.0, reps: 12 }, { weight: 18.0, reps: 8 }, { weight: 18.0, reps: 9 }] }, { exId: "calfraise", sets: [{ weight: 18.0, reps: 15 }, { weight: 18.0, reps: 15 }] }, { exId: "plank", sets: [{ weight: 0, reps: 110 }, { weight: 0, reps: 61 }] }, { exId: "gobletsquat", sets: [{ weight: 13.5, reps: 8 }, { weight: 13.5, reps: 9 }, { weight: 13.5, reps: 7 }, { weight: 11.5, reps: 11 }] }, { exId: "reverselunge", sets: [{ weight: 0, reps: 12 }, { weight: 0, reps: 8 }, { weight: 0, reps: 10 }] }, { exId: "bicycle", sets: [{ weight: 0, reps: 27 }, { weight: 0, reps: 35 }] }, { exId: "arnold", sets: [{ weight: 9.0, reps: 10 }, { weight: 9.0, reps: 9 }, { weight: 9.0, reps: 7 }] }, { exId: "lateral", sets: [{ weight: 5.5, reps: 9 }, { weight: 4.5, reps: 10 }, { weight: 4.5, reps: 9 }] }, { exId: "fly", sets: [{ weight: 5.5, reps: 7 }, { weight: 4.5, reps: 9 }] }, { exId: "skullcrusher", sets: [{ weight: 5.5, reps: 9 }, { weight: 4.5, reps: 14 }] }] },
    { id: "hist-w2-pm-pull", date: "2026-05-18", location: "home", exercises: [{ exId: "onearmrow", sets: [{ weight: 13.5, reps: 9 }, { weight: 13.5, reps: 8 }, { weight: 13.5, reps: 9 }, { weight: 13.5, reps: 12 }] }, { exId: "rdl", sets: [{ weight: 16.0, reps: 9 }, { weight: 16.0, reps: 11 }, { weight: 18.0, reps: 8 }, { weight: 18.0, reps: 8 }] }, { exId: "glutebridge", sets: [{ weight: 13.5, reps: 8 }, { weight: 13.5, reps: 10 }] }, { exId: "curl", sets: [{ weight: 9.0, reps: 8 }, { weight: 8.0, reps: 8 }, { weight: 7.0, reps: 8 }] }, { exId: "pullover", sets: [{ weight: 9.0, reps: 13 }, { weight: 10.0, reps: 11 }] }] },
    { id: "hist-w3-nursery", date: "2026-05-23", location: "outdoor", exercises: [{ exId: "inclinepushup", sets: [{ weight: 0, reps: 8 }] }, { exId: "pullup", sets: [{ weight: 0, reps: 9 }] }, { exId: "chinup", sets: [{ weight: 0, reps: 13 }] }] },
    { id: "hist-w3-home-1", date: "2026-05-25", location: "home", exercises: [{ exId: "gobletsquat", sets: [{ weight: 16.0, reps: 5 }, { weight: 13.5, reps: 8 }, { weight: 13.5, reps: 6 }] }, { exId: "onearmrow", sets: [{ weight: 13.5, reps: 8 }, { weight: 13.5, reps: 8 }, { weight: 13.5, reps: 4 }] }, { exId: "reverselunge", sets: [{ weight: 9.0, reps: 12 }, { weight: 0, reps: 10 }] }, { exId: "lateral", sets: [{ weight: 5.5, reps: 10 }, { weight: 5.5, reps: 9 }, { weight: 4.5, reps: 15 }] }, { exId: "glutebridge", sets: [{ weight: 13.5, reps: 9 }, { weight: 13.5, reps: 8 }] }, { exId: "curl", sets: [{ weight: 10.0, reps: 7 }, { weight: 8.0, reps: 7 }] }, { exId: "calfraise", sets: [{ weight: 13.5, reps: 15 }, { weight: 16.0, reps: 15 }] }, { exId: "skullcrusher", sets: [{ weight: 6.5, reps: 12 }] }, { exId: "bicycle", sets: [{ weight: 0, reps: 27 }, { weight: 0, reps: 20 }] }, { exId: "fly", sets: [{ weight: 4.5, reps: 13 }, { weight: 4.5, reps: 12 }] }, { exId: "plank", sets: [{ weight: 0, reps: 70 }, { weight: 0, reps: 120 }] }] },
    { id: "hist-w3-home-2", date: "2026-05-27", location: "home", exercises: [{ exId: "floorpress", sets: [{ weight: 16.0, reps: 12 }, { weight: 18.0, reps: 12 }, { weight: 18.0, reps: 8 }, { weight: 18.0, reps: 9 }] }, { exId: "calfraise", sets: [{ weight: 18.0, reps: 15 }, { weight: 18.0, reps: 15 }] }, { exId: "plank", sets: [{ weight: 0, reps: 110 }, { weight: 0, reps: 61 }] }, { exId: "gobletsquat", sets: [{ weight: 13.5, reps: 8 }, { weight: 13.5, reps: 9 }, { weight: 13.5, reps: 7 }, { weight: 11.5, reps: 11 }] }, { exId: "reverselunge", sets: [{ weight: 0, reps: 12 }, { weight: 0, reps: 8 }, { weight: 0, reps: 10 }] }, { exId: "bicycle", sets: [{ weight: 0, reps: 27 }, { weight: 0, reps: 35 }] }, { exId: "arnold", sets: [{ weight: 9.0, reps: 10 }, { weight: 9.0, reps: 9 }, { weight: 9.0, reps: 7 }] }, { exId: "lateral", sets: [{ weight: 5.5, reps: 9 }, { weight: 4.5, reps: 10 }, { weight: 4.5, reps: 9 }] }, { exId: "fly", sets: [{ weight: 5.5, reps: 7 }, { weight: 4.5, reps: 9 }] }, { exId: "skullcrusher", sets: [{ weight: 5.5, reps: 9 }, { weight: 4.5, reps: 14 }] }] },
    { id: "hist-w3-home-3", date: "2026-05-29", location: "home", exercises: [{ exId: "onearmrow", sets: [{ weight: 13.5, reps: 9 }, { weight: 13.5, reps: 8 }, { weight: 13.5, reps: 9 }, { weight: 13.5, reps: 12 }] }, { exId: "rdl", sets: [{ weight: 16.0, reps: 9 }, { weight: 16.0, reps: 11 }, { weight: 18.0, reps: 8 }, { weight: 18.0, reps: 8 }] }, { exId: "glutebridge", sets: [{ weight: 13.5, reps: 8 }, { weight: 13.5, reps: 10 }] }, { exId: "curl", sets: [{ weight: 9.0, reps: 8 }, { weight: 8.0, reps: 8 }, { weight: 7.0, reps: 8 }] }, { exId: "pullover", sets: [{ weight: 9.0, reps: 13 }, { weight: 10.0, reps: 11 }] }] },
    { id: "hist-w3-home-4", date: "2026-05-26", location: "home", exercises: [{ exId: "floorpress", sets: [{ weight: 18.0, reps: 9 }, { weight: 18.0, reps: 8 }, { weight: 16.0, reps: 12 }] }, { exId: "fly", sets: [{ weight: 5.5, reps: 13 }, { weight: 5.5, reps: 11 }, { weight: 5.5, reps: 10 }] }, { exId: "arnold", sets: [{ weight: 9.0, reps: 9 }, { weight: 9.0, reps: 9 }, { weight: 9.0, reps: 9 }] }, { exId: "lateral", sets: [{ weight: 5.5, reps: 7 }, { weight: 4.5, reps: 11 }, { weight: 4.5, reps: 9 }] }, { exId: "skullcrusher", sets: [{ weight: 6.5, reps: 11 }] }, { exId: "calfraise", sets: [{ weight: 18.0, reps: 20 }, { weight: 20.5, reps: 19 }] }, { exId: "bicycle", sets: [{ weight: 0, reps: 30 }, { weight: 0, reps: 32 }] }] },
    { id: "hist-w3-isolation", date: "2026-05-28", location: "home", exercises: [{ exId: "fly", sets: [{ weight: 5.5, reps: 12 }, { weight: 5.5, reps: 7 }, { weight: 4.5, reps: 14 }] }, { exId: "lateral", sets: [{ weight: 5.5, reps: 8 }, { weight: 5.5, reps: 10 }, { weight: 4.5, reps: 8 }] }, { exId: "calfraise", sets: [{ weight: 18.0, reps: 15 }, { weight: 18.0, reps: 15 }, { weight: 20.5, reps: 15 }, { weight: 20.5, reps: 14 }] }, { exId: "bicycle", sets: [{ weight: 0, reps: 30 }, { weight: 0, reps: 31 }, { weight: 0, reps: 33 }] }] },
    { id: "hist-w3-work-gym", date: "2026-05-24", location: "gym", exercises: [{ exId: "floorpress", sets: [{ weight: 14.0, reps: 10 }, { weight: 14.0, reps: 9 }, { weight: 14.0, reps: 9 }] }, { exId: "onearmrow", sets: [{ weight: 14.0, reps: 10 }, { weight: 14.0, reps: 9 }, { weight: 14.0, reps: 9 }] }, { exId: "rdl", sets: [{ weight: 18.0, reps: 8 }, { weight: 18.0, reps: 8 }, { weight: 16.0, reps: 12 }] }, { exId: "seatedpress", sets: [{ weight: 10.0, reps: 9 }, { weight: 10.0, reps: 8 }, { weight: 8.0, reps: 10 }] }] },
    { id: "hist-w3-isolation-2", date: "2026-05-28", location: "home", exercises: [{ exId: "fly", sets: [{ weight: 5.5, reps: 12 }, { weight: 5.5, reps: 11 }, { weight: 5.5, reps: 14 }] }, { exId: "lateral", sets: [{ weight: 5.5, reps: 10 }, { weight: 5.5, reps: 8 }, { weight: 4.5, reps: 9 }] }, { exId: "curl", sets: [{ weight: 8.0, reps: 10 }, { weight: 9.0, reps: 8 }, { weight: 9.0, reps: 8 }] }, { exId: "ohtesingle", sets: [{ weight: 8.0, reps: 15 }, { weight: 9.0, reps: 13 }, { weight: 9.0, reps: 13 }] }, { exId: "calfraise", sets: [{ weight: 20.5, reps: 15 }, { weight: 22.5, reps: 15 }] }, { exId: "bicycle", sets: [{ weight: 0, reps: 33 }, { weight: 0, reps: 27 }] }] },
    { id: "hist-w4-nursery", date: "2026-05-30", location: "outdoor", exercises: [{ exId: "widepullupassist", sets: [{ weight: 0, reps: 13 }, { weight: 0, reps: 12 }, { weight: 0, reps: 10 }] }, { exId: "bwsquat", sets: [{ weight: 0, reps: 11 }, { weight: 0, reps: 11 }, { weight: 0, reps: 10 }] }] },
    { id: "hist-w4-nursery-2", date: "2026-05-31", location: "outdoor", exercises: [{ exId: "widepullupassist", sets: [{ weight: 0, reps: 13 }, { weight: 0, reps: 9 }] }, { exId: "pullup", sets: [{ weight: 0, reps: 10 }, { weight: 0, reps: 8 }] }, { exId: "chinup", sets: [{ weight: 0, reps: 9 }, { weight: 0, reps: 10 }] }] },
    { id: "hist-w4-home-1", date: "2026-06-01", location: "home", exercises: [{ exId: "rdl", sets: [{ weight: 18.0, reps: 9 }, { weight: 18.0, reps: 10 }, { weight: 18.0, reps: 8 }, { weight: 18.0, reps: 11 }] }, { exId: "inclinepushup", sets: [{ weight: 0, reps: 8 }, { weight: 0, reps: 8 }, { weight: 0, reps: 7 }, { weight: 0, reps: 6 }] }, { exId: "fly", sets: [{ weight: 5.5, reps: 12 }, { weight: 4.5, reps: 9 }, { weight: 4.5, reps: 8 }] }, { exId: "lateral", sets: [{ weight: 5.5, reps: 8 }, { weight: 4.5, reps: 11 }, { weight: 4.5, reps: 10 }] }] },
    { id: "hist-w4-home-1b", date: "2026-06-01", location: "home", exercises: [{ exId: "skullcrusher", sets: [{ weight: 13.5, reps: 11 }, { weight: 16.0, reps: 9 }, { weight: 16.0, reps: 8 }] }, { exId: "glutebridge", sets: [{ weight: 13.5, reps: 9 }, { weight: 13.5, reps: 8 }, { weight: 13.5, reps: 7 }] }] },
    { id: "hist-w4-home-2", date: "2026-06-03", location: "home", exercises: [{ exId: "onearmrow", sets: [{ weight: 13.5, reps: 8 }, { weight: 13.5, reps: 8 }, { weight: 13.5, reps: 9 }] }, { exId: "calfraise", sets: [{ weight: 24.0, reps: 15 }, { weight: 24.0, reps: 13 }, { weight: 24.0, reps: 13 }, { weight: 24.0, reps: 14 }] }, { exId: "curl", sets: [{ weight: 9.0, reps: 8 }, { weight: 9.0, reps: 8 }] }, { exId: "fly", sets: [{ weight: 4.5, reps: 12 }, { weight: 4.5, reps: 10 }, { weight: 4.5, reps: 8 }] }, { exId: "lateral", sets: [{ weight: 4.5, reps: 8 }, { weight: 4.5, reps: 8 }, { weight: 4.5, reps: 7 }] }, { exId: "bicycle", sets: [{ weight: 0, reps: 25 }, { weight: 0, reps: 25 }] }, { exId: "plank", sets: [{ weight: 0, reps: 80 }, { weight: 0, reps: 59 }] }, { exId: "bwsquat", sets: [{ weight: 0, reps: 15 }, { weight: 0, reps: 8 }] }, { exId: "reverselunge", sets: [{ weight: 0, reps: 12 }, { weight: 0, reps: 8 }] }] },
    { id: "hist-w4-isolation", date: "2026-06-04", location: "home", exercises: [{ exId: "calfraise", sets: [{ weight: 24.0, reps: 15 }, { weight: 24.0, reps: 14 }] }, { exId: "bicycle", sets: [{ weight: 0, reps: 30 }] }] },
    { id: "hist-w4-home-3", date: "2026-06-02", location: "home", exercises: [{ exId: "reverselunge", sets: [{ weight: 0, reps: 12 }, { weight: 0, reps: 13 }, { weight: 0, reps: 14 }] }, { exId: "gobletsquat", sets: [{ weight: 16.0, reps: 8 }, { weight: 16.0, reps: 8 }] }, { exId: "onearmrow", sets: [{ weight: 13.5, reps: 9 }, { weight: 13.5, reps: 8 }] }, { exId: "rdl", sets: [{ weight: 16.0, reps: 11 }, { weight: 18.0, reps: 8 }, { weight: 18.0, reps: 7 }] }] },
    { id: "hist-w4-isolation-2", date: "2026-06-05", location: "home", exercises: [{ exId: "calfraise", sets: [{ weight: 22.5, reps: 15 }, { weight: 22.5, reps: 15 }] }, { exId: "ohtesingle", sets: [{ weight: 10.0, reps: 14 }] }] },
    { id: "hist-w5-isolation", date: "2026-06-12", location: "home", exercises: [{ exId: "lateral", sets: [{ weight: 5.5, reps: 12 }, { weight: 5.5, reps: 12 }, { weight: 5.5, reps: 12 }] }, { exId: "fly", sets: [{ weight: 5.5, reps: 10 }, { weight: 5.5, reps: 8 }, { weight: 4.5, reps: 10 }] }, { exId: "ohtesingle", sets: [{ weight: 11.5, reps: 15 }, { weight: 13.5, reps: 14 }, { weight: 13.5, reps: 12 }] }, { exId: "calfraise", sets: [{ weight: 22.5, reps: 15 }, { weight: 24.0, reps: 14 }, { weight: 24.0, reps: 14 }] }, { exId: "bicycle", sets: [{ weight: 0, reps: 30 }, { weight: 0, reps: 35 }] }] },
    { id: "hist-w5-home-1", date: "2026-06-08", location: "home", exercises: [{ exId: "rdl", sets: [{ weight: 16.0, reps: 12 }, { weight: 18.0, reps: 9 }, { weight: 18.0, reps: 8 }] }, { exId: "reverselunge", sets: [{ weight: 0, reps: 12 }, { weight: 0, reps: 13 }] }, { exId: "arnold", sets: [{ weight: 9.0, reps: 8 }, { weight: 9.0, reps: 8 }, { weight: 9.0, reps: 8 }] }, { exId: "gobletsquat", sets: [{ weight: 13.5, reps: 8 }, { weight: 11.5, reps: 8 }] }, { exId: "plank", sets: [{ weight: 0, reps: 60 }, { weight: 0, reps: 55 }] }] },
    { id: "hist-w5-isolation-2", date: "2026-06-09", location: "home", exercises: [{ exId: "calfraise", sets: [{ weight: 24.0, reps: 14 }] }, { exId: "fly", sets: [{ weight: 5.5, reps: 14 }] }, { exId: "lateral", sets: [{ weight: 5.5, reps: 14 }] }] },
    { id: "hist-w5-nursery", date: "2026-06-06", location: "outdoor", exercises: [{ exId: "chinup", sets: [{ weight: 0, reps: 10 }] }, { exId: "widepullupassist", sets: [{ weight: 0, reps: 10 }, { weight: 0, reps: 9 }, { weight: 0, reps: 9 }, { weight: 0, reps: 10 }] }, { exId: "widepullupassist", sets: [{ weight: 0, reps: 13 }] }] },
    { id: "hist-w5-nursery-2", date: "2026-06-07", location: "outdoor", exercises: [{ exId: "pullup", sets: [{ weight: 0, reps: 12 }, { weight: 0, reps: 10 }] }, { exId: "bwsquat", sets: [{ weight: 0, reps: 11 }, { weight: 0, reps: 9 }] }, { exId: "widepullupassist", sets: [{ weight: 0, reps: 12 }, { weight: 0, reps: 10 }, { weight: 0, reps: 11 }] }, { exId: "reverselunge", sets: [{ weight: 0, reps: 12 }, { weight: 0, reps: 10 }] }] },
    { id: "hist-w5-home-2", date: "2026-06-11", location: "home", exercises: [{ exId: "floorpress", sets: [{ weight: 16.0, reps: 13 }, { weight: 18.0, reps: 10 }, { weight: 18.0, reps: 10 }, { weight: 16.0, reps: 13 }] }, { exId: "rdl", sets: [{ weight: 16.0, reps: 13 }, { weight: 18.0, reps: 9 }, { weight: 18.0, reps: 8 }, { weight: 16.0, reps: 10 }] }, { exId: "ohp", sets: [{ weight: 10.0, reps: 8 }, { weight: 9.0, reps: 9 }, { weight: 9.0, reps: 10 }] }, { exId: "frontsquat", sets: [{ weight: 10.0, reps: 8 }, { weight: 9.0, reps: 6 }, { weight: 9.0, reps: 6 }] }, { exId: "pullover", sets: [{ weight: 11.5, reps: 9 }, { weight: 10.0, reps: 14 }, { weight: 10.0, reps: 11 }] }, { exId: "skullcrusher", sets: [{ weight: 16.0, reps: 12 }, { weight: 18.0, reps: 8 }] }, { exId: "curlalt", sets: [{ weight: 10.0, reps: 8 }, { weight: 9.0, reps: 10 }] }, { exId: "bicycle", sets: [{ weight: 0, reps: 25 }, { weight: 0, reps: 25 }] }] },
    { id: "hist-w5-isolation-3", date: "2026-06-10", location: "home", exercises: [{ exId: "fly", sets: [{ weight: 5.5, reps: 12 }, { weight: 5.5, reps: 11 }] }, { exId: "calfraise", sets: [{ weight: 24.0, reps: 17 }, { weight: 24.0, reps: 16 }] }] },
  ];
}

function seedState() {
  return {"version": 1, "sessions": [{"id": "hist-hotel-gym-1", "date": "2026-05-04", "location": "gym", "exercises": [{"exId": "floorpress", "sets": [{"weight": 12, "reps": 8}, {"weight": 12, "reps": 8}, {"weight": 14, "reps": 10}]}, {"exId": "onearmrow", "sets": [{"weight": 12, "reps": 5}, {"weight": 12, "reps": 5}]}, {"exId": "gobletsquat", "sets": [{"weight": 10, "reps": 8}, {"weight": 12, "reps": 8}, {"weight": 10, "reps": 6}]}, {"exId": "seatedpress", "sets": [{"weight": 14, "reps": 4}, {"weight": 12, "reps": 5}, {"weight": 10, "reps": 6}]}, {"exId": "latpulldown", "sets": [{"weight": 35, "reps": 12}, {"weight": 40, "reps": 5}, {"weight": 35, "reps": 7}]}, {"exId": "tripushdown", "sets": [{"weight": 12.5, "reps": 13}, {"weight": 15, "reps": 5}, {"weight": 12.5, "reps": 5}]}]}, {"id": "hist-hotel-gym-2", "date": "2026-05-06", "location": "gym", "exercises": [{"exId": "floorpress", "sets": [{"weight": 16, "reps": 9}, {"weight": 14, "reps": 9}, {"weight": 14, "reps": 6}]}, {"exId": "onearmrow", "sets": [{"weight": 12, "reps": 10}, {"weight": 12, "reps": 7}, {"weight": 10, "reps": 9}]}, {"exId": "legext", "sets": [{"weight": 35, "reps": 10}, {"weight": 30, "reps": 8}, {"weight": 30, "reps": 7}]}, {"exId": "legpress", "sets": [{"weight": 40, "reps": 10}, {"weight": 50, "reps": 8}]}, {"exId": "gobletsquat", "sets": [{"weight": 14, "reps": 10}, {"weight": 16, "reps": 7}, {"weight": 14, "reps": 9}]}, {"exId": "latpulldown", "sets": [{"weight": 35, "reps": 12}, {"weight": 40, "reps": 8}, {"weight": 40, "reps": 5}]}, {"exId": "seatedpress", "sets": [{"weight": 10, "reps": 8}, {"weight": 10, "reps": 6}, {"weight": 8, "reps": 10}]}, {"exId": "hangingknee", "sets": [{"weight": 0, "reps": 5}, {"weight": 0, "reps": 4}]}]}, {"id": "hist-hotel-gym-3", "date": "2026-05-08", "location": "gym", "exercises": [{"exId": "floorpress", "sets": [{"weight": 18, "reps": 5}, {"weight": 16, "reps": 8}, {"weight": 14, "reps": 10}]}, {"exId": "onearmrow", "sets": [{"weight": 14, "reps": 6}, {"weight": 12, "reps": 10}, {"weight": 12, "reps": 9}]}, {"exId": "rdl", "sets": [{"weight": 20, "reps": 8}, {"weight": 18, "reps": 10}, {"weight": 18, "reps": 6}]}, {"exId": "latpulldown", "sets": [{"weight": 45, "reps": 6}, {"weight": 40, "reps": 9}, {"weight": 35, "reps": 11}]}, {"exId": "gobletsquat", "sets": [{"weight": 14, "reps": 8}, {"weight": 14, "reps": 5}]}, {"exId": "seatedpress", "sets": [{"weight": 10, "reps": 8}, {"weight": 10, "reps": 7}, {"weight": 10, "reps": 8}]}, {"exId": "tripushdown", "sets": [{"weight": 15, "reps": 11}, {"weight": 15, "reps": 9}, {"weight": 15, "reps": 3}]}, {"exId": "hangingknee", "sets": [{"weight": 0, "reps": 3}]}]}, {"id": "hist-w1-nursery", "date": "2026-05-09", "location": "outdoor", "exercises": [{"exId": "chinup", "sets": [{"weight": 0, "reps": 12}, {"weight": 0, "reps": 10}, {"weight": 0, "reps": 9}, {"weight": 0, "reps": 8}]}, {"exId": "widepullupassist", "sets": [{"weight": 0, "reps": 11}, {"weight": 0, "reps": 8}, {"weight": 0, "reps": 8}]}]}, {"id": "hist-w1-home-1", "date": "2026-05-11", "location": "home", "exercises": [{"exId": "floorpress", "sets": [{"weight": 13.5, "reps": 12}, {"weight": 13.5, "reps": 10}, {"weight": 16, "reps": 10}]}, {"exId": "gobletsquat", "sets": [{"weight": 13.5, "reps": 8}, {"weight": 13.5, "reps": 8}, {"weight": 16, "reps": 6}]}, {"exId": "rdl", "sets": [{"weight": 13.5, "reps": 8}, {"weight": 13.5, "reps": 10}, {"weight": 16, "reps": 7}]}, {"exId": "arnold", "sets": [{"weight": 8, "reps": 10}, {"weight": 9, "reps": 8}, {"weight": 9, "reps": 6}]}, {"exId": "fly", "sets": [{"weight": 5.5, "reps": 12}, {"weight": 5.5, "reps": 10}, {"weight": 4.5, "reps": 15}]}, {"exId": "plank", "sets": [{"weight": 0, "reps": 60}, {"weight": 0, "reps": 70}]}, {"exId": "skullcrusher", "sets": [{"weight": 4.5, "reps": 12}, {"weight": 6.5, "reps": 9}, {"weight": 6.5, "reps": 8}]}, {"exId": "lateral", "sets": [{"weight": 4.5, "reps": 12}, {"weight": 5.5, "reps": 10}, {"weight": 4.5, "reps": 13}]}]}, {"id": "hist-w1-home-2", "date": "2026-05-12", "location": "home", "exercises": [{"exId": "floorpress", "sets": [{"weight": 16, "reps": 8}, {"weight": 16, "reps": 9}, {"weight": 16, "reps": 10}]}, {"exId": "gobletsquat", "sets": [{"weight": 16, "reps": 8}, {"weight": 16, "reps": 5}, {"weight": 13.5, "reps": 7}]}, {"exId": "arnold", "sets": [{"weight": 9, "reps": 8}, {"weight": 9, "reps": 7}, {"weight": 9, "reps": 6}]}, {"exId": "plank", "sets": [{"weight": 0, "reps": 90}, {"weight": 0, "reps": 65}]}, {"exId": "lateral", "sets": [{"weight": 5.5, "reps": 9}, {"weight": 5.5, "reps": 6}, {"weight": 5.5, "reps": 11}]}, {"exId": "fly", "sets": [{"weight": 5.5, "reps": 8}, {"weight": 5.5, "reps": 12}, {"weight": 5.5, "reps": 4}]}, {"exId": "glutebridge", "sets": [{"weight": 13.5, "reps": 8}, {"weight": 13.5, "reps": 8}]}]}, {"id": "hist-w1-nursery-2", "date": "2026-05-13", "location": "outdoor", "exercises": [{"exId": "pullup", "sets": [{"weight": 0, "reps": 13}, {"weight": 0, "reps": 9}]}, {"exId": "widepullup", "sets": [{"weight": 0, "reps": 12}, {"weight": 0, "reps": 8}]}, {"exId": "chinup", "sets": [{"weight": 0, "reps": 10}, {"weight": 0, "reps": 12}]}, {"exId": "inclinepushup", "sets": [{"weight": 0, "reps": 10}, {"weight": 0, "reps": 8}, {"weight": 0, "reps": 6}]}]}, {"id": "hist-w1-home-3", "date": "2026-05-14", "location": "home", "exercises": [{"exId": "onearmrow", "sets": [{"weight": 13.5, "reps": 8}, {"weight": 13.5, "reps": 10}, {"weight": 13.5, "reps": 7}]}, {"exId": "rdl", "sets": [{"weight": 16, "reps": 8}, {"weight": 16, "reps": 12}, {"weight": 18, "reps": 7}]}, {"exId": "fly", "sets": [{"weight": 5.5, "reps": 13}, {"weight": 5.5, "reps": 12}, {"weight": 5.5, "reps": 9}]}, {"exId": "glutebridge", "sets": [{"weight": 13.5, "reps": 8}, {"weight": 13.5, "reps": 9}]}, {"exId": "calfraise", "sets": [{"weight": 13.5, "reps": 15}]}, {"exId": "plank", "sets": [{"weight": 0, "reps": 100}, {"weight": 0, "reps": 90}]}]}, {"id": "hist-w1-home-4", "date": "2026-05-15", "location": "home", "exercises": [{"exId": "gobletsquat", "sets": [{"weight": 16, "reps": 5}, {"weight": 13.5, "reps": 8}, {"weight": 13.5, "reps": 6}]}, {"exId": "onearmrow", "sets": [{"weight": 13.5, "reps": 8}, {"weight": 13.5, "reps": 8}, {"weight": 13.5, "reps": 4}]}, {"exId": "reverselunge", "sets": [{"weight": 9, "reps": 12}, {"weight": 0, "reps": 10}]}, {"exId": "lateral", "sets": [{"weight": 5.5, "reps": 10}, {"weight": 5.5, "reps": 9}, {"weight": 4.5, "reps": 15}]}, {"exId": "glutebridge", "sets": [{"weight": 13.5, "reps": 9}, {"weight": 13.5, "reps": 8}]}, {"exId": "curl", "sets": [{"weight": 10, "reps": 7}, {"weight": 8, "reps": 7}]}, {"exId": "calfraise", "sets": [{"weight": 13.5, "reps": 15}, {"weight": 16, "reps": 15}]}, {"exId": "skullcrusher", "sets": [{"weight": 6.5, "reps": 12}]}, {"exId": "bicycle", "sets": [{"weight": 0, "reps": 27}, {"weight": 0, "reps": 20}]}, {"exId": "fly", "sets": [{"weight": 4.5, "reps": 13}, {"weight": 4.5, "reps": 12}]}, {"exId": "plank", "sets": [{"weight": 0, "reps": 70}, {"weight": 0, "reps": 120}]}]}, {"id": "hist-w2-am-push", "date": "2026-05-18", "location": "home", "exercises": [{"exId": "floorpress", "sets": [{"weight": 16, "reps": 12}, {"weight": 18, "reps": 12}, {"weight": 18, "reps": 8}, {"weight": 18, "reps": 9}]}, {"exId": "calfraise", "sets": [{"weight": 18, "reps": 15}, {"weight": 18, "reps": 15}]}, {"exId": "plank", "sets": [{"weight": 0, "reps": 110}, {"weight": 0, "reps": 61}]}, {"exId": "gobletsquat", "sets": [{"weight": 13.5, "reps": 8}, {"weight": 13.5, "reps": 9}, {"weight": 13.5, "reps": 7}, {"weight": 11.5, "reps": 11}]}, {"exId": "reverselunge", "sets": [{"weight": 0, "reps": 12}, {"weight": 0, "reps": 8}, {"weight": 0, "reps": 10}]}, {"exId": "bicycle", "sets": [{"weight": 0, "reps": 27}, {"weight": 0, "reps": 35}]}, {"exId": "arnold", "sets": [{"weight": 9, "reps": 10}, {"weight": 9, "reps": 9}, {"weight": 9, "reps": 7}]}, {"exId": "lateral", "sets": [{"weight": 5.5, "reps": 9}, {"weight": 4.5, "reps": 10}, {"weight": 4.5, "reps": 9}]}, {"exId": "fly", "sets": [{"weight": 5.5, "reps": 7}, {"weight": 4.5, "reps": 9}]}, {"exId": "skullcrusher", "sets": [{"weight": 5.5, "reps": 9}, {"weight": 4.5, "reps": 14}]}]}, {"id": "hist-w2-pm-pull", "date": "2026-05-18", "location": "home", "exercises": [{"exId": "onearmrow", "sets": [{"weight": 13.5, "reps": 9}, {"weight": 13.5, "reps": 8}, {"weight": 13.5, "reps": 9}, {"weight": 13.5, "reps": 12}]}, {"exId": "rdl", "sets": [{"weight": 16, "reps": 9}, {"weight": 16, "reps": 11}, {"weight": 18, "reps": 8}, {"weight": 18, "reps": 8}]}, {"exId": "glutebridge", "sets": [{"weight": 13.5, "reps": 8}, {"weight": 13.5, "reps": 10}]}, {"exId": "curl", "sets": [{"weight": 9, "reps": 8}, {"weight": 8, "reps": 8}, {"weight": 7, "reps": 8}]}, {"exId": "pullover", "sets": [{"weight": 9, "reps": 13}, {"weight": 10, "reps": 11}]}]}, {"id": "hist-w3-nursery", "date": "2026-05-23", "location": "outdoor", "exercises": [{"exId": "inclinepushup", "sets": [{"weight": 0, "reps": 8}]}, {"exId": "pullup", "sets": [{"weight": 0, "reps": 9}]}, {"exId": "chinup", "sets": [{"weight": 0, "reps": 13}]}]}, {"id": "hist-w3-home-1", "date": "2026-05-25", "location": "home", "exercises": [{"exId": "gobletsquat", "sets": [{"weight": 16, "reps": 5}, {"weight": 13.5, "reps": 8}, {"weight": 13.5, "reps": 6}]}, {"exId": "onearmrow", "sets": [{"weight": 13.5, "reps": 8}, {"weight": 13.5, "reps": 8}, {"weight": 13.5, "reps": 4}]}, {"exId": "reverselunge", "sets": [{"weight": 9, "reps": 12}, {"weight": 0, "reps": 10}]}, {"exId": "lateral", "sets": [{"weight": 5.5, "reps": 10}, {"weight": 5.5, "reps": 9}, {"weight": 4.5, "reps": 15}]}, {"exId": "glutebridge", "sets": [{"weight": 13.5, "reps": 9}, {"weight": 13.5, "reps": 8}]}, {"exId": "curl", "sets": [{"weight": 10, "reps": 7}, {"weight": 8, "reps": 7}]}, {"exId": "calfraise", "sets": [{"weight": 13.5, "reps": 15}, {"weight": 16, "reps": 15}]}, {"exId": "skullcrusher", "sets": [{"weight": 6.5, "reps": 12}]}, {"exId": "bicycle", "sets": [{"weight": 0, "reps": 27}, {"weight": 0, "reps": 20}]}, {"exId": "fly", "sets": [{"weight": 4.5, "reps": 13}, {"weight": 4.5, "reps": 12}]}, {"exId": "plank", "sets": [{"weight": 0, "reps": 70}, {"weight": 0, "reps": 120}]}]}, {"id": "hist-w3-home-2", "date": "2026-05-27", "location": "home", "exercises": [{"exId": "floorpress", "sets": [{"weight": 16, "reps": 12}, {"weight": 18, "reps": 12}, {"weight": 18, "reps": 8}, {"weight": 18, "reps": 9}]}, {"exId": "calfraise", "sets": [{"weight": 18, "reps": 15}, {"weight": 18, "reps": 15}]}, {"exId": "plank", "sets": [{"weight": 0, "reps": 110}, {"weight": 0, "reps": 61}]}, {"exId": "gobletsquat", "sets": [{"weight": 13.5, "reps": 8}, {"weight": 13.5, "reps": 9}, {"weight": 13.5, "reps": 7}, {"weight": 11.5, "reps": 11}]}, {"exId": "reverselunge", "sets": [{"weight": 0, "reps": 12}, {"weight": 0, "reps": 8}, {"weight": 0, "reps": 10}]}, {"exId": "bicycle", "sets": [{"weight": 0, "reps": 27}, {"weight": 0, "reps": 35}]}, {"exId": "arnold", "sets": [{"weight": 9, "reps": 10}, {"weight": 9, "reps": 9}, {"weight": 9, "reps": 7}]}, {"exId": "lateral", "sets": [{"weight": 5.5, "reps": 9}, {"weight": 4.5, "reps": 10}, {"weight": 4.5, "reps": 9}]}, {"exId": "fly", "sets": [{"weight": 5.5, "reps": 7}, {"weight": 4.5, "reps": 9}]}, {"exId": "skullcrusher", "sets": [{"weight": 5.5, "reps": 9}, {"weight": 4.5, "reps": 14}]}]}, {"id": "hist-w3-home-3", "date": "2026-05-29", "location": "home", "exercises": [{"exId": "onearmrow", "sets": [{"weight": 13.5, "reps": 9}, {"weight": 13.5, "reps": 8}, {"weight": 13.5, "reps": 9}, {"weight": 13.5, "reps": 12}]}, {"exId": "rdl", "sets": [{"weight": 16, "reps": 9}, {"weight": 16, "reps": 11}, {"weight": 18, "reps": 8}, {"weight": 18, "reps": 8}]}, {"exId": "glutebridge", "sets": [{"weight": 13.5, "reps": 8}, {"weight": 13.5, "reps": 10}]}, {"exId": "curl", "sets": [{"weight": 9, "reps": 8}, {"weight": 8, "reps": 8}, {"weight": 7, "reps": 8}]}, {"exId": "pullover", "sets": [{"weight": 9, "reps": 13}, {"weight": 10, "reps": 11}]}]}, {"id": "hist-w3-home-4", "date": "2026-05-26", "location": "home", "exercises": [{"exId": "floorpress", "sets": [{"weight": 18, "reps": 9}, {"weight": 18, "reps": 8}, {"weight": 16, "reps": 12}]}, {"exId": "fly", "sets": [{"weight": 5.5, "reps": 13}, {"weight": 5.5, "reps": 11}, {"weight": 5.5, "reps": 10}]}, {"exId": "arnold", "sets": [{"weight": 9, "reps": 9}, {"weight": 9, "reps": 9}, {"weight": 9, "reps": 9}]}, {"exId": "lateral", "sets": [{"weight": 5.5, "reps": 7}, {"weight": 4.5, "reps": 11}, {"weight": 4.5, "reps": 9}]}, {"exId": "skullcrusher", "sets": [{"weight": 6.5, "reps": 11}]}, {"exId": "calfraise", "sets": [{"weight": 18, "reps": 20}, {"weight": 20.5, "reps": 19}]}, {"exId": "bicycle", "sets": [{"weight": 0, "reps": 30}, {"weight": 0, "reps": 32}]}]}, {"id": "hist-w3-isolation", "date": "2026-05-28", "location": "home", "exercises": [{"exId": "fly", "sets": [{"weight": 5.5, "reps": 12}, {"weight": 5.5, "reps": 7}, {"weight": 4.5, "reps": 14}]}, {"exId": "lateral", "sets": [{"weight": 5.5, "reps": 8}, {"weight": 5.5, "reps": 10}, {"weight": 4.5, "reps": 8}]}, {"exId": "calfraise", "sets": [{"weight": 18, "reps": 15}, {"weight": 18, "reps": 15}, {"weight": 20.5, "reps": 15}, {"weight": 20.5, "reps": 14}]}, {"exId": "bicycle", "sets": [{"weight": 0, "reps": 30}, {"weight": 0, "reps": 31}, {"weight": 0, "reps": 33}]}]}, {"id": "hist-w3-work-gym", "date": "2026-05-24", "location": "gym", "exercises": [{"exId": "floorpress", "sets": [{"weight": 14, "reps": 10}, {"weight": 14, "reps": 9}, {"weight": 14, "reps": 9}]}, {"exId": "onearmrow", "sets": [{"weight": 14, "reps": 10}, {"weight": 14, "reps": 9}, {"weight": 14, "reps": 9}]}, {"exId": "rdl", "sets": [{"weight": 18, "reps": 8}, {"weight": 18, "reps": 8}, {"weight": 16, "reps": 12}]}, {"exId": "seatedpress", "sets": [{"weight": 10, "reps": 9}, {"weight": 10, "reps": 8}, {"weight": 8, "reps": 10}]}]}, {"id": "hist-w3-isolation-2", "date": "2026-05-28", "location": "home", "exercises": [{"exId": "fly", "sets": [{"weight": 5.5, "reps": 12}, {"weight": 5.5, "reps": 11}, {"weight": 5.5, "reps": 14}]}, {"exId": "lateral", "sets": [{"weight": 5.5, "reps": 10}, {"weight": 5.5, "reps": 8}, {"weight": 4.5, "reps": 9}]}, {"exId": "curl", "sets": [{"weight": 8, "reps": 10}, {"weight": 9, "reps": 8}, {"weight": 9, "reps": 8}]}, {"exId": "ohtesingle", "sets": [{"weight": 8, "reps": 15}, {"weight": 9, "reps": 13}, {"weight": 9, "reps": 13}]}, {"exId": "calfraise", "sets": [{"weight": 20.5, "reps": 15}, {"weight": 22.5, "reps": 15}]}, {"exId": "bicycle", "sets": [{"weight": 0, "reps": 33}, {"weight": 0, "reps": 27}]}]}, {"id": "hist-w4-nursery", "date": "2026-05-30", "location": "outdoor", "exercises": [{"exId": "widepullupassist", "sets": [{"weight": 0, "reps": 13}, {"weight": 0, "reps": 12}, {"weight": 0, "reps": 10}]}, {"exId": "bwsquat", "sets": [{"weight": 0, "reps": 11}, {"weight": 0, "reps": 11}, {"weight": 0, "reps": 10}]}]}, {"id": "hist-w4-nursery-2", "date": "2026-05-31", "location": "outdoor", "exercises": [{"exId": "widepullupassist", "sets": [{"weight": 0, "reps": 13}, {"weight": 0, "reps": 9}]}, {"exId": "pullup", "sets": [{"weight": 0, "reps": 10}, {"weight": 0, "reps": 8}]}, {"exId": "chinup", "sets": [{"weight": 0, "reps": 9}, {"weight": 0, "reps": 10}]}]}, {"id": "hist-w4-home-1", "date": "2026-06-01", "location": "home", "exercises": [{"exId": "rdl", "sets": [{"weight": 18, "reps": 9}, {"weight": 18, "reps": 10}, {"weight": 18, "reps": 8}, {"weight": 18, "reps": 11}]}, {"exId": "inclinepushup", "sets": [{"weight": 0, "reps": 8}, {"weight": 0, "reps": 8}, {"weight": 0, "reps": 7}, {"weight": 0, "reps": 6}]}, {"exId": "fly", "sets": [{"weight": 5.5, "reps": 12}, {"weight": 4.5, "reps": 9}, {"weight": 4.5, "reps": 8}]}, {"exId": "lateral", "sets": [{"weight": 5.5, "reps": 8}, {"weight": 4.5, "reps": 11}, {"weight": 4.5, "reps": 10}]}]}, {"id": "hist-w4-home-1b", "date": "2026-06-01", "location": "home", "exercises": [{"exId": "skullcrusher", "sets": [{"weight": 13.5, "reps": 11}, {"weight": 16, "reps": 9}, {"weight": 16, "reps": 8}]}, {"exId": "glutebridge", "sets": [{"weight": 13.5, "reps": 9}, {"weight": 13.5, "reps": 8}, {"weight": 13.5, "reps": 7}]}]}, {"id": "hist-w4-home-2", "date": "2026-06-03", "location": "home", "exercises": [{"exId": "onearmrow", "sets": [{"weight": 13.5, "reps": 8}, {"weight": 13.5, "reps": 8}, {"weight": 13.5, "reps": 9}]}, {"exId": "calfraise", "sets": [{"weight": 24, "reps": 15}, {"weight": 24, "reps": 13}, {"weight": 24, "reps": 13}, {"weight": 24, "reps": 14}]}, {"exId": "curl", "sets": [{"weight": 9, "reps": 8}, {"weight": 9, "reps": 8}]}, {"exId": "fly", "sets": [{"weight": 4.5, "reps": 12}, {"weight": 4.5, "reps": 10}, {"weight": 4.5, "reps": 8}]}, {"exId": "lateral", "sets": [{"weight": 4.5, "reps": 8}, {"weight": 4.5, "reps": 8}, {"weight": 4.5, "reps": 7}]}, {"exId": "bicycle", "sets": [{"weight": 0, "reps": 25}, {"weight": 0, "reps": 25}]}, {"exId": "plank", "sets": [{"weight": 0, "reps": 80}, {"weight": 0, "reps": 59}]}, {"exId": "bwsquat", "sets": [{"weight": 0, "reps": 15}, {"weight": 0, "reps": 8}]}, {"exId": "reverselunge", "sets": [{"weight": 0, "reps": 12}, {"weight": 0, "reps": 8}]}]}, {"id": "hist-w4-isolation", "date": "2026-06-04", "location": "home", "exercises": [{"exId": "calfraise", "sets": [{"weight": 24, "reps": 15}, {"weight": 24, "reps": 14}]}, {"exId": "bicycle", "sets": [{"weight": 0, "reps": 30}]}]}, {"id": "hist-w4-home-3", "date": "2026-06-02", "location": "home", "exercises": [{"exId": "reverselunge", "sets": [{"weight": 0, "reps": 12}, {"weight": 0, "reps": 13}, {"weight": 0, "reps": 14}]}, {"exId": "gobletsquat", "sets": [{"weight": 16, "reps": 8}, {"weight": 16, "reps": 8}]}, {"exId": "onearmrow", "sets": [{"weight": 13.5, "reps": 9}, {"weight": 13.5, "reps": 8}]}, {"exId": "rdl", "sets": [{"weight": 16, "reps": 11}, {"weight": 18, "reps": 8}, {"weight": 18, "reps": 7}]}]}, {"id": "hist-w4-isolation-2", "date": "2026-06-05", "location": "home", "exercises": [{"exId": "calfraise", "sets": [{"weight": 22.5, "reps": 15}, {"weight": 22.5, "reps": 15}]}, {"exId": "ohtesingle", "sets": [{"weight": 10, "reps": 14}]}]}, {"id": "hist-w5-isolation", "date": "2026-06-12", "location": "home", "exercises": [{"exId": "lateral", "sets": [{"weight": 5.5, "reps": 12}, {"weight": 5.5, "reps": 12}, {"weight": 5.5, "reps": 12}]}, {"exId": "fly", "sets": [{"weight": 5.5, "reps": 10}, {"weight": 5.5, "reps": 8}, {"weight": 4.5, "reps": 10}]}, {"exId": "ohtesingle", "sets": [{"weight": 11.5, "reps": 15}, {"weight": 13.5, "reps": 14}, {"weight": 13.5, "reps": 12}]}, {"exId": "calfraise", "sets": [{"weight": 22.5, "reps": 15}, {"weight": 24, "reps": 14}, {"weight": 24, "reps": 14}]}, {"exId": "bicycle", "sets": [{"weight": 0, "reps": 30}, {"weight": 0, "reps": 35}]}]}, {"id": "hist-w5-home-1", "date": "2026-06-08", "location": "home", "exercises": [{"exId": "rdl", "sets": [{"weight": 16, "reps": 12}, {"weight": 18, "reps": 9}, {"weight": 18, "reps": 8}]}, {"exId": "reverselunge", "sets": [{"weight": 0, "reps": 12}, {"weight": 0, "reps": 13}]}, {"exId": "arnold", "sets": [{"weight": 9, "reps": 8}, {"weight": 9, "reps": 8}, {"weight": 9, "reps": 8}]}, {"exId": "gobletsquat", "sets": [{"weight": 13.5, "reps": 8}, {"weight": 11.5, "reps": 8}]}, {"exId": "plank", "sets": [{"weight": 0, "reps": 60}, {"weight": 0, "reps": 55}]}]}, {"id": "hist-w5-isolation-2", "date": "2026-06-09", "location": "home", "exercises": [{"exId": "calfraise", "sets": [{"weight": 24, "reps": 14}]}, {"exId": "fly", "sets": [{"weight": 5.5, "reps": 14}]}, {"exId": "lateral", "sets": [{"weight": 5.5, "reps": 14}]}]}, {"id": "hist-w5-nursery", "date": "2026-06-06", "location": "outdoor", "exercises": [{"exId": "chinup", "sets": [{"weight": 0, "reps": 10}]}, {"exId": "widepullupassist", "sets": [{"weight": 0, "reps": 10}, {"weight": 0, "reps": 9}, {"weight": 0, "reps": 9}, {"weight": 0, "reps": 10}]}, {"exId": "widepullupassist", "sets": [{"weight": 0, "reps": 13}]}]}, {"id": "hist-w5-nursery-2", "date": "2026-06-07", "location": "outdoor", "exercises": [{"exId": "pullup", "sets": [{"weight": 0, "reps": 12}, {"weight": 0, "reps": 10}]}, {"exId": "bwsquat", "sets": [{"weight": 0, "reps": 11}, {"weight": 0, "reps": 9}]}, {"exId": "widepullupassist", "sets": [{"weight": 0, "reps": 12}, {"weight": 0, "reps": 10}, {"weight": 0, "reps": 11}]}, {"exId": "reverselunge", "sets": [{"weight": 0, "reps": 12}, {"weight": 0, "reps": 10}]}]}, {"id": "hist-w5-home-2", "date": "2026-06-11", "location": "home", "exercises": [{"exId": "floorpress", "sets": [{"weight": 16, "reps": 13}, {"weight": 18, "reps": 10}, {"weight": 18, "reps": 10}, {"weight": 16, "reps": 13}]}, {"exId": "rdl", "sets": [{"weight": 16, "reps": 13}, {"weight": 18, "reps": 9}, {"weight": 18, "reps": 8}, {"weight": 16, "reps": 10}]}, {"exId": "ohp", "sets": [{"weight": 10, "reps": 8}, {"weight": 9, "reps": 9}, {"weight": 9, "reps": 10}]}, {"exId": "frontsquat", "sets": [{"weight": 10, "reps": 8}, {"weight": 9, "reps": 6}, {"weight": 9, "reps": 6}]}, {"exId": "pullover", "sets": [{"weight": 11.5, "reps": 9}, {"weight": 10, "reps": 14}, {"weight": 10, "reps": 11}]}, {"exId": "skullcrusher", "sets": [{"weight": 16, "reps": 12}, {"weight": 18, "reps": 8}]}, {"exId": "curlalt", "sets": [{"weight": 10, "reps": 8}, {"weight": 9, "reps": 10}]}, {"exId": "bicycle", "sets": [{"weight": 0, "reps": 25}, {"weight": 0, "reps": 25}]}]}, {"id": "hist-w5-isolation-3", "date": "2026-06-10", "location": "home", "exercises": [{"exId": "fly", "sets": [{"weight": 5.5, "reps": 12}, {"weight": 5.5, "reps": 11}]}, {"exId": "calfraise", "sets": [{"weight": 24, "reps": 17}, {"weight": 24, "reps": 16}]}]}, {"id": "seed-sat", "date": "2026-06-13", "location": "home", "exercises": [{"exId": "rdl", "sets": [{"weight": 13.5, "reps": 15}, {"weight": 16, "reps": 10}, {"weight": 16, "reps": 9}]}, {"exId": "sofapress", "sets": [{"weight": 0, "reps": 9}, {"weight": 0, "reps": 10}, {"weight": 0, "reps": 11}, {"weight": 0, "reps": 8}]}, {"exId": "bentrow", "sets": [{"weight": 10, "reps": 10}, {"weight": 10, "reps": 8}, {"weight": 9, "reps": 8}]}, {"exId": "curl", "sets": [{"weight": 9, "reps": 9}, {"weight": 8, "reps": 7}, {"weight": 6.5, "reps": 8}]}, {"exId": "lateral", "sets": [{"weight": 4.5, "reps": 11}, {"weight": 4.5, "reps": 7}, {"weight": 4.5, "reps": 9}]}, {"exId": "fly", "sets": [{"weight": 4.5, "reps": 9}, {"weight": 4.5, "reps": 11}, {"weight": 4.5, "reps": 6}]}, {"exId": "bwsquat", "sets": [{"weight": 0, "reps": 10}, {"weight": 0, "reps": 9}, {"weight": 0, "reps": 8}]}, {"exId": "ohte", "sets": [{"weight": 16, "reps": 11}, {"weight": 16, "reps": 9}, {"weight": 16, "reps": 8}]}]}, {"id": "live-mon-0615", "date": "2026-06-15", "location": "home", "exercises": [{"exId": "rdl", "sets": [{"weight": 16, "reps": 9}, {"weight": 16, "reps": 9}, {"weight": 16, "reps": 9}, {"weight": 16, "reps": 9}]}, {"exId": "bwsquat", "sets": [{"weight": 0, "reps": 10}, {"weight": 0, "reps": 10}, {"weight": 0, "reps": 10}, {"weight": 0, "reps": 10}]}, {"exId": "lateral", "sets": [{"weight": 5.5, "reps": 9}, {"weight": 5.5, "reps": 9}, {"weight": 5.5, "reps": 9}]}, {"exId": "fly", "sets": [{"weight": 5.5, "reps": 9}, {"weight": 5.5, "reps": 9}, {"weight": 5.5, "reps": 9}]}, {"exId": "sofapress", "sets": [{"weight": 0, "reps": 9}, {"weight": 0, "reps": 9}, {"weight": 0, "reps": 9}, {"weight": 0, "reps": 9}]}, {"exId": "bicycle", "sets": [{"weight": 0, "reps": 30}, {"weight": 0, "reps": 30}, {"weight": 0, "reps": 30}]}]}, {"id": "live-thu-0618", "date": "2026-06-18", "location": "outdoor", "exercises": [{"exId": "widepullup", "sets": [{"weight": 4, "reps": 9}, {"weight": 4, "reps": 9}, {"weight": 4, "reps": 9}, {"weight": 4, "reps": 9}]}, {"exId": "pullup", "sets": [{"weight": 4, "reps": 9}, {"weight": 4, "reps": 9}]}, {"exId": "inclinepushup", "sets": [{"weight": 4, "reps": 9}, {"weight": 4, "reps": 9}]}]}, {"date": "2026-06-19", "location": "home", "intensity": null, "exercises": [{"exId": "calfraise", "sets": [{"weight": 24, "reps": 19}, {"weight": 24, "reps": 16}, {"weight": 24, "reps": 16}, {"weight": 24, "reps": 12}]}, {"exId": "bicycle", "sets": [{"weight": 0, "reps": 25}, {"weight": 0, "reps": 30}, {"weight": 0, "reps": 38}]}, {"exId": "lateral", "sets": [{"weight": 5.5, "reps": 12}, {"weight": 6.5, "reps": 8}]}, {"exId": "fly", "sets": [{"weight": 5.5, "reps": 13}, {"weight": 5.5, "reps": 10}]}], "id": "s-1781897134943"}, {"date": "2026-06-20", "location": "home", "intensity": null, "exercises": [{"exId": "rdl", "sets": [{"weight": 13.5, "reps": 11}, {"weight": 13.5, "reps": 11}, {"weight": 13.5, "reps": 9}, {"weight": 13.5, "reps": 12}]}, {"exId": "glutebridge", "sets": [{"weight": 13.5, "reps": 8}, {"weight": 13.5, "reps": 11}, {"weight": 13.5, "reps": 9}, {"weight": 13.5, "reps": 8}]}, {"exId": "pullover", "sets": [{"weight": 13.5, "reps": 9}, {"weight": 13.5, "reps": 7}, {"weight": 11.5, "reps": 9}]}], "id": "s-1781981930734"}, {"date": "2026-06-22", "location": "outdoor", "intensity": null, "exercises": [{"exId": "widepullupassist", "sets": [{"weight": 4, "reps": 12}, {"weight": 4, "reps": 11}, {"weight": 4, "reps": 10}]}, {"exId": "pullup", "sets": [{"weight": 4, "reps": 10}, {"weight": 4, "reps": 9}]}, {"exId": "inclinepushup", "sets": [{"weight": 4, "reps": 8}, {"weight": 4, "reps": 7}, {"weight": 4, "reps": 6}]}], "id": "s-1782109277389"}, {"date": "2026-06-24", "location": "home", "intensity": null, "exercises": [{"exId": "plank", "sets": [{"weight": 0, "reps": 60}, {"weight": 0, "reps": 50}, {"weight": 0, "reps": 61}]}, {"exId": "sumosquat", "sets": [{"weight": 0, "reps": 10}, {"weight": 0, "reps": 11}, {"weight": 0, "reps": 12}]}, {"exId": "uprightrow", "sets": [{"weight": 6.5, "reps": 10}, {"weight": 6.5, "reps": 11}, {"weight": 6.5, "reps": 8}]}, {"exId": "fly", "sets": [{"weight": 6.5, "reps": 10}, {"weight": 6.5, "reps": 6}, {"weight": 6.5, "reps": 8}]}, {"exId": "bicycle", "sets": [{"weight": 0, "reps": 32}, {"weight": 0, "reps": 34}]}, {"exId": "curl", "sets": [{"weight": 6.5, "reps": 13}, {"weight": 6.5, "reps": 9}]}], "id": "s-1782335591984"}, {"date": "2026-06-25", "location": "home", "intensity": null, "exercises": [{"exId": "calfraise", "sets": [{"weight": 24, "reps": 17}, {"weight": 24, "reps": 18}, {"weight": 24, "reps": 14}, {"weight": 24, "reps": 12}]}, {"exId": "floorpress", "sets": [{"weight": 16, "reps": 12}, {"weight": 16, "reps": 9}]}, {"exId": "pullover", "sets": [{"weight": 9, "reps": 15}, {"weight": 10, "reps": 9}, {"weight": 9, "reps": 9}]}, {"exId": "ohte", "sets": [{"weight": 16, "reps": 12}, {"weight": 16, "reps": 10}, {"weight": 16, "reps": 8}, {"weight": 13.5, "reps": 8}]}, {"exId": "narrowfloorpress", "sets": [{"weight": 16, "reps": 5}, {"weight": 13.5, "reps": 7}]}], "id": "s-1782420419086"}, {"date": "2026-06-26", "location": "home", "intensity": null, "exercises": [{"exId": "lateral", "sets": [{"weight": 5.5, "reps": 9}, {"weight": 5.5, "reps": 8}, {"weight": 4.5, "reps": 11}, {"weight": 4.5, "reps": 11}]}, {"exId": "fly", "sets": [{"weight": 4.5, "reps": 10}, {"weight": 4.5, "reps": 9}, {"weight": 4.5, "reps": 8}]}, {"exId": "curl", "sets": [{"weight": 5.5, "reps": 10}, {"weight": 5.5, "reps": 9}, {"weight": 4.5, "reps": 15}, {"weight": 5.5, "reps": 9}]}, {"exId": "uprightrow", "sets": [{"weight": 4.5, "reps": 15}, {"weight": 5.5, "reps": 14}, {"weight": 5.5, "reps": 10}]}, {"exId": "sumosquat", "sets": [{"weight": 0, "reps": 9}, {"weight": 0, "reps": 10}, {"weight": 0, "reps": 6}]}, {"exId": "plank", "sets": [{"weight": 0, "reps": 75}, {"weight": 0, "reps": 40}, {"weight": 0, "reps": 30}]}], "id": "s-1782502428671"}, {"date": "2026-06-28", "location": "home", "intensity": null, "exercises": [{"exId": "sofapress", "sets": [{"weight": 0, "reps": 12}, {"weight": 0, "reps": 14}, {"weight": 0, "reps": 11}]}, {"exId": "reverselunge", "sets": [{"weight": 0, "reps": 13}, {"weight": 0, "reps": 15}]}, {"exId": "sumosquat", "sets": [{"weight": 0, "reps": 13}, {"weight": 0, "reps": 9}]}, {"exId": "arnold", "sets": [{"weight": 8, "reps": 12}, {"weight": 8, "reps": 13}, {"weight": 8, "reps": 10}]}, {"exId": "uprightrow", "sets": [{"weight": 6.5, "reps": 12}, {"weight": 6.5, "reps": 14}, {"weight": 6.5, "reps": 11}, {"weight": 6.5, "reps": 15}]}, {"exId": "plank", "sets": [{"weight": 0, "reps": 45}, {"weight": 0, "reps": 60}, {"weight": 0, "reps": 42}]}, {"exId": "bicycle", "sets": [{"weight": 0, "reps": 40}, {"weight": 0, "reps": 22}, {"weight": 0, "reps": 23}]}], "id": "s-1782678099215"}], "pbs": {"floorpress": {"maxW": 18, "byW": {"12": 8, "14": 10, "16": 13, "18": 12, "13.5": 12}}, "onearmrow": {"maxW": 14, "byW": {"10": 9, "12": 10, "14": 10, "13.5": 12}}, "gobletsquat": {"maxW": 16, "byW": {"10": 8, "12": 8, "14": 10, "16": 8, "13.5": 9, "11.5": 11}}, "seatedpress": {"maxW": 14, "byW": {"8": 10, "10": 9, "12": 5, "14": 4}}, "latpulldown": {"maxW": 45, "byW": {"35": 12, "40": 9, "45": 6}}, "tripushdown": {"maxW": 15, "byW": {"15": 11, "12.5": 13}}, "legext": {"maxW": 35, "byW": {"30": 8, "35": 10}}, "legpress": {"maxW": 50, "byW": {"40": 10, "50": 8}}, "hangingknee": {"maxW": 0, "byW": {"0": 5}}, "rdl": {"maxW": 20, "byW": {"16": 13, "18": 11, "20": 8, "13.5": 15}}, "chinup": {"maxW": 0, "byW": {"0": 13}}, "widepullupassist": {"maxW": 4, "byW": {"0": 13, "4": 12}}, "arnold": {"maxW": 10, "byW": {"8": 13, "9": 10, "10": 11}}, "fly": {"maxW": 6.5, "byW": {"5.5": 14, "4.5": 15, "6.5": 10}}, "plank": {"maxW": 0, "byW": {"0": 120}}, "skullcrusher": {"maxW": 18, "byW": {"16": 12, "18": 8, "4.5": 14, "6.5": 12, "5.5": 9, "13.5": 11}}, "lateral": {"maxW": 6.5, "byW": {"4.5": 15, "5.5": 14, "6.5": 8}}, "glutebridge": {"maxW": 13.5, "byW": {"13.5": 11}}, "pullup": {"maxW": 4, "byW": {"0": 13, "4": 10}}, "widepullup": {"maxW": 8, "byW": {"0": 12, "4": 9, "8": 13}}, "inclinepushup": {"maxW": 4, "byW": {"0": 10, "4": 9}}, "calfraise": {"maxW": 24, "byW": {"16": 15, "18": 20, "24": 19, "13.5": 15, "20.5": 19, "22.5": 15}}, "reverselunge": {"maxW": 9, "byW": {"0": 15, "9": 12}}, "curl": {"maxW": 10, "byW": {"7": 8, "8": 10, "9": 9, "10": 7, "6.5": 13, "5.5": 10, "4.5": 15}}, "bicycle": {"maxW": 0, "byW": {"0": 40}}, "pullover": {"maxW": 13.5, "byW": {"9": 15, "10": 14, "11.5": 9, "13.5": 9}}, "ohtesingle": {"maxW": 13.5, "byW": {"8": 15, "9": 13, "10": 14, "11.5": 15, "13.5": 14}}, "bwsquat": {"maxW": 0, "byW": {"0": 15}}, "ohp": {"maxW": 10, "byW": {"9": 10, "10": 8}}, "frontsquat": {"maxW": 10, "byW": {"9": 6, "10": 8}}, "curlalt": {"maxW": 10, "byW": {"9": 10, "10": 8}}, "sofapress": {"maxW": 0, "byW": {"0": 14}}, "bentrow": {"maxW": 10, "byW": {"9": 8, "10": 10}}, "ohte": {"maxW": 16, "byW": {"16": 12, "13.5": 8}}, "sumosquat": {"maxW": 0, "byW": {"0": 13}}, "uprightrow": {"maxW": 6.5, "byW": {"6.5": 15, "4.5": 15, "5.5": 14}}, "narrowfloorpress": {"maxW": 16, "byW": {"16": 5, "13.5": 7}}}, "working": {"floorpress": 16, "narrowfloorpress": 16, "sofapress": 0, "narrowpressup": 0, "inclinepushup": 0, "rdl": 13.5, "gobletsquat": 16, "frontsquat": 10, "frontsquatalt": 9, "sumosquat": 0, "bwsquat": 0, "reverselunge": 0, "onearmrow": 13.5, "bentrow": 10, "renegaderow": 10, "ohp": 10, "arnold": 8, "seatedpress": 10, "lateral": 5.5, "fly": 4.5, "wraise": 5.5, "frontraise": 5.5, "uprightrow": 6.5, "curl": 5.5, "curlalt": 9, "skullcrusher": 18, "ohte": 16, "ohtesingle": 13.5, "pullover": 10, "glutebridge": 13.5, "calfraise": 24, "bicycle": 0, "plank": 0, "russiantwist": 0, "hangingknee": 0, "latpulldown": 40, "legpress": 50, "legext": 35, "tripushdown": 15, "pullup": 0, "widepullup": 0, "widepullupassist": 0, "chinup": 0}, "lastReps": {"floorpress": 9, "narrowfloorpress": 7, "sofapress": 11, "narrowpressup": 12, "inclinepushup": 6, "rdl": 12, "gobletsquat": 10, "frontsquat": 10, "frontsquatalt": 10, "sumosquat": 9, "bwsquat": 12, "reverselunge": 15, "onearmrow": 10, "bentrow": 10, "renegaderow": 10, "ohp": 10, "arnold": 10, "seatedpress": 10, "lateral": 11, "fly": 8, "wraise": 10, "frontraise": 10, "uprightrow": 15, "curl": 9, "curlalt": 10, "skullcrusher": 10, "ohte": 8, "ohtesingle": 10, "pullover": 9, "glutebridge": 8, "calfraise": 12, "bicycle": 23, "plank": 42, "russiantwist": 12, "hangingknee": 12, "latpulldown": 10, "legpress": 10, "legext": 10, "tripushdown": 10, "pullup": 9, "widepullup": 12, "widepullupassist": 10, "chinup": 12}, "deloadAnchor": "2026-06-13", "deloadWeeks": [], "lastLocation": "home", "historyMerged": true};
}

const STORE_KEY = "loadout-state-v3";
async function loadStored() {
  try { const r = localStorage.getItem(STORE_KEY); return r ? JSON.parse(r) : null; }
  catch { return null; }
}
async function saveStored(state) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); return true; }
  catch { return false; }
}

/* ============================================================
   Small UI atoms
   ============================================================ */
function Stepper({ value, onChange, step = 1, min = 0, width = 56 }) {
  const dec = step < 1 ? 1 : 0;
  const round = (v) => Math.round(v / step) * step;
  return (
    <div className="flex items-center" style={{ gap: 4 }}>
      <button
        onClick={() => onChange(Math.max(min, Number((round(value) - step).toFixed(dec))))}
        className="flex items-center justify-center rounded-md font-bold"
        style={{ width: 34, height: 34, background: C.surface3, color: C.text, fontSize: 18, lineHeight: 1 }}
        aria-label="decrease"
      >–</button>
      <input
        type="number" inputMode="decimal" value={value}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        className="text-center rounded-md font-mono"
        style={{ width, height: 34, background: C.surface, color: C.text, border: `1px solid ${C.border}`, fontSize: 15 }}
      />
      <button
        onClick={() => onChange(Number((round(value) + step).toFixed(dec)))}
        className="flex items-center justify-center rounded-md font-bold"
        style={{ width: 34, height: 34, background: C.surface3, color: C.text, fontSize: 18, lineHeight: 1 }}
        aria-label="increase"
      >+</button>
    </div>
  );
}

function MuscleBar({ name, val, mev, target, planned = 0, compact = false, flag = false, onClick }) {
  const t = tierOf(val, mev, target);
  const col = tierColor(t);
  const cap = Math.max(target, val, 1);
  const fillPct = Math.min(100, (val / cap) * 100);
  const mevPct = target > 0 ? Math.min(100, (mev / cap) * 100) : 0;
  const fmt = (n) => (Number.isInteger(n) ? n : n.toFixed(1).replace(/\.0$/, ""));
  return (
    <div className="flex items-center" style={{ gap: 10, padding: compact ? "5px 0" : "7px 0", cursor: onClick ? "pointer" : "default" }} onClick={onClick}>
      <div className="flex items-center" style={{ width: 84, flexShrink: 0, gap: 5 }}>
        {flag && <span title="worked within 24h" style={{ width: 6, height: 6, borderRadius: 99, background: C.amber, flexShrink: 0 }} />}
        <span style={{ color: t === "neutral" ? C.faint : C.text, fontSize: 13 }}>{name}</span>
      </div>
      <div className="relative flex-1 rounded-full overflow-hidden" style={{ height: 8, background: C.surface3 }}>
        <div className="absolute top-0 left-0 h-full rounded-full" style={{ width: `${fillPct}%`, background: col, transition: "width .35s ease" }} />
        {mev > 0 && (
          <div className="absolute top-0" style={{ left: `${mevPct}%`, width: 2, height: 8, background: C.bg, opacity: 0.9 }} />
        )}
      </div>
      <div className="font-mono text-right" style={{ width: 58, flexShrink: 0, fontSize: 12.5, color: t === "neutral" ? C.faint : C.text }}>
        <span style={{ color: col, fontWeight: 600 }}>{fmt(val)}</span>
        <span style={{ color: C.faint }}> /{mev}</span>
        <span style={{ color: C.faint, opacity: 0.6 }}>·{target}</span>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label, glyph }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-center flex-1" style={{ paddingTop: 8, paddingBottom: 8, gap: 3 }}>
      <span style={{ fontSize: 17, lineHeight: 1, opacity: active ? 1 : 0.5, color: active ? C.blue : C.muted }}>{glyph}</span>
      <span style={{ fontSize: 10.5, letterSpacing: 0.3, color: active ? C.text : C.faint, fontWeight: active ? 600 : 500 }}>{label}</span>
    </button>
  );
}

function Pill({ children, color = C.muted, bg = "transparent", border }) {
  return (
    <span className="inline-flex items-center rounded-full font-mono" style={{ fontSize: 10.5, letterSpacing: 0.4, padding: "3px 8px", color, background: bg, border: border ? `1px solid ${border}` : "none", textTransform: "uppercase" }}>{children}</span>
  );
}

/* ============================================================
   Main app
   ============================================================ */
export default function App() {
  const [state, setState] = useState(null);
  const [tab, setTab] = useState("week");
  const [draft, setDraft] = useState(null); // {id?, date, location, intensity, exercises:[{exId,sets:[{weight,reps}]}]}
  const [picker, setPicker] = useState(null); // muscle key or "all" -> opens exercise picker
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [saveState, setSaveState] = useState("idle"); // idle|saving|saved|offline
  const firstLoad = useRef(true);

  // load
  useEffect(() => {
    (async () => {
      const s = await loadStored();
      if (s) { setState(s); }
      else { const seed = seedState(); setState(seed); await saveStored(seed); }
    })();
  }, []);

  // persist
  useEffect(() => {
    if (!state) return;
    if (firstLoad.current) { firstLoad.current = false; return; }
    setSaveState("saving");
    let alive = true;
    saveStored(state).then((ok) => { if (alive) setSaveState(ok ? "saved" : "offline"); });
    return () => { alive = false; };
  }, [state]);

  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 2600); return () => clearTimeout(t); } }, [toast]);

  const week = useMemo(() => (state ? startOfWeekISO(todayISO()) : null), [state]);
  const isDeloadWeek = state ? state.deloadWeeks.includes(week) : false;
  const factor = isDeloadWeek ? 0.5 : 1;
  // A deload closes the block: counting restarts the week after the most recent completed deload week.
  const blockAnchor = useMemo(() => {
    if (!state) return null;
    const lastDeload = (state.deloadWeeks || []).filter((w) => w < week).sort().pop();
    const afterDeload = lastDeload ? addDaysISO(lastDeload, 7) : null;
    return afterDeload && afterDeload > state.deloadAnchor ? afterDeload : state.deloadAnchor;
  }, [state, week]);
  const blockWeek = state ? weeksBetween(blockAnchor, todayISO()) + 1 : 1;

  const totals = useMemo(() => (state ? weekTotals(state.sessions, week) : {}), [state, week]);

  if (!state) {
    return <div style={{ background: C.bg, color: C.muted, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>Loading…</div>;
  }

  /* ---- draft helpers ---- */
  const newDraft = (loc = state.lastLocation) => ({ date: todayISO(), location: loc, locStrict: false, intensity: null, exercises: [] });
  const ensureDraft = (loc) => { if (!draft) setDraft(newDraft(loc)); };
  const startPlan = () => { setDraft(draft || newDraft()); setTab("plan"); };
  const startLog = () => { setDraft(draft || newDraft()); setTab("log"); };

  const draftTotalsPlanned = () => {
    const t = {};
    if (!draft) return t;
    for (const ex of draft.exercises) {
      const meta = EX_BY_ID[ex.exId];
      for (const [mk, c] of Object.entries(meta.credits)) t[mk] = (t[mk] || 0) + c * ex.sets.length;
    }
    return t;
  };

  // Set an exercise to N sets. Adds it if not present, resizes if it is, removes at 0.
  const setExerciseSets = (exId, count) => {
    const meta = EX_BY_ID[exId];
    const cap = meta.capSets || 99;
    const n = Math.max(0, Math.min(count, cap));
    setDraft((d) => {
      const base = d || newDraft();
      const exists = base.exercises.some((e) => e.exId === exId);
      if (n === 0) return { ...base, exercises: base.exercises.filter((e) => e.exId !== exId) };
      const w = state.working[exId] ?? meta.w, r = state.lastReps[exId] ?? 10;
      if (!exists) {
        return { ...base, exercises: [...base.exercises, { exId, sets: Array.from({ length: n }, () => ({ weight: w, reps: r })) }] };
      }
      return {
        ...base,
        exercises: base.exercises.map((e) => {
          if (e.exId !== exId) return e;
          const cur = e.sets.slice(0, n);
          while (cur.length < n) cur.push({ weight: w, reps: r });
          return { ...e, sets: cur };
        }),
      };
    });
  };

  // Toggle an exercise in/out of the draft (used by the picker). Adds 3 sets, or removes.
  const toggleExerciseInDraft = (exId) => {
    const meta = EX_BY_ID[exId];
    const n = Math.min(3, meta.capSets || 99);
    setDraft((d) => {
      const base = d || newDraft();
      if (base.exercises.some((e) => e.exId === exId)) return { ...base, exercises: base.exercises.filter((e) => e.exId !== exId) };
      const w = state.working[exId] ?? meta.w, r = state.lastReps[exId] ?? 10;
      return { ...base, exercises: [...base.exercises, { exId, sets: Array.from({ length: n }, () => ({ weight: w, reps: r })) }] };
    });
  };

  const runSuggest = () => {
    const exclude = new Set(recentMuscles(state.sessions, draft?.date || todayISO()).keys());
    const trendAvg = trendAverages(state.sessions, state.deloadWeeks, 4);
    const { plan, uncoverable } = suggestPlan(totals, draft?.location || state.lastLocation, exclude, draft?.locStrict, trendAvg);
    if (!plan.length) {
      setToast(uncoverable.length ? "Nothing left to fill at this location." : "Everything's already at MEV for the week.");
      return;
    }
    setDraft((d) => {
      const base = d || newDraft();
      const exs = plan.map((p) => {
        const w = state.working[p.exId] ?? EX_BY_ID[p.exId].w;
        const r = state.lastReps[p.exId] ?? 10;
        return { exId: p.exId, sets: Array.from({ length: p.sets }, () => ({ weight: w, reps: r })) };
      });
      return { ...base, exercises: exs };
    });
    if (uncoverable.length) {
      const names = uncoverable.map((k) => M_BY_KEY[k].name).join(", ");
      setToast(`Drafted. Can't cover here: ${names}.`);
    } else setToast("Session drafted from your gaps.");
  };

  const editSet = (exId, idx, field, val) => {
    setDraft((d) => ({ ...d, exercises: d.exercises.map((e) => e.exId !== exId ? e : { ...e, sets: e.sets.map((s, i) => i === idx ? { ...s, [field]: val } : s) }) }));
  };
  const addSetRow = (exId) => {
    const meta = EX_BY_ID[exId]; const cap = meta.capSets || 99;
    setDraft((d) => d.exercises.map((e) => e.exId).includes(exId) ? {
      ...d, exercises: d.exercises.map((e) => {
        if (e.exId !== exId) return e;
        if (e.sets.length >= cap) return e;
        const last = e.sets[e.sets.length - 1] || { weight: state.working[exId] ?? meta.w, reps: state.lastReps[exId] ?? 10 };
        return { ...e, sets: [...e.sets, { ...last }] };
      }),
    } : d);
  };
  const removeSetRow = (exId, idx) => {
    setDraft((d) => ({
      ...d, exercises: d.exercises.flatMap((e) => {
        if (e.exId !== exId) return [e];
        const sets = e.sets.filter((_, i) => i !== idx);
        return sets.length ? [{ ...e, sets }] : [];
      }),
    }));
  };

  const saveSession = () => {
    if (!draft || !draft.exercises.length) { setToast("Add at least one exercise."); return; }
    // merge PBs + working + lastReps
    let pbs = state.pbs, working = { ...state.working }, lastReps = { ...state.lastReps };
    const pbHits = [];
    for (const ex of draft.exercises) {
      const meta = EX_BY_ID[ex.exId];
      let topReps = 0, topW = -1;
      for (const st of ex.sets) {
        const hit = pbCheck(state.pbs, ex.exId, st.weight, st.reps);
        if (hit) pbHits.push(`${meta.name}: ${hit.label}`);
        pbs = mergePB(pbs, ex.exId, st.weight, st.reps);
        if ((Number(st.weight) || 0) > topW) { topW = Number(st.weight) || 0; }
        if ((Number(st.reps) || 0) > topReps) topReps = Number(st.reps) || 0;
      }
      if (meta.unit === "db" && topW >= 0) working[ex.exId] = topW;
      const lastSet = ex.sets[ex.sets.length - 1];
      if (lastSet) lastReps[ex.exId] = Number(lastSet.reps) || lastReps[ex.exId];
    }
    const id = draft.id || `s-${Date.now()}`;
    const sess = { ...draft, id };
    setState((prev) => {
      const others = prev.sessions.filter((s) => s.id !== id);
      return { ...prev, sessions: [...others, sess], pbs, working, lastReps, lastLocation: draft.location };
    });
    setDraft(null);
    setTab("week");
    setToast(pbHits.length ? `Saved · ${pbHits.length} PB${pbHits.length > 1 ? "s" : ""}! ${pbHits[0]}` : "Session saved.");
  };

  const editSession = (s) => { setDraft(JSON.parse(JSON.stringify(s))); setTab("log"); };
  const deleteSession = (id) => { setState((prev) => ({ ...prev, sessions: prev.sessions.filter((s) => s.id !== id) })); setToast("Session deleted."); };

  const doExport = () => {
    const rows = [["date", "location", "exercise", "set", "weight_kg", "reps"]];
    state.sessions.slice().sort((a, b) => (a.date < b.date ? -1 : 1)).forEach((s) => {
      s.exercises.forEach((ex) => {
        const meta = EX_BY_ID[ex.exId];
        ex.sets.forEach((st, i) => rows.push([s.date, s.location, meta ? meta.name : ex.exId, i + 1, st.weight, st.reps]));
      });
    });
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `training-log-${todayISO()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  /* ---- derived for header / summary ---- */
  const realMuscles = MUSCLES.filter((m) => m.mev > 0);
  const touchedCount = realMuscles.filter((m) => (totals[m.key] || 0) > 0).length;
  const metCount = realMuscles.filter((m) => (totals[m.key] || 0) >= m.mev * factor).length;
  const targetCount = realMuscles.filter((m) => (totals[m.key] || 0) >= m.target * factor).length;
  const reds = realMuscles.filter((m) => (totals[m.key] || 0) < m.mev * factor);

  const fontStack = "ui-sans-serif, system-ui, -apple-system, sans-serif";

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: fontStack }}>
      <div style={{ maxWidth: 480, margin: "0 auto", paddingBottom: 78 }}>

        {/* Header */}
        <div className="sticky top-0 z-20" style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center justify-between" style={{ padding: "12px 16px 10px" }}>
            <div className="flex items-baseline" style={{ gap: 8 }}>
              <span className="font-mono" style={{ fontWeight: 700, letterSpacing: 2, fontSize: 15 }}>LOADOUT</span>
              <span style={{ width: 5, height: 5, borderRadius: 99, background: C.blue, display: "inline-block" }} />
            </div>
            <div className="flex items-center" style={{ gap: 8 }}>
              <span style={{ fontSize: 10, color: saveState === "offline" ? C.amber : C.faint }}>
                {saveState === "saving" ? "saving…" : saveState === "offline" ? "not saved" : saveState === "saved" ? "saved" : ""}
              </span>
              <button onClick={() => setSettingsOpen(true)} style={{ color: C.muted, fontSize: 18 }} aria-label="settings">⚙</button>
            </div>
          </div>
        </div>

        {/* ---------- WEEK ---------- */}
        {tab === "week" && (
          <div style={{ padding: "14px 16px" }}>
            <div className="rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 16, marginBottom: 14 }}>
              <div className="flex items-end justify-between">
                <div>
                  <div style={{ fontSize: 11, letterSpacing: 1.5, color: C.faint, textTransform: "uppercase" }}>Block week</div>
                  <div className="font-mono" style={{ fontSize: 38, lineHeight: 1, fontWeight: 700 }}>{blockWeek}</div>
                  <div style={{ fontSize: 11.5, color: C.muted, marginTop: 4, lineHeight: 1.4 }}>weeks into this training block<br /><span style={{ color: C.faint }}>started {prettyDate(blockAnchor)} · deload due ~wk 6–8</span></div>
                </div>
                <div className="flex flex-col items-end" style={{ gap: 6 }}>
                  {isDeloadWeek && <Pill color={C.blue} bg={C.blueDim} border={C.blue}>deload · half targets</Pill>}
                  {!isDeloadWeek && blockWeek >= 6 && <Pill color={C.amber} bg="transparent" border={C.amber}>deload window</Pill>}
                  <div className="font-mono" style={{ fontSize: 13, color: C.text }}>
                    <span style={{ color: metCount === realMuscles.length ? C.green : C.text, fontWeight: 600 }}>{metCount}</span>
                    <span style={{ color: C.faint }}> / {realMuscles.length} at MEV</span>
                  </div>
                </div>
              </div>
              {reds.length > 0 && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}`, fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
                  <span style={{ color: C.red }}>● </span>Below MEV: {reds.map((m) => m.name).join(", ")}
                </div>
              )}
            </div>

            <div className="rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.border}`, padding: "10px 14px 12px", marginBottom: 14 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 11, letterSpacing: 1.2, color: C.faint, textTransform: "uppercase" }}>Week of {prettyDate(week)}</span>
                <span style={{ fontSize: 10, color: C.faint }}>lit = session logged</span>
              </div>
              <WeekStrip weekStart={week} sessions={state.sessions} />
            </div>

            <div className="flex" style={{ gap: 8, marginBottom: 14 }}>
              <div className="flex-1 rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.border}`, padding: "10px 4px", textAlign: "center" }}>
                <div className="font-mono" style={{ fontSize: 22, fontWeight: 700, color: C.text }}>{touchedCount}<span style={{ fontSize: 13, color: C.faint }}>/{realMuscles.length}</span></div>
                <div style={{ fontSize: 9.5, letterSpacing: 0.5, color: C.faint, textTransform: "uppercase", marginTop: 2 }}>Trained</div>
              </div>
              <div className="flex-1 rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.border}`, padding: "10px 4px", textAlign: "center" }}>
                <div className="font-mono" style={{ fontSize: 22, fontWeight: 700, color: C.green }}>{metCount}<span style={{ fontSize: 13, color: C.faint }}>/{realMuscles.length}</span></div>
                <div style={{ fontSize: 9.5, letterSpacing: 0.5, color: C.faint, textTransform: "uppercase", marginTop: 2 }}>At MEV</div>
              </div>
              <div className="flex-1 rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.border}`, padding: "10px 4px", textAlign: "center" }}>
                <div className="font-mono" style={{ fontSize: 22, fontWeight: 700, color: C.blue }}>{targetCount}<span style={{ fontSize: 13, color: C.faint }}>/{realMuscles.length}</span></div>
                <div style={{ fontSize: 9.5, letterSpacing: 0.5, color: C.faint, textTransform: "uppercase", marginTop: 2 }}>At target</div>
              </div>
            </div>

            <div className="rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.border}`, padding: "10px 14px 12px" }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 11, letterSpacing: 1.2, color: C.faint, textTransform: "uppercase" }}>This week</span>
                <span style={{ fontSize: 10, color: C.faint }}>current / mev · target</span>
              </div>
              {[...MUSCLES]
                .map((m) => ({ m, val: totals[m.key] || 0 }))
                .sort((a, b) => ((a.m.mev === 0) !== (b.m.mev === 0) ? (a.m.mev === 0 ? 1 : -1) : b.val - a.val))
                .map(({ m, val }) => (
                  <MuscleBar key={m.key} name={m.name} val={val} mev={m.mev * factor} target={m.target * factor} />
                ))}
            </div>

            <div className="flex" style={{ gap: 10, marginTop: 14 }}>
              <button onClick={startPlan} className="flex-1 rounded-xl font-semibold" style={{ background: C.blue, color: "#06121E", padding: "13px 0", fontSize: 14.5 }}>Plan a session</button>
              <button onClick={startLog} className="flex-1 rounded-xl font-semibold" style={{ background: C.surface2, color: C.text, border: `1px solid ${C.borderLite}`, padding: "13px 0", fontSize: 14.5 }}>Quick log</button>
            </div>
            {draft && draft.exercises.length > 0 && (
              <div className="rounded-xl" style={{ marginTop: 12, padding: "10px 14px", background: C.surface, border: `1px dashed ${C.borderLite}`, fontSize: 12.5, color: C.muted }}>
                Session in progress · {draft.exercises.length} exercise{draft.exercises.length > 1 ? "s" : ""} ·{" "}
                <button onClick={() => setTab("log")} style={{ color: C.blue }}>resume</button>
              </div>
            )}
          </div>
        )}

        {/* ---------- PLAN ---------- */}
        {tab === "plan" && draft && (
          <PlanView
            draft={draft} totals={totals} factor={factor} state={state}
            planned={draftTotalsPlanned()}
            recent={recentMuscles(state.sessions, draft.date)}
            onLoc={(loc) => setDraft((d) => (loc === d.location ? { ...d, locStrict: !d.locStrict } : { ...d, location: loc, locStrict: false }))}
            onSuggest={runSuggest}
            onOpenPicker={(mk) => setPicker(mk)}
            onSetSets={setExerciseSets}
            onClear={() => setDraft(newDraft(draft.location))}
            onLog={() => setTab("log")}
          />
        )}

        {/* ---------- LOG ---------- */}
        {tab === "log" && draft && (
          <LogView
            draft={draft} state={state}
            recent={recentMuscles(state.sessions, draft.date)}
            onDate={(date) => setDraft((d) => ({ ...d, date }))}
            onLoc={(loc) => setDraft((d) => (loc === d.location ? { ...d, locStrict: !d.locStrict } : { ...d, location: loc, locStrict: false }))}
            onEditSet={editSet} onAddSet={addSetRow} onRemoveSet={removeSetRow}
            onOpenPicker={() => setPicker("all")}
            onRemoveEx={(exId) => setDraft((d) => ({ ...d, exercises: d.exercises.filter((e) => e.exId !== exId) }))}
            onSave={saveSession}
            onClear={() => setDraft(newDraft(draft.location))}
          />
        )}

        {/* ---------- HISTORY ---------- */}
        {tab === "history" && (
          <HistoryView sessions={state.sessions} deloadWeeks={state.deloadWeeks} onEdit={editSession} onDelete={deleteSession} onExport={doExport} />
        )}
      </div>

      {/* Exercise picker */}
      {picker && draft && (
        <ExercisePicker
          muscleKey={picker} location={draft.location} draft={draft}
          recent={recentMuscles(state.sessions, draft.date)}
          onAdd={(exId) => { toggleExerciseInDraft(exId); }}
          onClose={() => setPicker(null)}
        />
      )}

      {/* Settings */}
      {settingsOpen && (
        <SettingsSheet
          state={state} blockWeek={blockWeek} week={week} isDeloadWeek={isDeloadWeek}
          onClose={() => setSettingsOpen(false)}
          onToggleDeload={() => setState((prev) => ({ ...prev, deloadWeeks: isDeloadWeek ? prev.deloadWeeks.filter((w) => w !== week) : [...prev.deloadWeeks, week] }))}
          onNewBlock={() => { setState((prev) => ({ ...prev, deloadAnchor: week })); setToast("New block — back to Week 1."); }}
          onExport={doExport}
          onBackup={() => {
            const blob = new Blob([JSON.stringify(state)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = `loadout-backup-${todayISO()}.json`; a.click();
            URL.revokeObjectURL(url);
            setToast("Backup downloaded.");
          }}
          onRestore={(text) => {
            try {
              const parsed = JSON.parse(text);
              if (!parsed || !Array.isArray(parsed.sessions)) { setToast("That doesn't look like a Loadout backup."); return; }
              setState(parsed); setDraft(null); setSettingsOpen(false); setToast("Backup restored.");
            } catch { setToast("Couldn't read that backup file."); }
          }}
          onReset={() => { const seed = seedState(); setState(seed); setDraft(null); setToast("Reset to defaults."); }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed left-0 right-0 flex justify-center z-50" style={{ bottom: 88 }}>
          <div className="rounded-full" style={{ background: C.surface3, color: C.text, padding: "10px 16px", fontSize: 13, border: `1px solid ${C.borderLite}`, maxWidth: 420, margin: "0 16px", boxShadow: "0 6px 24px rgba(0,0,0,.4)" }}>{toast}</div>
        </div>
      )}

      {/* Bottom tabs */}
      <div className="fixed bottom-0 left-0 right-0 z-30" style={{ background: C.surface, borderTop: `1px solid ${C.border}` }}>
        <div className="flex" style={{ maxWidth: 480, margin: "0 auto" }}>
          <TabButton active={tab === "week"} onClick={() => setTab("week")} label="Week" glyph="▤" />
          <TabButton active={tab === "plan"} onClick={startPlan} label="Plan" glyph="◇" />
          <TabButton active={tab === "log"} onClick={startLog} label="Log" glyph="＋" />
          <TabButton active={tab === "history"} onClick={() => setTab("history")} label="History" glyph="≡" />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PLAN VIEW
   ============================================================ */
function PlanView({ draft, totals, factor, state, planned, recent, onLoc, onSuggest, onOpenPicker, onSetSets, onClear, onLog }) {
  const [mode, setMode] = useState("muscle"); // 'muscle' | 'exercise'
  const [expanded, setExpanded] = useState(null);
  const exFlag = (e) => Object.keys(e.credits).some((mk) => recent.has(mk));
  const collideKeys = [...new Set(draft.exercises.flatMap((ex) => Object.keys(EX_BY_ID[ex.exId].credits)).filter((mk) => recent.has(mk)))];
  const collideNames = collideKeys.map((k) => M_BY_KEY[k].name);
  const lastWorked = collideKeys.map((k) => recent.get(k)).sort().pop();
  const locExercises = exForLoc(draft.location, draft.locStrict);
  const setsOf = (exId) => { const ex = draft.exercises.find((e) => e.exId === exId); return ex ? ex.sets.length : 0; };

  return (
    <div style={{ padding: "14px 16px" }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <LocToggle value={draft.location} onChange={onLoc} strict={draft.locStrict} />
        <button onClick={onSuggest} className="rounded-lg font-semibold" style={{ background: C.surface2, color: C.blue, border: `1px solid ${C.blue}`, padding: "9px 14px", fontSize: 13 }}>✦ Suggest workout</button>
      </div>

      {collideNames.length > 0 && (
        <div className="rounded-xl" style={{ border: `1px solid ${C.amber}`, padding: "10px 12px", marginBottom: 12, fontSize: 12.5, color: C.amber, lineHeight: 1.5 }}>
          ⚠ {collideNames.join(", ")} worked {lastWorked ? prettyDate(lastWorked) : "recently"} (within 24h). If that was heavy, keep these moderate — heavy-after-heavy on the same muscle is the one to avoid.
        </div>
      )}

      {/* Coverage readout */}
      <div className="rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.border}`, padding: "10px 14px 8px", marginBottom: 12 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
          <span style={{ fontSize: 11, letterSpacing: 1.2, color: C.faint, textTransform: "uppercase" }}>Coverage if logged · week total</span>
          {[...recent.keys()].length > 0 && <span style={{ fontSize: 10, color: C.amber }}>● worked &lt;24h</span>}
        </div>
        {MUSCLES.map((m) => (
          <MuscleBar key={m.key} name={m.name} val={(totals[m.key] || 0) + (planned[m.key] || 0)} mev={m.mev * factor} target={m.target * factor} compact flag={recent.has(m.key)} />
        ))}
      </div>

      {/* Build: by muscle or by exercise */}
      <div className="inline-flex rounded-lg" style={{ background: C.surface2, border: `1px solid ${C.border}`, padding: 2, marginBottom: 10, width: "100%" }}>
        {[["muscle", "By muscle"], ["exercise", "By exercise"]].map(([v, label]) => (
          <button key={v} onClick={() => setMode(v)} className="rounded-md font-medium" style={{ flex: 1, padding: "8px 0", fontSize: 13, background: mode === v ? C.surface3 : "transparent", color: mode === v ? C.text : C.faint }}>{label}</button>
        ))}
      </div>

      {mode === "muscle" && (
        <div className="rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.border}`, padding: "6px 14px 8px", marginBottom: 12 }}>
          {MUSCLES.filter((m) => m.mev > 0).map((m) => {
            const cur = (totals[m.key] || 0) + (planned[m.key] || 0);
            const open = expanded === m.key;
            return (
              <div key={m.key} style={{ borderBottom: `1px solid ${C.border}` }}>
                <div onClick={() => setExpanded(open ? null : m.key)} className="flex items-center justify-between" style={{ cursor: "pointer", padding: "10px 0" }}>
                  <div className="flex items-center" style={{ gap: 6 }}>
                    {recent.has(m.key) && <span title="worked within 24h" style={{ width: 6, height: 6, borderRadius: 99, background: C.amber }} />}
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{m.name}</span>
                    <span className="font-mono" style={{ fontSize: 11, color: tierColor(tierOf(cur, m.mev * factor, m.target * factor)) }}>{Number.isInteger(cur) ? cur : cur.toFixed(1)}/{m.mev * factor}</span>
                  </div>
                  <span style={{ color: C.faint, fontSize: 13 }}>{open ? "▾" : "▸"}</span>
                </div>
                {open && (
                  <div className="flex flex-wrap" style={{ gap: 6, padding: "0 0 12px 0" }}>
                    {locExercises.filter((e) => (e.credits[m.key] || 0) > 0)
                      .sort((a, b) => (b.credits[m.key] || 0) - (a.credits[m.key] || 0) || exTotal(b) - exTotal(a))
                      .map((e) => (
                        <AddChip key={e.id} ex={e} inPlan={setsOf(e.id) > 0} muscleKey={m.key} flag={exFlag(e)}
                          onAdd={() => onSetSets(e.id, setsOf(e.id) > 0 ? setsOf(e.id) + 1 : 3)} />
                      ))}
                    {locExercises.filter((e) => (e.credits[m.key] || 0) > 0).length === 0 && (
                      <span style={{ fontSize: 12, color: C.faint, padding: "2px 0" }}>No {draft.locStrict && draft.location === "gym" ? "gym-only" : draft.location} exercise hits this.</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <div style={{ fontSize: 10.5, color: C.faint, paddingTop: 8 }}>Tap a muscle, then tap an exercise to add it. Tap again to add a set.</div>
        </div>
      )}

      {mode === "exercise" && (
        <div className="rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.border}`, padding: "8px 12px 10px", marginBottom: 12 }}>
          {[...locExercises].sort((a, b) => exTotal(b) - exTotal(a)).map((e) => {
            const n = setsOf(e.id);
            return (
              <div key={e.id} className="flex items-center justify-between" style={{ padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ minWidth: 0, paddingRight: 8 }}>
                  <div className="flex items-center" style={{ gap: 6 }}>
                    {exFlag(e) && <span title="hits a muscle worked within 24h" style={{ width: 6, height: 6, borderRadius: 99, background: C.amber, flexShrink: 0 }} />}
                    <span style={{ fontSize: 14, fontWeight: 600, color: n > 0 ? C.green : C.text }}>{e.name}</span>
                    {e.maint && <span title="maintenance only" style={{ fontSize: 12, color: C.amber }}>⚙</span>}
                  </div>
                  <div style={{ marginTop: 2 }}><MuscleTags credits={e.credits} recent={recent} /></div>
                </div>
                <Stepper value={n} onChange={(v) => onSetSets(e.id, v)} step={1} min={0} width={40} />
              </div>
            );
          })}
          <div style={{ fontSize: 10.5, color: C.faint, paddingTop: 8 }}>Each set credits every muscle listed — adding one move can fill several bars.</div>
        </div>
      )}

      {/* In session */}
      {draft.exercises.length > 0 && (
        <>
          <div style={{ fontSize: 11, letterSpacing: 1.2, color: C.faint, textTransform: "uppercase", marginBottom: 8 }}>In this session · {draft.exercises.length}</div>
          {draft.exercises.map((ex) => {
            const meta = EX_BY_ID[ex.exId];
            return (
              <div key={ex.exId} className="rounded-xl flex items-center justify-between" style={{ background: C.surface, border: `1px solid ${C.border}`, padding: "10px 12px", marginBottom: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <div className="flex items-center" style={{ gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{meta.name}</span>
                    {meta.maint && <span title="maintenance only" style={{ fontSize: 12, color: C.amber }}>⚙</span>}
                  </div>
                  <div style={{ marginTop: 2 }}><MuscleTags credits={meta.credits} recent={recent} /></div>
                </div>
                <Stepper value={ex.sets.length} onChange={(v) => onSetSets(ex.exId, v)} step={1} min={0} width={42} />
              </div>
            );
          })}
        </>
      )}
      {draft.exercises.length === 0 && (
        <div className="rounded-xl" style={{ border: `1px dashed ${C.borderLite}`, padding: "16px 14px", textAlign: "center", color: C.muted, fontSize: 13, marginBottom: 14 }}>
          Nothing added yet. Build by muscle or by exercise above, or hit Suggest workout.
        </div>
      )}

      <div className="flex" style={{ gap: 10, marginTop: 6 }}>
        <button onClick={onClear} className="rounded-xl" style={{ background: C.surface2, color: C.muted, border: `1px solid ${C.border}`, padding: "12px 18px", fontSize: 14 }}>Clear</button>
        <button onClick={onLog} disabled={!draft.exercises.length} className="flex-1 rounded-xl font-semibold" style={{ background: draft.exercises.length ? C.green : C.surface2, color: draft.exercises.length ? "#06160E" : C.faint, padding: "12px 0", fontSize: 14.5 }}>Log this session →</button>
      </div>
    </div>
  );
}
function AddChip({ ex, inPlan, muscleKey, onAdd, flag }) {
  const cr = ex.credits[muscleKey];
  return (
    <button onClick={onAdd} className="rounded-lg flex items-center" style={{ gap: 5, padding: "7px 10px", fontSize: 12.5, background: inPlan ? C.greenDim : C.surface2, border: `1px solid ${inPlan ? C.green : flag ? C.amber : C.borderLite}`, color: inPlan ? C.green : C.text }}>
      {flag && !inPlan && <span style={{ width: 5, height: 5, borderRadius: 99, background: C.amber }} />}
      <span>{inPlan ? "✓ " : ""}{ex.name}</span>
      <span className="font-mono" style={{ fontSize: 10.5, color: C.faint }}>{cr}/set</span>
    </button>
  );
}

/* ============================================================
   LOG VIEW
   ============================================================ */
function LogView({ draft, state, recent, onDate, onLoc, onEditSet, onAddSet, onRemoveSet, onOpenPicker, onRemoveEx, onSave, onClear }) {
  const collideKeys = [...new Set(draft.exercises.flatMap((ex) => Object.keys(EX_BY_ID[ex.exId].credits)).filter((mk) => recent.has(mk)))];
  const collideNames = collideKeys.map((k) => M_BY_KEY[k].name);
  const lastWorked = collideKeys.map((k) => recent.get(k)).sort().pop();

  return (
    <div style={{ padding: "14px 16px" }}>
      {/* date + location */}
      <div className="rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.border}`, padding: "10px 12px", marginBottom: 14 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
          <div className="flex items-center" style={{ gap: 8 }}>
            <button onClick={() => onDate(addDaysISO(draft.date, -1))} className="rounded-md" style={{ width: 32, height: 32, background: C.surface3, color: C.text, fontSize: 16 }}>‹</button>
            <div style={{ minWidth: 116, textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{draft.date === todayISO() ? "Today" : prettyDate(draft.date)}</div>
              <div className="font-mono" style={{ fontSize: 10.5, color: C.faint }}>{draft.date}</div>
            </div>
            <button onClick={() => onDate(addDaysISO(draft.date, 1))} className="rounded-md" style={{ width: 32, height: 32, background: C.surface3, color: C.text, fontSize: 16 }}>›</button>
          </div>
          <LocToggle value={draft.location} onChange={onLoc} small strict={draft.locStrict} />
        </div>
      </div>

      {collideNames.length > 0 && (
        <div className="rounded-xl" style={{ border: `1px solid ${C.amber}`, padding: "10px 12px", marginBottom: 14, fontSize: 12.5, color: C.amber, lineHeight: 1.5 }}>
          ⚠ {collideNames.join(", ")} worked {lastWorked ? prettyDate(lastWorked) : "recently"} (within 24h). If that was heavy, don't go heavy again here — moderate-after-moderate is fine.
        </div>
      )}

      {/* exercises */}
      {draft.exercises.length === 0 && (
        <div className="rounded-xl" style={{ border: `1px dashed ${C.borderLite}`, padding: "18px 14px", textAlign: "center", color: C.muted, fontSize: 13, marginBottom: 14 }}>
          No exercises yet. Add what you did below.
        </div>
      )}
      {draft.exercises.map((ex) => {
        const meta = EX_BY_ID[ex.exId];
        const isLoad = meta.unit !== "db";
        const oneSet = ex.sets.length === 1;
        return (
          <div key={ex.exId} className="rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.border}`, padding: "12px 12px 10px", marginBottom: 12 }}>
            <div className="flex items-start justify-between" style={{ marginBottom: 8 }}>
              <div style={{ minWidth: 0 }}>
                <div className="flex items-center" style={{ gap: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{meta.name}</span>
                  {meta.maint && <span title="maintenance only — don't chase load" style={{ fontSize: 12, color: C.amber }}>⚙</span>}
                </div>
                <div style={{ marginTop: 2 }}><MuscleTags credits={meta.credits} recent={recent} /></div>
              </div>
              <button onClick={() => onRemoveEx(ex.exId)} style={{ color: C.faint, fontSize: 16, padding: 4 }} aria-label="remove">🗑</button>
            </div>

            {meta.note && <div style={{ fontSize: 11, color: C.amber, marginBottom: 8, lineHeight: 1.45 }}>{meta.note}</div>}

            {/* set rows */}
            <div className="flex" style={{ fontSize: 10, color: C.faint, letterSpacing: 0.5, padding: "0 2px 4px", textTransform: "uppercase" }}>
              <div style={{ width: 26 }}>set</div>
              <div style={{ flex: 1 }}>{isLoad ? "added load (kg)" : "weight (kg)"}</div>
              <div style={{ flex: 1 }}>reps</div>
              <div style={{ width: 24 }} />
            </div>
            {ex.sets.map((st, i) => {
              const hit = pbCheck(state.pbs, ex.exId, st.weight, st.reps);
              return (
                <div key={i}>
                  <div className="flex items-center" style={{ gap: 6, padding: "3px 0" }}>
                    <div className="font-mono" style={{ width: 26, color: C.faint, fontSize: 13 }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <Stepper value={st.weight} onChange={(v) => onEditSet(ex.exId, i, "weight", v)} step={isLoad ? 1 : 0.5} min={0} width={50} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <Stepper value={st.reps} onChange={(v) => onEditSet(ex.exId, i, "reps", v)} step={1} min={0} width={50} />
                    </div>
                    <button onClick={() => onRemoveSet(ex.exId, i)} style={{ width: 24, color: C.faint, fontSize: 15 }} aria-label="remove set">×</button>
                  </div>
                  {hit && !meta.maint && (
                    <div style={{ fontSize: 11, color: C.green, padding: "0 0 4px 32px" }}>★ PB — {hit.label}{hit.kind === "weighted" ? " (weighted)" : ""}</div>
                  )}
                </div>
              );
            })}
            <button onClick={() => onAddSet(ex.exId)} disabled={meta.capSets && ex.sets.length >= meta.capSets} className="rounded-md" style={{ marginTop: 6, padding: "6px 12px", fontSize: 12.5, background: C.surface2, color: meta.capSets && ex.sets.length >= meta.capSets ? C.faint : C.text, border: `1px solid ${C.border}` }}>
              + set {meta.capSets ? `(max ${meta.capSets})` : ""}
            </button>
            {oneSet && <div style={{ fontSize: 11, color: C.amber, marginTop: 6 }}>1 set — below the 2-set minimum block. Counts, but the dose is marginal.</div>}
          </div>
        );
      })}

      <button onClick={onOpenPicker} className="w-full rounded-xl font-semibold" style={{ background: C.surface2, color: C.text, border: `1px solid ${C.borderLite}`, padding: "12px 0", fontSize: 14, marginBottom: 14 }}>+ Add exercise</button>

      <div className="flex" style={{ gap: 10 }}>
        <button onClick={onClear} className="rounded-xl" style={{ background: C.surface2, color: C.muted, border: `1px solid ${C.border}`, padding: "12px 18px", fontSize: 14 }}>Clear</button>
        <button onClick={onSave} disabled={!draft.exercises.length} className="flex-1 rounded-xl font-bold" style={{ background: draft.exercises.length ? C.blue : C.surface2, color: draft.exercises.length ? "#06121E" : C.faint, padding: "13px 0", fontSize: 15 }}>Save session</button>
      </div>
    </div>
  );
}

/* ============================================================
   HISTORY VIEW
   ============================================================ */
function HistoryView({ sessions, deloadWeeks, onEdit, onDelete, onExport }) {
  const [view, setView] = useState("trends");
  const [open, setOpen] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const sorted = [...sessions].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : (a.id < b.id ? 1 : -1)));
  const realMuscles = MUSCLES.filter((m) => m.mev > 0);

  const byWeek = {};
  for (const s of sessions) { const wk = startOfWeekISO(s.date); (byWeek[wk] = byWeek[wk] || []).push(s); }
  const weeks = Object.keys(byWeek).sort((a, b) => (a < b ? 1 : -1)).map((wk) => {
    const sess = byWeek[wk];
    const t = weekTotals(sess, wk);
    const dl = (deloadWeeks || []).includes(wk);
    const f = dl ? 0.5 : 1;
    const touched = realMuscles.filter((m) => (t[m.key] || 0) > 0).length;
    const met = realMuscles.filter((m) => (t[m.key] || 0) >= m.mev * f).length;
    const atTarget = realMuscles.filter((m) => (t[m.key] || 0) >= m.target * f).length;
    const setCount = sess.reduce((n, s) => n + s.exercises.reduce((k, e) => k + e.sets.length, 0), 0);
    return { wk, sess, t, dl, f, touched, met, atTarget, setCount };
  });

  return (
    <div style={{ padding: "14px 16px" }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 11, letterSpacing: 1.2, color: C.faint, textTransform: "uppercase" }}>History</span>
        <button onClick={onExport} className="rounded-lg" style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}`, padding: "8px 12px", fontSize: 12.5 }}>↓ Export CSV</button>
      </div>

      <div className="inline-flex rounded-lg" style={{ background: C.surface2, border: `1px solid ${C.border}`, padding: 2, marginBottom: 12, width: "100%" }}>
        {[["weeks", "Weeks"], ["sessions", "Sessions"], ["trends", "Trends"]].map(([v, label]) => (
          <button key={v} onClick={() => { setView(v); setOpen(null); }} className="rounded-md font-medium" style={{ flex: 1, padding: "8px 0", fontSize: 13, background: view === v ? C.surface3 : "transparent", color: view === v ? C.text : C.faint }}>{label}</button>
        ))}
      </div>

      {sessions.length === 0 && <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: 24 }}>No sessions logged yet.</div>}

      {/* TRENDS */}
      {view === "trends" && <TrendsView sessions={sessions} deloadWeeks={deloadWeeks} />}

      {/* WEEKS */}
      {view === "weeks" && weeks.map((w) => {
        const isOpen = open === w.wk;
        return (
          <div key={w.wk} className="rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.border}`, marginBottom: 10, overflow: "hidden" }}>
            <div onClick={() => setOpen(isOpen ? null : w.wk)} className="flex items-center justify-between" style={{ padding: "12px 14px", cursor: "pointer" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{prettyDate(w.wk)} – {prettyDate(addDaysISO(w.wk, 6))}</div>
                <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>{w.sess.length} session{w.sess.length > 1 ? "s" : ""} · {w.setCount} sets</div>
              </div>
              <div className="flex items-center" style={{ gap: 8 }}>
                {w.dl && <Pill color={C.blue} bg={C.blueDim} border={C.blue}>deload</Pill>}
                <span className="font-mono" style={{ fontSize: 12.5, color: w.met === realMuscles.length ? C.green : C.text }}>{w.met}<span style={{ color: C.faint }}>/{realMuscles.length}</span></span>
                <span className="font-mono" style={{ fontSize: 12.5, color: C.blue }}>{w.atTarget}<span style={{ color: C.faint }}>/{realMuscles.length}</span></span>
                <span style={{ color: C.faint, fontSize: 13 }}>{isOpen ? "▾" : "▸"}</span>
              </div>
            </div>
            {isOpen && (
              <div style={{ padding: "2px 14px 12px", borderTop: `1px solid ${C.border}` }}>
                <div className="flex" style={{ gap: 8, padding: "10px 0" }}>
                  <div className="flex-1 rounded-lg" style={{ background: C.surface2, border: `1px solid ${C.border}`, padding: "8px 4px", textAlign: "center" }}>
                    <div className="font-mono" style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{w.touched}<span style={{ fontSize: 12, color: C.faint }}>/{realMuscles.length}</span></div>
                    <div style={{ fontSize: 9.5, letterSpacing: 0.5, color: C.faint, textTransform: "uppercase", marginTop: 2 }}>Trained</div>
                  </div>
                  <div className="flex-1 rounded-lg" style={{ background: C.surface2, border: `1px solid ${C.border}`, padding: "8px 4px", textAlign: "center" }}>
                    <div className="font-mono" style={{ fontSize: 18, fontWeight: 700, color: C.green }}>{w.met}<span style={{ fontSize: 12, color: C.faint }}>/{realMuscles.length}</span></div>
                    <div style={{ fontSize: 9.5, letterSpacing: 0.5, color: C.faint, textTransform: "uppercase", marginTop: 2 }}>At MEV</div>
                  </div>
                  <div className="flex-1 rounded-lg" style={{ background: C.surface2, border: `1px solid ${C.border}`, padding: "8px 4px", textAlign: "center" }}>
                    <div className="font-mono" style={{ fontSize: 18, fontWeight: 700, color: C.blue }}>{w.atTarget}<span style={{ fontSize: 12, color: C.faint }}>/{realMuscles.length}</span></div>
                    <div style={{ fontSize: 9.5, letterSpacing: 0.5, color: C.faint, textTransform: "uppercase", marginTop: 2 }}>At target</div>
                  </div>
                </div>
                {MUSCLES.map((m) => (
                  <MuscleBar key={m.key} name={m.name} val={w.t[m.key] || 0} mev={m.mev * w.f} target={m.target * w.f} compact />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* SESSIONS */}
      {view === "sessions" && sorted.map((s) => {
        const setCount = s.exercises.reduce((n, e) => n + e.sets.length, 0);
        return (
          <div key={s.id} className="rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.border}`, marginBottom: 10, overflow: "hidden" }}>
            <div onClick={() => setOpen(open === s.id ? null : s.id)} className="flex items-center justify-between" style={{ padding: "12px 14px", cursor: "pointer" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{prettyDate(s.date)}</div>
                <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>{s.location} · {s.exercises.length} exercises · {setCount} sets</div>
              </div>
              <div className="flex items-center" style={{ gap: 8 }}>
                <span style={{ color: C.faint, fontSize: 13 }}>{open === s.id ? "▾" : "▸"}</span>
              </div>
            </div>
            {open === s.id && (
              <div style={{ padding: "0 14px 12px" }}>
                {s.exercises.map((ex) => {
                  const meta = EX_BY_ID[ex.exId];
                  return (
                    <div key={ex.exId} style={{ padding: "6px 0", borderTop: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{meta ? meta.name : ex.exId}</div>
                      <div className="font-mono" style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                        {ex.sets.map((st, i) => (
                          <span key={i}>{meta && meta.unit !== "db" ? (st.weight > 0 ? `+${st.weight}kg×${st.reps}` : `${st.reps}`) : `${st.weight}×${st.reps}`}{i < ex.sets.length - 1 ? "  ·  " : ""}</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
                <div className="flex" style={{ gap: 8, marginTop: 10 }}>
                  <button onClick={() => onEdit(s)} className="rounded-lg" style={{ background: C.surface2, color: C.blue, border: `1px solid ${C.blue}`, padding: "8px 14px", fontSize: 12.5 }}>Edit</button>
                  {confirmId === s.id ? (
                    <button onClick={() => { onDelete(s.id); setConfirmId(null); setOpen(null); }} className="rounded-lg" style={{ background: C.red, color: "#1A0B0B", padding: "8px 14px", fontSize: 12.5, fontWeight: 600 }}>Confirm delete</button>
                  ) : (
                    <button onClick={() => setConfirmId(s.id)} className="rounded-lg" style={{ background: C.surface2, color: C.red, border: `1px solid ${C.border}`, padding: "8px 14px", fontSize: 12.5 }}>Delete</button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   TRENDS VIEW — small-multiple weekly bars per muscle, worst-first
   ============================================================ */
function TrendsView({ sessions, deloadWeeks }) {
  const [win, setWin] = useState(6);
  const [mode, setMode] = useState("combined"); // 'mev' | 'target' | 'combined'
  const [openKey, setOpenKey] = useState(null);
  const realMuscles = MUSCLES.filter((m) => m.mev > 0);
  const curWeek = startOfWeekISO(todayISO());
  const dls = deloadWeeks || [];
  const BAR_H = 36;

  // Oldest -> newest completed weeks, then the current (partial) week, dimmed and excluded from stats.
  // `pre` holds the two weeks before the window so the 3-week moving average starts fully formed.
  const { cols, pre } = useMemo(() => {
    const mk = (wk, current) => ({ wk, t: weekTotals(sessions, wk), f: dls.includes(wk) ? 0.5 : 1, dl: dls.includes(wk), current });
    const list = [];
    for (let i = win; i >= 1; i--) list.push(mk(addDaysISO(curWeek, -7 * i), false));
    list.push(mk(curWeek, true));
    return { cols: list, pre: [mk(addDaysISO(curWeek, -7 * (win + 2)), false), mk(addDaysISO(curWeek, -7 * (win + 1)), false)] };
  }, [sessions, win, curWeek, deloadWeeks]);

  const rows = useMemo(() => {
    const done = cols.filter((c) => !c.current);
    return realMuscles
      .map((m) => ({
        m,
        mevHits: done.filter((c) => (c.t[m.key] || 0) >= m.mev * c.f).length,
        tgtHits: done.filter((c) => (c.t[m.key] || 0) >= m.target * c.f).length,
      }))
      .sort((a, b) => (mode === "target" ? (a.tgtHits - b.tgtHits) || (a.mevHits - b.mevHits) : (a.mevHits - b.mevHits) || (a.tgtHits - b.tgtHits)));
  }, [cols, mode]);

  const worst = rows.filter((r) => r.mevHits < win).slice(0, 3);
  const fmt = (n) => (Number.isInteger(n) ? n : n.toFixed(1).replace(/\.0$/, ""));
  const wkLabel = (iso) => { const d = parseISO(iso); return `${d.getDate()}/${d.getMonth() + 1}`; };
  const barColor = (val, m, f) => {
    if (mode === "mev") return val >= m.mev * f ? C.green : C.red;
    if (mode === "target") return val >= m.target * f ? C.blue : C.neutral;
    return tierColor(tierOf(val, m.mev * f, m.target * f));
  };

  // 3-week moving average of sets ÷ (deload-adjusted) target, per visible completed week.
  const movingAvg = (m) => {
    const ratio = (c) => Math.min(1, (c.t[m.key] || 0) / (m.target * c.f));
    const all = [...pre, ...cols.filter((c) => !c.current)].map(ratio);
    return all.slice(2).map((_, j) => (all[j] + all[j + 1] + all[j + 2]) / 3);
  };
  // Segment colour by slope: falling -> red, flat -> neutral, rising -> green.
  const slopeColor = (d) => {
    const t = Math.max(-1, Math.min(1, d / 0.2));
    const mid = [138, 151, 166], red = [240, 86, 78], grn = [52, 199, 123];
    const to = t < 0 ? red : grn, k = Math.abs(t);
    const ch = (i) => Math.round(mid[i] + (to[i] - mid[i]) * k);
    return `rgb(${ch(0)},${ch(1)},${ch(2)})`;
  };

  return (
    <>
      <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
        <div className="inline-flex rounded-lg" style={{ background: C.surface2, border: `1px solid ${C.border}`, padding: 2 }}>
          {[["mev", "MEV"], ["target", "Target"], ["combined", "Both"]].map(([v, label]) => (
            <button key={v} onClick={() => setMode(v)} className="rounded-md font-medium" style={{ padding: "6px 10px", fontSize: 12, background: mode === v ? C.surface3 : "transparent", color: mode === v ? C.text : C.faint }}>{label}</button>
          ))}
        </div>
        <div className="inline-flex rounded-lg" style={{ background: C.surface2, border: `1px solid ${C.border}`, padding: 2 }}>
          {[4, 6, 8, 12].map((n) => (
            <button key={n} onClick={() => setWin(n)} className="rounded-md font-medium font-mono" style={{ padding: "6px 8px", fontSize: 12, background: win === n ? C.surface3 : "transparent", color: win === n ? C.text : C.faint }}>{n}w</button>
          ))}
        </div>
      </div>

      {worst.length > 0 ? (
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 10, lineHeight: 1.5 }}>
          <span style={{ color: C.red }}>● </span>Missed MEV most: {worst.map((r) => `${r.m.name} ${win - r.mevHits}/${win}`).join(" · ")}
        </div>
      ) : (
        <div style={{ fontSize: 12, color: C.green, marginBottom: 10 }}>Every muscle hit MEV in the last {win} weeks.</div>
      )}

      <div className="rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.border}`, padding: "10px 14px 8px" }}>
        {/* column labels */}
        <div className="flex items-center" style={{ gap: 8, marginBottom: 2 }}>
          <span style={{ width: 74, flexShrink: 0 }} />
          <div className="flex flex-1" style={{ gap: 3 }}>
            {cols.map((c, i) => (
              <div key={c.wk} style={{ flex: 1, textAlign: "center", fontSize: 8.5, color: c.current ? C.faint : C.muted, minWidth: 0 }}>
                {(win <= 8 || i % 2 === 1 || c.current) ? (c.current ? "now" : wkLabel(c.wk)) : ""}
                {c.dl && <div style={{ width: 4, height: 4, borderRadius: 99, background: C.blue, margin: "1px auto 0" }} />}
              </div>
            ))}
          </div>
          <span style={{ width: 62, flexShrink: 0 }} />
        </div>

        {rows.map(({ m, mevHits, tgtHits }) => {
          const isOpen = openKey === m.key;
          return (
            <div key={m.key} style={{ borderBottom: `1px solid ${C.border}` }}>
              <div onClick={() => setOpenKey(isOpen ? null : m.key)} className="flex items-center" style={{ gap: 8, padding: "7px 0", cursor: "pointer" }}>
                <span style={{ width: 74, flexShrink: 0, fontSize: 12.5, color: mevHits === 0 ? C.red : C.text }}>{m.name}</span>
                <div className="relative flex flex-1" style={{ gap: 3, alignItems: "flex-end", height: BAR_H }}>
                  <div className="absolute" style={{ left: 0, right: 0, bottom: (m.mev / m.target) * BAR_H, height: 1, background: C.borderLite, opacity: 0.7 }} />
                  {cols.map((c) => {
                    const val = c.t[m.key] || 0;
                    const h = val <= 0 ? 2 : Math.max(3, Math.min(1, val / (m.target * c.f)) * BAR_H);
                    return <div key={c.wk} style={{ flex: 1, height: h, background: val <= 0 ? C.surface3 : barColor(val, m, c.f), borderRadius: 2, opacity: c.current ? 0.3 : 0.55 }} />;
                  })}
                  <svg className="absolute" style={{ left: 0, top: 0, width: "100%", height: BAR_H, pointerEvents: "none" }} viewBox={`0 0 100 ${BAR_H}`} preserveAspectRatio="none">
                    {(() => {
                      const ma = movingAvg(m);
                      const y = (r) => Math.max(2, BAR_H - 2 - r * (BAR_H - 4));
                      const x = (j) => ((j + 0.5) / cols.length) * 100;
                      return ma.slice(1).map((v, k) => (
                        <line key={k} x1={x(k)} y1={y(ma[k])} x2={x(k + 1)} y2={y(v)} stroke={slopeColor(v - ma[k])} strokeWidth={2} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                      ));
                    })()}
                  </svg>
                </div>
                <span className="flex flex-col font-mono text-right" style={{ width: 62, flexShrink: 0, fontSize: 10.5, lineHeight: 1.5 }}>
                  <span style={{ color: mevHits === win ? C.green : mevHits <= win / 2 ? C.red : C.text }}>MEV {mevHits}/{win}</span>
                  <span style={{ color: C.blue }}>tgt {tgtHits}/{win}</span>
                </span>
              </div>
              {isOpen && (
                <div style={{ padding: "0 0 10px 82px" }}>
                  {cols.map((c) => {
                    const val = c.t[m.key] || 0;
                    return (
                      <div key={c.wk} className="font-mono" style={{ fontSize: 11, color: C.muted, padding: "1px 0" }}>
                        {prettyDate(c.wk)}{c.dl ? " · deload" : ""}{c.current ? " · this week" : ""} — <span style={{ color: val <= 0 ? C.faint : barColor(val, m, c.f) }}>{fmt(val)}</span>
                        <span style={{ color: C.faint }}> /{fmt(m.mev * c.f)}·{fmt(m.target * c.f)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        <div style={{ fontSize: 10.5, color: C.faint, paddingTop: 8 }}>Worst first · bar height = sets vs target · thin line = MEV · trend line = 3-wk moving avg, <span style={{ color: C.green }}>rising</span>/<span style={{ color: C.red }}>falling</span> · current week dimmed, not counted · tap a row for numbers</div>
      </div>
    </>
  );
}

/* ============================================================
   Exercise picker sheet
   ============================================================ */
function ExercisePicker({ muscleKey, location, draft, recent, onAdd, onClose }) {
  const rset = recent || new Set();
  const list = exForLoc(location, draft.locStrict).filter((e) => muscleKey === "all" ? true : (e.credits[muscleKey] || 0) > 0);
  return (
    <div className="fixed inset-0 z-40 flex items-end" style={{ background: "rgba(0,0,0,.55)" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full rounded-t-2xl" style={{ background: C.surface, borderTop: `1px solid ${C.borderLite}`, maxHeight: "78vh", overflowY: "auto", maxWidth: 480, margin: "0 auto" }}>
        <div className="sticky top-0 flex items-center justify-between" style={{ background: C.surface, padding: "14px 16px 10px", borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{muscleKey === "all" ? "Add exercise" : `Add for ${M_BY_KEY[muscleKey].name}`}</span>
          <button onClick={onClose} style={{ color: C.muted, fontSize: 20 }}>×</button>
        </div>
        <div style={{ padding: "8px 14px 20px" }}>
          {list.map((e) => {
            const inPlan = draft.exercises.find((x) => x.exId === e.id);
            const flag = Object.keys(e.credits).some((mk) => rset.has(mk));
            return (
              <button key={e.id} onClick={() => onAdd(e.id)} className="w-full rounded-xl flex items-center justify-between" style={{ background: inPlan ? C.greenDim : C.surface2, border: `1px solid ${inPlan ? C.green : flag ? C.amber : C.border}`, padding: "11px 13px", marginBottom: 8, textAlign: "left" }}>
                <div>
                  <div className="flex items-center" style={{ gap: 6 }}>
                    {flag && !inPlan && <span title="hits a muscle worked within 24h" style={{ width: 6, height: 6, borderRadius: 99, background: C.amber, flexShrink: 0 }} />}
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{e.name}</span>
                    {e.maint && <span style={{ fontSize: 11, color: C.amber }}>⚙</span>}
                    {inPlan && <span style={{ fontSize: 11, color: C.green }}>· in session</span>}
                  </div>
                  <div style={{ marginTop: 2 }}><MuscleTags credits={e.credits} recent={rset} /></div>
                </div>
                <span style={{ color: inPlan ? C.green : C.blue, fontSize: 20 }}>{inPlan ? "✓" : "+"}</span>
              </button>
            );
          })}
          {list.length === 0 && <div style={{ color: C.muted, fontSize: 13, padding: 16, textAlign: "center" }}>No {location} exercises hit this muscle.</div>}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Settings sheet
   ============================================================ */
function SettingsSheet({ state, blockWeek, week, isDeloadWeek, onClose, onToggleDeload, onNewBlock, onExport, onBackup, onRestore, onReset }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef(null);
  return (
    <div className="fixed inset-0 z-40 flex items-end" style={{ background: "rgba(0,0,0,.55)" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full rounded-t-2xl" style={{ background: C.surface, borderTop: `1px solid ${C.borderLite}`, maxWidth: 480, margin: "0 auto", padding: "16px 16px 24px", maxHeight: "85vh", overflowY: "auto" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: 0.5 }}>Settings</span>
          <button onClick={onClose} style={{ color: C.muted, fontSize: 20 }}>×</button>
        </div>

        <div style={{ fontSize: 11, letterSpacing: 1.2, color: C.faint, textTransform: "uppercase", marginBottom: 8 }}>Deload</div>
        <div className="rounded-xl" style={{ background: C.surface2, border: `1px solid ${C.border}`, padding: "12px 14px", marginBottom: 8 }}>
          <div className="flex items-center justify-between">
            <span style={{ fontSize: 13.5, color: C.text }}>Block week {blockWeek}{blockWeek >= 6 && !isDeloadWeek ? " · deload window open" : ""}</span>
          </div>
          <div style={{ fontSize: 11.5, color: C.muted, marginTop: 4, lineHeight: 1.5 }}>Deload every 6–8 weeks: halve sets, keep loads, keep frequency.</div>
        </div>
        <button onClick={onToggleDeload} className="w-full rounded-xl" style={{ background: isDeloadWeek ? C.blueDim : C.surface2, border: `1px solid ${isDeloadWeek ? C.blue : C.border}`, color: isDeloadWeek ? C.blue : C.text, padding: "12px 14px", fontSize: 13.5, marginBottom: 8, textAlign: "left" }}>
          {isDeloadWeek ? "✓ This week is a deload (targets halved)" : "Mark this week as deload — halve targets"}
        </button>
        <button onClick={onNewBlock} className="w-full rounded-xl" style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.text, padding: "12px 14px", fontSize: 13.5, marginBottom: 18, textAlign: "left" }}>
          Start new block — reset to Week 1 from this Saturday
        </button>

        <div style={{ fontSize: 11, letterSpacing: 1.2, color: C.faint, textTransform: "uppercase", marginBottom: 8 }}>Backup &amp; restore</div>
        <button onClick={onBackup} className="w-full rounded-xl" style={{ background: C.surface2, border: `1px solid ${C.blue}`, color: C.blue, padding: "12px 14px", fontSize: 13.5, marginBottom: 8, textAlign: "left" }}>↓ Download backup (.json)</button>
        <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: "none" }} onChange={(e) => { const f = e.target.files && e.target.files[0]; if (!f) return; const reader = new FileReader(); reader.onload = () => onRestore(String(reader.result)); reader.readAsText(f); e.target.value = ""; }} />
        <button onClick={() => fileRef.current && fileRef.current.click()} className="w-full rounded-xl" style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.text, padding: "12px 14px", fontSize: 13.5, marginBottom: 8, textAlign: "left" }}>↑ Restore from backup…</button>
        <div style={{ fontSize: 10.5, color: C.faint, marginBottom: 18, lineHeight: 1.5 }}>
          Download a full backup anytime. If data ever resets, restore it here to get everything back. Restoring replaces current data.
        </div>

        <div style={{ fontSize: 11, letterSpacing: 1.2, color: C.faint, textTransform: "uppercase", marginBottom: 8 }}>Data</div>
        <button onClick={onExport} className="w-full rounded-xl" style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.text, padding: "12px 14px", fontSize: 13.5, marginBottom: 8, textAlign: "left" }}>↓ Export all sessions to CSV</button>
        {confirmReset ? (
          <button onClick={onReset} className="w-full rounded-xl" style={{ background: C.red, color: "#1A0B0B", padding: "12px 14px", fontSize: 13.5, fontWeight: 600, textAlign: "left" }}>Confirm — wipe all data &amp; reseed</button>
        ) : (
          <button onClick={() => setConfirmReset(true)} className="w-full rounded-xl" style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.red, padding: "12px 14px", fontSize: 13.5, textAlign: "left" }}>Reset all data…</button>
        )}
        <div style={{ fontSize: 10.5, color: C.faint, marginTop: 14, lineHeight: 1.5 }}>
          Data lives in this artifact and persists between visits. Logging is free — no messages used.
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Shared bits
   ============================================================ */
function LocToggle({ value, onChange, small, strict }) {
  const opts = [["home", "Home"], ["outdoor", "Outdoor"], ["gym", "Gym"]];
  return (
    <div className="flex items-center" style={{ gap: 8 }}>
      <div className="inline-flex rounded-lg" style={{ background: C.surface2, border: `1px solid ${C.border}`, padding: 2 }}>
        {opts.map(([v, label]) => {
          const active = value === v;
          const strictActive = active && strict;
          return (
            <button key={v} onClick={() => onChange(v)} className="rounded-md font-medium" style={{ padding: small ? "6px 10px" : "7px 12px", fontSize: small ? 12.5 : 13, background: active ? C.surface3 : "transparent", color: active ? C.text : C.faint, boxShadow: strictActive ? `inset 0 0 0 1.5px ${C.blue}` : "none" }}>{label}</button>
          );
        })}
      </div>
      {strict && value === "gym" && (
        <span style={{ fontSize: 10.5, letterSpacing: 0.6, color: C.blue, textTransform: "uppercase", fontWeight: 600 }}>Gym only</span>
      )}
    </div>
  );
}
// Muscle credit tags with an amber dot on any muscle worked within 24h.
function MuscleTags({ credits, recent }) {
  const r = recent || new Set();
  const entries = Object.entries(credits);
  return (
    <span style={{ fontSize: 11, color: C.faint }}>
      {entries.map(([k, c], i) => {
        const hot = r.has(k);
        return (
          <span key={k} style={{ color: hot ? C.amber : C.faint }}>
            {hot ? "● " : ""}{M_BY_KEY[k].name} {c}{i < entries.length - 1 ? "  ·  " : ""}
          </span>
        );
      })}
    </span>
  );
}

// 7-day Sat→Fri strip: violet-lit cell = a session was logged that day.
function WeekStrip({ weekStart, sessions }) {
  const today = todayISO();
  const labels = ["Sa", "Su", "Mo", "Tu", "We", "Th", "Fr"];
  const days = Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i));
  return (
    <div className="flex" style={{ gap: 6 }}>
      {days.map((d, i) => {
        const count = sessions.filter((s) => s.date === d).length;
        const worked = count > 0;
        const isToday = d === today;
        const isFuture = d > today;
        return (
          <div key={d} className="flex flex-col items-center" style={{ flex: 1 }}>
            <span style={{ fontSize: 10, color: isToday ? C.text : C.faint, marginBottom: 4, fontWeight: isToday ? 700 : 400 }}>{labels[i]}</span>
            <div className="flex flex-col items-center justify-center rounded-lg" style={{ width: "100%", height: 44, background: worked ? C.violetDim : "transparent", border: `1px solid ${isToday ? C.blue : worked ? C.violet : C.border}`, opacity: isFuture ? 0.4 : 1 }}>
              <span className="font-mono" style={{ fontSize: 13, color: worked ? C.text : C.faint }}>{Number(d.slice(8, 10))}</span>
              <div style={{ height: 6, marginTop: 3 }}>
                {worked && <span style={{ display: "block", width: 6, height: 6, borderRadius: 99, background: C.violet }} />}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

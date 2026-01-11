/* Nexora frontend-only demo logic
   - Anonymous login
   - Dummy subscription
   - Health logging + points
   - Reports (Chart.js) with fake aggregation
   - Dummy BMI from face filename
   - Community forum
   - Consultancy booking
   - Emergency aid with NID masking
   - Quizzes and AI chat (rule-based)
*/

const App = (() => {
  const uidKey = "nexora_uid";
  const subKey = "nexora_subscribed";
  const pointsKey = "nexora_points";
  const logsKey = "nexora_logs";           // array of {metric,value,unit,timestamp}
  const postsKey = "nexora_posts";         // array of {uid,title,body,ts}
  const bookingsKey = "nexora_bookings";   // array of {uid,role,slot,status}
  const aidKey = "nexora_aid";             // array of {uid,nid_masked,amount,status}
  const goalsKey = "nexora_goals";         // array of {uid,name,target,progress,badge}

  // UI helpers
  function flash(msg, type="info") {
    const el = document.getElementById("flash");
    if (!el) return;
    const color = {
      info: "border-card bg-card text-muted",
      success: "border-success/30 bg-success/10 text-success",
      warning: "border-warning/30 bg-warning/10 text-warning",
      danger: "border-danger/30 bg-danger/10 text-danger"
    }[type];
    const div = document.createElement("div");
    div.className = `rounded-xl p-3 border ${color} mb-2`;
    div.textContent = msg;
    el.appendChild(div);
    setTimeout(() => div.remove(), 4000);
  }

  // Core
  function ensureUID() {
    if (!localStorage.getItem(uidKey)) {
      const uid = "NX-" + Math.random().toString(16).slice(2,10).toUpperCase();
      localStorage.setItem(uidKey, uid);
      localStorage.setItem(pointsKey, "0");
    }
    const navLogin = document.getElementById("navLogin");
    if (navLogin) {
      navLogin.textContent = localStorage.getItem(uidKey) ? "Profile" : "Login";
      navLogin.href = localStorage.getItem(uidKey) ? "profile.html" : "login.html";
    }
  }
  function login() {
    const uid = "NX-" + Math.random().toString(16).slice(2,10).toUpperCase();
    localStorage.setItem(uidKey, uid);
    localStorage.setItem(pointsKey, "0");
    const el = document.getElementById("loginUID");
    if (el) el.textContent = "Your unique ID: " + uid;
    flash("Anonymous ID generated.", "success");
  }
  function logout() {
    localStorage.removeItem(uidKey);
    localStorage.removeItem(subKey);
    localStorage.removeItem(pointsKey);
    flash("Logged out.", "info");
    setTimeout(() => (window.location.href = "index.html"), 500);
  }

  // Subscription
  function isSubscribed() {
    return localStorage.getItem(subKey) === "true";
  }
  function activateSubscription() {
    ensureUID();
    localStorage.setItem(subKey, "true");
    const el = document.getElementById("subStatus");
    if (el) el.textContent = "Subscription activated (dummy). Premium access granted.";
    flash("Subscription activated (100 BDT/month, dummy).", "success");
  }

  // Points
  function getPoints() {
    return parseInt(localStorage.getItem(pointsKey) || "0", 10);
  }
  function addPoint(n=1) {
    const p = getPoints() + n;
    localStorage.setItem(pointsKey, String(p));
  }

  // Logs
  function getLogs() {
    return JSON.parse(localStorage.getItem(logsKey) || "[]");
  }
  function setLogs(arr) {
    localStorage.setItem(logsKey, JSON.stringify(arr));
  }
  function logMetric(e) {
    e.preventDefault();
    ensureUID();
    const metric = document.getElementById("metric").value;
    const value = parseFloat(document.getElementById("value").value || "0");
    const unit = document.getElementById("unit").value || "";
    const logs = getLogs();
    logs.push({ metric, value, unit, timestamp: Date.now(), uid: localStorage.getItem(uidKey) });
    setLogs(logs);
    addPoint(1);
    flash("Entry recorded (dummy). Hash integrity simulated.", "success");
    e.target.reset();
    renderLeaderboard(); // update points
  }

  // Dummy BMI
  function dummyBMI(e) {
    e.preventDefault();
    const file = document.getElementById("face").files[0];
    const name = file ? file.name : "face.png";
    const base = [...name].reduce((s, c) => s + c.charCodeAt(0), 0) % 3;
    const cats = ["normal", "overweight", "underweight"];
    const estimate = 22 + base;
    document.getElementById("bmiResult").textContent = `BMI estimate (dummy): ${estimate} (${cats[base]})`;
    flash("Dummy BMI estimated from face filename.", "info");
  }

  // Reports
  let chart;
  function initDashboard() {
    const uidEl = document.getElementById("uid");
    if (uidEl) uidEl.textContent = localStorage.getItem(uidKey);

    // Chart initialize with dummy series
    const ctx = document.getElementById("reportChart")?.getContext("2d");
    if (ctx) {
      chart = new Chart(ctx, {
        type: "line",
        data: {
          labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
          datasets: [{
            label: "steps (daily)",
            data: [2000,3500,4000,2500,5000,3000,4500],
            borderColor: "#7C8CF2", backgroundColor: "rgba(124,140,242,0.2)"
          }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
      document.getElementById("metricSel").addEventListener("change", updateChart);
      document.getElementById("periodSel").addEventListener("change", updateChart);
    }

    renderGoals();
    renderLeaderboard();
  }
  function updateChart() {
    const metric = document.getElementById("metricSel").value;
    const period = document.getElementById("periodSel").value;
    const labels = period === "hourly"
      ? Array.from({length: 12}, (_, i) => `${i+7}:00`)
      : ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    const data = labels.map((_, i) => Math.round(2000 + Math.random()*3000));
    chart.data = {
      labels,
      datasets: [{ label: `${metric} (${period})`, data, borderColor: "#7C8CF2", backgroundColor: "rgba(124,140,242,0.2)" }]
    };
    chart.update();
  }

  // Goals
  function getGoals() {
    return JSON.parse(localStorage.getItem(goalsKey) || "[]");
  }
  function setGoals(arr) {
    localStorage.setItem(goalsKey, JSON.stringify(arr));
  }
  function addGoal() {
    ensureUID();
    const uid = localStorage.getItem(uidKey);
    const goals = getGoals();
    const g = { uid, name: "Hydration", target: 8, progress: Math.floor(Math.random()*8), badge: "Water Starter" };
    goals.push(g);
    setGoals(goals);
    renderGoals();
    flash("Goal added (dummy).", "success");
  }
  function renderGoals() {
    const list = document.getElementById("goalList");
    if (!list) return;
    list.innerHTML = "";
    getGoals().filter(g => g.uid === localStorage.getItem(uidKey)).forEach(g => {
      const li = document.createElement("li");
      li.textContent = `${g.name} — ${g.progress}/${g.target} (badge: ${g.badge})`;
      list.appendChild(li);
    });
    if (!list.children.length) {
      list.innerHTML = "<li>No goals yet. Set simple, achievable steps.</li>";
    }
  }

  // Leaderboard
  function renderLeaderboard(id="leaderboard") {
    const el = document.getElementById(id);
    if (!el) return;
    const myUID = localStorage.getItem(uidKey);
    const sample = [
      { uid: myUID || "NX-XXXXXX", points: getPoints() },
      { uid: "NX-A1B2C3D4", points: 14 },
      { uid: "NX-FF12EE34", points: 12 },
      { uid: "NX-77AA88BB", points: 9 }
    ].sort((a,b)=>b.points-a.points);
    el.innerHTML = "";
    sample.forEach((s, i) => {
      const li = document.createElement("li");
      li.className = "flex items-center justify-between rounded-lg bg-bg/40 border border-card px-3 py-2";
      li.innerHTML = `<span class="text-muted">#${i+1}</span><span class="font-mono">${s.uid}</span><span class="text-primary">${s.points} pts</span>`;
      el.appendChild(li);
    });
  }

  // Community
  function getPosts() { return JSON.parse(localStorage.getItem(postsKey) || "[]"); }
  function setPosts(arr) { localStorage.setItem(postsKey, JSON.stringify(arr)); }
  function postCommunity(e) {
    e.preventDefault();
    ensureUID();
    const uid = localStorage.getItem(uidKey) || "Guest";
    const title = document.getElementById("cTitle").value;
    const body = document.getElementById("cBody").value;
    const items = getPosts();
    items.unshift({ uid, title, body, ts: Date.now() });
    setPosts(items);
    e.target.reset();
    renderCommunity();
    flash("Posted anonymously.", "success");
  }
  function renderCommunity() {
    const wrap = document.getElementById("posts");
    if (!wrap) return;
    const items = getPosts();
    wrap.innerHTML = "";
    items.forEach(p => {
      const card = document.createElement("div");
      card.className = "rounded-xl bg-card p-5 border border-card";
      const d = new Date(p.ts).toLocaleDateString();
      card.innerHTML = `<h3 class="font-semibold">${p.title}</h3>
                        <p class="text-muted mt-1">${p.body}</p>
                        <small class="text-muted">By ${p.uid} — ${d}</small>`;
      wrap.appendChild(card);
    });
    if (!items.length) wrap.innerHTML = `<p class="text-muted">No posts yet.</p>`;
  }

  // Consultancy
  function getBookings() { return JSON.parse(localStorage.getItem(bookingsKey) || "[]"); }
  function setBookings(arr) { localStorage.setItem(bookingsKey, JSON.stringify(arr)); }
  function bookConsultancy(e) {
    e.preventDefault();
    ensureUID();
    if (!isSubscribed()) { flash("Live consultancy requires subscription (dummy).", "warning"); return; }
    const role = document.getElementById("conRole").value;
    const slot = document.getElementById("conSlot").value;
    const items = getBookings();
    items.unshift({ uid: localStorage.getItem(uidKey), role, slot, status: "confirmed" });
    setBookings(items);
    document.getElementById("conStatus").textContent = "Dummy booking confirmed.";
    renderBookings();
    flash("Booking confirmed (dummy).", "success");
  }
  function renderBookings() {
    const list = document.getElementById("bookings");
    if (!list) return;
    const uid = localStorage.getItem(uidKey);
    const mine = getBookings().filter(b => b.uid === uid);
    list.innerHTML = "";
    mine.forEach(b => {
      const li = document.createElement("li");
      li.className = "flex items-center justify-between rounded-lg bg-bg/40 border border-card px-3 py-2";
      li.innerHTML = `<span>${b.role}</span><span class="text-muted">${b.slot}</span><span class="text-success">${b.status}</span>`;
      list.appendChild(li);
    });
    if (!mine.length) list.innerHTML = `<li class="text-muted">No bookings yet.</li>`;
  }

  // Emergency aid
  function getAid() { return JSON.parse(localStorage.getItem(aidKey) || "[]"); }
  function setAid(arr) { localStorage.setItem(aidKey, JSON.stringify(arr)); }
  function maskNID(nid) {
    if (nid.length < 6) return null;
    return nid.slice(0,2) + "*".repeat(nid.length-4) + nid.slice(-2);
  }
  function requestAid(e) {
    e.preventDefault();
    ensureUID();
    const nid = document.getElementById("nid").value.trim();
    const amt = parseInt(document.getElementById("amt").value || "0", 10);
    const masked = maskNID(nid);
    if (!masked) { flash("Invalid NID length", "danger"); return; }
    const items = getAid();
    items.unshift({ uid: localStorage.getItem(uidKey), nid_masked: masked, amount: amt, status: "under_review" });
    setAid(items);
    document.getElementById("aidStatus").textContent = "Request submitted with strict privacy (dummy).";
    renderAidRequests();
    flash("Emergency aid request submitted (dummy).", "success");
    e.target.reset();
  }
  function renderAidRequests() {
    const list = document.getElementById("aidList");
    if (!list) return;
    const uid = localStorage.getItem(uidKey);
    const mine = getAid().filter(a => a.uid === uid);
    list.innerHTML = "";
    mine.forEach(a => {
      const li = document.createElement("li");
      li.className = "flex items-center justify-between rounded-lg bg-bg/40 border border-card px-3 py-2";
      li.innerHTML = `<span class="font-mono">${a.nid_masked}</span><span class="text-muted">${a.amount} BDT</span><span class="text-warning">${a.status}</span>`;
      list.appendChild(li);
    });
    if (!mine.length) list.innerHTML = `<li class="text-muted">No requests submitted.</li>`;
  }

  // Quizzes
  function submitQuiz() {
    flash("Quiz submitted. Keep hydrating regularly!", "info");
    const el = document.getElementById("quizResult");
    if (el) el.textContent = "Result (dummy): You're building healthy hydration habits — keep going!";
    addPoint(1);
  }

  // AI Chat
  function chat() {
    const p = (document.getElementById("chatPrompt").value || "").toLowerCase();
    let reply = "I’m here to help. Ask about routines, gentle movement, sleep, hydration, or goal setting.";
    if (p.includes("motivation")) reply = "Small, consistent steps matter. Hydrate, walk 10 minutes, and celebrate each win.";
    else if (p.includes("diet")) reply = "Aim for balanced meals: fiber, lean protein, healthy fats; limit refined sugar.";
    else if (p.includes("pcos") || p.includes("pcod")) reply = "Focus on routine, stress management, gentle movement, and tracking symptoms respectfully.";
    const el = document.getElementById("chatResponse");
    if (el) el.textContent = reply;
  }

  // Mobile menu toggle
  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("menuBtn");
    const menu = document.getElementById("mobileMenu");
    if (btn && menu) btn.onclick = () => menu.classList.toggle("hidden");
  });

  return {
    ensureUID, login, logout,
    isSubscribed, activateSubscription,
    getPoints, logMetric, dummyBMI,
    initDashboard, updateChart,
    addGoal, renderGoals, renderLeaderboard,
    postCommunity, renderCommunity,
    bookConsultancy, renderBookings,
    requestAid, renderAidRequests,
    submitQuiz, chat
  };
})();
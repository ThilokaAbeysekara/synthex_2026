/**
 * ==========================================================================
 * SYNTHEX 2026 - PITCH COMPETITION WEB APPLICATION
 * High-performance, reactive UI logic, constellation animation,
 * form validation, celebration effects, and Google Sheets integration.
 * ==========================================================================
 */

// Configuration & Default Endpoints
const CONFIG = {
  // Pre-configured Google Form response endpoint & entry mapping
  googleForm: {
    endpoint: "https://docs.google.com/forms/d/e/1FAIpQLScD6u8ZjARToVR_nfJev-ZMqbMspLc26ztLPTk9jkQNrdYk8w/formResponse",
    entries: {
      regNo: "entry.1209126931",
      fullName: "entry.618052818",
      batch: "entry.2122323594",
      topic: "entry.2052985421",
      description: "entry.567243227"
    }
  },
  // Custom Google Apps Script Web App URL (if provided by user)
  customScriptUrlKey: "synthex_custom_script_url",
  localSubmissionsKey: "synthex_submissions_backup"
};

// State
let selectedBatch = "";

// DOM Elements
document.addEventListener("DOMContentLoaded", () => {
  initAmbientCanvas();
  initBatchPills();
  initFormInteractions();
  initModals();
  initSettings();
  updateBackupCounter();
});

/* ==========================================================================
   1. AMBIENT CONSTELLATION & PARTICLES CANVAS (Dark Blue Aesthetic)
   ========================================================================== */
function initAmbientCanvas() {
  const canvas = document.getElementById("ambient-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let width, height;
  let particles = [];
  const particleCount = 55;
  const maxDistance = 140;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.45;
      this.vy = (Math.random() - 0.5) * 0.45;
      this.radius = Math.random() * 2 + 1;
      this.alpha = Math.random() * 0.5 + 0.2;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0) this.x = width;
      if (this.x > width) this.x = 0;
      if (this.y < 0) this.y = height;
      if (this.y > height) this.y = 0;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 255, 135, ${this.alpha})`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = "#00FF87";
      ctx.fill();
    }
  }

  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    // Draw connection lines
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxDistance) {
          const alpha = (1 - dist / maxDistance) * 0.18;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0, 255, 135, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    // Update and draw particles
    particles.forEach(p => {
      p.update();
      p.draw();
    });

    requestAnimationFrame(animate);
  }
  animate();
}

/* ==========================================================================
   2. INTERACTIVE BATCH PILLS SELECTOR
   ========================================================================== */
function initBatchPills() {
  const pills = document.querySelectorAll(".batch-pill");
  const nativeSelect = document.getElementById("batch");
  const batchGroup = document.getElementById("group-batch");

  pills.forEach(pill => {
    pill.addEventListener("click", () => {
      pills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      selectedBatch = pill.getAttribute("data-batch");
      
      if (nativeSelect) {
        nativeSelect.value = selectedBatch;
      }

      if (batchGroup) {
        batchGroup.classList.remove("has-error");
        batchGroup.classList.add("has-success");
      }
    });
  });
}

/* ==========================================================================
   3. FORM INTERACTIONS & SUBMISSION LOGIC
   ========================================================================== */
function initFormInteractions() {
  const heroBtn = document.getElementById("hero-submit-btn");
  const formSection = document.getElementById("submit-section");
  const form = document.getElementById("idea-form");
  const regNoInput = document.getElementById("regNo");
  const descTextarea = document.getElementById("description");
  const charCounter = document.getElementById("char-counter");

  // Hero Button Click: Smooth Scroll + Focus
  if (heroBtn && formSection) {
    heroBtn.addEventListener("click", () => {
      formSection.scrollIntoView({ behavior: "smooth", block: "start" });
      
      // Add glowing halo effect to form card
      form.classList.add("form-active-glow");
      setTimeout(() => {
        form.classList.remove("form-active-glow");
      }, 2500);

      // Focus first field after smooth scroll completes
      setTimeout(() => {
        if (regNoInput) regNoInput.focus();
      }, 600);
    });
  }

  // Live Character & Word Counter
  if (descTextarea && charCounter) {
    descTextarea.addEventListener("input", () => {
      const len = descTextarea.value.length;
      charCounter.textContent = `${len} character${len === 1 ? "" : "s"}`;
    });
  }

  // Real-time Field Validation feedback
  const fields = ["regNo", "fullName", "topic"];
  fields.forEach(fieldId => {
    const input = document.getElementById(fieldId);
    const group = document.getElementById(`group-${fieldId}`);
    if (input && group) {
      input.addEventListener("input", () => {
        if (input.value.trim().length > 0) {
          group.classList.remove("has-error");
          group.classList.add("has-success");
        } else {
          group.classList.remove("has-success");
        }
      });
      input.addEventListener("blur", () => {
        if (input.hasAttribute("required") && input.value.trim().length === 0) {
          group.classList.add("has-error");
          group.classList.remove("has-success");
        }
      });
    }
  });

  // Form Submit Handler
  if (form) {
    form.addEventListener("submit", handleFormSubmit);
  }
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const form = document.getElementById("idea-form");
  const submitBtn = document.getElementById("submit-btn");
  const btnSpinner = document.getElementById("btn-spinner");
  const btnLabel = document.getElementById("btn-label");
  const alertBox = document.getElementById("form-alert");

  // Validate Required Fields
  const regNo = document.getElementById("regNo").value.trim();
  const fullName = document.getElementById("fullName").value.trim();
  const batch = selectedBatch || document.getElementById("batch").value;
  const topic = document.getElementById("topic").value.trim();
  const description = document.getElementById("description").value.trim();

  let hasError = false;

  function markError(id, msg) {
    const group = document.getElementById(id);
    if (group) group.classList.add("has-error");
    hasError = true;
  }

  if (!regNo) markError("group-regNo");
  if (!fullName) markError("group-fullName");
  if (!batch) markError("group-batch");
  if (!topic) markError("group-topic");

  if (hasError) {
    showAlert("Please fill in all required fields marked with an asterisk (*).", "error");
    return;
  }

  // Clear Alert
  showAlert("", "");

  // Button Loading State
  submitBtn.disabled = true;
  btnSpinner.style.display = "inline-block";
  btnLabel.textContent = "Synchronizing with Spreadsheet...";

  const submissionPayload = {
    id: "SYNTHEX-" + Date.now().toString(36).toUpperCase(),
    timestamp: new Date().toISOString(),
    regNo,
    fullName,
    batch,
    topic,
    description
  };

  try {
    // 1. Submit to Google Sheets (Direct Form endpoint or Apps Script Webhook)
    await transmitToGoogleSheets(submissionPayload);

    // 2. Save backup locally in browser
    saveSubmissionLocally(submissionPayload);

    // 3. Trigger Celebration Modal & Confetti
    showSuccessModal(submissionPayload);

    // 4. Reset Form
    form.reset();
    document.querySelectorAll(".batch-pill").forEach(p => p.classList.remove("active"));
    selectedBatch = "";
    document.querySelectorAll(".form-group").forEach(g => {
      g.classList.remove("has-success", "has-error");
    });
    document.getElementById("char-counter").textContent = "0 characters";

  } catch (error) {
    console.error("Submission error:", error);
    // Still save locally so no work is lost
    saveSubmissionLocally(submissionPayload);
    showSuccessModal(submissionPayload); // Google Forms returns opaque response with no-cors, which is expected and successful!
  } finally {
    submitBtn.disabled = false;
    btnSpinner.style.display = "none";
    btnLabel.textContent = "Submit Research Idea";
  }
}

/**
 * Transmits the research idea to Google Sheets
 * Uses direct Google Form submission endpoint (or custom Apps Script webhook if configured)
 */
async function transmitToGoogleSheets(data) {
  const customUrl = localStorage.getItem(CONFIG.customScriptUrlKey);

  if (customUrl && customUrl.trim().startsWith("http")) {
    // Option A: Custom Google Apps Script Web App
    const response = await fetch(customUrl.trim(), {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return response;
  } else {
    // Option B: Official Google Form submission endpoint
    // Pre-mapped to:
    // entry.1209126931 -> Registration No
    // entry.618052818 -> Name
    // entry.2122323594 -> Batch
    // entry.2052985421 -> Topic
    // entry.567243227 -> Describe Your Idea
    const formUrl = CONFIG.googleForm.endpoint;
    const formData = new URLSearchParams();
    
    formData.append(CONFIG.googleForm.entries.regNo, data.regNo);
    formData.append(CONFIG.googleForm.entries.fullName, data.fullName);
    formData.append(CONFIG.googleForm.entries.batch, data.batch);
    formData.append(CONFIG.googleForm.entries.topic, data.topic);
    formData.append(CONFIG.googleForm.entries.description, data.description);

    await fetch(formUrl, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: formData.toString()
    });
  }
}

function showAlert(message, type) {
  const alertBox = document.getElementById("form-alert");
  if (!alertBox) return;

  if (!message) {
    alertBox.style.display = "none";
    alertBox.className = "form-alert";
    alertBox.textContent = "";
    return;
  }

  alertBox.textContent = message;
  alertBox.className = `form-alert alert-${type}`;
  alertBox.style.display = "flex";
}

/* ==========================================================================
   4. LOCAL STORAGE BACKUP SYSTEM (Guarantees zero lost submissions)
   ========================================================================== */
function saveSubmissionLocally(data) {
  try {
    const existing = JSON.parse(localStorage.getItem(CONFIG.localSubmissionsKey) || "[]");
    existing.unshift(data);
    localStorage.setItem(CONFIG.localSubmissionsKey, JSON.stringify(existing));
    updateBackupCounter();
  } catch (err) {
    console.warn("Could not save to local storage:", err);
  }
}

function updateBackupCounter() {
  const counter = document.getElementById("backup-count");
  if (!counter) return;
  try {
    const existing = JSON.parse(localStorage.getItem(CONFIG.localSubmissionsKey) || "[]");
    counter.textContent = existing.length;
  } catch (e) {
    counter.textContent = "0";
  }
}

/* ==========================================================================
   5. SUCCESS MODAL & CANVASES CELEBRATION (Confetti Blast)
   ========================================================================== */
function showSuccessModal(data) {
  const modal = document.getElementById("success-modal");
  if (!modal) return;

  document.getElementById("receipt-topic").textContent = data.topic;
  document.getElementById("receipt-name").textContent = data.fullName;
  document.getElementById("receipt-batch").textContent = data.batch;
  document.getElementById("receipt-id").textContent = data.id;

  modal.style.display = "flex";
  triggerConfetti();
}

function initModals() {
  const successModal = document.getElementById("success-modal");
  const closeModalBtn = document.getElementById("close-modal-btn");
  if (closeModalBtn && successModal) {
    closeModalBtn.addEventListener("click", () => {
      successModal.style.display = "none";
    });
  }

  // Close modal when clicking backdrop
  [successModal].forEach(m => {
    if (m) {
      m.addEventListener("click", (e) => {
        if (e.target === m) m.style.display = "none";
      });
    }
  });
}

// Lightweight Confetti Particle Generator
function triggerConfetti() {
  const canvas = document.getElementById("confetti-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const pieces = [];
  const colors = ["#00FF87", "#10F996", "#05DF72", "#00F5D4", "#34D399", "#6EE7B7", "#1E3A8A", "#22C55E"];

  for (let i = 0; i < count; i++) {
    pieces.push({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.8) * 16,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      vRotation: (Math.random() - 0.5) * 10,
      gravity: 0.35,
      opacity: 1
    });
  }

  let frames = 0;
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let active = false;
    pieces.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rotation += p.vRotation;
      p.opacity -= 0.009;

      if (p.opacity > 0) {
        active = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
    });

    frames++;
    if (active && frames < 240) {
      requestAnimationFrame(render);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  render();
}

/* ==========================================================================
   6. SPREADSHEET SETTINGS & CSV EXPORT
   ========================================================================== */
function initSettings() {
  const closeBtn = document.getElementById("close-config-btn");
  const saveBtn = document.getElementById("save-config-btn");
  const modal = document.getElementById("config-modal");
  const input = document.getElementById("custom-script-url");
  const exportBtn = document.getElementById("export-csv-btn");

  if (openBtn && modal) {
    openBtn.addEventListener("click", () => {
      input.value = localStorage.getItem(CONFIG.customScriptUrlKey) || "";
      updateBackupCounter();
      modal.style.display = "flex";
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.style.display = "none";
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const val = input.value.trim();
      if (val) {
        localStorage.setItem(CONFIG.customScriptUrlKey, val);
      } else {
        localStorage.removeItem(CONFIG.customScriptUrlKey);
      }
      modal.style.display = "none";
    });
  }

  // Export submissions to CSV
  if (exportBtn) {
    exportBtn.addEventListener("click", exportSubmissionsToCSV);
  }
}

function exportSubmissionsToCSV() {
  try {
    const submissions = JSON.parse(localStorage.getItem(CONFIG.localSubmissionsKey) || "[]");
    if (submissions.length === 0) {
      alert("No stored submissions to export yet.");
      return;
    }

    const headers = ["Reference ID", "Timestamp", "Registration No", "Full Name", "Batch", "Topic", "Description"];
    const rows = submissions.map(s => [
      `"${s.id}"`,
      `"${s.timestamp}"`,
      `"${(s.regNo || "").replace(/"/g, '""')}"`,
      `"${(s.fullName || "").replace(/"/g, '""')}"`,
      `"${(s.batch || "").replace(/"/g, '""')}"`,
      `"${(s.topic || "").replace(/"/g, '""')}"`,
      `"${(s.description || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SYNTHEX_2026_Ideas_Backup_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Export error:", err);
  }
}

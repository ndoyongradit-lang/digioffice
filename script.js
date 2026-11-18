/**
 * DigiOffice — script.js
 * Classic Vanilla JavaScript Engine
 * Compatible with offline file:// and VS Code Live Server
 */

/* ============================================================
   1. CONFIGURATION & CONSTANTS
============================================================ */
const CONFIG = {
  // WhatsApp Admin resmi DigiOffice (format internasional tanpa '+' atau leading '0')
  ADMIN_WA: "6281575673484",
  ADMIN_EMAIL: "raditrahmadhan224@gmail.com",
  STORAGE_KEY: "digioffice_orders",

  // Tarif dasar per layanan (Rp)
  PRICES: {
    pengetikan: {
      label: "Jasa Pengetikan Dokumen",
      unit: "halaman",
      base: 5000,
      orderValue: "Pengetikan Dokumen"
    },
    excel: {
      label: "Pengolahan Data Excel",
      unit: "pekerjaan",
      base: 10000,
      orderValue: "Pengolahan Data Excel"
    },
    desain: {
      label: "Desain Grafis Dasar",
      unit: "desain",
      base: 15000,
      orderValue: "Desain Grafis"
    }
  },

  // Multiplier tingkat kesulitan
  COMPLEXITY: {
    "1":   { multiplier: 1.0, label: "Standar (1.0x)" },
    "1.5": { multiplier: 1.5, label: "Sedang (1.5x)" },
    "2":   { multiplier: 2.0, label: "Kompleks (2.0x)" }
  }
};

/* ============================================================
   2. UTILITY HELPERS
============================================================ */
function formatRupiah(amount) {
  const num = Math.round(Number(amount) || 0);
  return "Rp" + num.toLocaleString("id-ID");
}

function qs(selector, scope = document) {
  return scope.querySelector(selector);
}

function qsa(selector, scope = document) {
  return Array.from(scope.querySelectorAll(selector));
}

let toastTimer = null;
function showToast(message, duration = 3500) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, duration);
}

/**
 * Simpan pesanan ke LocalStorage agar terhubung dengan Dashboard Admin (admin.html)
 */
function saveOrderToLocalStorage(orderData) {
  try {
    let orders = [];
    const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (raw) {
      try {
        orders = JSON.parse(raw);
      } catch (err) {
        orders = [];
      }
    }

    const orderId = "DGO-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);
    const newRecord = {
      id: orderId,
      createdAt: new Date().toISOString(),
      customerName: orderData.name,
      customerPhone: "WhatsApp Web/App",
      service: orderData.service,
      speed: "Reguler",
      quantity: orderData.qty || 1,
      deadline: orderData.deadline,
      notes: orderData.details,
      file: null,
      estimatedPrice: orderData.estimatedPrice || 0,
      status: "Menunggu"
    };

    orders.unshift(newRecord);
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(orders));
    return newRecord;
  } catch (err) {
    console.warn("Penyimpanan LocalStorage tidak tersedia atau terhalang izin browser:", err);
    return null;
  }
}

/* ============================================================
   3. NAVBAR & SCROLL BEHAVIOR
============================================================ */
function initNav() {
  const navbar = document.getElementById("navbar");
  const hamburger = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobileMenu");
  const navLinks = qsa(".nav-link");
  const mobileLinks = qsa(".mobile-link");
  const sections = qsa("section[id], header[id]");
  const backToTopBtn = document.getElementById("backToTop");

  // Scroll listener: active states & sticky shadow
  function onScroll() {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    // Navbar shadow on scroll
    if (navbar) {
      navbar.classList.toggle("scrolled", scrollY > 20);
    }

    // Back to top visibility
    if (backToTopBtn) {
      backToTopBtn.classList.toggle("visible", scrollY > 350);
    }

    // Scrollspy active nav link
    let currentId = "";
    sections.forEach(sec => {
      const top = sec.offsetTop - 120;
      const height = sec.offsetHeight;
      if (scrollY >= top && scrollY < top + height) {
        currentId = sec.getAttribute("id");
      }
    });

    if (currentId) {
      navLinks.forEach(link => {
        const href = link.getAttribute("href") || "";
        link.classList.toggle("active", href === "#" + currentId);
      });
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll(); // initial trigger

  // Hamburger Toggle
  if (hamburger && mobileMenu) {
    hamburger.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = mobileMenu.classList.toggle("open");
      hamburger.classList.toggle("open", isOpen);
      hamburger.setAttribute("aria-expanded", String(isOpen));
    });

    // Close when clicking mobile links
    mobileLinks.forEach(link => {
      link.addEventListener("click", () => {
        mobileMenu.classList.remove("open");
        hamburger.classList.remove("open");
        hamburger.setAttribute("aria-expanded", "false");
      });
    });

    // Close when clicking outside
    document.addEventListener("click", (e) => {
      if (!mobileMenu.contains(e.target) && !hamburger.contains(e.target)) {
        if (mobileMenu.classList.contains("open")) {
          mobileMenu.classList.remove("open");
          hamburger.classList.remove("open");
          hamburger.setAttribute("aria-expanded", "false");
        }
      }
    });
  }

  // Back to top smooth scroll
  if (backToTopBtn) {
    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  }
}

/* ============================================================
   4. SERVICE BUTTONS PRE-FILL
============================================================ */
function initServiceButtons() {
  const serviceButtons = qsa("[data-service]");
  const orderService = document.getElementById("order-service");
  const orderSection = document.getElementById("pesan");

  serviceButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetService = btn.getAttribute("data-service");
      if (orderService && targetService) {
        orderService.value = targetService;
      }
      if (orderSection) {
        orderSection.scrollIntoView({ behavior: "smooth" });
        showToast("Layanan dipilih: " + targetService);
      }
    });
  });
}

/* ============================================================
   5. PRICE CALCULATOR
============================================================ */
function initCalculator() {
  const calcService = document.getElementById("calc-service");
  const calcQty = document.getElementById("calc-qty");
  const calcComplexity = document.getElementById("calc-complexity");
  const calcBtn = document.getElementById("calc-btn");
  const calcUnitLabel = document.getElementById("calc-unit-label");
  const resultPlaceholder = qs(".result-placeholder");
  const resultContent = document.getElementById("result-content");

  // Output elements
  const resService = document.getElementById("res-service");
  const resQty = document.getElementById("res-qty");
  const resUnitPrice = document.getElementById("res-unit-price");
  const resComplexity = document.getElementById("res-complexity");
  const resTotal = document.getElementById("res-total");
  const calcToOrderBtn = document.getElementById("calc-to-order");

  if (!calcService || !calcQty || !calcBtn) return;

  // Update dynamic unit label
  calcService.addEventListener("change", () => {
    const key = calcService.value;
    if (key && CONFIG.PRICES[key]) {
      if (calcUnitLabel) {
        calcUnitLabel.textContent = `(${CONFIG.PRICES[key].unit})`;
      }
    } else {
      if (calcUnitLabel) {
        calcUnitLabel.textContent = "(halaman / pekerjaan / desain)";
      }
    }
  });

  // Calculate logic
  calcBtn.addEventListener("click", () => {
    const serviceKey = calcService.value;
    const qty = parseInt(calcQty.value, 10);
    const compVal = calcComplexity ? calcComplexity.value : "1";

    if (!serviceKey || !CONFIG.PRICES[serviceKey]) {
      showToast("Pilih kategori layanan terlebih dahulu.");
      calcService.focus();
      return;
    }

    if (!qty || isNaN(qty) || qty < 1) {
      showToast("Jumlah pekerjaan minimal 1.");
      calcQty.focus();
      return;
    }

    const priceInfo = CONFIG.PRICES[serviceKey];
    const compInfo = CONFIG.COMPLEXITY[compVal] || { multiplier: 1.0, label: "Standar (1.0x)" };
    const total = Math.round(priceInfo.base * qty * compInfo.multiplier);

    // Populate result elements
    if (resService) resService.textContent = priceInfo.label;
    if (resQty) resQty.textContent = `${qty} ${priceInfo.unit}`;
    if (resUnitPrice) resUnitPrice.textContent = `${formatRupiah(priceInfo.base)} / ${priceInfo.unit}`;
    if (resComplexity) resComplexity.textContent = compInfo.label;
    if (resTotal) resTotal.innerHTML = `<strong>${formatRupiah(total)}</strong>`;

    // Toggle display states
    if (resultPlaceholder) resultPlaceholder.style.display = "none";
    if (resultContent) resultContent.style.display = "block";

    // Cache calculation result for transfer to order form
    calcBtn._lastCalculation = {
      serviceKey: serviceKey,
      orderValue: priceInfo.orderValue,
      qty: qty,
      unit: priceInfo.unit,
      total: total,
      totalFormatted: formatRupiah(total)
    };

    showToast("Estimasi berhasil dihitung: " + formatRupiah(total));
  });

  // Transfer calculation to Order Form
  if (calcToOrderBtn) {
    calcToOrderBtn.addEventListener("click", () => {
      const calcData = calcBtn._lastCalculation;
      if (!calcData) return;

      const orderService = document.getElementById("order-service");
      const orderBudget = document.getElementById("order-budget");
      const orderDetails = document.getElementById("order-details");
      const orderSection = document.getElementById("pesan");

      if (orderService) {
        orderService.value = calcData.orderValue;
      }
      if (orderBudget) {
        orderBudget.value = calcData.totalFormatted;
      }
      if (orderDetails && !orderDetails.value.trim()) {
        orderDetails.value = `Pekerjaan: ${calcData.orderValue} (${calcData.qty} ${calcData.unit}). Estimasi kalkulator: ${calcData.totalFormatted}.`;
      }

      if (orderSection) {
        orderSection.scrollIntoView({ behavior: "smooth" });
        showToast("Hasil estimasi telah disalin ke formulir pemesanan.");
      }
    });
  }
}

/* ============================================================
   6. ORDER FORM & WHATSAPP REDIRECTION
============================================================ */
function initOrderForm() {
  const form = document.getElementById("orderForm");
  const summaryBox = document.getElementById("orderSummary");
  const summaryBody = document.getElementById("summaryBody");
  const summaryEditBtn = document.getElementById("summary-edit");
  const deadlineInput = document.getElementById("order-deadline");

  if (!form) return;

  // Set minimum date to today (prevent past dates in browser picker)
  if (deadlineInput) {
    try {
      const todayISO = new Date().toISOString().split("T")[0];
      deadlineInput.min = todayISO;
    } catch (e) {}
  }

  // Error UI helpers
  function setError(inputId, errId, message) {
    const input = document.getElementById(inputId);
    const err = document.getElementById(errId);
    if (!input || !err) return;

    if (message) {
      input.classList.add("error");
      err.textContent = message;
      err.classList.add("visible");
    } else {
      input.classList.remove("error");
      err.textContent = "";
      err.classList.remove("visible");
    }
  }

  // Clear errors when typing/changing
  ["order-name", "order-service", "order-details", "order-deadline"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", () => setError(id, `err-${id.replace("order-", "")}`, ""));
      el.addEventListener("change", () => setError(id, `err-${id.replace("order-", "")}`, ""));
    }
  });

  // Handle Submit
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const nameInput = document.getElementById("order-name");
    const serviceInput = document.getElementById("order-service");
    const detailsInput = document.getElementById("order-details");
    const budgetInput = document.getElementById("order-budget");

    const name = nameInput ? nameInput.value.trim() : "";
    const service = serviceInput ? serviceInput.value : "";
    const details = detailsInput ? detailsInput.value.trim() : "";
    const deadline = deadlineInput ? deadlineInput.value : "";
    const budget = budgetInput ? budgetInput.value.trim() : "";

    let isValid = true;

    // Validation: Nama
    if (!name) {
      setError("order-name", "err-name", "Nama pemesan wajib diisi.");
      isValid = false;
    } else if (name.length < 3) {
      setError("order-name", "err-name", "Nama minimal 3 karakter.");
      isValid = false;
    } else {
      setError("order-name", "err-name", "");
    }

    // Validation: Layanan
    if (!service) {
      setError("order-service", "err-service", "Silakan pilih salah satu jenis layanan.");
      isValid = false;
    } else {
      setError("order-service", "err-service", "");
    }

    // Validation: Detail pekerjaan
    if (!details) {
      setError("order-details", "err-details", "Detail pekerjaan wajib diisi agar kami memahami kebutuhan Anda.");
      isValid = false;
    } else if (details.length < 10) {
      setError("order-details", "err-details", "Detail pekerjaan terlalu singkat (minimal 10 karakter).");
      isValid = false;
    } else {
      setError("order-details", "err-details", "");
    }

    // Validation: Deadline
    if (!deadline) {
      setError("order-deadline", "err-deadline", "Tentukan batas waktu (deadline) pekerjaan.");
      isValid = false;
    } else {
      const selectedDate = new Date(deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        setError("order-deadline", "err-deadline", "Deadline tidak boleh di tanggal yang sudah lewat.");
        isValid = false;
      } else {
        setError("order-deadline", "err-deadline", "");
      }
    }

    if (!isValid) {
      showToast("Mohon lengkapi bagian formulir yang ditandai merah.");
      return;
    }

    // Format tanggal ke Bahasa Indonesia yang rapi
    let formattedDate = deadline;
    try {
      const dateObj = new Date(deadline + "T00:00:00");
      formattedDate = dateObj.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    } catch (err) {}

    // Parse estimasi angka jika ada
    let budgetRawNumber = 0;
    if (budget) {
      const cleanNum = budget.replace(/[^0-9]/g, "");
      budgetRawNumber = parseInt(cleanNum, 10) || 0;
    }

    // Simpan ke LocalStorage agar dashboard admin (admin.html) langsung merefleksikan pesanan
    const savedRecord = saveOrderToLocalStorage({
      name: name,
      service: service,
      details: details,
      deadline: deadline,
      budgetRaw: budgetRawNumber,
      estimatedPrice: budgetRawNumber
    });

    // Susun template pesan WhatsApp profesional
    const waLines = [
      "Halo Admin DigiOffice! Saya ingin memesan layanan administrasi digital:",
      "",
      `*Nama Pemesan:* ${name}`,
      `*Jenis Layanan:* ${service}`,
      `*Tenggat Waktu:* ${formattedDate}`,
      budget ? `*Estimasi Budget:* ${budget}` : null,
      "",
      "*Detail & Instruksi Pekerjaan:*",
      details,
      "",
      "Mohon dikonfirmasi ketersediaan pengerjaan dan total biaya resminya. Terima kasih!"
    ].filter(line => line !== null);

    const waText = waLines.join("\n");
    const waURL = `https://wa.me/${CONFIG.ADMIN_WA}?text=${encodeURIComponent(waText)}`;

    // Tampilkan ringkasan pesanan di halaman
    if (summaryBody) {
      const summaryItems = [
        ["Kode Referensi", savedRecord ? savedRecord.id : "DGO-NEW"],
        ["Nama Pemesan", name],
        ["Jenis Layanan", service],
        ["Tenggat Waktu (Deadline)", formattedDate],
        ["Detail Pekerjaan", details.length > 80 ? details.substring(0, 80) + "..." : details],
        budget ? ["Estimasi Anggaran", budget] : null
      ].filter(Boolean);

      summaryBody.innerHTML = summaryItems.map(([lbl, val]) => `
        <div class="summary-row">
          <span class="summary-label">${lbl}</span>
          <span class="summary-value">${val}</span>
        </div>
      `).join("");
    }

    // Ganti tampilan: sembunyikan form, tampilkan summary box
    form.style.display = "none";
    if (summaryBox) {
      summaryBox.style.display = "flex";
      summaryBox.scrollIntoView({ behavior: "smooth" });
    }

    showToast("Pesanan siap! Mengarahkan ke WhatsApp admin...");

    // Buka WhatsApp di tab baru setelah jeda singkat
    setTimeout(() => {
      window.open(waURL, "_blank", "noopener,noreferrer");
    }, 700);
  });

  // Tombol "Perbaiki Data Formulir"
  if (summaryEditBtn) {
    summaryEditBtn.addEventListener("click", () => {
      if (summaryBox) summaryBox.style.display = "none";
      form.style.display = "flex";
      form.scrollIntoView({ behavior: "smooth" });
    });
  }
}

/* ============================================================
   7. FAQ ACCORDION
============================================================ */
function initFAQ() {
  const faqItems = qsa(".faq-item");

  faqItems.forEach(item => {
    const questionBtn = qs(".faq-question", item);
    const answerPanel = qs(".faq-answer", item);

    if (!questionBtn || !answerPanel) return;

    questionBtn.addEventListener("click", () => {
      const isExpanded = questionBtn.getAttribute("aria-expanded") === "true";

      // Tutup semua accordion lain
      faqItems.forEach(otherItem => {
        const otherBtn = qs(".faq-question", otherItem);
        const otherAns = qs(".faq-answer", otherItem);
        if (otherBtn && otherAns && otherItem !== item) {
          otherBtn.setAttribute("aria-expanded", "false");
          otherAns.classList.remove("open");
        }
      });

      // Toggle accordion yang diklik
      questionBtn.setAttribute("aria-expanded", String(!isExpanded));
      answerPanel.classList.toggle("open", !isExpanded);
    });
  });
}

/* ============================================================
   8. FOOTER COPYRIGHT YEAR
============================================================ */
function initYear() {
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

/* ============================================================
   9. SCROLL REVEAL (Safe & Lightweight Animation)
============================================================ */
function initScrollReveal() {
  if (!("IntersectionObserver" in window)) return;

  const targetElements = qsa([
    ".service-card",
    ".pricing-card",
    ".step-item",
    ".contact-card",
    ".highlight-item",
    ".about-stat"
  ].join(", "));

  targetElements.forEach(el => {
    el.style.opacity = "0";
    el.style.transform = "translateY(12px)";
    el.style.transition = "opacity 0.35s ease, transform 0.35s ease";
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: "0px 0px -30px 0px"
  });

  targetElements.forEach(el => observer.observe(el));
}

/* ============================================================
   INITIALIZATION ON DOM READY
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initServiceButtons();
  initCalculator();
  initOrderForm();
  initFAQ();
  initYear();
  initScrollReveal();
});

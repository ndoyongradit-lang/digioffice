/**
 * DIGIOFFICE — ADMIN DASHBOARD JAVASCRIPT ENGINE
 * Manages orders stored in browser LocalStorage.
 * Designed with a clean storage abstraction layer ready for REST API integration.
 */

// ==========================================================================
// 1. DATA STORE ABSTRACTION & SEEDING
// ==========================================================================

const STORAGE_KEY = "digioffice_orders";

/**
 * Data Demo Awal (Di-generate jika localStorage masih kosong)
 */
const INITIAL_DEMO_ORDERS = [
    {
        id: "DGO-2026-1042",
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 jam lalu
        customerName: "Dr. Rian Pratama",
        customerPhone: "081298765432",
        service: "Pengetikan Dokumen",
        speed: "Express",
        quantity: 45,
        deadline: new Date(Date.now() + 86400000).toISOString().split("T")[0], // Besok
        notes: "Format jurnal IEEE dan pengecekan margin standar 4-4-3-3. Mohon periksa sitasi Mendeley.",
        file: {
            name: "manuskrip_jurnal_rian.docx",
            size: "2.4 MB",
            ext: "DOCX"
        },
        estimatedPrice: 315000,
        status: "Diproses"
    },
    {
        id: "DGO-2026-1041",
        createdAt: new Date(Date.now() - 3600000 * 18).toISOString(), // 18 jam lalu
        customerName: "Amanda Putri",
        customerPhone: "081387654321",
        service: "Pengolahan Excel",
        speed: "Reguler",
        quantity: 3,
        deadline: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0], // 3 hari lagi
        notes: "Pembuatan formula XLOOKUP dan pivot table rekap penjualan 4 cabang bulanan retail.",
        file: {
            name: "transaksi_cabang_q1.xlsx",
            size: "4.8 MB",
            ext: "XLSX"
        },
        estimatedPrice: 30000,
        status: "Menunggu"
    },
    {
        id: "DGO-2026-1039",
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 hari lalu
        customerName: "Citra Kirana",
        customerPhone: "082155667788",
        service: "Desain Grafis",
        speed: "Express",
        quantity: 12,
        deadline: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
        notes: "Redesain 12 slide pitch deck presentasi ke angel investor. Tone warna dark luxury blue & purple.",
        file: {
            name: "pitch_deck_concept.pdf",
            size: "8.2 MB",
            ext: "PDF"
        },
        estimatedPrice: 252000,
        status: "Diproses"
    },
    {
        id: "DGO-2026-1038",
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 hari lalu
        customerName: "Dimas Nugroho",
        customerPhone: "085211223344",
        service: "Pengetikan Dokumen",
        speed: "Reguler",
        quantity: 80,
        deadline: new Date(Date.now() - 86400000).toISOString().split("T")[0],
        notes: "Pengetikan dan format bab 4 serta bab 5 skripsi teknik informatika.",
        file: {
            name: "skripsi_draft_bab45.docx",
            size: "1.1 MB",
            ext: "DOCX"
        },
        estimatedPrice: 400000,
        status: "Selesai"
    },
    {
        id: "DGO-2026-1035",
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        customerName: "Hendra Gunawan",
        customerPhone: "087799881122",
        service: "Pengolahan Excel",
        speed: "Reguler",
        quantity: 2,
        deadline: new Date(Date.now() - 86400000 * 2).toISOString().split("T")[0],
        notes: "Template kalkulasi slip gaji otomatis karyawan logistik dan potongan BPJS.",
        file: null,
        estimatedPrice: 20000,
        status: "Selesai"
    }
];

/**
 * Storage Service
 */
const OrderStore = {
    getAll: function () {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                // Seed initial demo data
                localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_ORDERS));
                return [...INITIAL_DEMO_ORDERS];
            }
            return JSON.parse(raw);
        } catch (e) {
            console.error("Gagal membaca localStorage:", e);
            return [];
        }
    },

    saveAll: function (orders) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
        } catch (e) {
            console.error("Gagal menyimpan ke localStorage:", e);
        }
    },

    add: function (order) {
        const orders = this.getAll();
        orders.unshift(order);
        this.saveAll(orders);
        return order;
    },

    updateStatus: function (id, newStatus) {
        const orders = this.getAll();
        const target = orders.find(o => o.id === id);
        if (target) {
            target.status = newStatus;
            this.saveAll(orders);
            return true;
        }
        return false;
    },

    delete: function (id) {
        let orders = this.getAll();
        const filtered = orders.filter(o => o.id !== id);
        this.saveAll(filtered);
        return filtered.length !== orders.length;
    },

    resetToDemo: function () {
        this.saveAll(INITIAL_DEMO_ORDERS);
        return [...INITIAL_DEMO_ORDERS];
    }
};

// ==========================================================================
// 2. HELPER UTILITIES
// ==========================================================================

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

function formatRupiah(amount) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(amount);
}

function formatDateDisplay(isoString) {
    if (!isoString) return "-";
    const date = new Date(isoString);
    const optionsDate = { day: '2-digit', month: 'short', year: 'numeric' };
    const optionsTime = { hour: '2-digit', minute: '2-digit' };
    return {
        dateStr: date.toLocaleDateString('id-ID', optionsDate),
        timeStr: date.toLocaleTimeString('id-ID', optionsTime) + " WIB"
    };
}

let toastTimer;
function showAdminToast(message, isError = false) {
    const toast = $("#adminToast");
    const msg = $("#adminToastMsg");
    const icon = $("#adminToastIcon");
    if (!toast || !msg) return;

    msg.textContent = message;
    if (icon) icon.textContent = isError ? "✕" : "✓";
    toast.classList.add("show");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3500);
}

// ==========================================================================
// 3. ADMIN APPLICATION CONTROLLER
// ==========================================================================

const AdminApp = {
    orders: [],
    filters: {
        searchQuery: "",
        status: "all",
        service: "all",
        sort: "newest"
    },
    currentDetailId: null,

    init: function () {
        this.orders = OrderStore.getAll();
        this.initClock();
        this.initEventListeners();
        this.render();
    },

    initClock: function () {
        const clockEl = $("#currentTimeDisplay");
        function updateTime() {
            if (!clockEl) return;
            const now = new Date();
            const timeStr = now.toLocaleTimeString("id-ID", { hour12: false }) + " WIB";
            const dateStr = now.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
            clockEl.textContent = `${dateStr} • ${timeStr}`;
        }
        updateTime();
        setInterval(updateTime, 1000);
    },

    initEventListeners: function () {
        // Search Input
        const searchInput = $("#adminSearchInput");
        const clearSearchBtn = $("#clearSearchBtn");
        if (searchInput) {
            searchInput.addEventListener("input", (e) => {
                this.filters.searchQuery = e.target.value.trim().toLowerCase();
                if (clearSearchBtn) {
                    clearSearchBtn.classList.toggle("show", this.filters.searchQuery.length > 0);
                }
                this.render();
            });
        }
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener("click", () => {
                if (searchInput) searchInput.value = "";
                this.filters.searchQuery = "";
                clearSearchBtn.classList.remove("show");
                this.render();
            });
        }

        // Status Tabs
        $$(".status-tab-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                $$(".status-tab-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                this.filters.status = btn.dataset.status;
                this.render();
            });
        });

        // Service Filter
        const serviceFilter = $("#adminServiceFilter");
        if (serviceFilter) {
            serviceFilter.addEventListener("change", (e) => {
                this.filters.service = e.target.value;
                this.render();
            });
        }

        // Sort Order
        const sortOrder = $("#adminSortOrder");
        if (sortOrder) {
            sortOrder.addEventListener("change", (e) => {
                this.filters.sort = e.target.value;
                this.render();
            });
        }

        // Reset Filters Button in Empty State
        const resetFiltersBtn = $("#resetFiltersBtn");
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener("click", () => {
                this.filters = { searchQuery: "", status: "all", service: "all", sort: "newest" };
                if (searchInput) searchInput.value = "";
                if (serviceFilter) serviceFilter.value = "all";
                if (sortOrder) sortOrder.value = "newest";
                $$(".status-tab-btn").forEach(b => b.classList.toggle("active", b.dataset.status === "all"));
                this.render();
                showAdminToast("Filter berhasil di-reset.");
            });
        }

        // Reset to Demo Button
        const resetDemoBtn = $("#resetDemoBtn");
        if (resetDemoBtn) {
            resetDemoBtn.addEventListener("click", () => {
                if (confirm("Kembalikan data pesanan ke sampel demo bawaan?")) {
                    this.orders = OrderStore.resetToDemo();
                    this.render();
                    showAdminToast("Data demo berhasil dimuat ulang.");
                }
            });
        }

        // Export Data to JSON
        const exportDataBtn = $("#exportDataBtn");
        if (exportDataBtn) {
            exportDataBtn.addEventListener("click", () => {
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.orders, null, 2));
                const downloadAnchor = document.createElement("a");
                downloadAnchor.setAttribute("href", dataStr);
                downloadAnchor.setAttribute("download", `digioffice_orders_${new Date().toISOString().split("T")[0]}.json`);
                document.body.appendChild(downloadAnchor);
                downloadAnchor.click();
                downloadAnchor.remove();
                showAdminToast("Data pesanan berhasil diekspor ke file JSON!");
            });
        }

        // Manual Order Modal
        this.initManualOrderModal();

        // Order Details Modal
        this.initDetailModal();
    },

    getFilteredOrders: function () {
        let list = [...this.orders];

        // Search filter
        if (this.filters.searchQuery) {
            const q = this.filters.searchQuery;
            list = list.filter(o =>
                o.id.toLowerCase().includes(q) ||
                o.customerName.toLowerCase().includes(q) ||
                o.customerPhone.includes(q) ||
                (o.notes && o.notes.toLowerCase().includes(q))
            );
        }

        // Status filter
        if (this.filters.status !== "all") {
            list = list.filter(o => o.status === this.filters.status);
        }

        // Service filter
        if (this.filters.service !== "all") {
            list = list.filter(o => o.service === this.filters.service);
        }

        // Sorting
        list.sort((a, b) => {
            if (this.filters.sort === "newest") {
                return new Date(b.createdAt) - new Date(a.createdAt);
            }
            if (this.filters.sort === "oldest") {
                return new Date(a.createdAt) - new Date(b.createdAt);
            }
            if (this.filters.sort === "highest") {
                return (b.estimatedPrice || 0) - (a.estimatedPrice || 0);
            }
            if (this.filters.sort === "lowest") {
                return (a.estimatedPrice || 0) - (b.estimatedPrice || 0);
            }
            return 0;
        });

        return list;
    },

    render: function () {
        this.renderKPIs();
        this.renderTable();
    },

    renderKPIs: function () {
        const total = this.orders.length;
        const pending = this.orders.filter(o => o.status === "Menunggu").length;
        const inProgress = this.orders.filter(o => o.status === "Diproses").length;
        const completed = this.orders.filter(o => o.status === "Selesai").length;
        const revenue = this.orders.reduce((acc, curr) => acc + (Number(curr.estimatedPrice) || 0), 0);

        if ($("#kpiTotalOrders")) $("#kpiTotalOrders").textContent = total;
        if ($("#kpiPendingOrders")) $("#kpiPendingOrders").textContent = pending;
        if ($("#kpiInProgressOrders")) $("#kpiInProgressOrders").textContent = inProgress;
        if ($("#kpiCompletedOrders")) $("#kpiCompletedOrders").textContent = completed;
        if ($("#kpiTotalRevenue")) $("#kpiTotalRevenue").textContent = formatRupiah(revenue);

        if ($("#totalRegisteredOrdersCount")) $("#totalRegisteredOrdersCount").textContent = total;
    },

    renderTable: function () {
        const filtered = this.getFilteredOrders();
        const tbody = $("#ordersTableBody");
        const emptyState = $("#emptyStateCard");
        const countDisplay = $("#visibleOrdersCount");

        if (countDisplay) countDisplay.textContent = filtered.length;

        if (!tbody) return;

        if (filtered.length === 0) {
            tbody.innerHTML = "";
            if (emptyState) emptyState.style.display = "block";
            return;
        }

        if (emptyState) emptyState.style.display = "none";

        tbody.innerHTML = filtered.map(order => {
            const timeObj = formatDateDisplay(order.createdAt);
            const statusClass = (order.status || "Menunggu").toLowerCase();

            // Deadline check
            let deadlineText = order.deadline || "-";
            let countdownHtml = "";
            if (order.deadline) {
                const targetD = new Date(order.deadline);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const diffTime = targetD - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays < 0) {
                    countdownHtml = `<span class="deadline-countdown urgent">Lewat ${Math.abs(diffDays)} hari</span>`;
                } else if (diffDays === 0) {
                    countdownHtml = `<span class="deadline-countdown urgent">Hari ini</span>`;
                } else if (diffDays === 1) {
                    countdownHtml = `<span class="deadline-countdown">Besok</span>`;
                } else {
                    countdownHtml = `<span class="deadline-countdown">${diffDays} hari lagi</span>`;
                }
            }

            // Clean phone for WA
            const cleanPhone = (order.customerPhone || "").replace(/\D/g, "");
            const formattedWa = cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone;
            const waChatUrl = `https://wa.me/${formattedWa}?text=${encodeURIComponent(`Halo Kak ${order.customerName}, kami dari DigiOffice ingin mengonfirmasi pesanan #${order.id} Anda.`)}`;

            // File display
            let fileDisplay = `<span class="text-dim">-</span>`;
            if (order.file) {
                fileDisplay = `
                    <div class="file-cell" title="${order.file.name}">
                        <span>📎</span>
                        <span>${order.file.name.length > 18 ? order.file.name.slice(0, 16) + '...' : order.file.name}</span>
                    </div>
                `;
            }

            return `
                <tr data-id="${order.id}">
                    <td>
                        <span class="order-id-badge">${order.id}</span>
                    </td>
                    <td>
                        <div class="order-time-col">
                            <strong>${timeObj.dateStr}</strong>
                            <span>${timeObj.timeStr}</span>
                        </div>
                    </td>
                    <td>
                        <div class="customer-cell">
                            <strong>${order.customerName}</strong>
                            <a href="${waChatUrl}" target="_blank" rel="noopener noreferrer" class="wa-link-inline">
                                💬 ${order.customerPhone}
                            </a>
                        </div>
                    </td>
                    <td>
                        <div class="service-badge">
                            <span>${order.service}</span>
                            <span class="speed-tag ${order.speed.toLowerCase()}">${order.speed}</span>
                        </div>
                    </td>
                    <td>
                        ${fileDisplay}
                    </td>
                    <td>
                        <div class="deadline-badge">${deadlineText}</div>
                        ${countdownHtml}
                    </td>
                    <td>
                        <strong class="font-mono text-blue">${formatRupiah(order.estimatedPrice || 0)}</strong>
                    </td>
                    <td>
                        <span class="status-pill ${statusClass}">● ${order.status}</span>
                    </td>
                    <td class="text-right">
                        <div class="actions-col">
                            <button type="button" class="action-btn view-detail-btn" data-id="${order.id}">Detail</button>
                            <button type="button" class="action-btn action-delete-btn delete-order-btn" data-id="${order.id}" title="Hapus pesanan">✕</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");

        // Attach event listeners for table buttons
        $$(".view-detail-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                this.openDetailModal(btn.dataset.id);
            });
        });

        $$(".delete-order-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.dataset.id;
                if (confirm(`Yakin ingin menghapus pesanan #${id}?`)) {
                    OrderStore.delete(id);
                    this.orders = OrderStore.getAll();
                    this.render();
                    showAdminToast(`Pesanan #${id} berhasil dihapus.`);
                }
            });
        });
    },

    // ==========================================================================
    // DETAIL MODAL LOGIC
    // ==========================================================================
    initDetailModal: function () {
        const modal = $("#orderDetailModal");
        const backdrop = $("#detailModalBackdrop");
        const closeBtn = $("#closeDetailModalBtn");
        const closeSec = $("#closeDetailModalSecondary");
        const deleteBtn = $("#modalDeleteOrderBtn");

        const close = () => {
            if (modal) {
                modal.classList.remove("open");
                modal.setAttribute("aria-hidden", "true");
            }
        };

        if (closeBtn) closeBtn.onclick = close;
        if (closeSec) closeSec.onclick = close;
        if (backdrop) backdrop.onclick = close;

        if (deleteBtn) {
            deleteBtn.onclick = () => {
                if (this.currentDetailId && confirm(`Hapus pesanan #${this.currentDetailId}?`)) {
                    OrderStore.delete(this.currentDetailId);
                    this.orders = OrderStore.getAll();
                    this.render();
                    close();
                    showAdminToast(`Pesanan #${this.currentDetailId} telah dihapus.`);
                }
            };
        }

        // Status switchers in modal
        $$(".btn-status-switch").forEach(btn => {
            btn.addEventListener("click", () => {
                const newStatus = btn.dataset.setStatus;
                if (this.currentDetailId) {
                    OrderStore.updateStatus(this.currentDetailId, newStatus);
                    this.orders = OrderStore.getAll();
                    this.render();

                    // Update active button state
                    $$(".btn-status-switch").forEach(b => b.classList.toggle("active", b.dataset.setStatus === newStatus));
                    showAdminToast(`Status pesanan #${this.currentDetailId} diubah menjadi "${newStatus}".`);
                }
            });
        });
    },

    openDetailModal: function (orderId) {
        const order = this.orders.find(o => o.id === orderId);
        const modal = $("#orderDetailModal");
        if (!order || !modal) return;

        this.currentDetailId = orderId;

        $("#modalOrderIdBadge").textContent = `#${order.id}`;
        const timeObj = formatDateDisplay(order.createdAt);
        $("#modalCreatedTime").textContent = `Diterima: ${timeObj.dateStr} pukul ${timeObj.timeStr}`;

        $("#modalCustName").textContent = order.customerName;
        $("#modalCustPhone").textContent = order.customerPhone;

        const cleanPhone = (order.customerPhone || "").replace(/\D/g, "");
        const formattedWa = cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone;
        const directWa = $("#modalDirectWaLink");
        if (directWa) {
            const template = `Halo Kak ${order.customerName}, kami dari DigiOffice ingin mengonfirmasi detail pesanan #${order.id} (${order.service}).`;
            directWa.href = `https://wa.me/${formattedWa}?text=${encodeURIComponent(template)}`;
        }

        $("#modalService").textContent = order.service;
        $("#modalSpeed").textContent = order.speed;
        $("#modalQuantity").textContent = `${order.quantity || 1} Unit`;
        $("#modalDeadline").textContent = order.deadline || "Tidak ditentukan";
        $("#modalPrice").textContent = formatRupiah(order.estimatedPrice || 0);

        // File
        const fileNameEl = $("#modalFileName");
        const fileSizeEl = $("#modalFileSize");
        if (order.file) {
            if (fileNameEl) fileNameEl.textContent = order.file.name;
            if (fileSizeEl) fileSizeEl.textContent = `Ukuran: ${order.file.size} (${order.file.ext})`;
        } else {
            if (fileNameEl) fileNameEl.textContent = "Tidak ada berkas yang dilampirkan";
            if (fileSizeEl) fileSizeEl.textContent = "Klien belum mengunggah file draft";
        }

        // Notes
        const notesEl = $("#modalNotes");
        if (notesEl) {
            notesEl.textContent = order.notes || "(Tidak ada catatan khusus)";
        }

        // Active status button
        $$(".btn-status-switch").forEach(btn => {
            btn.classList.toggle("active", btn.dataset.setStatus === order.status);
        });

        modal.classList.add("open");
        modal.setAttribute("aria-hidden", "false");
    },

    // ==========================================================================
    // MANUAL ORDER MODAL
    // ==========================================================================
    initManualOrderModal: function () {
        const modal = $("#manualOrderModal");
        const openBtn = $("#openManualOrderBtn");
        const closeBtn = $("#closeManualModalBtn");
        const closeSec = $("#closeManualModalSecondary");
        const backdrop = $("#manualModalBackdrop");
        const form = $("#manualOrderForm");

        const close = () => {
            if (modal) {
                modal.classList.remove("open");
                modal.setAttribute("aria-hidden", "true");
            }
        };

        if (openBtn) {
            openBtn.addEventListener("click", () => {
                if (form) form.reset();
                const deadlineInput = $("#manualDeadline");
                if (deadlineInput) {
                    const today = new Date().toISOString().split("T")[0];
                    deadlineInput.min = today;
                    deadlineInput.value = today;
                }
                modal.classList.add("open");
                modal.setAttribute("aria-hidden", "false");
            });
        }

        if (closeBtn) closeBtn.onclick = close;
        if (closeSec) closeSec.onclick = close;
        if (backdrop) backdrop.onclick = close;

        if (form) {
            form.addEventListener("submit", (e) => {
                e.preventDefault();

                const name = $("#manualName").value.trim();
                const phone = $("#manualPhone").value.trim();
                const service = $("#manualService").value;
                const speed = $("#manualSpeed").value;
                const deadline = $("#manualDeadline").value;
                const price = parseInt($("#manualPrice").value, 10) || 25000;
                const notes = $("#manualNotes").value.trim();

                const randomCode = Math.floor(1000 + Math.random() * 9000);
                const currentYear = new Date().getFullYear();
                const newId = `DGO-${currentYear}-${randomCode}`;

                const manualOrder = {
                    id: newId,
                    createdAt: new Date().toISOString(),
                    customerName: name,
                    customerPhone: phone,
                    service: service,
                    speed: speed,
                    quantity: 1,
                    deadline: deadline,
                    notes: notes || "Pesanan manual dicatat oleh admin.",
                    file: null,
                    estimatedPrice: price,
                    status: "Diproses"
                };

                OrderStore.add(manualOrder);
                this.orders = OrderStore.getAll();
                this.render();
                close();
                showAdminToast(`Pesanan #${newId} berhasil ditambahkan secara manual!`);
            });
        }
    }
};

// ==========================================================================
// BOOTSTRAP ON LOAD
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    AdminApp.init();
    console.log("DigiOffice Admin Portal Engine ready.");
});

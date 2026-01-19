/* ==============================
   ADMIN.JS - GESTION DES COMMANDES
============================== */

let allCommandes = [];

/* ========= LOAD ========= */

function loadCommandes() {
    const saved = localStorage.getItem('commandes');
    allCommandes = saved ? JSON.parse(saved) : [];
    displayCommandes(allCommandes);
    updateStats();
    initializeWilayaFilter();
}

/* ========= DISPLAY ========= */

function displayCommandes(commandes) {
    const tbody = document.getElementById('ordersTableBody');

    if (!commandes.length) {
        tbody.innerHTML = `<tr><td colspan="9">Aucune commande</td></tr>`;
        return;
    }

    tbody.innerHTML = commandes.map(cmd => `
        <tr>
            <td class="order-id">${cmd.orderNumber}</td>
            <td>${cmd.firstName} ${cmd.lastName}</td>
            <td>
                <span class="order-type ${cmd.orderType}">
                    ${cmd.orderType === 'domicile' ? '🏠 Domicile' : '🏪 Stop Desk'}
                </span>
            </td>
            <td>${cmd.wilaya}</td>
            <td>${cmd.phone1}</td>
            <td class="total-price">${cmd.grandTotal.toFixed(2)} DA</td>
            <td>
                <span class="status-badge-table ${getStatusClass(cmd.status || 'pending')}">
                    ${getStatusLabel(cmd.status || 'pending')}
                </span>
            </td>
            <td>
                <button onclick="showDetail('${cmd.orderNumber}')">Détails</button>
                <button class="delete-btn" onclick="deleteCommande('${cmd.orderNumber}')">🗑</button>
            </td>
        </tr>
    `).join('');
}

/* ========= DETAIL ========= */

function showDetail(orderNumber) {
    const cmd = allCommandes.find(c => c.orderNumber === orderNumber);
    if (!cmd) return;

    const modal = document.getElementById('detailModal');
    modal.dataset.currentOrderNumber = orderNumber;

    document.getElementById('detailOrderNumber').textContent = cmd.orderNumber;
    document.getElementById('detailDate').textContent = formatDateTime(cmd.date);
    document.getElementById('detailName').textContent = `${cmd.firstName} ${cmd.lastName}`;
    document.getElementById('detailPhone1').textContent = cmd.phone1;
    document.getElementById('detailPhone2').textContent = cmd.phone2 || '—';
    document.getElementById('detailWilaya').textContent = cmd.wilaya;
    document.getElementById('detailCommune').textContent = cmd.commune;

    const status = cmd.status || 'pending';
    const badge = document.getElementById('detailStatusBadge');
    badge.textContent = getStatusLabel(status);
    badge.className = 'status-badge-table ' + getStatusClass(status);

    document.getElementById('detailItems').innerHTML = cmd.cartItems.map(i => `
        <div class="item-entry">
            <div>
                <strong>${i.name}</strong><br>
                ${i.price} DA × ${i.quantity}
            </div>
            <div><strong>${(i.price * i.quantity).toFixed(2)} DA</strong></div>
        </div>
    `).join('');

    document.getElementById('detailCartTotal').textContent = cmd.cartTotal;
    document.getElementById('detailShipping').textContent = cmd.shippingPrice;
    document.getElementById('detailTotal').textContent = cmd.grandTotal.toFixed(2);

    modal.classList.add('active');
}

function closeDetail() {
    document.getElementById('detailModal').classList.remove('active');
}

/* ========= STATUS ========= */

function updateOrderStatus(newStatus) {
    const orderNumber = document.getElementById('detailModal').dataset.currentOrderNumber;
    const cmd = allCommandes.find(c => c.orderNumber === orderNumber);
    if (!cmd) return;

    cmd.status = newStatus;
    localStorage.setItem('commandes', JSON.stringify(allCommandes));

    filterCommandes();
    showNotification('Statut mis à jour');
}

/* ========= DELETE ========= */

function deleteCommande(orderNumber) {
    if (!confirm(`Supprimer la commande ${orderNumber} ?`)) return;

    allCommandes = allCommandes.filter(c => c.orderNumber !== orderNumber);
    localStorage.setItem('commandes', JSON.stringify(allCommandes));

    filterCommandes();
    updateStats();
    showNotification('Commande supprimée');
}

function deleteCommandeFromModal() {
    const orderNumber = document.getElementById('detailModal').dataset.currentOrderNumber;
    if (!orderNumber) return;

    if (!confirm(`Supprimer définitivement la commande ${orderNumber} ?`)) return;

    allCommandes = allCommandes.filter(c => c.orderNumber !== orderNumber);
    localStorage.setItem('commandes', JSON.stringify(allCommandes));

    closeDetail();
    filterCommandes();
    updateStats();
    showNotification('Commande supprimée');
}

/* ========= FILTER ========= */

function filterCommandes() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const type = document.getElementById('filterType').value;
    const wilaya = document.getElementById('filterWilaya').value;

    const filtered = allCommandes.filter(c => {
        return (
            c.orderNumber.toLowerCase().includes(search) ||
            c.firstName.toLowerCase().includes(search) ||
            c.lastName.toLowerCase().includes(search) ||
            c.phone1.includes(search)
        ) &&
        (!type || c.orderType === type) &&
        (!wilaya || c.wilaya === wilaya);
    });

    displayCommandes(filtered);
}

/* ========= STATS ========= */

function updateStats() {
    document.getElementById('totalCommandes').textContent = allCommandes.length;
    document.getElementById('totalRevenu').textContent =
        allCommandes.reduce((s, c) => s + c.grandTotal, 0).toFixed(2) + ' DA';
}

/* ========= WILAYA ========= */

function initializeWilayaFilter() {
    const select = document.getElementById('filterWilaya');
    select.innerHTML = '<option value="">Toutes les wilayas</option>';

    [...new Set(allCommandes.map(c => c.wilaya))].sort().forEach(w => {
        const o = document.createElement('option');
        o.value = w;
        o.textContent = w;
        select.appendChild(o);
    });
}

/* ========= UTILS ========= */

function getStatusClass(status) {
    return {
        pending: 'status-pending',
        accepted: 'status-accepted',
        shipped: 'status-shipped',
        arrived: 'status-arrived',
        returned: 'status-returned'
    }[status] || 'status-pending';
}

function getStatusLabel(status) {
    return {
        pending: '⏳ En attente',
        accepted: '✓ Acceptée',
        shipped: '🚚 En route',
        arrived: '📦 Arrivée',
        returned: '↩️ Retournée'
    }[status] || '⏳ En attente';
}

function showNotification(msg) {
    const n = document.createElement('div');
    n.textContent = msg;
    n.style.cssText = `
        position:fixed;
        top:20px;
        right:20px;
        background:#27ae60;
        color:#fff;
        padding:12px 18px;
        border-radius:5px;
        z-index:9999;
        font-weight:bold;
    `;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3000);
}

function formatDateTime(d) {
    return new Date(d).toLocaleString('fr-FR');
}

/* ========= AUTO REFRESH ========= */

window.addEventListener('storage', (e) => {
    if (e.key === 'commandes') {
        loadCommandes();
    }
});

/* ========= INIT ========= */

document.addEventListener('DOMContentLoaded', () => {
    loadCommandes();

    document.getElementById('searchInput').addEventListener('input', filterCommandes);
    document.getElementById('filterType').addEventListener('change', filterCommandes);
    document.getElementById('filterWilaya').addEventListener('change', filterCommandes);
});

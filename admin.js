// Charger toutes les commandes depuis le localStorage
let allCommandes = [];

function loadCommandes() {
    const saved = localStorage.getItem('commandes');
    allCommandes = saved ? JSON.parse(saved) : [];
    displayCommandes(allCommandes);
    updateStats();
    initializeWilayaFilter();
}

// Sauvegarder une nouvelle commande
function saveCommande(commande) {
    allCommandes.unshift(commande); // Ajouter au début
    localStorage.setItem('commandes', JSON.stringify(allCommandes));
}

// Afficher les commandes dans le tableau
function displayCommandes(commandes) {
    const tbody = document.getElementById('ordersTableBody');
    
    if (commandes.length === 0) {
        tbody.innerHTML = '<tr class="no-orders"><td colspan="8">Aucune commande trouvée</td></tr>';
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
            <td>${formatDate(cmd.date)}</td>
            <td>
                <button class="action-btn" onclick="showDetail('${cmd.orderNumber}')">Détails</button>
            </td>
        </tr>
    `).join('');
}

// Afficher les détails d'une commande
function showDetail(orderNumber) {
    const commande = allCommandes.find(c => c.orderNumber === orderNumber);
    if (!commande) return;
    
    document.getElementById('detailOrderNumber').textContent = orderNumber;
    document.getElementById('detailDate').textContent = formatDateTime(commande.date);
    document.getElementById('detailName').textContent = `${commande.firstName} ${commande.lastName}`;
    document.getElementById('detailPhone1').textContent = commande.phone1;
    document.getElementById('detailPhone2').textContent = commande.phone2 || '—';
    document.getElementById('detailOrderType').textContent = commande.orderType === 'domicile' ? '🏠 Livraison à domicile' : '🏪 Stop Desk';
    document.getElementById('detailWilaya').textContent = commande.wilaya;
    document.getElementById('detailCommune').textContent = commande.commune;
    
    // Afficher les produits
    const itemsHtml = commande.cartItems.map(item => `
        <div class="item-entry">
            <div>
                <strong>${item.name}</strong><br>
                <small>${item.price.toFixed(2)} DA x ${item.quantity}</small>
            </div>
            <div style="font-weight: bold;">${(item.price * item.quantity).toFixed(2)} DA</div>
        </div>
    `).join('');
    
    document.getElementById('detailItems').innerHTML = itemsHtml;
    document.getElementById('detailCartTotal').textContent = commande.cartTotal;
    document.getElementById('detailShipping').textContent = commande.shippingPrice;
    document.getElementById('detailTotal').textContent = commande.grandTotal.toFixed(2);
    
    document.getElementById('detailModal').classList.add('active');
}

function closeDetail() {
    document.getElementById('detailModal').classList.remove('active');
}

// Mettre à jour les statistiques
function updateStats() {
    const totalCommandes = allCommandes.length;
    const totalRevenu = allCommandes.reduce((sum, c) => sum + c.grandTotal, 0);
    const totalDomicile = allCommandes.filter(c => c.orderType === 'domicile').length;
    const totalStopdesk = allCommandes.filter(c => c.orderType === 'stopdesk').length;
    
    document.getElementById('totalCommandes').textContent = totalCommandes;
    document.getElementById('totalRevenu').textContent = totalRevenu.toFixed(2) + ' DA';
    document.getElementById('totalDomicile').textContent = totalDomicile;
    document.getElementById('totalStopdesk').textContent = totalStopdesk;
}

// Initialiser le filtre par wilaya
function initializeWilayaFilter() {
    const wilayaFilter = document.getElementById('filterWilaya');
    const wilayas = new Set(allCommandes.map(c => c.wilaya));
    
    // Garder l'option vide
    wilayaFilter.innerHTML = '<option value="">Toutes les wilayas</option>';
    
    Array.from(wilayas).sort().forEach(wilaya => {
        const option = document.createElement('option');
        option.value = wilaya;
        option.textContent = wilaya;
        wilayaFilter.appendChild(option);
    });
}

// Filtrer les commandes
function filterCommandes() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const filterType = document.getElementById('filterType').value;
    const filterWilaya = document.getElementById('filterWilaya').value;
    
    const filtered = allCommandes.filter(cmd => {
        const matchSearch = cmd.orderNumber.toLowerCase().includes(search) ||
                           cmd.firstName.toLowerCase().includes(search) ||
                           cmd.lastName.toLowerCase().includes(search) ||
                           cmd.phone1.includes(search);
        const matchType = !filterType || cmd.orderType === filterType;
        const matchWilaya = !filterWilaya || cmd.wilaya === filterWilaya;
        
        return matchSearch && matchType && matchWilaya;
    });
    
    displayCommandes(filtered);
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterType').value = '';
    document.getElementById('filterWilaya').value = '';
    displayCommandes(allCommandes);
}

// Exporter les commandes en CSV
function exportCommandes() {
    if (allCommandes.length === 0) {
        alert('Aucune commande à exporter');
        return;
    }
    
    let csv = 'N° Commande,Client,Téléphone,Type,Wilaya,Commune,Sous-total,Frais,Total,Date\n';
    
    allCommandes.forEach(cmd => {
        csv += `"${cmd.orderNumber}","${cmd.firstName} ${cmd.lastName}","${cmd.phone1}","${cmd.orderType}","${cmd.wilaya}","${cmd.commune}",${cmd.cartTotal},${cmd.shippingPrice},${cmd.grandTotal},"${formatDateTime(cmd.date)}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `commandes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Utilitaires de date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    loadCommandes();
    
    // Filtrage en temps réel
    document.getElementById('searchInput').addEventListener('input', filterCommandes);
    document.getElementById('filterType').addEventListener('change', filterCommandes);
    document.getElementById('filterWilaya').addEventListener('change', filterCommandes);
    
    // Fermer le modal en cliquant en dehors
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('detailModal');
        if (event.target === modal) {
            closeDetail();
        }
    });
});

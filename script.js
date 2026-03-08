let state = {
    invoices: [],
    expenses: [],
    tempItems: [],
    clients: [],
    payments: []
};

const DDL_FULL = `
<span class="sql-comment">-- SCHEMA REPLICATION FROM REQUIREMENTS</span>

<span class="sql-keyword">CREATE TABLE</span> Business (
    business_id <span class="sql-keyword">INT</span> <span class="sql-keyword">PRIMARY KEY</span>,
    name <span class="sql-keyword">VARCHAR2</span>(255),
    address <span class="sql-keyword">VARCHAR2</span>(255),
    contact_no <span class="sql-keyword">VARCHAR2</span>(20)
);

<span class="sql-keyword">CREATE TABLE</span> Client (
    client_id <span class="sql-keyword">INT</span> <span class="sql-keyword">PRIMARY KEY</span>,
    name <span class="sql-keyword">VARCHAR2</span>(255),
    email <span class="sql-keyword">VARCHAR2</span>(255),
    phone <span class="sql-keyword">VARCHAR2</span>(20)
);

<span class="sql-keyword">CREATE TABLE</span> Expense (
    expense_id <span class="sql-keyword">INT</span> <span class="sql-keyword">PRIMARY KEY</span>,
    expense_date <span class="sql-keyword">DATE</span>,
    amount <span class="sql-keyword">DECIMAL</span>(12,2),
    business_id <span class="sql-keyword">INT</span> <span class="sql-keyword">REFERENCES</span> Business(business_id)
);

<span class="sql-keyword">CREATE TABLE</span> Invoice (
    invoice_id <span class="sql-keyword">INT</span> <span class="sql-keyword">PRIMARY KEY</span>,
    invoice_date <span class="sql-keyword">DATE</span>,
    total_amount <span class="sql-keyword">DECIMAL</span>(12,2),
    client_id <span class="sql-keyword">INT</span> <span class="sql-keyword">REFERENCES</span> Client(client_id)
);

<span class="sql-keyword">CREATE TABLE</span> Invoice_Item (
    invoice_id <span class="sql-keyword">INT</span> <span class="sql-keyword">REFERENCES</span> Invoice(invoice_id),
    item_id <span class="sql-keyword">INT</span>,
    description <span class="sql-keyword">VARCHAR2</span>(255),
    quantity <span class="sql-keyword">INT</span>,
    price <span class="sql-keyword">DECIMAL</span>(10,2),
    expense_id <span class="sql-keyword">INT</span> <span class="sql-keyword">REFERENCES</span> Expense(expense_id),
    <span class="sql-keyword">PRIMARY KEY</span> (invoice_id, item_id)
);

<span class="sql-keyword">CREATE TABLE</span> Payment (
    invoice_id <span class="sql-keyword">INT</span> <span class="sql-keyword">REFERENCES</span> Invoice(invoice_id),
    payment_id <span class="sql-keyword">INT</span>,
    payment_date <span class="sql-keyword">DATE</span>,
    amount <span class="sql-keyword">DECIMAL</span>(12,2),
    <span class="sql-keyword">PRIMARY KEY</span> (invoice_id, payment_id)
);

<span class="sql-keyword">CREATE TABLE</span> Tax (
    tax_id <span class="sql-keyword">INT</span> <span class="sql-keyword">PRIMARY KEY</span>,
    tax_name <span class="sql-keyword">VARCHAR2</span>(100),
    tax_percentage <span class="sql-keyword">DECIMAL</span>(5,2)
);

<span class="sql-keyword">CREATE TABLE</span> Invoice_Tax (
    invoice_id <span class="sql-keyword">INT</span> <span class="sql-keyword">REFERENCES</span> Invoice(invoice_id),
    tax_id <span class="sql-keyword">INT</span> <span class="sql-keyword">REFERENCES</span> Tax(tax_id),
    <span class="sql-keyword">PRIMARY KEY</span> (invoice_id, tax_id)
);
`;

function switchTab(tab) {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('nav-active'));
    document.getElementById(`tab-${tab}`).classList.remove('hidden');
    document.getElementById(`nav-${tab}`).classList.add('nav-active');
    if(tab === 'dashboard') initCharts();
}

function openModal() { document.getElementById('modal-container').style.display = 'flex'; }
function closeModal() { document.getElementById('modal-container').style.display = 'none'; state.tempItems = []; renderTempItems(); }

function logSql(query) {
    const console = document.getElementById('sql-log');
    const entry = document.createElement('div');
    entry.className = "mb-6 pb-6 border-b border-[#111]";
    entry.innerHTML = `<span class="text-[#333]">-- DB_OPS: ${new Date().toLocaleTimeString()}</span><br>${query}`;
    console.prepend(entry);
}

function addTempItem() {
    const d = document.getElementById('item-desc').value;
    const q = parseInt(document.getElementById('item-qty').value);
    const p = parseFloat(document.getElementById('item-price').value);
    if(!d || !q || !p) return;
    state.tempItems.push({ description: d, quantity: q, price: p });
    renderTempItems();
    document.getElementById('item-desc').value = '';
    document.getElementById('item-qty').value = '';
    document.getElementById('item-price').value = '';
}

function renderTempItems() {
    document.getElementById('temp-items').innerHTML = state.tempItems.map(i => `
        <div class="flex justify-between text-[10px] font-bold text-neutral-500 tracking-widest border-b border-[#111] pb-2">
            <span>${i.description} (x${i.quantity})</span>
            <span>₹${(i.quantity * i.price).toLocaleString()}</span>
        </div>
    `).join('');
}

function handleInvoice(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const clientName = formData.get('client');
    const taxId = formData.get('tax_id');
    const subtotal = state.tempItems.reduce((a, b) => a + (b.quantity * b.price), 0);
    const invoice_id = 1000 + state.invoices.length;
    const client_id = 500 + state.clients.length;

    if(state.tempItems.length === 0) return alert("Add items first");

    state.clients.push({ id: client_id, name: clientName });
    state.invoices.push({ invoice_id, client_id, clientName, total_amount: subtotal, date: new Date().toLocaleDateString(), status: 'UNPAID' });

    let sql = `<span class="sql-keyword">INSERT INTO</span> Client (client_id, name) <span class="sql-keyword">VALUES</span> (${client_id}, '${clientName}');<br>`;
    sql += `<span class="sql-keyword">INSERT INTO</span> Invoice (invoice_id, invoice_date, total_amount, client_id) <span class="sql-keyword">VALUES</span> (${invoice_id}, SYSDATE, ${subtotal}, ${client_id});<br>`;
    
    state.tempItems.forEach((item, idx) => {
        sql += `<span class="sql-keyword">INSERT INTO</span> Invoice_Item (invoice_id, item_id, description, quantity, price) <span class="sql-keyword">VALUES</span> (${invoice_id}, ${idx+1}, '${item.description}', ${item.quantity}, ${item.price});<br>`;
    });

    sql += `<span class="sql-keyword">INSERT INTO</span> Invoice_Tax (invoice_id, tax_id) <span class="sql-keyword">VALUES</span> (${invoice_id}, ${taxId});`;
    logSql(sql);

    updateStats();
    renderInvoices();
    closeModal();
    e.target.reset();
}

function handleExpense(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const amount = parseFloat(formData.get('amount'));
    const desc = formData.get('desc');
    const expense_id = 9000 + state.expenses.length;

    state.expenses.push({ expense_id, desc, amount, date: new Date().toLocaleDateString() });

    logSql(`<span class="sql-keyword">INSERT INTO</span> Expense (expense_id, expense_date, amount, business_id) <span class="sql-keyword">VALUES</span> (${expense_id}, SYSDATE, ${amount}, 1);`);

    updateStats();
    renderExpenses();
    closeModal();
    e.target.reset();
}

function recordPayment(invId, amt) {
    const inv = state.invoices.find(i => i.invoice_id === invId);
    const payId = state.payments.length + 1;
    inv.status = 'PAID';
    state.payments.push({ invoice_id: invId, payment_id: payId, amount: amt });

    logSql(`<span class="sql-keyword">INSERT INTO</span> Payment (invoice_id, payment_id, payment_date, amount) <span class="sql-keyword">VALUES</span> (${invId}, ${payId}, SYSDATE, ${amt});<br><span class="sql-comment">-- Status integrity maintained in application layer</span>`);
    
    updateStats();
    renderInvoices();
}

function updateStats() {
    const rev = state.invoices.filter(i => i.status === 'PAID').reduce((a,b) => a + b.total_amount, 0);
    const pen = state.invoices.filter(i => i.status === 'UNPAID').reduce((a,b) => a + b.total_amount, 0);
    const exp = state.expenses.reduce((a,b) => a + b.amount, 0);

    document.getElementById('stat-revenue').innerText = `₹${rev.toLocaleString()}`;
    document.getElementById('stat-expenses').innerText = `₹${exp.toLocaleString()}`;
    document.getElementById('stat-pending').innerText = `₹${pen.toLocaleString()}`;
    document.getElementById('stat-net').innerText = `₹${(rev - exp).toLocaleString()}`;
    initCharts();
}

function renderInvoices() {
    document.getElementById('invoice-list').innerHTML = state.invoices.map(i => `
        <tr class="group hover:bg-[#050505] transition">
            <td class="py-10 font-mono text-[11px] text-neutral-600">${i.invoice_id}</td>
            <td class="py-10 font-bold tracking-tight">${i.clientName.toUpperCase()}</td>
            <td class="py-10 text-neutral-500 text-xs">${i.date}</td>
            <td class="py-10 font-black">₹${i.total_amount.toLocaleString()}</td>
            <td class="py-10 text-right">
                ${i.status === 'UNPAID' ? `<button onclick="recordPayment(${i.invoice_id}, ${i.total_amount})" class="text-[10px] font-black border border-white bg-white text-black px-6 py-2 rounded-full hover:bg-black hover:text-white transition uppercase">Pay</button>` : `<span class="label-minimal text-green-500">RELATIONAL_PAID</span>`}
            </td>
        </tr>
    `).join('');
}

function renderExpenses() {
    document.getElementById('expense-list').innerHTML = state.expenses.map(e => `
        <div class="card-oled p-12 rounded-lg flex justify-between items-center">
            <div>
                <p class="label-minimal mb-3">ID: ${e.expense_id}</p>
                <h4 class="text-xl font-bold tracking-tight">${e.desc.toUpperCase()}</h4>
                <p class="text-xs text-neutral-600 mt-2">${e.date}</p>
            </div>
            <p class="text-2xl font-black">₹${e.amount.toLocaleString()}</p>
        </div>
    `).join('');
}

function initCharts() {
    const ctxBar = document.getElementById('barChart').getContext('2d');
    const ctxDoughnut = document.getElementById('doughnutChart').getContext('2d');
    if(window.bChart) window.bChart.destroy();
    if(window.dChart) window.dChart.destroy();

    const rev = state.invoices.filter(i => i.status === 'PAID').reduce((a,b) => a + b.total_amount, 0);
    const exp = state.expenses.reduce((a,b) => a + b.amount, 0);

    window.bChart = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: ['CURRENT'],
            datasets: [
                { label: 'REVENUE', data: [rev], backgroundColor: '#ffffff', barThickness: 50 },
                { label: 'EXPENSE', data: [exp], backgroundColor: '#222', barThickness: 50 }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: '#111' }, ticks: { color: '#444' } }, x: { grid: { display: false }, ticks: { color: '#444' } } } }
    });

    window.dChart = new Chart(ctxDoughnut, {
        type: 'doughnut',
        data: {
            labels: ['GST', 'VAT', 'BASE'],
            datasets: [{ data: [18, 5, 77], backgroundColor: ['#fff', '#666', '#111'], borderWidth: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '85%', plugins: { legend: { position: 'bottom', labels: { color: '#555', font: { size: 10, weight: 'bold' } } } } }
    });
}

window.onload = () => {
    initCharts();
    document.getElementById('sql-log').innerHTML = DDL_FULL;
};

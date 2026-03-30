// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCpxVy__1TX6Tozlqd1aN4qNnHUWCcPelU",
    authDomain: "invoice-74d0d.firebaseapp.com",
    projectId: "invoice-74d0d",
    storageBucket: "invoice-74d0d.firebasestorage.app",
    messagingSenderId: "603765578005",
    appId: "1:603765578005:web:919cac432e04abbb55311c",
    measurementId: "G-EB5CSTGWL9"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

let authMode = 'login';
let isDemo = false;

let state = {
    invoices: [],
    expenses: [],
    tempItems: [],
    clients: [],
    payments: []
};

const DDL_FULL = `
<span class="sql-comment">-- SCHEMA REPLICATION FROM REQUIREMENTS</span>

<span class="sql-keyword">CREATE TABLE</span> App_User (
    user_id <span class="sql-keyword">VARCHAR2</span>(128) <span class="sql-keyword">PRIMARY KEY</span>,
    email <span class="sql-keyword">VARCHAR2</span>(255)
);

<span class="sql-keyword">CREATE TABLE</span> Business (
    business_id <span class="sql-keyword">INT</span> <span class="sql-keyword">PRIMARY KEY</span>,
    user_id <span class="sql-keyword">VARCHAR2</span>(128) <span class="sql-keyword">REFERENCES</span> App_User(user_id),
    name <span class="sql-keyword">VARCHAR2</span>(255),
    address <span class="sql-keyword">VARCHAR2</span>(255),
    contact_no <span class="sql-keyword">VARCHAR2</span>(20)
);

<span class="sql-keyword">CREATE TABLE</span> Client (
    client_id <span class="sql-keyword">INT</span> <span class="sql-keyword">PRIMARY KEY</span>,
    user_id <span class="sql-keyword">VARCHAR2</span>(128) <span class="sql-keyword">REFERENCES</span> App_User(user_id),
    name <span class="sql-keyword">VARCHAR2</span>(255),
    email <span class="sql-keyword">VARCHAR2</span>(255),
    phone <span class="sql-keyword">VARCHAR2</span>(20)
);

<span class="sql-keyword">CREATE TABLE</span> Expense (
    expense_id <span class="sql-keyword">INT</span> <span class="sql-keyword">PRIMARY KEY</span>,
    user_id <span class="sql-keyword">VARCHAR2</span>(128) <span class="sql-keyword">REFERENCES</span> App_User(user_id),
    expense_date <span class="sql-keyword">DATE</span>,
    amount <span class="sql-keyword">DECIMAL</span>(12,2),
    business_id <span class="sql-keyword">INT</span> <span class="sql-keyword">REFERENCES</span> Business(business_id)
);

<span class="sql-keyword">CREATE TABLE</span> Invoice (
    invoice_id <span class="sql-keyword">INT</span> <span class="sql-keyword">PRIMARY KEY</span>,
    user_id <span class="sql-keyword">VARCHAR2</span>(128) <span class="sql-keyword">REFERENCES</span> App_User(user_id),
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
    user_id <span class="sql-keyword">VARCHAR2</span>(128) <span class="sql-keyword">REFERENCES</span> App_User(user_id),
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

// AUTHENTICATION LOGIC
function setAuthMode(mode) {
    authMode = mode;
}

function submitRegister() {
    setAuthMode('register');
    const dummyEvent = { preventDefault: () => {} };
    handleAuth(dummyEvent);
}

function loadDemo() {
    isDemo = true;
    document.getElementById('auth-overlay').classList.add('opacity-0', 'pointer-events-none');
    setTimeout(() => {
        document.getElementById('auth-overlay').classList.add('hidden');
        document.getElementById('app-container').classList.remove('opacity-0', 'pointer-events-none');
        initCharts();
    }, 500);
}

function showAuthError(msg) {
    const err = document.getElementById('auth-error');
    err.innerText = msg;
    err.classList.remove('hidden');
}

async function handleAuth(e) {
    if (e && e.preventDefault) e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    
    try {
        if (authMode === 'login') {
            await auth.signInWithEmailAndPassword(email, password);
        } else {
            const cred = await auth.createUserWithEmailAndPassword(email, password);
            await db.collection('App_User').doc(cred.user.uid).set({ email });
            logSql(`<span class="sql-keyword">INSERT INTO</span> App_User (user_id, email) <span class="sql-keyword">VALUES</span> ('${cred.user.uid}', '${email}');<br>`);
        }
    } catch (error) {
        showAuthError(error.message);
    }
}

function handleLogout() {
    if (isDemo) {
        window.location.reload();
        return;
    }
    auth.signOut().then(() => {
        window.location.reload();
    });
}

auth.onAuthStateChanged(async (user) => {
    if (user && !isDemo) {
        // User is signed in.
        document.getElementById('auth-error').classList.add('hidden');
        document.getElementById('auth-overlay').classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => {
            document.getElementById('auth-overlay').classList.add('hidden');
            document.getElementById('app-container').classList.remove('opacity-0', 'pointer-events-none');
        }, 500);
        
        // Fetch data
        await fetchUserData(user.uid);
        updateStats();
        renderInvoices();
        renderExpenses();
    } else if (!isDemo) {
        // User is signed out.
        document.getElementById('app-container').classList.add('opacity-0', 'pointer-events-none');
        document.getElementById('auth-overlay').classList.remove('hidden');
        setTimeout(() => {
            document.getElementById('auth-overlay').classList.remove('opacity-0', 'pointer-events-none');
        }, 10);
    }
});

async function fetchUserData(uid) {
    const fetchCollection = async (coll) => {
        try {
            const snapshot = await db.collection(coll).where('userId', '==', uid).get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch(e) {
            console.error("Error fetching", coll, e);
            return [];
        }
    };
    
    state.clients = await fetchCollection('clients');
    state.invoices = await fetchCollection('invoices');
    state.expenses = await fetchCollection('expenses');
    state.payments = await fetchCollection('payments');
}

// APP LOGIC
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
    const logConsole = document.getElementById('sql-log');
    if (!logConsole) return;
    const entry = document.createElement('div');
    entry.className = "mb-6 pb-6 border-b border-[#111]";
    entry.innerHTML = `<span class="text-[#333]">-- DB_OPS: ${new Date().toLocaleTimeString()}</span><br>${query}`;
    logConsole.prepend(entry);
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

async function handleInvoice(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const clientName = formData.get('client');
    const taxId = formData.get('tax_id');
    const subtotal = state.tempItems.reduce((a, b) => a + (b.quantity * b.price), 0);
    const invoice_id = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 10000);
    const client_id = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 10000) + 50000;
    const uid = (!isDemo && auth.currentUser) ? auth.currentUser.uid : 'DEMO_USER';

    if(state.tempItems.length === 0) return alert("Add items first");

    const newClient = { id: client_id.toString(), client_id, userId: uid, name: clientName };
    const newInvoice = { 
        id: invoice_id.toString(), 
        invoice_id, 
        client_id, 
        userId: uid,
        clientName, 
        total_amount: subtotal, 
        date: new Date().toLocaleDateString(), 
        status: 'UNPAID',
        items: [...state.tempItems],
        taxId
    };

    if (!isDemo && auth.currentUser) {
        await db.collection('clients').doc(newClient.id).set(newClient);
        await db.collection('invoices').doc(newInvoice.id).set(newInvoice);
    }

    state.clients.push(newClient);
    state.invoices.push(newInvoice);

    let sql = `<span class="sql-keyword">INSERT INTO</span> Client (client_id, user_id, name) <span class="sql-keyword">VALUES</span> (${client_id}, '${uid}', '${clientName}');<br>`;
    sql += `<span class="sql-keyword">INSERT INTO</span> Invoice (invoice_id, user_id, invoice_date, total_amount, client_id) <span class="sql-keyword">VALUES</span> (${invoice_id}, '${uid}', SYSDATE, ${subtotal}, ${client_id});<br>`;
    
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

async function handleExpense(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const amount = parseFloat(formData.get('amount'));
    const desc = formData.get('desc');
    const expense_id = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 10000) + 90000;
    const uid = (!isDemo && auth.currentUser) ? auth.currentUser.uid : 'DEMO_USER';

    const newExpense = {
        id: expense_id.toString(),
        expense_id, 
        userId: uid,
        desc, 
        amount, 
        date: new Date().toLocaleDateString() 
    };

    if (!isDemo && auth.currentUser) {
        await db.collection('expenses').doc(newExpense.id).set(newExpense);
    }

    state.expenses.push(newExpense);

    logSql(`<span class="sql-keyword">INSERT INTO</span> Expense (expense_id, user_id, expense_date, amount, business_id) <span class="sql-keyword">VALUES</span> (${expense_id}, '${uid}', SYSDATE, ${amount}, 1);`);

    updateStats();
    renderExpenses();
    closeModal();
    e.target.reset();
}

async function recordPayment(invId, amt) {
    const inv = state.invoices.find(i => i.invoice_id === invId);
    if (!inv) return;
    
    const payId = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 10000) + 100000;
    const uid = (!isDemo && auth.currentUser) ? auth.currentUser.uid : 'DEMO_USER';
    inv.status = 'PAID';
    
    const newPayment = {
        id: payId.toString(),
        invoice_id: invId, 
        payment_id: payId, 
        userId: uid,
        amount: amt,
        date: new Date().toLocaleDateString()
    };

    if (!isDemo && auth.currentUser) {
        await db.collection('invoices').doc(inv.id.toString()).update({ status: 'PAID' });
        await db.collection('payments').doc(newPayment.id).set(newPayment);
    }

    state.payments.push(newPayment);

    logSql(`<span class="sql-keyword">INSERT INTO</span> Payment (invoice_id, payment_id, user_id, payment_date, amount) <span class="sql-keyword">VALUES</span> (${invId}, ${payId}, '${uid}', SYSDATE, ${amt});<br><span class="sql-comment">-- Status integrity maintained in application layer</span>`);
    
    updateStats();
    renderInvoices();
}

async function deleteExpense(expense_id) {
    state.expenses = state.expenses.filter(e => e.expense_id !== expense_id);
    if (!isDemo && auth.currentUser) {
        try {
            const snapshot = await db.collection('expenses').where('expense_id', '==', expense_id).get();
            snapshot.forEach(doc => doc.ref.delete());
        } catch(e) { console.error(e); }
    }
    logSql(`<span class="sql-keyword">DELETE FROM</span> Expense <span class="sql-keyword">WHERE</span> expense_id = ${expense_id};`);
    updateStats();
    renderExpenses();
}

function updateStats() {
    const rev = state.invoices.filter(i => i.status === 'PAID').reduce((a,b) => a + b.total_amount, 0);
    const pen = state.invoices.filter(i => i.status === 'UNPAID').reduce((a,b) => a + b.total_amount, 0);
    const exp = state.expenses.reduce((a,b) => a + b.amount, 0);

    const statRev = document.getElementById('stat-revenue');
    if(statRev) statRev.innerText = `₹${rev.toLocaleString()}`;
    
    const statExp = document.getElementById('stat-expenses');
    if(statExp) statExp.innerText = `₹${exp.toLocaleString()}`;
    
    const statPen = document.getElementById('stat-pending');
    if(statPen) statPen.innerText = `₹${pen.toLocaleString()}`;
    
    const statNet = document.getElementById('stat-net');
    if(statNet) statNet.innerText = `₹${(rev - exp).toLocaleString()}`;
    
    const statBurn = document.getElementById('stat-burn');
    const statVariance = document.getElementById('stat-variance');
    
    // Average Burn Rate per month (simplistic: total expense / 1)
    if(statBurn) statBurn.innerText = `₹${(exp).toLocaleString()}`;
    
    // Budget Variance: simplistic logic (revenue vs expense percentage difference)
    const variance = rev ? (((rev - exp) / rev) * 100).toFixed(1) : 0;
    if(statVariance) {
        statVariance.innerText = `${variance}%`;
        statVariance.className = `text-3xl font-black tracking-tighter ${variance >= 0 ? 'text-blue-500' : 'text-red-500'}`;
    }

    initCharts();
}

function renderInvoices() {
    const invList = document.getElementById('invoice-list');
    if(!invList) return;
    invList.innerHTML = state.invoices.map(i => `
        <tr class="group hover:bg-[#050505] hover-inverted transition border-b border-transparent">
            <td class="py-4 font-mono text-xs text-neutral-600 font-bold">REF-${i.invoice_id.toString().slice(-3)}</td>
            <td class="py-4 font-black tracking-widest text-xs uppercase">${(i.clientName || 'CLIENT').substring(0,20)}</td>
            <td class="py-4 text-sm text-neutral-300 theme-text">${i.items && i.items.length ? i.items[0].description : 'Standard Service'}</td>
            <td class="py-4 font-black text-right pr-4">₹${i.total_amount.toLocaleString()}</td>
            <td class="py-4 text-center cursor-pointer flex items-center justify-center h-full">
                ${i.status === 'UNPAID' ? `<button onclick="recordPayment(${i.invoice_id}, ${i.total_amount})" class="text-[10px] font-black border border-[#333] hover-inverted border-inverted bg-transparent text-neutral-500 hover:text-white px-4 py-1 rounded hover:bg-[#111] transition uppercase m-auto">Pay</button>` : `<span class="label-minimal text-green-500">PAID</span>`}
            </td>
        </tr>
    `).join('');
    
    const countBtn = document.getElementById('invoice-count-btn');
    if(countBtn) countBtn.innerText = `${state.invoices.length} RECORDS`;
}

function renderExpenses() {
    const expList = document.getElementById('expense-list');
    if(!expList) return;
    expList.innerHTML = state.expenses.map(e => `
        <tr class="group hover:bg-[#050505] hover-inverted transition border-b border-transparent">
            <td class="py-4 font-mono text-xs text-neutral-600 font-bold">REF-${e.expense_id.toString().slice(-3)}</td>
            <td class="py-4 font-black tracking-widest text-xs uppercase">EXPENSE</td>
            <td class="py-4 text-sm text-neutral-300 theme-text">${(e.desc || 'General').substring(0,30)}</td>
            <td class="py-4 font-black text-right pr-4">₹${e.amount.toLocaleString()}</td>
            <td class="py-4 text-center cursor-pointer flex items-center justify-center h-full">
                <button onclick="deleteExpense(${e.expense_id})" class="w-6 h-6 rounded flex items-center justify-center hover:bg-neutral-800 text-neutral-600 hover:text-white transition m-auto font-mono text-xs opacity-50 hover:opacity-100"><i class="fas fa-times text-xs"></i></button>
            </td>
        </tr>
    `).join('');
    
    const countBtn = document.getElementById('expense-count-btn');
    if(countBtn) countBtn.innerText = `${state.expenses.length} RECORDS`;
}

function initCharts() {
    const barEl = document.getElementById('barChart');
    const doughnutEl = document.getElementById('doughnutChart');
    const lineEl = document.getElementById('lineChart');
    const radarEl = document.getElementById('radarChart');
    if (!barEl || !doughnutEl) return;

    const ctxBar = barEl.getContext('2d');
    const ctxDoughnut = doughnutEl.getContext('2d');
    if(window.bChart) window.bChart.destroy();
    if(window.dChart) window.dChart.destroy();
    if(window.lChart) window.lChart.destroy();
    if(window.rChart) window.rChart.destroy();

    const rev = state.invoices.filter(i => i.status === 'PAID').reduce((a,b) => a + b.total_amount, 0);
    const exp = state.expenses.reduce((a,b) => a + b.amount, 0);

    const activeTheme = localStorage.getItem('invoices_theme') || 'dark';
    const isLightMode = activeTheme === 'light';
    const isCoffeeMode = activeTheme === 'coffee';

    const gridColor = isLightMode ? '#e2e8f0' : (isCoffeeMode ? '#2e201c' : '#111');
    const textColor = isLightMode ? '#64748b' : (isCoffeeMode ? '#8a6c5f' : '#555');
    const barRevColor = isLightMode ? '#3b82f6' : (isCoffeeMode ? '#e6d3c8' : '#ffffff');
    const barExpColor = isLightMode ? '#f43f5e' : (isCoffeeMode ? '#362521' : '#222');

    window.bChart = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: ['CURRENT'],
            datasets: [
                { label: 'REVENUE', data: [rev], backgroundColor: barRevColor, barThickness: 50 },
                { label: 'EXPENSE', data: [exp], backgroundColor: barExpColor, barThickness: 50 }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: gridColor }, ticks: { color: textColor } }, x: { grid: { display: false }, ticks: { color: textColor } } } }
    });

    window.dChart = new Chart(ctxDoughnut, {
        type: 'doughnut',
        data: {
            labels: ['GST', 'VAT', 'BASE'],
            datasets: [{ data: [18, 5, 77], backgroundColor: isLightMode ? ['#3b82f6', '#94a3b8', '#e2e8f0'] : ['#fff', '#666', '#111'], borderWidth: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '85%', plugins: { legend: { position: 'bottom', labels: { color: textColor, font: { size: 10, weight: 'bold' } } } } }
    });

    if (lineEl) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        let monthlyData = new Array(12).fill(0);
        state.expenses.forEach(e => {
            let d = new Date(e.date);
            if(!isNaN(d)) monthlyData[d.getMonth()] += e.amount;
        });
        let currentMonth = new Date().getMonth();
        let lineLabels = [];
        let lineData = [];
        for(let i=5; i>=0; i--) {
            let m = currentMonth - i;
            if(m < 0) m += 12; // wrap around
            lineLabels.push(months[m]);
            lineData.push(monthlyData[m]);
        }

        window.lChart = new Chart(lineEl.getContext('2d'), {
            type: 'line',
            data: {
                labels: lineLabels,
                datasets: [{ label: 'EXPENSES', data: lineData, borderColor: isLightMode ? '#f43f5e' : '#fff', backgroundColor: isLightMode ? 'rgba(244,63,94,0.1)' : 'rgba(255,255,255,0.1)', tension: 0.4, fill: true }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: gridColor }, ticks: { color: textColor } }, x: { grid: { color: gridColor }, ticks: { color: textColor } } } }
        });
    }

    if (radarEl) {
        let dist = { 'OpEx': 0, 'CapEx': 0, 'Taxes': 0, 'Payroll': 0, 'Marketing': 0 };
        let hasDist = false;
        state.expenses.forEach(e => {
            let text = (e.desc || '').toLowerCase();
            hasDist = true;
            if(text.includes('tax') || text.includes('gst') || text.includes('vat')) dist['Taxes'] += e.amount;
            else if(text.includes('pay') || text.includes('salary') || text.includes('wage')) dist['Payroll'] += e.amount;
            else if(text.includes('ad') || text.includes('market') || text.includes('campaign')) dist['Marketing'] += e.amount;
            else if(text.includes('equip') || text.includes('server') || text.includes('capital')) dist['CapEx'] += e.amount;
            else dist['OpEx'] += e.amount;
        });
        
        // Initial mock data if empty
        if (!hasDist || exp === 0) {
            dist = { 'OpEx': 65, 'CapEx': 59, 'Taxes': 90, 'Payroll': 81, 'Marketing': 56 };
        }

        window.rChart = new Chart(radarEl.getContext('2d'), {
            type: 'radar',
            data: {
                labels: Object.keys(dist),
                datasets: [{ label: 'DISTRIBUTION', data: Object.values(dist), backgroundColor: isLightMode ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.2)', borderColor: isLightMode ? '#3b82f6' : '#fff', pointBackgroundColor: isLightMode ? '#3b82f6' : '#fff' }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { r: { grid: { color: gridColor }, angleLines: { color: gridColor }, pointLabels: { color: textColor } } } }
        });
    }
}

window.onload = () => {
    // Only init things that don't depend on auth
    const sqlLog = document.getElementById('sql-log');
    if(sqlLog) sqlLog.innerHTML = DDL_FULL;
};

// ====== NEW THEME, CALCULATOR & DETAIL CHART LOGIC ======

// Theme Logic
let currentThemeIndex = 0;
const themes = ['dark', 'light', 'coffee'];
function toggleTheme() {
    currentThemeIndex = (currentThemeIndex + 1) % themes.length;
    const activeTheme = themes[currentThemeIndex];
    document.body.className = `overflow-x-hidden theme-${activeTheme}`;
    
    const themeBtn = document.getElementById('theme-btn-sidebar');
    if (themeBtn) {
        themeBtn.innerText = `Theme: ${activeTheme}`;
    }
    localStorage.setItem('invoices_theme', activeTheme);
    initCharts(); // Re-render charts with new theme colors
}

// Check saved theme on load
window.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('invoices_theme') || 'dark';
    if (savedTheme !== 'dark') {
        currentThemeIndex = Math.max(0, themes.indexOf(savedTheme));
        document.body.className = `overflow-x-hidden theme-${savedTheme}`;
    }
    const themeBtn = document.getElementById('theme-btn-sidebar');
    if (themeBtn) {
        themeBtn.innerText = `Theme: ${savedTheme}`;
    }
});

// Detailed Chart Modal
let detailedChart = null;
function openChartModal(originalCanvasId) {
    const origChartRef = {
        'barChartModalCanvas': window.bChart,
        'doughnutChartModalCanvas': window.dChart,
        'lineChartModalCanvas': window.lChart,
        'radarChartModalCanvas': window.rChart,
    }[originalCanvasId];

    if (!origChartRef) return;
    
    document.getElementById('chart-modal').style.display = 'flex';
    const canvas = document.getElementById('detailedChartCanvas');
    const ctx = canvas.getContext('2d');
    
    if (detailedChart) { detailedChart.destroy(); }
    
    const chartTitleMap = {
        'barChartModalCanvas': 'Allocated vs Utilized',
        'doughnutChartModalCanvas': 'Tax Component Analysis',
        'lineChartModalCanvas': 'Expense Velocity (Trend)',
        'radarChartModalCanvas': 'Cash Flow Distribution'
    };
    document.getElementById('chart-modal-title').innerText = chartTitleMap[originalCanvasId] || 'Graph Detail';
    
    // Clone config safely
    const config = {
        type: origChartRef.config.type,
        data: origChartRef.config.data,
        options: JSON.parse(JSON.stringify(origChartRef.config.options))
    };
    config.options.maintainAspectRatio = false;
    config.options.plugins = config.options.plugins || {};
    config.options.plugins.legend = { display: true, position: 'top', labels: { color: document.body.classList.contains('theme-light') ? '#0f172a' : '#fff' } };
    
    detailedChart = new Chart(ctx, config);
}

function closeChartModal() {
    document.getElementById('chart-modal').style.display = 'none';
    if (detailedChart) {
        detailedChart.destroy();
        detailedChart = null;
    }
}

// KPI Detail Modal
function openKpiModal(type) {
    document.getElementById('kpi-modal').style.display = 'flex';
    
    const kpiData = {
        'revenue': { title: 'Invoiced Total', vId: 'stat-revenue', desc: 'Displays the total cumulative amount calculated from all successfully processed invoices marked as "PAID" in the system ledger.' },
        'expenses': { title: 'Expense Outflow', vId: 'stat-expenses', desc: 'Represents the total cash outflow across all categorized business expenses currently tracked.' },
        'pending': { title: 'Payment Pending', vId: 'stat-pending', desc: 'Calculates the sum of all officially issued invoices that currently hold an "UNPAID" status and are awaiting client fulfillment.' },
        'net': { title: 'Net Liquidity', vId: 'stat-net', desc: 'The pure mathematical difference between your Total Invoiced Revenue (PAID) and your total recorded Business Expenses. Provides a snapshot of pure numeric liquidity.' },
        'burn': { title: 'Burn Rate (Avg/Mo)', vId: 'stat-burn', desc: 'A standardized projection of your total current expenses. Useful for extrapolating runaways.' },
        'variance': { title: 'Budget Variance', vId: 'stat-variance', desc: 'A proportional percentage calculation: ((Revenue - Expenses) / Revenue) * 100. Measures operational profit margin efficiency.' }
    }[type];
    
    if (kpiData) {
        document.getElementById('kpi-modal-title').innerText = kpiData.title;
        document.getElementById('kpi-modal-value').innerText = document.getElementById(kpiData.vId).innerText;
        document.getElementById('kpi-modal-desc').innerText = kpiData.desc;
        
        if (type === 'variance') {
            document.getElementById('kpi-modal-value').className = document.getElementById(kpiData.vId).className.replace('text-3xl', 'text-7xl break-words theme-text');
        } else if (type === 'burn') {
            document.getElementById('kpi-modal-value').className = "text-7xl font-black tracking-tighter text-red-500 break-words";
        } else {
            document.getElementById('kpi-modal-value').className = "text-7xl font-black tracking-tighter theme-text break-words";
        }
    }
}

function closeKpiModal() {
    document.getElementById('kpi-modal').style.display = 'none';
}

function openTeamModal(name, regNo) {
    document.getElementById('team-modal').style.display = 'flex';
    document.getElementById('team-modal-name').innerText = name;
    document.getElementById('team-modal-reg').innerText = regNo;
    document.getElementById('team-modal-avatar').innerText = name.charAt(0).toUpperCase();
    
    // Switch color dynamically based on avatar first letter
    const fLetter = name.charAt(0).toUpperCase();
    const avatar = document.getElementById('team-modal-avatar');
    if (fLetter === 'A') {
        avatar.className = "w-24 h-24 mx-auto rounded-full bg-blue-500 border-4 border-black mb-6 flex items-center justify-center text-4xl font-bold text-white shadow-xl";
    } else {
        avatar.className = "w-24 h-24 mx-auto rounded-full bg-green-500 border-4 border-black mb-6 flex items-center justify-center text-4xl font-bold text-white shadow-xl";
    }
}

function closeTeamModal() {
    document.getElementById('team-modal').style.display = 'none';
}

// Calculator Logic
let calcValue = '0';
let calcPrevValue = '';
let calcOperator = '';
let calcWaitingForOperand = false;

function updCalc() {
    document.getElementById('calc-display').innerText = calcValue;
    document.getElementById('calc-history').innerText = calcPrevValue ? `${calcPrevValue} ${calcOperator}` : '';
}

function calcNum(num) {
    if (calcWaitingForOperand) {
        calcValue = num;
        calcWaitingForOperand = false;
    } else {
        calcValue = calcValue === '0' && num !== '.' ? num : calcValue + num;
    }
    updCalc();
}

function calcOp(op) {
    if (calcOperator && !calcWaitingForOperand) {
        calcEqual();
    }
    calcOperator = op;
    calcPrevValue = calcValue;
    calcWaitingForOperand = true;
    updCalc();
}

function calcEqual() {
    if (!calcOperator) return;
    const prev = parseFloat(calcPrevValue);
    const curr = parseFloat(calcValue);
    let res = 0;
    switch(calcOperator) {
        case '+': res = prev + curr; break;
        case '-': res = prev - curr; break;
        case '*': res = prev * curr; break;
        case '/': res = prev / curr; break;
    }
    calcValue = String(res);
    calcOperator = '';
    calcPrevValue = '';
    calcWaitingForOperand = true;
    updCalc();
}

function calcClear() {
    calcValue = '0';
    calcPrevValue = '';
    calcOperator = '';
    calcWaitingForOperand = false;
    updCalc();
}

function calcDelete() {
    if (calcWaitingForOperand) return;
    calcValue = calcValue.length > 1 ? calcValue.slice(0, -1) : '0';
    updCalc();
}

function toggleCalculator() {
    const el = document.getElementById('calculator-window');
    el.style.display = el.style.display === 'flex' ? 'none' : 'flex';
}

// Draggable Calculator logic
const dragEl = document.getElementById('calc-header');
const calcWin = document.getElementById('calculator-window');
if(dragEl && calcWin) {
    let isDragging = false;
    let startX, startY;

    dragEl.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX - calcWin.offsetLeft;
        startY = e.clientY - calcWin.offsetTop;
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        calcWin.style.left = `${e.clientX - startX}px`;
        calcWin.style.top = `${e.clientY - startY}px`;
        calcWin.style.right = 'auto'; // Disable initial right positioning
    });

    document.addEventListener('mouseup', () => { isDragging = false; });
}

// EXCEL IMPORT & EXPORT
async function exportToExcel() {
    if(typeof ExcelJS === 'undefined') return alert('Excel Engine loading...');
    
    // Switch to Dashboard briefly to ensure charts are rendered if they are hidden
    const activeTabObj = document.querySelector('.nav-active');
    const originalTabId = activeTabObj ? activeTabObj.id.replace('nav-', '') : 'dashboard';
    switchTab('dashboard');
    
    // Short delay to ensure ChartJS canvases are drawn
    await new Promise(r => setTimeout(r, 100));

    const workbook = new ExcelJS.Workbook();
    
    // Invoices Sheet
    const invSheet = workbook.addWorksheet('Invoices');
    invSheet.columns = [
        { header: 'ID', key: 'id', width: 20 },
        { header: 'Client', key: 'client', width: 30 },
        { header: 'Date', key: 'date', width: 20 },
        { header: 'Amount', key: 'amount', width: 20 },
        { header: 'Status', key: 'status', width: 15 }
    ];
    state.invoices.forEach(i => invSheet.addRow({ id: i.invoice_id, client: i.clientName, date: i.date, amount: i.total_amount, status: i.status }));

    // Expenses Sheet
    const expSheet = workbook.addWorksheet('Expenses');
    expSheet.columns = [
        { header: 'ID', key: 'id', width: 20 },
        { header: 'Description', key: 'desc', width: 40 },
        { header: 'Date', key: 'date', width: 20 },
        { header: 'Amount', key: 'amount', width: 20 }
    ];
    state.expenses.forEach(e => expSheet.addRow({ id: e.expense_id, desc: e.desc, date: e.date, amount: e.amount }));

    // Analytics Sheet (Graphs)
    const dashSheet = workbook.addWorksheet('Analytics');
    
    const addChartByCell = (chart, tlCol, tlRow, brCol, brRow) => {
        if(!chart) return;
        try {
            const b64 = chart.toBase64Image();
            const imgId = workbook.addImage({ base64: b64, extension: 'png' });
            dashSheet.addImage(imgId, { tl: { col: tlCol, row: tlRow }, br: { col: brCol, row: brRow } });
        } catch(e) { console.error('Graph Export Error:', e); }
    };

    addChartByCell(window.bChart, 1, 1, 8, 15);
    addChartByCell(window.dChart, 9, 1, 16, 15);
    addChartByCell(window.lChart, 1, 16, 8, 30);
    addChartByCell(window.rChart, 9, 16, 16, 30);

    // Styling headers
    [invSheet, expSheet].forEach(sheet => {
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor:{ argb:'FF111111' } };
        sheet.getRow(1).font = { color: { argb: 'FFFFFFFF' } };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'InvoiceS_Ledger.xlsx');
    
    switchTab(originalTabId);
}

async function importFromExcel(event) {
    if(typeof ExcelJS === 'undefined') return alert('Excel Engine loading...');
    const file = event.target.files[0];
    if (!file) return;

    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(file);

        const parseCell = (cell) => {
            let val = cell.value;
            if(val && typeof val === 'object' && val.result !== undefined) val = val.result;
            if(val instanceof Date) return val.toLocaleDateString();
            return val || '';
        };

        // Parse Invoices
        const invSheet = workbook.getWorksheet('Invoices');
        if (invSheet) {
            let importedInvs = [];
            invSheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // Skip header
                importedInvs.push({
                    id: String(parseCell(row.getCell(1))),
                    invoice_id: parseInt(parseCell(row.getCell(1))) || 0,
                    clientName: parseCell(row.getCell(2)),
                    date: parseCell(row.getCell(3)),
                    total_amount: parseFloat(parseCell(row.getCell(4))) || 0,
                    status: parseCell(row.getCell(5)) || 'UNPAID',
                    items: []
                });
            });
            if(importedInvs.length > 0) state.invoices = importedInvs;
        }

        // Parse Expenses
        const expSheet = workbook.getWorksheet('Expenses');
        if (expSheet) {
            let importedExp = [];
            expSheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // Skip header
                importedExp.push({
                    id: String(parseCell(row.getCell(1))),
                    expense_id: parseInt(parseCell(row.getCell(1))) || 0,
                    desc: parseCell(row.getCell(2)),
                    date: parseCell(row.getCell(3)),
                    amount: parseFloat(parseCell(row.getCell(4))) || 0
                });
            });
            if(importedExp.length > 0) state.expenses = importedExp;
        }

        updateStats();
        renderInvoices();
        renderExpenses();
        alert("Import Complete! Data synced with worksheet.");
    } catch(e) {
        alert("Failed to read Excel file properly.");
        console.error(e);
    }
    
    event.target.value = '';
}


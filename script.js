const app = {
    data: {
        limits: { Needs: 0, Wants: 0, Savings: 0 },
        transactions: []
    },

    init() {
        const saved = localStorage.getItem('budgetData');
        if (saved) {
            this.data = JSON.parse(saved);
        }
        document.getElementById('trans-date').valueAsDate = new Date();
        
        // Listen for filter changes
        document.getElementById('filter-category').addEventListener('change', () => this.renderHistory());
        
        this.render();
    },

    save() {
        localStorage.setItem('budgetData', JSON.stringify(this.data));
        this.render();
    },

    render() {
        this.updateSummary();
        this.renderDashboard();
        this.renderHistory();
        this.syncSettingsFields();
    },

    updateSummary() {
        const income = this.data.transactions
            .filter(t => t.category === 'Income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = this.data.transactions
            .filter(t => t.category !== 'Income')
            .reduce((sum, t) => sum + t.amount, 0);

        document.getElementById('total-income').innerText = `$${income.toFixed(2)}`;
        document.getElementById('total-spent').innerText = `$${expenses.toFixed(2)}`;
        document.getElementById('total-remaining').innerText = `$${(income - expenses).toFixed(2)}`;
    },

    renderDashboard() {
        const container = document.getElementById('category-cards');
        container.innerHTML = '';

        ['Needs', 'Wants', 'Savings'].forEach(cat => {
            const limit = this.data.limits[cat] || 0;
            const spent = this.data.transactions
                .filter(t => t.category === cat)
                .reduce((sum, t) => sum + t.amount, 0);
            
            const percent = limit > 0 ? (spent / limit) * 100 : 0;
            let color = 'var(--safe)';
            if (percent >= 100) color = 'var(--danger)';
            else if (percent >= 70) color = 'var(--warn)';

            container.innerHTML += `
                <div class="card">
                    <div style="display:flex; justify-content:space-between">
                        <strong>${cat}</strong>
                        <span>$${spent.toFixed(0)} / $${limit}</span>
                    </div>
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${Math.min(percent, 100)}%; background: ${color}"></div>
                    </div>
                    <small style="color: var(--text-dim)">Remaining: $${(limit - spent).toFixed(2)}</small>
                </div>
            `;
        });
    },

    renderHistory() {
        const filter = document.getElementById('filter-category').value;
        const list = document.getElementById('transaction-list');
        list.innerHTML = '';

        const filtered = filter === 'All' 
            ? this.data.transactions 
            : this.data.transactions.filter(t => t.category === filter);

        filtered.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(t => {
            const isIncome = t.category === 'Income';
            list.innerHTML += `
                <div class="item">
                    <div class="item-info">
                        <div><strong>${t.description || t.category}</strong></div>
                        <small>${t.date} • ${t.category}</small>
                    </div>
                    <div style="text-align:right">
                        <div style="color: ${isIncome ? 'var(--safe)' : 'var(--text)'}">
                            ${isIncome ? '+' : '-'}$${t.amount.toFixed(2)}
                        </div>
                        <button onclick="app.deleteTransaction(${t.id})" style="color:var(--danger); padding:0; font-size:12px; background:none">Delete</button>
                    </div>
                </div>
            `;
        });
    },

    addTransaction() {
        const amount = parseFloat(document.getElementById('trans-amount').value);
        const category = document.getElementById('trans-category').value;
        const description = document.getElementById('trans-desc').value;
        const date = document.getElementById('trans-date').value;

        if (!amount || amount <= 0) return alert("Enter valid amount");

        const newTrans = { id: Date.now(), amount, category, description, date };
        this.data.transactions.push(newTrans);
        
        if (category !== 'Income') {
            const catSpent = this.data.transactions.filter(t => t.category === category).reduce((s,t) => s + t.amount, 0);
            if (this.data.limits[category] > 0 && catSpent > this.data.limits[category]) {
                alert(`Warning: ${category} budget exceeded!`);
            }
        }

        this.toggleModal(false);
        this.save();
        document.getElementById('trans-amount').value = '';
        document.getElementById('trans-desc').value = '';
    },

    deleteTransaction(id) {
        this.data.transactions = this.data.transactions.filter(t => t.id !== id);
        this.save();
    },

    updateLimits() {
        this.data.limits.Needs = parseFloat(document.getElementById('limit-needs').value) || 0;
        this.data.limits.Wants = parseFloat(document.getElementById('limit-wants').value) || 0;
        this.data.limits.Savings = parseFloat(document.getElementById('limit-savings').value) || 0;
        this.save();
        alert("Limits updated!");
    },

    syncSettingsFields() {
        document.getElementById('limit-needs').value = this.data.limits.Needs;
        document.getElementById('limit-wants').value = this.data.limits.Wants;
        document.getElementById('limit-savings').value = this.data.limits.Savings;
    },

    switchView(viewId) {
        document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
        document.getElementById(viewId).classList.remove('hidden');
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        event.currentTarget.classList.add('active');
    },

    toggleModal(show) {
        document.getElementById('modal').classList.toggle('hidden', !show);
    },

    resetMonth() {
        if (confirm("Reset everything? All data will be lost.")) {
            this.data = { limits: { Needs: 0, Wants: 0, Savings: 0 }, transactions: [] };
            this.save();
        }
    },

    exportData() {
        const blob = new Blob([JSON.stringify(this.data, null, 2)], {type : 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `budget-export.json`; a.click();
    },

    importData(e) {
        const reader = new FileReader();
        reader.onload = (event) => {
            this.data = JSON.parse(event.target.result);
            this.save();
        };
        reader.readAsText(e.target.files[0]);
    }
};

app.init();


const storageKeys = {
  transactions: 'finance_system_transactions',
  fixedExpenses: 'finance_system_fixed_expenses',
  selectedMonth: 'finance_system_selected_month',
};

const monthSelector = document.getElementById('monthSelector');
const summaryEntrada = document.getElementById('sumEntrada');
const summarySaida = document.getElementById('sumSaida');
const summaryCartao = document.getElementById('sumCartao');
const summaryFixa = document.getElementById('sumFixa');
const summarySaldo = document.getElementById('sumSaldo');
const detailsList = document.getElementById('detailsList');
const transactionTable = document.getElementById('transactionTable');
const fixedTable = document.getElementById('fixedTable');
const monthOverviewGrid = document.getElementById('monthOverviewGrid');

const openTransactionButton = document.getElementById('openTransactionModal');
const openFixedButton = document.getElementById('openFixedModal');
const exportButton = document.getElementById('exportData');
const importButton = document.getElementById('importData');
const importFileInput = document.getElementById('importFileInput');

const transactionModal = document.getElementById('transactionModal');
const fixedModal = document.getElementById('fixedModal');
const closeTransactionModal = document.getElementById('closeTransactionModal');
const closeFixedModal = document.getElementById('closeFixedModal');
const cancelTransaction = document.getElementById('cancelTransaction');
const cancelFixed = document.getElementById('cancelFixed');

const transactionModalForm = document.getElementById('transactionModalForm');
const transactionModalTitle = document.getElementById('transactionModalTitle');
const transactionIdInput = document.getElementById('transactionId');
const transactionDate = document.getElementById('transactionDate');
const transactionDescription = document.getElementById('transactionDescription');
const transactionCategory = document.getElementById('transactionCategory');
const transactionType = document.getElementById('transactionType');
const transactionCardRow = document.getElementById('transactionCardRow');
const transactionCard = document.getElementById('transactionCard');
const transactionValue = document.getElementById('transactionValue');

const fixedModalForm = document.getElementById('fixedModalForm');
const fixedModalTitle = document.getElementById('fixedModalTitle');
const fixedIdInput = document.getElementById('fixedId');
const fixedDescription = document.getElementById('fixedDescription');
const fixedCategory = document.getElementById('fixedCategory');
const fixedAmount = document.getElementById('fixedAmount');

function loadState() {
  const transactions = JSON.parse(localStorage.getItem(storageKeys.transactions) || '[]');
  const fixedExpenses = JSON.parse(localStorage.getItem(storageKeys.fixedExpenses) || '[]');
  const selectedMonth = localStorage.getItem(storageKeys.selectedMonth);
  return { transactions, fixedExpenses, selectedMonth };
}

function saveState(state) {
  localStorage.setItem(storageKeys.transactions, JSON.stringify(state.transactions));
  localStorage.setItem(storageKeys.fixedExpenses, JSON.stringify(state.fixedExpenses));
}

function saveSelectedMonth(key) {
  localStorage.setItem(storageKeys.selectedMonth, key);
}

function parseMonthKey(key) {
  const [year, month] = key.split('-').map(Number);
  return { year, month };
}

function formatMonthKey(key) {
  const { year, month } = parseMonthKey(key);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
}

function getMonthKey(date) {
  const dt = new Date(date);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
}

function buildMonthOptions() {
  const today = new Date();
  const options = [];
  for (let diff = -5; diff <= 5; diff += 1) {
    const date = new Date(today.getFullYear(), today.getMonth() + diff, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    options.push({ key, label });
  }
  monthSelector.innerHTML = options
    .map(opt => `<option value="${opt.key}">${opt.label}</option>`)
    .join('');
}

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function getBadgeClass(type) {
  return {
    entrada: 'entrada',
    saida: 'saida',
    cartao: 'cartao',
    fixa: 'fixa',
  }[type] || 'entrada';
}

function exportData() {
  const state = loadState();
  const payload = {
    transactions: state.transactions,
    fixedExpenses: state.fixedExpenses,
    selectedMonth: state.selectedMonth || getMonthKey(new Date()),
  };
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'finance-system-export.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function normalizeTransaction(item) {
  return {
    id: item.id || Date.now() + Math.random(),
    date: item.date || new Date().toISOString().slice(0, 10),
    description: item.description || '',
    category: item.category || '',
    type: ['entrada', 'saida', 'cartao', 'fixa'].includes(item.type) ? item.type : 'saida',
    amount: Number(item.amount) || 0,
    card: item.card || '',
    monthKey: item.monthKey || getMonthKey(item.date || new Date()),
  };
}

function normalizeFixedExpense(item) {
  return {
    id: item.id || Date.now() + Math.random(),
    description: item.description || '',
    category: item.category || '',
    amount: Number(item.amount) || 0,
  };
}

function importData(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!imported || !Array.isArray(imported.transactions) || !Array.isArray(imported.fixedExpenses)) {
        throw new Error('Formato inválido');
      }
      const state = loadState();
      const importedTransactions = imported.transactions.map(normalizeTransaction);
      const importedFixedExpenses = imported.fixedExpenses.map(normalizeFixedExpense);
      importedTransactions.forEach(item => {
        const existingIndex = state.transactions.findIndex(tx => String(tx.id) === String(item.id));
        if (existingIndex !== -1) {
          state.transactions[existingIndex] = item;
        } else {
          state.transactions.push(item);
        }
      });
      importedFixedExpenses.forEach(item => {
        const existingIndex = state.fixedExpenses.findIndex(exp => String(exp.id) === String(item.id));
        if (existingIndex !== -1) {
          state.fixedExpenses[existingIndex] = item;
        } else {
          state.fixedExpenses.push(item);
        }
      });
      if (imported.selectedMonth) {
        saveSelectedMonth(imported.selectedMonth);
      }
      saveState(state);
      render();
      alert('Importação concluída com sucesso.');
    } catch (error) {
      alert('Falha ao importar arquivo JSON. Verifique o conteúdo e tente novamente.');
    } finally {
      importFileInput.value = '';
    }
  };
  reader.readAsText(file);
}

function buildMonthRange(selectedMonth, months = 6) {
  const { year, month } = parseMonthKey(selectedMonth);
  const keys = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const date = new Date(year, month - 1 - i, 1);
    keys.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  }
  return keys;
}

function computeMonthTotals(transactions, fixedTotal, monthKey) {
  const monthTransactions = transactions.filter(tx => tx.monthKey === monthKey);
  const entrada = monthTransactions
    .filter(tx => tx.type === 'entrada')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const saida = monthTransactions
    .filter(tx => tx.type === 'saida')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const cartao = monthTransactions
    .filter(tx => tx.type === 'cartao')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const saldo = entrada - saida - cartao - fixedTotal;
  return { entrada, saida, cartao, saldo };
}

function renderMonthOverview(state, selectedMonth) {
  const fixedTotal = state.fixedExpenses.reduce((sum, item) => sum + item.amount, 0);
  const keys = buildMonthRange(selectedMonth, 6);
  monthOverviewGrid.innerHTML = keys
    .map(key => {
      const totals = computeMonthTotals(state.transactions, fixedTotal, key);
      return `
      <article class="overview-card">
        <h4>${formatMonthKey(key)}</h4>
        <div class="overview-values">
          <span>Entradas <strong>${formatCurrency(totals.entrada)}</strong></span>
          <span>Saídas <strong>${formatCurrency(totals.saida)}</strong></span>
          <span>Cartão <strong>${formatCurrency(totals.cartao)}</strong></span>
          <span>Saldo <strong>${formatCurrency(totals.saldo)}</strong></span>
        </div>
      </article>
    `;
    })
    .join('');
}

function render() {
  const state = loadState();
  const selectedMonth = state.selectedMonth || getMonthKey(new Date());
  if (!state.selectedMonth) saveSelectedMonth(selectedMonth);
  monthSelector.value = selectedMonth;

  const filtered = state.transactions.filter(tx => tx.monthKey === selectedMonth);
  const entradaTotal = filtered
    .filter(tx => tx.type === 'entrada')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const saidaTotal = filtered
    .filter(tx => tx.type === 'saida')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const cartaoTotal = filtered
    .filter(tx => tx.type === 'cartao')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const fixaTotal = state.fixedExpenses.reduce((sum, item) => sum + item.amount, 0);
  const saldo = entradaTotal - saidaTotal - cartaoTotal - fixaTotal;

  summaryEntrada.textContent = formatCurrency(entradaTotal);
  summarySaida.textContent = formatCurrency(saidaTotal);
  summaryCartao.textContent = formatCurrency(cartaoTotal);
  summaryFixa.textContent = formatCurrency(fixaTotal);
  summarySaldo.textContent = formatCurrency(saldo);

  detailsList.innerHTML = `
    <li><span>Entradas totais</span><strong>${formatCurrency(entradaTotal)}</strong></li>
    <li><span>Saídas variáveis</span><strong>${formatCurrency(saidaTotal)}</strong></li>
    <li><span>Cartão de crédito</span><strong>${formatCurrency(cartaoTotal)}</strong></li>
    <li><span>Despesas fixas</span><strong>${formatCurrency(fixaTotal)}</strong></li>
    <li><span>Saldo líquido</span><strong>${formatCurrency(saldo)}</strong></li>
  `;

  transactionTable.innerHTML = filtered.length
    ? filtered.map(tx => `
      <tr>
        <td>${tx.date}</td>
        <td>${tx.description}</td>
        <td>${tx.category}</td>
        <td><span class="badge ${getBadgeClass(tx.type)}">${tx.type === 'cartao' ? 'Crédito' : tx.type === 'fixa' ? 'Fixa' : tx.type}</span></td>
        <td>${formatCurrency(tx.amount)}</td>
        <td>${tx.card || '-'}</td>
        <td class="action-buttons">
          <button class="action-button" type="button" data-action="edit" data-id="${tx.id}">Editar</button>
          <button class="action-button danger" type="button" data-action="delete" data-id="${tx.id}">Excluir</button>
        </td>
      </tr>
    `).join('')
    : '<tr><td colspan="7" style="color: var(--muted); padding: 18px;">Nenhuma transação registrada para este mês.</td></tr>';

  fixedTable.innerHTML = state.fixedExpenses.length
    ? state.fixedExpenses.map(item => `
      <tr>
        <td>${item.description}</td>
        <td>${item.category}</td>
        <td>${formatCurrency(item.amount)}</td>
        <td class="action-buttons">
          <button class="action-button" type="button" data-action="edit" data-id="${item.id}">Editar</button>
          <button class="action-button danger" type="button" data-action="delete" data-id="${item.id}">Excluir</button>
        </td>
      </tr>
    `).join('')
    : '<tr><td colspan="4" style="color: var(--muted); padding: 18px;">Nenhuma despesa fixa cadastrada.</td></tr>';

  renderMonthOverview(state, selectedMonth);
}

function openModal(modal) {
  modal.classList.add('open');
}

function closeModal(modal) {
  modal.classList.remove('open');
}

function resetTransactionForm() {
  transactionIdInput.value = '';
  transactionModalTitle.textContent = 'Nova transação';
  transactionModalForm.reset();
  transactionType.value = 'entrada';
  transactionCardRow.style.display = 'none';
  transactionCard.value = '';
  transactionDate.value = new Date().toISOString().slice(0, 10);
}

function resetFixedForm() {
  fixedIdInput.value = '';
  fixedModalTitle.textContent = 'Nova despesa fixa';
  fixedModalForm.reset();
}

function openTransactionEditor(transaction) {
  resetTransactionForm();
  transactionModalTitle.textContent = 'Editar transação';
  transactionIdInput.value = transaction.id;
  transactionDate.value = transaction.date;
  transactionDescription.value = transaction.description;
  transactionCategory.value = transaction.category;
  transactionType.value = transaction.type;
  transactionValue.value = transaction.amount;
  if (transaction.type === 'cartao') {
    transactionCardRow.style.display = 'grid';
    transactionCard.value = transaction.card;
  }
  openModal(transactionModal);
}

function openFixedEditor(item) {
  resetFixedForm();
  fixedModalTitle.textContent = 'Editar despesa fixa';
  fixedIdInput.value = item.id;
  fixedDescription.value = item.description;
  fixedCategory.value = item.category;
  fixedAmount.value = item.amount;
  openModal(fixedModal);
}

function handleTransactionFormSubmit(event) {
  event.preventDefault();
  const id = transactionIdInput.value;
  const dateValue = transactionDate.value;
  const description = transactionDescription.value.trim();
  const category = transactionCategory.value.trim();
  const type = transactionType.value;
  const amount = Number(transactionValue.value);
  const card = transactionCard.value.trim();

  if (!dateValue || !description || !category || !amount || amount <= 0) {
    alert('Preencha todos os campos de transação corretamente.');
    return;
  }

  const state = loadState();
  const monthKey = getMonthKey(dateValue);
  if (id) {
    const index = state.transactions.findIndex(tx => String(tx.id) === id);
    if (index !== -1) {
      state.transactions[index] = {
        ...state.transactions[index],
        date: dateValue,
        description,
        category,
        type,
        amount,
        card: type === 'cartao' ? card : '',
        monthKey,
      };
    }
  } else {
    state.transactions.push({
      id: Date.now(),
      date: dateValue,
      description,
      category,
      type,
      amount,
      card: type === 'cartao' ? card : '',
      monthKey,
    });
  }

  saveState(state);
  closeModal(transactionModal);
  render();
}

function handleFixedFormSubmit(event) {
  event.preventDefault();
  const id = fixedIdInput.value;
  const description = fixedDescription.value.trim();
  const category = fixedCategory.value.trim();
  const amount = Number(fixedAmount.value);

  if (!description || !category || !amount || amount <= 0) {
    alert('Preencha todos os campos de despesa fixa corretamente.');
    return;
  }

  const state = loadState();
  if (id) {
    const index = state.fixedExpenses.findIndex(item => String(item.id) === id);
    if (index !== -1) {
      state.fixedExpenses[index] = {
        ...state.fixedExpenses[index],
        description,
        category,
        amount,
      };
    }
  } else {
    state.fixedExpenses.push({
      id: Date.now(),
      description,
      category,
      amount,
    });
  }

  saveState(state);
  closeModal(fixedModal);
  render();
}

function handleTransactionTableClick(event) {
  const button = event.target.closest('button');
  if (!button) return;
  const action = button.dataset.action;
  const id = button.dataset.id;
  const state = loadState();
  const transaction = state.transactions.find(tx => String(tx.id) === id);
  if (!transaction) return;

  if (action === 'edit') {
    openTransactionEditor(transaction);
  }
  if (action === 'delete' && confirm('Excluir esta transação?')) {
    state.transactions = state.transactions.filter(tx => String(tx.id) !== id);
    saveState(state);
    render();
  }
}

function handleFixedTableClick(event) {
  const button = event.target.closest('button');
  if (!button) return;
  const action = button.dataset.action;
  const id = button.dataset.id;
  const state = loadState();
  const item = state.fixedExpenses.find(expense => String(expense.id) === id);
  if (!item) return;

  if (action === 'edit') {
    openFixedEditor(item);
  }
  if (action === 'delete' && confirm('Excluir esta despesa fixa?')) {
    state.fixedExpenses = state.fixedExpenses.filter(expense => String(expense.id) !== id);
    saveState(state);
    render();
  }
}

function handleTransactionTypeChange() {
  if (transactionType.value === 'cartao') {
    transactionCardRow.style.display = 'grid';
  } else {
    transactionCardRow.style.display = 'none';
    transactionCard.value = '';
  }
}

function handleMonthChange() {
  saveSelectedMonth(monthSelector.value);
  render();
}

openTransactionButton.addEventListener('click', () => {
  resetTransactionForm();
  openModal(transactionModal);
});
openFixedButton.addEventListener('click', () => {
  resetFixedForm();
  openModal(fixedModal);
});
closeTransactionModal.addEventListener('click', () => closeModal(transactionModal));
closeFixedModal.addEventListener('click', () => closeModal(fixedModal));
cancelTransaction.addEventListener('click', () => closeModal(transactionModal));
cancelFixed.addEventListener('click', () => closeModal(fixedModal));
transactionModal.addEventListener('click', event => {
  if (event.target === transactionModal) closeModal(transactionModal);
});
fixedModal.addEventListener('click', event => {
  if (event.target === fixedModal) closeModal(fixedModal);
});
transactionModalForm.addEventListener('submit', handleTransactionFormSubmit);
fixedModalForm.addEventListener('submit', handleFixedFormSubmit);
transactionType.addEventListener('change', handleTransactionTypeChange);
monthSelector.addEventListener('change', handleMonthChange);
exportButton.addEventListener('click', exportData);
importButton.addEventListener('click', () => importFileInput.click());
importFileInput.addEventListener('change', event => importData(event.target.files?.[0]));
transactionTable.addEventListener('click', handleTransactionTableClick);
fixedTable.addEventListener('click', handleFixedTableClick);

buildMonthOptions();
handleTransactionTypeChange();

(function initialize() {
  const state = loadState();
  const selectedMonth = state.selectedMonth || getMonthKey(new Date());
  if (!state.selectedMonth) saveSelectedMonth(selectedMonth);
  transactionDate.value = new Date().toISOString().slice(0, 10);
  render();
})();

// State Management
let currentInput = '0';
let previousInput = '';
let operator = null;
let currentMode = 'standard';
let historyLog = [];

// DOM Elements
const mainDisplay = document.getElementById('mainDisplay');
const historyDisplay = document.getElementById('historyDisplay');
const statusBadge = document.getElementById('statusBadge');
const modePills = document.querySelectorAll('.mode-pill');
const sciBtns = document.querySelectorAll('.sci-btn');
const standardKeypad = document.getElementById('standardKeypad');
const financialPanel = document.getElementById('financialPanel');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

// Mode Selector Logic
modePills.forEach(pill => {
  pill.addEventListener('click', () => {
    modePills.forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    currentMode = pill.dataset.mode;

    if (currentMode === 'standard') {
      statusBadge.textContent = 'Standard Mode';
      standardKeypad.classList.remove('hide');
      financialPanel.classList.add('hide');
      sciBtns.forEach(b => b.classList.add('hide'));
    } else if (currentMode === 'scientific') {
      statusBadge.textContent = 'Scientific Suite';
      standardKeypad.classList.remove('hide');
      financialPanel.classList.add('hide');
      sciBtns.forEach(b => b.classList.remove('hide'));
    } else if (currentMode === 'financial') {
      statusBadge.textContent = 'EMI Loan Analytics';
      standardKeypad.classList.add('hide');
      financialPanel.classList.remove('hide');
    }
  });
});

// Update Screen UI
function updateDisplay() {
  mainDisplay.textContent = currentInput;
  historyDisplay.textContent = previousInput;
}

// Number Inputs
document.querySelectorAll('.num-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const val = btn.dataset.val;
    if (currentInput === '0' && val !== '.') {
      currentInput = val;
    } else {
      if (val === '.' && currentInput.includes('.')) return;
      currentInput += val;
    }
    updateDisplay();
  });
});

// Operators
document.querySelectorAll('.operator-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    operator = btn.dataset.action;
    previousInput = `${currentInput} ${getSymbol(operator)}`;
    currentInput = '0';
    updateDisplay();
  });
});

function getSymbol(op) {
  if (op === '/') return '÷';
  if (op === '*') return '×';
  return op;
}

// Action Keys (Clear, Backspace, %)
document.querySelectorAll('.action-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    if (action === 'clear') {
      currentInput = '0';
      previousInput = '';
      operator = null;
    } else if (action === 'backspace') {
      currentInput = currentInput.slice(0, -1) || '0';
    } else if (action === 'percent') {
      currentInput = (parseFloat(currentInput) / 100).toString();
    }
    updateDisplay();
  });
});

// Scientific Functions
sciBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    let val = parseFloat(currentInput);
    let expr = '';

    if (action === 'sin') { expr = `sin(${val})`; val = Math.sin(val); }
    if (action === 'cos') { expr = `cos(${val})`; val = Math.cos(val); }
    if (action === 'tan') { expr = `tan(${val})`; val = Math.tan(val); }
    if (action === 'sqrt') { expr = `√(${val})`; val = Math.sqrt(val); }
    if (action === 'pow') { expr = `${val}²`; val = Math.pow(val, 2); }

    addHistory(expr, val);
    currentInput = val.toString();
    previousInput = expr;
    updateDisplay();
  });
});

// Equals Evaluation
document.querySelector('.equals-btn').addEventListener('click', calculate);

function calculate() {
  if (!operator || !previousInput) return;

  const prev = parseFloat(previousInput);
  const current = parseFloat(currentInput);
  let result = 0;

  switch (operator) {
    case '+': result = prev + current; break;
    case '-': result = prev - current; break;
    case '*': result = prev * current; break;
    case '/': result = current !== 0 ? prev / current : 'Error'; break;
  }

  const fullExpr = `${previousInput} ${currentInput}`;
  addHistory(fullExpr, result);

  previousInput = `${fullExpr} =`;
  currentInput = result.toString();
  operator = null;
  updateDisplay();
}

// History Stream
function addHistory(expr, result) {
  historyLog.unshift({ expr, result });
  renderHistory();
}

function renderHistory() {
  if (historyLog.length === 0) {
    historyList.innerHTML = '<li class="empty-log">No previous calculations recorded</li>';
    return;
  }

  historyList.innerHTML = '';
  historyLog.slice(0, 5).forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${item.expr}</span> <strong style="color:var(--accent-cyan);">= ${item.result}</strong>`;
    li.addEventListener('click', () => {
      currentInput = item.result.toString();
      updateDisplay();
    });
    historyList.appendChild(li);
  });
}

clearHistoryBtn.addEventListener('click', () => {
  historyLog = [];
  renderHistory();
});

// Financial EMI Engine
document.getElementById('calcEmiBtn').addEventListener('click', () => {
  const P = parseFloat(document.getElementById('loanAmount').value);
  const r = parseFloat(document.getElementById('interestRate').value) / 12 / 100;
  const n = parseFloat(document.getElementById('loanTenure').value) * 12;

  if (P > 0 && r > 0 && n > 0) {
    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayable = emi * n;
    const totalInterest = totalPayable - P;

    document.getElementById('monthlyEmiVal').textContent = `$${Math.round(emi).toLocaleString()}`;
    document.getElementById('totalInterestVal').textContent = `$${Math.round(totalInterest).toLocaleString()}`;
    document.getElementById('emiResults').classList.remove('hide');

    addHistory(`EMI (${P.toLocaleString()})`, Math.round(emi));
  }
});
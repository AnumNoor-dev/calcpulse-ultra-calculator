let expression = '';
let isDegreeMode = true;
let currentMode = 'standard';
let historyLog = [];
let memoryValue = 0;
let lastResult = null;

// DOM Elements
const mainDisplay = document.getElementById('mainDisplay');
const historyDisplay = document.getElementById('historyDisplay');
const statusBadge = document.getElementById('statusBadge');
const degRadBtn = document.getElementById('degRadBtn');
const memIndicator = document.getElementById('memIndicator');
const pillBtns = document.querySelectorAll('.pill-btn');
const sciBtns = document.querySelectorAll('.sci-btn');
const memBtns = document.querySelectorAll('.mem-btn');
const standardKeypad = document.getElementById('standardKeypad');
const financialPanel = document.getElementById('financialPanel');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const exportHistoryBtn = document.getElementById('exportHistoryBtn');
const themeToggle = document.getElementById('themeToggle');
const copyBtn = document.getElementById('copyBtn');
const toast = document.getElementById('toast');

/* ============ Theme (persisted) ============ */
function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'dark' ? '🌙' : '☀️';
  localStorage.setItem('calcPulseTheme', theme);
}
themeToggle.addEventListener('click', () => {
  const next = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
});
applyTheme(localStorage.getItem('calcPulseTheme') || 'dark');

/* ============ Toast ============ */
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1600);
}

/* ============ Copy result ============ */
function copyResult() {
  const text = mainDisplay.textContent;
  if (!text || text === '0') return;
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied ' + text);
  }).catch(() => showToast('Copy failed'));
}
copyBtn.addEventListener('click', copyResult);
mainDisplay.addEventListener('click', copyResult);

/* ============ Deg / Rad Toggle ============ */
degRadBtn.addEventListener('click', toggleDegRad);
function toggleDegRad() {
  isDegreeMode = !isDegreeMode;
  degRadBtn.textContent = isDegreeMode ? 'DEG' : 'RAD';
}

/* ============ Mode Selector ============ */
pillBtns.forEach(pill => {
  pill.addEventListener('click', () => {
    pillBtns.forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    currentMode = pill.dataset.mode;

    if (currentMode === 'standard') {
      statusBadge.textContent = 'STANDARD MODE';
      standardKeypad.classList.remove('hide');
      financialPanel.classList.add('hide');
      sciBtns.forEach(b => b.classList.add('hide'));
    } else if (currentMode === 'scientific') {
      statusBadge.textContent = 'SCIENTIFIC SUITE';
      standardKeypad.classList.remove('hide');
      financialPanel.classList.add('hide');
      sciBtns.forEach(b => b.classList.remove('hide'));
    } else if (currentMode === 'financial') {
      statusBadge.textContent = 'FINANCIAL EMI ANALYTICS';
      standardKeypad.classList.add('hide');
      financialPanel.classList.remove('hide');
    }
  });
});

function updateDisplay() {
  mainDisplay.textContent = expression || '0';
}

/* ============ Number / Bracket / Operator Input ============ */
function appendToExpression(val) {
  expression += val;
  updateDisplay();
}

document.querySelectorAll('[data-val]').forEach(btn => {
  btn.addEventListener('click', () => appendToExpression(btn.dataset.val));
});

/* ============ Scientific Functions ============ */
sciBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    if (!action) return; // buttons with only data-val handled above

    if (action === 'sin') expression += 'sin(';
    else if (action === 'cos') expression += 'cos(';
    else if (action === 'tan') expression += 'tan(';
    else if (action === 'sqrt') expression += 'sqrt(';
    else if (action === 'ln') expression += 'ln(';
    else if (action === 'log') expression += 'log(';
    else if (action === 'inv') expression += '1/(';
    else if (action === 'fact') expression += '!';
    else if (action === 'pi') expression += Math.PI.toString();
    else if (action === 'euler') expression += Math.E.toString();
    else if (action === 'pow') expression += '^2';
    else if (action === 'xy') expression += '^';
    else if (action === 'degRadToggle') toggleDegRad();

    updateDisplay();
  });
});

/* ============ Memory Functions ============ */
function currentValue() {
  // Uses the last computed result, or evaluates the live expression if possible
  if (expression) {
    try { return evaluateExpression(expression); } catch (e) { return lastResult || 0; }
  }
  return lastResult || 0;
}

function refreshMemIndicator() {
  memIndicator.classList.toggle('show', memoryValue !== 0);
}

memBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    if (action === 'mc') {
      memoryValue = 0;
    } else if (action === 'mr') {
      expression += memoryValue.toString();
      updateDisplay();
    } else if (action === 'mplus') {
      memoryValue += currentValue();
    } else if (action === 'mminus') {
      memoryValue -= currentValue();
    }
    refreshMemIndicator();
  });
});

/* ============ Clear / Backspace / Percent ============ */
document.querySelectorAll('.action-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    if (action === 'clear') {
      expression = '';
      historyDisplay.textContent = '';
    } else if (action === 'backspace') {
      expression = expression.slice(0, -1);
    } else if (action === 'percent') {
      expression += '/100';
    }
    updateDisplay();
  });
});

/* ============ Expression Evaluation Engine ============ */
function factorial(n) {
  n = Math.round(n);
  if (n < 0) return NaN;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

function evaluateExpression(rawExpr) {
  let parsedExpr = rawExpr;
  const toRadians = (angle) => (angle * Math.PI) / 180;

  parsedExpr = parsedExpr.replace(/sin\(([^)]+)\)/g, (m, angle) => {
    let val = eval(angle);
    return (isDegreeMode ? Math.sin(toRadians(val)) : Math.sin(val)).toString();
  });
  parsedExpr = parsedExpr.replace(/cos\(([^)]+)\)/g, (m, angle) => {
    let val = eval(angle);
    return (isDegreeMode ? Math.cos(toRadians(val)) : Math.cos(val)).toString();
  });
  parsedExpr = parsedExpr.replace(/tan\(([^)]+)\)/g, (m, angle) => {
    let val = eval(angle);
    return (isDegreeMode ? Math.tan(toRadians(val)) : Math.tan(val)).toString();
  });
  parsedExpr = parsedExpr.replace(/sqrt\(([^)]+)\)/g, (m, num) => Math.sqrt(eval(num)).toString());
  parsedExpr = parsedExpr.replace(/ln\(([^)]+)\)/g, (m, num) => Math.log(eval(num)).toString());
  parsedExpr = parsedExpr.replace(/log\(([^)]+)\)/g, (m, num) => Math.log10(eval(num)).toString());
  parsedExpr = parsedExpr.replace(/1\/\(([^)]+)\)/g, (m, num) => (1 / eval(num)).toString());
  parsedExpr = parsedExpr.replace(/(\d+(\.\d+)?)!/g, (m, num) => factorial(parseFloat(num)).toString());
  parsedExpr = parsedExpr.replace(/\^/g, '**');

  let result = eval(parsedExpr);
  if (Math.abs(result) < 1e-12) result = 0;
  return result;
}

/* ============ Equals ============ */
document.querySelector('.equals-btn').addEventListener('click', calculateResult);

function calculateResult() {
  if (!expression) return;
  try {
    const result = evaluateExpression(expression);
    historyDisplay.textContent = `${expression} =`;
    addHistory(expression, result);
    lastResult = result;
    expression = result.toString();
    updateDisplay();
  } catch (error) {
    mainDisplay.textContent = 'Error';
    expression = '';
  }
}

/* ============ History (persisted + exportable + reusable) ============ */
function loadHistory() {
  try {
    const saved = localStorage.getItem('calcPulseHistory');
    historyLog = saved ? JSON.parse(saved) : [];
  } catch (e) { historyLog = []; }
  renderHistory();
}

function saveHistory() {
  localStorage.setItem('calcPulseHistory', JSON.stringify(historyLog.slice(0, 50)));
}

function addHistory(expr, result) {
  historyLog.unshift({ expr, result });
  saveHistory();
  renderHistory();
}

function renderHistory() {
  if (historyLog.length === 0) {
    historyList.innerHTML = '<li class="empty-msg">No history recorded</li>';
    return;
  }

  historyList.innerHTML = '';
  historyLog.slice(0, 6).forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${item.expr}</span> <strong class="history-result">= ${item.result}</strong>`;
    li.addEventListener('click', () => {
      expression = item.result.toString();
      lastResult = item.result;
      historyDisplay.textContent = '';
      updateDisplay();
    });
    historyList.appendChild(li);
  });
}

clearHistoryBtn.addEventListener('click', () => {
  historyLog = [];
  saveHistory();
  renderHistory();
});

exportHistoryBtn.addEventListener('click', () => {
  if (historyLog.length === 0) { showToast('Nothing to export'); return; }
  const lines = historyLog.map(item => `${item.expr} = ${item.result}`).join('\n');
  const blob = new Blob([lines], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'calcpulse-history.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('History exported');
});

/* ============ Keyboard Support ============ */
document.addEventListener('keydown', (e) => {
  const financialActive = currentMode === 'financial';
  if (financialActive && document.activeElement.tagName === 'INPUT') return;

  if (/^[0-9.]$/.test(e.key)) {
    appendToExpression(e.key);
  } else if (['+', '-', '*', '/', '(', ')', '%'].includes(e.key)) {
    appendToExpression(e.key);
  } else if (e.key === 'Enter' || e.key === '=') {
    e.preventDefault();
    calculateResult();
  } else if (e.key === 'Backspace') {
    expression = expression.slice(0, -1);
    updateDisplay();
  } else if (e.key === 'Escape') {
    expression = '';
    historyDisplay.textContent = '';
    updateDisplay();
  }
});

/* ============ EMI Calculator Engine ============ */
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

/* ============ Init ============ */
loadHistory();
refreshMemIndicator();
'use strict';

const resultEl = document.getElementById('result');
const expressionEl = document.getElementById('expression');

let currentValue = '0';
let previousValue = null;
let operator = null;
let waitingForOperand = false;
let expressionParts = [];
let justEvaluated = false;

function updateDisplay(value) {
  // Format large numbers with commas but don't format if has decimal mid-entry
  let display = value;
  if (!display.endsWith('.')) {
    const num = parseFloat(value);
    if (!isNaN(num) && isFinite(num)) {
      // Use locale formatting for display but keep precision
      const parts = value.split('.');
      parts[0] = parseInt(parts[0], 10).toLocaleString('en-US');
      display = parts.join('.');
    }
  }
  resultEl.textContent = display;
  resultEl.classList.toggle('small', display.length > 9);
}

function inputDigit(digit) {
  if (waitingForOperand || justEvaluated) {
    currentValue = String(digit);
    waitingForOperand = false;
    justEvaluated = false;
  } else {
    currentValue = currentValue === '0' ? String(digit) : currentValue + digit;
  }
  updateDisplay(currentValue);
}

function inputDecimal() {
  if (waitingForOperand || justEvaluated) {
    currentValue = '0.';
    waitingForOperand = false;
    justEvaluated = false;
    updateDisplay(currentValue);
    return;
  }
  if (!currentValue.includes('.')) {
    currentValue += '.';
    updateDisplay(currentValue);
  }
}

function handleOperator(nextOperator) {
  const current = parseFloat(currentValue);

  if (operator && !waitingForOperand) {
    const result = calculate(previousValue, current, operator);
    currentValue = formatResult(result);
    expressionParts = [currentValue];
  } else {
    expressionParts = [currentValue];
  }

  previousValue = parseFloat(currentValue);
  operator = nextOperator;
  waitingForOperand = true;
  justEvaluated = false;

  const opSymbols = { add: '+', subtract: '−', multiply: '×', divide: '÷' };
  expressionEl.textContent = expressionParts[0] + ' ' + opSymbols[operator];

  highlightOperator(nextOperator);
  updateDisplay(currentValue);
}

function calculate(a, b, op) {
  switch (op) {
    case 'add':      return a + b;
    case 'subtract': return a - b;
    case 'multiply': return a * b;
    case 'divide':   return b !== 0 ? a / b : 'Error';
  }
}

function formatResult(value) {
  if (value === 'Error') return 'Error';
  // Avoid floating point display issues
  const s = parseFloat(value.toPrecision(12)).toString();
  return s;
}

function handleEquals() {
  if (!operator || waitingForOperand) return;

  const current = parseFloat(currentValue);
  const opSymbols = { add: '+', subtract: '−', multiply: '×', divide: '÷' };
  expressionEl.textContent = previousValue + ' ' + opSymbols[operator] + ' ' + current + ' =';

  const result = calculate(previousValue, current, operator);
  currentValue = formatResult(result);

  operator = null;
  previousValue = null;
  waitingForOperand = false;
  justEvaluated = true;

  clearOperatorHighlight();
  updateDisplay(currentValue);
}

function handleClear() {
  currentValue = '0';
  previousValue = null;
  operator = null;
  waitingForOperand = false;
  justEvaluated = false;
  expressionParts = [];
  expressionEl.textContent = '';
  clearOperatorHighlight();
  updateDisplay('0');
}

function handleSign() {
  if (currentValue === '0' || currentValue === 'Error') return;
  currentValue = currentValue.startsWith('-')
    ? currentValue.slice(1)
    : '-' + currentValue;
  updateDisplay(currentValue);
}

function handlePercent() {
  const val = parseFloat(currentValue);
  if (isNaN(val)) return;
  currentValue = formatResult(val / 100);
  updateDisplay(currentValue);
}

function highlightOperator(op) {
  clearOperatorHighlight();
  document.querySelectorAll('.btn-operator').forEach(btn => {
    if (btn.dataset.action === op) btn.classList.add('active');
  });
}

function clearOperatorHighlight() {
  document.querySelectorAll('.btn-operator').forEach(btn => btn.classList.remove('active'));
}

// Event delegation on the button grid
document.querySelector('.buttons').addEventListener('click', e => {
  const btn = e.target.closest('.btn');
  if (!btn) return;
  const action = btn.dataset.action;

  if (!isNaN(action)) {
    inputDigit(parseInt(action, 10));
    clearOperatorHighlight();
  } else {
    switch (action) {
      case 'decimal':  inputDecimal(); break;
      case 'clear':    handleClear(); break;
      case 'sign':     handleSign(); break;
      case 'percent':  handlePercent(); break;
      case 'equals':   handleEquals(); break;
      default:         handleOperator(action); break;
    }
  }
});

// Keyboard support (for when used on desktop/laptop)
document.addEventListener('keydown', e => {
  if (e.key >= '0' && e.key <= '9') inputDigit(parseInt(e.key));
  else if (e.key === '.') inputDecimal();
  else if (e.key === '+') handleOperator('add');
  else if (e.key === '-') handleOperator('subtract');
  else if (e.key === '*') handleOperator('multiply');
  else if (e.key === '/') { e.preventDefault(); handleOperator('divide'); }
  else if (e.key === 'Enter' || e.key === '=') handleEquals();
  else if (e.key === 'Escape') handleClear();
  else if (e.key === '%') handlePercent();
  else if (e.key === 'Backspace') {
    if (currentValue.length > 1) {
      currentValue = currentValue.slice(0, -1);
      updateDisplay(currentValue);
    } else {
      currentValue = '0';
      updateDisplay('0');
    }
  }
});

// Register service worker for offline/installable support
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

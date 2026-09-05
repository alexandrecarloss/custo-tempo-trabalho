/**
 * Preço do Meu Tempo — Aplicação Principal
 * Consciência Financeira & Custo em Horas de Trabalho
 */

// --- ESTADO DA APLICAÇÃO ---
const state = {
  salaryType: 'monthly', // 'monthly' | 'hourly'
  monthlySalary: 3500.0,
  directHourlyRate: 25.0,
  hoursPerDay: 8.0,
  daysPerWeek: 5.0,
  commuteHours: 0.0,
  workExpenses: 0.0,
  
  // Compra
  itemName: 'Tênis novo',
  itemPrice: 350.0,
  payMode: 'cash', // 'cash' | 'installments' | 'subscription'
  installments: 10,

  // Lista de Desejos e Economia
  wishlist: [],
  savedMinutes: 0,

  // Tema
  theme: 'light'
};

const STORAGE_KEY = 'preco_meu_tempo_data_v1';

// --- ELEMENTOS DOM ---
const el = {
  // Tema
  btnTheme: document.getElementById('btn-theme'),
  iconSun: document.getElementById('theme-icon-sun'),
  iconMoon: document.getElementById('theme-icon-moon'),

  // Navbar Badges
  navHourlyRate: document.getElementById('nav-hourly-rate'),
  navSavedCounter: document.getElementById('nav-saved-counter'),
  totalSavedTimeDisplay: document.getElementById('total-saved-time-display'),

  // Abas Salário
  tabMonthly: document.getElementById('tab-type-monthly'),
  tabHourly: document.getElementById('tab-type-hourly'),
  wrapperMonthly: document.getElementById('wrapper-monthly-salary'),
  wrapperHourly: document.getElementById('wrapper-hourly-rate'),

  // Inputs Salário e Jornada
  inputSalary: document.getElementById('input-salary'),
  inputDirectHourly: document.getElementById('input-direct-hourly'),
  inputHoursDay: document.getElementById('input-hours-day'),
  inputDaysWeek: document.getElementById('input-days-week'),

  // CLT Bruto Expansível
  btnToggleClt: document.getElementById('btn-toggle-clt'),
  cltBox: document.getElementById('clt-calculator-box'),
  inputCltGross: document.getElementById('input-clt-gross'),
  btnApplyClt: document.getElementById('btn-apply-clt'),
  cltResultHint: document.getElementById('clt-result-hint'),

  // Fator Vida Real
  btnToggleAdvanced: document.getElementById('btn-toggle-advanced'),
  advancedChevron: document.getElementById('advanced-chevron'),
  advancedBox: document.getElementById('advanced-settings-box'),
  advancedBadge: document.getElementById('advanced-status-badge'),
  inputCommuteHours: document.getElementById('input-commute-hours'),
  inputWorkExpenses: document.getElementById('input-work-expenses'),

  // Exibição do Valor da Hora
  displayHourlyRate: document.getElementById('display-hourly-rate'),
  displayMinuteRate: document.getElementById('display-minute-rate'),
  displayDayRate: document.getElementById('display-day-rate'),
  rateTypeIndicator: document.getElementById('rate-type-indicator'),

  // Inputs Compra
  inputItemName: document.getElementById('input-item-name'),
  inputItemPrice: document.getElementById('input-item-price'),
  payCash: document.getElementById('pay-cash'),
  payInstallments: document.getElementById('pay-installments'),
  paySubscription: document.getElementById('pay-subscription'),
  boxInstallments: document.getElementById('box-installments'),
  rangeInstallments: document.getElementById('range-installments'),
  installmentCountLabel: document.getElementById('installment-count-label'),
  installmentCalcPreview: document.getElementById('installment-calc-preview'),
  boxSubscription: document.getElementById('box-subscription'),

  // Resultados
  resultItemDisplay: document.getElementById('result-item-display'),
  badgeImpactLevel: document.getElementById('badge-impact-level'),
  badgeImpactText: document.getElementById('badge-impact-text'),
  resultHeroTime: document.getElementById('result-hero-time'),
  resultWorkdays: document.getElementById('result-workdays'),
  resultMonthPct: document.getElementById('result-month-pct'),
  extraModeResults: document.getElementById('extra-mode-results'),

  // Rotina da semana
  scheduleSummaryText: document.getElementById('schedule-summary-text'),
  scheduleNarrative: document.getElementById('schedule-narrative'),

  // Reflexão
  reflectionBox: document.getElementById('reflection-box'),
  reflectionTitle: document.getElementById('reflection-title'),
  reflectionText: document.getElementById('reflection-text'),

  // Ações
  btnAddWishlist: document.getElementById('btn-add-wishlist'),
  btnCopyCard: document.getElementById('btn-copy-card'),
  btnCopyText: document.getElementById('btn-copy-text'),

  // Lista de Desejos
  wishlistContainer: document.getElementById('wishlist-items-container'),
  wishlistEmptyState: document.getElementById('wishlist-empty-state'),
  wishlistTotalTime: document.getElementById('wishlist-total-time'),

  // Toast
  toastContainer: document.getElementById('toast-container')
};

// --- UTILITÁRIOS DE FORMATAÇÃO E MOEDA (BRL) ---
function formatCurrency(value) {
  if (isNaN(value) || value === null) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function parseCurrencyInput(str) {
  if (!str) return 0;
  // Remove tudo que não for dígito ou vírgula/ponto
  let clean = str.replace(/[^\d.,]/g, '').trim();
  if (!clean) return 0;

  // Se tiver vírgula e ponto, padrão brasileiro: 3.500,50 -> remove ponto, troca vírgula por ponto
  if (clean.includes('.') && clean.includes(',')) {
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (clean.includes(',')) {
    clean = clean.replace(',', '.');
  }
  const val = parseFloat(clean);
  return isNaN(val) ? 0 : Math.max(0, val);
}

function formatNumberInput(value) {
  if (isNaN(value)) return '0,00';
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Formatar tempo legível em horas e minutos
function formatDuration(totalHours) {
  if (totalHours <= 0) return '0 min';

  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);

  if (hours === 0) {
    return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  }

  if (minutes === 0) {
    return `${hours} hora${hours !== 1 ? 's' : ''}`;
  }

  return `${hours}h ${minutes}m`;
}

// Formatar tempo em escala detalhada (ex: 2 dias, 3 horas e 15 min)
function formatWorkdaysNarrative(totalHours, hoursPerDay) {
  if (totalHours <= 0) return '0 minutos de trabalho';

  const fullDays = Math.floor(totalHours / hoursPerDay);
  const remHoursTotal = totalHours % hoursPerDay;
  const remHours = Math.floor(remHoursTotal);
  const remMinutes = Math.round((remHoursTotal - remHours) * 60);

  let parts = [];
  if (fullDays > 0) {
    parts.push(`${fullDays} dia${fullDays > 1 ? 's' : ''}`);
  }
  if (remHours > 0) {
    parts.push(`${remHours} hora${remHours > 1 ? 's' : ''}`);
  }
  if (remMinutes > 0 && fullDays === 0) {
    parts.push(`${remMinutes} min`);
  }

  return parts.join(', ') || `${remMinutes} min`;
}

// --- CÁLCULO DE IMPOSTOS CLT (INSS & IRPF) ---
function calculateCLTNetSalary(gross) {
  if (gross <= 0) return 0;

  // Tabela INSS 2024/2025/2026 progressiva
  let inss = 0;
  if (gross <= 1412.0) {
    inss = gross * 0.075;
  } else if (gross <= 2666.68) {
    inss = 1412.0 * 0.075 + (gross - 1412.0) * 0.09;
  } else if (gross <= 4000.03) {
    inss = 1412.0 * 0.075 + (2666.68 - 1412.0) * 0.09 + (gross - 2666.68) * 0.12;
  } else if (gross <= 7786.02) {
    inss = 1412.0 * 0.075 + (2666.68 - 1412.0) * 0.09 + (4000.03 - 2666.68) * 0.12 + (gross - 4000.03) * 0.14;
  } else {
    // Teto INSS
    inss = 1412.0 * 0.075 + (2666.68 - 1412.0) * 0.09 + (4000.03 - 2666.68) * 0.12 + (7786.02 - 4000.03) * 0.14;
  }

  // Base IRPF
  const baseIR = gross - inss;
  let irpf = 0;

  if (baseIR <= 2259.20) {
    irpf = 0;
  } else if (baseIR <= 2826.65) {
    irpf = baseIR * 0.075 - 169.44;
  } else if (baseIR <= 3751.05) {
    irpf = baseIR * 0.15 - 381.44;
  } else if (baseIR <= 4664.68) {
    irpf = baseIR * 0.225 - 662.77;
  } else {
    irpf = baseIR * 0.275 - 896.00;
  }
  irpf = Math.max(0, irpf);

  const net = gross - inss - irpf;
  return {
    net: Math.max(0, net),
    inss,
    irpf
  };
}

// --- PERSISTÊNCIA LOCALSTORAGE ---
function saveToLocalStorage() {
  try {
    const dataToSave = {
      salaryType: state.salaryType,
      monthlySalary: state.monthlySalary,
      directHourlyRate: state.directHourlyRate,
      hoursPerDay: state.hoursPerDay,
      daysPerWeek: state.daysPerWeek,
      commuteHours: state.commuteHours,
      workExpenses: state.workExpenses,
      itemName: state.itemName,
      itemPrice: state.itemPrice,
      payMode: state.payMode,
      installments: state.installments,
      wishlist: state.wishlist,
      savedMinutes: state.savedMinutes,
      theme: state.theme
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (err) {
    console.warn('Erro ao salvar no localStorage:', err);
  }
}

function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      Object.assign(state, data);
    }
  } catch (err) {
    console.warn('Erro ao carregar do localStorage:', err);
  }
}

// --- CÁLCULOS DO VALOR DA HORA E DO TEMPO ---
function calculateHourlyMetrics() {
  const weeksPerMonth = 4.3333; // Média exata de semanas no mês (52 / 12)
  const monthlyWorkHours = state.hoursPerDay * state.daysPerWeek * weeksPerMonth;
  const monthlyCommuteHours = state.commuteHours * state.daysPerWeek * weeksPerMonth;

  let nominalHourlyRate = 0;
  let realHourlyRate = 0;

  if (state.salaryType === 'monthly') {
    nominalHourlyRate = monthlyWorkHours > 0 ? state.monthlySalary / monthlyWorkHours : 0;
    
    // Fator Vida Real: Desconta gastos do trabalho e soma tempo de trânsito
    const netEarningsReal = Math.max(0, state.monthlySalary - state.workExpenses);
    const totalInvestedHours = monthlyWorkHours + monthlyCommuteHours;
    realHourlyRate = totalInvestedHours > 0 ? netEarningsReal / totalInvestedHours : nominalHourlyRate;
  } else {
    // Modo por hora direto
    nominalHourlyRate = state.directHourlyRate;
    const grossMonthly = nominalHourlyRate * monthlyWorkHours;
    const netEarningsReal = Math.max(0, grossMonthly - state.workExpenses);
    const totalInvestedHours = monthlyWorkHours + monthlyCommuteHours;
    realHourlyRate = totalInvestedHours > 0 ? netEarningsReal / totalInvestedHours : nominalHourlyRate;
  }

  // Se o usuário configurou trânsito ou gastos, usamos a taxa real
  const hasAdvanced = state.commuteHours > 0 || state.workExpenses > 0;
  const effectiveHourlyRate = hasAdvanced ? realHourlyRate : nominalHourlyRate;

  const minuteRate = effectiveHourlyRate > 0 ? effectiveHourlyRate / 60 : 0;
  const dayRate = effectiveHourlyRate * state.hoursPerDay;

  return {
    nominalHourlyRate,
    realHourlyRate,
    effectiveHourlyRate,
    minuteRate,
    dayRate,
    monthlyWorkHours,
    hasAdvanced
  };
}

function calculatePurchaseImpact(metrics) {
  const price = state.itemPrice || 0;
  const effectiveRate = metrics.effectiveHourlyRate;

  let totalHoursNeeded = 0;
  if (effectiveRate > 0 && price > 0) {
    totalHoursNeeded = price / effectiveRate;
  }

  const workdaysNeeded = state.hoursPerDay > 0 ? totalHoursNeeded / state.hoursPerDay : 0;
  
  // Percentual do salário mensal
  let monthlyEarnings = state.salaryType === 'monthly' ? state.monthlySalary : (metrics.nominalHourlyRate * metrics.monthlyWorkHours);
  const monthPercentage = monthlyEarnings > 0 ? (price / monthlyEarnings) * 100 : 0;

  return {
    price,
    totalHoursNeeded,
    workdaysNeeded,
    monthPercentage
  };
}

// --- ATUALIZAÇÃO DA INTERFACE ---
function renderUI() {
  const metrics = calculateHourlyMetrics();
  const impact = calculatePurchaseImpact(metrics);

  // 1. Atualizar display da taxa por hora
  el.displayHourlyRate.textContent = formatCurrency(metrics.effectiveHourlyRate);
  el.displayMinuteRate.textContent = formatCurrency(metrics.minuteRate);
  el.displayDayRate.textContent = formatCurrency(metrics.dayRate);
  el.navHourlyRate.textContent = `${formatCurrency(metrics.effectiveHourlyRate)}/h`;

  if (metrics.hasAdvanced) {
    el.rateTypeIndicator.textContent = 'Taxa Real de Vida';
    el.rateTypeIndicator.className = 'text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold';
    el.advancedBadge.textContent = 'Ativado';
    el.advancedBadge.className = 'text-emerald-500 font-semibold';
  } else {
    el.rateTypeIndicator.textContent = 'Nominal';
    el.rateTypeIndicator.className = 'text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-200';
    el.advancedBadge.textContent = 'Opcional';
    el.advancedBadge.className = 'text-slate-400';
  }

  // 2. Atualizar resultado principal da compra
  const displayName = state.itemName.trim() || 'Este item';
  el.resultItemDisplay.textContent = `${displayName} (${formatCurrency(impact.price)})`;

  // Tempo Hero
  el.resultHeroTime.textContent = formatDuration(impact.totalHoursNeeded);

  // Sub-métricas
  const workdaysStr = impact.workdaysNeeded < 10 
    ? impact.workdaysNeeded.toFixed(1).replace('.', ',') 
    : Math.round(impact.workdaysNeeded).toString();
  el.resultWorkdays.textContent = `${workdaysStr} dia${impact.workdaysNeeded !== 1 ? 's' : ''}`;
  el.resultMonthPct.textContent = `${impact.monthPercentage.toFixed(1).replace('.', ',')}%`;

  // 3. Atualizar Nível de Impacto & Reflexão Psicológica
  updateImpactBadgeAndReflection(impact);

  // 4. Atualizar Visualizador Semanal (Segunda a Sexta)
  renderWeekSchedule(impact.totalHoursNeeded, state.hoursPerDay);

  // 5. Atualizar modo Parcelado ou Assinatura Recorrente
  renderPaymentModeDetails(impact, metrics);

  // 6. Atualizar Lista de Desejos e Horas Poupadas
  renderWishlist(metrics.effectiveHourlyRate);
  renderSavedCounter();

  // Salva estado atual
  saveToLocalStorage();
}

function updateImpactBadgeAndReflection(impact) {
  const h = impact.totalHoursNeeded;
  const days = impact.workdaysNeeded;

  let badgeClass = '';
  let badgeText = '';
  let title = '';
  let text = '';

  if (impact.price <= 0) {
    badgeClass = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300';
    badgeText = 'Sem custo';
    title = 'Pronto para calcular';
    text = 'Digite um valor acima para ver quantas horas de vida ele representa.';
  } else if (h < 2) {
    badgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300/60 dark:border-emerald-700';
    badgeText = 'Impacto Leve';
    title = 'Compra de baixo impacto no seu tempo';
    text = `Você paga este item em menos de 2 horas de esforço. Se é algo que agrega à sua rotina ou traz bem-estar genuíno, é um gasto muito saudável.`;
  } else if (h <= state.hoursPerDay) {
    badgeClass = 'bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300 border-teal-300/60 dark:border-teal-700';
    badgeText = 'Impacto Curto';
    title = 'Menos de 1 dia de trabalho';
    text = `Equivale a quase um dia inteiro de expediente. Imagine acordar amanhã de manhã e saber que o dia de amanhã será inteiramente dedicado a bancar esta compra. Vale a pena?`;
  } else if (days <= 3) {
    badgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300/60 dark:border-amber-700';
    badgeText = 'Impacto Moderado';
    title = `${days.toFixed(1).replace('.', ',')} dias de expediente dedicado`;
    text = `Você precisará trabalhar vários dias seguidos exclusivamente para pagar este produto. Dica: espere 48 horas antes de comprar para testar se o impulso passa.`;
  } else if (days <= 10) {
    badgeClass = 'bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 border-orange-300/60 dark:border-orange-700';
    badgeText = 'Alto Impacto';
    title = 'Quase 2 semanas de dedicação e suor';
    text = `Esta compra consome mais de 1 semana da sua vida produtiva! Recomendamos aplicar a 'Regra dos 30 Dias': anote o item na Lista de Desejos e só compre se ainda fizer sentido no mês que vem.`;
  } else {
    badgeClass = 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300/60 dark:border-rose-700';
    badgeText = 'Impacto Crítico / Longo Prazo';
    title = `Decisão financeira de grande porte (${Math.round(days)} dias de trabalho)`;
    text = `Isso representa uma parcela enorme do seu ano de trabalho. Tenha certeza absoluta de que não compromete sua reserva de emergência, tranquilidade financeira ou metas familiares.`;
  }

  el.badgeImpactLevel.className = `px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${badgeClass}`;
  el.badgeImpactText.textContent = badgeText;
  el.reflectionTitle.textContent = title;
  el.reflectionText.textContent = text;
}

function renderWeekSchedule(totalHoursNeeded, hoursPerDay) {
  const daysInWeek = 5; // Segunda a Sexta
  let remainingHours = totalHoursNeeded;

  const dayNames = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
  let lastDayIndex = -1;
  let lastDayRemainingHours = 0;

  for (let i = 1; i <= daysInWeek; i++) {
    const barEl = document.getElementById(`day-bar-${i}`);
    const labelEl = document.getElementById(`day-label-${i}`);

    if (remainingHours <= 0) {
      barEl.style.width = '0%';
      labelEl.textContent = '0h';
      barEl.className = 'h-full bg-brand-500 transition-all duration-500 w-0';
    } else if (remainingHours >= hoursPerDay) {
      barEl.style.width = '100%';
      labelEl.textContent = `${hoursPerDay}h`;
      barEl.className = 'h-full bg-brand-500 transition-all duration-500';
      remainingHours -= hoursPerDay;
      lastDayIndex = i - 1;
    } else {
      // Dia parcial
      const pct = (remainingHours / hoursPerDay) * 100;
      barEl.style.width = `${pct}%`;
      labelEl.textContent = formatDuration(remainingHours);
      barEl.className = 'h-full bg-teal-500 transition-all duration-500';
      lastDayRemainingHours = remainingHours;
      lastDayIndex = i - 1;
      remainingHours = 0;
    }
  }

  // Narrativa de cronograma
  if (totalHoursNeeded <= 0) {
    el.scheduleSummaryText.textContent = '0 dias';
    el.scheduleNarrative.textContent = '"Digite um valor para ver a distribuição na sua semana de trabalho."';
  } else if (totalHoursNeeded > (daysInWeek * hoursPerDay)) {
    const extraWeeks = Math.floor(totalHoursNeeded / (daysInWeek * hoursPerDay));
    el.scheduleSummaryText.textContent = `Mais de 1 semana inteira (+${extraWeeks} sem)`;
    el.scheduleNarrative.textContent = `"Esta compra consome mais que uma semana inteira de trabalho (${(totalHoursNeeded / hoursPerDay).toFixed(1).replace('.', ',')} dias no total)!"`;
  } else {
    const dayTarget = dayNames[lastDayIndex] || 'Segunda';
    
    // Calcular hora de término aproximada considerando início às 08:00
    const startHour = 8;
    const endMinutesTotal = (lastDayRemainingHours > 0 ? lastDayRemainingHours : hoursPerDay) * 60;
    const finishTotalMins = (startHour * 60) + endMinutesTotal;
    const finishH = Math.floor(finishTotalMins / 60).toString().padStart(2, '0');
    const finishM = Math.round(finishTotalMins % 60).toString().padStart(2, '0');

    el.scheduleSummaryText.textContent = `Até ${dayTarget}`;
    el.scheduleNarrative.textContent = `"Se você começar a trabalhar na Segunda-feira às 08:00, terminará de pagar este item na ${dayTarget}-feira por volta das ${finishH}:${finishM}."`;
  }
}

function renderPaymentModeDetails(impact, metrics) {
  if (state.payMode === 'installments') {
    el.extraModeResults.classList.remove('hidden');
    const n = state.installments;
    const installmentVal = impact.price / n;
    const installmentHours = metrics.effectiveHourlyRate > 0 ? installmentVal / metrics.effectiveHourlyRate : 0;

    el.extraModeResults.innerHTML = `
      <div class="flex items-center gap-2 text-brand-700 dark:text-brand-300 font-semibold">
        <i data-lucide="layers" class="w-4 h-4"></i>
        <span>Impacto do Parcelamento (${n}x sem juros):</span>
      </div>
      <p class="text-slate-600 dark:text-slate-300">
        Cada parcela custa <strong>${formatCurrency(installmentVal)}</strong> e exige 
        <strong class="text-brand-600 dark:text-brand-400">${formatDuration(installmentHours)} de trabalho</strong> todo mês durante ${n} meses consecutivos.
      </p>
    `;
    lucide.createIcons();
  } else if (state.payMode === 'subscription') {
    el.extraModeResults.classList.remove('hidden');
    const monthlyVal = impact.price;
    const annualVal = monthlyVal * 12;
    const annualHours = metrics.effectiveHourlyRate > 0 ? annualVal / metrics.effectiveHourlyRate : 0;

    el.extraModeResults.innerHTML = `
      <div class="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-semibold">
        <i data-lucide="repeat" class="w-4 h-4"></i>
        <span>Custo Anual da Assinatura:</span>
      </div>
      <p class="text-slate-600 dark:text-slate-300">
        Você trabalha <strong>${formatDuration(impact.totalHoursNeeded)}</strong> todo mês só para manter este serviço. 
        Em 1 ano, isso acumula <strong>${formatCurrency(annualVal)}</strong> ou 
        <strong class="text-purple-600 dark:text-purple-400">${formatDuration(annualHours)} (${formatWorkdaysNarrative(annualHours, state.hoursPerDay)})</strong> de esforço anual!
      </p>
    `;
    lucide.createIcons();
  } else {
    el.extraModeResults.classList.add('hidden');
  }
}

// --- LISTA DE DESEJOS & HISTÓRICO ---
function addToWishlist() {
  const price = state.itemPrice;
  if (!price || price <= 0) {
    showToast('Insira um valor válido para salvar na lista!', 'warning');
    return;
  }

  const metrics = calculateHourlyMetrics();
  const hoursNeeded = metrics.effectiveHourlyRate > 0 ? price / metrics.effectiveHourlyRate : 0;

  const newItem = {
    id: Date.now().toString(),
    name: state.itemName.trim() || 'Item sem nome',
    price: price,
    hoursNeeded: hoursNeeded,
    payMode: state.payMode,
    installments: state.installments,
    status: 'pending', // 'pending' | 'saved' | 'bought'
    createdAt: new Date().toLocaleDateString('pt-BR')
  };

  state.wishlist.unshift(newItem);
  saveToLocalStorage();
  renderWishlist(metrics.effectiveHourlyRate);
  showToast(`"${newItem.name}" adicionado à sua lista de desejos!`, 'success');
}

function handleWishlistAction(id, action) {
  const item = state.wishlist.find(i => i.id === id);
  if (!item) return;

  if (action === 'give_up') {
    // Desistiu de comprar -> Comemoração e soma ao contador de tempo de vida economizado!
    item.status = 'saved';
    state.savedMinutes += Math.round(item.hoursNeeded * 60);
    saveToLocalStorage();
    renderUI();

    // Disparar confete 🎉
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    showToast(`Parabéns! Você economizou ${formatDuration(item.hoursNeeded)} de vida ao desistir desta compra! 🎉`, 'success');
  } else if (action === 'bought') {
    item.status = 'bought';
    saveToLocalStorage();
    renderUI();
    showToast(`Item marcado como comprado com consciência!`, 'info');
  } else if (action === 'delete') {
    state.wishlist = state.wishlist.filter(i => i.id !== id);
    saveToLocalStorage();
    renderUI();
    showToast(`Item removido da lista.`, 'info');
  }
}

function renderWishlist(effectiveRate) {
  const pendingItems = state.wishlist.filter(i => i.status === 'pending');
  
  if (state.wishlist.length === 0) {
    el.wishlistEmptyState.classList.remove('hidden');
    el.wishlistContainer.innerHTML = '';
    el.wishlistTotalTime.textContent = '0h 0m';
    return;
  }

  el.wishlistEmptyState.classList.add('hidden');

  // Calcular tempo total acumulado da lista pendente
  let totalPendingHours = 0;
  pendingItems.forEach(item => {
    // Recalcular com a taxa horária atual
    const currentItemHours = effectiveRate > 0 ? item.price / effectiveRate : item.hoursNeeded;
    totalPendingHours += currentItemHours;
  });

  el.wishlistTotalTime.textContent = formatDuration(totalPendingHours);

  // Renderizar itens
  el.wishlistContainer.innerHTML = state.wishlist.map(item => {
    const currentItemHours = effectiveRate > 0 ? item.price / effectiveRate : item.hoursNeeded;
    const durationText = formatDuration(currentItemHours);
    
    let statusBadge = '';
    let actionButtons = '';

    if (item.status === 'pending') {
      statusBadge = `<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">${durationText} de trabalho</span>`;
      actionButtons = `
        <button onclick="handleWishlistAction('${item.id}', 'give_up')" class="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1 transition" title="Desisti de comprar! Poupe seu tempo de vida">
          <i data-lucide="shield-check" class="w-3.5 h-3.5"></i> Desisti (Poupar!)
        </button>
        <button onclick="handleWishlistAction('${item.id}', 'bought')" class="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition" title="Comprei">
          <i data-lucide="check" class="w-3.5 h-3.5"></i>
        </button>
        <button onclick="handleWishlistAction('${item.id}', 'delete')" class="px-2 py-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs transition" title="Excluir">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      `;
    } else if (item.status === 'saved') {
      statusBadge = `<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1"><i data-lucide="sparkles" class="w-3 h-3"></i> ${durationText} economizados!</span>`;
      actionButtons = `
        <button onclick="handleWishlistAction('${item.id}', 'delete')" class="px-2 py-1 rounded-lg text-slate-400 hover:text-rose-500 text-xs transition">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      `;
    } else {
      statusBadge = `<span class="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">Comprado</span>`;
      actionButtons = `
        <button onclick="handleWishlistAction('${item.id}', 'delete')" class="px-2 py-1 rounded-lg text-slate-400 hover:text-rose-500 text-xs transition">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      `;
    }

    return `
      <div class="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs">
        <div class="flex-1 min-w-[140px]">
          <div class="flex items-center gap-2">
            <span class="font-bold text-slate-900 dark:text-white">${escapeHtml(item.name)}</span>
            <span class="text-slate-500 dark:text-slate-400 font-semibold">(${formatCurrency(item.price)})</span>
          </div>
          <div class="flex items-center gap-2 mt-1">
            ${statusBadge}
            <span class="text-[10px] text-slate-400">${item.createdAt}</span>
          </div>
        </div>
        <div class="flex items-center gap-1.5">
          ${actionButtons}
        </div>
      </div>
    `;
  }).join('');

  lucide.createIcons();
}

function renderSavedCounter() {
  const totalHoursSaved = state.savedMinutes / 60;
  const text = formatDuration(totalHoursSaved);
  el.navSavedCounter.textContent = `${text} poupadas`;
  el.totalSavedTimeDisplay.textContent = text;
}

// --- COMPARTILHAR / COPIAR RESUMO ---
function copySummaryCard() {
  const metrics = calculateHourlyMetrics();
  const impact = calculatePurchaseImpact(metrics);
  const itemName = state.itemName.trim() || 'Compra';
  const timeStr = formatDuration(impact.totalHoursNeeded);
  const workdaysStr = formatWorkdaysNarrative(impact.totalHoursNeeded, state.hoursPerDay);

  let extraText = '';
  if (state.payMode === 'installments') {
    extraText = `\n💳 Parcelado: ${state.installments}x de ${formatCurrency(impact.price / state.installments)}`;
  } else if (state.payMode === 'subscription') {
    extraText = `\n🔄 Custo anual: ${formatCurrency(impact.price * 12)} (${formatDuration(impact.totalHoursNeeded * 12)} de trabalho)`;
  }

  const textToCopy = 
`⏳ *PREÇO DO MEU TEMPO*
Item: *${itemName}* (${formatCurrency(impact.price)})
Tempo de trabalho: *${timeStr}* (~${workdaysStr})
Impacto: *${impact.monthPercentage.toFixed(1).replace('.', ',')}%* da renda mensal
Meu valor/hora: ${formatCurrency(metrics.effectiveHourlyRate)}/h${extraText}

💡 _Dinheiro é tempo de vida acumulado: gaste com o que realmente importa!_
👉 Calculado em: Preço do Meu Tempo`;

  navigator.clipboard.writeText(textToCopy).then(() => {
    el.btnCopyText.textContent = 'Copiado para o Clipboard!';
    setTimeout(() => {
      el.btnCopyText.textContent = 'Copiar Resumo p/ WhatsApp';
    }, 2500);
    showToast('Resumo copiado com sucesso! Pode colar no WhatsApp ou redes.', 'success');
  }).catch(() => {
    showToast('Não foi possível copiar automaticamente.', 'warning');
  });
}

// --- TOAST NOTIFICATIONS ---
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  const icon = type === 'success' ? 'check-circle' : type === 'warning' ? 'alert-triangle' : 'info';
  const colorClass = type === 'success' 
    ? 'bg-emerald-800 text-white' 
    : type === 'warning' 
    ? 'bg-amber-800 text-white' 
    : 'bg-slate-800 text-white';

  toast.className = `flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-xs font-medium ${colorClass} toast-enter pointer-events-auto`;
  toast.innerHTML = `<i data-lucide="${icon}" class="w-4 h-4"></i><span>${escapeHtml(message)}</span>`;
  
  el.toastContainer.appendChild(toast);
  lucide.createIcons();

  setTimeout(() => {
    toast.classList.remove('toast-enter');
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function escapeHtml(string) {
  const div = document.createElement('div');
  div.textContent = string;
  return div.innerHTML;
}

// --- DARK MODE THEME ---
function applyTheme(isDark) {
  if (isDark) {
    document.documentElement.classList.add('dark');
    el.iconSun.classList.remove('hidden');
    el.iconMoon.classList.add('hidden');
    state.theme = 'dark';
  } else {
    document.documentElement.classList.remove('dark');
    el.iconSun.classList.add('hidden');
    el.iconMoon.classList.remove('hidden');
    state.theme = 'light';
  }
}

function toggleTheme() {
  const isDark = !document.documentElement.classList.contains('dark');
  applyTheme(isDark);
  saveToLocalStorage();
}

// --- EVENT LISTENERS E INICIALIZAÇÃO ---
function setupEventListeners() {
  // Tema
  el.btnTheme.addEventListener('click', toggleTheme);

  // Abas de tipo de salário
  el.tabMonthly.addEventListener('click', () => {
    state.salaryType = 'monthly';
    el.tabMonthly.className = 'salary-type-tab py-1.5 px-3 text-xs font-semibold rounded-lg transition bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white';
    el.tabHourly.className = 'salary-type-tab py-1.5 px-3 text-xs font-medium rounded-lg transition text-slate-500 hover:text-slate-900 dark:hover:text-white';
    el.wrapperMonthly.classList.remove('hidden');
    el.wrapperHourly.classList.add('hidden');
    renderUI();
  });

  el.tabHourly.addEventListener('click', () => {
    state.salaryType = 'hourly';
    el.tabHourly.className = 'salary-type-tab py-1.5 px-3 text-xs font-semibold rounded-lg transition bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white';
    el.tabMonthly.className = 'salary-type-tab py-1.5 px-3 text-xs font-medium rounded-lg transition text-slate-500 hover:text-slate-900 dark:hover:text-white';
    el.wrapperHourly.classList.remove('hidden');
    el.wrapperMonthly.classList.add('hidden');
    renderUI();
  });

  // Inputs Salário & Trabalho
  el.inputSalary.addEventListener('input', (e) => {
    state.monthlySalary = parseCurrencyInput(e.target.value);
    renderUI();
  });

  el.inputDirectHourly.addEventListener('input', (e) => {
    state.directHourlyRate = parseCurrencyInput(e.target.value);
    renderUI();
  });

  el.inputHoursDay.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val > 0 && val <= 24) {
      state.hoursPerDay = val;
      renderUI();
    }
  });

  el.inputDaysWeek.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val > 0 && val <= 7) {
      state.daysPerWeek = val;
      renderUI();
    }
  });

  // Calculadora CLT
  el.btnToggleClt.addEventListener('click', () => {
    el.cltBox.classList.toggle('hidden');
  });

  el.btnApplyClt.addEventListener('click', () => {
    const gross = parseCurrencyInput(el.inputCltGross.value);
    if (gross <= 0) {
      showToast('Digite um salário bruto válido!', 'warning');
      return;
    }
    const result = calculateCLTNetSalary(gross);
    state.monthlySalary = result.net;
    el.inputSalary.value = formatNumberInput(result.net);
    
    el.cltResultHint.textContent = `Líquido estimado: ${formatCurrency(result.net)} (INSS: ${formatCurrency(result.inss)} | IRRF: ${formatCurrency(result.irpf)})`;
    el.cltResultHint.classList.remove('hidden');

    renderUI();
    showToast('Salário líquido CLT calculado e atualizado!', 'success');
  });

  // Toggle Fator Vida Real
  el.btnToggleAdvanced.addEventListener('click', () => {
    el.advancedBox.classList.toggle('hidden');
    el.advancedChevron.classList.toggle('rotate-180');
  });

  el.inputCommuteHours.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    state.commuteHours = isNaN(val) ? 0 : Math.max(0, val);
    renderUI();
  });

  el.inputWorkExpenses.addEventListener('input', (e) => {
    state.workExpenses = parseCurrencyInput(e.target.value);
    renderUI();
  });

  // Inputs Compra
  el.inputItemName.addEventListener('input', (e) => {
    state.itemName = e.target.value;
    renderUI();
  });

  el.inputItemPrice.addEventListener('input', (e) => {
    state.itemPrice = parseCurrencyInput(e.target.value);
    renderUI();
  });

  // Modos de Pagamento
  function updatePayModeUI(mode) {
    state.payMode = mode;
    const tabs = [
      { id: 'cash', btn: el.payCash },
      { id: 'installments', btn: el.payInstallments },
      { id: 'subscription', btn: el.paySubscription }
    ];

    tabs.forEach(t => {
      if (t.id === mode) {
        t.btn.className = 'pay-type-tab py-1.5 rounded-lg bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white font-semibold transition';
      } else {
        t.btn.className = 'pay-type-tab py-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition';
      }
    });

    el.boxInstallments.classList.toggle('hidden', mode !== 'installments');
    el.boxSubscription.classList.toggle('hidden', mode !== 'subscription');
    renderUI();
  }

  el.payCash.addEventListener('click', () => updatePayModeUI('cash'));
  el.payInstallments.addEventListener('click', () => updatePayModeUI('installments'));
  el.paySubscription.addEventListener('click', () => updatePayModeUI('subscription'));

  el.rangeInstallments.addEventListener('input', (e) => {
    state.installments = parseInt(e.target.value, 10);
    el.installmentCountLabel.textContent = `${state.installments}x`;
    const instVal = state.itemPrice / state.installments;
    el.installmentCalcPreview.textContent = `= ${state.installments} parcelas de ${formatCurrency(instVal)}`;
    renderUI();
  });

  // Presets Rápidos
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('data-name');
      const priceStr = btn.getAttribute('data-price');
      const priceVal = parseCurrencyInput(priceStr);

      state.itemName = name;
      state.itemPrice = priceVal;

      el.inputItemName.value = name;
      el.inputItemPrice.value = formatNumberInput(priceVal);

      renderUI();
      showToast(`Exemplo carregado: ${name}`, 'info');
    });
  });

  // Ações de Salvar e Compartilhar
  el.btnAddWishlist.addEventListener('click', addToWishlist);
  el.btnCopyCard.addEventListener('click', copySummaryCard);
}

// --- INICIALIZADOR DA APLICAÇÃO ---
function init() {
  loadFromLocalStorage();

  // Restaurar formulários com estado carregado
  el.inputSalary.value = formatNumberInput(state.monthlySalary);
  el.inputDirectHourly.value = formatNumberInput(state.directHourlyRate);
  el.inputHoursDay.value = state.hoursPerDay;
  el.inputDaysWeek.value = state.daysPerWeek;
  el.inputCommuteHours.value = state.commuteHours;
  el.inputWorkExpenses.value = formatNumberInput(state.workExpenses);
  el.inputItemName.value = state.itemName;
  el.inputItemPrice.value = formatNumberInput(state.itemPrice);
  el.rangeInstallments.value = state.installments;
  el.installmentCountLabel.textContent = `${state.installments}x`;

  // Aplicar tema
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(state.theme === 'dark' || (!state.theme && prefersDark));

  // Aplicar tipo de salário
  if (state.salaryType === 'hourly') {
    el.tabHourly.click();
  }

  setupEventListeners();
  renderUI();
  lucide.createIcons();
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', init);

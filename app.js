/* ==========================================================================
   AeroCards Game Logic & State Management
   ========================================================================== */

// --- Application Constants & Defaults ---
const DEFAULTS = {
  multiplication: { minA: 5, maxA: 12, minB: 2, maxB: 12, size: 10, time: 8 },
  addition: { minA: 10, maxA: 99, minB: 10, maxB: 99, size: 10, time: 8 }
};

const ENCOURAGEMENTS = [
  "Brilliant!", "Spot on!", "Fantastic!", "Awesome!", 
  "Incredible!", "Great job!", "Nice reflex!", "Keep it up!"
];

// --- Confetti Animation Class ---
class ConfettiGenerator {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.animationId = null;
    this.colors = ['#bd93f9', '#ff79c6', '#8be9fd', '#50fa7b', '#ffb86c', '#ff5555'];
    
    window.addEventListener('resize', () => this.resizeCanvas());
    this.resizeCanvas();
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  spawn(count = 100) {
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height - this.canvas.height,
        r: Math.random() * 6 + 4,
        d: Math.random() * this.canvas.height,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        tilt: Math.random() * 10 - 5,
        tiltAngleIncremental: Math.random() * 0.07 + 0.02,
        tiltAngle: 0,
        vy: Math.random() * 3 + 2,
        vx: Math.random() * 2 - 1
      });
    }
    
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.animate();
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    let remaining = false;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.tiltAngle += p.tiltAngleIncremental;
      p.y += p.vy;
      p.x += p.vx;
      p.tilt = Math.sin(p.tiltAngle) * 12;

      if (p.y <= this.canvas.height) {
        remaining = true;
      }

      this.ctx.beginPath();
      this.ctx.lineWidth = p.r;
      this.ctx.strokeStyle = p.color;
      this.ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
      this.ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
      this.ctx.stroke();
    }

    if (remaining) {
      this.animationId = requestAnimationFrame(() => this.animate());
    }
  }
}

// --- App Controller ---
const App = {
  // DOM elements
  screens: {
    setup: document.getElementById('setup-screen'),
    drill: document.getElementById('drill-screen'),
    reviewIntro: document.getElementById('review-intro-screen'),
    results: document.getElementById('results-screen')
  },
  
  inputs: {
    form: document.getElementById('setup-form'),
    minOperandA: document.getElementById('input-min-operand-a'),
    maxOperandA: document.getElementById('input-max-operand-a'),
    minOperandB: document.getElementById('input-min-operand-b'),
    maxOperandB: document.getElementById('input-max-operand-b'),
    drillSize: document.getElementById('input-drill-size'),
    timeLimit: document.getElementById('input-time-limit'),
    unlimited: document.getElementById('toggle-unlimited'),
    answer: document.getElementById('input-answer'),
    answerForm: document.getElementById('drill-answer-form'),
    toggleKeypad: document.getElementById('toggle-keypad'),
    onscreenKeypad: document.getElementById('onscreen-keypad'),
    keypadDragHandle: document.getElementById('keypad-drag-handle')
  },

  badges: {
    minOperandA: document.getElementById('val-min-operand-a'),
    maxOperandA: document.getElementById('val-max-operand-a'),
    minOperandB: document.getElementById('val-min-operand-b'),
    maxOperandB: document.getElementById('val-max-operand-b'),
    drillSize: document.getElementById('val-drill-size'),
    timeLimit: document.getElementById('val-time-limit')
  },

  drill: {
    typeBadge: document.getElementById('drill-type-badge'),
    currentQ: document.getElementById('current-question-num'),
    totalQ: document.getElementById('total-questions-num'),
    operandA: document.getElementById('operand-a'),
    operandB: document.getElementById('operand-b'),
    operatorSymbol: document.getElementById('operator-symbol'),
    timerContainer: document.getElementById('timer-bar-container'),
    timerFill: document.getElementById('timer-bar-fill'),
    flashcard: document.getElementById('flashcard-element'),
    overlaySuccess: document.getElementById('overlay-success'),
    encouragementText: document.getElementById('encouragement-text'),
    correctionContainer: document.getElementById('correction-container'),
    correctEquationText: document.getElementById('correct-equation-text'),
    correctAnswerReinforce: document.getElementById('correct-answer-reinforce'),
    scoreCorrect: document.getElementById('score-correct-count'),
    scoreMissed: document.getElementById('score-missed-count')
  },

  results: {
    verdict: document.getElementById('results-verdict'),
    accuracy: document.getElementById('stat-accuracy'),
    avgSpeed: document.getElementById('stat-avg-speed'),
    totalTime: document.getElementById('stat-total-time'),
    tabMastered: document.getElementById('tab-mastered'),
    tabMissed: document.getElementById('tab-missed'),
    countMastered: document.getElementById('count-mastered'),
    countMissed: document.getElementById('count-missed'),
    listMastered: document.getElementById('results-list-mastered'),
    listMissed: document.getElementById('results-list-missed')
  },

  errorPanel: document.getElementById('setup-error-panel'),
  errorMessage: document.getElementById('setup-error-message'),
  confetti: null,

  // App State
  state: {
    operation: 'multiplication',
    minOperandA: 5,
    maxOperandA: 12,
    minOperandB: 2,
    maxOperandB: 12,
    drillSize: 10,
    timeLimit: 8,
    unlimitedTime: false,
    useScreenKeypad: true,
    
    // Drill data
    questions: [],
    currentIndex: 0,
    correctCount: 0,
    missedCount: 0,
    
    // Timer details
    questionTimeStart: null,
    timerInterval: null,
    secondsLeft: 0,
    
    // Reinforcement loop
    reinforcementMode: false,
    
    // Review flow
    reviewMode: false,
    reviewQueue: [], // indices of missed questions
    currentReviewItem: null,
    
    // Overall Stats
    drillStartTime: null,
    drillEndTime: null
  },

  // --- Initialize ---
  init() {
    this.confetti = new ConfettiGenerator('confetti-canvas');
    this.bindEvents();
    this.loadCachedSettings();
    this.syncSliders();
    this.initDraggable();
  },

  // --- Event Binding ---
  bindEvents() {
    // Operation Tab selector
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const label = e.currentTarget;
        const input = label.querySelector('input');
        
        toggleBtns.forEach(b => b.classList.remove('active'));
        label.classList.add('active');
        
        this.state.operation = input.value;
        this.applyOperationDefaults(input.value);
        this.validateSetup();
      });
    });

    // Slider inputs
    this.inputs.minOperandA.addEventListener('input', () => {
      this.badges.minOperandA.textContent = this.inputs.minOperandA.value;
      this.validateSetup();
    });

    this.inputs.maxOperandA.addEventListener('input', () => {
      this.badges.maxOperandA.textContent = this.inputs.maxOperandA.value;
      this.validateSetup();
    });

    this.inputs.minOperandB.addEventListener('input', () => {
      this.badges.minOperandB.textContent = this.inputs.minOperandB.value;
      this.validateSetup();
    });

    this.inputs.maxOperandB.addEventListener('input', () => {
      this.badges.maxOperandB.textContent = this.inputs.maxOperandB.value;
      this.validateSetup();
    });

    this.inputs.drillSize.addEventListener('input', () => {
      this.badges.drillSize.textContent = this.inputs.drillSize.value;
    });

    this.inputs.timeLimit.addEventListener('input', () => {
      this.badges.timeLimit.textContent = this.inputs.timeLimit.value + 's';
    });

    // Unlimited Switch
    this.inputs.unlimited.addEventListener('change', () => {
      const isChecked = this.inputs.unlimited.checked;
      this.inputs.timeLimit.disabled = isChecked;
      if (isChecked) {
        this.badges.timeLimit.textContent = '∞';
        this.badges.timeLimit.style.opacity = '0.5';
      } else {
        this.badges.timeLimit.textContent = this.inputs.timeLimit.value + 's';
        this.badges.timeLimit.style.opacity = '1';
      }
    });

    // Setup submit
    this.inputs.form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (this.validateSetup()) {
        this.startSession();
      }
    });

    // Answer submission
    this.inputs.answerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAnswerSubmit();
    });

    // Exit Drill
    document.getElementById('btn-exit-drill').addEventListener('click', () => {
      if (confirm('Are you sure you want to quit this drill? Your progress will be lost.')) {
        this.stopTimer();
        this.switchScreen('setup');
      }
    });

    // Start Review
    document.getElementById('btn-start-review').addEventListener('click', () => {
      this.startReviewRound();
    });

    // Results Tabs
    this.results.tabMastered.addEventListener('click', () => {
      this.results.tabMastered.classList.add('active');
      this.results.tabMissed.classList.remove('active');
      this.results.listMastered.classList.remove('hide');
      this.results.listMissed.classList.add('hide');
    });

    this.results.tabMissed.addEventListener('click', () => {
      this.results.tabMissed.classList.add('active');
      this.results.tabMastered.classList.remove('active');
      this.results.listMissed.classList.remove('hide');
      this.results.listMastered.classList.add('hide');
    });

    // Play again buttons
    document.getElementById('btn-configure').addEventListener('click', () => {
      this.confetti.stop();
      this.switchScreen('setup');
    });

    document.getElementById('btn-retry').addEventListener('click', () => {
      this.confetti.stop();
      this.startSession();
    });

    // Keyboard Interface Toggle Listener
    this.inputs.toggleKeypad.addEventListener('change', () => {
      this.state.useScreenKeypad = this.inputs.toggleKeypad.checked;
      this.saveSettings();
    });

    // Resize handler to reposition the keypad
    window.addEventListener('resize', () => {
      if (this.screens.drill.classList.contains('active') && this.state.useScreenKeypad) {
        this.resetKeypadPosition();
      }
    });

    // On-Screen Keypad key buttons pointer events
    const keys = this.inputs.onscreenKeypad.querySelectorAll('.keypad-key');
    keys.forEach(key => {
      key.addEventListener('pointerdown', (e) => {
        e.preventDefault(); // suppress focus shifts or text selections
        const val = key.getAttribute('data-key');
        this.handleKeypadPress(val);
      });
    });
  },

  // --- Logic Functions ---
  applyOperationDefaults(op) {
    const config = DEFAULTS[op];
    
    // Adjust sliders range and defaults
    if (op === 'addition') {
      this.inputs.minOperandA.min = 10;
      this.inputs.minOperandA.max = 99;
      this.inputs.minOperandA.value = config.minA;
      
      this.inputs.maxOperandA.min = 10;
      this.inputs.maxOperandA.max = 99;
      this.inputs.maxOperandA.value = config.maxA;

      this.inputs.minOperandB.min = 10;
      this.inputs.minOperandB.max = 99;
      this.inputs.minOperandB.value = config.minB;
      
      this.inputs.maxOperandB.min = 10;
      this.inputs.maxOperandB.max = 99;
      this.inputs.maxOperandB.value = config.maxB;
    } else {
      this.inputs.minOperandA.min = 2;
      this.inputs.minOperandA.max = 100;
      this.inputs.minOperandA.value = config.minA;
      
      this.inputs.maxOperandA.min = 2;
      this.inputs.maxOperandA.max = 100;
      this.inputs.maxOperandA.value = config.maxA;

      this.inputs.minOperandB.min = 2;
      this.inputs.minOperandB.max = 100;
      this.inputs.minOperandB.value = config.minB;
      
      this.inputs.maxOperandB.min = 2;
      this.inputs.maxOperandB.max = 100;
      this.inputs.maxOperandB.value = config.maxB;
    }

    this.inputs.drillSize.value = config.size;
    this.inputs.timeLimit.value = config.time;
    this.inputs.unlimited.checked = false;
    this.inputs.timeLimit.disabled = false;
    
    this.syncSliders();
  },

  syncSliders() {
    this.badges.minOperandA.textContent = this.inputs.minOperandA.value;
    this.badges.maxOperandA.textContent = this.inputs.maxOperandA.value;
    this.badges.minOperandB.textContent = this.inputs.minOperandB.value;
    this.badges.maxOperandB.textContent = this.inputs.maxOperandB.value;
    this.badges.drillSize.textContent = this.inputs.drillSize.value;
    this.badges.timeLimit.textContent = this.inputs.timeLimit.value + 's';
    this.badges.timeLimit.style.opacity = '1';
  },

  loadCachedSettings() {
    try {
      const cached = localStorage.getItem('aerocards_settings');
      if (cached) {
        const settings = JSON.parse(cached);
        this.state.operation = settings.operation || 'multiplication';
        
        // Find toggles
        const toggles = document.querySelectorAll('input[name="operation"]');
        toggles.forEach(t => {
          if (t.value === this.state.operation) {
            t.checked = true;
            t.parentElement.classList.add('active');
          } else {
            t.parentElement.classList.remove('active');
          }
        });

        // Set slider bounds
        if (this.state.operation === 'addition') {
          this.inputs.minOperandA.min = 10;
          this.inputs.minOperandA.max = 99;
          this.inputs.maxOperandA.min = 10;
          this.inputs.maxOperandA.max = 99;
          this.inputs.minOperandB.min = 10;
          this.inputs.minOperandB.max = 99;
          this.inputs.maxOperandB.min = 10;
          this.inputs.maxOperandB.max = 99;
        } else {
          this.inputs.minOperandA.min = 2;
          this.inputs.minOperandA.max = 100;
          this.inputs.maxOperandA.min = 2;
          this.inputs.maxOperandA.max = 100;
          this.inputs.minOperandB.min = 2;
          this.inputs.minOperandB.max = 100;
          this.inputs.maxOperandB.min = 2;
          this.inputs.maxOperandB.max = 100;
        }

        // Backwards compatibility support
        const defaultMinB = this.state.operation === 'multiplication' ? 2 : 10;
        this.inputs.minOperandA.value = settings.minOperandA !== undefined ? settings.minOperandA : settings.minOperand;
        this.inputs.maxOperandA.value = settings.maxOperandA !== undefined ? settings.maxOperandA : settings.maxOperand;
        this.inputs.minOperandB.value = settings.minOperandB !== undefined ? settings.minOperandB : defaultMinB;
        this.inputs.maxOperandB.value = settings.maxOperandB !== undefined ? settings.maxOperandB : settings.maxOperand;
        
        this.inputs.drillSize.value = settings.drillSize;
        
        if (settings.useScreenKeypad !== undefined) {
          this.state.useScreenKeypad = settings.useScreenKeypad;
        } else {
          this.state.useScreenKeypad = ('ontouchstart' in window);
        }
        this.inputs.toggleKeypad.checked = this.state.useScreenKeypad;
        
        if (settings.unlimitedTime) {
          this.inputs.unlimited.checked = true;
          this.inputs.timeLimit.disabled = true;
        } else {
          this.inputs.unlimited.checked = false;
          this.inputs.timeLimit.value = settings.timeLimit;
          this.inputs.timeLimit.disabled = false;
        }
      } else {
        // Enforce approved defaults for multiplication
        this.inputs.minOperandA.value = 5;
        this.inputs.maxOperandA.value = 12;
        this.inputs.minOperandB.value = 2;
        this.inputs.maxOperandB.value = 12;
        this.inputs.drillSize.value = 10;
        this.inputs.timeLimit.value = 8;
        
        this.state.useScreenKeypad = ('ontouchstart' in window);
        this.inputs.toggleKeypad.checked = this.state.useScreenKeypad;
      }
    } catch (e) {
      console.error('Error loading settings', e);
    }
  },

  saveSettings() {
    const settings = {
      operation: this.state.operation,
      minOperandA: parseInt(this.inputs.minOperandA.value),
      maxOperandA: parseInt(this.inputs.maxOperandA.value),
      minOperandB: parseInt(this.inputs.minOperandB.value),
      maxOperandB: parseInt(this.inputs.maxOperandB.value),
      drillSize: parseInt(this.inputs.drillSize.value),
      timeLimit: parseInt(this.inputs.timeLimit.value),
      unlimitedTime: this.inputs.unlimited.checked,
      useScreenKeypad: this.inputs.toggleKeypad.checked
    };
    localStorage.setItem('aerocards_settings', JSON.stringify(settings));
  },

  validateSetup() {
    const minA = parseInt(this.inputs.minOperandA.value);
    const maxA = parseInt(this.inputs.maxOperandA.value);
    const minB = parseInt(this.inputs.minOperandB.value);
    const maxB = parseInt(this.inputs.maxOperandB.value);
    
    let errors = [];
    if (minA > maxA) {
      errors.push(`Operand A Minimum (Min A: ${minA}) cannot exceed Maximum (Max A: ${maxA}).`);
    }
    if (minB > maxB) {
      errors.push(`Operand B Minimum (Min B: ${minB}) cannot exceed Maximum (Max B: ${maxB}).`);
    }
    
    if (errors.length > 0) {
      this.errorPanel.classList.remove('hide');
      this.errorMessage.innerHTML = errors.join('<br>');
      document.getElementById('btn-start').disabled = true;
      return false;
    } else {
      this.errorPanel.classList.add('hide');
      document.getElementById('btn-start').disabled = false;
      return true;
    }
  },

  showFloatingFeedback(text) {
    const pill = document.createElement('div');
    pill.className = 'floating-feedback';
    pill.textContent = text;
    this.drill.flashcard.appendChild(pill);
    setTimeout(() => pill.remove(), 800);
  },

  switchScreen(screenName) {
    Object.values(this.screens).forEach(screen => {
      screen.classList.remove('active');
    });
    
    if (screenName !== 'drill') {
      this.inputs.onscreenKeypad.classList.add('hide');
    } else if (this.state.useScreenKeypad) {
      this.inputs.onscreenKeypad.classList.remove('hide');
    }
    
    setTimeout(() => {
      this.screens[screenName].classList.add('active');
      if (screenName === 'drill') {
        if (this.state.useScreenKeypad) {
          this.resetKeypadPosition();
        }
        this.inputs.answer.focus();
      }
    }, 50);
  },

  // --- Session Generation ---
  startSession() {
    this.saveSettings();
    
    // Initialize State
    this.state.operation = this.state.operation;
    this.state.minOperandA = parseInt(this.inputs.minOperandA.value);
    this.state.maxOperandA = parseInt(this.inputs.maxOperandA.value);
    this.state.minOperandB = parseInt(this.inputs.minOperandB.value);
    this.state.maxOperandB = parseInt(this.inputs.maxOperandB.value);
    this.state.drillSize = parseInt(this.inputs.drillSize.value);
    this.state.timeLimit = parseInt(this.inputs.timeLimit.value);
    this.state.unlimitedTime = this.inputs.unlimited.checked;
    this.state.useScreenKeypad = this.inputs.toggleKeypad.checked;
    
    this.state.currentIndex = 0;
    this.state.correctCount = 0;
    this.state.missedCount = 0;
    this.state.reinforcementMode = false;
    this.state.reviewMode = false;
    this.state.reviewQueue = [];
    
    this.drill.scoreCorrect.textContent = '0';
    this.drill.scoreMissed.textContent = '0';
    this.drill.correctionContainer.classList.add('hide');
    this.drill.overlaySuccess.classList.add('hide');
    this.inputs.answer.value = '';
    
    // Toggle on-screen keyboard display & inputs
    if (this.state.useScreenKeypad) {
      this.inputs.onscreenKeypad.classList.remove('hide');
      this.inputs.answer.setAttribute('inputmode', 'none');
      this.inputs.answer.setAttribute('type', 'text');
      this.inputs.answer.setAttribute('pattern', '[0-9]*');
    } else {
      this.inputs.onscreenKeypad.classList.add('hide');
      this.inputs.answer.setAttribute('inputmode', 'numeric');
      this.inputs.answer.setAttribute('type', 'number');
      this.inputs.answer.removeAttribute('pattern');
    }
    
    this.generateQuestions();
    
    this.state.drillStartTime = Date.now();
    this.drill.typeBadge.textContent = this.state.operation.charAt(0).toUpperCase() + this.state.operation.slice(1);
    this.drill.totalQ.textContent = this.state.questions.length;
    
    this.switchScreen('drill');
    this.loadQuestion();
  },

  generateQuestions() {
    const minA = this.state.minOperandA;
    const maxA = this.state.maxOperandA;
    const minB = this.state.minOperandB;
    const maxB = this.state.maxOperandB;
    const isMultiplication = this.state.operation === 'multiplication';
    
    // Generate pool of valid pairs
    const pool = [];
    for (let a = minA; a <= maxA; a++) {
      for (let b = minB; b <= maxB; b++) {
        pool.push({ a, b });
      }
    }
    
    // If pool is empty (e.g. invalid bounds somehow), fallback
    if (pool.length === 0) {
      pool.push({ a: minA, b: minB });
    }
    
    // Shuffle the pool using Fisher-Yates
    this.shuffle(pool);
    
    // Select questions
    const finalQuestions = [];
    const targetSize = this.state.drillSize;
    
    for (let i = 0; i < targetSize; i++) {
      // If we run out of unique questions in the pool, wrap around/recycle
      const pair = pool[i % pool.length];
      
      // Randomize display order (e.g. sometimes a x b, other times b x a)
      const swap = Math.random() < 0.5;
      const displayA = swap ? pair.b : pair.a;
      const displayB = swap ? pair.a : pair.b;
      
      const answer = isMultiplication ? (pair.a * pair.b) : (pair.a + pair.b);
      
      finalQuestions.push({
        operandA: pair.a,
        operandB: pair.b,
        displayA,
        displayB,
        answer,
        attempts: 0,
        timeSpent: 0,
        status: 'unanswered' // 'correct', 'missed'
      });
    }
    
    this.state.questions = finalQuestions;
  },

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  },

  // --- Drill Flow ---
  loadQuestion() {
    this.inputs.answer.value = '';
    this.inputs.answer.focus();
    
    this.drill.flashcard.classList.remove('card-shake');
    this.drill.correctionContainer.classList.add('hide');
    this.state.reinforcementMode = false;

    let q;
    if (this.state.reviewMode) {
      this.drill.totalQ.textContent = this.state.reviewQueue.length;
      this.drill.currentQ.textContent = this.state.currentIndex + 1;
      q = this.state.reviewQueue[this.state.currentIndex];
    } else {
      this.drill.currentQ.textContent = this.state.currentIndex + 1;
      q = this.state.questions[this.state.currentIndex];
    }

    // Display Operands
    this.drill.operandA.textContent = q.displayA;
    this.drill.operandB.textContent = q.displayB;
    this.drill.operatorSymbol.textContent = this.state.operation === 'multiplication' ? '×' : '+';
    
    // Start Time Tracking
    this.state.questionTimeStart = Date.now();
    
    // Timer handling
    this.stopTimer();
    if (this.state.unlimitedTime || this.state.reviewMode) {
      // Hide timer bar container
      this.drill.timerContainer.classList.add('disabled');
    } else {
      this.drill.timerContainer.classList.remove('disabled');
      this.startTimer();
    }
  },

  // --- Timer Mechanics ---
  startTimer() {
    const limit = this.state.timeLimit;
    const intervalMs = 50;
    const totalTicks = (limit * 1000) / intervalMs;
    let tickCount = 0;
    
    this.drill.timerFill.style.transform = 'scaleX(1)';
    this.drill.timerFill.style.backgroundColor = 'var(--success)';
    this.drill.flashcard.classList.remove('timer-pulse-active');
    
    this.state.timerInterval = setInterval(() => {
      tickCount++;
      const ratio = 1 - (tickCount / totalTicks);
      
      if (ratio <= 0) {
        this.drill.timerFill.style.transform = 'scaleX(0)';
        this.handleTimeout();
      } else {
        this.drill.timerFill.style.transform = `scaleX(${ratio})`;
        
        // Dynamic coloring
        if (ratio <= 0.2) {
          this.drill.timerFill.style.backgroundColor = 'var(--error)';
          this.drill.flashcard.classList.add('timer-pulse-active');
        } else if (ratio <= 0.5) {
          this.drill.timerFill.style.backgroundColor = 'hsl(35, 100%, 55%)'; // Orange/yellow
        }
      }
    }, intervalMs);
  },

  stopTimer() {
    if (this.state.timerInterval) {
      clearInterval(this.state.timerInterval);
      this.state.timerInterval = null;
    }
    this.drill.flashcard.classList.remove('timer-pulse-active');
  },

  handleTimeout() {
    this.stopTimer();
    
    const q = this.state.reviewMode 
      ? this.state.reviewQueue[this.state.currentIndex]
      : this.state.questions[this.state.currentIndex];
      
    q.attempts++;
    
    if (!this.state.reviewMode) {
      if (q.status === 'unanswered') {
        q.status = 'missed';
        this.state.missedCount++;
        this.drill.scoreMissed.textContent = this.state.missedCount;
      }
    }
    
    // Trigger reinforcement
    this.triggerReinforcement(q);
  },

  triggerReinforcement(q) {
    this.state.reinforcementMode = true;
    this.drill.flashcard.classList.add('card-shake');
    setTimeout(() => this.drill.flashcard.classList.remove('card-shake'), 400);

    const equationSymbol = this.state.operation === 'multiplication' ? '×' : '+';
    this.drill.correctEquationText.textContent = `${q.displayA} ${equationSymbol} ${q.displayB} = ${q.answer}`;
    this.drill.correctAnswerReinforce.textContent = q.answer;
    
    this.drill.correctionContainer.classList.remove('hide');
    
    // Re-enable input for typing correct answer
    this.inputs.answer.value = '';
    this.inputs.answer.focus();
  },

  // --- Answer Evaluation ---
  handleAnswerSubmit() {
    const userValStr = this.inputs.answer.value.trim();
    if (!userValStr) return; // ignore blank submit
    
    const userVal = parseInt(userValStr);
    const q = this.state.reviewMode 
      ? this.state.reviewQueue[this.state.currentIndex]
      : this.state.questions[this.state.currentIndex];
      
    const isCorrect = userVal === q.answer;

    // --- REINFORCEMENT INPUT EVALUATION ---
    if (this.state.reinforcementMode) {
      if (isCorrect) {
        // Reinforcement loop success! Hide panel and advance.
        this.drill.correctionContainer.classList.add('hide');
        this.state.reinforcementMode = false;
        this.inputs.answer.value = '';
        this.advanceSession();
      } else {
        // Typing incorrect answer in reinforcement mode
        this.drill.flashcard.classList.add('card-shake');
        setTimeout(() => this.drill.flashcard.classList.remove('card-shake'), 400);
        this.inputs.answer.value = '';
        this.inputs.answer.focus();
      }
      return;
    }

    // --- REGULAR MODE EVALUATION ---
    this.stopTimer();
    const timeSpent = (Date.now() - this.state.questionTimeStart) / 1000;
    q.timeSpent += timeSpent;
    q.attempts++;

    if (isCorrect) {
      // Score tracking for primary round
      if (!this.state.reviewMode) {
        if (q.attempts === 1) {
          q.status = 'correct';
          this.state.correctCount++;
          this.drill.scoreCorrect.textContent = this.state.correctCount;
        }
      }

      // Briefly display floating feedback
      const enc = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
      this.showFloatingFeedback(`✓ ${enc}`);

      // Clear input and focus (keep keyboard open synchronously)
      this.inputs.answer.value = '';
      this.inputs.answer.focus();

      // Remove from review queue if correct during review
      if (this.state.reviewMode) {
        // Splice out this completed review item
        this.state.reviewQueue.splice(this.state.currentIndex, 1);
        // Since we removed item, currentIndex points to next item naturally
        // We only check bounds
        if (this.state.currentIndex >= this.state.reviewQueue.length) {
          this.state.currentIndex = 0; // wrap to start of remaining queue
        }
        
        if (this.state.reviewQueue.length === 0) {
          this.finishSession();
        } else {
          this.loadQuestion();
        }
      } else {
        this.advanceSession();
      }

    } else {
      // Wrong answer submitted
      if (!this.state.reviewMode) {
        if (q.status === 'unanswered') {
          q.status = 'missed';
          this.state.missedCount++;
          this.drill.scoreMissed.textContent = this.state.missedCount;
        }
      }
      
      // Trigger reinforcement screen
      this.triggerReinforcement(q);
    }
  },

  advanceSession() {
    if (this.state.reviewMode) {
      this.state.currentIndex++;
      if (this.state.currentIndex >= this.state.reviewQueue.length) {
        this.state.currentIndex = 0;
      }
      this.loadQuestion();
    } else {
      this.state.currentIndex++;
      if (this.state.currentIndex >= this.state.questions.length) {
        this.checkDrillProgress();
      } else {
        this.loadQuestion();
      }
    }
  },

  checkDrillProgress() {
    this.stopTimer();
    
    // Collect missed items for review
    const missed = this.state.questions.filter(q => q.status === 'missed');
    
    if (missed.length > 0) {
      // Transition to Review Interstitial
      document.getElementById('review-missed-count-text').textContent = missed.length;
      this.state.reviewQueue = missed; // Queue holds references to original question objects
      this.switchScreen('reviewIntro');
    } else {
      // Finished with 100% first time
      this.finishSession();
    }
  },

  startReviewRound() {
    this.state.reviewMode = true;
    this.state.currentIndex = 0;
    this.drill.typeBadge.textContent = "Review Round";
    this.switchScreen('drill');
    this.loadQuestion();
  },

  // --- Completion & Results ---
  finishSession() {
    this.state.drillEndTime = Date.now();
    this.stopTimer();
    
    const totalTimeMs = this.state.drillEndTime - this.state.drillStartTime;
    const totalTimeSec = (totalTimeMs / 1000).toFixed(1);
    
    // Accuracy based on first attempt correctness
    const totalQ = this.state.questions.length;
    const accuracy = Math.round((this.state.correctCount / totalQ) * 100);
    
    // Average speed on first-attempt or correct decisions
    const avgSec = (this.state.questions.reduce((sum, q) => sum + q.timeSpent, 0) / totalQ).toFixed(1);

    this.results.accuracy.textContent = `${accuracy}%`;
    this.results.avgSpeed.textContent = `${avgSec}s`;
    this.results.totalTime.textContent = `${totalTimeSec}s`;
    
    // Set descriptive verdict based on performance
    if (accuracy === 100) {
      this.results.verdict.textContent = "Perfect Reflexes! Flawless Score!";
    } else if (accuracy >= 85) {
      this.results.verdict.textContent = "Outstanding Speed and Precision!";
    } else if (accuracy >= 70) {
      this.results.verdict.textContent = "Great job! Accuracy is building up.";
    } else {
      this.results.verdict.textContent = "Keep practicing! Review completed.";
    }

    // Populate Mastered vs Missed lists
    this.results.listMastered.innerHTML = '';
    this.results.listMissed.innerHTML = '';
    
    const masteredItems = this.state.questions.filter(q => q.status === 'correct');
    const missedItems = this.state.questions.filter(q => q.status === 'missed');
    
    this.results.countMastered.textContent = masteredItems.length;
    this.results.countMissed.textContent = missedItems.length;

    const opSymbol = this.state.operation === 'multiplication' ? '×' : '+';

    masteredItems.forEach(q => {
      this.results.listMastered.appendChild(this.createResultRow(q, opSymbol, true));
    });
    
    missedItems.forEach(q => {
      this.results.listMissed.appendChild(this.createResultRow(q, opSymbol, false));
    });

    // Default tab resets
    this.results.tabMastered.classList.add('active');
    this.results.tabMissed.classList.remove('active');
    this.results.listMastered.classList.remove('hide');
    this.results.listMissed.classList.add('hide');

    this.switchScreen('results');
    
    // Celebratory Confetti!
    if (accuracy >= 80 || this.state.questions.length > 0) {
      this.confetti.spawn(120);
    }
  },

  createResultRow(q, opSymbol, isMastered) {
    const row = document.createElement('div');
    row.className = 'drill-item-row';
    
    const eqDiv = document.createElement('div');
    eqDiv.className = 'drill-item-eq';
    eqDiv.innerHTML = `${q.displayA} <span class="oper">${opSymbol}</span> ${q.displayB} = ${q.answer}`;
    
    const metaDiv = document.createElement('div');
    metaDiv.className = 'drill-item-meta';
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'badge-time';
    timeSpan.textContent = `${q.timeSpent.toFixed(1)}s`;
    
    const statusSpan = document.createElement('span');
    statusSpan.className = `badge-status ${isMastered ? 'mastered' : 'missed'}`;
    
    if (isMastered) {
      statusSpan.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;
    } else {
      statusSpan.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
    }
    
    metaDiv.appendChild(timeSpan);
    metaDiv.appendChild(statusSpan);
    row.appendChild(eqDiv);
    row.appendChild(metaDiv);
    
    return row;
  },

  handleKeypadPress(key) {
    const input = this.inputs.answer;
    
    if (key === 'backspace') {
      input.value = input.value.slice(0, -1);
    } else if (key === 'enter') {
      this.handleAnswerSubmit();
    } else {
      if (input.value.length < 6) {
        input.value += key;
      }
    }
    input.focus();
  },

  initDraggable() {
    const keypad = this.inputs.onscreenKeypad;
    const handle = this.inputs.keypadDragHandle;
    
    let isDragging = false;
    let startX, startY;
    let initialLeft, initialTop;
    
    handle.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      
      isDragging = true;
      keypad.classList.add('dragging');
      
      startX = e.clientX;
      startY = e.clientY;
      
      const rect = keypad.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;
      
      e.preventDefault();
      
      const onPointerMove = (moveEvent) => {
        if (!isDragging) return;
        
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;
        
        let newLeft = initialLeft + deltaX;
        let newTop = initialTop + deltaY;
        
        const keypadWidth = rect.width;
        const keypadHeight = rect.height;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        if (newLeft < 0) newLeft = 0;
        if (newLeft > windowWidth - keypadWidth) newLeft = windowWidth - keypadWidth;
        if (newTop < 0) newTop = 0;
        if (newTop > windowHeight - keypadHeight) newTop = windowHeight - keypadHeight;
        
        keypad.style.left = `${newLeft}px`;
        keypad.style.top = `${newTop}px`;
        keypad.style.transform = 'none';
        keypad.style.bottom = 'auto';
        keypad.style.right = 'auto';
      };
      
      const onPointerUp = () => {
        isDragging = false;
        keypad.classList.remove('dragging');
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
      };
      
      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
    });
  },

  resetKeypadPosition() {
    const keypad = this.inputs.onscreenKeypad;
    
    keypad.style.left = '';
    keypad.style.top = '';
    keypad.style.bottom = '';
    keypad.style.right = '';
    keypad.style.transform = '';
    
    if (window.innerWidth > 960) {
      const card = this.drill.flashcard;
      if (card) {
        const cardRect = card.getBoundingClientRect();
        let leftPos = cardRect.right + 30;
        let topPos = cardRect.top + (cardRect.height / 2) - 130;
        
        // Ensure the keypad handle is within the viewport and draggable
        if (topPos < 20) topPos = 20;
        if (leftPos < 20) leftPos = 20;
        
        if (leftPos + 270 < window.innerWidth) {
          keypad.style.left = `${leftPos}px`;
          keypad.style.top = `${topPos}px`;
          keypad.style.bottom = 'auto';
          keypad.style.transform = 'none';
        }
      }
    }
  }
};

// Start the app when loaded
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

/* ==========================================================================
   AeroCards Game Logic & State Management
   ========================================================================== */

// --- Application Constants & Defaults ---
const DEFAULTS = {
  multiplication: { min: 5, max: 12, size: 10, time: 8 },
  addition: { min: 30, max: 99, size: 10, time: 8 }
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
    minOperand: document.getElementById('input-min-operand'),
    maxOperand: document.getElementById('input-max-operand'),
    drillSize: document.getElementById('input-drill-size'),
    timeLimit: document.getElementById('input-time-limit'),
    unlimited: document.getElementById('toggle-unlimited'),
    answer: document.getElementById('input-answer'),
    answerForm: document.getElementById('drill-answer-form')
  },

  badges: {
    minOperand: document.getElementById('val-min-operand'),
    maxOperand: document.getElementById('val-max-operand'),
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
    minOperand: 5,
    maxOperand: 12,
    drillSize: 10,
    timeLimit: 8,
    unlimitedTime: false,
    
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
    this.inputs.minOperand.addEventListener('input', () => {
      this.badges.minOperand.textContent = this.inputs.minOperand.value;
      this.validateSetup();
    });

    this.inputs.maxOperand.addEventListener('input', () => {
      this.badges.maxOperand.textContent = this.inputs.maxOperand.value;
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
  },

  // --- Logic Functions ---
  applyOperationDefaults(op) {
    const config = DEFAULTS[op];
    
    // Adjust sliders range and defaults
    if (op === 'addition') {
      this.inputs.minOperand.min = 10;
      this.inputs.minOperand.max = 99;
      this.inputs.minOperand.value = config.min;
      
      this.inputs.maxOperand.min = 10;
      this.inputs.maxOperand.max = 99;
      this.inputs.maxOperand.value = config.max;
    } else {
      this.inputs.minOperand.min = 2;
      this.inputs.minOperand.max = 50;
      this.inputs.minOperand.value = config.min;
      
      this.inputs.maxOperand.min = 2;
      this.inputs.maxOperand.max = 100;
      this.inputs.maxOperand.value = config.max;
    }

    this.inputs.drillSize.value = config.size;
    this.inputs.timeLimit.value = config.time;
    this.inputs.unlimited.checked = false;
    this.inputs.timeLimit.disabled = false;
    
    this.syncSliders();
  },

  syncSliders() {
    this.badges.minOperand.textContent = this.inputs.minOperand.value;
    this.badges.maxOperand.textContent = this.inputs.maxOperand.value;
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

        // Set inputs
        if (this.state.operation === 'addition') {
          this.inputs.minOperand.min = 10;
          this.inputs.minOperand.max = 99;
          this.inputs.maxOperand.min = 10;
          this.inputs.maxOperand.max = 99;
        } else {
          this.inputs.minOperand.min = 2;
          this.inputs.minOperand.max = 50;
          this.inputs.maxOperand.min = 2;
          this.inputs.maxOperand.max = 100;
        }

        this.inputs.minOperand.value = settings.minOperand;
        this.inputs.maxOperand.value = settings.maxOperand;
        this.inputs.drillSize.value = settings.drillSize;
        
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
        this.inputs.minOperand.value = 5;
        this.inputs.maxOperand.value = 12;
        this.inputs.drillSize.value = 10;
        this.inputs.timeLimit.value = 8;
      }
    } catch (e) {
      console.error('Error loading settings', e);
    }
  },

  saveSettings() {
    const settings = {
      operation: this.state.operation,
      minOperand: parseInt(this.inputs.minOperand.value),
      maxOperand: parseInt(this.inputs.maxOperand.value),
      drillSize: parseInt(this.inputs.drillSize.value),
      timeLimit: parseInt(this.inputs.timeLimit.value),
      unlimitedTime: this.inputs.unlimited.checked
    };
    localStorage.setItem('aerocards_settings', JSON.stringify(settings));
  },

  validateSetup() {
    const minVal = parseInt(this.inputs.minOperand.value);
    const maxVal = parseInt(this.inputs.maxOperand.value);
    
    if (minVal > maxVal) {
      this.errorPanel.classList.remove('hide');
      this.errorMessage.textContent = `Minimum Target (M: ${minVal}) cannot exceed Highest Limit (H: ${maxVal}).`;
      document.getElementById('btn-start').disabled = true;
      return false;
    } else {
      this.errorPanel.classList.add('hide');
      document.getElementById('btn-start').disabled = false;
      return true;
    }
  },

  switchScreen(screenName) {
    Object.values(this.screens).forEach(screen => {
      screen.classList.remove('active');
    });
    
    setTimeout(() => {
      this.screens[screenName].classList.add('active');
      if (screenName === 'drill') {
        this.inputs.answer.focus();
      }
    }, 50);
  },

  // --- Session Generation ---
  startSession() {
    this.saveSettings();
    
    // Initialize State
    this.state.operation = this.state.operation;
    this.state.minOperand = parseInt(this.inputs.minOperand.value);
    this.state.maxOperand = parseInt(this.inputs.maxOperand.value);
    this.state.drillSize = parseInt(this.inputs.drillSize.value);
    this.state.timeLimit = parseInt(this.inputs.timeLimit.value);
    this.state.unlimitedTime = this.inputs.unlimited.checked;
    
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
    
    this.generateQuestions();
    
    this.state.drillStartTime = Date.now();
    this.drill.typeBadge.textContent = this.state.operation.charAt(0).toUpperCase() + this.state.operation.slice(1);
    this.drill.totalQ.textContent = this.state.questions.length;
    
    this.switchScreen('drill');
    this.loadQuestion();
  },

  generateQuestions() {
    const M = this.state.minOperand;
    const H = this.state.maxOperand;
    const isMultiplication = this.state.operation === 'multiplication';
    
    // Determine the lower boundary of the operands
    // Multiplication: 2, Addition: 10 (two-digit numbers)
    const lowerBound = isMultiplication ? 2 : 10;
    
    // Generate pool of valid pairs
    const pool = [];
    for (let a = lowerBound; a <= H; a++) {
      for (let b = lowerBound; b <= H; b++) {
        if (a >= M || b >= M) {
          pool.push({ a, b });
        }
      }
    }
    
    // If pool is empty (e.g. invalid bounds somehow), fallback
    if (pool.length === 0) {
      pool.push({ a: M, b: M });
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
    this.inputs.answer.disabled = false;
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
    this.inputs.answer.disabled = true;
    
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
    this.inputs.answer.disabled = false;
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

      // Briefly display checkmark overlay
      this.drill.encouragementText.textContent = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
      this.drill.overlaySuccess.classList.remove('hide');
      this.inputs.answer.disabled = true;

      // Auto-advance after 800ms
      setTimeout(() => {
        this.drill.overlaySuccess.classList.add('hide');
        this.inputs.answer.value = '';
        this.inputs.answer.disabled = false;
        
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
      }, 750);

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
  }
};

// Start the app when loaded
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

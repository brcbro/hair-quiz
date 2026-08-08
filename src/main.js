import {
  QUESTIONS,
  getProgress,
  buildOctaneAnswers,
  resolveNext,
} from './quiz-data.js';

class HairQuiz {
  constructor() {
    this.currentQuestionId = 'q1';
    this.answers = {};
    this.history = [];
    this.selectedOption = null;

    this.contentEl = document.getElementById('quiz-content');
    this.footerEl = document.getElementById('quiz-footer');
    this.continueBtn = document.getElementById('continue-btn');
    this.backBtn = document.getElementById('back-btn');
    this.progressFill = document.getElementById('progress-fill');
    this.progressLabel = document.getElementById('progress-label');
    this.progressWrapper = document.querySelector('.quiz-progress-wrapper');
    this.closeBtn = document.querySelector('.quiz-close');
    this.appEl = document.getElementById('quiz-app');

    this.bindEvents();
    this.render();
  }

  bindEvents() {
    this.continueBtn.addEventListener('click', () => this.handleContinue());
    this.backBtn.addEventListener('click', () => this.handleBack());
    this.closeBtn.addEventListener('click', () => {
      if (confirm('Close the quiz and start over?')) this.reset();
    });
  }

  reset() {
    this.currentQuestionId = 'q1';
    this.answers = {};
    this.history = [];
    this.selectedOption = null;
    this.footerEl.style.display = 'flex';
    this.progressWrapper.style.display = 'block';
    this.closeBtn.style.display = 'flex';
    this.render();
  }

  getCurrentQuestion() {
    return QUESTIONS[this.currentQuestionId];
  }

  updateProgress() {
    const pct = getProgress(this.currentQuestionId);
    this.progressFill.style.width = `${pct}%`;
    this.progressLabel.textContent = `${pct}%`;
  }

  render() {
    this.updateProgress();

    if (this.currentQuestionId === 'results') {
      this.goToOfficialResults();
      return;
    }

    if (this.currentQuestionId === 'q10_calculating') {
      this.renderCalculating();
      return;
    }

    const question = this.getCurrentQuestion();
    if (!question) return;

    this.selectedOption = this.answers[question.id] || null;
    this.progressWrapper.style.display = 'block';
    this.closeBtn.style.display = 'flex';

    this.contentEl.style.animation = 'none';
    void this.contentEl.offsetWidth;
    this.contentEl.style.animation = '';
    this.contentEl.innerHTML = '';
    this.contentEl.className = 'quiz-content';

    const stepEl = document.createElement('p');
    stepEl.className = 'quiz-step-label';
    const stepNum = this.history.length + 1;
    stepEl.textContent = `Question ${stepNum} of 9`;
    this.contentEl.appendChild(stepEl);

    const titleEl = document.createElement('h2');
    titleEl.className = 'quiz-question';
    titleEl.setAttribute('role', 'heading');
    titleEl.setAttribute('aria-level', '2');
    titleEl.textContent = question.title;
    this.contentEl.appendChild(titleEl);

    if (question.type === 'multiple_choice') this.renderMultipleChoice(question);
    else if (question.type === 'email') this.renderEmail(question);

    this.updateFooter(question);
  }

  renderMultipleChoice(question) {
    const optionsEl = document.createElement('div');
    optionsEl.className = 'quiz-options';
    optionsEl.setAttribute('role', 'radiogroup');
    optionsEl.setAttribute('aria-label', question.title);

    question.options.forEach((option) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quiz-option';
      btn.setAttribute('role', 'radio');
      btn.setAttribute('data-option-id', option.id);
      btn.setAttribute('aria-label', option.text);
      btn.setAttribute('aria-checked', this.selectedOption === option.id ? 'true' : 'false');

      const label = document.createElement('span');
      label.textContent = option.text.trim();
      const arrow = document.createElement('span');
      arrow.className = 'quiz-option-arrow material-symbols-outlined';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = 'east';
      btn.appendChild(label);
      btn.appendChild(arrow);

      if (this.selectedOption === option.id) btn.classList.add('selected');
      btn.addEventListener('click', () => this.selectOption(option, question));
      optionsEl.appendChild(btn);
    });

    this.contentEl.appendChild(optionsEl);
  }

  renderEmail(question) {
    const wrapper = document.createElement('div');
    wrapper.className = 'quiz-email-wrapper';

    const input = document.createElement('input');
    input.type = 'email';
    input.id = 'email-input';
    input.className = 'quiz-email-input';
    input.placeholder = question.placeholder || 'Enter email';
    input.autocomplete = 'email';
    input.value = this.answers.email || '';
    input.addEventListener('input', (e) => {
      this.answers.email = e.target.value.trim();
      this.continueBtn.disabled = !this.isValidEmail(this.answers.email);
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && this.isValidEmail(this.answers.email)) this.handleContinue();
    });

    wrapper.appendChild(input);
    this.contentEl.appendChild(wrapper);
    setTimeout(() => input.focus(), 250);
  }

  renderCalculating() {
    this.footerEl.style.display = 'none';
    this.progressWrapper.style.display = 'block';
    this.contentEl.innerHTML = `
      <div class="quiz-loading">
        <div class="quiz-loading-spinner"></div>
        <p class="quiz-loading-text">Building your personalized product list</p>
      </div>
    `;

    // Persist official answer payload, then open official results HTML
    const octaneAnswers = buildOctaneAnswers(this.answers, this.answers.email);
    try {
      localStorage.setItem('octane_answers', JSON.stringify(octaneAnswers));
    } catch {}

    setTimeout(() => {
      this.currentQuestionId = 'results';
      this.goToOfficialResults();
    }, 2200);
  }

  goToOfficialResults() {
    // Full-page official results (same as live Octane fullscreen end state)
    window.location.href = '/results.html';
  }

  selectOption(option, question) {
    this.selectedOption = option.id;
    this.answers[question.id] = option.id;

    document.querySelectorAll('.quiz-option').forEach((el) => {
      el.classList.remove('selected');
      el.setAttribute('aria-checked', 'false');
    });

    const selectedEl = document.querySelector(`[data-option-id="${option.id}"]`);
    if (selectedEl) {
      selectedEl.classList.add('selected');
      selectedEl.setAttribute('aria-checked', 'true');
    }

    this.continueBtn.disabled = false;

    if (question.autoAdvance) {
      clearTimeout(this._advanceTimer);
      this._advanceTimer = setTimeout(() => this.handleContinue(), 350);
    }
  }

  updateFooter(question) {
    if (!question) return;
    this.footerEl.style.display = 'flex';
    this.continueBtn.textContent = question.buttonText || 'CONTINUE';
    this.continueBtn.disabled =
      question.type === 'email'
        ? !this.isValidEmail(this.answers.email)
        : !this.selectedOption;
    this.backBtn.style.display = question.showBack ? 'inline-block' : 'none';
  }

  handleContinue() {
    const question = this.getCurrentQuestion();
    if (!question) return;

    this.history.push(this.currentQuestionId);

    if (question.type === 'multiple_choice') {
      const selected = question.options.find((o) => o.id === this.selectedOption);
      if (!selected) return;
      this.currentQuestionId = resolveNext(question.id, selected, this.answers);
    } else if (question.type === 'email') {
      if (!this.isValidEmail(this.answers.email)) return;
      this.currentQuestionId = question.next;
    }

    this.selectedOption = null;
    this.render();
  }

  handleBack() {
    if (this.history.length === 0) return;
    this.currentQuestionId = this.history.pop();
    this.selectedOption = this.answers[this.currentQuestionId] || null;
    this.render();
  }

  isValidEmail(email) {
    return Boolean(email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new HairQuiz();
});

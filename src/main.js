import {
  QUESTIONS,
  getProgress,
  buildOctaneAnswers,
  resolveNext,
  describeSelections,
  newQuizId,
} from './quiz-data.js';
import { pickFocusBrand } from './brand-focus.js';

class HairQuiz {
  constructor() {
    this.currentQuestionId = 'q1';
    this.answers = {};
    this.history = [];
    this.selectedOption = null;
    this.focusBrand = pickFocusBrand();

    this.contentEl = document.getElementById('quiz-content');
    this.footerEl = document.getElementById('quiz-footer');
    this.continueBtn = document.getElementById('continue-btn');
    this.backBtn = document.getElementById('back-btn');
    this.progressFill = document.getElementById('progress-fill');
    this.progressLabel = document.getElementById('progress-label');
    this.progressWrapper = document.querySelector('.quiz-progress-wrapper');
    this.closeBtn = document.querySelector('.quiz-close');
    this.bookBtn = document.getElementById('quiz-book-btn');
    this.bookModal = document.getElementById('quiz-book-modal');
    this.appEl = document.getElementById('quiz-app');

    this.bindEvents();
    this.bindBookModal();
    this.render();
  }

  bindEvents() {
    this.continueBtn.addEventListener('click', () => this.handleContinue());
    this.backBtn.addEventListener('click', () => this.handleBack());
    this.closeBtn.addEventListener('click', () => {
      if (confirm('Close the quiz and start over?')) this.reset();
    });
    if (this.bookBtn) {
      this.bookBtn.addEventListener('click', () => this.openBookConsultation());
    }
  }

  openBookConsultation() {
    if (!this.bookModal) return;
    this.bookModal.hidden = false;
    this.bookModal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  closeBookConsultation() {
    if (!this.bookModal) return;
    this.bookModal.classList.remove('is-open');
    this.bookModal.hidden = true;
    document.body.style.overflow = '';
    if (this.bookBtn) this.bookBtn.focus();
  }

  bindBookModal() {
    if (!this.bookModal) return;

    this.bookModal.querySelectorAll('[data-quiz-book-close]').forEach((el) => {
      el.addEventListener('click', () => this.closeBookConsultation());
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.bookModal.classList.contains('is-open')) {
        this.closeBookConsultation();
      }
    });
  }

  reset() {
    this.currentQuestionId = 'q1';
    this.answers = {};
    this.history = [];
    this.selectedOption = null;
    this.focusBrand = pickFocusBrand();
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
    this.prefetchResults();

    const wrapper = document.createElement('div');
    wrapper.className = 'quiz-email-wrapper';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = 'name-input';
    nameInput.className = 'quiz-email-input';
    nameInput.placeholder = 'Your first name';
    nameInput.autocomplete = 'given-name';
    nameInput.value = this.answers.quiz_name || '';

    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.id = 'email-input';
    emailInput.className = 'quiz-email-input';
    emailInput.placeholder = question.placeholder || 'Enter email';
    emailInput.autocomplete = 'email';
    emailInput.value = this.answers.email || '';

    const updateBtn = () => {
      const nameOk = (this.answers.quiz_name || '').trim().length >= 1;
      const emailOk = this.isValidEmail(this.answers.email);
      this.continueBtn.disabled = !(nameOk && emailOk);
    };

    nameInput.addEventListener('input', (e) => {
      this.answers.quiz_name = e.target.value.trim();
      updateBtn();
    });
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') emailInput.focus();
    });

    emailInput.addEventListener('input', (e) => {
      this.answers.email = e.target.value.trim();
      updateBtn();
    });
    emailInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !this.continueBtn.disabled) this.handleContinue();
    });

    wrapper.appendChild(nameInput);
    wrapper.appendChild(emailInput);
    this.contentEl.appendChild(wrapper);
    requestAnimationFrame(() => nameInput.focus());
  }

  prefetchResults() {
    if (this._resultsPrefetched) return;
    this._resultsPrefetched = true;
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = '/results.html';
    link.as = 'document';
    document.head.appendChild(link);
    import('./firebase.js').catch(() => {});
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

    // Fully client-side results: persist answers then go to results.
    // Also save the quiz email as a lead on the server + Firebase (best-effort).
    const quizId = newQuizId();
    const octaneAnswers = buildOctaneAnswers(this.answers, this.answers.email, this.focusBrand);
    octaneAnswers._quizId = quizId;
    octaneAnswers.quiz_name = (this.answers.quiz_name || '').trim();
    try {
      localStorage.setItem('octane_answers', JSON.stringify(octaneAnswers));
    } catch {}

    const selections = describeSelections(this.answers);
    const saveFirebase = import('./firebase.js')
      .then(({ saveQuizResponse }) =>
        saveQuizResponse({
          quizId,
          quiz_name: (this.answers.quiz_name || '').trim(),
          email: this.answers.email,
          selections,
          rawAnswers: { ...this.answers },
          profile: {
            hair_pain_point: octaneAnswers.hair_pain_point,
            pain_severity: octaneAnswers.pain_severity,
            damage_level: octaneAnswers.damage_level,
            hair_type: octaneAnswers.smart_properties_outputs?.hair_type || null,
            hair_air_dry: octaneAnswers.hair_air_dry,
            hair_pattern: octaneAnswers.hair_pattern,
            hair_wash_frequency: octaneAnswers.hair_wash_frequency,
            heat_tools: octaneAnswers.heat_tools,
            wants_volume: octaneAnswers.wants_volume,
            focus_brand: octaneAnswers.focus_brand,
          },
        })
      )
      .catch(() => {});

    const saveLead = fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        email: this.answers.email,
        quizId,
        selections,
        answers: octaneAnswers,
      }),
      keepalive: true,
    }).catch(() => {});

    this.currentQuestionId = 'results';
    const timeout = new Promise((resolve) => setTimeout(resolve, 2000));
    Promise.race([Promise.all([saveFirebase, saveLead]), timeout]).finally(() => {
      this.goToOfficialResults();
    });
  }

  goToOfficialResults() {
    window.location.replace('/results.html');
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
        ? !(this.isValidEmail(this.answers.email) && (this.answers.quiz_name || '').trim().length >= 1)
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
      if (!this.isValidEmail(this.answers.email) || !(this.answers.quiz_name || '').trim()) return;
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

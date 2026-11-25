const categorySelect = document.querySelector("#category");
const selectedCount = document.querySelector("#selected-count");
const modeSelect = document.querySelector("#mode");
const poolSizeInput = document.querySelector("#pool-size");
const setupSection = document.querySelector("#setup");
const exerciseSection = document.querySelector("#exercise");
const resultSection = document.querySelector("#result");
const setupFeedback = document.querySelector("#setup-feedback");
const form = document.querySelector("#answer-form");
const answerInput = document.querySelector("#answer");
const prompt = document.querySelector("#prompt");
const progress = document.querySelector("#progress");
const feedback = document.querySelector("#feedback");
const submitButton = document.querySelector("#submit");
const resultTitle = document.querySelector("#result-title");
const resultDetails = document.querySelector("#result-details");

let sessionWords = [];
let currentIndex = 0;
let correctAnswers = 0;
let answered = false;
let testMode = false;
let studyMode = false;
let remainingWords = [];
let masteredCount = 0;
let lastAnswerCorrect = false;
let studyWordCount = 0;
let selectedWordCount = 0;

function addCategoryOption(title, value, checked = false) {
  const label = document.createElement("label");
  label.className = "category-option";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.value = value;
  checkbox.checked = checked;

  const text = document.createElement("span");
  text.textContent = title;

  label.append(checkbox, text);
  categorySelect.append(label);
}

addCategoryOption("Wszystkie kategorie", "*", true);

for (const [index, category] of vocabulary.entries()) {
  const wordCount = Object.keys(category.vocabulary).length;
  addCategoryOption(`${category.title} (${wordCount})`, String(index));
}

categorySelect.addEventListener("change", (event) => {
  if (!event.target.matches("input[type='checkbox']")) return;

  const allCheckbox = categorySelect.querySelector("input[value='*']");
  if (event.target.value === "*" && event.target.checked) {
    for (const checkbox of categorySelect.querySelectorAll("input")) {
      checkbox.checked = checkbox === allCheckbox;
    }
    return;
  }

  if (event.target.value !== "*") allCheckbox.checked = false;

  const checkedCategories = [...categorySelect.querySelectorAll("input:checked")]
    .filter((checkbox) => checkbox.value !== "*");

  if (checkedCategories.length === 0) allCheckbox.checked = true;
  updateSelectedCount();
});

function getSelectedCategories() {
  return [...categorySelect.querySelectorAll("input:checked")]
    .map((checkbox) => checkbox.value);
}

function updateSelectedCount() {
  const selectedCategories = getSelectedCategories();
  const selectedWords = selectedCategories.length === 0 || selectedCategories.includes("*")
    ? vocabulary.flatMap((category) => Object.values(category.vocabulary))
    : selectedCategories.flatMap((categoryIndex) =>
        Object.values(vocabulary[Number(categoryIndex)]?.vocabulary ?? {})
      );

  selectedCount.textContent =
    `Wybranych słówek: ${selectedWords.length}`;
}

updateSelectedCount();

function shuffle(words) {
  const shuffled = [...words];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

function getProgressText() {
  if (studyMode) {
    return `Wybranych: ${selectedWordCount} · Pula: ${sessionWords.length} słówek · Opanowane: ${masteredCount}`;
  }

  return `Słówko ${currentIndex + 1} z ${sessionWords.length} · Wybranych: ${selectedWordCount} · Poprawnie: ${correctAnswers}`;
}

function showWord() {
  const [polishWord] = sessionWords[currentIndex];
  prompt.textContent = polishWord;
  progress.textContent = getProgressText();
  feedback.textContent = "";
  feedback.className = "feedback";
  answerInput.value = "";
  answerInput.disabled = false;
  submitButton.textContent = "Sprawdź";
  answered = false;
  answerInput.focus();
}

function getGrade(score) {
  if (score === 1) return 6;
  if (score >= 0.9) return 5;
  if (score >= 0.75) return 4;
  if (score >= 0.5) return 3;
  if (score >= 0.3) return 2;
  return 1;
}

function normalizeAnswer(answer) {
  return answer.trim().toLocaleLowerCase("de-DE");
}

function getDisplayAnswer(answer) {
  //return answer.split(",")[0].trim();
  return answer.trim();
}

function finishSession() {
  exerciseSection.hidden = true;
  resultSection.hidden = false;

  if (testMode) {
    const grade = getGrade(correctAnswers / sessionWords.length);
    resultTitle.textContent = `Ocena: ${grade}`;
    resultDetails.textContent =
      `Wybranych słówek: ${selectedWordCount}. Poprawnie zgadnięte: ${correctAnswers} z ${sessionWords.length}.`;
    return;
  }

  resultTitle.textContent = "Koniec nauki!";
  resultDetails.textContent =
    `Wybranych słówek: ${selectedWordCount}. Opanowane słówka: ${masteredCount} z ${studyWordCount}.`;
}

document.querySelector("#start").addEventListener("click", () => {
  const selectedCategories = getSelectedCategories();
  const availableWords = selectedCategories.length === 0 || selectedCategories.includes("*")
    ? vocabulary.flatMap((category) => Object.entries(category.vocabulary))
    : selectedCategories.flatMap((categoryIndex) =>
        Object.entries(vocabulary[Number(categoryIndex)]?.vocabulary ?? {})
      );

  if (!availableWords || availableWords.length === 0) {
    setupFeedback.textContent = "W tej kategorii nie ma jeszcze słówek.";
    return;
  }

  selectedWordCount = availableWords.length;
  testMode = modeSelect.value === "test";
  studyMode = modeSelect.value === "study";
  const shuffledWords = shuffle(availableWords);

  if (testMode) {
    sessionWords = shuffledWords.slice(0, 20);
    remainingWords = [];
  } else {
    const requestedPoolSize = Number(poolSizeInput.value);
    const poolSize = Number.isInteger(requestedPoolSize)
      ? Math.min(50, Math.max(1, requestedPoolSize))
      : 5;
    sessionWords = shuffledWords.slice(0, poolSize);
    remainingWords = shuffledWords.slice(poolSize);
  }

  currentIndex = 0;
  correctAnswers = 0;
  masteredCount = 0;
  studyWordCount = shuffledWords.length;
  setupFeedback.textContent = "";
  setupSection.hidden = true;
  resultSection.hidden = true;
  exerciseSection.hidden = false;
  showWord();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (answered) {
    if (studyMode) {
      if (sessionWords.length === 0) {
        finishSession();
        return;
      }

      if (!lastAnswerCorrect) {
        currentIndex = (currentIndex + 1) % sessionWords.length;
      } else {
        currentIndex %= sessionWords.length;
      }
      showWord();
      return;
    }

    currentIndex += 1;
    if (currentIndex === sessionWords.length) {
      finishSession();
    } else {
      showWord();
    }
    return;
  }

  const [, germanWord] = sessionWords[currentIndex];
  const isCorrect = [germanWord, getDisplayAnswer(germanWord)]
    .some((answer) => normalizeAnswer(answerInput.value) === normalizeAnswer(answer));

  if (isCorrect) {
    correctAnswers += 1;
    lastAnswerCorrect = true;

    if (studyMode) {
      masteredCount += 1;
      sessionWords.splice(currentIndex, 1);

      if (remainingWords.length > 0) {
        sessionWords.splice(currentIndex, 0, remainingWords.shift());
      }

      progress.textContent = getProgressText();
    }

    feedback.textContent = "Dobrze!";
    feedback.className = "feedback correct";
  } else {
    lastAnswerCorrect = false;
    feedback.textContent = `Nie tym razem. Poprawna odpowiedź: ${getDisplayAnswer(germanWord)}`;
    feedback.className = "feedback wrong";
  }

  progress.textContent = getProgressText();
  answerInput.disabled = true;
  submitButton.textContent = studyMode
    ? (sessionWords.length === 0 ? "Zobacz wynik" : "Dalej")
    : (currentIndex === sessionWords.length - 1 ? "Zobacz wynik" : "Dalej");
  answered = true;
});

document.querySelector("#restart").addEventListener("click", () => {
  resultSection.hidden = true;
  setupSection.hidden = false;
  categorySelect.querySelector("input")?.focus();
});

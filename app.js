let tests = [];
let questions = [];
let current = 0;
let score = 0;
let currentTest = "";

let selected = [];
let answered = false;

let time = 30;
let timer;

/* =======================
   LOAD TEST LIST
======================= */
fetch("data/index.json")
  .then(r => r.json())
  .then(data => {
    tests = data || [];
    renderTestList();
  });

/* =======================
   RENDER LIST
======================= */
function renderTestList() {
  const container = document.getElementById("testList");
  if (!container) return;

  container.innerHTML = "";

  tests.forEach(test => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <h3>${test.name}</h3>
    `;

    card.onclick = () => loadTest(test.file);

    container.appendChild(card);
  });
}

/* =======================
   LOAD TEST
======================= */
function loadTest(file) {
  currentTest = file;
  current = 0;
  score = 0;
  selected = [];
  answered = false;

  clearInterval(timer);

  document.getElementById("score").innerText = "Điểm: 0";
  document.getElementById("question").innerText = "";
  document.getElementById("answers").innerHTML = "";
  document.getElementById("timer").innerText = "";

  fetch(`data/${file}`)
    .then(r => r.json())
    .then(data => {
      questions = data || [];
      questions.sort(() => Math.random() - 0.5);
      showQuestion();
    });
}

/* =======================
   SHOW QUESTION
======================= */
function showQuestion() {
  answered = false;
  selected = [];
  time = 30;

  clearInterval(timer);

  const q = questions[current];
  if (!q) return;

  document.getElementById("score").innerText = "Điểm: " + score;
  document.getElementById("question").innerText =
    `Câu ${current + 1}: ${q.Question || q.question}`;

  const answers = document.getElementById("answers");
  answers.innerHTML = "";

  for (let i = 1; i <= 5; i++) {
    const opt = q["option" + i];
    if (!opt) continue;

    const label = document.createElement("label");
    label.style = "display:block;padding:10px;margin:6px 0;background:#fff;border-radius:8px;cursor:pointer";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = i;

    input.onchange = () => {
      if (input.checked) selected.push(i);
      else selected = selected.filter(x => x !== i);
    };

    label.appendChild(input);
    label.append(" " + i + ". " + opt);

    answers.appendChild(label);
  }

  const btn = document.createElement("button");
  btn.innerText = "Trả lời";
  btn.onclick = checkAnswer;
  answers.appendChild(btn);

  startTimer();
}

/* =======================
   CHECK ANSWER (CÓ ĐÚNG/SAI)
======================= */
function checkAnswer() {
  if (answered) return;
  answered = true;

  const q = questions[current];
  const correct = normalize(q.correct);

  const isCorrect =
    selected.length === correct.length &&
    selected.every(x => correct.includes(x));

  clearInterval(timer);

  document.querySelectorAll("#answers input").forEach(i => i.disabled = true);

  document.querySelectorAll("#answers label").forEach(label => {
    const input = label.querySelector("input");
    const val = Number(input.value);

    if (correct.includes(val)) {
      label.style.background = "#b6f7c1"; // xanh
    }

    if (input.checked && !correct.includes(val)) {
      label.style.background = "#f7b6b6"; // đỏ
    }
  });

  if (isCorrect) score++;

  document.getElementById("score").innerText = "Điểm: " + score;

  const result = document.createElement("div");
  result.style = "margin-top:10px;padding:10px;border-radius:8px;font-weight:bold";

  const correctText = correct
    .map(i => `${i}. ${q["option" + i]}`)
    .join("<br>");

  result.innerHTML = isCorrect
    ? "✅ ĐÚNG!"
    : "❌ SAI!<br>Đáp án đúng:<br>" + correctText;

  result.style.background = isCorrect ? "#d4f8d4" : "#ffd6d6";
  result.style.color = isCorrect ? "green" : "red";

  document.getElementById("answers").appendChild(result);

  setTimeout(nextQuestion, 4000);
}

/* =======================
   NEXT
======================= */
function nextQuestion() {
  current++;

  if (current < questions.length) {
    showQuestion();
  } else {
    finishQuiz();
  }
}

/* =======================
   FINISH
======================= */
function finishQuiz() {
  document.getElementById("question").innerText = "🎉 Hoàn thành!";
  document.getElementById("answers").innerHTML = "";
  document.getElementById("timer").innerText = "";

  saveBestScore();
  renderTestList();
}

/* =======================
   TIMER
======================= */
function startTimer() {
  clearInterval(timer);

  document.getElementById("timer").innerText = time + "s";

  timer = setInterval(() => {
    time--;
    document.getElementById("timer").innerText = time + "s";

    if (time <= 0) {
      clearInterval(timer);
      nextQuestion();
    }
  }, 1000);
}

/* =======================
   BEST SCORE
======================= */
function saveBestScore() {
  if (!currentTest) return;

  const key = getKey(currentTest);
  const old = Number(localStorage.getItem(key) || 0);

  if (score > old) {
    localStorage.setItem(key, score);
  }
}

/* =======================
   HELPERS
======================= */
function getKey(file) {
  return "best_" + file;
}

function normalize(c) {
  if (Array.isArray(c)) return c.map(Number);
  if (typeof c === "string") return c.split(",").map(x => Number(x.trim()));
  if (typeof c === "number") return [c];
  return [];
}
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

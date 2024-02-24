const startButton = document.getElementById('start-btn')
const nextButton = document.getElementById('next-btn')
const questionContainerElement = document.getElementById('question-container')
const questionElement = document.getElementById('question')
const answerButtonsElement = document.getElementById('answer-buttons')

let shuffledQuestions, currentQuestionIndex

startButton.addEventListener('click', startGame)
nextButton.addEventListener('click', () => {
  currentQuestionIndex++
  setNextQuestion()
})

function startGame() {
  startButton.classList.add('hide')
  shuffledQuestions = questions.sort(() => Math.random() - .5)
  currentQuestionIndex = 0
  questionContainerElement.classList.remove('hide')
  setNextQuestion()
}

function setNextQuestion() {
  resetState()
  showQuestion(shuffledQuestions[currentQuestionIndex])
}

function showQuestion(question) {
  questionElement.innerText = question.question
  question.answers.forEach(answer => {
    const button = document.createElement('button')
    button.innerText = answer.text
    button.classList.add('btn')
    if (answer.correct) {
      button.dataset.correct = answer.correct
    }
    button.addEventListener('click', selectAnswer)
    answerButtonsElement.appendChild(button)
  })
}

function resetState() {
  clearStatusClass(document.body)
  nextButton.classList.add('hide')
  while (answerButtonsElement.firstChild) {
    answerButtonsElement.removeChild(answerButtonsElement.firstChild)
  }
}

function selectAnswer(e) {
  const selectedButton = e.target
  const correct = selectedButton.dataset.correct
  setStatusClass(document.body, correct)
  Array.from(answerButtonsElement.children).forEach(button => {
    setStatusClass(button, button.dataset.correct)
  })
  if (shuffledQuestions.length > currentQuestionIndex + 1) {
    nextButton.classList.remove('hide')
  } else {
    startButton.innerText = 'Restart'
    startButton.classList.remove('hide')
  }
}

function setStatusClass(element, correct) {
  clearStatusClass(element)
  if (correct) {
    element.classList.add('correct')
  } else {
    element.classList.add('wrong')
  }
}

function clearStatusClass(element) {
  element.classList.remove('correct')
  element.classList.remove('wrong')
}

const questions = [
  {
    question: '안녕, 잘 지냈어? 다음에 들어갈 말을 고르세요',
    answers: [
      { text: '응, 잘 지냈어. 너는?', correct: true },
      { text: '차타고 왔어', correct: false }
    ]
  },
  {
    question: '다음중 언어를 모두 고르세요',
    answers: [
      { text: '한국어', correct: true },
      { text: '베트남어', correct: true },
      { text: '중국어', correct: true },
      { text: '대한민국', correct: false },
      { text: '영어', correct: true },
      { text: '사과', correct: false },
      { text: '프랑스어', correct: true },
      { text: '숭어', correct: false },
      { text: '복숭아', correct: true }
    ]
  },
  {
    question: '음식과 관련된 단어를 고르세요',
    answers: [
      { text: '자동차', correct: false },
      { text: '사과', correct: true },
      { text: '기타', correct: false },
      { text: '선생님', correct: false }
    ]
  },
  {
    question: '병원과 관련된 단어를 고르세요',
    answers: [
      { text: '간호사', correct: true },
      { text: '의사', correct: true },
      { text: '약', correct: true},
      { text: '김치', correct: false}
    ]
  }
]
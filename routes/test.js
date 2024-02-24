/* personalTest.js */
class PersonalTest {
  constructor(target) {
    this.container = document.querySelector(target); // 추후 dom 내용을 바꾸기 위한 선택자
    this.page = 0; // 0:intoro, 1:test, 2:result 현재 페이지
    this.progress = 0; //현재 질문 단계
    this.questions = {
      EI: [
        {
          question: '빨갛고 예쁜 과일은?',
          answer: { a: '사과', b: '배', c: '바나나' },
        },
      ],
      SN: [
        {
          question: '노랗고 맛있는 과일은?',
          answer: { a: '사과', b: '배', c: '바나나' },
        },
      ],
      TF: [
        {
          question: '피자에 넣으면 맛 없는 과일은?',
          answer: { a: '파인애플', b: '배', c: '토마토' },
        },
      ],
      JP: [
        {
          question: '심심하다',
          answer: { a: '그래서', b: '이러고', c: '있다' },
        },
      ],
    }; //질문 모음
    this.results = []; //사용자가 선택한 답 모음
    this.init();
  }

  init() {
    this.questionArray = this.getQuestion(); // 질문을 배열로 저장
  } //추후 초기화가 필요한 경우 작성

  start() {
    if (this.progress !== 0) return; //진행 중이면 실행하지 않는다
    console.log(this.getCurrentQuestions()); //브라우저 개발자 도구에 log 출력 용도
    return this.getCurrentQuestions();
  }

  getCurrentQuestions() {
    //현재 progress의 질문을 반환
    return this.questionArray[this.progress];
  }

  submitAnswer(answer) {
    //사용자가 선택한 답을 results에 추가
    if (this.questionArray.length <= this.progress) {
      //질문이 끝났으면
      console.log('테스트가 끝났습니다!');
      console.log(this.results);
      return;
    }
    this.results.push({
      type: this.questionArray[this.progress].type,
      answer: Object.keys(this.questionArray[this.progress].answer).find(
        (selectedAnswer) => {
          return (
            this.questionArray[this.progress].answer[selectedAnswer] === answer
          );
        }
      ),
    }); //사용자가 선택한 답을 results에 추가 (type: 질문의 키, answer: 사용자가 선택한 답의 키)
    this.progress++; //질문 단계 증가
    return this.getCurrentQuestions();
  }

  getQuestion() {
    return Object.keys(this.questions).flatMap((key) =>
      this.questions[key].map((question) => ({ ...question, type: key }))
    );
  }

  calcResult() {
    return (this.result = Object.keys(this.questions).reduce((acc, cur) => {
      acc[cur] = this.results
        .filter((result) => result.type === cur)
        .reduce((acc, cur) => {
          acc[cur.answer] = acc[cur.answer] ? acc[cur.answer] + 1 : 1;
          return acc;
        }, {});
      return acc;
    }, {}));
  }

  render() {} //추후 dom에 내용을 바꾸기 위한 함수를 작성
}

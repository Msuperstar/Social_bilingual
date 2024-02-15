//DB연결
var mysql = require("mysql2");
var conn = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
})
conn.connect();


//PASSPORT설정
var router = require('express').Router();
let session = require('express-session');
const cryptoJs = require("crypto-js"); //sha256역할
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;//나의 로컬
const KakaoStrategy = require('passport-kakao').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const fileStore = require('session-file-store')(session);
const bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: true }));
// const User = require('../models/user')


//보안SHA & session 설정
//직접 SHA가 npm이 되지 않아 cryptoJs의 내장 함수를 이용
function sha256(input) {
    return cryptoJs.SHA256(input).toString(cryptoJs.enc.Hex);
 }//cryptols를 sha256로 설정할 수 있게
router.use(
      session({
      secret : 'sldkjfslkfjdlkjsfl', 
      resave : false,
      saveUninitialized :true,
      })
  );
let cookieParser = require('cookie-parser');
//const { route } = require("./post"); 
//다른 라우터페이지들이랑 상호작용이 필요할경우 이렇게 불러오기
router.use(cookieParser('sdfsferwfdx'));
router.use(passport.session());


//로그인 미들웨어
router.use(passport.initialize());

passport.serializeUser(function(user,done){
    console.log("serializeUser:user.userid");
    console.log(user.userid)
    
    //facebook이 넘겨주는 user는 유저키와 유저 아이디를 포함
    done(null,user)//done(서버에러 객체, 결과데이터, 에러 메세지)
})

passport.deserializeUser(async function(user, done) {
    console.log("deserializeUser");
    console.log("user.userid"+user.userid)

    await conn.execute('SELECT * FROM account WHERE userid = ?', [user.userid], function(err, rows, fields) {
        if (err) {
            console.error(err);
            return done(err, null);
        }

        if (rows.length > 0) {
            // 조회된 사용자 정보를 done을 통해 Passport에게 전달
            done(null, rows[0]);
            console.log("사용자 찾음")
        } else {
            // 사용자 정보가 없을 경우
            done(null, false, { message: 'User not found' });
        }
    });
});




//get라우터(단순 페이지 띄우기)


//사용자 인증 함수
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.render('social-login.ejs'),{ user: req.user.userid }; 
}//오류만약에 나면 fetch가져오기


//라우터
router.get('/', isAuthenticated, (req, res) => {
    console.log("홈화면 접속");
    console.log("home 접속을 위해 로그인 필요");
    console.log("req.user.userid: " + req.user.userid);

    res.render('home.ejs', { user: req.user.userid });
});



router.get('/social-login', isAuthenticated, (req, res) => {
    console.log("소셜 로그인 페이지");
    console.log("req.user.userid: " + req.user.userid);
    res.render('home.ejs', { user: req.user.userid });
});

router.get('/signup', isAuthenticated, (req, res) => {
    console.log("회원가입 페이지");
    console.log("req.user.userid: " + req.user.userid);
    res.render('signup.ejs', { user: req.user.userid });
});

router.get('/login', isAuthenticated, (req, res) => {
    console.log("일반 로그인 페이지");
    console.log("req.user.userid: " + req.user.userid);
    res.render('home.ejs', { user: req.user.userid });
});



//post라우터
router.post("/login", passport.authenticate("local",{
    succeessRedirect : '/home',
    failureRedirect: "/fail",
    }),
    function(req,res){

    console.log("router.post")
    console.log("req.session:"+req.session);
    console.log("req.session.passport.user.userid:"+req.session.passport.user.userid);
    //render시에 user로만받으면됨
    
    
    res.render("home.ejs", { user: req.session.passport.user.userid});
    }  
);

passport.use(
    new LocalStrategy(
        {
            usernameField: "userid",
            passwordField: "userpw",
            session: true,
            passReqToCallback: false,
        },
        function (inputid, inputpw, done) {
            conn.query("SELECT * FROM account WHERE userid = ?", [inputid], function (err, results) {
              if (err) {
                console.error(err);
                return done(err);
              }
      
              if (results.length > 0) {
                if (sha256(inputpw) == results[0].userpw) {
                    return done(null, results[0]); // 로그인 성공
                } else {
                    console.log("비밀번호 불일치")
                    return done(null, false, { message: "비밀번호 불일치" });
                  
                }
            ``} else {
                    console.log("아이디 틀림")
                    return done(null, false, { message: "아이디 틀림" });
                
              }
            });
        }
    )

)



//PASSPORT (Google) - 구글 로그인시 정보 이용
passport.use(new GoogleStrategy({
    clientID:process.env.GOOGLE_ID,
    clientSecret:process.env.GOOGLE_SECRET,
    callbackURL:  "http://localhost:8080/auth/google/callback" // googleCredentials.web.redirect_uris[0]
},
  function(accessToken, refreshToken, profile, done) {
    console.log(profile);

    // MySQL에서 사용자 정보 조회
    let query = 'SELECT * FROM account WHERE useremail = ?';
    let values = [profile.emails[0].value];

    conn.query(query, values, (error, results, fields) => {
      if (error) throw error;

      if (results.length > 0) {
        // 사용자가 이미 존재하는 경우
        console.log("-----------------------");
            console.log(results[0]);
            console.log("구글 로그인 성공");
            done(null,  results[0]);
      
      } else {
        // 사용자가 존재하지 않는 경우 새로운 사용자 추가
        let newUser = {
          provider: profile.provider,
          providerId:"google" + profile.id,
          token: accessToken,
          name: profile.displayName,
          email: profile.emails[0].value,
        };
        console.log("페이스북에서 제공하는 정보"+newUser)



        // MySQL에 새로운 사용자 정보 삽입
        query = 'INSERT INTO account (userkey, userid, useremail) VALUES (?, ?, ?)';
        values = [newUser.providerId, newUser.name, newUser.email];
        console.log("db에 들어갈 정보"+values)

        conn.query(query,values, function (error, insertResult, fields) {
            if (error) {
                console.error(error);
                return done(null, false, error);
            }

            console.log("-----------------------");
            console.log(insertResult);
            console.log("구글 insert성공");




            // 추가한 계정을 한 번 더 조회
            conn.query('SELECT * FROM account WHERE useremail = ?', [newUser.email], function (error, newRows, newFields) {
                if (error) {
                    console.error(error);
                    return done(null, false, error);
                }

                if (newRows.length > 0) {
                    console.log("-----------------------");
                    console.log(newRows[0]);
                    console.log("구글: 새로 추가한 계정 조회 성공");
                    done(null, newRows[0]);
                } else {
                    console.log("새로 추가한 계정 조회 실패");
                    done(null, false, { message: "새로 추가한 계정 조회 실패" });
                }
            });
        });

      }
    });
  }
));

//구글 로그인 버튼 클릭시 구글 페이지로 이동하는 역할
router.get('/auth/google',
  passport.authenticate('google', { scope: ['email','profile'] }));


//구글 로그인 후 자신의 웹사이트로 돌아오게될 주소 (콜백 url)
router.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login-social' }),
  function(req, res) {
    res.redirect('/home');
  });



//카카오용 passport발급
passport.use(
    new KakaoStrategy({
        clientID: process.env.KAKAO_ID, // 카카오 로그인에서 발급받은 REST API 키
        callbackURL: "http://localhost:8080/auth/kakao/callback" , // 카카오 로그인 Redirect URI 경로
    },
    function (accessToken, refreshToken, profile, done) {
        console.log(profile);
        // MySQL에서 사용자 정보 조회
        let query = 'SELECT * FROM account WHERE userkey = ?';
        let values = "kakao" +[profile.id];
        console.log(values)

        conn.query(query, values, (error, results, fields) => {
            if (error) throw error;

            if (results.length > 0) {
                // 사용자가 이미 존재하는 경우
                console.log("-----------------------");
                console.log(results[0]);
                console.log("카카오 로그인 성공");
                done(null,  results[0]);
            } else {
                // 사용자가 존재하지 않는 경우 새로운 사용자 추가
                let newUser = {
                    token: accessToken,
                    name: profile.displayName,
                    //email: profile.account_email
                    key: "kakao"+profile.id
                };
                console.log("카카오에서 제공하는 정보" + newUser);

                // MySQL에 새로운 사용자 정보 삽입
                query = 'INSERT INTO account (userkey, userid, username) VALUES (?, ?)';
                values = [newUser.key, newUser.name, newUser.name];
                console.log("db에 들어갈 정보" + values);

                conn.query(query, values, function (error, insertResult, fields) {
                    if (error) {
                        console.error(error);
                        return done(null, false, error);
                    }

                    console.log("-----------------------");
                    console.log(insertResult);
                    console.log("카카오 insert 성공");

                    // 추가한 계정을 한 번 더 조회
                    conn.query('SELECT * FROM account WHERE userkey = ?', [newUser.key], function (error, newRows, newFields) {
                        if (error) {
                            console.error(error);
                            return done(null, false, error);
                        }

                        if (newRows.length > 0) {
                            console.log("-----------------------");
                            console.log(newRows[0]);
                            console.log("카카오: 새로 추가한 계정 조회 성공");
                            done(null, newRows[0]);
                        } else {
                            console.log("새로 추가한 계정 조회 실패");
                            done(null, false, { message: "새로 추가한 계정 조회 실패" });
                        }
                    });
                });
            }
        });
    })
);


//카카오 로그인 버튼 클릭시 구글 페이지로 이동하는 역할
router.get('/auth/kakao',
  passport.authenticate('kakao'));

//카카오 로그인 후 자신의 웹사이트로 돌아오게될 주소 (콜백 url)
router.get('/auth/kakao/callback', 
   passport.authenticate('kakao', { failureRedirect: '/login-social' }),
   function(req, res) {
     res.redirect('/home');
   });


router.post("/signup", function(req, res) {
    console.log("id"+req.body.userid)
  
    // 이미 가입된 회원인지 확인
    conn.query("SELECT * FROM account WHERE userid = ?", [req.body.userid], function(error, results, fields) {
      if (error) throw error;
  
      // 이미 가입된 회원이 있다면
      if (results.length > 0) {
        const message = '이미 가입된 회원입니다.';
        console.log(message);
        //res.redirect("/login");
      } else {
        // 가입된 회원이 없으면 회원가입 진행
        conn.query("INSERT INTO account (userid, userpw, username) VALUES (?, ?, ?)", [req.body.userid, sha256(req.body.userpw),req.body.username], function(error, results, fields) {
          if (error) throw error;
          console.log('회원가입 성공');
          res.redirect("/login"); // 회원가입 성공 시 로그인 페이지로 리디렉션
        });
      }
    });
  });



//로그인시 중복확인 기능
  router.get('/checkUsernameDuplicate', (req, res) => {
    const userid = req.query.username;

    // Assuming you have a users table in your database
    const sql = 'SELECT COUNT(*) as count FROM account WHERE userid = ?';
    conn.query(sql, [userid], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        const count = result[0].count;

        // Send JSON response indicating duplicate status
        res.json({ duplicate: count > 0 });
        console.log(count)
    });
});

// module.exports = router;
export default router;

/*
//로그아웃 페이지 : 로그 아웃 처리 + 세션 삭제 + 쿠키 삭제 후 홈으로 리다이렉션
//passport 패키지로 인해 req.logout()으로 로그아웃 기능 구현 가능
app.get('/auth/logout',(req,res,next)=>{
    req.session.destroy((err)=>{
        if(err) next(err);
        req.logOut();
        res.cookie(`connect.sid`,``,{maxAge:0});
        res.redirect('/');
    });
});
*/









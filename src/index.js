const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const expressJwt = require("express-jwt");
const jwt = require("jsonwebtoken");

const config = {
  secret: `;dtn',kznm` //тот самый секретный ключ, которым подписывается каждый токен, выдаваемый клиенту
};

function jwtWare() {
  const { secret } = config;
  return expressJwt({ secret }).unless({
    //блюдет доступ к приватным роутам
    path: [
      // public routes that don't require authentication
      "/users/authenticate"
    ]
  });
}

function errorHandler(err, req, res, next) {
  if (typeof err === "string") {
    // custom application error
    return res.status(400).json({ message: err });
  }

  if (err.name === "UnauthorizedError") {
    //отлавливает ошибку, высланную из expressJwt
    // jwt authentication error
    return res.status(401).json({ message: "Invalid Token" });
  }

  // default to 500 server error
  return res.status(500).json({ message: err.message });
}

// мо
const users = [
  {
    id: 1,
    username: "test",
    password: "test",
    firstName: "Test",
    lastName: "User"
  }
];

async function authenticate({ username, password }) {
  //контроллер авторизации
  console.log(username, password);
  const user = users.find(
    u => u.username === username && u.password === password
  );
  if (user) {
    const token = jwt.sign({ sub: user.id }, config.secret); //подписывам токен нашим ключем
    const { password, ...userWithoutPassword } = user;
    return {
      //отсылаем интересную инфу
      ...userWithoutPassword,
      token
    };
  }
}

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// use JWT auth to secure the api

// api routes
app.post("/users/authenticate", function(req, res, next) {
  authenticate(req.body)
    .then(user =>
      user
        ? res.json(user)
        : res.status(400).json({ message: "Username or password is incorrect" })
    )
    .catch(err => next(err));
});

app.use(jwtWare());

// global error handler
app.get("/", (req, res, next) => {
  res.json({ all: "ok" });
  //next()
});

app.use(errorHandler);

// start server
const port = process.env.NODE_ENV === "production" ? 80 : 5000;
const server = app.listen(port, function() {
  console.log("Server listening on port " + port);
});

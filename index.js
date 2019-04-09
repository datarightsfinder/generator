// REQUIRES
const yaml = require('yamljs');
const settings = yaml.load('settings.yaml');
const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const http = require('http').Server(app);
const nunjucks = require('nunjucks');
const helmet = require('helmet');

// SERVER CONFIGURATION
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({
  extended: true,
}));
app.set('port', process.env.PORT || 3000);
app.use('/public', express.static(path.join(__dirname, 'public')));

// NUNJUCKS
nunjucks.configure('views', {
  autoescape: true,
  express: app,
});

app.render('index.html', {settings: settings}, function(err, html) {
  fs.writeFileSync("public/index.html", html);
});

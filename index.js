var PORT = 8080;

const express = require('express');
var path    = require('path');
var http = require('http');
var fs = require('fs');

const app = express();
app.disable('x-powered-by');

app.use('/d', express.static(__dirname + '/public/def'));
app.use('/', express.static(__dirname + '/public/defmimi'));

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/public/defmimi/index.html'));
});

app.get('/d', function (req, res) {
  res.sendFile(path.join(__dirname + '/public/def/index.html'));
});

app.get('/u', function (req, res) {
  res.sendFile(path.join(__dirname + '/public/upd/astar-demo.html'));
});

app.use(function(req, res){
  res.type('text/html');
  res.status(404);
  res.send('404');
});

app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500);
  res.send('500');
});

app.listen(PORT);
console.log('App listening on', PORT);

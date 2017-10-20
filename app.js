var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var todos = require('./routes/todos');//Jason add on 2016.09.26
var routes = require('./routes/index');
var todos = require('./routes/todos');//Jason add on 2017.02.21
//Jason add on 2017.02.16 - start
var RED = require("node-red");
var http = require('http');
var session = require('express-session');
var settings = require('./settings');
var flash = require('connect-flash');
//Jason add on 2017.02.16 - end
//Jason add on 2017.09.07 for account
var crypto = require('crypto');
var dbUtil = require('./models/dbUtil.js');
var cors = require('cors');
var app = express();

var port = process.env.PORT || settings.port;
console.log('Server listen port :'+port);
app.set('port', port);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(flash());
app.use(cors());
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/todos', todos);
app.use(session({
  secret: settings.cookieSecret,
  key: settings.db,//cookie name
  cookie: {maxAge: 1000 * 60 * 60 * 24 * 30},//30 days
  resave: false,
  saveUninitialized: true
}));
app.use('/todos', todos);
routes(app);
var server = http.createServer(app);

// Create the settings object - see default settings.js file for other options
var setting = {
    httpAdminRoot:"/red",
    httpNodeRoot: "/",
    userDir:"./.nodered/",
    functionGlobalContext: {
      momentModule:require("moment"),
      dbUtil:require("./models/dbUtil.js"),
      msgTools:require("./models/msgTools.js"),
      settings:require("./settings.js"),
    }    // enables global context
};

accountAdmin();

// Initialise the runtime with a server and settings
RED.init(server,setting);

// Serve the editor UI from /red
app.use(setting.httpAdminRoot,RED.httpAdmin);

// Serve the http nodes UI from /api
app.use(setting.httpNodeRoot,RED.httpNode);

server.listen(port);

// Start the runtime
RED.start();

function accountAdmin(){
	var obj = {
    "selector": {
      "category": "account"
      },
      "skip": 0
    };
  
  var md5 = crypto.createHash('md5');
  var	password = md5.update(settings.secret).digest('hex');
  var obj2 = {
    category: "account",
    account: "admin",
    password: password,
    enable: true,
    level: 0,
    date: new Date()
  };
	dbUtil.queryDoc(obj).then(function(value) {
		// on fulfillment(已實現時)
      var units = value.docs;
      if(value.docs.length === 0){
        dbUtil.insert(obj2);
      }
		}, function(reason) {
		// on rejection(已拒絕時)
		});
}
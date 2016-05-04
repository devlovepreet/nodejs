var express = require('express');

var app = express();

app.disable('x-powered-by');  // prevents head form showing our server properties ...  For security Reasons

var handlebars = require('express-handlebars').create({defaultLayout:'main'});

app.engine('handlebars',handlebars.engine);
app.set('view engine', 'handlebars');

app.use(require('body-parser').urlencoded({extended : true}));

var formidable = require('formidable');

var credentials = require('./credentials.js');
app.use(require('cookie-parser')(credentials.cookieSecret));

app.set('port', process.env.PORT || 3000);  //setting port for localhost

app.use(express.static(__dirname + '/public'));  //for using logo image in bsnavabar.handlebars

app.get('/', function(req, res){  // remeber path is case insensitive
	res.render('home');   // it will render home.handlebars in  main.handlebars
});



// middleware
app.use(function(req,res,next){                         
	console.log("looking for URL : " + req.url);
	next();
});


app.get('/junk',function(req,res, next){
	console.log('Tried to access /junk');
	throw new Error('/junk does not exit');
});

//middleware
app.use(function(err,req,res,next){
	console.log('Error : ' + err.message);
	next();
});

app.get('/about', function(req, res){  // remeber path is case insensitive
	res.render('about');   // it will render home.handlebars in  main.handlebars
});

app.get('/contact', function(req,res){
	res.render('contact',{csrf : 'CSRF token here'});
});

app.get('/thankyou', function(req,res){
	res.render('thankyou');
});

app.post('/process', function(req,res){
	console.log('Form : ' + req.query.form);
	console.log('CSRF Token : ' + req.body._csrf);
	console.log('Email : ' + req.body.email);
	console.log('Question : '+ req.body.ques);
	res.redirect(303, '/thankyou');
});

app.get('/file-upload', function(req, res ){
	var now = new Date();
	res.render('file-upload', {
		year : now.getFullYear(),
		month: now.getMonth()
	});
});

app.post('/file-upload/:year/:month', function(req,res){
	var form = new formidable.IncomingForm();
	form.parse(req, function(err, fields, file){
		if(err)
			return res.redirect(303, '/error');
		console.log("Received File");
		console.log(file);
		res.redirect(303,'/thankyou');
	});
});

app.get('/cookie',function(req,res){
	// username is key here and Lovepreet Singh is value
	res.cookie('username', 'Lovepreet Singh', {expire: new Date() + 9999}).send('username has the value of Lovepreet Singh');

});

app.get('/listcookies', function(req,res){
	console.log("Cookies : " , req.cookies);
	res.send('Look in the console for cookies');
});

app.get('/deletecookie', function(req, res){
	res.clearCookie('username');
	res.send('username Cookie Deleted');
})

var session = require('express-session');

var parseurl = require('parseurl');
app.use(session({
	resave :  false ,//means we want to store to session store only if a change is made
	saveUninitialized : true,
	secret : credentials.cookieSecret,
}));

//middleware
app.use(function(req, res , next){
	var views = req.session.views;

	if(!views){
		views = req.session.views = {};
	}
	var pathname =  parseurl(req).pathname;

	views[pathname] = (views[pathname] || 0) + 1;
	next();
});

app.get('/viewcount', function(req,res, next){
	res.send('You viewed this page' + req.session.views['/viewcount'] + 'times');
});

var fs = require('fs');

app.get('/readfile', function(req, res , next){
	fs.readFile('./public/randomfile.txt',
		function(err,data){
			if(err){
				return console.error(err);
			}
			res.send("the file : " + data.toString());
		});
});

app.get('/writefile', function(req,res,next){
	fs.writeFile('./public/randomfile2.txt', 'More random text' , function(err){
		if(err){
			return console.error(err);
		}
	});

	fs.readFile('./public/randomfile2.txt', function(err,data){
		if(err){
			return console.error(err);
		}
		res.send("The file : " + data.toString());
	});
});


app.use(function(req,res){
	res.type('text/html');
	res.status(404);
	res.render('404');
});

app.use(function(err, req, res, next){
	console.error(err.stack);
	res.status(500);
	res.render('500');
});









app.listen(app.get('port'), function(){
	console.log("Express started on http:localhost:" + app.get('port') + 'Press Ctrl-C to terminate');
});


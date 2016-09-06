var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var morgan     = require('morgan');
var mongoose   = require('mongoose');

var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config'); // get our config file
var User   = require('./models/user'); // get our mongoose model

var bcrypt = require('bcrypt');
const saltRounds = 10;

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;        // set our port

mongoose.connect(config.database); // connect to database
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

app.set('superSecret', config.secret); // secret variable

app.use(morgan('dev'));

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });   
});

router.post('/signup', function(req, res) {
	var user = new User(req.body);
	user.isVerified = false;
	bcrypt.hash(user.password, saltRounds, function(err, hash){
		if (err) throw err;
		user.password = hash;
		user.save(function(err) {
			if (err) throw err;
			res.json(user);
		});
	});

	
});

router.post('/signin', function(req, res) {

	User.findOne({
		email: req.body.email
	}, function(err, user) {
		if (err) throw err;

		if (!user) {
			res.json({success: false, message: "Authentication failed. User not found!"});
		} else {
			bcrypt.compare(req.body.password, user.password, function(bcryptErr, bcryptRes) {
		    	if (bcryptErr) throw bcryptErr;
		    	if (bcryptRes) {
		    		var token = jwt.sign(user, app.get('superSecret'), {
			        	expiresIn: 3600 // expires in 24 hours
			        });

			        res.json({
			          success: true,
			          message: 'Enjoy your token!',
			          token: token
			        });
		    	} else {
		    		res.json({success: false, message: "Authentication failed. Incorrect password!"});
		    	}
			});
		}
	});
});

// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
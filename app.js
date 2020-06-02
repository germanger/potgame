// Modules used in this file
var http = require('http');
var express = require('express'), app = module.exports.app = express();
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var shortid = require('shortid');
var server = http.createServer(app);
var shared = require('./shared');
var _ = require('underscore');

// A default engine is required, even though we render plain html
app.set('views', './public');
app.set('view engine', 'ejs');

// Socket.io
shared.io = require('socket.io').listen(server);

shared.io.sockets.on('connection', function (socket) {
    var roomId = socket.handshake.query.roomId;
    
    if (!(roomId in shared.rooms)) {

        // new room
        roomId = shortid.generate();
        shared.rooms[roomId] = {
            roomId: roomId,
            messages: [],
            phrases: []
        };
    }
    
    socket.join(roomId);
    
    // new user
    var userId = shortid.generate();
	
	var suggestedColors = [
		"#83DF70",
		"#70dfd5",
		"#8987e0",
		"#c687e0",
		"#e087b0",
		"#e06d6d",
		"#e0dc6d",
		"#aee06d",
		"#e0976d",
	];

	var suggestedNames = [
		"Charles Chaplin",
		"Marlon Brando",
		"Jack Nicholson",
		"Daniel Day-Lewis",
		"Meryl Streep",
		"Tom Hanks",
		"Mohanlal",
		"Robert De Niro",
		"Anthony Hopkins",
		"Al Pacino",
		"Leonardo DiCaprio",
		"Joaquin Phoenix",
		"Christoph Waltz",
		"Kamal Haasan",
		"Min-sik Choi",
		"Gary Oldman",
		"Heath Ledger",
		"Javier Bardem",
		"Mammootty",
		"Russell Crowe",
		"Anupam Kher",
		"Christian Bale",
		"Naseeruddin Shah",
		"George Clooney",
		"Sean Penn",
		"Kevin Spacey",
		"Johnny Depp",
		"Sean Connery",
		"Jennifer Lawrence",
		"Morgan Freeman",
		"Sandra Bullock",
		"Clint Eastwood",
		"Robin Williams",
		"Benedict Cumberbatch",
		"Tom Hiddleston",
		"Denzel Washington",
		"Amitabh Bachchan",
		"Cate Blanchett",
		"Bryan Cranston",
		"Irrfan Khan",
		"Jim Carrey",
		"Dustin Hoffman",
		"Nicolas Cage",
		"Hugh Jackman",
		"Adrien Brody",
		"Edward Norton",
		"Matt Damon",
		"Brad Pitt",
		"Samuel L. Jackson",
		"Jake Gyllenhaal",
		"Martin Freeman",
		"Jared Leto",
		"Thilakan"
	];
    
    var user = {
        roomId: roomId,
        userId: userId,
        socketId: socket.id,
        username: suggestedNames[Math.floor(Math.random() * suggestedNames.length)],
		color: suggestedColors[Math.floor(Math.random() * suggestedColors.length)],
		isTyping: false,
		isAway: false
    };

    shared.users[socket.id] = user;
    
    // Log
    var message = {
        messageType: 'userConnected',
        timestamp: new Date(),
        user: {
            userId: user.userId,
			color: user.color,
            username: user.username
        }
    };
    
    shared.rooms[roomId].messages.push(message);
    
    // Respond to him
    socket.emit('welcome', {
        user: user,
        roomId: roomId
    });

    // Broadcast
    shared.io.to(roomId).emit('userConnected', {
        message: message
    });
    
    socket.on('disconnect', function() {

		// If user was holding a phrase, put it back to bin1
		for (var i = 0; i < shared.rooms[roomId].phrases.length; i++) {
			if (shared.rooms[roomId].phrases[i].userId == user.userId) {
				
				shared.rooms[roomId].phrases[i].location = "bin1";
				shared.rooms[roomId].phrases[i].userId = undefined;
			}
		}
        
        delete shared.users[socket.id];
       
        // Log
        var message = {
            messageType: 'userDisconnected',
            timestamp: new Date(),
            user: {
                userId: user.userId,
                username: user.username
            }
        };
        
        shared.rooms[roomId].messages.push(message);
        
        // Broadcast
        shared.io.to(roomId).emit('userDisconnected', {
            message: message
        });
    });
});

// Start server
server.listen(process.env.PORT || 3000);

// Middleware: app.use([path], f),
//    [path] is optional, default is '/'
//    f acts as a middleware function to be called when the path matches
// The order of which middleware are defined is important (eg. move logger down)
app.use('/', bodyParser.json());
app.use('/', bodyParser.urlencoded());
app.use('/', cookieParser('cookieSecret'));
app.use('/', express.static('./public')); // Serve any file under /public
app.use('/', logger('dev'));

// My middleware (It is a sort of "base controller")
// Executed in every "/api/.*" request, after all the previous app.use(),
// unless those app.use() finish the cycle (for example getting /img/logo.png will finish there)
app.use('/api/', function(req, res, next) {

    res.user = undefined;
       
    if (req.query.socketId != null) {
        res.user = shared.users[req.query.socketId];
    }

    next();
});

// Router
app.use('/', require('./routes/viewsRoutes'));
app.use('/api/users', require('./routes/api_users'));
app.use('/api/messages', require('./routes/api_messages'));
app.use('/api/phrases', require('./routes/api_phrases'));
app.use('/api/server', require('./routes/api_server'));

// development error handler will print stacktrace
/*
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        
        res.json({
            error: true,
            message: err.message
        });
    });
}
*/

// production error handler (no stacktraces leaked to user)
app.use(function(err, req, res, next) {
    //res.status(err.status || 500);
    res.status(200);
    
    res.json({
        error: true,
        message: err.message
    });
});

module.exports = app;

console.log("Running...");
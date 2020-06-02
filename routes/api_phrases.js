var express = require('express');
var _ = require('underscore');
var shared = require('../shared');

var router = express.Router();

router.get('/summary', function(req, res, next) {

    if (!res.user) {
        return next(new Error('socketId not found in list of users'));
    }
	
	var bin1Count = 0;
	var bin2Count = 0;
	
	for (var i = 0; i < shared.rooms[res.user.roomId].phrases.length; i++) {
		if (shared.rooms[res.user.roomId].phrases[i].location == "bin1") {
			bin1Count++;
		}
		
		if (shared.rooms[res.user.roomId].phrases[i].location == "bin2") {
			bin2Count++;
		}
	}

    res.json({
        error: false,
        bin1Count: bin1Count,
		bin2Count: bin2Count,
		turn: shared.turn
    });
});

router.get('/create', function(req, res, next) {

    if (!res.user) {
        return next(new Error('socketId not found in list of users'));
    }
	
	var text = req.query.text;
	
	if (text == null || text == "") {
		res.json({
			error: true,
			message: "Write some text"
		});
		
		return;
	}
	
	var phrase = {
		text: text,
		location: "bin1"
	};
	
	shared.rooms[res.user.roomId].phrases.push(phrase);
	
    // Log
    var message = {
        messageType: 'userCreatedPhrase',
        timestamp: new Date(),
        user: {
            userId: res.user.userId,
            username: res.user.username
        },
    };
    
    shared.rooms[res.user.roomId].messages.push(message);

    // Broadcast
    shared.io.to(res.user.roomId).emit('userCreatedPhrase', {
        message: message
    });

    res.json({
        error: false,
    });
});

router.get('/getOneFromBin1', function(req, res, next) {

    if (!res.user) {
        return next(new Error('socketId not found in list of users'));
    }
	
	// Get all phrases from bin1
	var phrases = [];
	
	for (var i = 0; i < shared.rooms[res.user.roomId].phrases.length; i++) {
		if (shared.rooms[res.user.roomId].phrases[i].location == "bin1") {
			phrases.push(shared.rooms[res.user.roomId].phrases[i]);
		}
	}
	
	// Random
	var phrase = phrases[Math.floor(Math.random() * phrases.length)];
	
	// Change its location
	phrase.location = "user";
	phrase.userId = res.user.userId;
	
    // Log
    var message = {
        messageType: 'userGotOneFromBin1',
        timestamp: new Date(),
        user: {
            userId: res.user.userId,
            username: res.user.username
        },
    };
    
    shared.rooms[res.user.roomId].messages.push(message);

    // Broadcast
    shared.io.to(res.user.roomId).emit('userGotOneFromBin1', {
        message: message
    });

    res.json({
        error: false,
		phrase: phrase
    });
});

router.get('/moveAllToBin1', function(req, res, next) {

    if (!res.user) {
        return next(new Error('socketId not found in list of users'));
    }
	
	for (var i = 0; i < shared.rooms[res.user.roomId].phrases.length; i++) {
		var phrase = shared.rooms[res.user.roomId].phrases[i];
		
		if (phrase.location == "bin2") {
			phrase.location = "bin1";
			phrase.userId = undefined;
		}
	}
	
    // Log
    var message = {
        messageType: 'userMovedAllToBin1',
        timestamp: new Date(),
        user: {
            userId: res.user.userId,
            username: res.user.username
        },
    };
    
    shared.rooms[res.user.roomId].messages.push(message);

    // Broadcast
    shared.io.to(res.user.roomId).emit('userMovedAllToBin1', {
        message: message
    });

    res.json({
        error: false,
    });
});

router.get('/moveToBin1', function(req, res, next) {

    if (!res.user) {
        return next(new Error('socketId not found in list of users'));
    }
	
	var phrase = undefined;
	
	for (var i = 0; i < shared.rooms[res.user.roomId].phrases.length; i++) {
		if (shared.rooms[res.user.roomId].phrases[i].userId == res.user.userId) {
			phrase = shared.rooms[res.user.roomId].phrases[i];
			
			phrase.location = "bin1";
			phrase.userId = undefined;
		}
	}
	
	if (phrase == undefined) {
		res.json({
			error: true,
			message: "You are not holding any phrase"
		});
	
		return;
	}
	
    // Log
    var message = {
        messageType: 'userMovedPhraseToBin1',
        timestamp: new Date(),
        user: {
            userId: res.user.userId,
            username: res.user.username
        },
    };
    
    shared.rooms[res.user.roomId].messages.push(message);

    // Broadcast
    shared.io.to(res.user.roomId).emit('userMovedPhraseToBin1', {
        message: message
    });

    res.json({
        error: false,
    });
});

router.get('/moveToBin2', function(req, res, next) {

    if (!res.user) {
        return next(new Error('socketId not found in list of users'));
    }
	
	var phrase = undefined;
	
	for (var i = 0; i < shared.rooms[res.user.roomId].phrases.length; i++) {
		if (shared.rooms[res.user.roomId].phrases[i].userId == res.user.userId) {
			phrase = shared.rooms[res.user.roomId].phrases[i];
			
			phrase.location = "bin2";
			phrase.userId = undefined;
		}
	}
	
	if (phrase == undefined) {
		res.json({
			error: true,
			message: "You are not holding any phrase"
		});
	
		return;
	}
	
    // Log
    var message = {
        messageType: 'userMovedPhraseToBin2',
        timestamp: new Date(),
        user: {
            userId: res.user.userId,
            username: res.user.username
        },
    };
    
    shared.rooms[res.user.roomId].messages.push(message);

    // Broadcast
    shared.io.to(res.user.roomId).emit('userMovedPhraseToBin2', {
        message: message
    });

    res.json({
        error: false,
    });
});

module.exports = router;
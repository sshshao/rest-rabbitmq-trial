var path = require('path');
var amqp = require('amqplib/callback_api');

const url = 'amqp://localhost';
const ex = 'hw3';

exports.listen = function(req, res) {
    /* 
        Creates an exclusive queue, binds to “hw3” with all provided keys, 
        waits to receive a message and returns it as { msg: } 
    */

    if(req.body.keys != null) {
        amqp.connect(url, function(err, conn) {
            conn.createChannel(function(err, ch) {
                ch.assertExchange(ex, 'direct', {durable: false});

                ch.assertQueue('', {exclusive: true}, function(err, q) {
                    req.body.keys.forEach(function(key) {
                        ch.bindQueue(q.queue, ex, key);
                    });

                    ch.consume(q.queue, function(msg) {
                        res.send({
                            'msg': msg
                        }, {noAck: true});
                    });
                });
            });
        });
    }
    else {
        res.send({
            'status': 'ERROR'
        });
    }
}

exports.speak = function(req, res) {
    /* Publishes the message to exchange hw3 with provided key */
    if(req.body.key != null && req.body.msg != null) {
        amqp.connect(url, function(err, conn) {
            conn.createChannel(function(err, ch) {
                ch.assertExchange(ex, 'direct', {durable: false});

                ch.publish(ex, req.body.key, new Buffer(req.body.msg));
            });

            setTimeout(function() { conn.close(); }, 500);
        });
    }
    else {
        res.send({
            'status': 'ERROR'
        });
    }
}
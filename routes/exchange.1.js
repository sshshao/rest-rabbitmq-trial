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

                ch.assertQueue(ex, {exclusive: true}, function(err, q) {
                    req.body.keys.forEach(function(key) {
                        ch.bindQueue(q.queue, ex, key);
                    });

                    ch.consume(q.queue, function reply(msg) {
                        ch.sendToQueue(msg.properties.replyTo, 
                            new Buffer(msg.body.msg),
                            {correlationId: msg.properties.correlationId});
                        ch.ack(msg);
                    });
                });
                ch.prefetch(1);
                console.log(' [x] Awaiting RPC requests');

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
                console.log(' [x] Sent %s: "%s"', req.body.key, req.body.msg);
            });

            setTimeout(function() {
                conn.close();
                res.send({
                    'status': 'ERROR'
                });
            }, 500);
        });
    }
    else {
        res.send({
            'status': 'ERROR'
        });
    }
}
var path = require('path');
var amqp = require('amqplib/callback_api');

const url = 'amqp://localhost';
const ex = 'hw3';
const ae = 'ae';

exports.listen = function(req, res) {
    /* 
        Creates an exclusive queue, binds to “hw3” with all provided keys, 
        waits to receive a message and returns it as { msg: } 
    */

    if(req.body.keys != null) {
        amqp.connect(url, function(err, conn) {
            conn.createChannel(function(err, ch) {
                //Direct exchange with key
                ch.assertExchange(ex, 'direct', {durable: false});
                ch.assertQueue('', {exclusive: true}, function(err, q) {
                    console.log(' [x] Awaiting requests DE');

                    req.body.keys.forEach(function(key) {
                        ch.bindQueue(q.queue, ex, key);
                        console.log(' [x] Binded queue with key %s', key);
                    });

                    ch.consume(q.queue, function(msg) {
                        console.log(' [x] Endpoint <listen> consuming %s: "%s"', 
                            msg.fields.routingKey, msg.content.toString());
                        ch.sendToQueue(msg.properties.replyTo, new Buffer(msg.content.toString()),
                            {correlationId: msg.properties.correlationId});
                        ch.ack(msg);
                    });
                    
                    res.send({'status': 'OK'});
                });

                /*
                //Alternate exchange to deal with unroutable messages 
                ch.assertExchange(ae, 'fanout', {durable: false});
                ch.assertQueue('', {exclusive: true}, function(err, q) {
                    console.log(' [x] Awaiting requests AE');

                    ch.consume(q.queue, function(msg) {
                        console.log(' [x] Endpoint <listen> returning unrouted msg..."');
                        ch.sendToQueue(msg.properties.replyTo, new Buffer(''),
                            {correlationId: msg.properties.correlationId});
                        ch.ack(msg);
                    });
                });
                */
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
                //ch.assertExchange(ae, 'fanout', {durable: false});

                ch.assertQueue('', {exclusive: true}, function(err, q) {
                    var corr = generateUuid();
                    console.log(' [x] Endpoint <speak> requesting %s: "%s"', 
                        req.body.key, req.body.msg);

                    ch.consume(q.queue, function(msg) {
                        if(msg.properties.correlationId == corr) {
                            console.log(' [.] Got %s',
                                msg.content.toString());
                            res.send({
                                'msg': msg.content.toString()
                            });
                        }
                        else {
                            res.send({'msg': ''});
                        }
                    }, {noAck: false});

                    ch.publish(ex, req.body.key, new Buffer(req.body.msg),
                        {correlationId: corr, replyTo: q.queue, mandatory: true});
                });

                //ch.publish(ex, req.body.key, new Buffer(req.body.msg));
            });
        });
    }
    else {
        res.send({
            'status': 'ERROR'
        });
    }
}

function generateUuid() {
    return Math.random().toString() +
           Math.random().toString() +
           Math.random().toString();
  }
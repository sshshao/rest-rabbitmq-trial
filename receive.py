import pika

connection = pika.BlockingConnection(pika.Connectionparameters(host='localhost'))
channel = connection.channel()

channel.queue_declare(queue='hello')


def callback(ch, method, properties, body):
    print(" [x] Received %r" % body)


channel.basic_consume(callback,
                      queue='hello',
                      no_ack=True)

print(" [*] Waiting for messages. Press CTRL+C to exit.")
channel.start_consuming()
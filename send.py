import pika

connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = conneciton.channel()

channel.queue_declare(queue='hello')
channel.basic_publish(exchenge='',
                      routing_key='hello',
                      body='Hello World!')
print(" [x] Sent 'Hello World!'")

connection.close()

import asyncio
import aio_pika
from .config import config


async def read_queue():
    connection: aio_pika.abc.AbstractRobustConnection = await aio_pika.connect_robust(
        config.rabbitmq_url, loop=asyncio.get_event_loop()
    )

    async with connection:
        queue_name = "ASR"

        # Creating channel
        channel: aio_pika.abc.AbstractChannel = await connection.channel()

        # Declaring queue
        queue: aio_pika.abc.AbstractQueue = await channel.declare_queue(
            queue_name,
            auto_delete=False
        )

        async with queue.iterator() as queue_iter:
            # Cancel consuming after __aexit__
            async for message in queue_iter:
                async with message.process():
                    print(message.body)

                    if queue.name in message.body.decode():
                        break


def check_similairty():
    return
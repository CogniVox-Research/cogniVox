import json
import aio_pika
from app.transcript import SpeechComparer
import shared
from .dto import ASRData
from aio_pika.abc import AbstractChannel


async def queue_listener(conn: AbstractChannel):
    await conn.declare_queue("transcript_similarity", auto_delete=False)
    try:
        queue_reader = shared.rabbitmq.read_queue(conn, "ASR", ASRData)
        async for data in queue_reader:
            print(f"Checking similarly {data}")
            await check_similarity(conn, data)
    except Exception as e:
        print(e)


async def check_similarity(channel, data: ASRData):
    from . import document_server

    comparer = SpeechComparer()

    response = await document_server.get_transcript(data.session_id)
    expected_text = response["text"]
    if not data.full_text:
        return

    results = comparer.compare(expected_text, data.full_text)

    await channel.default_exchange.publish(
        aio_pika.Message(body=json.dumps(results).encode()),
        routing_key="transcript_similarity",
    )
    print(f"Similarity result {results}")

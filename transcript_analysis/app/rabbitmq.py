import json
import aio_pika
from app import util
from app.transcript import SpeechComparer
import shared
from .dto import ASRData
from aio_pika.abc import AbstractChannel


async def queue_listener(conn: AbstractChannel):
    try:
        queue_reader = shared.rabbitmq.read_queue(conn, "ASR", ASRData)
        async for data in queue_reader:
            print(f"Checking similarly {data}")
            await check_similarity(conn, data)
    except Exception as e:
        print(e)


async def check_similarity(channel: AbstractChannel, data: ASRData):
    from . import document_server
    from . import grammar

    comparer = SpeechComparer()

    response = await document_server.get_transcript(data.session_id)
    expected_text = response["text"]
    if not data.full_text:
        return

    similarity_results = comparer.compare(expected_text, data.full_text)
    grammar_results = grammar.checker.check_errors(data.full_text)

    print(f"Similarity result {similarity_results}")

    await channel.default_exchange.publish(
        aio_pika.Message(
            body=json.dumps(
                {
                    "type": "transcript_similarity",
                    "data": {
                        "similarity": util.convert_numpy_to_python(similarity_results),
                        "grammar": grammar_results
                    },
                }
            ).encode()
        ),
        routing_key=f"session-{data.session_id}",
        mandatory=False,
    )

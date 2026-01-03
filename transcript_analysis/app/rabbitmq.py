
import asyncio
import aio_pika

from app.transcript import SpeechComparer
from .config import config
import shared
from .dto import ASRData
from aio_pika.abc import AbstractChannel
from . import document_server


async def read_queue(conn: AbstractChannel):
    
    queue_reader = shared.rabbitmq.read_queue(conn,"ASR",ASRData)
    async for data in queue_reader:
        await check_similarity(data)
            

async def check_similarity(data: ASRData):
    comparer = SpeechComparer()

    response = await document_server.get_transcript(data.session_id)
    expected_text = response["text"]

    results = comparer.compare(expected_text, data.full_text)
    print(results)
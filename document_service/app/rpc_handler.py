import json
from pathlib import Path
import re

import aiofiles

from .config import config


class DocumentRPCServer:
    async def get_transcript(self, session_id: str):
        clean_session_id = re.sub(r"[/\\?%*:|\"<>\x7F\x00-\x1F]", "-", session_id)
        transcript_file = (
            Path(config.upload_dir).absolute() / clean_session_id / "transcript.json"
        )

        async with aiofiles.open(transcript_file, "r") as f:
            return json.loads(await f.read())


import os
from typing import Dict, Optional
from groq import Groq
from app.config import settings


class SpeechToTextService:
    """Service for transcribing audio using Groq Whisper"""

    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)
        self.model = "whisper-large-v3"

    async def transcribe_audio(
        self,
        audio_file_path: str,
        language: str = "en",
        prompt: Optional[str] = None,
        timeout: int = 30
    ) -> Dict[str, any]:
        """
        Transcribe audio file to text using Groq Whisper

        Args:
            audio_file_path: Path to audio file (wav, mp3, m4a, webm, etc.)
            language: Language code (default: "en")
            prompt: Optional prompt to guide transcription
            timeout: Timeout in seconds (default: 30)

        Returns:
            Dict with transcript text and metadata
            {
                "text": str,
                "duration": float,
                "language": str,
                "segments": list (optional)
            }
        """
        import asyncio

        try:
            # Run transcription with timeout
            async def _transcribe():
                with open(audio_file_path, "rb") as audio_file:
                    # Groq client is synchronous, run in executor
                    loop = asyncio.get_event_loop()
                    transcription = await loop.run_in_executor(
                        None,
                        lambda: self.client.audio.transcriptions.create(
                            file=audio_file,
                            model=self.model,
                            language=language,
                            prompt=prompt,
                            response_format="verbose_json",
                            temperature=0.0
                        )
                    )
                    return transcription

            transcription = await asyncio.wait_for(_transcribe(), timeout=timeout)

            result = {
                "text": transcription.text.strip(),
                "duration": getattr(transcription, "duration", None),
                "language": getattr(transcription, "language", language),
            }

            if hasattr(transcription, "segments"):
                result["segments"] = transcription.segments

            return result

        except asyncio.TimeoutError:
            raise Exception(f"Transcription timeout after {timeout} seconds. Audio may be too long or corrupted.")
        except Exception as e:
            raise Exception(f"Error transcribing audio: {str(e)}")

    async def transcribe_audio_bytes(
        self,
        audio_bytes: bytes,
        filename: str = "audio.wav",
        language: str = "en"
    ) -> Dict[str, any]:
        """
        Transcribe audio from bytes

        Args:
            audio_bytes: Audio data as bytes
            filename: Filename for the audio (for format detection)
            language: Language code

        Returns:
            Dict with transcript and metadata
        """
        import tempfile

        try:
            with tempfile.NamedTemporaryFile(
                delete=False,
                suffix=os.path.splitext(filename)[1]
            ) as temp_file:
                temp_file.write(audio_bytes)
                temp_path = temp_file.name

            result = await self.transcribe_audio(temp_path, language)

            os.unlink(temp_path)

            return result

        except Exception as e:
            if 'temp_path' in locals():
                try:
                    os.unlink(temp_path)
                except:
                    pass
            raise Exception(f"Error transcribing audio bytes: {str(e)}")


speech_to_text_service = SpeechToTextService()

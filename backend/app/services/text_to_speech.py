"""
Text-to-Speech service using OpenAI API
"""
from openai import OpenAI
from app.config import settings


class TextToSpeechService:
    """Service for generating speech from text using OpenAI TTS"""

    VOICES = {
        "professional_female": "nova",   # Clear, professional female voice
        "professional_male": "onyx",     # Deep, professional male voice
        "friendly": "shimmer",           # Warm, friendly voice
        "default": "onyx"                # Default to onyx (professional interviewer)
    }

    def __init__(self):
        """Initialize OpenAI client"""
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)

    async def generate_speech(
        self,
        text: str,
        voice: str = "default",
        model: str = "tts-1",
        timeout: int = 30
    ) -> bytes:
        """
        Generate speech from text using OpenAI TTS

        Args:
            text: Text to convert to speech
            voice: Voice persona to use (key from VOICES dict or voice name)
            model: OpenAI TTS model to use
            timeout: Timeout in seconds

        Returns:
            Audio data as bytes (MP3 format)
        """
        import asyncio

        try:
            voice_name = self.VOICES.get(voice, voice)

            async def _generate():
                loop = asyncio.get_event_loop()
                response = await loop.run_in_executor(
                    None,
                    lambda: self.client.audio.speech.create(
                        model=model,
                        voice=voice_name,
                        input=text,
                        response_format="mp3"
                    )
                )
                return response.content

            audio_bytes = await asyncio.wait_for(_generate(), timeout=timeout)
            return audio_bytes

        except asyncio.TimeoutError:
            raise Exception(f"Text-to-speech timeout after {timeout} seconds.")
        except Exception as e:
            raise Exception(f"Error generating speech: {str(e)}")

    async def generate_speech_stream(
        self,
        text: str,
        voice: str = "default",
        model: str = "tts-1"
    ):
        """
        Generate speech from text with streaming

        Args:
            text: Text to convert to speech
            voice: Voice persona to use
            model: OpenAI TTS model to use

        Yields:
            Audio chunks as bytes
        """
        try:
            voice_name = self.VOICES.get(voice, voice)

            with self.client.audio.speech.with_streaming_response.create(
                model=model,
                voice=voice_name,
                input=text,
                response_format="mp3"
            ) as response:
                for chunk in response.iter_bytes(chunk_size=4096):
                    yield chunk

        except Exception as e:
            raise Exception(f"Error generating speech stream: {str(e)}")

    def get_available_voices(self) -> dict:
        """Get list of available voice personas"""
        return {
            "professional_female": {
                "name": "Nova",
                "description": "Clear, professional female voice",
                "voice_id": self.VOICES["professional_female"]
            },
            "professional_male": {
                "name": "Onyx",
                "description": "Deep, professional male voice",
                "voice_id": self.VOICES["professional_male"]
            },
            "friendly": {
                "name": "Shimmer",
                "description": "Warm, friendly voice",
                "voice_id": self.VOICES["friendly"]
            },
            "default": {
                "name": "Onyx (Default)",
                "description": "Default professional interviewer voice",
                "voice_id": self.VOICES["default"]
            }
        }


text_to_speech_service = TextToSpeechService()

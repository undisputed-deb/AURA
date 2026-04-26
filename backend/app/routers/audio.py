"""
Audio processing endpoints for TTS and STT
"""
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional
import tempfile
import os

from app.dependencies import get_current_user
from app.services.text_to_speech import text_to_speech_service
from app.services.speech_to_text import speech_to_text_service


router = APIRouter(prefix="/audio", tags=["audio"])


class TextToSpeechRequest(BaseModel):
    text: str
    voice: Optional[str] = "default"


class TranscriptionResponse(BaseModel):
    text: str
    duration: Optional[float] = None
    language: Optional[str] = None


@router.post("/tts")
async def text_to_speech(
    request: TextToSpeechRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Convert text to speech using ElevenLabs

    Returns MP3 audio data
    """
    try:
        audio_bytes = await text_to_speech_service.generate_speech(
            text=request.text,
            voice=request.voice
        )

        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "inline; filename=speech.mp3"
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating speech: {str(e)}")


@router.get("/voices")
async def get_available_voices(current_user: dict = Depends(get_current_user)):
    """
    Get list of available voice personas
    """
    try:
        voices = text_to_speech_service.get_available_voices()
        return {"voices": voices}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching voices: {str(e)}")


@router.post("/stt", response_model=TranscriptionResponse)
async def speech_to_text(
    audio_file: UploadFile = File(...),
    language: str = Form("en"),
    current_user: dict = Depends(get_current_user)
):
    """
    Transcribe audio file to text using Groq Whisper

    Accepts: WAV, MP3, M4A, WebM, OGG
    """
    try:
        allowed_types = ["audio/wav", "audio/mpeg", "audio/mp3", "audio/webm", "audio/m4a", "audio/ogg", "audio/mp4"]
        if audio_file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported audio format. Allowed: {', '.join(allowed_types)}"
            )

        audio_bytes = await audio_file.read()

        with tempfile.NamedTemporaryFile(
            delete=True,
            suffix=os.path.splitext(audio_file.filename)[1]
        ) as temp_file:
            temp_file.write(audio_bytes)
            temp_file.flush()

            result = await speech_to_text_service.transcribe_audio(
                audio_file_path=temp_file.name,
                language=language
            )

            return TranscriptionResponse(
                text=result["text"],
                duration=result.get("duration"),
                language=result.get("language")
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error transcribing audio: {str(e)}")

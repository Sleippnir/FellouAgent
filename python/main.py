from fastapi import FastAPI, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import whisper
import shutil
import os
import io

# Note: The 'piper' library is not a real package and is used here
# as a placeholder for the actual TTS logic which will be mocked in tests.
# In a real implementation, this would be the actual TTS library.

app = FastAPI()

# --- Pydantic Models ---

class TTSRequest(BaseModel):
    text: str

# --- Endpoints ---

@app.get("/health")
def read_health():
    """A simple health check endpoint."""
    return {"status": "ok"}


@app.post("/stt")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Accepts an audio file, transcribes it using Whisper, and returns the text.
    """
    temp_dir = "temp_audio"
    os.makedirs(temp_dir, exist_ok=True)
    temp_file_path = os.path.join(temp_dir, file.filename)

    try:
        # Save the uploaded file to a temporary location
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Load the Whisper model. Using "base" for speed and lower resource usage.
        model = whisper.load_model("base")

        # Transcribe the audio file. fp16=False is recommended if not using a GPU.
        result = model.transcribe(temp_file_path, fp16=False)

        return {"transcript": result["text"]}

    except Exception as e:
        return {"error": str(e)}

    finally:
        # Clean up the temporary file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)


@app.post("/tts")
async def text_to_speech(request: TTSRequest):
    """
    Accepts text and synthesizes it into speech.
    This is a placeholder and returns a dummy WAV file.
    """
    try:
        # In a real implementation, you would use a library like piper-tts.
        # For example:
        # from piper import PiperVoice
        # voice = PiperVoice.load("path/to/model.onnx")
        # audio_bytes = voice.synthesize(request.text)

        # For now, return a minimal, silent WAV file as a placeholder.
        silent_wav = (
            b'RIFF$\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00'
            b'\x80>\x00\x00\x00\xfa\x00\x00\x02\x00\x10\x00data\x00\x00\x00\x00'
        )
        audio_stream = io.BytesIO(silent_wav)

        return StreamingResponse(audio_stream, media_type="audio/wav")

    except Exception as e:
        return {"error": str(e)}

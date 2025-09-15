from fastapi import FastAPI, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import whisper
import shutil
import os
import io
import wave
from piper import PiperVoice

app = FastAPI()

# --- Model Loading ---
# In a real app, you would want to handle model paths more robustly,
# perhaps via environment variables.
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')
# The .onnx file is the model, and the .json file is the config.
TTS_MODEL_PATH = os.path.join(MODEL_DIR, 'en_US-lessac-medium.onnx')

# Pre-load the TTS model at startup to avoid delays in request handling.
# This assumes the model file and its corresponding .json config file exist.
tts_voice = None
if os.path.exists(TTS_MODEL_PATH):
    try:
        tts_voice = PiperVoice.load(TTS_MODEL_PATH)
    except Exception as e:
        print(f"Error loading TTS model: {e}")
else:
    print(f"Warning: TTS model not found at {TTS_MODEL_PATH}. The /tts endpoint will not work.")


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
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        model = whisper.load_model("base")
        result = model.transcribe(temp_file_path, fp16=False)
        return {"transcript": result["text"]}
    except Exception as e:
        return {"error": str(e)}
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)


@app.post("/tts")
async def text_to_speech(request: TTSRequest):
    """
    Accepts text and synthesizes it into speech using Piper TTS.
    """
    if tts_voice is None:
        return {"error": "TTS model is not loaded. Please check server configuration and model path."}

    try:
        # Synthesize the audio into an in-memory buffer
        audio_buffer = io.BytesIO()
        with wave.open(audio_buffer, 'wb') as wav_file:
            tts_voice.synthesize_wav(request.text, wav_file)

        # Reset buffer position to the beginning before reading
        audio_buffer.seek(0)

        return StreamingResponse(audio_buffer, media_type="audio/wav")

    except Exception as e:
        print(f"Error during TTS synthesis: {e}")
        return {"error": "Failed to synthesize audio."}

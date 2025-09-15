import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, ANY
import io
import unittest

# Import the FastAPI app instance
from main import app

# Create a client for testing
client = TestClient(app)

@patch('main.whisper.load_model')
def test_transcribe_audio_success(mock_load_model):
    """
    Test the /stt endpoint with a successful transcription.
    """
    # Configure the mock for whisper.load_model
    mock_model = MagicMock()
    mock_model.transcribe.return_value = {"text": "This is a test transcript."}
    mock_load_model.return_value = mock_model

    # Create a dummy audio file in memory
    dummy_audio_content = b"dummy audio data"
    dummy_audio_file = io.BytesIO(dummy_audio_content)

    # The 'files' parameter should be a tuple: (filename, file-like-object, content-type)
    files = {'file': ('test_audio.mp3', dummy_audio_file, 'audio/mpeg')}

    # Make the POST request to the /stt endpoint
    response = client.post("/stt", files=files)

    # Assert the response
    assert response.status_code == 200
    assert response.json() == {"transcript": "This is a test transcript."}

    # Verify that the mock was called
    mock_load_model.assert_called_once_with("base")
    mock_model.transcribe.assert_called_once()

def test_health_check():
    """
    Test the /health endpoint.
    """
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

@patch('main.PiperVoice.load')
def test_text_to_speech_success(mock_load_voice):
    """
    Test the /tts endpoint with a successful synthesis, mocking the PiperVoice.
    """
    # This test assumes the model is loaded successfully and mocks the behavior.
    mock_voice = MagicMock()

    # The synthesize_wav method writes to a file-like object.
    # We create a side effect function to simulate this behavior.
    def mock_synthesize(text, wav_file):
        wav_file.write(b"dummy_wave_data")

    mock_voice.synthesize_wav.side_effect = mock_synthesize

    # Since tts_voice is loaded at startup, we need to patch it within the 'main' module
    # for the duration of this test.
    with patch('main.tts_voice', mock_voice):
        request_data = {"text": "Hello, world!"}
        response = client.post("/tts", json=request_data)

        assert response.status_code == 200
        assert response.headers['content-type'] == 'audio/wav'
        assert response.content == b"dummy_wave_data"
        mock_voice.synthesize_wav.assert_called_once_with("Hello, world!", unittest.mock.ANY)

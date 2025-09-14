const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const upload = require('../middlewares/upload');

const router = express.Router();

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

/**
 * @route   POST /api/audio/transcribe
 * @desc    Transcribes audio by forwarding it to the Python STT service.
 * @access  Public
 */
router.post('/transcribe', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  try {
    const formData = new FormData();
    // The Python service expects a file named 'file'
    formData.append('file', req.file.buffer, { filename: req.file.originalname });

    const response = await axios.post(`${PYTHON_SERVICE_URL}/stt`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error calling Python STT service:', error.message);
    res.status(500).json({ error: 'Failed to transcribe audio.' });
  }
});

/**
 * @route   POST /api/audio/synthesize
 * @desc    Synthesizes text to speech by calling the Python TTS service.
 * @access  Public
 */
router.post('/synthesize', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required.' });
  }

  try {
    const response = await axios.post(
      `${PYTHON_SERVICE_URL}/tts`,
      { text },
      { responseType: 'stream' }
    );

    // Set the content type to audio/wav and pipe the stream
    res.setHeader('Content-Type', 'audio/wav');
    response.data.pipe(res);
  } catch (error) {
    console.error('Error calling Python TTS service:', error.message);
    res.status(500).json({ error: 'Failed to synthesize speech.' });
  }
});


// --- Placeholder routes from initial setup ---

// GET /api/audio/:fileId
router.get('/:fileId', (req, res) => {
    res.status(501).json({ message: `GET /api/audio/${req.params.fileId} not implemented yet.` });
});

// DELETE /api/audio/:fileId
router.delete('/:fileId', (req, res) => {
    res.status(501).json({ message: `DELETE /api/audio/${req.params.fileId} not implemented yet.` });
});

module.exports = router;

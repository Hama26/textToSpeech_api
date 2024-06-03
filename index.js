import * as PlayHT from 'playht';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; // Import the cors package
import EventEmitter from 'events';
dotenv.config();

// Initialize PlayHT SDK
try {
  PlayHT.init({
    apiKey: 'e4174ce7bf3d402b8a1167bc3ec685b3',
    userId: 'NNFIOBvodtOlJFi10TSOSS75Hsm1',
  });
} catch (error) {
  console.log('Failed to initialise PlayHT SDK', error.message);
}

// Set the global maximum number of listeners
EventEmitter.defaultMaxListeners = 100;

const app = express();

// Use CORS middleware
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Endpoint to convert text to audio stream
app.post('/api/generate-speech', async (req, res) => {
  try {
    const { text, voice } = req.body;

    if (!text || typeof text !== 'string') {
      res.status(400).send('Text not provided in the request');
      return;
    }

    res.setHeader('Content-Type', 'audio/mpeg');

    // Measure TTFB for PlayHT API
    const playHTStartTime = Date.now();
    let playHTTTFBMeasured = false;  // A flag to ensure we measure TTFB only once
    const stream = await PlayHT.stream(text, { voiceId: voice });

    // Set the TTFB values as response headers
    stream.once('data', () => {
      if (!playHTTTFBMeasured) {
        const playHTTTFB = Date.now() - playHTStartTime;
        playHTTTFBMeasured = true;
        console.log(`PlayHT TTFB: ${playHTTTFB}ms`);
        res.setHeader('X-PlayHT-TTFB', playHTTTFB);
      }
    });

    // Pipe response audio stream to browser
    stream.pipe(res);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

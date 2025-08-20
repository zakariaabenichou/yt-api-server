const express = require('express');
const cors = require('cors');
const ytdlp = require('yt-dlp-exec');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5001;

// Path to cookies.txt (must be in your repo, included in deploy)
const COOKIES_PATH = path.join(__dirname, 'cookies.txt');

// Check if cookies.txt exists
if (!fs.existsSync(COOKIES_PATH)) {
    console.error("❌ cookies.txt not found at", COOKIES_PATH);
} else {
    console.log("✅ cookies.txt found at", COOKIES_PATH);
}

app.use(cors());
app.use(express.json());

app.post('/api/convert', async (req, res) => {
    const { url, format } = req.body;

    if (!url || !format) {
        console.warn("⚠️ Missing url or format in request body:", req.body);
        return res.status(400).json({ error: 'Missing url or format' });
    }

    try {
        const ext = format === 'mp3' ? 'mp3' : 'mp4';
        res.setHeader('Content-Disposition', `attachment; filename="download.${ext}"`);
        res.setHeader('Content-Type', format === 'mp3' ? 'audio/mpeg' : 'video/mp4');

        console.log("▶️ Starting yt-dlp:", { url, format, ext, cookies: COOKIES_PATH });

        const stream = ytdlp.exec(url, {
            output: '-',
            noCheckCertificates: true,
            noWarnings: true,
            preferFfmpeg: true,
            ffmpegLocation: ffmpegPath,
            cookies: COOKIES_PATH,
            ...(format === 'mp3'
                ? { extractAudio: true, audioFormat: 'mp3', audioQuality: 0 }
                : { format: 'mp4' })
        });

        // Pipe yt-dlp output to client
        stream.stdout.pipe(res);

        // Debug stderr
        stream.stderr.on("data", data => {
            console.error("yt-dlp stderr:", data.toString());
        });

        stream.on("error", err => {
            console.error("yt-dlp process error:", err);
        });

        // Handle exit
        stream.on("close", code => {
            console.log("yt-dlp exited with code:", code);
            if (code !== 0 && !res.headersSent) {
                res.status(500).json({ error: "Download failed" });
            }
        });

    } catch (err) {
        console.error("❌ Exception in /api/convert:", err);
        if (!res.headersSent) {
            res.status(500).json({ error: err.message });
        }
    }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

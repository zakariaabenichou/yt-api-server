const express = require('express');
const cors = require('cors');
const ytdlp = require('yt-dlp-exec');
const ffmpegPath = require('ffmpeg-static');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.post('/api/convert', async (req, res) => {
    const { url, format } = req.body;
    if (!url || !format) return res.status(400).json({ error: 'Missing url or format' });

    try {
        const ext = format === 'mp3' ? 'mp3' : 'mp4';
        res.setHeader('Content-Disposition', `attachment; filename="download.${ext}"`);
        res.setHeader('Content-Type', format === 'mp3' ? 'audio/mpeg' : 'video/mp4');

        const stream = ytdlp.exec(url, {
            output: '-',
            noCheckCertificates: true,
            noWarnings: true,
            preferFfmpeg: true,
            ffmpegLocation: ffmpegPath,
            cookies: 'cookies.txt',
            ...(format === 'mp3' ? { extractAudio: true, audioFormat: 'mp3', audioQuality: 0 } : { format: 'mp4' })
        });

        stream.stdout.pipe(res);

        stream.stderr.on("data", data => console.error("yt-dlp error:", data.toString()));

        stream.on("close", code => {
            if (code !== 0 && !res.headersSent) res.status(500).json({ error: "Download failed" });
        });

    } catch (err) {
        console.error(err);
        if (!res.headersSent) res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

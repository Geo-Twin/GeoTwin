/**
 * Simple CORS proxy server for GeoTIFF downloads
 * Run this alongside your development server to handle CORS issues
 * 
 * Usage:
 * node proxy-server.js
 * 
 * Then update GeoTIFFProxy.ts to use: http://localhost:3001/proxy?url=...
 */

const express = require('express');
const cors = require('cors');
// Node 18+ has built-in fetch, no need for node-fetch
// const fetch = require('node-fetch'); // Removed - using built-in fetch

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080'],
    credentials: false
}));

// Proxy endpoint for GeoTIFF downloads
app.get('/proxy', async (req, res) => {
    const { url } = req.query;
    
    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }

    console.log(`🔄 Proxy: Downloading ${url}`);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'GeoTwin-Proxy/1.0',
                'Accept': 'application/octet-stream, */*'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const buffer = await response.buffer();
        
        console.log(`✅ Proxy: Downloaded ${buffer.length} bytes`);

        // Set appropriate headers
        res.set({
            'Content-Type': 'application/octet-stream',
            'Content-Length': buffer.length,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type'
        });

        res.send(buffer);

    } catch (error) {
        console.error(`❌ Proxy error:`, error);
        res.status(500).json({ 
            error: 'Failed to fetch resource',
            message: error.message,
            url: url
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🌊 GeoTwin CORS Proxy running on http://localhost:${PORT}`);
    console.log(`📡 Proxy endpoint: http://localhost:${PORT}/proxy?url=<URL>`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;

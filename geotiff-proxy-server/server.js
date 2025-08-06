/**
 * Proper GeoTIFF Proxy Server for FastFlood Integration
 * This is a production-ready solution that runs on your backend
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// Use dynamic import for node-fetch (ES module)
let fetch;
(async () => {
    const nodeFetch = await import('node-fetch');
    fetch = nodeFetch.default;
})();

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for your frontend
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:5173', 
        'http://localhost:8080',
        'https://your-geotwin-domain.com' // Add your production domain
    ],
    credentials: false
}));

// Middleware for JSON parsing
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'GeoTwin FastFlood Proxy'
    });
});

// Main proxy endpoint for GeoTIFF downloads
app.get('/api/geotiff-proxy', async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({
            error: 'Missing URL parameter',
            usage: '/api/geotiff-proxy?url=<GEOTIFF_URL>'
        });
    }

    // Validate URL is from FastFlood Azure storage
    if (!url.includes('storageprodfastflood.blob.core.windows.net')) {
        return res.status(400).json({
            error: 'Invalid URL - only FastFlood Azure storage URLs allowed',
            provided: url
        });
    }

    console.log(`🔄 Proxy: Downloading GeoTIFF from ${url}`);

    try {
        // Ensure fetch is loaded
        if (!fetch) {
            throw new Error('Fetch module not loaded yet');
        }

        // Download the GeoTIFF file
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'GeoTwin-FastFlood-Proxy/1.0',
                'Accept': 'application/octet-stream, */*'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const buffer = await response.buffer();
        
        // Validate it's a TIFF file
        if (!isValidTIFF(buffer)) {
            throw new Error('Downloaded file is not a valid TIFF');
        }

        console.log(`✅ Proxy: Successfully downloaded ${buffer.length} bytes`);

        // Set proper headers for binary data
        res.set({
            'Content-Type': 'application/octet-stream',
            'Content-Length': buffer.length,
            'Content-Disposition': 'attachment; filename="flood-data.tif"',
            'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type'
        });

        // Send the binary data
        res.send(buffer);

    } catch (error) {
        console.error(`❌ Proxy error:`, error);
        
        res.status(500).json({ 
            error: 'Failed to download GeoTIFF',
            message: error.message,
            url: url,
            timestamp: new Date().toISOString()
        });
    }
});

// FastFlood API proxy (if needed)
app.post('/api/fastflood-proxy', async (req, res) => {
    const FASTFLOOD_API_URL = 'https://webapp-prod-fastflood.azurewebsites.net/v1/model/run-and-wait';
    const API_KEY = 'Xx1BfVGbNP76RwYlmQtR8os4halVCpxH';

    try {
        // Ensure fetch is loaded
        if (!fetch) {
            throw new Error('Fetch module not loaded yet');
        }

        const response = await fetch(FASTFLOOD_API_URL, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Cache-Control': 'max-age=86400',
                'api-key': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('FastFlood API proxy error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Utility function to validate TIFF files
function isValidTIFF(buffer) {
    if (!buffer || buffer.length < 4) {
        return false;
    }

    // Check TIFF magic numbers
    const magic = buffer.readUInt16BE(0);
    return magic === 0x4949 || magic === 0x4D4D; // II or MM
}

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🌊 GeoTwin FastFlood Proxy Server running on port ${PORT}`);
    console.log(`📡 GeoTIFF Proxy: http://localhost:${PORT}/api/geotiff-proxy?url=<URL>`);
    console.log(`🚀 FastFlood Proxy: http://localhost:${PORT}/api/fastflood-proxy`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
});

module.exports = app;

/**
 * GeoTIFF Processor - Downloads and processes FastFlood GeoTIFF files
 * Converts them to JSON format for frontend consumption
 */

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { fromArrayBuffer } = require('geotiff');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Process GeoTIFF and return flood data as JSON
app.post('/api/process-geotiff', async (req, res) => {
    const { geotiffUrl, bbox } = req.body;
    
    if (!geotiffUrl) {
        return res.status(400).json({ error: 'Missing geotiffUrl parameter' });
    }

    console.log(`🔄 Processing GeoTIFF: ${geotiffUrl}`);

    try {
        // Download GeoTIFF
        const response = await fetch(geotiffUrl);
        if (!response.ok) {
            throw new Error(`Failed to download: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        console.log(`📥 Downloaded ${arrayBuffer.byteLength} bytes`);

        // Parse GeoTIFF
        const tiff = await fromArrayBuffer(arrayBuffer);
        const image = await tiff.getImage();
        
        // Get raster data
        const rasters = await image.readRasters();
        const waterHeights = rasters[0]; // First band is water height
        
        // Get image metadata
        const width = image.getWidth();
        const height = image.getHeight();
        const bbox_geotiff = image.getBoundingBox();
        
        console.log(`📊 GeoTIFF: ${width}x${height}, bbox: [${bbox_geotiff.join(', ')}]`);

        // Convert to flood polygons
        const floodPolygons = processWaterHeights(waterHeights, width, height, bbox_geotiff);
        
        console.log(`✅ Generated ${floodPolygons.length} flood polygons`);

        res.json({
            success: true,
            metadata: {
                width,
                height,
                bbox: bbox_geotiff,
                minWaterHeight: Math.min(...waterHeights),
                maxWaterHeight: Math.max(...waterHeights)
            },
            floodPolygons
        });

    } catch (error) {
        console.error(`❌ Processing error:`, error);
        res.status(500).json({ 
            error: 'Failed to process GeoTIFF',
            message: error.message 
        });
    }
});

function processWaterHeights(waterHeights, width, height, bbox) {
    const [minX, minY, maxX, maxY] = bbox;
    const cellWidth = (maxX - minX) / width;
    const cellHeight = (maxY - minY) / height;
    
    const floodPolygons = [];
    const minWaterHeight = 0.1; // Minimum water height to consider (10cm)
    
    // Process in chunks to create flood polygons
    for (let y = 0; y < height - 1; y += 10) {
        for (let x = 0; x < width - 1; x += 10) {
            const chunkWaterHeights = [];
            let hasFlood = false;
            
            // Check 10x10 chunk
            for (let dy = 0; dy < 10 && y + dy < height; dy++) {
                for (let dx = 0; dx < 10 && x + dx < width; dx++) {
                    const idx = (y + dy) * width + (x + dx);
                    const waterHeight = waterHeights[idx];
                    
                    if (waterHeight > minWaterHeight) {
                        hasFlood = true;
                    }
                    chunkWaterHeights.push(waterHeight);
                }
            }
            
            if (hasFlood) {
                // Create polygon for this chunk
                const chunkMinX = minX + x * cellWidth;
                const chunkMaxX = minX + (x + 10) * cellWidth;
                const chunkMinY = maxY - (y + 10) * cellHeight; // GeoTIFF Y is flipped
                const chunkMaxY = maxY - y * cellHeight;
                
                const avgWaterHeight = chunkWaterHeights.reduce((a, b) => a + b, 0) / chunkWaterHeights.length;
                
                floodPolygons.push({
                    bbox: [chunkMinX, chunkMinY, chunkMaxX, chunkMaxY],
                    waterHeight: avgWaterHeight,
                    vertices: createRectangleVertices(chunkMinX, chunkMinY, chunkMaxX, chunkMaxY)
                });
            }
        }
    }
    
    return floodPolygons;
}

function createRectangleVertices(minX, minY, maxX, maxY) {
    return [
        // Triangle 1
        minX, 0, minY,  // Bottom-left
        maxX, 0, minY,  // Bottom-right
        minX, 0, maxY,  // Top-left
        
        // Triangle 2
        maxX, 0, minY,  // Bottom-right
        maxX, 0, maxY,  // Top-right
        minX, 0, maxY   // Top-left
    ];
}

app.listen(PORT, () => {
    console.log(`🌊 GeoTIFF Processor running on port ${PORT}`);
    console.log(`📊 Process endpoint: http://localhost:${PORT}/api/process-geotiff`);
});

module.exports = app;

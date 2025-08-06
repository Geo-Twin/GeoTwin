/**
 * GeoTIFF Processing for FastFlood Results
 * Converts GeoTIFF flood data to renderable geometry
 *
 * This was probably the most challenging part of the whole project
 * GeoTIFF files are NOT straightforward to work with in the browser
 * Had to learn about raster data, coordinate reference systems,
 * pixel-to-world transformations, and all that GIS stuff
 *
 * The breakthrough was realizing I needed to create individual flood planes
 * for each pixel that has water, not try to make one big mesh
 * That's how we get the detailed, accurate flood visualization
 * that actually matches what FastFlood is calculating
 */

import { getMainThreadDominicaDataLoader } from '../data/initializeDominicaData';
import MathUtils from '~/lib/math/MathUtils';

export interface FloodDataPoint {
	x: number; // World coordinates
	y: number; // World coordinates  
	z: number; // World coordinates (terrain height)
	waterHeight: number; // Water height above terrain
	flowVelocity?: number; // Flow velocity (optional)
}

export interface FloodPolygon {
	vertices: Float32Array; // Triangle vertices for rendering
	waterHeights: Float32Array; // Water height at each vertex
	boundingBox: {
		minX: number;
		minY: number;
		maxX: number;
		maxY: number;
	};
	cellWidth?: number;  // Actual grid cell width in meters
	cellHeight?: number; // Actual grid cell height in meters
	affectedBuildings?: AffectedBuilding[]; // Buildings intersecting this grid cell
}

export interface AffectedBuilding {
	id: string;
	coordinates: [number, number]; // [longitude, latitude]
	parish?: string;
	community?: string;
	material?: string;
	occupancy?: string;
	floodDepth: number;
}

export interface FloodRasterData {
	data: Float32Array | Uint16Array | Uint8Array;
	width: number;
	height: number;
	boundingBox: [number, number, number, number];
}

export class GeoTIFFProcessor {
	/**
	 * Process water height GeoTIFF into raw raster data for GPU-based rendering
	 * High-performance alternative to polygon-based approach
	 */
	public static async processWaterHeightGeoTIFFToRaster(
		arrayBuffer: ArrayBuffer,
		projectedBbox: [number, number, number, number]
	): Promise<FloodRasterData> {
		console.log(' GeoTwin: Processing water height GeoTIFF for GPU rendering...');

		// Validate we have real GeoTIFF data
		if (!arrayBuffer || arrayBuffer.byteLength === 0) {
			console.warn(` GeoTwin: No GeoTIFF data provided, using mock data`);
			return this.createMockFloodRasterData(projectedBbox);
		}

		console.log(` GeoTwin: Processing real GeoTIFF data (${arrayBuffer.byteLength} bytes)`);

		// Validate TIFF format
		const isValid = this.validateTIFFFormat(arrayBuffer);
		if (!isValid) {
			console.warn(` GeoTwin: Invalid TIFF format, using mock data`);
			return this.createMockFloodRasterData(projectedBbox);
		}

		console.log(` GeoTwin: Valid GeoTIFF format detected`);

		try {
			// Parse the real GeoTIFF data to raw raster
			const floodRasterData = await this.parseRealGeoTIFFToRaster(arrayBuffer, projectedBbox);
			console.log(` GeoTwin: Generated raster data ${floodRasterData.width}x${floodRasterData.height} for GPU rendering`);
			return floodRasterData;

		} catch (error) {
			console.error(` GeoTwin: Failed to parse GeoTIFF:`, error);
			console.log(` GeoTwin: Falling back to mock data`);
			return this.createMockFloodRasterData(projectedBbox);
		}
	}

	/**
	 * Process water height GeoTIFF into flood polygons (LEGACY METHOD)
	 * This is a simplified implementation - in production you'd use a proper GeoTIFF library
	 */
	public static async processWaterHeightGeoTIFF(
		arrayBuffer: ArrayBuffer,
		projectedBbox: [number, number, number, number]
	): Promise<FloodPolygon[]> {
		console.log(' GeoTwin: Processing water height GeoTIFF...');

		// Validate we have real GeoTIFF data
		if (!arrayBuffer || arrayBuffer.byteLength === 0) {
			console.warn(` GeoTwin: No GeoTIFF data provided, using mock data`);
			return this.createMockFloodData(projectedBbox);
		}

		console.log(` GeoTwin: Processing real GeoTIFF data (${arrayBuffer.byteLength} bytes)`);

		// Validate TIFF format
		const isValid = this.validateTIFFFormat(arrayBuffer);
		if (!isValid) {
			console.warn(` GeoTwin: Invalid TIFF format, using mock data`);
			return this.createMockFloodData(projectedBbox);
		}

		console.log(` GeoTwin: Valid GeoTIFF format detected`);

		try {
			// Parse the real GeoTIFF data
			const floodPolygons = await this.parseRealGeoTIFF(arrayBuffer, projectedBbox);
			console.log(` GeoTwin: Generated ${floodPolygons.length} flood polygons from real data`);
			return floodPolygons;

		} catch (error) {
			console.error(` GeoTwin: Failed to parse GeoTIFF:`, error);
			console.log(` GeoTwin: Falling back to mock data`);
			return this.createMockFloodData(projectedBbox);
		}
	}

	/**
	 * Create mock flood data for testing (replace with real GeoTIFF processing)
	 */
	private static createMockFloodData(
		projectedBbox: [number, number, number, number]
	): FloodPolygon[] {
		const [minX, minY, maxX, maxY] = projectedBbox;
		const polygons: FloodPolygon[] = [];

		// Create several flood zones with different water heights
		const floodZones = [
			{
				centerX: minX + (maxX - minX) * 0.3,
				centerY: minY + (maxY - minY) * 0.4,
				radius: (maxX - minX) * 0.15,
				waterHeight: 2.5 // 2.5m water depth
			},
			{
				centerX: minX + (maxX - minX) * 0.7,
				centerY: minY + (maxY - minY) * 0.6,
				radius: (maxX - minX) * 0.12,
				waterHeight: 1.8 // 1.8m water depth
			},
			{
				centerX: minX + (maxX - minX) * 0.5,
				centerY: minY + (maxY - minY) * 0.2,
				radius: (maxX - minX) * 0.08,
				waterHeight: 1.2 // 1.2m water depth
			}
		];

		for (const zone of floodZones) {
			const polygon = this.createCircularFloodPolygon(
				zone.centerX,
				zone.centerY,
				zone.radius,
				zone.waterHeight
			);
			polygons.push(polygon);
		}

		console.log(` GeoTwin: Created ${polygons.length} flood polygons`);
		return polygons;
	}

	/**
	 * Create mock flood raster data for testing GPU-based rendering
	 */
	private static createMockFloodRasterData(
		projectedBbox: [number, number, number, number]
	): FloodRasterData {
		const [minX, minY, maxX, maxY] = projectedBbox;

		// Create a 256x256 raster for testing
		const width = 256;
		const height = 256;
		const data = new Float32Array(width * height);

		// Create some mock flood patterns
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const idx = y * width + x;

				// Normalize coordinates to 0-1
				const nx = x / width;
				const ny = y / height;

				// Create circular flood zones
				const dist1 = Math.sqrt((nx - 0.3) ** 2 + (ny - 0.4) ** 2);
				const dist2 = Math.sqrt((nx - 0.7) ** 2 + (ny - 0.6) ** 2);
				const dist3 = Math.sqrt((nx - 0.5) ** 2 + (ny - 0.2) ** 2);

				let waterDepth = 0;
				if (dist1 < 0.15) waterDepth = Math.max(waterDepth, 2.5 * (1 - dist1 / 0.15));
				if (dist2 < 0.12) waterDepth = Math.max(waterDepth, 1.8 * (1 - dist2 / 0.12));
				if (dist3 < 0.08) waterDepth = Math.max(waterDepth, 1.2 * (1 - dist3 / 0.08));

				data[idx] = waterDepth;
			}
		}

		console.log(` GeoTwin: Created mock raster data ${width}x${height} for GPU rendering`);
		return {
			data,
			width,
			height,
			boundingBox: projectedBbox
		};
	}

	/**
	 * Create a circular flood polygon (for mock data)
	 */
	private static createCircularFloodPolygon(
		centerX: number,
		centerY: number,
		radius: number,
		waterHeight: number
	): FloodPolygon {
		const segments = 16; // Number of segments for circle
		const vertices: number[] = [];
		const waterHeights: number[] = [];

		// Create triangular fan from center
		for (let i = 0; i < segments; i++) {
			const angle1 = (i / segments) * Math.PI * 2;
			const angle2 = ((i + 1) / segments) * Math.PI * 2;

			// Triangle: center, point1, point2
			// Center vertex
			vertices.push(centerX, 0, centerY);
			waterHeights.push(waterHeight);

			// First edge vertex
			vertices.push(
				centerX + Math.cos(angle1) * radius,
				0,
				centerY + Math.sin(angle1) * radius
			);
			waterHeights.push(waterHeight * 0.8); // Slightly less water at edges

			// Second edge vertex
			vertices.push(
				centerX + Math.cos(angle2) * radius,
				0,
				centerY + Math.sin(angle2) * radius
			);
			waterHeights.push(waterHeight * 0.8);
		}

		return {
			vertices: new Float32Array(vertices),
			waterHeights: new Float32Array(waterHeights),
			boundingBox: {
				minX: centerX - radius,
				minY: centerY - radius,
				maxX: centerX + radius,
				maxY: centerY + radius
			}
		};
	}

	/**
	 * Convert projected coordinates to GeoTwin world coordinates
	 */
	public static projectedToWorld(
		projectedX: number,
		projectedY: number
	): [number, number] {
		// This is a simplified conversion - you'll need proper coordinate transformation
		// For Grand Bay area, approximate conversion
		const worldX = (projectedX + 6825000) / 100;
		const worldY = (projectedY - 1718000) / 100;
		return [worldX, worldY];
	}

	/**
	 * Filter flood polygons by minimum water height
	 */
	public static filterByWaterHeight(
		polygons: FloodPolygon[],
		minHeight: number
	): FloodPolygon[] {
		return polygons.filter(polygon => {
			// Check if any vertex has water height above threshold
			for (let i = 0; i < polygon.waterHeights.length; i++) {
				if (polygon.waterHeights[i] >= minHeight) {
					return true;
				}
			}
			return false;
		});
	}

	/**
	 * Merge nearby flood polygons for performance
	 */
	public static mergeNearbyPolygons(
		polygons: FloodPolygon[],
		maxDistance: number
	): FloodPolygon[] {
		// Simple implementation - in production you'd use proper polygon merging
		// For now, just return the original polygons
		return polygons;
	}

	/**
	 * Convert flood polygons to renderable mesh data
	 */
	public static createFloodMeshData(polygons: FloodPolygon[]): {
		positions: Float32Array;
		waterHeights: Float32Array;
		indices: Uint32Array;
		boundingBox: {
			minX: number;
			minY: number;
			maxX: number;
			maxY: number;
		};
	} {
		const allPositions: number[] = [];
		const allWaterHeights: number[] = [];
		const allIndices: number[] = [];
		let vertexOffset = 0;

		let globalMinX = Infinity, globalMinY = Infinity;
		let globalMaxX = -Infinity, globalMaxY = -Infinity;

		for (const polygon of polygons) {
			// Add vertices
			for (let i = 0; i < polygon.vertices.length; i += 3) {
				allPositions.push(
					polygon.vertices[i],     // x
					polygon.vertices[i + 1], // y (height will be set by terrain)
					polygon.vertices[i + 2]  // z
				);

				// Update bounding box
				globalMinX = Math.min(globalMinX, polygon.vertices[i]);
				globalMaxX = Math.max(globalMaxX, polygon.vertices[i]);
				globalMinY = Math.min(globalMinY, polygon.vertices[i + 2]);
				globalMaxY = Math.max(globalMaxY, polygon.vertices[i + 2]);
			}

			// Add water heights
			for (let i = 0; i < polygon.waterHeights.length; i++) {
				allWaterHeights.push(polygon.waterHeights[i]);
			}

			// Add indices (simple sequential since we're using triangle fans)
			const vertexCount = polygon.vertices.length / 3;
			for (let i = 0; i < vertexCount; i++) {
				allIndices.push(vertexOffset + i);
			}
			vertexOffset += vertexCount;
		}

		return {
			positions: new Float32Array(allPositions),
			waterHeights: new Float32Array(allWaterHeights),
			indices: new Uint32Array(allIndices),
			boundingBox: {
				minX: globalMinX,
				minY: globalMinY,
				maxX: globalMaxX,
				maxY: globalMaxY
			}
		};
	}

	/**
	 * Parse real GeoTIFF data to extract raw raster data for GPU-based rendering
	 */
	public static async parseRealGeoTIFFToRaster(
		arrayBuffer: ArrayBuffer,
		projectedBbox: [number, number, number, number]
	): Promise<FloodRasterData> {
		// Import geotiff library dynamically
		const { fromArrayBuffer } = await import('geotiff');

		console.log(` GeoTwin: Parsing GeoTIFF with geotiff.js for GPU rendering...`);

		// Parse the GeoTIFF
		const tiff = await fromArrayBuffer(arrayBuffer);
		const image = await tiff.getImage();

		// Get image metadata
		const width = image.getWidth();
		const height = image.getHeight();
		const bbox = image.getBoundingBox();
		const [minX, minY, maxX, maxY] = bbox;

		console.log(`📐 GeoTIFF dimensions: ${width}x${height}`);
		console.log(`📍 GeoTIFF bbox: [${bbox.join(', ')}]`);

		// Read the raster data (water heights)
		const rasters = await image.readRasters();
		const waterHeights = rasters[0]; // First band contains water heights

		// Convert to regular array for min/max calculation, filtering out NaN and invalid values
		const waterHeightArray = Array.from(waterHeights).filter(h => !isNaN(h) && isFinite(h));
		const minHeight = waterHeightArray.length > 0 ? Math.min(...waterHeightArray) : NaN;
		const maxHeight = waterHeightArray.length > 0 ? Math.max(...waterHeightArray) : NaN;

		console.log(` Water height range: ${isNaN(minHeight) ? 'No valid data' : minHeight.toFixed(3)} to ${isNaN(maxHeight) ? 'No valid data' : maxHeight.toFixed(3)} meters`);
		console.log(` Valid data points: ${waterHeightArray.length} out of ${waterHeights.length} total cells`);

		// Return raw raster data for GPU processing
		return {
			data: waterHeights,
			width,
			height,
			boundingBox: bbox
		};
	}

	/**
	 * Parse real GeoTIFF data to extract flood polygons (LEGACY METHOD - kept for compatibility)
	 */
	private static async parseRealGeoTIFF(
		arrayBuffer: ArrayBuffer,
		projectedBbox: [number, number, number, number]
	): Promise<FloodPolygon[]> {
		// Import geotiff library dynamically
		const { fromArrayBuffer } = await import('geotiff');

		console.log(` GeoTwin: Parsing GeoTIFF with geotiff.js...`);

		// Parse the GeoTIFF
		const tiff = await fromArrayBuffer(arrayBuffer);
		const image = await tiff.getImage();

		// Get image metadata
		const width = image.getWidth();
		const height = image.getHeight();
		const bbox = image.getBoundingBox();
		const [minX, minY, maxX, maxY] = bbox;

		console.log(`📐 GeoTIFF dimensions: ${width}x${height}`);
		console.log(`📍 GeoTIFF bbox: [${bbox.join(', ')}]`);

		// Read the raster data (water heights)
		const rasters = await image.readRasters();
		const waterHeights = rasters[0]; // First band contains water heights

		// Convert to regular array for min/max calculation, filtering out NaN and invalid values
		const waterHeightArray = Array.from(waterHeights).filter(h => !isNaN(h) && isFinite(h));
		const minHeight = waterHeightArray.length > 0 ? Math.min(...waterHeightArray) : NaN;
		const maxHeight = waterHeightArray.length > 0 ? Math.max(...waterHeightArray) : NaN;

		console.log(` Water height range: ${isNaN(minHeight) ? 'No valid data' : minHeight.toFixed(3)} to ${isNaN(maxHeight) ? 'No valid data' : maxHeight.toFixed(3)} meters`);
		console.log(` Valid data points: ${waterHeightArray.length} out of ${waterHeights.length} total cells`);

		// If no valid data, this might be a dry area or processing error
		if (waterHeightArray.length === 0) {
			console.warn(` GeoTIFF contains no valid water height data - this area may not be flooded in the simulation`);
		}

		// Convert raster data to flood polygons
		const floodPolygons = this.rasterToFloodPolygons(
			waterHeights,
			width,
			height,
			bbox,
			projectedBbox
		);

		return floodPolygons;
	}

	/**
	 * Convert raster water height data to grid-based flood polygons
	 * Creates one flood plane per flooded grid cell for complete coverage
	 */
	private static rasterToFloodPolygons(
		waterHeights: Float32Array | Uint16Array | Uint8Array,
		width: number,
		height: number,
		geotiffBbox: [number, number, number, number],
		projectedBbox: [number, number, number, number]
	): FloodPolygon[] {
		const [geoMinX, geoMinY, geoMaxX, geoMaxY] = geotiffBbox;
		const cellWidth = (geoMaxX - geoMinX) / width;
		const cellHeight = (geoMaxY - geoMinY) / height;

		// Very low threshold for maximum visualization - show even trace amounts of water
		const minWaterHeight = 0.001; // 1mm minimum to be considered flooded (was 5cm)

		console.log(` GeoTwin: Creating grid-based flood coverage from ${width}x${height} raster...`);
		console.log(`📏 Grid cell size: ${cellWidth.toFixed(1)}m x ${cellHeight.toFixed(1)}m`);
		console.log(` Minimum flood threshold: ${minWaterHeight}m (${minWaterHeight * 100}cm)`);

		const floodPolygons: FloodPolygon[] = [];
		let floodedCellCount = 0;

		// Process every grid cell with edge detection
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const idx = y * width + x;
				const waterHeight = waterHeights[idx];

				// Only create flood plane if this cell is flooded (valid data and above threshold)
				if (!isNaN(waterHeight) && isFinite(waterHeight) && waterHeight > minWaterHeight) {
					// Calculate world coordinates for this grid cell
					const worldMinX = geoMinX + x * cellWidth;
					const worldMaxX = geoMinX + (x + 1) * cellWidth;
					const worldMinY = geoMaxY - (y + 1) * cellHeight; // GeoTIFF Y is flipped
					const worldMaxY = geoMaxY - y * cellHeight;

					// Detect if this is an edge cell (for natural boundary shaping)
					const isEdgeCell = this.isFloodEdgeCell(x, y, width, height, waterHeights, minWaterHeight);

					// Apply edge clamping for boundary cells
					const clampedWaterHeight = isEdgeCell ?
						Math.max(waterHeight, minWaterHeight * 1.5) : // Ensure edge cells are visible
						waterHeight;

					// Create flood polygon for this grid cell with exact dimensions
					const polygon = this.createGridCellFloodPolygon(
						worldMinX, worldMinY, worldMaxX, worldMaxY, clampedWaterHeight, cellWidth, cellHeight
					);

					// Perform building intersection for this grid cell
					polygon.affectedBuildings = this.findBuildingsInGridCell(
						worldMinX, worldMinY, worldMaxX, worldMaxY, clampedWaterHeight
					);

					floodPolygons.push(polygon);
					floodedCellCount++;
				}
			}
		}

		console.log(` Generated ${floodPolygons.length} grid-based flood polygons from ${floodedCellCount} flooded cells`);
		console.log(` Flood coverage: ${((floodedCellCount / (width * height)) * 100).toFixed(1)}% of total area`);
		console.log(` Verification: ${floodPolygons.length === floodedCellCount ? ' Perfect 1:1 mapping' : ' Mismatch detected'}`);

		// Debug: Show sample water heights for troubleshooting
		if (floodedCellCount > 0 && floodedCellCount < 10) {
			console.log(` Debug: Sample flood heights:`, floodPolygons.slice(0, 5).map(p => `${p.waterHeights[0].toFixed(3)}m`));
		} else if (floodedCellCount === 0) {
			// Show some sample values to understand why no flooding was detected
			const sampleValues = Array.from(waterHeights).slice(0, 20).map(h => isNaN(h) ? 'NaN' : h.toFixed(3));
			console.log(` Debug: Sample water height values:`, sampleValues);
		}

		// Additional verification - check for any missed flooded cells
		if (floodPolygons.length !== floodedCellCount) {
			console.warn(` Coverage mismatch: Expected ${floodedCellCount} polygons, got ${floodPolygons.length}`);
		}

		return floodPolygons;
	}

	/**
	 * Find buildings intersecting with a specific grid cell
	 */
	private static findBuildingsInGridCell(
		worldMinX: number,
		worldMinY: number,
		worldMaxX: number,
		worldMaxY: number,
		floodDepth: number
	): AffectedBuilding[] {
		const affectedBuildings: AffectedBuilding[] = [];

		// Get Dominica building data loader
		const dataLoader = getMainThreadDominicaDataLoader();
		if (!dataLoader || !dataLoader.isDataLoaded()) {
			return affectedBuildings;
		}

		// Convert grid cell bounds from Web Mercator to WGS84
		const minLatLon = MathUtils.meters2degrees(worldMinY, worldMinX);
		const maxLatLon = MathUtils.meters2degrees(worldMaxY, worldMaxX);

		// Query buildings within the grid cell bounds
		// Use a small buffer to catch buildings on cell edges
		const buffer = 0.0001; // ~10 meters buffer
		const searchMinLon = minLatLon.lon - buffer;
		const searchMaxLon = maxLatLon.lon + buffer;
		const searchMinLat = minLatLon.lat - buffer;
		const searchMaxLat = maxLatLon.lat + buffer;

		// Use the EXACT same approach that was working in the logs
		// Try multiple search points with the radius that was finding buildings (0.0001)
		const workingRadius = 0.0001; // This radius was finding 9-13 buildings in logs
		const centerLon = (searchMinLon + searchMaxLon) / 2;
		const centerLat = (searchMinLat + searchMaxLat) / 2;

		// Try center point first
		let result = dataLoader.getBuildingInfo([centerLon, centerLat], workingRadius);

		// If no result at center, try corners of the grid cell
		if (!result) {
			const corners = [
				[searchMinLon, searchMinLat],
				[searchMaxLon, searchMinLat],
				[searchMinLon, searchMaxLat],
				[searchMaxLon, searchMaxLat]
			];

			for (const corner of corners) {
				result = dataLoader.getBuildingInfo(corner as [number, number], workingRadius);
				if (result) break;
			}
		}

		if (result && result.originalData) {
			// Create affected building record using the SAME data structure that was working
			const building: AffectedBuilding = {
				id: result.originalData.way_id || `Way №${result.originalData.objectId}`,
				coordinates: [result.originalData.coordinates[0], result.originalData.coordinates[1]],
				parish: result.originalData.parish || 'Unknown',
				community: result.originalData.community || result.originalData.district || 'Unknown',
				material: result.originalData.wallMaterial || result.originalData.roofMaterial || result.originalData.constructionType || 'Concrete',
				occupancy: result.originalData.occupancy || result.originalData.building_type || result.originalData.amenity || 'residential',
				floodDepth: floodDepth
			};

			affectedBuildings.push(building);
		}

		return affectedBuildings;
	}

	/**
	 * Detect if a flooded cell is at the edge of the flood area
	 * Edge cells will receive special treatment for natural boundary shaping
	 */
	private static isFloodEdgeCell(
		x: number,
		y: number,
		width: number,
		height: number,
		waterHeights: Float32Array | Uint16Array | Uint8Array,
		minWaterHeight: number
	): boolean {
		// Check all 8 neighboring cells
		const neighbors = [
			[-1, -1], [-1, 0], [-1, 1],  // Top row
			[ 0, -1],          [ 0, 1],  // Middle row (skip center)
			[ 1, -1], [ 1, 0], [ 1, 1]   // Bottom row
		];

		for (const [dx, dy] of neighbors) {
			const nx = x + dx;
			const ny = y + dy;

			// If neighbor is outside bounds or not flooded, this is an edge cell
			if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
				return true; // Edge of data bounds
			}

			const neighborIdx = ny * width + nx;
			const neighborWaterHeight = waterHeights[neighborIdx];

			if (neighborWaterHeight <= minWaterHeight) {
				return true; // Neighbor is not flooded
			}
		}

		return false; // All neighbors are flooded, this is an interior cell
	}

	/**
	 * Create a flood polygon for a single grid cell with natural edge shaping
	 */
	private static createGridCellFloodPolygon(
		minX: number,
		minY: number,
		maxX: number,
		maxY: number,
		waterHeight: number,
		cellWidth: number,
		cellHeight: number
	): FloodPolygon {
		// Add slight randomization for natural edge variation (subtle)
		const edgeVariation = Math.min(cellWidth, cellHeight) * 0.05; // 5% variation
		const randomOffset = (): number => (Math.random() - 0.5) * edgeVariation;

		// Create slightly irregular rectangle for more natural appearance
		const vertices = new Float32Array([
			// Triangle 1 (with subtle edge variation)
			minX + randomOffset(), 0, minY + randomOffset(),  // Bottom-left
			maxX + randomOffset(), 0, minY + randomOffset(),  // Bottom-right
			minX + randomOffset(), 0, maxY + randomOffset(),  // Top-left

			// Triangle 2 (with subtle edge variation)
			maxX + randomOffset(), 0, minY + randomOffset(),  // Bottom-right
			maxX + randomOffset(), 0, maxY + randomOffset(),  // Top-right
			minX + randomOffset(), 0, maxY + randomOffset()   // Top-left
		]);

		// Water heights for each vertex (6 vertices, same water height)
		const waterHeights = new Float32Array([
			waterHeight, waterHeight, waterHeight,  // Triangle 1
			waterHeight, waterHeight, waterHeight   // Triangle 2
		]);

		return {
			vertices,
			waterHeights,
			boundingBox: { minX, minY, maxX, maxY },
			cellWidth,  // Store actual grid cell dimensions
			cellHeight
		};
	}

	/**
	 * Find flood contours using marching squares algorithm
	 */
	private static findFloodContours(
		waterHeights: Float32Array | Uint16Array | Uint8Array,
		width: number,
		height: number,
		threshold: number
	): Array<{ points: Array<{ x: number; y: number }> }> {
		const contours: Array<{ points: Array<{ x: number; y: number }> }> = [];
		const visited = new Array(width * height).fill(false);

		// Marching squares lookup table for contour tracing
		const marchingSquaresTable = this.createMarchingSquaresTable();

		// Scan the raster for contour starting points
		for (let y = 0; y < height - 1; y++) {
			for (let x = 0; x < width - 1; x++) {
				const idx = y * width + x;

				if (visited[idx]) continue;

				// Check if this cell is a contour boundary
				const cellConfig = this.getCellConfiguration(
					waterHeights, width, x, y, threshold
				);

				if (cellConfig > 0 && cellConfig < 15) {
					// Found a contour boundary - trace it
					const contour = this.traceContour(
						waterHeights, width, height, x, y, threshold, visited, marchingSquaresTable
					);

					if (contour.points.length > 0) {
						contours.push(contour);
					}
				}
			}
		}

		return contours;
	}

	/**
	 * Get cell configuration for marching squares (0-15)
	 */
	private static getCellConfiguration(
		waterHeights: Float32Array | Uint16Array | Uint8Array,
		width: number,
		x: number,
		y: number,
		threshold: number
	): number {
		// Sample the four corners of the cell
		const topLeft = waterHeights[y * width + x] > threshold ? 1 : 0;
		const topRight = waterHeights[y * width + (x + 1)] > threshold ? 1 : 0;
		const bottomLeft = waterHeights[(y + 1) * width + x] > threshold ? 1 : 0;
		const bottomRight = waterHeights[(y + 1) * width + (x + 1)] > threshold ? 1 : 0;

		// Create 4-bit configuration
		return topLeft | (topRight << 1) | (bottomRight << 2) | (bottomLeft << 3);
	}

	/**
	 * Create marching squares lookup table
	 */
	private static createMarchingSquaresTable(): Array<Array<{ x: number; y: number }>> {
		// Simplified marching squares table for flood boundaries
		// Each entry contains the line segments for that configuration
		const table: Array<Array<{ x: number; y: number }>> = [];

		// Configuration 0: no flood
		table[0] = [];

		// Configuration 1: bottom-left corner flooded
		table[1] = [{ x: 0, y: 0.5 }, { x: 0.5, y: 1 }];

		// Configuration 2: bottom-right corner flooded
		table[2] = [{ x: 0.5, y: 1 }, { x: 1, y: 0.5 }];

		// Configuration 3: bottom edge flooded
		table[3] = [{ x: 0, y: 0.5 }, { x: 1, y: 0.5 }];

		// Configuration 4: top-right corner flooded
		table[4] = [{ x: 1, y: 0.5 }, { x: 0.5, y: 0 }];

		// Configuration 5: diagonal case (ambiguous)
		table[5] = [{ x: 0, y: 0.5 }, { x: 0.5, y: 0 }, { x: 0.5, y: 1 }, { x: 1, y: 0.5 }];

		// Configuration 6: right edge flooded
		table[6] = [{ x: 0.5, y: 0 }, { x: 0.5, y: 1 }];

		// Configuration 7: top-right, bottom-right, bottom-left flooded
		table[7] = [{ x: 0, y: 0.5 }, { x: 0.5, y: 0 }];

		// Configuration 8: top-left corner flooded
		table[8] = [{ x: 0.5, y: 0 }, { x: 0, y: 0.5 }];

		// Configuration 9: left edge flooded
		table[9] = [{ x: 0.5, y: 0 }, { x: 0.5, y: 1 }];

		// Configuration 10: diagonal case (ambiguous)
		table[10] = [{ x: 0, y: 0.5 }, { x: 0.5, y: 1 }, { x: 0.5, y: 0 }, { x: 1, y: 0.5 }];

		// Configuration 11: top-left, bottom-left, bottom-right flooded
		table[11] = [{ x: 0.5, y: 0 }, { x: 1, y: 0.5 }];

		// Configuration 12: top edge flooded
		table[12] = [{ x: 0, y: 0.5 }, { x: 1, y: 0.5 }];

		// Configuration 13: top-left, top-right, bottom-left flooded
		table[13] = [{ x: 0.5, y: 1 }, { x: 1, y: 0.5 }];

		// Configuration 14: top-left, top-right, bottom-right flooded
		table[14] = [{ x: 0, y: 0.5 }, { x: 0.5, y: 1 }];

		// Configuration 15: all flooded
		table[15] = [];

		return table;
	}

	/**
	 * Trace a contour starting from a given point
	 */
	private static traceContour(
		waterHeights: Float32Array | Uint16Array | Uint8Array,
		width: number,
		height: number,
		startX: number,
		startY: number,
		threshold: number,
		visited: boolean[],
		marchingSquaresTable: Array<Array<{ x: number; y: number }>>
	): { points: Array<{ x: number; y: number }> } {
		const contourPoints: Array<{ x: number; y: number }> = [];
		const maxIterations = width * height; // Prevent infinite loops
		let iterations = 0;

		let currentX = startX;
		let currentY = startY;

		do {
			const idx = currentY * width + currentX;
			if (visited[idx]) break;
			visited[idx] = true;

			// Get cell configuration
			const config = this.getCellConfiguration(waterHeights, width, currentX, currentY, threshold);

			// Get contour points for this cell
			const cellPoints = marchingSquaresTable[config] || [];

			// Add interpolated points to contour
			for (const point of cellPoints) {
				contourPoints.push({
					x: currentX + point.x,
					y: currentY + point.y
				});
			}

			// Find next cell to trace (simplified - move to adjacent cell)
			const nextCell = this.findNextContourCell(
				waterHeights, width, height, currentX, currentY, threshold, visited
			);

			if (!nextCell) break;

			currentX = nextCell.x;
			currentY = nextCell.y;
			iterations++;

		} while (iterations < maxIterations && (currentX !== startX || currentY !== startY));

		return { points: contourPoints };
	}

	/**
	 * Find the next cell to continue contour tracing
	 */
	private static findNextContourCell(
		waterHeights: Float32Array | Uint16Array | Uint8Array,
		width: number,
		height: number,
		x: number,
		y: number,
		threshold: number,
		visited: boolean[]
	): { x: number; y: number } | null {
		// Check 8-connected neighbors
		const neighbors = [
			{ x: x + 1, y: y },     // right
			{ x: x + 1, y: y + 1 }, // bottom-right
			{ x: x, y: y + 1 },     // bottom
			{ x: x - 1, y: y + 1 }, // bottom-left
			{ x: x - 1, y: y },     // left
			{ x: x - 1, y: y - 1 }, // top-left
			{ x: x, y: y - 1 },     // top
			{ x: x + 1, y: y - 1 }  // top-right
		];

		for (const neighbor of neighbors) {
			if (neighbor.x >= 0 && neighbor.x < width - 1 &&
				neighbor.y >= 0 && neighbor.y < height - 1) {

				const idx = neighbor.y * width + neighbor.x;
				if (!visited[idx]) {
					const config = this.getCellConfiguration(
						waterHeights, width, neighbor.x, neighbor.y, threshold
					);

					// If this cell has a contour boundary, continue tracing
					if (config > 0 && config < 15) {
						return neighbor;
					}
				}
			}
		}

		return null;
	}

	/**
	 * Calculate average water height for a contour area
	 */
	private static calculateContourWaterHeight(
		contour: { points: Array<{ x: number; y: number }> },
		waterHeights: Float32Array | Uint16Array | Uint8Array,
		width: number,
		height: number
	): number {
		if (contour.points.length === 0) return 0;

		// Sample water heights around the contour
		let totalHeight = 0;
		let sampleCount = 0;

		for (const point of contour.points) {
			const x = Math.floor(point.x);
			const y = Math.floor(point.y);

			if (x >= 0 && x < width && y >= 0 && y < height) {
				const idx = y * width + x;
				const height = waterHeights[idx];
				if (height > 0) {
					totalHeight += height;
					sampleCount++;
				}
			}
		}

		return sampleCount > 0 ? totalHeight / sampleCount : 0;
	}

	/**
	 * Create a flood polygon from a traced contour
	 */
	private static createFloodPolygonFromContour(
		contour: { points: Array<{ x: number; y: number }> },
		geoMinX: number,
		geoMinY: number,
		geoMaxX: number,
		geoMaxY: number,
		cellWidth: number,
		cellHeight: number,
		avgWaterHeight: number
	): FloodPolygon {
		// Convert contour points to world coordinates
		const worldPoints: number[] = [];

		// Simplify contour to reduce vertex count (every 3rd point for performance)
		const simplificationFactor = Math.max(1, Math.floor(contour.points.length / 20));

		for (let i = 0; i < contour.points.length; i += simplificationFactor) {
			const point = contour.points[i];

			// Convert pixel coordinates to world coordinates
			const worldX = geoMinX + point.x * cellWidth;
			const worldY = geoMaxY - point.y * cellHeight; // GeoTIFF Y is flipped

			// Create triangulated vertices (fan triangulation from center)
			if (i === 0) {
				// Store center point for triangulation
				const centerX = worldX;
				const centerY = worldY;

				// Create triangles from center to contour points
				for (let j = 0; j < contour.points.length - 1; j += simplificationFactor) {
					const p1 = contour.points[j];
					const p2 = contour.points[Math.min(j + simplificationFactor, contour.points.length - 1)];

					const x1 = geoMinX + p1.x * cellWidth;
					const y1 = geoMaxY - p1.y * cellHeight;
					const x2 = geoMinX + p2.x * cellWidth;
					const y2 = geoMaxY - p2.y * cellHeight;

					// Triangle: center -> p1 -> p2
					worldPoints.push(
						centerX, 0, centerY,  // Center
						x1, 0, y1,           // Point 1
						x2, 0, y2            // Point 2
					);
				}
				break;
			}
		}

		// Calculate bounding box
		let minX = Infinity, maxX = -Infinity;
		let minY = Infinity, maxY = -Infinity;

		for (const point of contour.points) {
			const worldX = geoMinX + point.x * cellWidth;
			const worldY = geoMaxY - point.y * cellHeight;

			minX = Math.min(minX, worldX);
			maxX = Math.max(maxX, worldX);
			minY = Math.min(minY, worldY);
			maxY = Math.max(maxY, worldY);
		}

		return {
			vertices: worldPoints,
			boundingBox: { minX, minY, maxX, maxY },
			waterHeight: avgWaterHeight
		};
	}



	/**
	 * Analyze a chunk of raster data for flood characteristics
	 */
	private static analyzeChunk(
		waterHeights: Float32Array | Uint16Array | Uint8Array,
		width: number,
		height: number,
		startX: number,
		startY: number,
		chunkSize: number,
		minWaterHeight: number
	): { hasFlood: boolean; avgWaterHeight: number; floodCoverage: number } {
		let totalWaterHeight = 0;
		let floodedPixels = 0;
		let totalPixels = 0;

		for (let dy = 0; dy < chunkSize && startY + dy < height; dy++) {
			for (let dx = 0; dx < chunkSize && startX + dx < width; dx++) {
				const idx = (startY + dy) * width + (startX + dx);
				const waterHeight = waterHeights[idx];

				totalPixels++;

				if (waterHeight > minWaterHeight) {
					totalWaterHeight += waterHeight;
					floodedPixels++;
				}
			}
		}

		const hasFlood = floodedPixels > 0;
		const avgWaterHeight = hasFlood ? totalWaterHeight / floodedPixels : 0;
		const floodCoverage = floodedPixels / totalPixels;

		return { hasFlood, avgWaterHeight, floodCoverage };
	}

	/**
	 * Create a flood polygon with realistic shape variation
	 */
	private static createFloodPolygon(
		minX: number,
		minY: number,
		maxX: number,
		maxY: number,
		waterHeight: number,
		floodCoverage: number
	): FloodPolygon {
		// Create slightly irregular polygon based on flood coverage
		const centerX = (minX + maxX) / 2;
		const centerY = (minY + maxY) / 2;
		const width = maxX - minX;
		const height = maxY - minY;

		// Vary the polygon shape based on flood coverage
		const irregularity = (1 - floodCoverage) * 0.3; // More irregular for partial flooding

		const vertices = this.createIrregularRectangle(
			centerX, centerY, width, height, irregularity
		);

		return {
			vertices,
			boundingBox: { minX, minY, maxX, maxY },
			waterHeight
		};
	}

	/**
	 * Create an irregular rectangle to simulate natural flood shapes
	 */
	private static createIrregularRectangle(
		centerX: number,
		centerY: number,
		width: number,
		height: number,
		irregularity: number
	): number[] {
		const halfWidth = width / 2;
		const halfHeight = height / 2;

		// Create 6 triangles for more natural shape
		const vertices: number[] = [];

		// Vary corner positions slightly for natural look
		const corners = [
			{ x: centerX - halfWidth * (1 - irregularity * Math.random()), y: centerY - halfHeight * (1 - irregularity * Math.random()) },
			{ x: centerX + halfWidth * (1 - irregularity * Math.random()), y: centerY - halfHeight * (1 - irregularity * Math.random()) },
			{ x: centerX + halfWidth * (1 - irregularity * Math.random()), y: centerY + halfHeight * (1 - irregularity * Math.random()) },
			{ x: centerX - halfWidth * (1 - irregularity * Math.random()), y: centerY + halfHeight * (1 - irregularity * Math.random()) }
		];

		// Create triangles from center to corners (fan triangulation)
		for (let i = 0; i < corners.length; i++) {
			const current = corners[i];
			const next = corners[(i + 1) % corners.length];

			// Triangle: center -> current -> next
			vertices.push(
				centerX, 0, centerY,  // Center
				current.x, 0, current.y,  // Current corner
				next.x, 0, next.y     // Next corner
			);
		}

		return vertices;
	}

	/**
	 * Validate TIFF format
	 */
	private static validateTIFFFormat(arrayBuffer: ArrayBuffer): boolean {
		if (!arrayBuffer || arrayBuffer.byteLength < 4) {
			return false;
		}

		const view = new DataView(arrayBuffer);
		const magic = view.getUint16(0, false);

		// TIFF files start with either:
		// - 0x4949 (II) for little-endian
		// - 0x4D4D (MM) for big-endian
		const isLittleEndian = magic === 0x4949;
		const isBigEndian = magic === 0x4D4D;

		if (!isLittleEndian && !isBigEndian) {
			return false;
		}

		// Check TIFF version (should be 42)
		const version = view.getUint16(2, isLittleEndian);
		return version === 42;
	}
}

export default GeoTIFFProcessor;

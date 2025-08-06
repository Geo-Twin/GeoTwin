/**
 * FastFlood API Integration for GeoTwin
 * Handles flood simulation requests and GeoTIFF processing
 *
 * Man, this API integration was something else to figure out
 * FastFlood's API is powerful but the documentation was... sparse
 * Had to do a lot of trial and error to get the coordinate transformations right
 * The key insight was understanding their projected coordinate system
 * and how to properly format the bounding box requests
 *
 * Shoutout to the FastFlood team though - once you get it working,
 * the hydraulic modeling results are SOLID for emergency planning
 */

export interface FastFloodBoundingBox {
	bbox: [number, number, number, number]; // [minX, minY, maxX, maxY] in projected coordinates
	elevation_model_name: string;
	resolution: string;
}

export interface FastFloodDesignStorm {
	return_period: number; // Years (e.g., 10, 25, 50, 100)
	duration: number; // Hours (e.g., 1, 3, 6, 12, 24)
}

export interface FastFloodRequest {
	d_dem: FastFloodBoundingBox;
	inf: null;
	barriers: {
		type: "geojson";
		geojson: {
			type: "FeatureCollection";
			features: any[];
		};
	};
	forecast: {
		end_time: number;
		forecast_date: string;
		start_time: number;
	};
	dur: number;
	ocean: number;
	rain: number;
	qin: {
		latitude: number;
		longitude: number;
		flow_rate: number;
	} | null;
	designstorm: FastFloodDesignStorm;
}

export interface FloodSimulationParams {
	returnPeriod: number;
	duration: number;
	rain: number;           // 0-300 mm/hour
	ocean: number;          // 0-5 meters (sea level rise)
	flowRate: number;       // 0-1000 m³/s (qin.flow_rate)
	resolution: string;     // "5m" | "10m" | "20m"
	forecastDate: string;   // Date or "latest"
}

export interface FastFloodOutputFile {
	name: string;
	type: "ModelOutputFile" | "MetaData";
	href: string;
}

export interface FastFloodResponse {
	status_code: number;
	message: string;
	data: {
		files: FastFloodOutputFile[];
	};
	errors: any;
}

export interface FloodSimulationArea {
	name: string;
	bbox: [number, number, number, number]; // WGS84 coordinates [minLon, minLat, maxLon, maxLat]
	projectedBbox: [number, number, number, number]; // Projected coordinates for API
}

export class FastFloodAPI {
	private static readonly API_BASE_URL = 'https://webapp-prod-fastflood.azurewebsites.net';
	private static readonly API_KEY = 'Xx1BfVGbNP76RwYlmQtR8os4halVCpxH';
	
	// GeoTwin: Predefined areas for Dominica
	public static readonly SIMULATION_AREAS: Record<string, FloodSimulationArea> = {
		'grand-bay': {
			name: 'Grand Bay (Berekua)',
			bbox: [-61.3167, 15.2333, -61.2833, 15.2667], // WGS84 approximate
			projectedBbox: [-6827737.551573, 1722546.650921, -6822960.237306, 1714291.451866] // EXACT from your working example
		},
		'roseau': {
			name: 'Roseau',
			bbox: [-61.4000, 15.2900, -61.3700, 15.3100], // WGS84 approximate
			projectedBbox: [-6830000, 1720000, -6825000, 1725000] // Placeholder - needs proper conversion
		}
	};

	/**
	 * Run flood simulation for a specific area with full parameters
	 */
	public static async runFloodSimulation(
		areaId: string,
		params: Partial<FloodSimulationParams> = {}
	): Promise<FastFloodResponse> {
		// Apply ORIGINAL working configuration that used to work perfectly
		const {
			returnPeriod = 10,        // Original working: 10 (not 100)
			duration = 3,             // Original working: 3 (not 12)
			rain = 0,                 // Original working: 0 (not 100)
			ocean = 0,                // Original working: 0 (not 1.0)
			flowRate = 0,             // Original working: 0 (not 200)
			resolution = '20m',       // Original working: 20m (not 10m)
			forecastDate = 'latest'
		} = params;

		console.log(` GeoTwin: Using API parameters:`, {
			returnPeriod, duration, rain, ocean, flowRate, resolution, forecastDate
		});
		const area = this.SIMULATION_AREAS[areaId];
		if (!area) {
			throw new Error(`Unknown simulation area: ${areaId}`);
		}

		const request: FastFloodRequest = {
			d_dem: {
				bbox: area.projectedBbox,
				elevation_model_name: "cop30",
				resolution: resolution
			},
			inf: null,
			barriers: {
				type: "geojson",
				geojson: {
					type: "FeatureCollection",
					features: []
				}
			},
			forecast: {
				end_time: 24,        // Original working: 24 (not 48)
				forecast_date: forecastDate,
				start_time: 0
			},
			dur: 0,              // Original working: 0 (not duration)
			ocean: ocean,
			rain: rain,
			qin: null,           // Original working: null (not object)
			designstorm: {
				return_period: returnPeriod,
				duration: duration
			}
		};

		console.log(` GeoTwin: Running flood simulation for ${area.name}...`);
		console.log(` Parameters: ${returnPeriod}-year return period, ${duration}-hour duration`);
		console.log(` Weather: ${rain}mm/h rain, ${ocean}m sea level rise`);
		console.log(` Environment: ${flowRate}m³/s flow rate, ${resolution} resolution`);

		// Debug: Log the exact request being sent
		console.log(` GeoTwin: Sending API request:`, JSON.stringify(request, null, 2));
		console.log(` GeoTwin: Bbox format check:`, {
			bbox: request.d_dem.bbox,
			length: request.d_dem.bbox.length,
			values: request.d_dem.bbox.map(v => typeof v === 'number' ? v.toFixed(2) : v)
		});

		try {
			const response = await fetch(`${this.API_BASE_URL}/v1/model/run-and-wait`, {
				method: 'POST',
				headers: {
					'accept': 'application/json',
					'Cache-Control': 'max-age=86400',
					'api-key': this.API_KEY,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(request)
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error(` FastFlood API error: ${response.status} ${response.statusText}`);
				console.error(` Error details:`, errorText);
				console.error(` Request that failed:`, JSON.stringify(request, null, 2));
				throw new Error(`FastFlood API error: ${response.status} ${response.statusText}`);
			}

			const result: FastFloodResponse = await response.json();
			console.log(` GeoTwin: Flood simulation completed for ${area.name}`);
			console.log(` Generated files:`, result.data.files.map(f => f.name));

			// Debug: Check if simulation actually produced valid results
			const waterHeightFile = result.data.files.find(f => f.name === 'whout.tif');
			if (waterHeightFile) {
				console.log(` Water height file found:`, waterHeightFile);
			} else {
				console.warn(` No water height file (whout.tif) found in results`);
			}

			return result;
		} catch (error) {
			console.error(` GeoTwin: Flood simulation failed for ${area.name}:`, error);
			throw error;
		}
	}

	/**
	 * Backward compatibility method for old API signature
	 */
	public static async runFloodSimulationLegacy(
		areaId: string,
		returnPeriod: number = 100,
		duration: number = 12
	): Promise<FastFloodResponse> {
		return this.runFloodSimulation(areaId, { returnPeriod, duration });
	}

	/**
	 * Get water height GeoTIFF URL from simulation results
	 */
	public static getWaterHeightURL(response: FastFloodResponse): string | null {
		const whoutFile = response.data.files.find(f => f.name === 'whout.tif');
		return whoutFile?.href || null;
	}

	/**
	 * Get flow velocity GeoTIFF URL from simulation results
	 */
	public static getFlowVelocityURL(response: FastFloodResponse): string | null {
		const qoutFile = response.data.files.find(f => f.name === 'qout.tif');
		return qoutFile?.href || null;
	}

	/**
	 * Download and process GeoTIFF data (with CORS handling)
	 */
	public static async downloadGeoTIFF(url: string): Promise<ArrayBuffer> {
		console.log(` GeoTwin: Downloading GeoTIFF from ${url}`);

		// Import the proxy service dynamically to avoid circular imports
		const { GeoTIFFProxy } = await import('./GeoTIFFProxy');

		try {
			// Try direct download first
			console.log(` GeoTwin: Attempting direct download...`);
			const response = await fetch(url, {
				method: 'GET',
				mode: 'cors',
				credentials: 'omit',
				headers: {
					'Accept': 'application/octet-stream, */*'
				}
			});

			if (!response.ok) {
				throw new Error(`Direct download failed: ${response.status} ${response.statusText}`);
			}

			const arrayBuffer = await response.arrayBuffer();

			// Validate the GeoTIFF
			if (!GeoTIFFProxy.validateGeoTIFF(arrayBuffer)) {
				throw new Error('Downloaded file is not a valid GeoTIFF');
			}

			console.log(` GeoTwin: Downloaded GeoTIFF directly (${arrayBuffer.byteLength} bytes)`);
			return arrayBuffer;

		} catch (directError) {
			console.warn(` GeoTwin: Direct download failed, using proxy:`, directError);

			// Fall back to proxy download
			try {
				const arrayBuffer = await GeoTIFFProxy.downloadGeoTIFFViaProxy(url);

				// Validate the GeoTIFF
				if (!GeoTIFFProxy.validateGeoTIFF(arrayBuffer)) {
					throw new Error('Downloaded file via proxy is not a valid GeoTIFF');
				}

				return arrayBuffer;

			} catch (proxyError) {
				console.error(` GeoTwin: Both direct and proxy download failed:`, proxyError);
				throw new Error(`Failed to download GeoTIFF: ${proxyError.message}`);
			}
		}
	}

	/**
	 * Convert WGS84 coordinates to projected coordinates (placeholder)
	 * TODO: Implement proper coordinate transformation
	 */
	public static wgs84ToProjected(lon: number, lat: number): [number, number] {
		// This is a placeholder - you'll need proper coordinate transformation
		// For now, return approximate values based on Grand Bay example
		const x = (lon + 61.3) * -100000 - 6825000;
		const y = (lat - 15.25) * 100000 + 1718000;
		return [x, y];
	}

	/**
	 * Create custom simulation area from bounding box
	 */
	public static createCustomArea(
		name: string,
		wgs84Bbox: [number, number, number, number]
	): FloodSimulationArea {
		const [minLon, minLat, maxLon, maxLat] = wgs84Bbox;
		const [minX, minY] = this.wgs84ToProjected(minLon, minLat);
		const [maxX, maxY] = this.wgs84ToProjected(maxLon, maxLat);

		return {
			name,
			bbox: wgs84Bbox,
			projectedBbox: [minX, minY, maxX, maxY]
		};
	}
}

export default FastFloodAPI;

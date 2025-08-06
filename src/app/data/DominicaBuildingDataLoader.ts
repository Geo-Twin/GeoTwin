export interface DominicaBuildingInfo {
	buildingMaterial: string;
	objectId: number;
	name?: string;
	coordinates: [number, number]; // WGS84 [longitude, latitude]
	parish: string;
	community: string;
	occupancy: string;
	roofType: string;
	roofShape: string;
	constructionType: string;
	area: number;
	value: number;
	// Store all original properties for complete data display
	allProperties: Record<string, any>;
}

export interface DominicaBuildingMatch {
	roofMaterial: 'concrete' | 'metal' | 'tiles' | 'thatch' | 'default';
	roofShape: 'flat' | 'gabled' | 'hipped' | 'pyramidal' | 'default';
	wallMaterial: 'concrete' | 'wood' | 'brick' | 'plaster' | 'cementBlock';
	roofColor?: number;
	wallColor?: number;
	occupancyType: 'residential' | 'commercial' | 'industrial' | 'institutional' | 'unknown';
	buildingHeight?: number;
	confidence: number; // 0-1 matching confidence
	// Include all original Dominica data for complete display
	originalData?: DominicaBuildingInfo;
}

export default class DominicaBuildingDataLoader {
	private buildingData: Map<string, DominicaBuildingInfo> = new Map();
	private spatialIndex: Map<string, DominicaBuildingInfo[]> = new Map();
	private isLoaded: boolean = false;
	private loadPromise: Promise<void> | null = null;

	// Grid size for spatial indexing (in degrees for WGS84 coordinates)
	// ~0.001 degrees ≈ 100 meters at Dominica's latitude
	private readonly GRID_SIZE = 0.001;

	/**
	 * Load GeoJSON data from file or URL
	 */
	public async loadGeoJSONData(dataSource: string | object): Promise<void> {
		if (this.loadPromise) {
			return this.loadPromise;
		}

		this.loadPromise = this.doLoadData(dataSource);
		return this.loadPromise;
	}

	private async doLoadData(dataSource: string | object): Promise<void> {
		try {
			let geoJsonData: any;

			if (typeof dataSource === 'string') {
				// Load from URL or file path
				const response = await fetch(dataSource);
				geoJsonData = await response.json();
			} else {
				// Use provided object
				geoJsonData = dataSource;
			}

			this.parseGeoJSONData(geoJsonData);
			this.buildSpatialIndex();
			this.isLoaded = true;

			console.log(`GeoTwin: Successfully loaded ${this.buildingData.size} Dominica buildings from GeoJSON`);
			console.log(`GeoTwin: Spatial index created with ${this.spatialIndex.size} grid cells`);

			// Log a sample building for debugging
			if (this.buildingData.size > 0) {
				const sampleBuilding = Array.from(this.buildingData.values())[0];
				console.log('Sample building data:', sampleBuilding);
			}
		} catch (error) {
			console.error('GeoTwin: Failed to load Dominica building data:', error);
			this.isLoaded = false;
		}
	}

	private parseGeoJSONData(geoJsonData: any): void {
		if (!geoJsonData.features) {
			throw new Error('Invalid GeoJSON format: missing features array');
		}

		for (const feature of geoJsonData.features) {
			try {
				const props = feature.properties;
				const geometry = feature.geometry;

				// Extract coordinates (use centroid for polygons)
				// Always use X, Y properties (longitude, latitude in WGS84) for consistency
				// The geometry coordinates are in projected system (EPSG:32620) but X,Y are WGS84
				let coordinates: [number, number];
				coordinates = [props.X || 0, props.Y || 0];

				// Skip buildings with invalid coordinates
				if (coordinates[0] === 0 && coordinates[1] === 0) {
					continue;
				}

				const buildingInfo: DominicaBuildingInfo = {
					buildingMaterial: props.BUILDING_M || props.BUILDING_MA || '',
					objectId: props.OBJECTID || 0,
					name: props.NAME || undefined,
					coordinates: coordinates,
					parish: props.PARISH || '',
					community: props.COMMUNITY || '',
					occupancy: props.OCCUPANCY || '',
					roofType: props.ROOF_TYPE || '',
					roofShape: props.ROOF_SHAPE || '',
					constructionType: props.CONSTR_TYP || '',
					area: props.AREA || 0,
					value: props.VALUE || 0,
					allProperties: props // Store all original properties
				};

				// Index by object ID and coordinates
				const key = `${buildingInfo.objectId}`;
				this.buildingData.set(key, buildingInfo);

			} catch (error) {
				console.warn('GeoTwin: Failed to parse building feature:', error);
			}
		}
	}

	private buildSpatialIndex(): void {
		this.spatialIndex.clear();

		for (const building of this.buildingData.values()) {
			const gridKey = this.getGridKey(building.coordinates[0], building.coordinates[1]);
			
			if (!this.spatialIndex.has(gridKey)) {
				this.spatialIndex.set(gridKey, []);
			}

			const buildings = this.spatialIndex.get(gridKey);
			if (buildings) {
				buildings.push(building);
			}
		}

		console.log(`GeoTwin: Built spatial index with ${this.spatialIndex.size} grid cells`);
	}

	private getGridKey(x: number, y: number): string {
		const gridX = Math.floor(x / this.GRID_SIZE);
		const gridY = Math.floor(y / this.GRID_SIZE);
		return `${gridX},${gridY}`;
	}

	/**
	 * Find building data for OSM building using spatial matching
	 * @param osmCoordinates [longitude, latitude] in WGS84
	 * @param searchRadius Search radius in degrees (default ~50 meters)
	 */
	public getBuildingInfo(osmCoordinates: [number, number], searchRadius: number = 0.0005): DominicaBuildingMatch | null {
		if (!this.isLoaded) {
			return null;
		}

		const candidates = this.findNearbyBuildings(osmCoordinates[0], osmCoordinates[1], searchRadius);
		
		if (candidates.length === 0) {
			return null;
		}

		// Find closest building
		let closestBuilding: DominicaBuildingInfo | null = null;
		let closestDistance = Infinity;

		for (const candidate of candidates) {
			const distance = this.calculateDistance(
				osmCoordinates[0], osmCoordinates[1],
				candidate.coordinates[0], candidate.coordinates[1]
			);

			if (distance < closestDistance) {
				closestDistance = distance;
				closestBuilding = candidate;
			}
		}

		if (!closestBuilding || closestDistance > searchRadius) {
			return null;
		}

		// Convert Dominica data to GeoTwin format
		return this.convertToGeoTwinFormat(closestBuilding, closestDistance, searchRadius);
	}

	private findNearbyBuildings(x: number, y: number, radius: number): DominicaBuildingInfo[] {
		const candidates: DominicaBuildingInfo[] = [];
		
		// Check multiple grid cells around the point
		const gridRadius = Math.ceil(radius / this.GRID_SIZE);
		const centerGridX = Math.floor(x / this.GRID_SIZE);
		const centerGridY = Math.floor(y / this.GRID_SIZE);

		for (let dx = -gridRadius; dx <= gridRadius; dx++) {
			for (let dy = -gridRadius; dy <= gridRadius; dy++) {
				const gridKey = `${centerGridX + dx},${centerGridY + dy}`;
				const buildings = this.spatialIndex.get(gridKey);
				
				if (buildings) {
					candidates.push(...buildings);
				}
			}
		}

		return candidates;
	}

	private calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
		const dx = x1 - x2;
		const dy = y1 - y2;
		return Math.sqrt(dx * dx + dy * dy);
	}

	private convertToGeoTwinFormat(building: DominicaBuildingInfo, distance: number, maxDistance: number): DominicaBuildingMatch {
		// Calculate confidence based on distance (closer = higher confidence)
		const confidence = Math.max(0, 1 - (distance / maxDistance));

		return {
			roofMaterial: this.mapRoofType(building.roofType),
			roofShape: this.mapRoofShape(building.roofShape),
			wallMaterial: this.mapConstructionType(building.constructionType),
			roofColor: this.getRoofColorFromType(building.roofType),
			wallColor: this.getWallColorFromType(building.constructionType),
			occupancyType: this.mapOccupancyType(building.occupancy),
			buildingHeight: this.estimateHeightFromOccupancy(building.occupancy, building.area),
			confidence: confidence,
			originalData: building // Include complete original data
		};
	}

	private mapRoofType(roofType: string): 'concrete' | 'metal' | 'tiles' | 'thatch' | 'default' {
		const type = roofType.toLowerCase();
		if (type.includes('concrete')) return 'concrete';
		if (type.includes('metal') || type.includes('steel') || type.includes('zinc') || type.includes('galvanized')) return 'metal';
		if (type.includes('tile') || type.includes('clay')) return 'tiles';
		if (type.includes('thatch') || type.includes('palm')) return 'thatch';
		return 'default';
	}

	private mapRoofShape(roofShape: string): 'flat' | 'gabled' | 'hipped' | 'pyramidal' | 'default' {
		const shape = roofShape.toLowerCase();
		if (shape.includes('flat')) return 'flat';
		if (shape.includes('gable') || shape.includes('v_shape')) return 'gabled';
		if (shape.includes('hip')) return 'hipped';
		if (shape.includes('pyramid')) return 'pyramidal';
		if (shape.includes('bell')) return 'hipped'; // Bell shape maps to hipped
		return 'default';
	}

	private mapConstructionType(constructionType: string): 'concrete' | 'wood' | 'brick' | 'plaster' | 'cementBlock' {
		const type = constructionType.toLowerCase();
		if (type.includes('concrete')) return 'concrete';
		if (type.includes('wood') || type.includes('timber')) return 'wood';
		if (type.includes('brick')) return 'brick';
		if (type.includes('block') || type.includes('cement')) return 'cementBlock';
		return 'plaster'; // Default fallback
	}

	private mapOccupancyType(occupancy: string): 'residential' | 'commercial' | 'industrial' | 'institutional' | 'unknown' {
		const type = occupancy.toLowerCase();
		if (type.includes('residential') || type.includes('house') || type.includes('home')) return 'residential';
		if (type.includes('commercial') || type.includes('shop') || type.includes('store') || type.includes('business')) return 'commercial';
		if (type.includes('industrial') || type.includes('factory') || type.includes('warehouse')) return 'industrial';
		if (type.includes('hospital') || type.includes('school') || type.includes('church') || type.includes('government')) return 'institutional';
		return 'unknown';
	}

	private getRoofColorFromType(roofType: string): number | undefined {
		const type = roofType.toLowerCase();
		if (type.includes('concrete')) return 0x888888; // Gray
		if (type.includes('metal')) return 0x4A4A4A; // Dark gray
		if (type.includes('tile')) return 0x8B4513; // Saddle brown
		if (type.includes('thatch')) return 0xDEB887; // Burlywood
		return undefined;
	}

	private getWallColorFromType(constructionType: string): number | undefined {
		const type = constructionType.toLowerCase();
		if (type.includes('concrete')) return 0xC0C0C0; // Silver
		if (type.includes('wood')) return 0xD2B48C; // Tan
		if (type.includes('brick')) return 0xB22222; // Fire brick
		return undefined;
	}

	private estimateHeightFromOccupancy(occupancy: string, area: number): number | undefined {
		const type = occupancy.toLowerCase();
		
		// Base height estimates in meters
		if (type.includes('hospital') || type.includes('school')) return 12; // 3 stories
		if (type.includes('commercial') || type.includes('business')) return 8; // 2 stories
		if (type.includes('industrial') || type.includes('warehouse')) return 10; // High ceiling
		if (type.includes('church')) return 15; // High ceiling with spire
		
		// Residential - estimate based on area
		if (area > 200) return 8; // Large house, likely 2 stories
		if (area > 100) return 6; // Medium house
		return 4; // Small house, 1 story
	}

	public isDataLoaded(): boolean {
		return this.isLoaded;
	}

	public getBuildingCount(): number {
		return this.buildingData.size;
	}

	public getLoadedParishes(): string[] {
		const parishes = new Set<string>();
		for (const building of this.buildingData.values()) {
			if (building.parish) {
				parishes.add(building.parish);
			}
		}
		return Array.from(parishes).sort();
	}
}

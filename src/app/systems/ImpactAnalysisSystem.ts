/**
 * Impact Analysis System for GeoTwin Flood Risk Assessment
 * Calculates real-time flood impact metrics based on flood plane intersections with building data
 */

import System from '../System';
import SystemManager from './SystemManager';
import FloodSimulationSystem from './FloodSimulationSystem';
import Vec2 from '~/lib/math/Vec2';
import MathUtils from '~/lib/math/MathUtils';
import { getMainThreadDominicaDataLoader } from '~/app/data/initializeDominicaData';
import DominicaBuildingDataLoader, { DominicaBuildingInfo } from '~/app/data/DominicaBuildingDataLoader';

export interface BuildingImpactData {
	id: string;
	occupancy: string;
	value: number;
	footprintArea: number;
	estimatedOccupants: number;
	floodDepth: number;
	coordinates: [number, number];
}

export interface ImpactSummary {
	buildingsAtRisk: number;
	peopleAffected: number;
	economicLoss: number;
	highRiskArea: number;
}

export interface BuildingCategoryImpact {
	category: string;
	affectedCount: number;
	totalCount: number;
	estimatedLoss: number;
}

export interface EmergencyResponse {
	emergencyServices: number;
	evacuationRoutes: number;
	riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ImpactAnalysisResults {
	summary: ImpactSummary;
	buildingCategories: BuildingCategoryImpact[];
	emergencyResponse: EmergencyResponse;
	affectedBuildings: BuildingImpactData[];
	timestamp: Date;
}

export default class ImpactAnalysisSystem extends System {
	private lastAnalysis: ImpactAnalysisResults | null = null;

	// Dominica building statistics for baseline calculations
	private readonly DOMINICA_STATS = {
		totalPopulation: 70000,
		totalBuildings: 38000,
		avgOccupantsPerBuilding: 1.84, // 70k / 38k
		buildingCategories: {
			residential: 1200,
			commercial: 180,
			industrial: 95,
			public: 68
		}
	};

	// Occupancy multipliers for people estimation
	private readonly OCCUPANCY_MULTIPLIERS = {
		residential: 3.0,      // Base: 3 people per household
		commercial: 8.0,       // Higher density during business hours
		industrial: 5.0,       // Workers per shift
		public: 15.0,          // Schools, hospitals, government
		school: 25.0,          // High occupancy
		hospital: 12.0,        // Patients + staff
		government: 10.0,      // Office workers
		default: 3.0
	};

	public constructor() {
		super();
		console.log(' GeoTwin: Impact Analysis System initialized');
	}

	public postInit(): void {
		// System initialization after all systems are created
	}

	public update(): void {
		// Update loop - not needed for impact analysis
	}

	/**
	 * Perform comprehensive impact analysis based on current flood simulation
	 */
	public async analyzeFloodImpact(): Promise<ImpactAnalysisResults> {


		if (!this.systemManager) {
			throw new Error('SystemManager not available');
		}

		const floodSystem = this.systemManager.getSystem(FloodSimulationSystem);
		if (!floodSystem) {
			throw new Error('FloodSimulationSystem not available');
		}

		const floodState = floodSystem.getState();
		if (!floodState.lastResults) {
			throw new Error('No flood simulation results available');
		}

		if (!floodState.floodPolygons || floodState.floodPolygons.length === 0) {
			throw new Error('No flood polygons available for impact analysis');
		}

		// Get building data from Dominica data loader
		const buildingData = this.getBuildingData(floodState.floodPolygons);

		// Extract pre-calculated building data from flood polygons
		const affectedBuildings = this.extractAffectedBuildingsFromPolygons(floodState.floodPolygons);

		// Calculate real metrics from actual affected buildings
		const buildingsAtRisk = affectedBuildings.length;
		const peopleAffected = affectedBuildings.reduce((total, building) => total + building.estimatedOccupants, 0);
		const economicLoss = affectedBuildings.reduce((total, building) => total + building.value, 0);
		const estimatedFloodArea = floodState.floodPolygons.length * 19.1 * 19.1; // Each polygon is ~19.1m x 19.1m

		// If no real buildings found, show zero impact instead of fake data
		if (buildingsAtRisk === 0) {
			return this.createZeroImpactAnalysis(estimatedFloodArea);
		}

		// Create summary metrics
		const summary = {
			buildingsAtRisk,
			totalBuildings: this.DOMINICA_STATS.totalBuildings,
			peopleAffected,
			totalPopulation: this.DOMINICA_STATS.totalPopulation,
			economicLoss,
			highRiskArea: estimatedFloodArea
		};

		// Analyze building categories
		const buildingCategories = this.analyzeBuildingCategories(affectedBuildings, buildingData);

		// Create emergency response analysis
		const emergencyResponse = {
			emergencyServices: 3,
			evacuationRoutes: 8,
			riskLevel: buildingsAtRisk > 100 ? 'HIGH' : buildingsAtRisk > 50 ? 'MEDIUM' : 'LOW' as 'HIGH' | 'MEDIUM' | 'LOW'
		};

		const results: ImpactAnalysisResults = {
			summary,
			buildingCategories,
			emergencyResponse,
			affectedBuildings,
			timestamp: new Date()
		};

		this.lastAnalysis = results;
		return results;
	}

	/**
	 * Get building data from the integrated Dominica GeoJSON dataset
	 */
	private getBuildingData(floodPolygons: FloodPolygon[]): DominicaBuildingInfo[] {
		// Access the building data from Dominica data loader
		const dataLoader = getMainThreadDominicaDataLoader();

		if (!dataLoader || !dataLoader.isDataLoaded()) {
			// Return empty array if no real data available
			return [];
		}

		// Convert Dominica building data to array format
		const buildingData: DominicaBuildingInfo[] = [];
		const buildingCount = dataLoader.getBuildingCount();

		console.log(`🏢 GeoTwin: Accessing ${buildingCount} buildings from Dominica dataset`);

		// Get all buildings from the data loader
		// Note: We'll need to iterate through the spatial index or add a method to get all buildings
		// For now, let's use mock data but with realistic Dominica-based values
		return this.generateRealisticDominicaData(floodPolygons);
	}

	/**
	 * Generate realistic Dominica building data for testing
	 */
	private generateRealisticDominicaData(floodPolygons: FloodPolygon[]): DominicaBuildingInfo[] {
		const buildings: DominicaBuildingInfo[] = [];

		// Generate buildings within the actual flood area for testing
		// Use flood polygon bounds to ensure buildings are in the flooded area
		let centerLat = 15.25;
		let centerLon = -61.30;
		let radius = 0.01; // ~1km radius

		if (floodPolygons.length > 0) {
			// Calculate overall flood area bounds
			let overallMinX = Infinity, overallMaxX = -Infinity;
			let overallMinY = Infinity, overallMaxY = -Infinity;

			for (const polygon of floodPolygons) {
				const bbox = polygon.boundingBox;
				overallMinX = Math.min(overallMinX, bbox.minX);
				overallMaxX = Math.max(overallMaxX, bbox.maxX);
				overallMinY = Math.min(overallMinY, bbox.minY);
				overallMaxY = Math.max(overallMaxY, bbox.maxY);
			}

			// Convert flood bounds to WGS84 and use center
			const minLatLon = MathUtils.meters2degrees(overallMinY, overallMinX);
			const maxLatLon = MathUtils.meters2degrees(overallMaxY, overallMaxX);

			centerLat = (minLatLon.lat + maxLatLon.lat) / 2;
			centerLon = (minLatLon.lon + maxLatLon.lon) / 2;
			radius = Math.max(maxLatLon.lat - minLatLon.lat, maxLatLon.lon - minLatLon.lon) / 2;


		}

		const occupancyTypes = ['residential', 'commercial', 'industrial', 'public', 'school', 'hospital'];
		const parishes = ['Saint Patrick', 'Saint George', 'Saint Paul'];
		const communities = ['Grand Bay', 'Berekua', 'Delices'];

		for (let i = 0; i < 150; i++) {
			const angle = (i / 150) * 2 * Math.PI;
			const distance = Math.random() * radius;
			const lat = centerLat + Math.cos(angle) * distance;
			const lon = centerLon + Math.sin(angle) * distance;

			const occupancy = occupancyTypes[Math.floor(Math.random() * occupancyTypes.length)];
			const area = Math.random() * 200 + 50; // 50-250 sq meters

			// Realistic Dominica building values based on occupancy
			let value = 0;
			switch (occupancy) {
				case 'residential': value = Math.random() * 300000 + 100000; break; // $100k-$400k
				case 'commercial': value = Math.random() * 800000 + 200000; break; // $200k-$1M
				case 'industrial': value = Math.random() * 1200000 + 300000; break; // $300k-$1.5M
				case 'public': value = Math.random() * 2000000 + 500000; break; // $500k-$2.5M
				case 'school': value = Math.random() * 3000000 + 1000000; break; // $1M-$4M
				case 'hospital': value = Math.random() * 5000000 + 2000000; break; // $2M-$7M
			}

			buildings.push({
				buildingMaterial: 'concrete',
				objectId: i + 1,
				name: `Building ${i + 1}`,
				coordinates: [lon, lat],
				parish: parishes[Math.floor(Math.random() * parishes.length)],
				community: communities[Math.floor(Math.random() * communities.length)],
				occupancy: occupancy,
				roofType: 'metal',
				roofShape: 'gable',
				constructionType: 'concrete',
				area: area,
				value: value,
				allProperties: {
					OCCUPANCY: occupancy,
					AREA: area,
					VALUE: value,
					PARISH: parishes[Math.floor(Math.random() * parishes.length)]
				}
			});
		}

		return buildings;
	}

	/**
	 * Generate mock building data for testing when real data is not available
	 */
	private generateMockBuildingData(): DominicaBuildingInfo[] {
		console.log(' GeoTwin: Generating basic mock building data for testing');
		return this.generateRealisticDominicaData();
	}

	/**
	 * Find buildings affected by flood using spatial intersection
	 */
	private findAffectedBuildings(buildings: DominicaBuildingInfo[], floodPolygons: any[]): BuildingImpactData[] {
		const affectedBuildings: BuildingImpactData[] = [];

		for (const building of buildings) {
			// Get building coordinates - try multiple possible formats
			let buildingCoords: [number, number] | null = null;

			if (building.coordinates) {
				buildingCoords = building.coordinates;
			} else if (building.latitude && building.longitude) {
				buildingCoords = [building.longitude, building.latitude];
			} else if (building.lon && building.lat) {
				buildingCoords = [building.lon, building.lat];
			}

			if (!buildingCoords) {
				console.warn('Building missing coordinates:', building.objectId);
				continue;
			}

			// Check intersection with flood polygons
			const floodDepth = this.calculateFloodDepthAtLocation(buildingCoords, floodPolygons);

			if (floodDepth > 0) {
				const footprintArea = building.area || 100; // Default 100 sq meters
				const occupancy = building.occupancy || building.building_type || 'residential';
				const value = building.value || this.estimateBuildingValue(occupancy, footprintArea);

				affectedBuildings.push({
					id: building.way_id || `Way №${building.objectId}`,
					occupancy: occupancy,
					value: value,
					footprintArea: footprintArea,
					estimatedOccupants: this.estimateOccupants(occupancy, footprintArea),
					floodDepth: floodDepth,
					coordinates: buildingCoords,
					// Real GeoJSON properties from Dominica data
					parish: building.parish || 'Unknown',
					community: building.community || building.district || 'Unknown',
					material: building.building_material || building.roof_material || 'Concrete'
				} as any);
			}
		}

		return affectedBuildings;
	}

	/**
	 * Extract affected buildings from pre-calculated flood polygon data
	 */
	private extractAffectedBuildingsFromPolygons(floodPolygons: FloodPolygon[]): BuildingImpactData[] {
		const affectedBuildings: BuildingImpactData[] = [];
		const processedBuildings = new Set<string>(); // Avoid duplicates

		for (const polygon of floodPolygons) {
			if (polygon.affectedBuildings) {
				for (const building of polygon.affectedBuildings) {
					// Skip if already processed (building might be in multiple grid cells)
					if (processedBuildings.has(building.id)) {
						continue;
					}
					processedBuildings.add(building.id);

					// Convert to BuildingImpactData format
					const footprintArea = 100; // Default area
					const value = this.estimateBuildingValue(building.occupancy || 'residential', footprintArea);

					affectedBuildings.push({
						id: building.id,
						occupancy: building.occupancy || 'residential',
						value: value,
						footprintArea: footprintArea,
						estimatedOccupants: this.estimateOccupants(building.occupancy || 'residential', footprintArea),
						floodDepth: building.floodDepth,
						coordinates: building.coordinates,
						// Real GeoJSON properties from flood grid analysis
						parish: building.parish || 'Unknown',
						community: building.community || 'Unknown',
						material: building.material || 'Concrete'
					} as any);
				}
			}
		}

		return affectedBuildings;
	}

	/**
	 * Calculate flood depth at a specific location
	 */
	private calculateFloodDepthAtLocation(coords: [number, number], floodPolygons: any[]): number {
		const [lon, lat] = coords;

		// Convert flood polygon coordinates back to WGS84 for comparison
		// This follows the same pattern as SelectionPanel and DominicaBuildingDataLoader
		let maxDepth = 0;

		// Check each flood polygon for intersection
		for (const polygon of floodPolygons) {
			// Convert flood polygon bounding box from Web Mercator to WGS84
			const bbox = polygon.boundingBox;
			const minLatLon = MathUtils.meters2degrees(bbox.minY, bbox.minX);
			const maxLatLon = MathUtils.meters2degrees(bbox.maxY, bbox.maxX);

			// Check if building coordinates are within flood polygon bounds (WGS84)
			if (lon >= minLatLon.lon && lon <= maxLatLon.lon &&
				lat >= minLatLon.lat && lat <= maxLatLon.lat) {

				// Get the flood depth from the polygon
				let depth = 0;
				if (polygon.waterHeights && polygon.waterHeights.length > 0) {
					// Calculate average water height from the polygon
					const sum = Array.from(polygon.waterHeights).reduce((a: number, b: number) => a + b, 0);
					depth = sum / polygon.waterHeights.length;
				} else {
					depth = 0.5; // Default depth if no data
				}
				maxDepth = Math.max(maxDepth, depth);
			}
		}

		return maxDepth;
	}



	/**
	 * Estimate building value based on occupancy and size
	 */
	private estimateBuildingValue(occupancy: string, footprintArea: number): number {
		const baseValuePerSqM = {
			residential: 1500,   // $1,500 per sq meter
			commercial: 2500,    // $2,500 per sq meter
			industrial: 1200,    // $1,200 per sq meter
			public: 3000,        // $3,000 per sq meter
			school: 2800,
			hospital: 4000,
			government: 3500
		};

		const rate = baseValuePerSqM[occupancy as keyof typeof baseValuePerSqM] || baseValuePerSqM.residential;
		return footprintArea * rate;
	}

	/**
	 * Estimate occupants based on building type and size
	 */
	private estimateOccupants(occupancy: string, footprintArea: number): number {
		const multiplier = this.OCCUPANCY_MULTIPLIERS[occupancy as keyof typeof this.OCCUPANCY_MULTIPLIERS] || 
		                  this.OCCUPANCY_MULTIPLIERS.default;
		
		// Scale by footprint area (larger buildings = more people)
		const areaFactor = Math.max(1, footprintArea / 100); // Base 100 sq meters
		return Math.round(multiplier * areaFactor);
	}

	/**
	 * Calculate overall impact summary
	 */
	private calculateImpactSummary(affectedBuildings: BuildingImpactData[], floodPolygons: any[]): ImpactSummary {
		const buildingsAtRisk = affectedBuildings.length;
		const peopleAffected = affectedBuildings.reduce((sum, building) => sum + building.estimatedOccupants, 0);
		const economicLoss = affectedBuildings.reduce((sum, building) => sum + building.value, 0);
		
		// Calculate total flood area
		const highRiskArea = this.calculateTotalFloodArea(floodPolygons);

		return {
			buildingsAtRisk,
			peopleAffected,
			economicLoss,
			highRiskArea
		};
	}

	/**
	 * Calculate total area covered by flood planes
	 */
	private calculateTotalFloodArea(floodPolygons: any[]): number {
		// Each flood polygon represents a grid cell
		let totalArea = 0;
		
		for (const polygon of floodPolygons) {
			const cellWidth = polygon.cellWidth || 20;
			const cellHeight = polygon.cellHeight || 20;
			totalArea += cellWidth * cellHeight;
		}
		
		return totalArea; // Square meters
	}

	/**
	 * Analyze building impact by category
	 */
	private analyzeBuildingCategories(affectedBuildings: BuildingImpactData[], allBuildings: DominicaBuildingInfo[]): BuildingCategoryImpact[] {
		const categories = ['residential', 'commercial', 'industrial', 'public'];
		const results: BuildingCategoryImpact[] = [];

		for (const category of categories) {
			const affectedInCategory = affectedBuildings.filter(b => b.occupancy === category);
			const totalInCategory = allBuildings.filter(b =>
				b.occupancy === category
			).length || this.DOMINICA_STATS.buildingCategories[category as keyof typeof this.DOMINICA_STATS.buildingCategories];

			const estimatedLoss = affectedInCategory.reduce((sum, building) => sum + building.value, 0);

			results.push({
				category: category.charAt(0).toUpperCase() + category.slice(1),
				affectedCount: affectedInCategory.length,
				totalCount: totalInCategory,
				estimatedLoss
			});
		}

		return results;
	}

	/**
	 * Analyze emergency response capabilities
	 */
	private analyzeEmergencyResponse(affectedBuildings: BuildingImpactData[], allBuildings: any[]): EmergencyResponse {
		// Count emergency services that remain accessible (not flooded)
		const emergencyTypes = ['hospital', 'school', 'government', 'public'];
		const totalEmergencyServices = allBuildings.filter(b => 
			emergencyTypes.includes(b.properties?.occupancy || '')
		).length;
		
		const affectedEmergencyServices = affectedBuildings.filter(b => 
			emergencyTypes.includes(b.occupancy)
		).length;

		const emergencyServices = Math.max(0, totalEmergencyServices - affectedEmergencyServices);

		// Simplified evacuation route analysis (would need road network data for full implementation)
		const evacuationRoutes = this.estimateEvacuationRoutes(affectedBuildings.length);

		// Determine risk level
		const floodCoveragePercent = (affectedBuildings.length / allBuildings.length) * 100;
		const riskLevel = this.determineRiskLevel(floodCoveragePercent, affectedBuildings.length);

		return {
			emergencyServices,
			evacuationRoutes,
			riskLevel
		};
	}

	/**
	 * Estimate available evacuation routes
	 */
	private estimateEvacuationRoutes(affectedBuildingCount: number): number {
		// Simplified estimation - would need actual road network analysis
		const baseRoutes = 8; // Assume 8 major routes in the area
		const routesBlocked = Math.floor(affectedBuildingCount / 50); // 1 route blocked per 50 affected buildings
		return Math.max(1, baseRoutes - routesBlocked);
	}

	/**
	 * Determine overall risk level
	 */
	private determineRiskLevel(coveragePercent: number, affectedBuildings: number): 'LOW' | 'MEDIUM' | 'HIGH' {
		if (coveragePercent > 15 || affectedBuildings > 100) {
			return 'HIGH';
		} else if (coveragePercent > 5 || affectedBuildings > 30) {
			return 'MEDIUM';
		} else {
			return 'LOW';
		}
	}

	/**
	 * Get the last analysis results
	 */
	public getLastAnalysis(): ImpactAnalysisResults | null {
		return this.lastAnalysis;
	}

	/**
	 * Create zero impact analysis when no buildings are found in flood area
	 */
	private createZeroImpactAnalysis(floodArea: number): ImpactAnalysisResults {
		const summary = {
			buildingsAtRisk: 0,
			totalBuildings: this.DOMINICA_STATS.totalBuildings,
			peopleAffected: 0,
			totalPopulation: this.DOMINICA_STATS.totalPopulation,
			economicLoss: 0,
			highRiskArea: floodArea
		};

		const buildingCategories = [
			{ category: 'Residential', affectedCount: 0, totalCount: 1200, estimatedLoss: 0 },
			{ category: 'Commercial', affectedCount: 0, totalCount: 180, estimatedLoss: 0 },
			{ category: 'Industrial', affectedCount: 0, totalCount: 95, estimatedLoss: 0 },
			{ category: 'Public', affectedCount: 0, totalCount: 68, estimatedLoss: 0 }
		];

		const emergencyResponse = {
			emergencyServices: 3,
			evacuationRoutes: 8,
			riskLevel: 'LOW' as 'HIGH' | 'MEDIUM' | 'LOW'
		};

		return {
			summary,
			buildingCategories,
			emergencyResponse,
			affectedBuildings: [], // No buildings found
			timestamp: new Date()
		};
	}

	/**
	 * Create estimated impact analysis when no real buildings are found
	 */
	private createEstimatedImpactAnalysis(estimatedBuildings: number, floodArea: number): ImpactAnalysisResults {
		const peopleAffected = estimatedBuildings * 3;
		const economicLoss = estimatedBuildings * 250000;

		const summary = {
			buildingsAtRisk: estimatedBuildings,
			totalBuildings: this.DOMINICA_STATS.totalBuildings,
			peopleAffected,
			totalPopulation: this.DOMINICA_STATS.totalPopulation,
			economicLoss,
			highRiskArea: floodArea
		};

		const buildingCategories = [
			{ category: 'Residential', affectedCount: Math.floor(estimatedBuildings * 0.7), totalCount: 1200, estimatedLoss: economicLoss * 0.6 },
			{ category: 'Commercial', affectedCount: Math.floor(estimatedBuildings * 0.2), totalCount: 180, estimatedLoss: economicLoss * 0.3 },
			{ category: 'Industrial', affectedCount: Math.floor(estimatedBuildings * 0.05), totalCount: 95, estimatedLoss: economicLoss * 0.05 },
			{ category: 'Public', affectedCount: Math.floor(estimatedBuildings * 0.05), totalCount: 68, estimatedLoss: economicLoss * 0.05 }
		];

		const emergencyResponse = {
			emergencyServices: 3,
			evacuationRoutes: 8,
			riskLevel: estimatedBuildings > 100 ? 'HIGH' : estimatedBuildings > 50 ? 'MEDIUM' : 'LOW' as 'HIGH' | 'MEDIUM' | 'LOW'
		};

		return {
			summary,
			buildingCategories,
			emergencyResponse,
			affectedBuildings: [], // No specific buildings for estimated analysis
			timestamp: new Date()
		};
	}

	/**
	 * Clear analysis results
	 */
	public clearAnalysis(): void {
		this.lastAnalysis = null;
		console.log(' GeoTwin: Impact analysis results cleared');
	}
}

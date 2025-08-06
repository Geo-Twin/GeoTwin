import VectorAreaHandler from "~/lib/tile-processing/tile3d/handlers/VectorAreaHandler";
import DominicaBuildingDataLoader from "~/app/data/DominicaBuildingDataLoader";

// GeoTwin: Main thread instance for UI access
let mainThreadDataLoader: DominicaBuildingDataLoader | null = null;

/**
 * Initialize Dominica building data for GeoTwin
 * Call this during application startup
 */
export async function initializeDominicaData(geoJsonPath: string = '/data/dominica-buildings.geojson'): Promise<void> {
	try {
		console.log('GeoTwin: Loading Dominica building data...');

		// Initialize the data loader in VectorAreaHandler (for workers)
		await VectorAreaHandler.initializeDominicaData(geoJsonPath);

		// Also create a main thread instance for UI access
		console.log('Creating main thread data loader...');
		mainThreadDataLoader = new DominicaBuildingDataLoader();
		await mainThreadDataLoader.loadGeoJSONData(geoJsonPath);
		console.log(`Main thread data loader status: ${mainThreadDataLoader.isDataLoaded()}`);

		const dataLoader = VectorAreaHandler.getDominicaDataLoader();
		if (dataLoader && dataLoader.isDataLoaded() && mainThreadDataLoader.isDataLoaded()) {
			const buildingCount = dataLoader.getBuildingCount();
			const mainThreadBuildingCount = mainThreadDataLoader.getBuildingCount();
			const parishes = dataLoader.getLoadedParishes();

			console.log(`GeoTwin: Successfully loaded ${buildingCount} buildings from Dominica (worker)`);
			console.log(`GeoTwin: Successfully loaded ${mainThreadBuildingCount} buildings from Dominica (main thread)`);
			console.log(`GeoTwin: Parishes covered: ${parishes.join(', ')}`);
		} else {
			console.warn('GeoTwin: Failed to load Dominica building data');
			console.warn(`Worker loader: ${dataLoader?.isDataLoaded()}, Main thread loader: ${mainThreadDataLoader?.isDataLoaded()}`);
		}
	} catch (error) {
		console.error('GeoTwin: Error initializing Dominica data:', error);
		// Don't throw - allow app to continue without Dominica data
	}
}

/**
 * Get the main thread Dominica data loader (for UI access)
 */
export function getMainThreadDominicaDataLoader(): DominicaBuildingDataLoader | null {
	return mainThreadDataLoader;
}

/**
 * Check if Dominica data is loaded and ready
 */
export function isDominicaDataReady(): boolean {
	return mainThreadDataLoader ? mainThreadDataLoader.isDataLoaded() : false;
}

/**
 * Get statistics about loaded Dominica data
 */
export function getDominicaDataStats(): {
	isLoaded: boolean;
	buildingCount: number;
	parishes: string[];
} {
	if (!mainThreadDataLoader || !mainThreadDataLoader.isDataLoaded()) {
		return {
			isLoaded: false,
			buildingCount: 0,
			parishes: []
		};
	}

	return {
		isLoaded: true,
		buildingCount: mainThreadDataLoader.getBuildingCount(),
		parishes: mainThreadDataLoader.getLoadedParishes()
	};
}

/**
 * Test function to check main thread data loader status
 * Call from browser console: window.testMainThreadDataLoader()
 */
export function testMainThreadDataLoader(): void {
	console.log('🔧 Testing Main Thread Data Loader');
	console.log('==================================');
	console.log('Data loader exists:', !!mainThreadDataLoader);
	console.log('Data loader loaded:', mainThreadDataLoader?.isDataLoaded());
	console.log('Building count:', mainThreadDataLoader?.getBuildingCount());

	if (mainThreadDataLoader && mainThreadDataLoader.isDataLoaded()) {
		// Test a coordinate lookup
		const testCoords: [number, number] = [-61.3895119, 15.3001509];
		const result = mainThreadDataLoader.getBuildingInfo(testCoords);
		console.log('Test lookup result:', result);
	}
}

// Make test function available globally
if (typeof window !== 'undefined') {
	(window as any).testMainThreadDataLoader = testMainThreadDataLoader;
}

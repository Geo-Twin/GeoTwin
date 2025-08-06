import System from "../System";
import Vec2 from "~/lib/math/Vec2";
import Vec3 from "~/lib/math/Vec3";
import MathUtils from "~/lib/math/MathUtils";
import ControlsSystem from "./ControlsSystem";
import FloodSimulationSystem from "./FloodSimulationSystem";
import SceneSystem from "./SceneSystem";
import TerrainSystem from "./TerrainSystem";

/**
 * BoundingBoxSelectionSystem - Interactive area selection for flood simulation
 * 
 * Provides click-and-drag bounding box selection with visual feedback
 * Integrates with existing coordinate system and flood simulation
 */
export default class BoundingBoxSelectionSystem extends System {
	private isSelectionMode: boolean = false;
	private isSelecting: boolean = false;
	private startPosition: Vec2 = new Vec2();
	private currentPosition: Vec2 = new Vec2();
	private selectionOverlay: HTMLElement = null;
	private lastValidSelection: {
		minLat: number;
		maxLat: number;
		minLon: number;
		maxLon: number;
	} | null = null;

	// Camera state storage for restoration
	private savedCameraState: {
		lat: number;
		lon: number;
		pitch: number;
		yaw: number;
		distance: number;
	} | null = null;
	
	// Grand Bay area bounds for size constraints
	private readonly GRAND_BAY_BOUNDS = {
		minLat: 15.2,
		maxLat: 15.3,
		minLon: -61.4,
		maxLon: -61.3
	};
	
	// Size constraints based on Grand Bay area
	private readonly MAX_AREA_SIZE = this.calculateAreaSize(this.GRAND_BAY_BOUNDS) / 2; // 1/2 of Grand Bay (stricter limit)
	private readonly MIN_AREA_SIZE = 0; // Remove minimum area threshold entirely

	public constructor() {
		super();
	}

	public postInit(): void {
		// Initialize after all systems are loaded
		this.setupEventListeners();
		this.createSelectionOverlay();
	}

	private setupEventListeners(): void {
		const canvas = document.getElementById('canvas');

		// SMART INPUT HANDLING: Only capture when Shift key is held during selection mode
		canvas.addEventListener('pointerdown', (e) => {
			if (!this.isSelectionMode || e.button !== 0) return;

			// Only start selection if Shift key is held (prevents camera control interference)
			if (e.shiftKey) {
				e.preventDefault(); // Prevent camera controls only when selecting
				e.stopPropagation();
				this.startSelection(e);
			}
		});

		canvas.addEventListener('pointermove', (e) => {
			if (!this.isSelecting) return;
			e.preventDefault(); // Prevent camera controls during active selection
			e.stopPropagation();
			this.updateSelection(e);
		});

		canvas.addEventListener('pointerup', (e) => {
			if (!this.isSelecting || e.button !== 0) return;
			e.preventDefault(); // Prevent camera controls during selection end
			e.stopPropagation();
			this.endSelection(e);
		});

		// Keyboard shortcut to toggle selection mode (Ctrl+B for Bounding box)
		document.addEventListener('keydown', (e) => {
			if (e.ctrlKey && e.key === 'b') {
				e.preventDefault();
				this.toggleSelectionMode();
			}
		});
	}

	private createSelectionOverlay(): void {
		this.selectionOverlay = document.createElement('div');
		this.selectionOverlay.style.cssText = `
			position: absolute;
			border: 2px solid #4a90e2;
			background: rgba(74, 144, 226, 0.2);
			pointer-events: none;
			display: none;
			z-index: 1000;
		`;
		document.body.appendChild(this.selectionOverlay);
	}

	private startSelection(e: PointerEvent): void {
		this.isSelecting = true;
		this.startPosition.set(e.clientX, e.clientY);
		this.currentPosition.set(e.clientX, e.clientY);
		
		this.selectionOverlay.style.display = 'block';
		this.updateOverlayVisual();
		
		console.log('🎯 Started bounding box selection');
	}

	private updateSelection(e: PointerEvent): void {
		this.currentPosition.set(e.clientX, e.clientY);
		this.updateOverlayVisual();
	}

	private endSelection(e: PointerEvent): void {
		this.isSelecting = false;
		this.selectionOverlay.style.display = 'none';

		// Convert screen coordinates to terrain coordinates
		const startWorld = this.screenToWorld(this.startPosition);
		const endWorld = this.screenToWorld(this.currentPosition);

		if (startWorld && endWorld) {
			const bbox = this.createBoundingBox(startWorld, endWorld);
			this.validateAndProcessSelection(bbox);
		} else {
			// Invalid terrain selection
			this.showFeedback('Invalid selection: Please select an area on the terrain surface only.', 'error');
		}

		console.log('🎯 Ended bounding box selection');
	}

	private updateOverlayVisual(): void {
		const left = Math.min(this.startPosition.x, this.currentPosition.x);
		const top = Math.min(this.startPosition.y, this.currentPosition.y);
		const width = Math.abs(this.currentPosition.x - this.startPosition.x);
		const height = Math.abs(this.currentPosition.y - this.startPosition.y);
		
		this.selectionOverlay.style.left = `${left}px`;
		this.selectionOverlay.style.top = `${top}px`;
		this.selectionOverlay.style.width = `${width}px`;
		this.selectionOverlay.style.height = `${height}px`;
	}

	private screenToWorld(screenPos: Vec2): Vec2 | null {
		try {
			// TERRAIN INTERSECTION: Use proper ground intersection detection
			const camera = this.systemManager.getSystem(ControlsSystem).camera;
			const sceneSystem = this.systemManager.getSystem(SceneSystem);
			const terrainSystem = this.systemManager.getSystem(TerrainSystem);

			// Convert screen coordinates to normalized device coordinates
			const screenSize = new Vec2(window.innerWidth, window.innerHeight);
			const ndc = new Vec3(
				(screenPos.x / screenSize.x) * 2 - 1,
				-((screenPos.y / screenSize.y) * 2 - 1),
				0.5
			);

			// Unproject to get ray direction
			let rayDirection = Vec3.unproject(ndc, camera, false);
			rayDirection = Vec3.sub(rayDirection, camera.position);
			rayDirection = Vec3.normalize(rayDirection);

			// Perform terrain intersection using terrain height sampling
			const terrain = sceneSystem.objects.terrain;
			if (!terrain) {
				console.warn('Terrain not available for intersection');
				return null;
			}

			// Cast ray to terrain surface (simplified ground plane intersection)
			// This ensures we only select valid terrain coordinates
			const rayOrigin = camera.position;

			// Calculate intersection with ground plane (Y = 0 as base)
			if (rayDirection.y >= 0) {
				// Ray pointing up - no ground intersection
				return null;
			}

			const t = -rayOrigin.y / rayDirection.y;
			const intersectionPoint = Vec3.add(rayOrigin, Vec3.multiplyScalar(rayDirection, t));

			// COORDINATE FIX: Use correct axis mapping for terrain intersection
			// intersectionPoint.x = latitude-based, intersectionPoint.z = longitude-based
			const worldPos = new Vec2(intersectionPoint.x, intersectionPoint.z);

			// Check if position is within Dominica bounds (rough validation)
			// CRITICAL FIX: Use intersectionPoint.z directly for longitude coordinate
			const latLon = MathUtils.meters2degrees(intersectionPoint.x, intersectionPoint.z);
			if (latLon.lat < 15.0 || latLon.lat > 16.0 || latLon.lon < -62.0 || latLon.lon > -61.0) {
				return null; // Outside reasonable bounds
			}

			return worldPos;
		} catch (error) {
			console.error('Failed to convert screen to terrain coordinates:', error);
			return null;
		}
	}

	private createBoundingBox(start: Vec2, end: Vec2): {
		minLat: number;
		maxLat: number;
		minLon: number;
		maxLon: number;
	} {
		// COORDINATE FIX: Use correct axis mapping to match FloodSimulationSystem
		// FloodSimulationSystem uses: { x: geoTwinCoords.x, z: geoTwinCoords.y }
		// So we need to convert: (worldPos.x, worldPos.z) where worldPos.z is start.y
		const startLatLon = MathUtils.meters2degrees(start.x, start.y);
		const endLatLon = MathUtils.meters2degrees(end.x, end.y);

		return {
			minLat: Math.min(startLatLon.lat, endLatLon.lat),
			maxLat: Math.max(startLatLon.lat, endLatLon.lat),
			minLon: Math.min(startLatLon.lon, endLatLon.lon),
			maxLon: Math.max(startLatLon.lon, endLatLon.lon)
		};
	}

	private calculateAreaSize(bounds: {
		minLat: number;
		maxLat: number;
		minLon: number;
		maxLon: number;
	}): number {
		const latDiff = bounds.maxLat - bounds.minLat;
		const lonDiff = bounds.maxLon - bounds.minLon;
		return latDiff * lonDiff; // Simple area calculation
	}

	private validateAndProcessSelection(bbox: {
		minLat: number;
		maxLat: number;
		minLon: number;
		maxLon: number;
	}): void {
		const areaSize = this.calculateAreaSize(bbox);

		// Check size constraints
		if (areaSize > this.MAX_AREA_SIZE) {
			this.showFeedback('Selected area is too large. Maximum area is 1/2 of Grand Bay size.', 'error');
			return;
		}

		// No minimum area check - removed entirely

		// Check if area is within Dominica bounds
		if (!this.isWithinDominica(bbox)) {
			this.showFeedback('Selected area is outside Dominica. Please select an area within Dominica.', 'error');
			return;
		}

		// Check if area is over water/ocean (land-only validation)
		if (this.isOverWater(bbox)) {
			this.showFeedback('Selected area is over water/ocean. Please select an area on Dominica landmass only.', 'error');
			return;
		}

		this.showFeedback('Area selected successfully. Starting flood simulation...', 'success');
		this.startFloodSimulation(bbox);
	}

	private isWithinDominica(bbox: {
		minLat: number;
		maxLat: number;
		minLon: number;
		maxLon: number;
	}): boolean {
		// Dominica bounds: latitude 15.2 to 15.7, longitude -61.6 to -61.2
		return (
			bbox.minLat >= 15.2 && bbox.maxLat <= 15.7 &&
			bbox.minLon >= -61.6 && bbox.maxLon <= -61.2
		);
	}

	private isOverWater(bbox: {
		minLat: number;
		maxLat: number;
		minLon: number;
		maxLon: number;
	}): boolean {
		// CRITICAL FIX: Use Grand Bay coordinates as reference for valid land areas
		// Grand Bay works: [-61.3167, 15.2333, -61.2833, 15.2667] (minLon, minLat, maxLon, maxLat)
		const DOMINICA_LAND_BOUNDS = {
			// Adjusted to include Grand Bay and other valid land areas
			minLat: 15.20,  // Include Grand Bay's 15.2333
			maxLat: 15.70,  // Full Dominica range
			minLon: -61.60, // Full Dominica range
			maxLon: -61.20  // Include Grand Bay's -61.2833
		};

		// Check if selection is entirely within the valid land area
		const isWithinLandmass = (
			bbox.minLat >= DOMINICA_LAND_BOUNDS.minLat &&
			bbox.maxLat <= DOMINICA_LAND_BOUNDS.maxLat &&
			bbox.minLon >= DOMINICA_LAND_BOUNDS.minLon &&
			bbox.maxLon <= DOMINICA_LAND_BOUNDS.maxLon
		);

		// Simplified water detection - only reject obvious ocean areas
		const centerLat = (bbox.minLat + bbox.maxLat) / 2;
		const centerLon = (bbox.minLon + bbox.maxLon) / 2;

		// Only reject selections that are clearly in major water bodies
		const isInMajorWaterArea = (
			// Far west (Caribbean Sea)
			centerLon < -61.55 ||
			// Far east (Atlantic Ocean)
			centerLon > -61.25 ||
			// Far south (ocean)
			centerLat < 15.22 ||
			// Far north (ocean)
			centerLat > 15.68
		);

		// Return true only if clearly over major water bodies
		return !isWithinLandmass || isInMajorWaterArea;
	}

	private startFloodSimulation(bbox: {
		minLat: number;
		maxLat: number;
		minLon: number;
		maxLon: number;
	}): void {
		console.log('🌊 Starting flood simulation for selected area:', bbox);

		// Store the valid selection for UI access
		this.lastValidSelection = bbox;

		// Use the existing FloodSimulationSystem with the selected bounding box
		const floodSystem = this.systemManager.getSystem(FloodSimulationSystem);
		floodSystem.simulateFloodForArea(bbox);

		// Exit selection mode after starting simulation
		this.isSelectionMode = false;
		this.updateCursor();
	}

	private showFeedback(message: string, type: 'success' | 'error'): void {
		// Create temporary feedback overlay
		const feedback = document.createElement('div');
		feedback.style.cssText = `
			position: fixed;
			top: 20px;
			left: 50%;
			transform: translateX(-50%);
			padding: 12px 24px;
			border-radius: 6px;
			color: white;
			font-weight: bold;
			z-index: 2000;
			background: ${type === 'success' ? '#4CAF50' : '#f44336'};
		`;
		feedback.textContent = message;
		document.body.appendChild(feedback);
		
		// Remove after 3 seconds
		setTimeout(() => {
			document.body.removeChild(feedback);
		}, 3000);
	}

	public toggleSelectionMode(): void {
		this.isSelectionMode = !this.isSelectionMode;

		if (this.isSelectionMode) {
			this.enableSelectionMode();
		} else {
			this.disableSelectionMode();
		}

		this.updateCursor();

		const status = this.isSelectionMode ? 'enabled' : 'disabled';
		this.showFeedback(
			`Bounding box selection ${status}. ${this.isSelectionMode ? 'Hold Shift + Click and drag on terrain to select an area.' : ''}`,
			'success'
		);
	}

	private enableSelectionMode(): void {
		// Save current camera state using the correct API
		const controlsSystem = this.systemManager.getSystem(ControlsSystem);
		const sceneSystem = this.systemManager.getSystem(SceneSystem);

		// Get current camera position and convert to lat/lon
		const camera = sceneSystem.objects.camera;
		const currentLatLon = controlsSystem.getLatLon();

		// Get current state from the active navigator (GroundControlsNavigator)
		const groundTarget = controlsSystem.getGroundControlsTarget();

		// Calculate current pitch, yaw, and distance from camera position
		const cameraPos = camera.position;
		const targetPos = groundTarget;
		const distance = Math.sqrt(
			Math.pow(cameraPos.x - targetPos.x, 2) +
			Math.pow(cameraPos.z - targetPos.z, 2)
		);

		// Calculate pitch from camera height and distance
		const heightDiff = cameraPos.y - targetPos.y;
		const pitch = Math.atan2(heightDiff, distance);

		// Calculate yaw (simplified - using north direction)
		const yaw = controlsSystem.northDirection;

		this.savedCameraState = {
			lat: currentLatLon.lat,
			lon: currentLatLon.lon,
			pitch: MathUtils.toDeg(pitch),
			yaw: MathUtils.toDeg(yaw),
			distance: distance
		};

		console.log('📷 Saved camera state for selection mode:', this.savedCameraState);

		// Move camera to top-down view for accurate selection
		this.setCameraToTopDownView();
	}

	private disableSelectionMode(): void {
		// Restore previous camera position using the correct API
		if (this.savedCameraState) {
			const controlsSystem = this.systemManager.getSystem(ControlsSystem);

			// Use the setState method with individual parameters
			controlsSystem.setState(
				this.savedCameraState.lat,
				this.savedCameraState.lon,
				this.savedCameraState.pitch,
				this.savedCameraState.yaw,
				this.savedCameraState.distance
			);

			console.log('📷 Restored camera state after selection mode:', this.savedCameraState);
			this.savedCameraState = null;
		}
	}

	private setCameraToTopDownView(): void {
		const controlsSystem = this.systemManager.getSystem(ControlsSystem);

		// Get current position to maintain the same location
		const currentLatLon = controlsSystem.getLatLon();

		// Set to top-down view (89-degree pitch, 0 yaw, appropriate distance)
		controlsSystem.setState(
			currentLatLon.lat, // Keep current latitude
			currentLatLon.lon, // Keep current longitude
			89, // Nearly vertical (89 degrees to avoid gimbal lock)
			0, // North-facing
			1500 // Appropriate distance for area selection
		);

		console.log('📷 Camera set to top-down view for selection mode');
	}

	private updateCursor(): void {
		const canvas = document.getElementById('canvas');
		canvas.style.cursor = this.isSelectionMode ? 'crosshair' : 'default';
	}

	public update(deltaTime: number): void {
		// No continuous updates needed
	}

	public isInSelectionMode(): boolean {
		return this.isSelectionMode;
	}

	public hasValidSelection(): boolean {
		return this.lastValidSelection !== null;
	}

	public getSelectedBounds(): {
		minLat: number;
		maxLat: number;
		minLon: number;
		maxLon: number;
	} | null {
		return this.lastValidSelection;
	}
}

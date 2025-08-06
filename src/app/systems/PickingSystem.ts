import Vec2 from "~/lib/math/Vec2";
import Tile from "../objects/Tile";
import System from "../System";
import CursorStyleSystem from "./CursorStyleSystem";
import TileSystem from "./TileSystem";
import UISystem from "./UISystem";
import TileObjectsSystem from "./TileObjectsSystem";
import TileBuilding from "../world/TileBuilding";
import VectorAreaHandler from "~/lib/tile-processing/tile3d/handlers/VectorAreaHandler";
import { DominicaBuildingMatch } from "~/app/data/DominicaBuildingDataLoader";

export default class PickingSystem extends System {
	private enablePicking: boolean = true;
	private hoveredObjectId: number = 0;
	private selectedObjectId: number = 0;
	private pointerDownPosition: Vec2 = new Vec2();
	public selectedTileBuilding: TileBuilding = null;
	public pointerPosition: Vec2 = new Vec2();
	public selectedBuildingCoordinates: [number, number] | null = null;
	public selectedBuildingDominicaData: DominicaBuildingMatch | null = null;

	// GeoTwin: Global instance for UI access
	private static instance: PickingSystem | null = null;

	public constructor() {
		super();

		// GeoTwin: Set global instance
		PickingSystem.instance = this;

		const canvas = document.getElementById('canvas');

		canvas.addEventListener('pointerdown', e => {
			if (e.button !== 0) {
				return;
			}

			this.updatePointerPositionFromEvent(e, true);
		});

		canvas.addEventListener('pointermove', e => {
			this.updatePointerPositionFromEvent(e);
		});

		canvas.addEventListener('pointerup', e => {
			if (e.button !== 0) {
				return;
			}

			this.updatePointerPositionFromEvent(e);

			if (this.pointerDownPosition.x === this.pointerPosition.x && this.pointerDownPosition.y === this.pointerPosition.y) {
				this.onClick();
			}
		});

		canvas.addEventListener('mouseenter', e => {
			this.enablePicking = true;
		});

		canvas.addEventListener('mouseleave', e => {
			this.enablePicking = false;
		});
	}

	public postInit(): void {

	}

	private updatePointerPositionFromEvent(e: PointerEvent, updatePointerDown: boolean = false): void {
		if (document.pointerLockElement !== null) {
			this.pointerPosition.x = Math.floor(window.innerWidth / 2);
			this.pointerPosition.y = Math.floor(window.innerHeight / 2);
		} else {
			this.pointerPosition.x = e.clientX;
			this.pointerPosition.y = e.clientY;
		}

		if (updatePointerDown) {
			this.pointerDownPosition.x = this.pointerPosition.x;
			this.pointerDownPosition.y = this.pointerPosition.y;
		}
	}

	public readObjectId(buffer: Uint32Array): void {
		this.hoveredObjectId = buffer[0];
		this.updatePointer();
	}

	public clearHoveredObjectId(): void {
		this.hoveredObjectId = 0;
		this.updatePointer();
	}

	private updatePointer(): void {
		if (this.hoveredObjectId > 0 && this.enablePicking) {
			this.systemManager.getSystem(CursorStyleSystem).enablePointer();
		} else {
			this.systemManager.getSystem(CursorStyleSystem).disablePointer();
		}
	}

	private onClick(): void {
		if (this.hoveredObjectId === 0 || this.hoveredObjectId === this.selectedObjectId) {
			this.clearSelection();
			return;
		}

		if (this.hoveredObjectId !== 0) {
			this.selectedObjectId = this.hoveredObjectId;

			const selectedValue = this.selectedObjectId - 1;

			const localTileId = selectedValue >> 16;
			const tile = this.systemManager.getSystem(TileSystem).getTileByLocalId(localTileId);
			const localFeatureId = selectedValue & 0xffff;
			const packedFeatureId = tile.buildingLocalToPackedMap.get(localFeatureId);

			const [type, id] = Tile.unpackFeatureId(packedFeatureId);

			const tileObjectsSystem = this.systemManager.getSystem(TileObjectsSystem);
			this.selectedTileBuilding = tileObjectsSystem.getTileBuildingByPackedId(packedFeatureId);

			// GeoTwin: Try to get building coordinates and Dominica data
			this.fetchBuildingDominicaData(tile, localFeatureId);

			this.systemManager.getSystem(UISystem).setActiveFeature(type, id);
		}
	}

	public clearSelection(): void {
		this.selectedObjectId = 0;
		this.selectedTileBuilding = null;
		this.selectedBuildingCoordinates = null;
		this.selectedBuildingDominicaData = null;
		this.systemManager.getSystem(UISystem).clearActiveFeature();
	}

	// GeoTwin: Fetch building coordinates and Dominica data
	private async fetchBuildingDominicaData(tile: any, localFeatureId: number): Promise<void> {
		try {
			// Reset previous data
			this.selectedBuildingCoordinates = null;
			this.selectedBuildingDominicaData = null;

			// Get the building's geometry from the tile
			// This is a simplified approach - in a real implementation, you'd need to
			// extract the actual building coordinates from the tile's geometry data

			// For now, we'll use a placeholder coordinate conversion
			// You may need to enhance this based on your tile coordinate system
			const tileCoordinates = this.estimateBuildingCoordinates(tile, localFeatureId);

			if (tileCoordinates) {
				this.selectedBuildingCoordinates = tileCoordinates;

				// Get Dominica data
				const dataLoader = VectorAreaHandler.getDominicaDataLoader();
				if (dataLoader && dataLoader.isDataLoaded()) {
					this.selectedBuildingDominicaData = dataLoader.getBuildingInfo(tileCoordinates);
				}
			}
		} catch (error) {
			console.warn('GeoTwin: Failed to fetch building Dominica data:', error);
		}
	}

	// GeoTwin: Estimate building coordinates from tile data
	private estimateBuildingCoordinates(tile: any, localFeatureId: number): [number, number] | null {
		// This is a placeholder implementation
		// In a real implementation, you'd extract the actual building centroid
		// from the tile's geometry data based on the localFeatureId

		// For now, return null - the UI will fall back to OSM API coordinate extraction
		return null;
	}

	public update(deltaTime: number): void {

	}

	// GeoTwin: Static getter for UI access
	public static getInstance(): PickingSystem | null {
		return PickingSystem.instance;
	}
}
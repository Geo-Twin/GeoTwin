// Building LOD system was CRUCIAL for getting good performance with flood viz
// When you got thousands of buildings AND flood planes rendering,
// you gotta be smart about what details actually matter
//
// LOD 1 = white blocks (emergency mode - just show the shapes)
// LOD 2 = white facades with roof shapes (balanced performance)
// LOD 3 = full detail (when you got the GPU power to spare)
//
// The trick was making sure the transitions don't break flood impact analysis
// Buildings still need to be selectable and show proper flood data
// regardless of their visual detail level

import System from "../System";
import SettingsSystem from "./SettingsSystem";
import TileSystem from "./TileSystem";

export enum BuildingLOD {
	LOD1 = 'lod1', // White facades with roof shapes
	LOD2 = 'lod2', // Simple white blocks (no roof shapes)
	LOD3 = 'lod3'  // Full detail (current state)
}

export interface LODSettings {
	level: BuildingLOD;
	forceWhiteFacades: boolean;
	disableRoofShapes: boolean;
	forceWhiteRoofs: boolean;
}

export default class BuildingLODSystem extends System {
	private currentLOD: BuildingLOD = BuildingLOD.LOD3;
	private static instance: BuildingLODSystem | null = null;

	public constructor() {
		super();
		BuildingLODSystem.instance = this;
		console.log('BuildingLODSystem: Constructor called');
	}

	public postInit(): void {
		console.log('BuildingLODSystem: postInit called');
		this.listenToSettings();
	}

	private listenToSettings(): void {
		const settings = this.systemManager.getSystem(SettingsSystem).settings;

		// Get initial value
		const initialSetting = settings.get('buildingLOD');
		if (initialSetting) {
			this.currentLOD = initialSetting.statusValue as BuildingLOD;
			console.log(`BuildingLODSystem: Initial LOD set to ${this.currentLOD}`);
		}

		settings.onChange('buildingLOD', ({ statusValue }) => {
			const newLOD = statusValue as BuildingLOD;

			console.log(`GeoTwin: LOD setting changed to ${newLOD} (current: ${this.currentLOD})`);

			if (newLOD !== this.currentLOD) {
				console.log(`🏗️ GeoTwin: Building LOD changed from ${this.currentLOD} to ${newLOD}`);
				this.currentLOD = newLOD;
				this.applyLODChanges();
			}
		}, true);
	}

	private applyLODChanges(): void {
		// Force reload of all tiles to apply new LOD settings
		const tileSystem = this.systemManager.getSystem(TileSystem);
		console.log(`GeoTwin: Purging tiles to apply LOD ${this.currentLOD}`);
		tileSystem.purgeTiles();
	}

	public getCurrentLOD(): BuildingLOD {
		return this.currentLOD;
	}

	public getLODSettings(): LODSettings {
		switch (this.currentLOD) {
			case BuildingLOD.LOD1:
				// LOD 1: Lowest detail - Simple white blocks
				return {
					level: BuildingLOD.LOD1,
					forceWhiteFacades: true,
					disableRoofShapes: true,
					forceWhiteRoofs: true
				};

			case BuildingLOD.LOD2:
				// LOD 2: Medium detail - White facades with roof shapes
				return {
					level: BuildingLOD.LOD2,
					forceWhiteFacades: true,
					disableRoofShapes: false,
					forceWhiteRoofs: false
				};

			case BuildingLOD.LOD3:
			default:
				// LOD 3: Highest detail - Full detail
				return {
					level: BuildingLOD.LOD3,
					forceWhiteFacades: false,
					disableRoofShapes: false,
					forceWhiteRoofs: false
				};
		}
	}

	// Static method to get current LOD settings from anywhere in the codebase
	public static getCurrentLODSettings(): LODSettings {
		if (BuildingLODSystem.instance) {
			return BuildingLODSystem.instance.getLODSettings();
		}

		// Fallback to LOD3 if system not initialized
		return {
			level: BuildingLOD.LOD3,
			forceWhiteFacades: false,
			disableRoofShapes: false,
			forceWhiteRoofs: false
		};
	}

	// GeoTwin: Manual LOD setter for testing
	public static setLODForTesting(lod: BuildingLOD): void {
		if (BuildingLODSystem.instance) {
			console.log(`🏗️ Manual LOD change: ${BuildingLODSystem.instance.currentLOD} → ${lod}`);
			BuildingLODSystem.instance.currentLOD = lod;
			BuildingLODSystem.instance.applyLODChanges();
		}
	}

	public update(deltaTime: number): void {
		// No continuous updates needed
	}
}

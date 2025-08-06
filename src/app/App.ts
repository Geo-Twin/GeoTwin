import RenderSystem from "./systems/RenderSystem";
import TileSystem from "./systems/TileSystem";
import ControlsSystem from "./systems/ControlsSystem";
import PickingSystem from "./systems/PickingSystem";
import CursorStyleSystem from './systems/CursorStyleSystem';
import SystemManager from "./SystemManager";
import TileObjectsSystem from "./systems/TileObjectsSystem";
import TileLoadingSystem from "./systems/TileLoadingSystem";
import MapWorkerSystem from "./systems/MapWorkerSystem";
import MapTimeSystem from "./systems/MapTimeSystem";
import UISystem from "./systems/UISystem";
import SceneSystem from './systems/SceneSystem';
import ResourceLoader, {ResourceJSON} from './world/ResourceLoader';
import resourcesList from '../resources/resources.json';
import TerrainSystem from "./systems/TerrainSystem";
import SettingsSystem from "~/app/systems/SettingsSystem";
import SlippyMapSystem from "~/app/systems/SlippyMapSystem";
import BuildingLODSystem from "~/app/systems/BuildingLODSystem";
import FloodSimulationSystem from "~/app/systems/FloodSimulationSystem";
import BoundingBoxSelectionSystem from "~/app/systems/BoundingBoxSelectionSystem";
import { initializeDominicaData } from "~/app/data/initializeDominicaData";


class App {
	private loop = (deltaTime: number): void => this.update(deltaTime);
	private time = 0;
	private systemManager: SystemManager;

	public constructor() {
		this.init();

		// CRITICAL FIX: Expose SystemManager globally for UI components
		(window as any).app = this;
	}

	// CRITICAL FIX: Expose SystemManager getter for UI components
	public get systemManagerInstance(): SystemManager {
		return this.systemManager;
	}

	private init(): void {
		this.systemManager = new SystemManager();

		this.systemManager.addSystems(SettingsSystem);
		this.systemManager.addSystems(UISystem);

		ResourceLoader.addFromJSON(resourcesList as ResourceJSON);
		ResourceLoader.load({
			onFileLoad: (loaded: number, total: number) => {
				this.systemManager.getSystem(UISystem).setResourcesLoadingProgress(loaded / total);
			},
			onLoadedFileNameChange: (name: string) => {
				this.systemManager.getSystem(UISystem).setResourceInProgressPath(name);
			}
		}).then(async () => {
			// GeoTwin: Initialize Dominica building data
			await initializeDominicaData('/misc/dominica-buildings.geojson');

			this.systemManager.addSystems(
				ControlsSystem,
				MapTimeSystem,
				TerrainSystem,
				TileSystem,
				SceneSystem,
				CursorStyleSystem,
				PickingSystem,
				TileObjectsSystem,
				SlippyMapSystem,
				BuildingLODSystem, // GeoTwin: Building Level of Detail system
				FloodSimulationSystem, // GeoTwin: FastFlood API integration system
				BoundingBoxSelectionSystem, // GeoTwin: Interactive area selection for flood simulation
				RenderSystem,
				MapWorkerSystem,
				TileLoadingSystem,
			);
		});

		this.update();
	}

	private update(rafTime = 0): void {
		requestAnimationFrame(this.loop);

		const frameStart = performance.now();
		const deltaTime = (rafTime - this.time) / 1e3;
		this.time = rafTime;

		this.systemManager.updateSystems(deltaTime);

		const frameTime = performance.now() - frameStart;
		this.systemManager.getSystem(UISystem).updateFrameTime(frameTime);
	}
}

export default new App;

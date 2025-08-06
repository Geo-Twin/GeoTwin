import System from "../System";
import MapWorkerSystem from "./MapWorkerSystem";
import Tile3DBuffers from "~/lib/tile-processing/tile3d/buffers/Tile3DBuffers";
import Config from "~/app/Config";
import MapWorker from "~/app/world/worker/MapWorker";
import TileSystem from "~/app/systems/TileSystem";
import Vec2 from "~/lib/math/Vec2";
import SettingsSystem from "~/app/systems/SettingsSystem"; // GeoTwin: For LOD settings

export interface OverpassEndpoint {
	url: string;
	isEnabled: boolean;
	isUserDefined: boolean;
}

export default class TileLoadingSystem extends System {
	private readonly overpassEndpointsDefault: OverpassEndpoint[] = [];
	public overpassEndpoints: OverpassEndpoint[] = [];

	public constructor() {
		super();

		for (const {url, isEnabled} of Config.OverpassEndpoints) {
			const endpoint: OverpassEndpoint = {
				url: url,
				isEnabled: isEnabled,
				isUserDefined: false
			};

			this.overpassEndpointsDefault.push(endpoint);
		}

		try {
			const lsEndpoints = JSON.parse(localStorage.getItem('overpassEndpoints'));

			if (Array.isArray(lsEndpoints)) {
				for (const endpoint of lsEndpoints) {
					this.overpassEndpoints.push({
						url: String(endpoint.url),
						isEnabled: Boolean(endpoint.isEnabled),
						isUserDefined: Boolean(endpoint.isUserDefined),
					});
				}
			}
		} catch (e) {
			console.error(e);
		}

		for (const endpoint of this.overpassEndpointsDefault) {
			if (!this.overpassEndpoints.some(e => e.url === endpoint.url)) {
				this.overpassEndpoints.push(endpoint);
			}
		}
	}

	public postInit(): void {

	}

	public async fetchTilesTimestamp(): Promise<Date> {
		// For GeoTwin, we'll use a fallback timestamp since we're using OpenStreetMap data
		// which doesn't have a single timestamp endpoint
		if (!Config.TileServerEndpoint) {
			console.log('No tile server endpoint configured, using current date for data timestamp');
			return new Date(); // Use current date as fallback
		}

		const url = `${Config.TileServerEndpoint}/vector.timestamp`;
		let timestamp: Date = null;

		try {
			const response = await fetch(url);

			if (response.status === 200) {
				const text = await response.text();
				timestamp = new Date(text.replace(/\n/g, ''));
			} else {
				console.warn(`Failed to fetch vector tiles timestamp. Status: ${response.status}. Using current date as fallback.`);
				timestamp = new Date(); // Use current date as fallback
			}
		} catch (e) {
			console.warn('Failed to fetch tiles timestamp, using current date as fallback:', e);
			timestamp = new Date(); // Use current date as fallback
		}

		return timestamp;
	}

	public setOverpassEndpoints(endpoints: OverpassEndpoint[]): void {
		this.overpassEndpoints = endpoints;
		localStorage.setItem('overpassEndpoints', JSON.stringify(endpoints));
	}

	public resetOverpassEndpoints(): void {
		this.overpassEndpoints = this.overpassEndpointsDefault;
	}

	private getNextOverpassEndpoint(): string {
		const urls = this.overpassEndpoints
			.filter(endpoint => endpoint.isEnabled)
			.map(endpoint => endpoint.url);

		if (urls.length === 0) {
			return null;
		}

		return urls[Math.floor(Math.random() * urls.length)];
	}

	public update(deltaTime: number): void {
		const mapWorkerSystem = this.systemManager.getSystem(MapWorkerSystem);
		const tileSystem = this.systemManager.getSystem(TileSystem);

		const queuedTile = tileSystem.getNextTileToLoad();
		const worker = mapWorkerSystem.getFreeWorker();
		const overpassEndpoint = this.getNextOverpassEndpoint();

		if (queuedTile && worker && overpassEndpoint) {
			// GeoTwin: Get current building LOD setting
			const settings = this.systemManager.getSystem(SettingsSystem).settings;
			const buildingLOD = settings.get('buildingLOD')?.statusValue || 'lod3';

			this.loadTile({
				tile: queuedTile.position,
				onBeforeLoad: queuedTile.onBeforeLoad,
				onLoad: queuedTile.onLoad,
				worker: worker,
				overpassEndpoint: overpassEndpoint,
				isTerrainHeightEnabled: tileSystem.enableTerrainHeight,
				buildingLOD: buildingLOD // GeoTwin: Pass LOD to worker
			});
		}
	}

	private async loadTile(
		{
			tile,
			onBeforeLoad,
			onLoad,
			worker,
			overpassEndpoint,
			isTerrainHeightEnabled,
			buildingLOD
		}: {
			tile: Vec2;
			onBeforeLoad: () => Promise<any>;
			onLoad: (buffers: Tile3DBuffers) => void;
			worker: MapWorker;
			overpassEndpoint: string;
			isTerrainHeightEnabled: boolean;
			buildingLOD: string; // GeoTwin: Building LOD level
		}
	): Promise<void> {
		await onBeforeLoad();

		worker.requestTile(tile.x, tile.y, {
			overpassEndpoint: overpassEndpoint,
			tileServerEndpoint: Config.TileServerEndpoint,
			vectorTilesEndpointTemplate: Config.TilesEndpointTemplate,
			isTerrainHeightEnabled: isTerrainHeightEnabled,
			buildingLOD: buildingLOD // GeoTwin: Pass LOD to worker
		}).then(result => {
			onLoad(result);
		}, error => {
			//console.error(`Failed to load tile ${tile.x},${tile.y}. Retrying...`, error);
			onLoad(null);
		});
	}
}

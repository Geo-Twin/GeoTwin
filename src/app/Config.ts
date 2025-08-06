import {SettingsSchema, SettingsSchemaRangeScale} from "~/app/settings/SettingsSchema";

const Config = {
	TileSize: /*40075016.68 / (1 << 16)*/ 611.4962158203125,
	MaxConcurrentTiles: 150,
	MaxTilesPerWorker: 1,
	WorkersCount: Math.min(4, navigator.hardwareConcurrency),
	StartPosition: {lat: 15.414999, lon: -61.370976, pitch: 45, yaw: 0, distance: 2000},
	MinCameraDistance: 10,
	MaxCameraDistance: 4000,
	SlippyMapTransitionDuration: 400,
	MinFreeCameraHeight: 10,
	CameraZoomSmoothing: 0.4,
	CameraZoomSpeed: 0.0005,
	CameraZoomTrackpadFactor: 4,
	MinCameraPitch: 5,
	MaxCameraPitch: 89.99,
	MinFreeCameraPitch: -89.99,
	MaxFreeCameraPitch: 89.99,
	GroundCameraSpeed: 400,
	GroundCameraSpeedFast: 1200,
	FreeCameraSpeed: 400,
	FreeCameraSpeedFast: 1200,
	FreeCameraRotationSensitivity: 0.00002,
	FreeCameraYawSpeed: 0.8,
	FreeCameraPitchSpeed: 0.8,
	MinTexturedRoofArea: 50,
	MaxTexturedRoofAABBArea: 2e6,
	BuildingSmoothNormalsThreshold: 30,
	LightTransitionDuration: 1,
	OverpassRequestTimeout: 30000,
	CameraFOVZoomFactor: 2,
	// GeoTwin: CSM shadow constants removed for performance optimization
	TerrainRingCount: 6,
	TerrainRingSegmentCount: 64,
	TerrainRingSizeZoom: 13,
	TerrainRingSize: 40075016.68 / (1 << 13),
	TerrainMaskResolution: 32,
	TerrainNormalMixRange: [10000, 14500],
	TerrainUsageTextureSize: 512,
	TerrainUsageTexturePadding: 3,
	TerrainUsageSDFPasses: 3,
	TerrainDetailUVScale: 64,
	SlippyMapMinZoom: 0,
	SlippyMapMaxZoom: 16,
	SlippyMapZoomFactor: 0.001,
	SlippyMapFetchBatchSize: 4,
	SettingsSchema: {
		fov: {
			label: 'FOV Angle / Zoom level',
			selectRange: [5, 120, 1],
			selectRangeDefault: 40,
			category: 'general'
		},
		labels: {
			label: 'Text labels',
			status: ['off', 'on'],
			statusLabels: ['Disabled', 'Enabled'],
			statusDefault: 'on',
			category: 'general'
		},
		terrainHeight: {
			label: 'Use terrain elevation data',
			status: ['off', 'on'],
			statusLabels: ['Disabled', 'Enabled'],
			statusDefault: 'on',
			category: 'general'
		},
		buildingLOD: {
			label: 'Building Detail Level',
			status: ['lod1', 'lod2', 'lod3'],
			statusLabels: ['LOD 1', 'LOD 2', 'LOD 3'],
			statusDefault: 'lod3',
			category: 'general'
		},
		// GeoTwin: Removed unused graphics features for performance optimization
	} as SettingsSchema,
	OverpassEndpoints: [
		{url: 'https://overpass-api.de/api/interpreter', isEnabled: true},
		{url: 'https://overpass.openstreetmap.ru/cgi/interpreter', isEnabled: false},
		{url: 'https://overpass.kumi.systems/api/interpreter', isEnabled: false}
	],
	TileServerEndpoint: process.env.TILE_SERVER_ENDPOINT,
	SlippyEndpointTemplate: 'https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
	TilesEndpointTemplate: process.env.TILES_ENDPOINT_TEMPLATE
};

export default Config;

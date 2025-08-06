# GeoTwin Dominica Building Data Integration

This module integrates Dominica's building data (GeoJSON) with the GeoTwin building rendering system.

## Features

- **Spatial Matching**: Efficiently matches OSM buildings with Dominica GeoJSON data using spatial indexing
- **Material Mapping**: Maps Dominica roof/wall materials to GeoTwin textures
- **Shape Override**: Uses Dominica roof shapes instead of generic defaults
- **Color Enhancement**: Applies realistic colors based on building materials
- **Performance Optimized**: 24MB GeoJSON with 38k buildings loads efficiently

## Usage

### 1. Initialize Data (App Startup)

```typescript
import { initializeDominicaData } from '~/app/data/initializeDominicaData';

// During app initialization
await initializeDominicaData('/data/dominica-buildings.geojson');
```

### 2. Check Status

```typescript
import { isDominicaDataReady, getDominicaDataStats } from '~/app/data/initializeDominicaData';

if (isDominicaDataReady()) {
    const stats = getDominicaDataStats();
    console.log(`Loaded ${stats.buildingCount} buildings from ${stats.parishes.length} parishes`);
}
```

## Data Mapping

### Roof Types
- `Concrete` → Concrete texture with gray color
- `Metal/Steel/Zinc` → Metal texture with dark gray color  
- `Tile/Clay` → Tiles texture with brown color
- `Thatch/Palm` → Thatch texture with burlywood color

### Roof Shapes
- `Flat_shape` → Flat roof (1.0x height)
- `Gable` → Gabled roof (1.3x height)
- `Hip` → Hipped roof (1.2x height)
- `Pyramid` → Pyramidal roof (1.25x height)

### Construction Types (Walls)
- `Concrete` → Concrete facade with silver color
- `Wood/Timber` → Wood facade with tan color
- `Brick` → Brick facade with fire brick color
- `Block/Cement` → Cement block facade

### Occupancy Types
- `Hospital/School/Church/Government` → Institutional (taller buildings)
- `Commercial/Shop/Store/Business` → Commercial (medium height)
- `Industrial/Factory/Warehouse` → Industrial (high ceiling)
- `Residential/House/Home` → Residential (height based on area)

## File Structure

```
src/app/data/
├── DominicaBuildingDataLoader.ts    # Core data loading and matching
├── initializeDominicaData.ts        # Initialization utilities
└── README.md                        # This file
```

## Performance

- **Spatial Indexing**: 100m grid cells for fast spatial queries
- **Memory Efficient**: Only loads building data once, shared across all handlers
- **Fallback System**: Gracefully handles missing data, continues with defaults
- **Confidence Scoring**: Uses distance-based confidence for data quality

## Integration Points

The system integrates at these points in the building rendering pipeline:

1. **Roof Material Override**: Replaces generic roof textures with Dominica materials
2. **Roof Shape Override**: Uses Dominica roof shapes instead of flat defaults
3. **Color Enhancement**: Applies realistic colors from material types
4. **Height Adjustment**: Uses occupancy-based height estimates
5. **UI Click Integration**: Shows combined OSM + Dominica data when buildings are clicked

## Click Functionality

When you click on a building in the 3D view:

- **Selection Panel** displays combined OSM and Dominica data
- **Dominica data** is highlighted with 🏝️ prefix and green background
- **Enhanced building type** based on Dominica occupancy data
- **Material information** from local survey data
- **Confidence score** showing data quality match

### Example Click Data Display:

```
Hospital · Way №12345 · 🏝️ Enhanced with Dominica data

🏝️ dominica:roof_material    metal
🏝️ dominica:roof_shape      hipped
🏝️ dominica:wall_material   concrete
🏝️ dominica:occupancy       institutional
🏝️ dominica:confidence      95.2%
🏝️ dominica:height          12m
🏝️ dominica:roof_color      #4a4a4a
```

## Coordinate System Notes

The current implementation assumes your GeoJSON coordinates match the tile coordinate system. You may need to adjust the coordinate transformation in `getDominicaBuildingData()` method based on your specific coordinate system (UTM, WGS84, etc.).

## Example GeoJSON Structure

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "BUILDING_MA": "_10666",
        "OBJECTID": 10670,
        "NAME": "",
        "X": -61.3856,
        "Y": 15.3063,
        "PARISH": "St._Luke",
        "COMMUNITY": "Goodwill", 
        "OCCUPANCY": "Hospital",
        "ROOF_TYPE": "Concrete",
        "ROOF_SHAPE": "Flat_shape",
        "CONSTR_TYP": "Concrete",
        "AREA": 671.645,
        "VALUE": 503734
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [...]
      }
    }
  ]
}
```

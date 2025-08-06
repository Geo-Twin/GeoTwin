import React, { useState, useEffect } from 'react';
import {
  Stack,
  Text,
  Group,
  Box,
  Badge,
  Button
} from '@mantine/core';
import { IconEye, IconWaveSquare, IconMap, IconRefresh, IconTrash } from '@tabler/icons-react';
import SystemManager from '~/app/SystemManager';
import FloodSimulationSystem from '~/app/systems/FloodSimulationSystem';

// CSS for custom controls - using working patterns
const controlsCSS = `
.flood-slider {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.15);
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  margin: 8px 0;
}

.flood-slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #4a90e2;
  cursor: pointer;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.flood-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #4a90e2;
  cursor: pointer;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.flood-slider:hover::-webkit-slider-thumb {
  background: #357abd;
}

.flood-slider:hover::-moz-range-thumb {
  background: #357abd;
}

.flood-slider:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.flood-checkbox {
  width: 16px;
  height: 16px;
  background-color: transparent;
  border: 2px solid #4a90e2;
  border-radius: 3px;
  cursor: pointer;
  position: relative;
  margin-right: 8px;
}

.flood-checkbox:checked {
  background-color: #4a90e2;
}

.flood-checkbox:checked::after {
  content: '✓';
  position: absolute;
  top: -2px;
  left: 1px;
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.flood-checkbox:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
`;

// Inject CSS
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = controlsCSS;
  if (!document.head.querySelector('style[data-flood-controls]')) {
    styleElement.setAttribute('data-flood-controls', 'true');
    document.head.appendChild(styleElement);
  }
}

const toFixedWithoutZeros = (num: number, precision: number): string => {
	return num.toFixed(precision).replace(/(\.0+|0+)$/, '');
};

const FloodControls: React.FC = () => {
	// State management for visualization controls
	const [floodOpacity, setFloodOpacity] = useState(70); // 0-100 percentage
	const [showFlowVectors, setShowFlowVectors] = useState(false);
	const [showDepthContours, setShowDepthContours] = useState(true);
	const [isDataAvailable, setIsDataAvailable] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	// Get flood simulation system for integration using proper access pattern
	const [floodSystem, setFloodSystem] = useState<FloodSimulationSystem | null>(null);

	// Check for available flood data on component mount and updates
	useEffect(() => {
		// Access SystemManager through global app instance (same pattern as other components)
		const getSystemManager = (): SystemManager | null => {
			if ((window as any).app && (window as any).app.systemManagerInstance) {
				return (window as any).app.systemManagerInstance;
			}
			return null;
		};

		const manager = getSystemManager();
		if (manager) {
			const floodSimSystem = manager.getSystem(FloodSimulationSystem);
			setFloodSystem(floodSimSystem);

			if (floodSimSystem) {
				const hasData = floodSimSystem.getState().lastResults !== null;
				setIsDataAvailable(hasData);
			}
		}
	}, []);

	// Update data availability when flood system changes
	useEffect(() => {
		if (floodSystem) {
			const hasData = floodSystem.getState().lastResults !== null;
			setIsDataAvailable(hasData);
		}
	}, [floodSystem]);

	// Handle opacity changes with WebGL integration
	const handleOpacityChange = (value: number): void => {
		setFloodOpacity(value);
		// TODO: Integrate with WebGL flood rendering system
		// This would update the flood plane opacity in the rendering pipeline
		console.log(`🎨 GeoTwin: Flood opacity changed to ${value}%`);
	};

	// Handle flow vectors toggle with qout.tif integration
	const handleFlowVectorsToggle = (checked: boolean): void => {
		setShowFlowVectors(checked);
		// TODO: Integrate with qout.tif flow data visualization
		console.log(`🌊 GeoTwin: Flow vectors ${checked ? 'enabled' : 'disabled'}`);
	};

	// Handle depth contours toggle with whout.tif integration
	const handleDepthContoursToggle = (checked: boolean): void => {
		setShowDepthContours(checked);
		// TODO: Integrate with whout.tif depth contour visualization
		console.log(`📊 GeoTwin: Depth contours ${checked ? 'enabled' : 'disabled'}`);
	};

	// Refresh visualization data - connect to actual flood system
	const handleRefreshVisualization = async (): Promise<void> => {
		if (!floodSystem) return;

		setIsLoading(true);
		try {
			console.log('🔄 GeoTwin: Refreshing flood visualization...');
			// Refresh the flood visualization using the existing system
			await floodSystem.refreshVisualization();
		} catch (error) {
			console.error('❌ Failed to refresh flood visualization:', error);
		} finally {
			setIsLoading(false);
		}
	};

	// Handle clear flood visualization - connect to actual flood system
	const handleClearVisualization = (): void => {
		if (!floodSystem) return;

		console.log('🗑️ GeoTwin: Clearing flood visualization...');
		floodSystem.clearFloodVisualization();
		setIsDataAvailable(false);
	};

	return (
		<Stack style={{ gap: '16px' }}>
			{/* Flood Layer Controls Card */}
			<Box style={{
				backgroundColor: '#23293a',
				border: '1px solid #3a4553',
				borderRadius: '8px',
				padding: '16px'
			}}>
				<Stack style={{ gap: '12px' }}>
					<Group style={{ gap: '8px', alignItems: 'center' }}>
						<IconWaveSquare size={16} color="#4a90e2" />
						<Text style={{
							fontSize: '14px',
							fontWeight: 600,
							color: 'white',
							fontFamily: "'Inter', 'Roboto', system-ui, sans-serif"
						}}>
							Flood Layer Controls
						</Text>
						{isDataAvailable ? (
							<Badge style={{
								backgroundColor: 'rgba(40, 167, 69, 0.2)',
								color: '#28a745',
								border: '1px solid rgba(40, 167, 69, 0.3)',
								fontSize: '10px'
							}}>
								Data Available
							</Badge>
						) : (
							<Badge style={{
								backgroundColor: 'rgba(108, 117, 125, 0.2)',
								color: '#6c757d',
								border: '1px solid rgba(108, 117, 125, 0.3)',
								fontSize: '10px'
							}}>
								No Data
							</Badge>
						)}
					</Group>

					{/* Flood Opacity Slider - using working pattern */}
					<Box>
						<Group style={{ justifyContent: 'space-between', marginBottom: '8px' }}>
							<Text style={{
								fontSize: '12px',
								color: '#a0a0a0',
								fontFamily: "'Inter', 'Roboto', system-ui, sans-serif"
							}}>
								Flood Layer Opacity
							</Text>
							<Text style={{
								fontSize: '12px',
								color: 'white',
								fontWeight: 500,
								fontFamily: "'Inter', 'Roboto', system-ui, sans-serif"
							}}>
								{toFixedWithoutZeros(floodOpacity, 0)}%
							</Text>
						</Group>
						<input
							type="range"
							className="flood-slider"
							min={0}
							max={100}
							step={5}
							value={floodOpacity}
							disabled={!isDataAvailable}
							onChange={(e): void => handleOpacityChange(parseFloat(e.target.value))}
						/>
					</Box>

					{/* Action Buttons */}
					<Group style={{ gap: '8px' }}>
						{/* Refresh Button */}
						<Button
							variant="outline"
							size="sm"
							style={{ flex: 1 }}
							onClick={handleRefreshVisualization}
							disabled={!isDataAvailable || isLoading}
							loading={isLoading}
							leftSection={<IconRefresh size={16} />}
							styles={{
								root: {
									borderColor: '#4a90e2',
									color: '#4a90e2',
									backgroundColor: 'transparent',
									fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
									fontWeight: 500,
									fontSize: '12px',
									height: '36px',
									'&:hover': {
										backgroundColor: 'rgba(74, 144, 226, 0.1)',
										borderColor: '#357abd',
										color: '#357abd'
									},
									'&:disabled': {
										borderColor: 'rgba(74, 144, 226, 0.3)',
										color: 'rgba(74, 144, 226, 0.3)'
									}
								}
							}}
						>
							{isLoading ? 'Refreshing...' : 'Refresh'}
						</Button>

						{/* Clear Button */}
						<Button
							variant="outline"
							size="sm"
							style={{ flex: 1 }}
							onClick={handleClearVisualization}
							disabled={!isDataAvailable}
							leftSection={<IconTrash size={16} />}
							styles={{
								root: {
									borderColor: '#dc3545',
									color: '#dc3545',
									backgroundColor: 'transparent',
									fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
									fontWeight: 500,
									fontSize: '12px',
									height: '36px',
									'&:hover': {
										backgroundColor: 'rgba(220, 53, 69, 0.1)',
										borderColor: '#c82333',
										color: '#c82333'
									},
									'&:disabled': {
										borderColor: 'rgba(220, 53, 69, 0.3)',
										color: 'rgba(220, 53, 69, 0.3)'
									}
								}
							}}
						>
							Clear
						</Button>
					</Group>
				</Stack>
			</Box>

			{/* Advanced Visualization Controls Card */}
			<Box style={{
				backgroundColor: '#23293a',
				border: '1px solid #3a4553',
				borderRadius: '8px',
				padding: '16px'
			}}>
				<Stack style={{ gap: '12px' }}>
					<Group style={{ gap: '8px', alignItems: 'center' }}>
						<IconMap size={16} color="#4a90e2" />
						<Text style={{
							fontSize: '14px',
							fontWeight: 600,
							color: 'white',
							fontFamily: "'Inter', 'Roboto', system-ui, sans-serif"
						}}>
							Advanced Controls
						</Text>
					</Group>

					{/* Flow Vectors Toggle - using working checkbox pattern */}
					<Group style={{ justifyContent: 'space-between', alignItems: 'center' }}>
						<Text style={{
							fontSize: '12px',
							color: '#ffffff',
							fontFamily: "'Inter', 'Roboto', system-ui, sans-serif"
						}}>
							Show Flow Vectors
						</Text>
						<input
							type="checkbox"
							className="flood-checkbox"
							checked={showFlowVectors}
							disabled={!isDataAvailable}
							onChange={(e): void => handleFlowVectorsToggle(e.target.checked)}
						/>
					</Group>

					{/* Depth Contours Toggle - using working checkbox pattern */}
					<Group style={{ justifyContent: 'space-between', alignItems: 'center' }}>
						<Text style={{
							fontSize: '12px',
							color: '#ffffff',
							fontFamily: "'Inter', 'Roboto', system-ui, sans-serif"
						}}>
							Show Depth Contours
						</Text>
						<input
							type="checkbox"
							className="flood-checkbox"
							checked={showDepthContours}
							disabled={!isDataAvailable}
							onChange={(e): void => handleDepthContoursToggle(e.target.checked)}
						/>
					</Group>

					{/* Data Status Information */}
					{!isDataAvailable && (
						<Box style={{
							backgroundColor: 'rgba(255, 193, 7, 0.1)',
							border: '1px solid rgba(255, 193, 7, 0.3)',
							borderRadius: '6px',
							padding: '8px'
						}}>
							<Text style={{
								fontSize: '11px',
								color: '#ffc107',
								fontFamily: "'Inter', 'Roboto', system-ui, sans-serif"
							}}>
								Run a flood simulation to enable visualization controls
							</Text>
						</Box>
					)}
				</Stack>
			</Box>
		</Stack>
	);
};

export default FloodControls;

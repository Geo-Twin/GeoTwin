import React, { useState, useEffect } from 'react';
import FloodSimulationSystem from '~/app/systems/FloodSimulationSystem';
import BoundingBoxSelectionSystem from '~/app/systems/BoundingBoxSelectionSystem';
import SystemManager from '~/app/SystemManager';

import {
  Button,
  Text,
  Group,
  Stack,
  Progress,
  Badge,
  Box
} from '@mantine/core';
// Removed showNotification to avoid dependency issues
import { IconFlask, IconTarget, IconSettings, IconWaveSquare, IconTrash } from '@tabler/icons-react';

// CSS for custom slider - copied from working MantineSettingRange.tsx
const sliderCSS = `
.custom-slider {
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

.custom-slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #4a90e2;
  cursor: pointer;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.custom-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #4a90e2;
  cursor: pointer;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.custom-slider:hover::-webkit-slider-thumb {
  background: #357abd;
}

.custom-slider:hover::-moz-range-thumb {
  background: #357abd;
}

.custom-slider:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.custom-select {
  width: 100%;
  height: 32px;
  background-color: #2d3748;
  border: 1px solid #3a4553;
  border-radius: 4px;
  color: white;
  font-size: 12px;
  font-family: 'Inter', 'Roboto', system-ui, sans-serif;
  padding: 0 8px;
  outline: none;
}

.custom-select:focus {
  border-color: #4a90e2;
}

.custom-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
`;

// Inject CSS - copied from working MantineSettingRange.tsx
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = sliderCSS;
  if (!document.head.querySelector('style[data-flood-slider]')) {
    styleElement.setAttribute('data-flood-slider', 'true');
    document.head.appendChild(styleElement);
  }
}

const toFixedWithoutZeros = (num: number, precision: number): string => {
	return num.toFixed(precision).replace(/(\.0+|0+)$/, '');
};

interface MantineFloodSimulationPanelProps {
	systemManager?: SystemManager;
}

const MantineFloodSimulationPanel: React.FC<MantineFloodSimulationPanelProps> = ({ systemManager }) => {
	// Basic simulation parameters (ORIGINAL working values that used to work perfectly)
	const [returnPeriod, setReturnPeriod] = useState(10); // Original: 10 (not 100)
	const [duration, setDuration] = useState(3); // Original: 3 (not 12)

	// New FastFlood API parameters (ORIGINAL working values)
	const [rain, setRain] = useState(0); // Original: 0 (not 100)
	const [ocean, setOcean] = useState(0); // Original: 0 (not 1.0)
	const [flowRate, setFlowRate] = useState(0); // Original: 0 (not 200)
	const [resolution, setResolution] = useState('20m'); // Original: 20m (not 10m)
	const [forecastDate, setForecastDate] = useState('latest'); // Date or "latest"

	// UI state
	const [isSimulating, setIsSimulating] = useState(false);
	const [simulationError, setSimulationError] = useState<string | null>(null);
	const [simulationStatus, setSimulationStatus] = useState<string>('');
	const [isSelectionMode, setIsSelectionMode] = useState(false);
	const [selectionSystem, setSelectionSystem] = useState<BoundingBoxSelectionSystem | null>(null);
	const [floodSystem, setFloodSystem] = useState<FloodSimulationSystem | null>(null);



	// Valid return periods for FastFlood API
	const RETURN_PERIODS = [2, 10, 25, 50, 100, 500, 1000];

	// Return period data for NativeSelect
	const returnPeriodData = RETURN_PERIODS.map(period => ({
		value: period.toString(),
		label: `${period} years`
	}));

	// Duration options for NativeSelect (matching return period format)
	const DURATION_OPTIONS = [1, 2, 3, 6, 12, 24, 48, 72];
	const durationData = DURATION_OPTIONS.map(duration => ({
		value: duration.toString(),
		label: `${duration} hours`
	}));

	// Parameter validation functions
	const validateParameters = (): string | null => {
		if (rain < 0 || rain > 300) {
			return 'Rain intensity must be between 0-300 mm/hour';
		}
		if (ocean < 0 || ocean > 5) {
			return 'Sea level rise must be between 0-5 meters';
		}
		if (flowRate < 0 || flowRate > 1000) {
			return 'River flow rate must be between 0-1000 m³/s';
		}
		if (!['5m', '10m', '20m'].includes(resolution)) {
			return 'Resolution must be 5m, 10m, or 20m';
		}
		return null;
	};

	// Coordinate validation for Dominica region
	const validateDominicaRegion = (bbox: any): string | null => {
		const { minLat, maxLat, minLon, maxLon } = bbox;

		// Dominica bounds with some leniency: 15.1°N-15.8°N, 61.6°W-61.1°W
		if (minLat < 15.0 || maxLat > 15.9 || minLon < -61.7 || maxLon > -61.0) {
			return 'Selected area is outside Dominica region. Please select an area within Dominica bounds.';
		}

		// Check minimum area size (prevent too small areas)
		const latDiff = maxLat - minLat;
		const lonDiff = maxLon - minLon;
		if (latDiff < 0.01 || lonDiff < 0.01) {
			return 'Selected area is too small. Please select a larger area.';
		}

		return null;
	};

	// Enhanced error handling for API responses
	const handleSimulationError = (error: any): string => {
		if (error.message?.includes('422')) {
			return 'Invalid simulation parameters. Please check your input values and try again.';
		}
		if (error.message?.includes('timeout') || error.message?.includes('network')) {
			return 'Network error. Please check your connection and try again.';
		}
		if (error.message?.includes('outside Dominica region')) {
			return error.message;
		}
		return error instanceof Error ? error.message : 'Unknown simulation error occurred';
	};

	useEffect(() => {
		// Access SystemManager through global app instance (same pattern as other working components)
		const getSystemManager = (): SystemManager | null => {
			// First try the prop if provided
			if (systemManager) {
				return systemManager;
			}

			// Access through global app instance
			if ((window as any).app && (window as any).app.systemManagerInstance) {
				return (window as any).app.systemManagerInstance;
			}

			return null;
		};

		const manager = getSystemManager();
		if (manager) {
			const floodSys = manager.getSystem(FloodSimulationSystem);
			const selectionSys = manager.getSystem(BoundingBoxSelectionSystem);
			setFloodSystem(floodSys);
			setSelectionSystem(selectionSys);
		}
	}, [systemManager]);

	const handleDemoSimulation = async (): Promise<void> => {
		if (!floodSystem) {
			setSimulationError('FloodSimulationSystem not available');
			return;
		}

		// Validate parameters before simulation
		const validationError = validateParameters();
		if (validationError) {
			setSimulationError(validationError);
			return;
		}

		setIsSimulating(true);
		setSimulationError(null);
		setSimulationStatus('Initializing Grand Bay demo simulation...');

		try {
			setSimulationStatus('Connecting to FastFlood API...');
			await floodSystem.runSimulation('grand-bay', {
				returnPeriod,
				duration,
				rain,
				ocean,
				flowRate,
				resolution,
				forecastDate
			});
			setSimulationStatus('Grand Bay flood visualization created successfully!');

			// Impact analysis will be automatically updated in the sidebar
			console.log(' Impact analysis will be displayed in the main sidebar');

			console.log(' Demo simulation completed successfully');

			setTimeout(() => {
				setSimulationStatus('');
			}, 5000);

		} catch (error) {
			console.error(' Grand Bay simulation failed:', error);
			const errorMessage = handleSimulationError(error);
			setSimulationError(errorMessage);
			setSimulationStatus('');
		} finally {
			setIsSimulating(false);
		}
	};

	const handleToggleSelection = (): void => {
		if (!selectionSystem) {
			setSimulationError('BoundingBoxSelectionSystem not available');
			return;
		}

		// Use the correct method name from BoundingBoxSelectionSystem
		selectionSystem.toggleSelectionMode();
		setIsSelectionMode(selectionSystem.isInSelectionMode());
	};

	const handleCustomAreaSimulation = async (): Promise<void> => {
		if (!floodSystem) {
			setSimulationError('FloodSimulationSystem not available');
			return;
		}

		if (!selectionSystem || !selectionSystem.hasValidSelection()) {
			setSimulationError('Please select an area first using the area selection tool');
			return;
		}

		// Validate parameters before simulation
		const validationError = validateParameters();
		if (validationError) {
			setSimulationError(validationError);
			return;
		}

		setIsSimulating(true);
		setSimulationError(null);

		try {
			setSimulationStatus('Getting selected area coordinates...');
			const bbox = selectionSystem.getSelectedBounds();
			if (!bbox) {
				throw new Error('No valid area selected');
			}

			// Validate Dominica region bounds
			const regionError = validateDominicaRegion(bbox);
			if (regionError) {
				throw new Error(regionError);
			}

			setSimulationStatus('Connecting to FastFlood API...');
			await floodSystem.simulateFloodForArea(bbox, {
				returnPeriod,
				duration,
				rain,
				ocean,
				flowRate,
				resolution,
				forecastDate
			});
			const successMessage = `Custom area flood visualization created successfully! (${returnPeriod}-year, ${duration}h)`;
			setSimulationStatus(successMessage);

			console.log(' Custom area simulation completed successfully');

			setTimeout(() => {
				setSimulationStatus('');
			}, 5000);

		} catch (error) {
			console.error(' Custom area simulation failed:', error);
			const errorMessage = handleSimulationError(error);
			setSimulationError(errorMessage);
			setSimulationStatus('');
		} finally {
			setIsSimulating(false);
		}
	};

	const handleClearFlood = (): void => {
		if (floodSystem) {
			floodSystem.clearFloodVisualization();
			setSimulationError(null);
			setSimulationStatus('Flood visualization cleared');

			console.log(' Flood visualization cleared');

			setTimeout(() => {
				setSimulationStatus('');
			}, 3000);
		}
	};



	return (
		<Stack style={{ gap: '16px' }}>
			{/* Quick Actions Card - Demo Simulation */}
			<Box style={{
				backgroundColor: '#23293a',
				border: '1px solid #3a4553',
				borderRadius: '8px',
				padding: '16px'
			}}>
				<Stack style={{ gap: '12px' }}>
					<Group style={{ gap: '8px', alignItems: 'center' }}>
						<IconFlask size={16} color="#4a90e2" />
						<Text style={{
							fontSize: '14px',
							fontWeight: 600,
							color: 'white',
							fontFamily: "'Inter', 'Roboto', system-ui, sans-serif"
						}}>
							Quick Demo
						</Text>
					</Group>

					<Button
						variant="filled"
						size="md"
						fullWidth
						onClick={handleDemoSimulation}
						disabled={isSimulating}
						loading={isSimulating}
						leftSection={<IconWaveSquare size={18} />}
						styles={{
							root: {
								backgroundColor: '#4a90e2',
								color: '#ffffff',
								fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
								fontWeight: 600,
								fontSize: '14px',
								height: '48px',
								borderRadius: '8px',
								'&:hover': {
									backgroundColor: '#357abd',
								},
								'&:disabled': {
									backgroundColor: 'rgba(74, 144, 226, 0.5)',
								}
							}
						}}
					>
						{isSimulating ? 'Running Demo...' : 'Run Demo Simulation'}
					</Button>

					<Text style={{
						fontSize: '11px',
						color: '#a0a0a0',
						fontFamily: "'Inter', 'Roboto', system-ui, sans-serif"
					}}>
						Grand Bay (Berekua), Dominica • {returnPeriod}-year return period, {duration}-hour duration
					</Text>
				</Stack>
			</Box>

			{/* Custom Area Simulation Card */}
			<Box style={{
				backgroundColor: '#23293a',
				border: '1px solid #3a4553',
				borderRadius: '8px',
				padding: '16px'
			}}>
				<Stack style={{ gap: '12px' }}>
					<Group style={{ gap: '8px', alignItems: 'center' }}>
						<IconTarget size={16} color="#4a90e2" />
						<Text style={{
							fontSize: '14px',
							fontWeight: 600,
							color: 'white',
							fontFamily: "'Inter', 'Roboto', system-ui, sans-serif"
						}}>
							Custom Area Simulation
						</Text>
					</Group>

					{/* Step 1: Area Selection */}
					<Button
						variant={isSelectionMode ? "filled" : "outline"}
						size="md"
						fullWidth
						onClick={handleToggleSelection}
						disabled={isSimulating}
						leftSection={<IconTarget size={18} />}
						styles={{
							root: isSelectionMode ? {
								backgroundColor: '#4a90e2',
								color: '#ffffff',
								fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
								fontWeight: 600,
								fontSize: '14px',
								height: '48px',
								borderRadius: '8px',
								'&:hover': {
									backgroundColor: '#357abd',
								},
							} : {
								borderColor: '#4a90e2',
								color: '#4a90e2',
								backgroundColor: 'transparent',
								fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
								fontWeight: 600,
								fontSize: '14px',
								height: '48px',
								borderRadius: '8px',
								'&:hover': {
									backgroundColor: 'rgba(74, 144, 226, 0.1)',
									borderColor: '#357abd',
									color: '#357abd'
								},
							},
						}}
					>
						{isSelectionMode ? 'Selection Active - Click & Drag on Map' : 'Start Area Selection'}
					</Button>

					{/* Selection Status */}
					<Group style={{ justifyContent: 'space-between', alignItems: 'center' }}>
						<Text style={{ fontSize: '12px', color: '#a0a0a0' }}>Selection Status:</Text>
						{selectionSystem?.hasValidSelection() ? (
							<Badge style={{
								backgroundColor: 'rgba(40, 167, 69, 0.2)',
								color: '#28a745',
								border: '1px solid rgba(40, 167, 69, 0.3)'
							}}>
								Area Selected
							</Badge>
						) : (
							<Badge style={{
								backgroundColor: 'rgba(108, 117, 125, 0.2)',
								color: '#6c757d',
								border: '1px solid rgba(108, 117, 125, 0.3)'
							}}>
								No Area Selected
							</Badge>
						)}
					</Group>

					{/* Step 2: Run Custom Simulation */}
					<Button
						variant="filled"
						size="md"
						fullWidth
						onClick={handleCustomAreaSimulation}
						disabled={isSimulating || !selectionSystem?.hasValidSelection()}
						loading={isSimulating}
						leftSection={<IconWaveSquare size={18} />}
						styles={{
							root: {
								backgroundColor: '#4a90e2',
								color: '#ffffff',
								fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
								fontWeight: 600,
								fontSize: '14px',
								height: '48px',
								borderRadius: '8px',
								'&:hover': {
									backgroundColor: '#357abd',
								},
								'&:disabled': {
									backgroundColor: 'rgba(74, 144, 226, 0.3)',
									color: 'rgba(255, 255, 255, 0.5)'
								}
							}
						}}
					>
						{isSimulating
							? 'Running Custom Simulation...'
							: `Run Custom Simulation (${returnPeriod}yr, ${duration}h)`
						}
					</Button>
				</Stack>
			</Box>

			{/* Simulation Controls Card */}
			<Box style={{
				backgroundColor: '#23293a',
				border: '1px solid #3a4553',
				borderRadius: '8px',
				padding: '16px'
			}}>
				<Stack style={{ gap: '12px' }}>
					<Group style={{ gap: '8px', alignItems: 'center' }}>
						<IconSettings size={16} color="#4a90e2" />
						<Text style={{
							fontSize: '14px',
							fontWeight: 600,
							color: 'white',
							fontFamily: "'Inter', 'Roboto', system-ui, sans-serif"
						}}>
							Simulation Controls
						</Text>
					</Group>

					<Button
						variant="outline"
						size="md"
						fullWidth
						onClick={handleClearFlood}
						disabled={isSimulating}
						leftSection={<IconTrash size={18} />}
						styles={{
							root: {
								borderColor: '#dc3545',
								color: '#dc3545',
								backgroundColor: 'transparent',
								fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
								fontWeight: 600,
								fontSize: '14px',
								height: '48px',
								borderRadius: '8px',
								'&:hover': {
									backgroundColor: 'rgba(220, 53, 69, 0.1)',
									borderColor: '#c82333',
									color: '#c82333'
								},
							}
						}}
					>
						Clear All Flood Visualization
					</Button>
				</Stack>
			</Box>

			{/* Simulation Parameters Card */}
			<Box style={{
				backgroundColor: '#23293a',
				border: '1px solid #3a4553',
				borderRadius: '8px',
				padding: '16px'
			}}>
				<Stack style={{ gap: '12px' }}>
					<Group style={{ gap: '8px', alignItems: 'center' }}>
						<IconSettings size={16} color="#4a90e2" />
						<Text style={{
							fontSize: '14px',
							fontWeight: 600,
							color: 'white',
							fontFamily: "'Inter', 'Roboto', system-ui, sans-serif"
						}}>
							Simulation Parameters
						</Text>
					</Group>

					{/* Selection Instructions */}
					{isSelectionMode && (
						<Box style={{
							backgroundColor: 'rgba(255, 193, 7, 0.1)',
							border: '1px solid rgba(255, 193, 7, 0.3)',
							borderRadius: '6px',
							padding: '8px'
						}}>
							<Text style={{ fontSize: '11px', color: '#ffc107' }}>
								Hold Shift + Click and drag on the map to select an area
							</Text>
						</Box>
					)}

					{/* Weather Parameters */}
					<Stack style={{ gap: '12px' }}>
						{/* Rain Intensity Slider - using working pattern from MantineSettingRange */}
						<Box>
							<Group style={{ justifyContent: 'space-between', marginBottom: '8px' }}>
								<Text style={{
									fontSize: '12px',
									color: '#a0a0a0',
									fontFamily: "'Inter', 'Roboto', system-ui, sans-serif"
								}}>
									Rain Intensity (mm/hour)
								</Text>
								<Text style={{
									fontSize: '12px',
									color: 'white',
									fontWeight: 500,
									fontFamily: "'Inter', 'Roboto', system-ui, sans-serif"
								}}>
									{toFixedWithoutZeros(rain, 0)}
								</Text>
							</Group>
							<input
								type="range"
								className="custom-slider"
								min={0}
								max={300}
								step={10}
								value={rain}
								disabled={isSimulating}
								onChange={(e): void => setRain(parseFloat(e.target.value))}
							/>
						</Box>

						{/* Duration Select - using working pattern */}
						<Box>
							<Group style={{ justifyContent: 'space-between', marginBottom: '8px' }}>
								<Text style={{
									fontSize: '12px',
									color: '#a0a0a0',
									fontFamily: "'Inter', 'Roboto', system-ui, sans-serif"
								}}>
									Duration (hours)
								</Text>
								<Text style={{
									fontSize: '12px',
									color: 'white',
									fontWeight: 500,
									fontFamily: "'Inter', 'Roboto', system-ui, sans-serif"
								}}>
									{duration}
								</Text>
							</Group>
							<select
								className="custom-select"
								value={duration}
								disabled={isSimulating}
								onChange={(e): void => setDuration(parseInt(e.target.value))}
							>
								{DURATION_OPTIONS.map(dur => (
									<option key={dur} value={dur}>{dur} hours</option>
								))}
							</select>
						</Box>

						{/* Sea Level Rise Slider */}
						<Box>
							<Group style={{ justifyContent: 'space-between', marginBottom: '8px' }}>
								<Text style={{
									fontSize: '12px',
									color: '#a0a0a0',
									fontFamily: "'Inter', 'Roboto', system-ui, sans-serif"
								}}>
									Sea Level Rise (meters)
								</Text>
								<Text style={{
									fontSize: '12px',
									color: 'white',
									fontWeight: 500,
									fontFamily: "'Inter', 'Roboto', system-ui, sans-serif"
								}}>
									{toFixedWithoutZeros(ocean, 1)}
								</Text>
							</Group>
							<input
								type="range"
								className="custom-slider"
								min={0}
								max={5}
								step={0.1}
								value={ocean}
								disabled={isSimulating}
								onChange={(e): void => setOcean(parseFloat(e.target.value))}
							/>
						</Box>

						{/* River Flow Rate Slider */}
						<Box>
							<Group style={{ justifyContent: 'space-between', marginBottom: '8px' }}>
								<Text style={{
									fontSize: '12px',
									color: '#a0a0a0',
									fontFamily: "'Inter', 'Roboto', system-ui, sans-serif"
								}}>
									River Flow Rate (m³/s)
								</Text>
								<Text style={{
									fontSize: '12px',
									color: 'white',
									fontWeight: 500,
									fontFamily: "'Inter', 'Roboto', system-ui, sans-serif"
								}}>
									{toFixedWithoutZeros(flowRate, 0)}
								</Text>
							</Group>
							<input
								type="range"
								className="custom-slider"
								min={0}
								max={1000}
								step={10}
								value={flowRate}
								disabled={isSimulating}
								onChange={(e): void => setFlowRate(parseFloat(e.target.value))}
							/>
						</Box>

						{/* Return Period Select */}
						<Box>
							<Group style={{ justifyContent: 'space-between', marginBottom: '8px' }}>
								<Text style={{
									fontSize: '12px',
									color: '#a0a0a0',
									fontFamily: "'Inter', 'Roboto', system-ui, sans-serif"
								}}>
									Return Period (years)
								</Text>
								<Text style={{
									fontSize: '12px',
									color: 'white',
									fontWeight: 500,
									fontFamily: "'Inter', 'Roboto', system-ui, sans-serif"
								}}>
									{returnPeriod}
								</Text>
							</Group>
							<select
								className="custom-select"
								value={returnPeriod}
								disabled={isSimulating}
								onChange={(e): void => setReturnPeriod(parseInt(e.target.value))}
							>
								{RETURN_PERIODS.map(period => (
									<option key={period} value={period}>{period} years</option>
								))}
							</select>
						</Box>

						{/* Resolution Select */}
						<Box>
							<Group style={{ justifyContent: 'space-between', marginBottom: '8px' }}>
								<Text style={{
									fontSize: '12px',
									color: '#a0a0a0',
									fontFamily: "'Inter', 'Roboto', system-ui, sans-serif"
								}}>
									Resolution
								</Text>
								<Text style={{
									fontSize: '12px',
									color: 'white',
									fontWeight: 500,
									fontFamily: "'Inter', 'Roboto', system-ui, sans-serif"
								}}>
									{resolution}
								</Text>
							</Group>
							<select
								className="custom-select"
								value={resolution}
								disabled={isSimulating}
								onChange={(e): void => setResolution(e.target.value)}
							>
								<option value="5m">5m (High Detail)</option>
								<option value="10m">10m (Standard)</option>
								<option value="20m">20m (Fast)</option>
							</select>
						</Box>
					</Stack>
				</Stack>
			</Box>

			{/* System Information - Clean info display */}
			<Box style={{
				backgroundColor: '#23293a',
				border: '1px solid #3a4553',
				borderRadius: '8px',
				padding: '12px'
			}}>
				<Stack style={{ gap: '8px' }}>
					<Text style={{
						fontSize: '12px',
						fontWeight: 600,
						color: 'white',
						fontFamily: "'Inter', 'Roboto', system-ui, sans-serif"
					}}>
						System Information
					</Text>

					<Stack style={{ gap: '4px' }}>
						<Group style={{ justifyContent: 'space-between' }}>
							<Text style={{ fontSize: '11px', color: '#a0a0a0' }}>Region:</Text>
							<Text style={{ fontSize: '11px', color: 'white' }}>Dominica</Text>
						</Group>
						<Group style={{ justifyContent: 'space-between' }}>
							<Text style={{ fontSize: '11px', color: '#a0a0a0' }}>Elevation Model:</Text>
							<Text style={{ fontSize: '11px', color: 'white' }}>COP30 ({resolution} resolution)</Text>
						</Group>
					</Stack>
				</Stack>
			</Box>

			{/* Status Display */}
			{simulationStatus && !isSimulating && (
				<Box style={{
					backgroundColor: 'rgba(40, 167, 69, 0.1)',
					border: '1px solid rgba(40, 167, 69, 0.3)',
					borderRadius: '8px',
					padding: '12px'
				}}>
					<Text style={{
						fontSize: '12px',
						color: '#28a745',
						fontFamily: "'Inter', 'Roboto', system-ui, sans-serif"
					}}>
						{simulationStatus}
					</Text>
				</Box>
			)}



			{/* Error Display */}
			{simulationError && (
				<Box style={{
					backgroundColor: 'rgba(220, 53, 69, 0.1)',
					border: '1px solid rgba(220, 53, 69, 0.3)',
					borderRadius: '8px',
					padding: '12px'
				}}>
					<Text style={{
						fontSize: '12px',
						color: '#dc3545',
						fontFamily: "'Inter', 'Roboto', system-ui, sans-serif"
					}}>
						{simulationError}
					</Text>
				</Box>
			)}

			{/* Progress Display */}
			{isSimulating && (
				<Box style={{
					backgroundColor: '#23293a',
					border: '1px solid #3a4553',
					borderRadius: '8px',
					padding: '16px'
				}}>
					<Stack style={{ gap: '12px' }}>
						<Progress
							value={60}
							animated
							color="#4a90e2"
							styles={{
								root: { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
							}}
						/>
						<Text style={{
							fontSize: '12px',
							textAlign: 'center',
							color: '#a0a0a0',
							fontFamily: "'Inter', 'Roboto', system-ui, sans-serif"
						}}>
							{simulationStatus || 'Calculating flood depths and flow patterns...'}
						</Text>
					</Stack>
				</Box>
			)}
		</Stack>
	);
};

export default MantineFloodSimulationPanel;

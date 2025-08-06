import React, { useState, useEffect } from 'react';
import FloodSimulationSystem from '~/app/systems/FloodSimulationSystem';
import BoundingBoxSelectionSystem from '~/app/systems/BoundingBoxSelectionSystem';
import SystemManager from '~/app/SystemManager';
import FastFloodAPI from '~/app/services/FastFloodAPI';
import {
  Button,
  Card,
  Text,
  Title,
  Group,
  Stack,
  Select,
  Slider,
  Alert,
  Progress,
  Badge,
  Divider,
  Box,
  Loader
} from '~/app/ui/components/MantineUI';
import { showNotification } from '@mantine/notifications';

interface FloodSimulationPanelProps {
	systemManager?: SystemManager;
}

const FloodSimulationPanel: React.FC<FloodSimulationPanelProps> = ({ systemManager }) => {
	const [returnPeriod, setReturnPeriod] = useState(10);
	const [duration, setDuration] = useState(3);
	const [isSimulating, setIsSimulating] = useState(false);
	const [simulationError, setSimulationError] = useState<string | null>(null);
	const [simulationStatus, setSimulationStatus] = useState<string>('');
	const [isSelectionMode, setIsSelectionMode] = useState(false);
	const [selectionSystem, setSelectionSystem] = useState<BoundingBoxSelectionSystem | null>(null);
	const [floodSystem, setFloodSystem] = useState<FloodSimulationSystem | null>(null);

	// Valid return periods for FastFlood API
	const RETURN_PERIODS = [2, 10, 25, 50, 100, 500, 1000];

	// CRITICAL FIX: Access SystemManager through global app instance
	useEffect(() => {
		// Access the global app instance to get SystemManager
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
			const boundingBoxSystem = manager.getSystem(BoundingBoxSelectionSystem);
			const floodSimSystem = manager.getSystem(FloodSimulationSystem);
			setSelectionSystem(boundingBoxSystem);
			setFloodSystem(floodSimSystem);
		}
	}, [systemManager]);

	const handleDemoSimulation = async (): Promise<void> => {
		if (!floodSystem) {
			setSimulationError('FloodSimulationSystem not available');
			return;
		}

		setIsSimulating(true);
		setSimulationError(null);
		setSimulationStatus('Initializing Grand Bay demo simulation...');

		try {
			setSimulationStatus('Connecting to FastFlood API...');
			// Use proven Grand Bay method with fixed parameters
			await floodSystem.runSimulation('grand-bay', 10, 3);
			setSimulationStatus('Grand Bay flood visualization created successfully!');

			// Show success notification
			showNotification({
				title: 'Demo Simulation Complete',
				message: 'Grand Bay flood visualization created successfully!',
				color: 'green',
				icon: '🌊',
			});

			// Clear status after 5 seconds
			setTimeout(() => {
				setSimulationStatus('');
			}, 5000);

		} catch (error) {
			console.error('Grand Bay simulation failed:', error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			setSimulationError(errorMessage);
			setSimulationStatus('');

			// Show error notification
			showNotification({
				title: 'Demo Simulation Failed',
				message: errorMessage,
				color: 'red',
				icon: '❌',
			});
		} finally {
			setIsSimulating(false);
		}
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

		setIsSimulating(true);
		setSimulationError(null);
		setSimulationStatus('Initializing custom area simulation...');

		try {
			setSimulationStatus('Getting selected area coordinates...');
			const bbox = selectionSystem.getSelectedBounds();
			if (!bbox) {
				throw new Error('No valid area selected');
			}

			setSimulationStatus('Connecting to FastFlood API...');
			// Use custom area method with user-specified parameters
			await floodSystem.simulateFloodForArea(bbox, returnPeriod, duration);
			const successMessage = `Custom area flood visualization created successfully! (${returnPeriod}-year, ${duration}h)`;
			setSimulationStatus(successMessage);

			// Show success notification
			showNotification({
				title: 'Custom Simulation Complete',
				message: successMessage,
				color: 'green',
				icon: '🌊',
			});

			// Clear status after 5 seconds
			setTimeout(() => {
				setSimulationStatus('');
			}, 5000);

		} catch (error) {
			console.error('Custom area simulation failed:', error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			setSimulationError(errorMessage);
			setSimulationStatus('');

			// Show error notification
			showNotification({
				title: 'Custom Simulation Failed',
				message: errorMessage,
				color: 'red',
				icon: '❌',
			});
		} finally {
			setIsSimulating(false);
		}
	};

	const handleToggleSelection = (): void => {
		if (selectionSystem) {
			selectionSystem.toggleSelectionMode();
			setIsSelectionMode(selectionSystem.isInSelectionMode());
		}
	};

	const handleClearFlood = (): void => {
		if (floodSystem) {
			floodSystem.clearFloodVisualization();
			setSimulationError(null);
			setSimulationStatus('Flood visualization cleared');

			// Show success notification
			showNotification({
				title: 'Visualization Cleared',
				message: 'All flood visualization has been cleared from the map',
				color: 'blue',
				icon: '🧹',
			});

			// Clear status after 3 seconds
			setTimeout(() => {
				setSimulationStatus('');
			}, 3000);
		}
	};

	return (
		<Stack spacing="lg">
			{/* Demo Simulation Section */}
			<Card title="🧪 Demo Simulation">
				<Stack spacing="md">
					<Stack spacing="xs">
						<Group position="apart">
							<Text size="sm" color="dimmed">Area:</Text>
							<Text size="sm">Grand Bay (Berekua), Dominica</Text>
						</Group>
						<Group position="apart">
							<Text size="sm" color="dimmed">Parameters:</Text>
							<Text size="sm">10-year return period, 3-hour duration</Text>
						</Group>
					</Stack>

					<Button
						variant="primary"
						size="lg"
						fullWidth
						onClick={handleDemoSimulation}
						disabled={isSimulating}
						loading={isSimulating}
					>
						{isSimulating ? 'Running Demo...' : '🌊 Run Demo Simulation'}
					</Button>
				</Stack>
			</Card>

			{/* Custom Area Simulation Section */}
			<Card title="🎯 Custom Area Simulation">
				<Stack spacing="lg">
					{/* Area Selection */}
					<Stack spacing="sm">
						<Group position="apart" align="center">
							<Text size="sm" weight={600} color="blue">Step 1: Select Area</Text>
							{selectionSystem?.hasValidSelection() && (
								<Badge color="green" variant="filled">✅ Area Selected</Badge>
							)}
						</Group>

						<Button
							variant={isSelectionMode ? "primary" : "outline"}
							fullWidth
							onClick={handleToggleSelection}
							disabled={isSimulating}
						>
							{isSelectionMode ? '🎯 Selection Active - Click & Drag on Map' : '📍 Start Area Selection'}
						</Button>

						{isSelectionMode && (
							<Alert color="yellow" variant="light">
								<Text size="sm">Hold Shift + Click and drag on the map to select an area</Text>
							</Alert>
						)}
					</Stack>

					{/* Simulation Parameters */}
					<Stack spacing="md">
						<Text size="sm" weight={600} color="blue">Step 2: Set Parameters</Text>

						<Stack spacing="xs">
							<Text size="sm" weight={500}>Return Period: {returnPeriod} years</Text>
							<Select
								data={RETURN_PERIODS.map(period => ({
									value: period.toString(),
									label: `${period} years`
								}))}
								value={returnPeriod.toString()}
								onChange={(value): void => setReturnPeriod(Number(value))}
								disabled={isSimulating}
							/>
						</Stack>

						<Stack spacing="xs">
							<Text size="sm" weight={500}>Storm Duration: {duration} hours</Text>
							<Slider
								min={1}
								max={24}
								value={duration}
								onChange={setDuration}
								disabled={isSimulating}
								marks={[
									{ value: 1, label: '1h' },
									{ value: 12, label: '12h' },
									{ value: 24, label: '24h' }
								]}
							/>
						</Stack>
					</Stack>

					{/* Custom Simulation Button */}
					<Button
						variant="primary"
						size="lg"
						fullWidth
						onClick={handleCustomAreaSimulation}
						disabled={isSimulating || !selectionSystem?.hasValidSelection()}
						loading={isSimulating}
						sx={{
							background: 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)',
							'&:hover': {
								background: 'linear-gradient(135deg, #357abd 0%, #2d6ba3 100%)',
							}
						}}
					>
						{isSimulating
							? 'Running Custom Simulation...'
							: `🌊 Run Custom Simulation (${returnPeriod}yr, ${duration}h)`
						}
					</Button>
				</Stack>
			</Card>

			{/* Shared Controls */}
			<Card title="⚙️ Simulation Controls">
				<Stack spacing="md">
					<Button
						variant="outline"
						fullWidth
						onClick={handleClearFlood}
						disabled={isSimulating}
					>
						🧹 Clear All Flood Visualization
					</Button>

					<Stack spacing="xs">
						<Group position="apart">
							<Text size="sm" color="dimmed">Region:</Text>
							<Text size="sm">Dominica</Text>
						</Group>
						<Group position="apart">
							<Text size="sm" color="dimmed">Elevation Model:</Text>
							<Text size="sm">COP30 (20m resolution)</Text>
						</Group>
					</Stack>
				</Stack>
			</Card>

			{/* Status Display */}
			{simulationStatus && !isSimulating && (
				<Alert color="green" variant="light" icon="✅">
					<Text size="sm">{simulationStatus}</Text>
				</Alert>
			)}

			{/* Error Display */}
			{simulationError && (
				<Alert color="red" variant="light" icon="❌">
					<Text size="sm">{simulationError}</Text>
				</Alert>
			)}

			{/* Progress Display */}
			{isSimulating && (
				<Card>
					<Stack spacing="md">
						<Progress value={60} animate />
						<Text size="sm" align="center" color="dimmed">
							{simulationStatus || 'Calculating flood depths and flow patterns...'}
						</Text>
					</Stack>
				</Card>
			)}
		</Stack>
	);
};

export default FloodSimulationPanel;

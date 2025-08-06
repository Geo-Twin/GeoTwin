import React, { useCallback, useEffect, useState } from "react";
import styles from "./FloodAreaSelector.scss";
import Panel from "~/app/ui/components/Panel";
import ModalButton from "~/app/ui/components/ModalButton";
import PanelCloseButton from "~/app/ui/components/PanelCloseButton";
import BoundingBoxSelectionSystem from "~/app/systems/BoundingBoxSelectionSystem";
import FloodSimulationSystem from "~/app/systems/FloodSimulationSystem";
import SystemManager from "~/app/SystemManager";

interface FloodAreaSelectorProps {
	systemManager: SystemManager;
	isVisible: boolean;
	onClose: () => void;
}

const FloodAreaSelector: React.FC<FloodAreaSelectorProps> = ({ 
	systemManager, 
	isVisible, 
	onClose 
}) => {
	const [isSelectionMode, setIsSelectionMode] = useState(false);
	const [selectionSystem, setSelectionSystem] = useState<BoundingBoxSelectionSystem | null>(null);

	useEffect(() => {
		if (systemManager) {
			const system = systemManager.getSystem(BoundingBoxSelectionSystem);
			setSelectionSystem(system);
		}
	}, [systemManager]);

	const handleStartSelection = useCallback(() => {
		if (selectionSystem) {
			selectionSystem.toggleSelectionMode();
			setIsSelectionMode(selectionSystem.isInSelectionMode());
		}
	}, [selectionSystem]);

	const handleStopSelection = useCallback(() => {
		if (selectionSystem && isSelectionMode) {
			selectionSystem.toggleSelectionMode();
			setIsSelectionMode(false);
		}
	}, [selectionSystem, isSelectionMode]);

	const handleTestGrandBay = useCallback(() => {
		// Test with Grand Bay area for demonstration
		const floodSystem = systemManager.getSystem(FloodSimulationSystem);
		floodSystem.runSimulation('grand-bay', 10, 3);
		onClose();
	}, [systemManager, onClose]);

	if (!isVisible) {
		return null;
	}

	return (
		<Panel className={styles.floodAreaSelector}>
			<div className={styles.header}>
				<h3>Flood Area Selection</h3>
				<PanelCloseButton onClick={onClose} />
			</div>

			<div className={styles.content}>
				<div className={styles.instructions}>
					<h4>Select Area for Flood Simulation</h4>
					<p>
						Choose how you want to select the area for flood simulation:
					</p>
				</div>

				<div className={styles.methods}>
					<div className={styles.method}>
						<h5>🎯 Interactive Selection</h5>
						<p>Hold Shift + Click and drag on terrain to select a custom area.</p>
						
						<div className={styles.constraints}>
							<strong>Size Constraints:</strong>
							<ul>
								<li>Maximum: Grand Bay area size</li>
								<li>Minimum: 1/8 of Grand Bay area</li>
								<li>Must be within Dominica bounds</li>
							</ul>
						</div>

						<div className={styles.controls}>
							{!isSelectionMode ? (
								<ModalButton 
									onClick={handleStartSelection}
									className={styles.startButton}
								>
									Start Area Selection
								</ModalButton>
							) : (
								<div className={styles.selectionActive}>
									<p className={styles.activeText}>
										🎯 Selection mode active! Hold Shift + Click and drag on terrain to select an area.
									</p>
									<ModalButton 
										onClick={handleStopSelection}
										className={styles.stopButton}
									>
										Stop Selection
									</ModalButton>
								</div>
							)}
						</div>

						<div className={styles.shortcuts}>
							<strong>Keyboard Shortcuts:</strong> Ctrl+B to toggle selection mode, Shift+Drag to select area
						</div>
					</div>

					<div className={styles.divider}>
						<span>OR</span>
					</div>

					<div className={styles.method}>
						<h5>🧪 Test Area</h5>
						<p>Use the pre-configured Grand Bay test area.</p>
						
						<ModalButton 
							onClick={handleTestGrandBay}
							className={styles.testButton}
						>
							Simulate Grand Bay
						</ModalButton>
					</div>
				</div>

				<div className={styles.notes}>
					<h5>📋 Notes</h5>
					<ul>
						<li>Flood simulation uses the FastFlood API</li>
						<li>Results show water depth and flood extent</li>
						<li>Larger areas take longer to process</li>
						<li>Selection must be within Dominica boundaries</li>
					</ul>
				</div>
			</div>
		</Panel>
	);
};

export default FloodAreaSelector;

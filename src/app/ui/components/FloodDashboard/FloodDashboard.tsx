import React, { useState } from 'react';
import styles from './FloodDashboard.scss';
import FloodControls from './FloodControls';
import FloodMetrics from './FloodMetrics';
import FloodSimulationPanel from './FloodSimulationPanel';

interface FloodDashboardProps {
	isVisible: boolean;
	onToggle: () => void;
}

const FloodDashboard: React.FC<FloodDashboardProps> = ({ isVisible, onToggle }) => {
	const [activeTab, setActiveTab] = useState<'simulation' | 'metrics' | 'controls'>('simulation');

	if (!isVisible) {
		return (
			<div className={styles.dashboardToggle} onClick={onToggle}>
				<div className={styles.dashboardToggle__icon}>🌊</div>
				<div className={styles.dashboardToggle__text}>Flood Risk</div>
			</div>
		);
	}

	return (
		<div className={styles.floodDashboard}>
			<div className={styles.floodDashboard__header}>
				<h2 className={styles.floodDashboard__title}>
					🌊 Flood Risk Assessment - Dominica
				</h2>
				<button 
					className={styles.floodDashboard__closeButton}
					onClick={onToggle}
				>
					×
				</button>
			</div>

			<div className={styles.floodDashboard__tabs}>
				<button 
					className={`${styles.tab} ${activeTab === 'simulation' ? styles['tab--active'] : ''}`}
					onClick={(): void => setActiveTab('simulation')}
				>
					Simulation
				</button>
				<button 
					className={`${styles.tab} ${activeTab === 'controls' ? styles['tab--active'] : ''}`}
					onClick={(): void => setActiveTab('controls')}
				>
					Controls
				</button>
				<button 
					className={`${styles.tab} ${activeTab === 'metrics' ? styles['tab--active'] : ''}`}
					onClick={(): void => setActiveTab('metrics')}
				>
					Impact Analysis
				</button>
			</div>

			<div className={styles.floodDashboard__content}>
				{activeTab === 'simulation' && <FloodSimulationPanel />}
				{activeTab === 'controls' && <FloodControls />}
				{activeTab === 'metrics' && <FloodMetrics />}
			</div>
		</div>
	);
};

export default FloodDashboard;

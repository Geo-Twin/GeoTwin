import React, { useState, useEffect } from 'react';
import styles from './EnhancedFloodMetrics.scss';

const EnhancedFloodMetrics: React.FC = () => {
	const [animatedValues, setAnimatedValues] = useState({
		affectedBuildings: 0,
		affectedPopulation: 0,
		economicLoss: 0
	});

	// Mock data for demonstration - significantly enhanced for readability
	const metrics = {
		affectedBuildings: 127,
		totalBuildings: 1543,
		affectedPopulation: 892,
		totalPopulation: 8420,
		economicLoss: 2.4,
		highRiskAreas: 15.2,
		evacuationRoutes: 8,
		emergencyServices: 3
	};

	// Animate numbers on component mount
	useEffect(() => {
		const duration = 2000; // 2 seconds
		const steps = 60;
		const stepDuration = duration / steps;

		let currentStep = 0;
		const interval = setInterval(() => {
			currentStep++;
			const progress = currentStep / steps;

			setAnimatedValues({
				affectedBuildings: Math.floor(metrics.affectedBuildings * progress),
				affectedPopulation: Math.floor(metrics.affectedPopulation * progress),
				economicLoss: Number((metrics.economicLoss * progress).toFixed(1))
			});

			if (currentStep >= steps) {
				clearInterval(interval);
			}
		}, stepDuration);

		return () => clearInterval(interval);
	}, []);

	const buildingTypes = [
		{ type: 'Residential', affected: 89, total: 1200, value: 1.8, color: '#ff6b6b' },
		{ type: 'Commercial', affected: 23, total: 180, value: 0.4, color: '#4ecdc4' },
		{ type: 'Industrial', affected: 8, total: 95, value: 0.15, color: '#45b7d1' },
		{ type: 'Public', affected: 7, total: 68, value: 0.05, color: '#96ceb4' }
	];

	const riskLevel = 'HIGH';
	const riskColor = riskLevel === 'HIGH' ? '#f44336' : riskLevel === 'MEDIUM' ? '#ff9800' : '#4caf50';

	return (
		<div className={styles.enhancedMetrics}>
			{/* Key Impact Summary - Large Cards with Animation */}
			<div className={styles.keyMetrics}>
				<div className={styles.keyMetric}>
					<div className={styles.keyMetric__value}>{animatedValues.affectedBuildings}</div>
					<div className={styles.keyMetric__label}>Buildings at Risk</div>
					<div className={styles.keyMetric__context}>
						of {metrics.totalBuildings} total ({Math.round((metrics.affectedBuildings / metrics.totalBuildings) * 100)}%)
					</div>
				</div>

				<div className={styles.keyMetric}>
					<div className={styles.keyMetric__value}>{animatedValues.affectedPopulation}</div>
					<div className={styles.keyMetric__label}>People Affected</div>
					<div className={styles.keyMetric__context}>
						of {metrics.totalPopulation} total ({Math.round((metrics.affectedPopulation / metrics.totalPopulation) * 100)}%)
					</div>
				</div>

				<div className={styles.keyMetric}>
					<div className={styles.keyMetric__value}>${animatedValues.economicLoss}M</div>
					<div className={styles.keyMetric__label}>Economic Loss</div>
					<div className={styles.keyMetric__context}>
						Estimated damage value
					</div>
				</div>
			</div>

			{/* Risk Level Indicator */}
			<div className={styles.riskIndicator}>
				<div className={styles.riskIndicator__header}>
					<span className={styles.riskIndicator__label}>Current Risk Level</span>
					<span 
						className={styles.riskIndicator__value}
						style={{ backgroundColor: riskColor }}
					>
						{riskLevel}
					</span>
				</div>
				<div className={styles.riskIndicator__details}>
					<div className={styles.riskDetail}>
						<span className={styles.riskDetail__label}>High Risk Area:</span>
						<span className={styles.riskDetail__value}>{metrics.highRiskAreas} km²</span>
					</div>
				</div>
			</div>

			{/* Building Impact Analysis - Enhanced */}
			<div className={styles.buildingAnalysis}>
				<h3 className={styles.sectionTitle}>Building Impact Analysis</h3>
				{buildingTypes.map((building, index) => (
					<div key={index} className={styles.buildingType}>
						<div className={styles.buildingType__header}>
							<div className={styles.buildingType__info}>
								<span className={styles.buildingType__name}>{building.type}</span>
								<span className={styles.buildingType__count}>
									{building.affected} of {building.total} affected
								</span>
							</div>
							<div className={styles.buildingType__percentage}>
								{Math.round((building.affected / building.total) * 100)}%
							</div>
						</div>
						<div className={styles.buildingType__bar}>
							<div 
								className={styles.buildingType__fill}
								style={{ 
									width: `${(building.affected / building.total) * 100}%`,
									backgroundColor: building.color
								}}
							></div>
						</div>
						<div className={styles.buildingType__value}>
							Estimated Loss: ${building.value}M USD
						</div>
					</div>
				))}
			</div>

			{/* Emergency Response Status */}
			<div className={styles.emergencyResponse}>
				<h3 className={styles.sectionTitle}>Emergency Response Status</h3>
				<div className={styles.emergencyGrid}>
					<div className={styles.emergencyItem}>
						<div className={styles.emergencyItem__icon}>EMRG</div>
						<div className={styles.emergencyItem__content}>
							<div className={styles.emergencyItem__value}>{metrics.emergencyServices}</div>
							<div className={styles.emergencyItem__label}>Emergency Stations Accessible</div>
						</div>
					</div>

					<div className={styles.emergencyItem}>
						<div className={styles.emergencyItem__icon}>EVAC</div>
						<div className={styles.emergencyItem__content}>
							<div className={styles.emergencyItem__value}>{metrics.evacuationRoutes}</div>
							<div className={styles.emergencyItem__label}>Evacuation Routes Available</div>
						</div>
					</div>
				</div>
			</div>

			{/* Export Actions */}
			<div className={styles.actions}>
				<button className={styles.exportButton}>
					<span className={styles.exportButton__icon}>EXPORT</span>
					<span className={styles.exportButton__text}>Export Detailed Report</span>
				</button>
			</div>
		</div>
	);
};

export default EnhancedFloodMetrics;

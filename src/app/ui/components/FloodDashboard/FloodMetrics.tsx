import React, { useState, useEffect } from 'react';
import styles from './FloodMetrics.scss';
import FloodSimulationSystem from '~/app/systems/FloodSimulationSystem';
import { ImpactAnalysisResults } from '~/app/systems/ImpactAnalysisSystem';
import { PDFExportService } from '~/app/services/PDFExportService';

const FloodMetrics: React.FC = () => {
	const [impactAnalysis, setImpactAnalysis] = useState<ImpactAnalysisResults | null>(null);
	const [isExportingPDF, setIsExportingPDF] = useState(false);

	// Check for impact analysis updates
	useEffect(() => {
		const checkForImpactAnalysis = (): void => {
			// Access FloodSimulationSystem through global app instance
			if ((window as any).app && (window as any).app.systemManagerInstance) {
				const systemManager = (window as any).app.systemManagerInstance;
				const floodSystem = systemManager.getSystem(FloodSimulationSystem);
				if (floodSystem) {
					const results = floodSystem.getImpactAnalysis();
					setImpactAnalysis(results);
				}
			}
		};

		// Check immediately and then every 2 seconds
		checkForImpactAnalysis();
		const interval = setInterval(checkForImpactAnalysis, 2000);

		return () => clearInterval(interval);
	}, []);

	const handleExportPDF = async (): Promise<void> => {
		if (!impactAnalysis) {
			console.warn('No impact analysis data available for export');
			return;
		}

		try {
			setIsExportingPDF(true);
			await PDFExportService.exportImpactAnalysisToPDF(impactAnalysis, {
				includeTimestamp: true,
				includeLogo: true,
				includeDetailedBreakdown: true,
				includeFloodParameters: true
			});
			console.log('✅ Flood impact report exported successfully');
		} catch (error) {
			console.error('❌ Failed to export PDF report:', error);
		} finally {
			setIsExportingPDF(false);
		}
	};

	// Use real data if available, otherwise show zeros
	const metrics = impactAnalysis ? {
		affectedBuildings: impactAnalysis.summary.buildingsAtRisk,
		totalBuildings: 1543, // Keep total as reference
		affectedPopulation: impactAnalysis.summary.peopleAffected,
		totalPopulation: 8420, // Keep total as reference
		economicLoss: impactAnalysis.summary.economicLoss / 1000000, // Convert to millions
		highRiskAreas: impactAnalysis.summary.highRiskArea / 1000000, // Convert to km²
		evacuationRoutes: impactAnalysis.emergencyResponse.evacuationRoutes,
		emergencyServices: impactAnalysis.emergencyResponse.emergencyServices
	} : {
		affectedBuildings: 0,
		totalBuildings: 1543,
		affectedPopulation: 0,
		totalPopulation: 8420,
		economicLoss: 0,
		highRiskAreas: 0,
		evacuationRoutes: 8,
		emergencyServices: 3
	};

	const buildingTypes = impactAnalysis ?
		impactAnalysis.buildingCategories.map(category => ({
			type: category.category,
			affected: category.affectedCount,
			total: category.totalCount,
			value: category.estimatedLoss / 1000000 // Convert to millions
		})) : [
		{ type: 'Residential', affected: 0, total: 1200, value: 0 },
		{ type: 'Commercial', affected: 0, total: 180, value: 0 },
		{ type: 'Industrial', affected: 0, total: 95, value: 0 },
		{ type: 'Public', affected: 0, total: 68, value: 0 }
	];

	return (
		<div className={styles.floodMetrics}>
			<div className={styles.section}>
				<h3 className={styles.sectionTitle}>Impact Summary</h3>
				
				<div className={styles.metricsGrid}>
					<div className={styles.metric}>
						<div className={styles.metric__value}>{metrics.affectedBuildings}</div>
						<div className={styles.metric__label}>Buildings at Risk</div>
						<div className={styles.metric__subtitle}>
							of {metrics.totalBuildings} total
						</div>
					</div>

					<div className={styles.metric}>
						<div className={styles.metric__value}>{metrics.affectedPopulation}</div>
						<div className={styles.metric__label}>People Affected</div>
						<div className={styles.metric__subtitle}>
							of {metrics.totalPopulation} total
						</div>
					</div>

					<div className={styles.metric}>
						<div className={styles.metric__value}>${metrics.economicLoss}M</div>
						<div className={styles.metric__label}>Economic Loss</div>
						<div className={styles.metric__subtitle}>
							Estimated damage
						</div>
					</div>

					<div className={styles.metric}>
						<div className={styles.metric__value}>{metrics.highRiskAreas.toFixed(3)} km²</div>
						<div className={styles.metric__label}>High Risk Area</div>
						<div className={styles.metric__subtitle}>
							Depth &gt; 1m
						</div>
					</div>
				</div>
			</div>

			<div className={styles.section}>
				<h3 className={styles.sectionTitle}>Building Impact Analysis</h3>
				
				<div className={styles.buildingAnalysis}>
					{buildingTypes.map((building, index) => (
						<div key={index} className={styles.buildingType}>
							<div className={styles.buildingType__header}>
								<span className={styles.buildingType__name}>{building.type}</span>
								<span className={styles.buildingType__count}>
									{building.affected}
								</span>
							</div>
							<div className={styles.buildingType__bar}>
								<div 
									className={styles.buildingType__fill}
									style={{ width: `${(building.affected / building.total) * 100}%` }}
								></div>
							</div>
							<div className={styles.buildingType__value}>
								${building.value}M estimated loss
							</div>
						</div>
					))}
				</div>
			</div>

			<div className={styles.section}>
				<h3 className={styles.sectionTitle}>Emergency Response</h3>
				
				<div className={styles.emergencyInfo}>
					<div className={styles.emergencyItem}>
						<div className={styles.emergencyItem__icon}>🚨</div>
						<div className={styles.emergencyItem__content}>
							<div className={styles.emergencyItem__title}>Emergency Services</div>
							<div className={styles.emergencyItem__value}>
								{metrics.emergencyServices} stations accessible
							</div>
						</div>
					</div>

					<div className={styles.emergencyItem}>
						<div className={styles.emergencyItem__icon}>🛣️</div>
						<div className={styles.emergencyItem__content}>
							<div className={styles.emergencyItem__title}>Evacuation Routes</div>
							<div className={styles.emergencyItem__value}>
								{metrics.evacuationRoutes} routes available
							</div>
						</div>
					</div>

					<div className={styles.emergencyItem}>
						<div className={styles.emergencyItem__icon}>⚠️</div>
						<div className={styles.emergencyItem__content}>
							<div className={styles.emergencyItem__title}>Risk Level</div>
							<div className={styles.emergencyItem__value}>
								<span className={
									impactAnalysis ?
										(impactAnalysis.emergencyResponse.riskLevel === 'HIGH' ? styles.riskHigh :
										 impactAnalysis.emergencyResponse.riskLevel === 'MEDIUM' ? styles.riskMedium :
										 styles.riskLow) :
										styles.riskLow
								}>
									{impactAnalysis ? impactAnalysis.emergencyResponse.riskLevel : 'LOW'}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className={styles.section}>
				<button
					className={styles.exportButton}
					onClick={handleExportPDF}
					disabled={!impactAnalysis || isExportingPDF}
					style={{
						opacity: (!impactAnalysis || isExportingPDF) ? 0.5 : 1,
						cursor: (!impactAnalysis || isExportingPDF) ? 'not-allowed' : 'pointer'
					}}
				>
					{isExportingPDF ? '⏳ Generating...' : '📊 Export Report'}
				</button>
			</div>
		</div>
	);
};

export default FloodMetrics;

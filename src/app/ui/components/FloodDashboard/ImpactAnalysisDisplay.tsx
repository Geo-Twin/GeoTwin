/**
 * Impact Analysis Display Component
 * Shows real-time flood impact metrics based on actual flood simulation results
 */

import React from 'react';
import ImpactAnalysisSystem, { ImpactAnalysisResults } from '~/app/systems/ImpactAnalysisSystem';
import { Box, Text, Group, Stack, Button } from '@mantine/core';
import { IconDownload, IconAlertTriangle, IconHome, IconUsers, IconCurrencyDollar, IconMap } from '@tabler/icons-react';

interface ImpactAnalysisDisplayProps {
	impactAnalysis: ImpactAnalysisResults | null;
	onExportPDF: () => void;
	isExporting: boolean;
}

export const ImpactAnalysisDisplay: React.FC<ImpactAnalysisDisplayProps> = ({
	impactAnalysis,
	onExportPDF,
	isExporting
}) => {
	if (!impactAnalysis) {
		return (
			<Box style={{
				backgroundColor: '#23293a',
				border: '1px solid #3a4553',
				borderRadius: '12px',
				padding: '20px'
			}}>
				<Group style={{ gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
					<IconAlertTriangle size={20} color="#4a90e2" />
					<Text style={{
						fontSize: '16px',
						fontWeight: 600,
						color: '#ffffff',
						fontFamily: 'Inter, Roboto, sans-serif'
					}}>
						Impact Analysis
					</Text>
				</Group>
				<Text style={{
					fontSize: '14px',
					color: '#a0a0a0',
					fontFamily: 'Inter, Roboto, sans-serif'
				}}>
					Run a flood simulation to see impact analysis results
				</Text>
			</Box>
		);
	}

	const { summary, buildingCategories, emergencyResponse } = impactAnalysis;

	// Format large numbers
	const formatNumber = (num: number): string => {
		if (num >= 1000000) {
			return `${(num / 1000000).toFixed(1)}M`;
		} else if (num >= 1000) {
			return `${(num / 1000).toFixed(1)}K`;
		}
		return num.toLocaleString();
	};

	// Format currency
	const formatCurrency = (amount: number): string => {
		if (amount >= 1000000) {
			return `$${(amount / 1000000).toFixed(1)}M`;
		} else if (amount >= 1000) {
			return `$${(amount / 1000).toFixed(0)}K`;
		}
		return `$${amount.toLocaleString()}`;
	};

	// Format area
	const formatArea = (area: number): string => {
		if (area >= 1000000) {
			return `${(area / 1000000).toFixed(2)} km²`;
		}
		return `${(area / 10000).toFixed(1)} ha`;
	};

	// Get risk level color
	const getRiskLevelColor = (level: string): string => {
		switch (level) {
			case 'HIGH': return '#e74c3c';
			case 'MEDIUM': return '#f39c12';
			case 'LOW': return '#27ae60';
			default: return '#4a90e2';
		}
	};

	return (
		<Box style={{
			backgroundColor: '#23293a',
			border: '1px solid #3a4553',
			borderRadius: '12px',
			padding: '20px'
		}}>
			<Stack style={{ gap: '20px' }}>
				{/* Header with Export Button */}
				<Group style={{ justifyContent: 'space-between', alignItems: 'center' }}>
					<Group style={{ gap: '8px', alignItems: 'center' }}>
						<IconAlertTriangle size={20} color="#4a90e2" />
						<Text style={{
							fontSize: '16px',
							fontWeight: 600,
							color: '#ffffff',
							fontFamily: 'Inter, Roboto, sans-serif'
						}}>
							Impact Analysis
						</Text>
					</Group>
					<Button
						onClick={onExportPDF}
						loading={isExporting}
						size="sm"
						style={{
							backgroundColor: '#4a90e2',
							border: 'none',
							borderRadius: '6px',
							fontSize: '12px',
							fontFamily: 'Inter, Roboto, sans-serif'
						}}
						leftSection={<IconDownload size={14} />}
					>
						Export Report
					</Button>
				</Group>

				{/* Impact Summary */}
				<Box>
					<Text style={{
						fontSize: '14px',
						fontWeight: 600,
						color: '#ffffff',
						marginBottom: '12px',
						fontFamily: 'Inter, Roboto, sans-serif'
					}}>
						Impact Summary
					</Text>
					<Stack style={{ gap: '8px' }}>
						<Group style={{ justifyContent: 'space-between' }}>
							<Group style={{ gap: '6px', alignItems: 'center' }}>
								<IconHome size={14} color="#4a90e2" />
								<Text style={{ fontSize: '13px', color: '#ffffff', fontFamily: 'Inter, Roboto, sans-serif' }}>
									Buildings at Risk:
								</Text>
							</Group>
							<Text style={{ fontSize: '13px', color: '#ffffff', fontWeight: 600, fontFamily: 'Inter, Roboto, sans-serif' }}>
								{formatNumber(summary.buildingsAtRisk)}
							</Text>
						</Group>
						<Group style={{ justifyContent: 'space-between' }}>
							<Group style={{ gap: '6px', alignItems: 'center' }}>
								<IconUsers size={14} color="#4a90e2" />
								<Text style={{ fontSize: '13px', color: '#ffffff', fontFamily: 'Inter, Roboto, sans-serif' }}>
									People Affected:
								</Text>
							</Group>
							<Text style={{ fontSize: '13px', color: '#ffffff', fontWeight: 600, fontFamily: 'Inter, Roboto, sans-serif' }}>
								{formatNumber(summary.peopleAffected)}
							</Text>
						</Group>
						<Group style={{ justifyContent: 'space-between' }}>
							<Group style={{ gap: '6px', alignItems: 'center' }}>
								<IconCurrencyDollar size={14} color="#4a90e2" />
								<Text style={{ fontSize: '13px', color: '#ffffff', fontFamily: 'Inter, Roboto, sans-serif' }}>
									Economic Loss:
								</Text>
							</Group>
							<Text style={{ fontSize: '13px', color: '#ffffff', fontWeight: 600, fontFamily: 'Inter, Roboto, sans-serif' }}>
								{formatCurrency(summary.economicLoss)}
							</Text>
						</Group>
						<Group style={{ justifyContent: 'space-between' }}>
							<Group style={{ gap: '6px', alignItems: 'center' }}>
								<IconMap size={14} color="#4a90e2" />
								<Text style={{ fontSize: '13px', color: '#ffffff', fontFamily: 'Inter, Roboto, sans-serif' }}>
									High Risk Area:
								</Text>
							</Group>
							<Text style={{ fontSize: '13px', color: '#ffffff', fontWeight: 600, fontFamily: 'Inter, Roboto, sans-serif' }}>
								{formatArea(summary.highRiskArea)}
							</Text>
						</Group>
					</Stack>
				</Box>

				{/* Building Impact Analysis */}
				<Box>
					<Text style={{
						fontSize: '14px',
						fontWeight: 600,
						color: '#ffffff',
						marginBottom: '12px',
						fontFamily: 'Inter, Roboto, sans-serif'
					}}>
						Building Impact Analysis
					</Text>
					<Stack style={{ gap: '6px' }}>
						{buildingCategories.map((category) => (
							<Group key={category.category} style={{ justifyContent: 'space-between' }}>
								<Text style={{ fontSize: '13px', color: '#ffffff', fontFamily: 'Inter, Roboto, sans-serif' }}>
									{category.category}:
								</Text>
								<Text style={{ fontSize: '13px', color: '#ffffff', fontFamily: 'Inter, Roboto, sans-serif' }}>
									{category.affectedCount}/{category.totalCount} buildings, {formatCurrency(category.estimatedLoss)} estimated loss
								</Text>
							</Group>
						))}
					</Stack>
				</Box>

				{/* Emergency Response Analysis */}
				<Box>
					<Text style={{
						fontSize: '14px',
						fontWeight: 600,
						color: '#ffffff',
						marginBottom: '12px',
						fontFamily: 'Inter, Roboto, sans-serif'
					}}>
						Emergency Response Analysis
					</Text>
					<Stack style={{ gap: '6px' }}>
						<Group style={{ justifyContent: 'space-between' }}>
							<Text style={{ fontSize: '13px', color: '#ffffff', fontFamily: 'Inter, Roboto, sans-serif' }}>
								Emergency Services:
							</Text>
							<Text style={{ fontSize: '13px', color: '#ffffff', fontFamily: 'Inter, Roboto, sans-serif' }}>
								{emergencyResponse.emergencyServices} stations accessible 🏥
							</Text>
						</Group>
						<Group style={{ justifyContent: 'space-between' }}>
							<Text style={{ fontSize: '13px', color: '#ffffff', fontFamily: 'Inter, Roboto, sans-serif' }}>
								Evacuation Routes:
							</Text>
							<Text style={{ fontSize: '13px', color: '#ffffff', fontFamily: 'Inter, Roboto, sans-serif' }}>
								{emergencyResponse.evacuationRoutes} routes available 🛣️
							</Text>
						</Group>
						<Group style={{ justifyContent: 'space-between' }}>
							<Text style={{ fontSize: '13px', color: '#ffffff', fontFamily: 'Inter, Roboto, sans-serif' }}>
								Risk Level:
							</Text>
							<Text style={{ 
								fontSize: '13px', 
								color: getRiskLevelColor(emergencyResponse.riskLevel), 
								fontWeight: 600,
								fontFamily: 'Inter, Roboto, sans-serif' 
							}}>
								{emergencyResponse.riskLevel} ⚠️
							</Text>
						</Group>
					</Stack>
				</Box>

				{/* Timestamp */}
				<Text style={{
					fontSize: '11px',
					color: '#666',
					fontStyle: 'italic',
					textAlign: 'center',
					fontFamily: 'Inter, Roboto, sans-serif'
				}}>
					Analysis generated: {impactAnalysis.timestamp.toLocaleString()}
				</Text>
			</Stack>
		</Box>
	);
};

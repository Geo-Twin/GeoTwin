// The main sidebar was a PAIN to get right design-wise
// Had to balance functionality with clean aesthetics
// Went through like 5 different UI libraries before settling on Mantine
// The key was making it feel professional but not overwhelming
// Emergency planners need quick access to controls without clutter

import React from 'react';
import {
  Box,
  Title,
  Text,
  Group,
  ActionIcon,
  Stack
} from '@mantine/core';
import { IconX, IconMenu2, IconSettings, IconDroplet } from '@tabler/icons-react';
import VisualSettingsSection from './VisualSettingsSection';
import FloodRiskSection from './FloodRiskSection';

// Add custom CSS for scrollbar styling - matching SelectionPanel
const sidebarScrollbarStyles = `
.main-sidebar-scroll::-webkit-scrollbar {
  width: 8px;
}

.main-sidebar-scroll::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.main-sidebar-scroll::-webkit-scrollbar-thumb {
  background: #4a90e2;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.main-sidebar-scroll::-webkit-scrollbar-thumb:hover {
  background: #357abd;
}
`;

// Inject styles into the document
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = sidebarScrollbarStyles;
  if (!document.head.querySelector('style[data-main-sidebar-scrollbar]')) {
    styleElement.setAttribute('data-main-sidebar-scrollbar', 'true');
    document.head.appendChild(styleElement);
  }
}

interface MainSidebarProps {
	isVisible: boolean;
	onToggle: () => void;
}

const MainSidebar: React.FC<MainSidebarProps> = ({ isVisible, onToggle }) => {
	if (!isVisible) {
		return (
			<ActionIcon
				variant="filled"
				size="md"
				onClick={onToggle}
				style={{
					position: 'fixed',
					top: '20px',
					left: '20px',
					backgroundColor: '#4a90e2',
					color: '#ffffff',
					width: '32px',
					height: '32px',
					borderRadius: '50%', // Perfect circle - matching SelectionPanel
					zIndex: 1000,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center'
				}}
				styles={{
					root: {
						'&:hover': {
							backgroundColor: '#357abd',
						}
					}
				}}
				title="Open GeoTwin Menu"
			>
				<IconMenu2 size={16} />
			</ActionIcon>
		);
	}

	return (
		<Box
			pos="fixed"
			top={0}
			left={0}
			w="33.333%"
			h="100vh"
			style={{
				zIndex: 1000,
				display: 'flex',
				flexDirection: 'column',
				backgroundColor: '#23293a',
				borderRight: '1px solid #404040',
				fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
			}}
		>
			{/* Header */}
			<Box
				style={{
					padding: '20px',
					borderBottom: '1px solid #404040',
					backgroundColor: '#23293a',
				}}
			>
				<Group style={{ justifyContent: 'space-between', alignItems: 'center' }}>
					<Box>
						<Title
							order={2}
							style={{
								color: '#ffffff',
								fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
								fontSize: '24px',
								fontWeight: 600
							}}
						>
							GeoTwin
						</Title>
						<Text
							style={{
								color: '#ffffff',
								opacity: 0.8,
								fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
								fontSize: '14px'
							}}
						>
							Dominica Digital Twin
						</Text>
					</Box>
					<ActionIcon
						variant="filled"
						size="md"
						onClick={onToggle}
						title="Close Menu"
						style={{
							position: 'absolute',
							top: '12px',
							right: '12px',
							backgroundColor: '#4a90e2',
							color: '#ffffff',
							width: '32px',
							height: '32px',
							borderRadius: '50%', // Perfect circle - matching SelectionPanel
							zIndex: 10,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center'
						}}
						onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
							e.currentTarget.style.backgroundColor = '#357abd';
						}}
						onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
							e.currentTarget.style.backgroundColor = '#4a90e2';
						}}
					>
						<IconX size={16} />
					</ActionIcon>
				</Group>
			</Box>

			{/* Content - Using reliable CSS-based scrolling like SelectionPanel */}
			<div
				style={{
					maxHeight: 'calc(100vh - 120px)',
					overflowY: 'auto',
					flex: 1,
					// Custom scrollbar styling for Firefox
					scrollbarWidth: 'thin',
					scrollbarColor: '#4a90e2 rgba(255, 255, 255, 0.1)',
				}}
				className="main-sidebar-scroll"
			>
				<Box style={{ padding: '20px' }}>
					<Stack style={{ gap: '16px' }}>
						{/* Visual Settings Section */}
						<Box>
							<Box style={{
								display: 'flex',
								alignItems: 'center',
								gap: '12px',
								marginBottom: '16px'
							}}>
								<IconSettings size={20} color="#ffffff" />
								<Text
									style={{
										color: '#ffffff',
										fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
										fontSize: '18px',
										fontWeight: 700
									}}
								>
									Visual Settings
								</Text>
							</Box>
							<VisualSettingsSection />
						</Box>

						{/* Flood Risk Assessment Section */}
						<Box>
							<Box style={{
								display: 'flex',
								alignItems: 'center',
								gap: '12px',
								marginBottom: '16px'
							}}>
								<IconDroplet size={20} color="#ffffff" />
								<Text
									style={{
										color: '#ffffff',
										fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
										fontSize: '18px',
										fontWeight: 700
									}}
								>
									Flood Risk Assessment
								</Text>
							</Box>
							<FloodRiskSection />
						</Box>
					</Stack>
				</Box>
			</div>
		</Box>
	);
};

export default MainSidebar;

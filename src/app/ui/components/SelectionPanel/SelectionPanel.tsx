import React, {useCallback, useContext, useEffect, useState} from "react";
import {useRecoilState} from "recoil";
import {AtomsContext} from "~/app/ui/UI";
import buildingTypes from "~/app/ui/components/SelectionPanel/buildingTypes";
import { DominicaBuildingMatch } from "~/app/data/DominicaBuildingDataLoader";
import { getMainThreadDominicaDataLoader } from "~/app/data/initializeDominicaData";
import {
  Paper,
  Title,
  Text,
  Group,
  Stack,
  ActionIcon,
  Button,
  Table,
  Skeleton,
  Box,
  Anchor,
  Transition
} from '@mantine/core';
import { IconX, IconExternalLink, IconEdit } from '@tabler/icons-react';

// Add custom CSS for scrollbar styling
const scrollbarStyles = `
.selection-panel-tags-scroll::-webkit-scrollbar {
  width: 8px;
}

.selection-panel-tags-scroll::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.selection-panel-tags-scroll::-webkit-scrollbar-thumb {
  background: #4a90e2;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.selection-panel-tags-scroll::-webkit-scrollbar-thumb:hover {
  background: #357abd;
}
`;

// Inject styles into the document
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = scrollbarStyles;
  if (!document.head.querySelector('style[data-selection-panel-scrollbar]')) {
    styleElement.setAttribute('data-selection-panel-scrollbar', 'true');
    document.head.appendChild(styleElement);
  }
}

enum FeatureType {
	Way,
	Relation
}

interface FeatureDescription {
	name: string;
	typeAndID: string;
	tags: Record<string, string>;
	osmURL: string;
	idURL: string;
	dominicaData?: DominicaBuildingMatch | null;
}

const getOSMURL = (type: FeatureType, id: number): string => {
	const typeStr = type === FeatureType.Way ? 'way' : 'relation';
	return `https://api.openstreetmap.org/api/0.6/${typeStr}/${id}.json`;
}

const getType = (tags: Record<string, string>): string => {
	return buildingTypes[tags.building] ?? buildingTypes.yes;
}

// Calculate center coordinates from OSM elements
const calculateCenter = (osmElements: any[]): [number, number] | null => {
	const nodes = osmElements.filter(el => el.type === 'node' && el.lat && el.lon);

	if (nodes.length === 0) {
		return null;
	}

	const sumLat = nodes.reduce((sum, node) => sum + node.lat, 0);
	const sumLon = nodes.reduce((sum, node) => sum + node.lon, 0);

	return [sumLon / nodes.length, sumLat / nodes.length];
};

// Simple Dominica data lookup function
const getDominicaData = async (osmElements: any[]): Promise<DominicaBuildingMatch | null> => {
	// console.log('getDominicaData called with OSM elements:', osmElements.length);

	const dataLoader = getMainThreadDominicaDataLoader();
	// console.log('Data loader available:', !!dataLoader);
	// console.log('Data loader loaded:', dataLoader?.isDataLoaded());

	if (!dataLoader || !dataLoader.isDataLoaded()) {
		console.log('❌ Data loader not available or not loaded');
		return null;
	}

	// Calculate center coordinates from all elements
	const coordinates = calculateCenter(osmElements);

	if (!coordinates) {
		// Could not calculate center coordinates
		return null;
	}

	// Try to find matching building data with increasing search radius
	const searchRadii = [0.0005, 0.001, 0.002, 0.005, 0.01]; // ~50m, 100m, 200m, 500m, 1km

	for (const radius of searchRadii) {
		const result = dataLoader.getBuildingInfo(coordinates, radius);
		if (result) {
			return result;
		}
	}

	// No Dominica data found for coordinates
	return null;
}

const getTags = (tags: Record<string, string>, dominicaData?: DominicaBuildingMatch | null): JSX.Element => {
	const allTags = { ...tags };

	// Seamlessly integrate Dominica data - no visual distinction, just complete information
	if (dominicaData && dominicaData.originalData) {
		const props = dominicaData.originalData.allProperties;

		// Add Dominica data as regular OSM-style tags
		if (props.PARISH) allTags['parish'] = props.PARISH;
		if (props.COMMUNITY) allTags['community'] = props.COMMUNITY;
		if (props.OCCUPANCY) allTags['occupancy'] = props.OCCUPANCY;
		if (props.ROOF_TYPE) allTags['roof:material'] = props.ROOF_TYPE;
		if (props.ROOF_SHAPE) allTags['roof:shape'] = props.ROOF_SHAPE;
		if (props.CONSTR_TYP) allTags['building:material'] = props.CONSTR_TYP;
		if (props.AREA) allTags['area'] = String(props.AREA);
		if (props.VALUE) allTags['building:value'] = String(props.VALUE);
		if (props.NAME && props.NAME !== 'Unnamed') allTags['name:local'] = props.NAME;
	}

	const rows = Object.entries(allTags).map(([key, value]) => (
		<Table.Tr key={key}>
			<Table.Td
				style={{
					fontWeight: 600,
					color: '#ffffff',
					fontSize: '12px',
					fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
					padding: '8px 12px',
					borderBottom: '1px solid #3a4553',
					backgroundColor: 'rgba(255, 255, 255, 0.03)',
					minWidth: '100px',
					verticalAlign: 'top'
				}}
			>
				{key}
			</Table.Td>
			<Table.Td
				style={{
					fontSize: '12px',
					wordBreak: 'break-word',
					color: '#ffffff',
					fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
					padding: '8px 12px',
					borderBottom: '1px solid #3a4553',
					backgroundColor: '#2d3748',
					lineHeight: '1.3'
				}}
			>
				{value}
			</Table.Td>
		</Table.Tr>
	));

	return (
		<div
			style={{
				maxHeight: '150px',
				overflowY: 'auto',
				borderRadius: '12px',
				border: '1px solid #3a4553',
				backgroundColor: '#2d3748',
				// Custom scrollbar styling for Firefox
				scrollbarWidth: 'thin',
				scrollbarColor: '#4a90e2 rgba(255, 255, 255, 0.1)',
			}}
			className="selection-panel-tags-scroll"
		>
			<Table
				style={{
					backgroundColor: 'transparent',
					width: '100%',
					fontSize: '12px',
					borderCollapse: 'collapse',
					margin: 0
				}}
			>
				<Table.Tbody>
					{rows}
				</Table.Tbody>
			</Table>
		</div>
	);
}

const SelectionPanel: React.FC = () => {
	const atoms = useContext(AtomsContext);
	const [activeFeature, setActiveFeature] = useRecoilState(atoms.activeFeature);
	const [description, setDescription] = useState<FeatureDescription>(null);

	// Clear description when feature is deselected
	useEffect(() => {
		if (activeFeature === null) {
			setDescription(null);
		}
	}, [activeFeature]);

	useEffect(() => {
		if (!activeFeature) {
			return;
		}

		let loaded = false;
		setTimeout(() => {
			if (!loaded) {
				setDescription(null);
			}
		}, 500);

		const type = activeFeature.type === 0 ? FeatureType.Way : FeatureType.Relation;
		const id = activeFeature.id;

		// For ways, we need the full endpoint to get node coordinates
		const osmUrl = type === FeatureType.Way
			? `https://api.openstreetmap.org/api/0.6/way/${id}/full.json`
			: getOSMURL(type, id);

		const osmRequest = fetch(osmUrl, {
			method: 'GET'
		});

		osmRequest.then(async osmResponse => {
			const osm = await osmResponse.json();

			if (!osm.elements || osm.elements.length === 0) {
				return;
			}

			loaded = true;

			// For ways, find the way element (not the nodes)
			const wayElement = osm.elements.find((el: any) => el.type === 'way' || el.type === 'relation') || osm.elements[0];
			const tags = wayElement.tags ?? {};

			// Try to get Dominica data using all elements (for coordinate calculation)
			const dominicaData = await getDominicaData(osm.elements);

			const name = tags.name ?? (dominicaData?.originalData?.allProperties?.OCCUPANCY || 'Unnamed building');
			const featureType = activeFeature.type === 0 ? 'Way' : 'Relation';
			const type = getType(tags);
			const osmURL = `https://www.openstreetmap.org/${activeFeature.type === 0 ? 'way' : 'relation'}/${id}`;
			const idURL = `https://www.openstreetmap.org/edit?${activeFeature.type === 0 ? 'way' : 'relation'}=${id}`;

			setDescription({
				name,
				typeAndID: `${type} · ${featureType} №${id}${dominicaData ? ' · Osm and local data' : ''}`,
				osmURL,
				idURL,
				tags,
				dominicaData
			});
		});
	}, [activeFeature]);

	const tags = description ? getTags(description.tags, description.dominicaData) : null;

	return (
		<Box
			style={{
				position: 'fixed',
				bottom: 0,
				left: '50%',
				transform: 'translateX(-50%)',
				width: '400px',
				maxWidth: '90%',
				maxHeight: '60vh', 
				zIndex: 1000,
				pointerEvents: 'none',
				fontFamily: "'Inter', 'Roboto', system-ui, sans-serif"
			}}
		>
			<Transition
				mounted={activeFeature !== null}
				transition="slide-up"
				duration={400}
				timingFunction="ease"
			>
				{(styles): React.ReactElement => (
					<Paper
						shadow="lg"
						radius="xl"
						p="md" // Reduced padding for more space
						style={{
							...styles,
							pointerEvents: 'auto',
							backgroundColor: '#23293a',
							borderColor: '#4a5568',
							border: '1px solid #4a5568',
							borderBottomLeftRadius: 0,
							borderBottomRightRadius: 0,
							borderBottom: 'none',
							borderTopLeftRadius: '20px',
							borderTopRightRadius: '20px',
							maxHeight: '100%',
							boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
							fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
							position: 'relative',
							overflow: 'hidden' // Prevent content spillover
						}}
					>
						{/* Close button - Perfect Circle */}
						<ActionIcon
							variant="filled"
							size="md"
							onClick={(): void => setActiveFeature(null)}
							style={{
								position: 'absolute',
								top: '12px',
								right: '12px',
								backgroundColor: '#4a90e2',
								color: '#ffffff',
								width: '32px',
								height: '32px',
								borderRadius: '50%', // Perfect circle
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

						{/* Header section - Compact */}
						<Box style={{ marginRight: '45px', marginBottom: '12px' }}>
							<Title
								order={4}
								mb={2}
								style={{
									wordBreak: 'break-word',
									color: '#ffffff',
									fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
									fontWeight: 600,
									fontSize: '18px',
									lineHeight: '1.2'
								}}
							>
								{description ? description.name : <Skeleton height={20} width="70%" />}
							</Title>
							{description ? (
								<Text
									size="sm"
									style={{
										color: '#ffffff',
										opacity: 0.8,
										fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
										fontSize: '13px'
									}}
								>
									{description.typeAndID}
								</Text>
							) : (
								<Skeleton height={14} width="65%" />
							)}
						</Box>

						{/* Button section - Compact */}
						<Group spacing="xs" mb="md">
							{description ? (
								<>
									<Anchor href={description.osmURL} target="_blank" underline={false}>
										<Button
											variant="outline"
											size="xs"
											leftSection={<IconExternalLink size={14} />}
											color="blue"
											radius="md"
											style={{
												borderColor: '#4a90e2',
												color: '#4a90e2',
												backgroundColor: 'transparent',
												fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
												fontWeight: 500,
												fontSize: '12px'
											}}
											onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
												e.currentTarget.style.backgroundColor = 'rgba(74, 144, 226, 0.1)';
												e.currentTarget.style.borderColor = '#357abd';
												e.currentTarget.style.color = '#357abd';
											}}
											onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
												e.currentTarget.style.backgroundColor = 'transparent';
												e.currentTarget.style.borderColor = '#4a90e2';
												e.currentTarget.style.color = '#4a90e2';
											}}
										>
											OSM
										</Button>
									</Anchor>
									<Anchor href={description.idURL} target="_blank" underline={false}>
										<Button
											variant="outline"
											size="xs"
											leftSection={<IconEdit size={14} />}
											color="blue"
											radius="md"
											style={{
												borderColor: '#4a90e2',
												color: '#4a90e2',
												backgroundColor: 'transparent',
												fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
												fontWeight: 500,
												fontSize: '12px'
											}}
											onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
												e.currentTarget.style.backgroundColor = 'rgba(74, 144, 226, 0.1)';
												e.currentTarget.style.borderColor = '#357abd';
												e.currentTarget.style.color = '#357abd';
											}}
											onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
												e.currentTarget.style.backgroundColor = 'transparent';
												e.currentTarget.style.borderColor = '#4a90e2';
												e.currentTarget.style.color = '#4a90e2';
											}}
										>
											Edit
										</Button>
									</Anchor>
								</>
							) : (
								<>
									<Skeleton height={28} width={80} radius="md" />
									<Skeleton height={28} width={60} radius="md" />
								</>
							)}
						</Group>

						{/* Tags table with fixed height */}
						{tags ? (
							tags
						) : (
							<Skeleton height={150} radius="xl" />
						)}
					</Paper>
				)}
			</Transition>
		</Box>
	);
}

export default React.memo(SelectionPanel);
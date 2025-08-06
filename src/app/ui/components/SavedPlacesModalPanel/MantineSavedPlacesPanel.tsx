import React, {useContext, useEffect, useLayoutEffect, useRef, useState} from "react";
import {ActionsContext} from "~/app/ui/UI";
import { Stack, Button, Text, Group, Box } from '@mantine/core';
import { IconPlus, IconMapPin } from '@tabler/icons-react';
import {SavedPlaceParams} from './SavedPlace';

// Add custom CSS for scrollbar styling - matching SelectionPanel
const savedPlacesScrollbarStyles = `
.saved-places-scroll::-webkit-scrollbar {
  width: 8px;
}

.saved-places-scroll::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.saved-places-scroll::-webkit-scrollbar-thumb {
  background: #4a90e2;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.saved-places-scroll::-webkit-scrollbar-thumb:hover {
  background: #357abd;
}

.saved-place-item:hover {
  background-color: rgba(74, 144, 226, 0.08) !important;
}
`;

// Inject styles into the document
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = savedPlacesScrollbarStyles;
  if (!document.head.querySelector('style[data-saved-places-scrollbar]')) {
    styleElement.setAttribute('data-saved-places-scrollbar', 'true');
    document.head.appendChild(styleElement);
  }
}

const MantineSavedPlacesPanel: React.FC = () => {
	const actions = useContext(ActionsContext);
	const [savedPlaces, setSavedPlaces] = useState<SavedPlaceParams[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const updateLocalStorage = (data: SavedPlaceParams[]): void => {
		localStorage.setItem('savedPlaces', JSON.stringify(data));
	}

	useLayoutEffect(() => {
		const data: SavedPlaceParams[] = [];

		try {
			const userData = localStorage.getItem('savedPlaces');

			if (userData) {
				const parsedData = JSON.parse(userData);

				if (Array.isArray(parsedData)) {
					for (const item of parsedData) {
						const components = item.link.split(',');
						const lat = +components[0];
						const lon = +components[1];
						const pitch = +components[2];
						const yaw = +components[3];
						const distance = +components[4];
						data.push({
							id: item.id,
							name: item.name,
							lat: lat,
							lon: lon,
							pitch: pitch,
							yaw: yaw,
							distance: distance,
							link: item.link,
							countryCode: item.countryCode,
							address: item.address
						});
					}
				}
			}
		} catch (e) {
			console.error('Failed to load saved places:', e);
		}

		setSavedPlaces(data);
	}, []);

	const addNewPlace = (): void => {
		setIsLoading(true);

		const hash = actions.getControlsStateHash();
		const components = hash.split(',');
		const lat = +components[0];
		const lon = +components[1];

		const urlParams = new URLSearchParams({
			format: 'json',
			addressdetails: '1',
			lat: lat.toString(),
			lon: lon.toString()
		});

		fetch('https://nominatim.openstreetmap.org/reverse?' + urlParams.toString(), {
			method: 'GET'
		}).then(async response => {
			const data = await response.json();

			if (data.error) {
				data.display_name = 'Unknown location';
				data.address = {
					country: 'Earth'
				}
			}

			let address: string;

			if (data.address.state) {
				address = `${data.address.state}, ${data.address.country}`;
			} else {
				address = data.address.country;
			}

			const newPlaces = [...savedPlaces, {
				id: Date.now().toString() + Math.random().toString().slice(2, 10),
				name: data.display_name,
				lat: +components[0],
				lon: +components[1],
				pitch: +components[2],
				yaw: +components[3],
				distance: +components[4],
				link: hash,
				countryCode: data.address.country_code,
				address: address
			}]

			setSavedPlaces(newPlaces);
			updateLocalStorage(newPlaces);
			setIsLoading(false);
		}).catch(err => {
			console.error('Failed to fetch location data:', err);
			setIsLoading(false);
		});
	};

	const goToPlace = (place: SavedPlaceParams): void => {
		actions.goToState(place.lat, place.lon, place.pitch, place.yaw, place.distance);
	};

	return (
		<Stack style={{ gap: '12px' }}>
			{savedPlaces.length > 0 ? (
				<div
					style={{
						maxHeight: '200px',
						overflowY: 'auto',
						// Custom scrollbar styling for Firefox
						scrollbarWidth: 'thin',
						scrollbarColor: '#4a90e2 rgba(255, 255, 255, 0.1)',
					}}
					className="saved-places-scroll"
				>
					<Stack style={{ gap: '8px' }}>
						{savedPlaces.map((place) => (
							<Box
								key={place.id}
								p="xs"
								className="saved-place-item"
								style={{
									backgroundColor: '#2d3748', // Match SelectionPanel background
									border: '1px solid #3a4553', // Match SelectionPanel border
									borderRadius: '8px', // Match SelectionPanel border-radius
									cursor: 'pointer',
									transition: 'background-color 0.2s ease'
								}}
								onClick={(): void => goToPlace(place)}
							>
								<Group style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
									<Box style={{ flex: 1, minWidth: 0 }}>
										<Text
											style={{
												fontSize: '12px',
												fontWeight: 500,
												color: 'white',
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												whiteSpace: 'nowrap'
											}}
										>
											{place.name}
										</Text>
										<Text
											style={{
												fontSize: '12px',
												color: '#a0a0a0',
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												whiteSpace: 'nowrap'
											}}
										>
											{place.address}
										</Text>
									</Box>
									<IconMapPin size={12} color="#4a90e2" />
								</Group>
							</Box>
						))}
					</Stack>
				</div>
			) : (
				<Text
					style={{
						fontSize: '12px',
						color: '#a0a0a0',
						textAlign: 'center',
						padding: '16px 0'
					}}
				>
					Nothing here yet
				</Text>
			)}

			<Button
				variant="outline"
				size="xs"
				fullWidth
				loading={isLoading}
				leftSection={<IconPlus size={14} />}
				onClick={addNewPlace}
				styles={{
					root: {
						borderColor: '#4a90e2',
						color: '#4a90e2',
						backgroundColor: 'transparent',
						fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
						fontWeight: 500,
						fontSize: '12px',
						'&:hover': {
							backgroundColor: 'rgba(74, 144, 226, 0.1)',
							borderColor: '#357abd',
							color: '#357abd'
						}
					},
				}}
			>
				Save current position
			</Button>
		</Stack>
	);
};

export default MantineSavedPlacesPanel;

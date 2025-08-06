import React, {useContext, useState} from "react";
import {ActionsContext} from "~/app/ui/UI";
import { ActionIcon } from '@mantine/core';
import { IconCurrentLocation, IconLoader } from '@tabler/icons-react';

const isGeolocationSupported = !!navigator.geolocation;
const geolocationOptions = {
	enableHighAccuracy: true,
	timeout: 30000,
	maximumAge: 300_000
};

const getPosition = async (): Promise<[number, number]> => {
	return new Promise((resolve) => {
		navigator.geolocation.getCurrentPosition(position => {
			resolve([position.coords.latitude, position.coords.longitude]);
		}, err => {
			console.error(err);
			resolve(null);
		}, geolocationOptions);
	});
}

const GeolocationButton: React.FC = () => {
	const actions = useContext(ActionsContext);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	if (!isGeolocationSupported) {
		return null;
	}

	return (
		<ActionIcon
			size="lg"
			variant="outline"
			loading={isLoading}
			onClick={(): void => {
				if (isLoading) {
					return;
				}

				setIsLoading(true);
				getPosition().then(pos => {
					if (pos) {
						actions.goToLatLon(pos[0], pos[1]);
					}

					setIsLoading(false);
				});
			}}
			style={{
				borderColor: '#4a90e2',
				color: '#4a90e2',
				backgroundColor: 'transparent',
				width: '48px',
				height: '48px',
				borderRadius: '50%',
				border: '2px solid #4a90e2',
				transition: 'all 0.3s ease'
			}}
			styles={{
				root: {
					'&:hover': {
						backgroundColor: 'rgba(74, 144, 226, 0.1)',
						borderColor: '#357abd',
						color: '#357abd',
						transform: 'scale(1.05)'
					},
					'&[data-loading="true"]': {
						borderColor: '#4a90e2',
						color: '#4a90e2'
					}
				}
			}}
			title={isLoading ? 'Getting location...' : 'Go to my location'}
		>
			{isLoading ? <IconLoader size={20} /> : <IconCurrentLocation size={20} />}
		</ActionIcon>
	);
}

export default React.memo(GeolocationButton);
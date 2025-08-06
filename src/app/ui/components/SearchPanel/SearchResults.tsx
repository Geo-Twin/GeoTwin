import React, { useContext } from "react";
import { ActionsContext } from "~/app/ui/UI";
import { Paper, Stack, Text, UnstyledButton } from '@mantine/core';

interface Entry {
	lat: number;
	lon: number;
	name: string;
	type: string;
}

const SearchResults: React.FC<{
	list: Entry[];
}> = ({ list }) => {
	const actions = useContext(ActionsContext);

	return (
		<Paper
			shadow="lg"
			radius="xl"  // Changed from "md" to "xl" for rounder corners
			p="sm"
			mt="xs"
			style={{
				backgroundColor: '#2a3142',
				borderColor: '#4a5568',
				border: '1px solid #4a5568',
				boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
				fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
				width: '100%',
				borderRadius: '16px', // Explicit border radius for the container
			}}
		>
			<Stack spacing={0}>
				{list.map((result, i) => (
					<UnstyledButton
						key={i}
						onClick={(): void => {
							actions.goToLatLon(result.lat, result.lon);
						}}
						p="md"
						styles={{
							root: {
								borderRadius: i === 0 ? '12px 12px 8px 8px' : 
											 i === list.length - 1 ? '8px 8px 12px 12px' : 
											 '8px', // More rounded corners for first/last items
								textAlign: 'left',
								width: '100%',
								borderBottom: i < list.length - 1 ? '1px solid #4a5568' : 'none',
								transition: 'background-color 0.2s ease',
								backgroundColor: '#23293a',
								marginBottom: i < list.length - 1 ? '1px' : '0',
								'&:hover': {
									backgroundColor: '#2d3748'
								},
								'&:first-of-type': {
									borderTopLeftRadius: '12px',
									borderTopRightRadius: '12px'
								},
								'&:last-of-type': {
									borderBottomLeftRadius: '12px',
									borderBottomRightRadius: '12px',
									borderBottom: 'none'
								}
							}
						}}
					>
						<Stack spacing={4}>
							<Text
								size={result.name.length > 40 ? "sm" : "md"}
								weight={600}
								style={{
									lineHeight: 1.3,
									color: '#ffffff',
									fontFamily: "'Inter', 'Roboto', system-ui, sans-serif"
								}}
							>
								{result.name}
							</Text>
							<Text
								size="sm"
								style={{
									color: '#a0aec0',
									fontFamily: "'Inter', 'Roboto', system-ui, sans-serif"
								}}
							>
								{result.type}
							</Text>
						</Stack>
					</UnstyledButton>
				))}
			</Stack>
		</Paper>
	);
}

export default React.memo(SearchResults);
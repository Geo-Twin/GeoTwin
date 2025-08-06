import React, {useCallback, useState} from "react";
import {debounce} from "~/app/ui/utils";
import SearchBar from "~/app/ui/components/SearchPanel/SearchBar";
import SearchResults from "~/app/ui/components/SearchPanel/SearchResults";
import { Box } from '@mantine/core';
import parseLatLon from "~/app/ui/components/SearchPanel/parseLatLon";

interface SearchResult {
	id: string;
	lat: number;
	lon: number;
	name: string;
	type: string;
}

// Dominica geographic bounds for focused search
const DOMINICA_BOUNDS = {
	north: 15.7,
	south: 15.2,
	east: -61.2,
	west: -61.6
};

function isWithinDominica(lat: number, lon: number): boolean {
	return lat >= DOMINICA_BOUNDS.south && lat <= DOMINICA_BOUNDS.north &&
		   lon >= DOMINICA_BOUNDS.west && lon <= DOMINICA_BOUNDS.east;
}

async function searchByText(text: string): Promise<SearchResult[]> {
	text = text.trim();

	const results: SearchResult[] = [];

	if (text.length === 0) {
		return results;
	}

	// Focus search on Dominica region
	const boundedQuery = `${text}, Dominica`;
	const nominatimURL = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(boundedQuery)}&format=jsonv2&bounded=1&viewbox=${DOMINICA_BOUNDS.west},${DOMINICA_BOUNDS.north},${DOMINICA_BOUNDS.east},${DOMINICA_BOUNDS.south}`;
	const response = await fetch(nominatimURL, {
		method: 'GET'
	});
	const jsonResponse = await response.json();
	const latLonMatch = parseLatLon(text);

	if (latLonMatch) {
		const [lat, lon] = latLonMatch;
		// Only show coordinates if they're within Dominica
		if (isWithinDominica(lat, lon)) {
			const name = `${lat}, ${lon}`;

			results.push({
				id: name,
				lat,
				lon,
				name,
				type: 'coordinates'
			});
		}
	}

	// Filter results to only show places within or related to Dominica
	for (let i = 0; i < Math.min(6, jsonResponse.length); i++) {
		const entry = jsonResponse[i];
		const lat = parseFloat(entry.lat);
		const lon = parseFloat(entry.lon);

		// Prioritize results within Dominica, but also include some nearby results
		const isInDominica = isWithinDominica(lat, lon);
		const isNearDominica = !isInDominica &&
			lat >= DOMINICA_BOUNDS.south - 0.5 && lat <= DOMINICA_BOUNDS.north + 0.5 &&
			lon >= DOMINICA_BOUNDS.west - 0.5 && lon <= DOMINICA_BOUNDS.east + 0.5;

		if (isInDominica || (isNearDominica && results.length < 3)) {
			results.push({
				id: entry.place_id.toString(),
				lat,
				lon,
				name: entry.display_name,
				type: `${entry.type}, ${entry.category}${isInDominica ? ' (Dominica)' : ''}`,
			});
		}
	}

	return results;
}

const SearchPanel: React.FC = () => {
	const [currentResults, setCurrentResults] = useState<SearchResult[]>([]);
	const searchCallback = useCallback(debounce((value: string): void => {
		searchByText(value).then(r => {
			setCurrentResults(r);
		});
	}, 1000), []);
	const resetCallback = useCallback(() => {
		setCurrentResults([]);
	}, []);

	return (
		<Box
			style={{
				position: 'absolute',
				top: '20px',
				left: '50%',
				transform: 'translateX(-50%)',
				width: '500px',
				maxWidth: '90vw',
				zIndex: 1000,
				fontFamily: "'Inter', 'Roboto', system-ui, sans-serif"
			}}
		>
			{/* Create a relative container for the search components */}
			<Box style={{ position: 'relative', width: '100%' }}>
				<SearchBar search={searchCallback} reset={resetCallback}/>
				{currentResults.length > 0 && (
					<Box style={{ position: 'relative', width: '100%' }}>
						<SearchResults list={currentResults}/>
					</Box>
				)}
			</Box>
		</Box>
	);
}

export default React.memo(SearchPanel);
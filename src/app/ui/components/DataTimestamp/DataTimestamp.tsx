import React, {useContext} from "react";
import {useRecoilValue} from "recoil";
import { Text } from '@mantine/core';
import {AtomsContext} from "~/app/ui/UI";

const DataTimestamp: React.FC = () => {
	const atoms = useContext(AtomsContext);
	const date = useRecoilValue(atoms.dataTimestamp);

	return (
		<Text
			style={{
				fontSize: '12px',
				color: '#a0a0a0',
				fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
				lineHeight: 1.4
			}}
		>
			Data updated on {date ? date.toLocaleDateString() : '???'} at {date ? date.toLocaleTimeString() : '???'}
		</Text>
	);
};

export default React.memo(DataTimestamp);

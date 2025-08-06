import React from "react";
import { Box, Text } from '@mantine/core';

const MantineSetting: React.FC<{
	name: string;
	isSub?: boolean;
	children: React.ReactNode;
}> = ({name, isSub, children}) => {
	return (
		<Box
			style={{
				padding: isSub ? '8px 0 8px 16px' : '8px 0',
				borderLeft: isSub ? '2px solid #4a90e2' : 'none', // Match SelectionPanel blue
				marginBottom: '8px'
			}}
		>
			{children}
		</Box>
	);
}

export default React.memo(MantineSetting);

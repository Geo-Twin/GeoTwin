import React from "react";
import { ActionIcon } from '@mantine/core';
import { IconX } from '@tabler/icons-react';

const PanelCloseButton: React.FC<{
	onClick: () => void;
}> = ({onClick}) => {
	return (
		<ActionIcon
			variant="filled"
			size="md"
			onClick={onClick}
			style={{
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
			styles={{
				root: {
					'&:hover': {
						backgroundColor: '#357abd',
					}
				}
			}}
		>
			<IconX size={16} />
		</ActionIcon>
	);
}

export default React.memo(PanelCloseButton);
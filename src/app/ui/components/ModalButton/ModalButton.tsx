import React from "react";
import { Button } from '@mantine/core';

const ModalButton: React.FC<{
	text: string;
	onClick?: () => void;
	icon?: React.ReactNode;
	isLoading?: boolean;
}> = ({text, onClick, icon, isLoading}) => {
	return (
		<Button
			variant="outline"
			size="xs"
			radius="md"
			loading={isLoading}
			leftSection={icon}
			onClick={onClick}
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
			{text}
		</Button>
	);
}

export default React.memo(ModalButton);
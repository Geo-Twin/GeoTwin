import React, {useContext} from "react";
import { Box, ActionIcon, Text } from '@mantine/core';
import { IconNavigation } from '@tabler/icons-react';
import {useRecoilValue} from "recoil";
import {ActionsContext, AtomsContext} from "~/app/ui/UI";

const CompassPanel: React.FC = () => {
	const atoms = useContext(AtomsContext);
	const actions = useContext(ActionsContext);
	const direction = useRecoilValue(atoms.northDirection);

	return (
		<Box style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
			<ActionIcon
				size="lg"
				variant="outline"
				onClick={actions.lookAtNorth}
				style={{
					transform: `rotate(${direction}deg)`,
					transition: 'all 0.3s ease',
					borderColor: '#4a90e2',
					color: '#4a90e2',
					backgroundColor: 'transparent',
					width: '48px',
					height: '48px',
					borderRadius: '50%',
					border: '2px solid #4a90e2',
					position: 'relative'
				}}
				styles={{
					root: {
						'&:hover': {
							backgroundColor: 'rgba(74, 144, 226, 0.1)',
							borderColor: '#357abd',
							color: '#357abd',
							transform: `rotate(${direction}deg) scale(1.05)`
						}
					}
				}}
				title="Click to look north"
			>
				<Box style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					<IconNavigation size={16} />
					{/* North indicator - positioned to not rotate with the icon */}
					<Text
						style={{
							position: 'absolute',
							top: '-28px',
							left: '50%',
							transform: `translateX(-50%) rotate(${-direction}deg)`, // Counter-rotate to keep "N" upright
							fontSize: '10px',
							fontWeight: 700,
							color: '#4a90e2',
							fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
							pointerEvents: 'none',
							transition: 'transform 0.3s ease'
						}}
					>
						N
					</Text>
				</Box>
			</ActionIcon>
		</Box>
	);
}

export default React.memo(CompassPanel);
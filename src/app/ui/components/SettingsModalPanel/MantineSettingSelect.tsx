import React, {useContext} from "react";
import {AtomsContext} from "~/app/ui/UI";
import {useRecoilState, useRecoilValue} from "recoil";
import { Button, Group, Text } from '@mantine/core';
import MantineSetting from "./MantineSetting";

const MantineSettingSelect: React.FC<{
	id: string;
}> = ({id}) => {
	const atoms = useContext(AtomsContext);
	const [settingValue, setSettingValue] = useRecoilState(atoms.settingsObject(id));
	const schema = useRecoilValue(atoms.settingsSchema)[id];
	const selected = settingValue.statusValue;

	return (
		<MantineSetting name={schema.label} isSub={!!schema.parent}>
			<Group style={{ gap: '8px' }}>
				{schema.status.map((status, i) => {
					const statusLabel = schema.statusLabels[i];
					const isSelected = selected === status;

					return (
						<Button
							key={status}
							size="xs"
							variant={isSelected ? "filled" : "outline"}
							onClick={(): void => {
								if (selected !== status) {
									setSettingValue({...settingValue, statusValue: status});
								}
							}}
							styles={{
								root: isSelected ? {
									backgroundColor: '#4a90e2',
									color: '#ffffff',
									borderColor: '#4a90e2',
									fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
									fontWeight: 500,
									fontSize: '12px',
									'&:hover': {
										backgroundColor: '#357abd',
									},
								} : {
									borderColor: '#4a90e2', // Match SelectionPanel blue
									color: '#4a90e2',
									backgroundColor: 'transparent',
									fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
									fontWeight: 500,
									fontSize: '12px',
									'&:hover': {
										backgroundColor: 'rgba(74, 144, 226, 0.1)',
										borderColor: '#357abd',
										color: '#357abd'
									},
								},
							}}
						>
							{statusLabel}
						</Button>
					);
				})}
			</Group>
		</MantineSetting>
	);
}

export default React.memo(MantineSettingSelect);

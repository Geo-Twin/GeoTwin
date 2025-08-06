import React, {useContext} from "react";
import {AtomsContext} from "~/app/ui/UI";
import {useRecoilValue} from "recoil";
import { Stack } from '@mantine/core';
import MantineSettingAuto from "~/app/ui/components/SettingsModalPanel/MantineSettingAuto";

export interface SettingsGroupStructure {
	parent: string;
	children: string[];
}

const MantineSettingGroup: React.FC<{
	group: SettingsGroupStructure;
}> = ({group}) => {
	const atoms = useContext(AtomsContext);
	const parentSettings = useRecoilValue(atoms.settingsObject(group.parent));

	return (
		<Stack spacing="xs">
			<MantineSettingAuto key={group.parent} id={group.parent}/>
			{
				group.children.map(child => <MantineSettingAuto key={child} id={child} parent={parentSettings}/>)
			}
		</Stack>
	);
}

export default React.memo(MantineSettingGroup);

import React, {useContext} from "react";
import {SettingsObjectEntry} from "~/app/settings/SettingsObject";
import {AtomsContext} from "~/app/ui/UI";
import {useRecoilValue} from "recoil";
import MantineSettingRange from "~/app/ui/components/SettingsModalPanel/MantineSettingRange";
import MantineSettingSelect from "~/app/ui/components/SettingsModalPanel/MantineSettingSelect";

const MantineSettingAuto: React.FC<{
	id: string;
	parent?: SettingsObjectEntry;
}> = ({id, parent}) => {
	const atoms = useContext(AtomsContext);
	const schema = useRecoilValue(atoms.settingsSchema)[id];

	if (schema.parent && schema.parentStatusCondition && parent) {
		if (!schema.parentStatusCondition.includes(parent.statusValue)) {
			return null;
		}
	}

	if (schema.status) {
		return <MantineSettingSelect id={id}/>;
	}

	if (schema.selectRange) {
		return <MantineSettingRange id={id}/>;
	}

	return null;
}

export default React.memo(MantineSettingAuto);

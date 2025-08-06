import React, { useContext, useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import { ActionsContext, AtomsContext } from '~/app/ui/UI';
import { Stack, Button, Group } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import MantineSettingGroup, { SettingsGroupStructure } from '~/app/ui/components/SettingsModalPanel/MantineSettingGroup';

const SidebarSettingsPanel: React.FC = () => {
	const atoms = useContext(AtomsContext);
	const actions = useContext(ActionsContext);
	const schema = useRecoilValue(atoms.settingsSchema);

	const categorizedGroups = useMemo(() => {
		const groups: SettingsGroupStructure[] = [];
		const groupsMap = new Map<string, string[]>();

		for (const [id, entry] of Object.entries(schema)) {
			if (!entry.parent) {
				if (!groupsMap.has(id)) {
					groupsMap.set(id, []);
				}
			} else {
				if (!groupsMap.has(entry.parent)) {
					groupsMap.set(entry.parent, []);
				}

				groupsMap.get(entry.parent).push(id);
			}
		}

		for (const [parent, children] of groupsMap.entries()) {
			groups.push({
				parent,
				children
			});
		}

		const categorized = {
			general: groups.filter(group => schema[group.parent].category === 'general'),
			graphics: groups.filter(group => schema[group.parent].category === 'graphics')
		};

		return categorized;
	}, [schema]);

	return (
		<Stack style={{ gap: '16px' }}>
			{categorizedGroups.general.map(group => (
				<MantineSettingGroup key={group.parent} group={group} />
			))}
			{categorizedGroups.graphics.map(group => (
				<MantineSettingGroup key={group.parent} group={group} />
			))}

			<Group style={{ justifyContent: 'center', marginTop: '16px' }}>
				<Button
					variant="outline"
					size="xs"
					leftSection={<IconRefresh size={14} />}
					onClick={(): void => {
						actions.resetSettings();
					}}
					styles={{
						root: {
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
							}
						},
					}}
				>
					Reset to defaults
				</Button>
			</Group>
		</Stack>
	);
};

export default SidebarSettingsPanel;

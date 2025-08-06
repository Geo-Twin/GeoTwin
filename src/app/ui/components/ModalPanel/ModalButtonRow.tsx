import React from "react";
import { Group } from '@mantine/core';
import ModalButton from "~/app/ui/components/ModalButton";
import {GrPowerReset} from "react-icons/gr";

const ModalButtonRow: React.FC<{
	labels: string[];
	onClicks: (() => void)[];
	icons: React.ReactNode[];
	loadingFlags?: boolean[];
}> = ({labels, onClicks, icons, loadingFlags}) => {
	return (
		<Group position="right" spacing="xs">
			{
				labels.map((label, i) => {
					return (
						<ModalButton
							key={label}
							text={label}
							onClick={onClicks[i]}
							icon={icons[i]}
							isLoading={loadingFlags ? loadingFlags[i] : false}
						/>
					)
				})
			}
		</Group>
	);
};

export default React.memo(ModalButtonRow);
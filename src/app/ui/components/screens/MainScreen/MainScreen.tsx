import React, {useCallback, useContext, useEffect, useState} from "react";
import LegalAttributionPanel from "~/app/ui/components/LegalAttributionPanel";
import {useRecoilValue} from "recoil";
import DebugInfo from "~/app/ui/components/DebugInfo";
import CompassPanel from "~/app/ui/components/CompassPanel";
import SelectionPanel from "~/app/ui/components/SelectionPanel";
import {ActionsContext, AtomsContext} from "~/app/ui/UI";

import SearchPanel from "~/app/ui/components/SearchPanel";
import TimePanel from "~/app/ui/components/TimePanel";
import NavPanel from "~/app/ui/components/NavPanel";
import InfoModalPanel from "~/app/ui/components/InfoModalPanel";
import SettingsModalPanel from "~/app/ui/components/SettingsModalPanel";
import GeolocationButton from "~/app/ui/components/GeolocationButton";
import styles from './MainScreen.scss';
import SavedPlacesModalPanel from "~/app/ui/components/SavedPlacesModalPanel";
import DataTimestamp from "~/app/ui/components/DataTimestamp";
import MainSidebar from "~/app/ui/components/MainSidebar";

const MainScreen: React.FC = () => {
	const atoms = useContext(AtomsContext);
	const actions = useContext(ActionsContext);

	const loadingProgress = useRecoilValue(atoms.resourcesLoadingProgress);
	const [isUIVisible, setIsUIVisible] = useState<boolean>(true);
	const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(false);

	const showRenderGraph = useCallback((): void => {}, []);

	useEffect(() => {
		const handler = (e: KeyboardEvent): void => {
			if (e.code === 'KeyU' && (e.ctrlKey || e.metaKey)) {
				e.preventDefault();
				setIsUIVisible(!isUIVisible);
			}


		}

		window.addEventListener('keydown', handler);
		return () => {
			window.removeEventListener('keydown', handler)
		};
	}, [isUIVisible]);

	let containerClassNames = styles.mainScreen;

	if (!isUIVisible || loadingProgress < 1.) {
		containerClassNames += ' ' + styles['mainScreen--hidden'];
	}

	return (
		<div className={containerClassNames}>
			{/* Centered Search Bar - Keep as is */}
			<SearchPanel/>

			{/* Unified Sidebar - Replaces all scattered UI elements */}
			<MainSidebar
				isVisible={isSidebarVisible}
				onToggle={(): void => setIsSidebarVisible(!isSidebarVisible)}
			/>

			{/* Modal windows are now handled within the sidebar */}

			{/* Keep debug and development tools */}
			<DebugInfo showRenderGraph={showRenderGraph}/>

			{/* Keep essential overlays */}
			<SelectionPanel/>
			<LegalAttributionPanel/>
		</div>
	);
}

export default MainScreen;

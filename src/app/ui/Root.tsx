import React, {useEffect} from "react";
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import LoadingScreen from "~/app/ui/components/screens/LoadingScreen";
import MainScreen from "~/app/ui/components/screens/MainScreen";
import { geoTwinTheme } from '~/app/ui/theme/geoTwinTheme';
import './styles/root.scss';

const Root: React.FC = () => {
	useEffect(() => {
		const match = window.matchMedia("(prefers-color-scheme: dark)");

		const setColorTheme = (theme: 'light' | 'dark'): void => {
			if (theme === 'dark') {
				document.body.className = 'darkTheme';
			} else {
				document.body.className = 'lightTheme';
			}
		}

		const themeListener = (): void => {
			setColorTheme(match.matches ? 'dark' : 'light');
		};
		themeListener();

		match.addEventListener('change', themeListener);

		return () => {
			match.removeEventListener('change', themeListener);
		}
	}, []);

	return (
		<MantineProvider theme={geoTwinTheme} withGlobalStyles withNormalizeCSS>
			<Notifications position="top-right" />
			<MainScreen/>
			<LoadingScreen/>
		</MantineProvider>
	);
}

export default Root;
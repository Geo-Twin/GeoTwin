import React, { useState, useEffect } from 'react';

const TimeGreeting: React.FC = () => {
	const [greeting, setGreeting] = useState<string>('');

	useEffect(() => {
		const updateGreeting = (): void => {
			const now = new Date();
			const hour = now.getHours();

			if (hour >= 5 && hour < 12) {
				setGreeting('Good Morning');
			} else if (hour >= 12 && hour < 17) {
				setGreeting('Good Afternoon');
			} else if (hour >= 17 && hour < 21) {
				setGreeting('Good Evening');
			} else {
				setGreeting('Good Night');
			}
		};

		updateGreeting();
		const interval = setInterval(updateGreeting, 60000); // Update every minute

		return () => clearInterval(interval);
	}, []);

	return (
		<span className="text-sm text-gray-300 font-normal">
			{greeting} - Dominica Digital Twin
		</span>
	);
};

export default TimeGreeting;

import React, { useState } from "react";
import { IconSearch, IconX } from '@tabler/icons-react';
import styles from './SearchBar.scss';

const SearchBar: React.FC<{
	search: (query: string) => void;
	reset: () => void;
}> = ({ search, reset }) => {
	const [value, setValue] = useState('');

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
		const newValue = event.currentTarget.value;
		setValue(newValue);
		search(newValue);
	};

	const handleClear = (): void => {
		setValue('');
		reset();
	};

	return (
		<div className={styles.searchContainer}>
			{/* Search Icon - Updated to match SelectionPanel icon sizing */}
			<IconSearch
				size={16}
				className={styles.searchIcon}
			/>

			{/* Native HTML Input */}
			<input
				type="text"
				value={value}
				onChange={handleChange}
				placeholder="Search places in Dominica"
				className={styles.searchInput}
			/>

			{/* Clear Button - Updated to match SelectionPanel close button styling */}
			{value.length > 0 && (
				<button
					onClick={handleClear}
					className={styles.clearButton}
				>
					<IconX size={16} />
				</button>
			)}
		</div>
	);
}

export default SearchBar;
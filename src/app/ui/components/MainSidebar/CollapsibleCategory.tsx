import React, { useState } from 'react';
import styles from './CollapsibleCategory.scss';
import { IoChevronDownOutline } from 'react-icons/io5';

interface CollapsibleCategoryProps {
	label: string;
	children: React.ReactNode;
	defaultExpanded?: boolean;
}

const CollapsibleCategory: React.FC<CollapsibleCategoryProps> = ({ 
	label, 
	children, 
	defaultExpanded = false 
}) => {
	const [isExpanded, setIsExpanded] = useState(defaultExpanded);

	const toggleExpanded = (): void => {
		setIsExpanded(!isExpanded);
	};

	return (
		<div className={styles.collapsibleCategory}>
			<button 
				className={`${styles.categoryHeader} ${isExpanded ? styles['categoryHeader--expanded'] : ''}`}
				onClick={toggleExpanded}
			>
				<span className={styles.categoryLabel}>{label}</span>
				<IoChevronDownOutline 
					size={16} 
					className={`${styles.categoryArrow} ${isExpanded ? styles['categoryArrow--expanded'] : ''}`}
				/>
			</button>
			{isExpanded && (
				<div className={styles.categoryContent}>
					{children}
				</div>
			)}
		</div>
	);
};

export default CollapsibleCategory;

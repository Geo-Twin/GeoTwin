import React from 'react';
import { cn } from '~/app/ui/utils/cn';

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	showValue?: boolean;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
	({ className, label, showValue, ...props }, ref) => {
		return (
			<div className="space-y-2">
				{label && (
					<div className="flex justify-between items-center">
						<label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
							{label}
						</label>
						{showValue && (
							<span className="text-sm text-muted-foreground">
								{props.value}
							</span>
						)}
					</div>
				)}
				<input
					type="range"
					className={cn(
						'w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer slider',
						'[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer',
						'[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none',
						className
					)}
					ref={ref}
					{...props}
				/>
			</div>
		);
	}
);

Slider.displayName = 'Slider';

export { Slider };

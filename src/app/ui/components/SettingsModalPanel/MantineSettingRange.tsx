import React, {useContext} from "react";
import {AtomsContext} from "~/app/ui/UI";
import {useRecoilState, useRecoilValue} from "recoil";
import {SettingsSchemaRangeScale} from "~/app/settings/SettingsSchema";
import { Box, Text, Group } from '@mantine/core';
import MantineSetting from "./MantineSetting";

// CSS for custom slider
const sliderCSS = `
.custom-slider {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.15);
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  margin: 8px 0;
}

.custom-slider::-webkit-slider-thumb {
  appearance: none;
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #4a90e2;
  border: 2px solid #4a90e2;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  transition: all 0.2s ease;
}

.custom-slider::-webkit-slider-thumb:hover {
  background: #357abd;
  border-color: #357abd;
  transform: scale(1.1);
}

.custom-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #4a90e2;
  border: 2px solid #4a90e2;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.custom-slider::-moz-range-track {
  height: 4px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
}
`;

// Inject CSS
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = sliderCSS;
  if (!document.head.querySelector('style[data-custom-slider]')) {
    styleElement.setAttribute('data-custom-slider', 'true');
    document.head.appendChild(styleElement);
  }
}

const logToLinear = (min: number, max: number, value: number): number => {
	const norm = (value - min) / (max - min);
	return min + Math.pow(norm, 1 / 5) * (max - min);
};

const linearToLog = (min: number, max: number, value: number): number => {
	const norm = (value - min) / (max - min);
	return min + Math.pow(norm, 5) * (max - min);
};

const toFixedWithoutZeros = (num: number, precision: number): string => {
	return num.toFixed(precision).replace(/(\.0+|0+)$/, '');
};

const MantineSettingRange: React.FC<{
	id: string;
}> = ({id}) => {
	const atoms = useContext(AtomsContext);
	const [settingValue, setSettingValue] = useRecoilState(atoms.settingsObject(id));
	const schema = useRecoilValue(atoms.settingsSchema)[id];

	return (
		<MantineSetting name={schema.label} isSub={!!schema.parent}>
			<Box>
				<Group style={{ justifyContent: 'space-between', marginBottom: '8px' }}>
					<Text style={{
						fontSize: '12px',
						color: '#a0a0a0',
						fontFamily: "'Inter', 'Roboto', system-ui, sans-serif"
					}}>
						{schema.label}
					</Text>
					<Text style={{
						fontSize: '12px',
						color: 'white',
						fontWeight: 500,
						fontFamily: "'Inter', 'Roboto', system-ui, sans-serif"
					}}>
						{toFixedWithoutZeros(settingValue.numberValue, 4)}
					</Text>
				</Group>
				<input
					type="range"
					className="custom-slider"
					min={schema.selectRange[0]}
					max={schema.selectRange[1]}
					step={schema.selectRange[2]}
					value={schema.selectRangeScale === SettingsSchemaRangeScale.Logarithmic ?
						logToLinear(schema.selectRange[0], schema.selectRange[1], settingValue.numberValue) :
						settingValue.numberValue
					}
					onChange={(e): void => {
						const value = parseFloat(e.target.value);
						const numberValue = schema.selectRangeScale === SettingsSchemaRangeScale.Logarithmic ?
							linearToLog(schema.selectRange[0], schema.selectRange[1], value) :
							value;

						setSettingValue({
							...settingValue,
							numberValue
						});
					}}
				/>
			</Box>
		</MantineSetting>
	);
}

export default React.memo(MantineSettingRange);

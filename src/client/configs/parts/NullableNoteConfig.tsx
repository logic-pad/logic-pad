import { memo } from 'react';
import { ConfigType, NullableNoteConfig } from '@logic-pad/core/data/config';
import Configurable from '@logic-pad/core/data/configurable';
import Autocomplete from '../../components/Autocomplete';
import { FaTrashCan } from 'react-icons/fa6';
import ConfigItem from './ConfigItem';
import { Instrument } from '@logic-pad/core/data/primitives';

export interface NullableNoteConfigProps {
  configurable: Configurable;
  config: NullableNoteConfig;
  setConfig?: (field: string, value: NullableNoteConfig['default']) => void;
}

const letters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const accidentals = ['bb', 'b', '', '#', 'x'];
const octaves = [-4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const drumSamples: string[] = [
  'hihat',
  'hihat-open',
  'kick',
  'snare',
  'crash',
  'tom',
];
const pitches: string[] = [];
letters.forEach(letter => {
  accidentals.forEach(accidental => {
    octaves.forEach(octave => {
      pitches.push(`${letter}${accidental}${octave}`);
    });
  });
});
export const noteNames = [...pitches, ...drumSamples];

// million-ignore
export default memo(function NullableNoteConfig({
  configurable,
  config,
  setConfig,
}: NullableNoteConfigProps) {
  const value = configurable[
    config.field as keyof typeof configurable
  ] as unknown as string | null;

  // dirty check for more accurate autocomplete options
  const instrument =
    'instrument' in configurable &&
    !!configurable.instrument &&
    typeof configurable.instrument === 'string'
      ? (configurable.instrument as Instrument)
      : null;

  return (
    <ConfigItem config={config}>
      {value === null ? (
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => {
            setConfig?.(config.field, config.default ?? 'C4');
          }}
        >
          Unset
        </button>
      ) : (
        <div className="flex gap-2 items-center">
          <div
            className="tooltip tooltip-info tooltip-top"
            data-tip="Clear value"
          >
            <button
              type="button"
              aria-label="Clear value"
              className="btn btn-sm"
              onClick={() => {
                setConfig?.(config.field, null);
              }}
            >
              <FaTrashCan />
            </button>
          </div>
          <Autocomplete
            className="grow"
            items={
              instrument === Instrument.Drum
                ? drumSamples
                : instrument
                  ? pitches
                  : noteNames
            }
            all={true}
            value={value}
            onChange={e => {
              setConfig?.(config.field, e);
            }}
          />
        </div>
      )}
    </ConfigItem>
  );
});

export const type = ConfigType.NullableNote;

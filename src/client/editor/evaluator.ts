import * as enclosure from '@logic-pad/core';

export const examples = [
  'GridData.create(["nnnnn", "nnnnn"])',
  `.withConnections(\n  GridConnections.create(['..aa.', '..aa.'])\n)`,
  '.addRule(new BanPatternRule(GridData.create([])))',
  '.addRule(new CompletePatternRule())',
  '.addRule(new ConnectAllRule(Color.Dark))',
  '.addRule(new RegionAreaRule(Color.Dark, 2))',
  '.addRule(new OffByXRule(1))',
  '.addRule(new CellCountRule(Color.Dark, 10))',
  `.addRule(new CustomRule(\n  'Description',\n  GridData.create([])\n))`,
  '.addRule(new UndercluedRule())',
  '.addRule(new SymbolsPerRegionRule(Color.Light, 1))',
  '.addSymbol(new LetterSymbol(1, 1, "A"))',
  '.addSymbol(new AreaNumberSymbol(1, 1, 3))',
  '.addSymbol(new ViewpointSymbol(1, 1, 3))',
  '.addSymbol(new DartSymbol(1, 1, 2, Direction.Up))',
  '.addSymbol(new LotusSymbol(1, 1, Orientation.Up))',
  '.addSymbol(new GalaxySymbol(1, 1))',
  `.addSymbol(new CustomTextSymbol(\n  'Description',\n  GridData.create([]),\n  1, 1,\n  'X', 0\n))`,
  `.addSymbol(new CustomIconSymbol(\n  'Description',\n  GridData.create([]),\n  1, 1,\n  'MdQuestionMark', 0\n))`,
  'move({ x: 1, y: 1 }, Direction.Up, 2)',
  'array(3, 3, (x, y) => x + y)',
  'minBy([1, 2, 3], (x) => x % 2)',
  'maxBy([1, 2, 3], (x) => x % 2)',
  'escape("Hello, world!", ",!")',
  'unescape("Hello&#44; world&#33;", ",!")',
  'configEquals(ConfigType.Number, 1, 2)',
  'Color.Dark\nColor.Light\nColor.Gray',
  'Direction.Up\nDirection.Down\nDirection.Left\nDirection.Right',
  'Orientation.Up\nOrientation.UpRight\nOrientation.Right\nOrientation.DownRight\nOrientation.Down\nOrientation.DownLeft\nOrientation.Left\nOrientation.UpLeft',
];

const blacklist = ['Symbol', 'Object'];

Object.entries(enclosure).forEach(([name, value]) => {
  if (blacklist.includes(name)) name = `_${name}`;
  (globalThis as Record<string, unknown>)[name] = value;
});

export default function evaluate(code: string): unknown {
  return window.eval?.(code);
}

/* prettier-ignore-start */

/* eslint-disable */

// noinspection JSUnusedGlobalSymbols

import { ConfigType, configEquals } from './data/config.js';
import Configurable from './data/configurable.js';
import { CachedAccess, allEqual, array, directionToRotation, escape, isSameEdge, maxBy, minBy, move, orientationToRotation, resize, unescape } from './data/dataHelper.js';
import { isEventHandler } from './data/events/eventHelper.js';
import { handlesFinalValidation } from './data/events/onFinalValidation.js';
import { handlesGetTile } from './data/events/onGetTile.js';
import { handlesGridChange } from './data/events/onGridChange.js';
import { handlesGridResize } from './data/events/onGridResize.js';
import { handlesSetGrid, invokeSetGrid } from './data/events/onSetGrid.js';
import { handlesSymbolDisplay } from './data/events/onSymbolDisplay.js';
import { handlesSymbolMerge } from './data/events/onSymbolMerge.js';
import { handlesSymbolValidation } from './data/events/onSymbolValidation.js';
import GridData, { NEIGHBOR_OFFSETS, NEIGHBOR_OFFSETS_8 } from './data/grid.js';
import GridConnections from './data/gridConnections.js';
import GridZones from './data/gridZones.js';
import Instruction from './data/instruction.js';
import { COMPARISONS, Color, Comparison, DIRECTIONS, DRUM_SAMPLES, Direction, INSTRUMENTS, Instrument, MajorRule, Mode, ORIENTATIONS, Orientation, PuzzleType, State, WRAPPINGS, Wrapping, directionToggle, isDrumSample, orientationToggle } from './data/primitives.js';
import { MetadataSchema, PuzzleSchema, getPuzzleTypes, puzzleEquals, validatePuzzleChecklist } from './data/puzzle.js';
import BanPatternRule from './data/rules/banPatternRule.js';
import CellCountPerZoneRule from './data/rules/cellCountPerZoneRule.js';
import CellCountRule from './data/rules/cellCountRule.js';
import CompletePatternRule from './data/rules/completePatternRule.js';
import ConnectAllRule from './data/rules/connectAllRule.js';
import ConnectZonesRule from './data/rules/connectZonesRule.js';
import ContainsShapeRule from './data/rules/containsShapeRule.js';
import CustomRule from './data/rules/customRule.js';
import DifferentCountPerZoneRule from './data/rules/differentCountPerZoneRule.js';
import ExactCountPerZoneRule from './data/rules/exactCountPerZoneRule.js';
import ForesightRule from './data/rules/foresightRule.js';
import { allRules } from './data/rules/index.js';
import LyingSymbolRule from './data/rules/lyingSymbolRule.js';
import { ControlLine, Row } from './data/rules/musicControlLine.js';
import MusicGridRule from './data/rules/musicGridRule.js';
import MysteryRule from './data/rules/mysteryRule.js';
import NoLoopsRule from './data/rules/noLoopsRule.js';
import OffByXRule from './data/rules/offByXRule.js';
import PerfectionRule from './data/rules/perfectionRule.js';
import RegionAreaRule from './data/rules/regionAreaRule.js';
import RegionShapeRule from './data/rules/regionShapeRule.js';
import Rule from './data/rules/rule.js';
import SameCountPerZoneRule from './data/rules/sameCountPerZoneRule.js';
import SameShapeRule from './data/rules/sameShapeRule.js';
import SymbolsPerRegionRule from './data/rules/symbolsPerRegionRule.js';
import UndercluedRule from './data/rules/undercluedRule.js';
import UniqueShapeRule from './data/rules/uniqueShapeRule.js';
import WrapAroundRule from './data/rules/wrapAroundRule.js';
import { Serializer } from './data/serializer/allSerializers.js';
import { Compressor } from './data/serializer/compressor/allCompressors.js';
import ChecksumCompressor from './data/serializer/compressor/checksumCompressor.js';
import CompressorBase from './data/serializer/compressor/compressorBase.js';
import DeflateCompressor from './data/serializer/compressor/deflateCompressor.js';
import GzipCompressor from './data/serializer/compressor/gzipCompressor.js';
import StreamCompressor from './data/serializer/compressor/streamCompressor.js';
import SerializerBase from './data/serializer/serializerBase.js';
import SerializerChecksum from './data/serializer/serializer_checksum.js';
import SerializerV0, { OFFSETS, orientationChars } from './data/serializer/serializer_v0.js';
import { getShapeVariants, normalizeShape, positionsToShape, sanitizePatternGrid, shapeEquals, tilesToShape } from './data/shapes.js';
import { allSolvers } from './data/solver/allSolvers.js';
import AutoSolver from './data/solver/auto/autoSolver.js';
import BacktrackSolver from './data/solver/backtrack/backtrackSolver.js';
import BTModule, { BTGridData, BTTile, IntArray2D, checkSubtilePlacement, colorToBTTile, createOneTileResult, getOppositeColor } from './data/solver/backtrack/data.js';
import BanPatternBTModule from './data/solver/backtrack/rules/banPattern.js';
import CellCountBTModule from './data/solver/backtrack/rules/cellCount.js';
import ConnectAllBTModule from './data/solver/backtrack/rules/connectAll.js';
import RegionAreaBTModule from './data/solver/backtrack/rules/regionArea.js';
import RegionShapeBTModule from './data/solver/backtrack/rules/regionShape.js';
import SameShapeBTModule from './data/solver/backtrack/rules/sameShape.js';
import SymbolsPerRegionBTModule from './data/solver/backtrack/rules/symbolsPerRegion.js';
import UniqueShapeBTModule from './data/solver/backtrack/rules/uniqueShape.js';
import AreaNumberBTModule from './data/solver/backtrack/symbols/areaNumber.js';
import DartBTModule from './data/solver/backtrack/symbols/dart.js';
import DirectionLinkerBTModule from './data/solver/backtrack/symbols/directionLinker.js';
import FocusBTModule from './data/solver/backtrack/symbols/focus.js';
import GalaxyBTModule from './data/solver/backtrack/symbols/galaxy.js';
import LetterBTModule from './data/solver/backtrack/symbols/letter.js';
import LotusBTModule from './data/solver/backtrack/symbols/lotus.js';
import MinesweeperBTModule from './data/solver/backtrack/symbols/minesweeper.js';
import MyopiaBTModule from './data/solver/backtrack/symbols/myopia.js';
import ViewpointBTModule from './data/solver/backtrack/symbols/viewpoint.js';
import CspuzSolver from './data/solver/cspuz/cspuzSolver.js';
import { gridToJson } from './data/solver/cspuz/jsonify.js';
import EventIteratingSolver from './data/solver/eventIteratingSolver.js';
import Solver from './data/solver/solver.js';
import UniversalDevSolver from './data/solver/universal/dev/universalDevSolver.js';
import UniversalSolver from './data/solver/universal/universalSolver.js';
import AreaNumberSymbol from './data/symbols/areaNumberSymbol.js';
import CustomIconSymbol from './data/symbols/customIconSymbol.js';
import CustomSymbol from './data/symbols/customSymbol.js';
import CustomTextSymbol from './data/symbols/customTextSymbol.js';
import DartSymbol from './data/symbols/dartSymbol.js';
import DirectionLinkerSymbol from './data/symbols/directionLinkerSymbol.js';
import EveryLetterSymbol from './data/symbols/everyLetterSymbol.js';
import FocusSymbol from './data/symbols/focusSymbol.js';
import GalaxySymbol from './data/symbols/galaxySymbol.js';
import HiddenSymbol from './data/symbols/hiddenSymbol.js';
import HouseSymbol from './data/symbols/houseSymbol.js';
import { allSymbols } from './data/symbols/index.js';
import LetterSymbol from './data/symbols/letterSymbol.js';
import LotusSymbol from './data/symbols/lotusSymbol.js';
import MinesweeperSymbol from './data/symbols/minesweeperSymbol.js';
import MyopiaSymbol from './data/symbols/myopiaSymbol.js';
import NumberSymbol from './data/symbols/numberSymbol.js';
import Symbol from './data/symbols/symbol.js';
import UnsupportedSymbol from './data/symbols/unsupportedSymbol.js';
import ViewpointSymbol from './data/symbols/viewpointSymbol.js';
import TileData from './data/tile.js';
import TileConnections from './data/tileConnections.js';
import validateGrid, { aggregateState, applyFinalOverrides } from './data/validate.js';
import { GridValidator } from './data/validateAsync.js';

export {
  ConfigType,
  configEquals,
  Configurable,
  CachedAccess,
  allEqual,
  array,
  directionToRotation,
  escape,
  isSameEdge,
  maxBy,
  minBy,
  move,
  orientationToRotation,
  resize,
  unescape,
  isEventHandler,
  handlesFinalValidation,
  handlesGetTile,
  handlesGridChange,
  handlesGridResize,
  handlesSetGrid,
  invokeSetGrid,
  handlesSymbolDisplay,
  handlesSymbolMerge,
  handlesSymbolValidation,
  GridData,
  NEIGHBOR_OFFSETS,
  NEIGHBOR_OFFSETS_8,
  GridConnections,
  GridZones,
  Instruction,
  COMPARISONS,
  Color,
  Comparison,
  DIRECTIONS,
  DRUM_SAMPLES,
  Direction,
  INSTRUMENTS,
  Instrument,
  MajorRule,
  Mode,
  ORIENTATIONS,
  Orientation,
  PuzzleType,
  State,
  WRAPPINGS,
  Wrapping,
  directionToggle,
  isDrumSample,
  orientationToggle,
  MetadataSchema,
  PuzzleSchema,
  getPuzzleTypes,
  puzzleEquals,
  validatePuzzleChecklist,
  BanPatternRule,
  CellCountPerZoneRule,
  CellCountRule,
  CompletePatternRule,
  ConnectAllRule,
  ConnectZonesRule,
  ContainsShapeRule,
  CustomRule,
  DifferentCountPerZoneRule,
  ExactCountPerZoneRule,
  ForesightRule,
  allRules,
  LyingSymbolRule,
  ControlLine,
  Row,
  MusicGridRule,
  MysteryRule,
  NoLoopsRule,
  OffByXRule,
  PerfectionRule,
  RegionAreaRule,
  RegionShapeRule,
  Rule,
  SameCountPerZoneRule,
  SameShapeRule,
  SymbolsPerRegionRule,
  UndercluedRule,
  UniqueShapeRule,
  WrapAroundRule,
  Serializer,
  Compressor,
  ChecksumCompressor,
  CompressorBase,
  DeflateCompressor,
  GzipCompressor,
  StreamCompressor,
  SerializerBase,
  SerializerChecksum,
  SerializerV0,
  OFFSETS,
  orientationChars,
  getShapeVariants,
  normalizeShape,
  positionsToShape,
  sanitizePatternGrid,
  shapeEquals,
  tilesToShape,
  allSolvers,
  AutoSolver,
  BacktrackSolver,
  BTModule,
  BTGridData,
  BTTile,
  IntArray2D,
  checkSubtilePlacement,
  colorToBTTile,
  createOneTileResult,
  getOppositeColor,
  BanPatternBTModule,
  CellCountBTModule,
  ConnectAllBTModule,
  RegionAreaBTModule,
  RegionShapeBTModule,
  SameShapeBTModule,
  SymbolsPerRegionBTModule,
  UniqueShapeBTModule,
  AreaNumberBTModule,
  DartBTModule,
  DirectionLinkerBTModule,
  FocusBTModule,
  GalaxyBTModule,
  LetterBTModule,
  LotusBTModule,
  MinesweeperBTModule,
  MyopiaBTModule,
  ViewpointBTModule,
  CspuzSolver,
  gridToJson,
  EventIteratingSolver,
  Solver,
  UniversalDevSolver,
  UniversalSolver,
  AreaNumberSymbol,
  CustomIconSymbol,
  CustomSymbol,
  CustomTextSymbol,
  DartSymbol,
  DirectionLinkerSymbol,
  EveryLetterSymbol,
  FocusSymbol,
  GalaxySymbol,
  HiddenSymbol,
  HouseSymbol,
  allSymbols,
  LetterSymbol,
  LotusSymbol,
  MinesweeperSymbol,
  MyopiaSymbol,
  NumberSymbol,
  Symbol,
  UnsupportedSymbol,
  ViewpointSymbol,
  TileData,
  TileConnections,
  validateGrid,
  aggregateState,
  applyFinalOverrides,
  GridValidator,
};

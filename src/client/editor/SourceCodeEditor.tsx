import React, { memo, useEffect, useRef } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { Puzzle, PuzzleSchema } from '@logic-pad/core/data/puzzle';
import { Compressor } from '@logic-pad/core/data/serializer/compressor/allCompressors';
import { Serializer } from '@logic-pad/core/data/serializer/allSerializers';
import { ZodError } from 'zod';
import evaluate, { examples } from './evaluator';
import { SUPPORTED_THEMES, useTheme } from '../state/theme.ts';
import { setToolAtom } from '../state/toolbox.ts';
import handleTileClick from '../grid/handleTileClick';
import { useSetAtom } from 'jotai';
import { metadataAtom, setGridAtom } from '../state/grid.ts';
import { array } from '@logic-pad/core/data/dataHelper';
import toast from 'react-hot-toast';
import { r } from 'readable-regexp';
import { tip } from '../components/Tooltip.tsx';

const defaultCode = `/** @type Puzzle */
({
  title: '',
  grid: GridData.create([]),
  solution: null,
  difficulty: 1,
  author: '',
  description: ''
})
`;

const options: editor.IStandaloneEditorConstructionOptions = {
  minimap: { enabled: false },
  lineNumbers: 'on',
  glyphMargin: false,
  folding: true,
  lineDecorationsWidth: 5,
  lineNumbersMinChars: 3,
  wrappingIndent: 'indent',
  wrappingStrategy: 'advanced',
  wordWrap: 'on',
  formatOnType: true,
  // The container can be resized after mount (tab switches, responsive
  // breakpoints), so let Monaco observe and follow its container's size.
  automaticLayout: true,
};

export interface SourceCodeEditorProps {
  loading?: React.ReactNode;
}

const stackTraceRegex = r
  .match(
    r.exactly`<anonymous>:`,
    r.capture.oneOrMore.digit,
    r.exactly`:`,
    r.capture.oneOrMore.digit
  )
  .toRegExp();

export default memo(function SourceCodeEditor({
  loading,
}: SourceCodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    const saved = window.localStorage.getItem('viewState');
    if (saved)
      editor.restoreViewState(JSON.parse(saved) as editor.ICodeEditorViewState);
  };
  const monaco = useMonaco();
  const { theme } = useTheme();
  const setTool = useSetAtom(setToolAtom);
  const setGrid = useSetAtom(setGridAtom);
  const setMetadata = useSetAtom(metadataAtom);

  // Set the toolbox tool so that the grid is editable
  useEffect(() => {
    setTool(
      'code',
      'Code',
      'Edit the puzzle code',
      null,
      (x, y, target, flood, gridContext) => {
        handleTileClick(x, y, target, flood, gridContext, false);
      }
    );
    return () => setTool(null, null, null, null, null);
  }, [setTool]);

  useEffect(() => {
    if (!monaco) return;
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    // compiler options
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      allowJs: true,
      checkJs: true,
      strict: true,
    });

    import('@logic-pad/core/assets/logic-core.global.d.ts?raw')
      .then(({ default: def }) => {
        monaco.languages.typescript.javascriptDefaults.addExtraLib(
          def,
          'file:///logic-pad.d.ts'
        );
      })
      .catch(console.log);
  }, [monaco]);

  const parseJs = async () => {
    if (editorRef.current) {
      const value = editorRef.current.getValue();
      window.localStorage.setItem('sourceCode', value);
      window.localStorage.setItem(
        'viewState',
        JSON.stringify(editorRef.current.saveViewState())
      );
      try {
        const puzzle: Puzzle = PuzzleSchema.parse(
          evaluate(`"use strict";${value}`)
        );
        const compressed = await Compressor.compress(
          Serializer.stringifyPuzzle(puzzle)
        );
        const decompressed = await Compressor.decompress(compressed);
        const { grid, solution, ...metadata } =
          Serializer.parsePuzzle(decompressed);
        setMetadata(metadata);
        if (solution) {
          const tiles = array(grid.width, grid.height, (x, y) => {
            const tile = grid.getTile(x, y);
            if (tile.fixed) return tile;
            return tile.withColor(solution.getTile(x, y).color);
          });
          setGrid(grid.withTiles(tiles), null);
        } else {
          setGrid(grid, solution);
        }
      } catch (error) {
        if (error instanceof ZodError) {
          toast.error(error.issues[0].message);
          console.error('Validation error thrown from code editor:', error);
        } else if (error instanceof Error) {
          toast.error(error.message);
          if (error.stack) {
            const match = stackTraceRegex.exec(error.stack);
            if (match) {
              const [_, line, column] = match;
              editorRef.current.focus();
              editorRef.current.revealLineInCenter(parseInt(line));
              editorRef.current.setPosition({
                lineNumber: parseInt(line),
                column: parseInt(column),
              });
            }
          }
          console.error('Error thrown from code editor:', error);
        }
      }
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-2 p-2">
      <div className="h-[calc(100vh-14rem)] lg:h-auto lg:flex-1 lg:min-h-0 rounded-box overflow-hidden">
        <Editor
          loading={loading}
          theme={SUPPORTED_THEMES.find(([t]) => t === theme)?.[1]}
          width="100%"
          height="100%"
          defaultLanguage="javascript"
          defaultValue={(() => {
            let saved = window.localStorage.getItem('sourceCode');
            if (!saved || saved.length === 0) saved = defaultCode;
            else if (/^return\s+/.test(saved.trim())) {
              saved =
                '/** @type Puzzle */\n(' +
                saved
                  .trim()
                  .replace(/^return\s+/, '')
                  .replace(/;\s*$/, '') +
                ')';
            }
            return saved;
          })()}
          options={options}
          onMount={handleEditorDidMount}
        />
      </div>
      <div className="lg:w-[400px] shrink-0 flex flex-col gap-4 min-h-0">
        <div className="hidden lg:block flex-1 min-h-0 overflow-y-auto bg-base-200 text-base-content rounded-box p-4 shadow-sm">
          <div className="flex flex-col flex-nowrap gap-2">
            <h3 className="text-lg text-base-content">Quick reference</h3>
            {examples.map(
              example =>
                example && (
                  <pre key={example} className="text-xs text-base-content">
                    {example}
                  </pre>
                )
            )}
          </div>
        </div>
        <div
          className="w-full shrink-0"
          {...tip(
            'Source code is NOT saved in the puzzle link! Remember to back up your code.',
            'top'
          )}
        >
          <button
            type="button"
            className="btn btn-primary w-full"
            onClick={parseJs}
          >
            Load puzzle
          </button>
        </div>
      </div>
    </div>
  );
});

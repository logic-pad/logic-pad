import { Serializer } from './serializer/allSerializers.js';
import validateGrid from './validate.js';

onmessage = e => {
  const data = e.data as {
    grid: string;
    solution: string | null;
  };
  const grid = Serializer.parseGrid(data.grid);
  const solution = data.solution ? Serializer.parseGrid(data.solution) : null;
  const state = validateGrid(grid, solution);
  postMessage(state);
};

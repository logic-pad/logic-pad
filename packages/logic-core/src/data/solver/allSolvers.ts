import Solver from './solver.js';
import UniversalSolver from './universal/universalSolver.js';
import BacktrackSolver from './backtrack/backtrackSolver.js';
import CspuzSolver from './cspuz/cspuzSolver.js';
import AutoSolver from './auto/autoSolver.js';
import UniversalDevSolver from './universal/dev/universalDevSolver.js';

const allSolvers = new Map<string, Solver>();

function register(prototype: Solver) {
  allSolvers.set(prototype.id, prototype);
}

register(new AutoSolver());
register(new CspuzSolver());
register(new BacktrackSolver());
register(new UniversalDevSolver());
register(new UniversalSolver());

export { allSolvers };

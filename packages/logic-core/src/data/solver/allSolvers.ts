import Solver from './solver.js';
import UniversalSolver from './universal/universalSolver.js';
import BacktrackSolver from './backtrack/backtrackSolver.js';
import CspuzSolver from './cspuz/cspuzSolver.js';
import AutoSolver from './auto/autoSolver.js';
import InsightDrivenSolver from './insightDriven/insightDrivenSolver.js';

const allSolvers = new Map<string, Solver>();

function register(prototype: Solver) {
  allSolvers.set(prototype.id, prototype);
}

register(new AutoSolver());
register(new CspuzSolver());
register(new BacktrackSolver());
register(new UniversalSolver());

// Solvers below the unviersal solver will not be picked by the auto solver

register(new InsightDrivenSolver());

export { allSolvers };

import { api } from '../online/api';

class OnlineSolveTracker {
  async completeSolve(
    puzzleId: string,
    msTimeElapsed?: number,
    solutionData?: string
  ): Promise<boolean> {
    const alreadySolved = JSON.parse(
      sessionStorage.getItem('alreadySolved') ?? '[]'
    ) as string[];
    if (alreadySolved.includes(puzzleId)) return false;

    alreadySolved.push(puzzleId);
    sessionStorage.setItem('alreadySolved', JSON.stringify(alreadySolved));

    if (msTimeElapsed !== undefined)
      await api.solveSessionSolving(puzzleId, msTimeElapsed, solutionData);
    await api.solveSessionComplete(puzzleId);
    return true;
  }

  async sendSolving(
    puzzleId: string,
    msTimeElapsed: number,
    solutionData?: string
  ) {
    if (!this.isSolved(puzzleId))
      await api.solveSessionSolving(puzzleId, msTimeElapsed, solutionData);
  }

  sendSolvingBeacon(puzzleId: string, msTimeElapsed: number) {
    if (!this.isSolved(puzzleId))
      api.solveSessionSolvingBeacon(puzzleId, msTimeElapsed);
  }

  isSolved(puzzleId: string) {
    const alreadySolved = JSON.parse(
      sessionStorage.getItem('alreadySolved') ?? '[]'
    ) as string[];
    return alreadySolved.includes(puzzleId);
  }

  clearSolveRecords() {
    sessionStorage.removeItem('alreadySolved');
  }
}

export default new OnlineSolveTracker();

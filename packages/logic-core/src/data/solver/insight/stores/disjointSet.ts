export default class DisjointSet<T extends number, Rep extends T> {
  private parent: T[];

  private rank: number[];

  public constructor(size: number) {
    this.parent = Array.from({ length: size }, (_, i) => i as T);
    this.rank = Array.from({ length: size }, () => 0);
  }

  public find(value: T): Rep {
    if (this.parent[value] !== value) {
      this.parent[value] = this.find(this.parent[value]);
    }
    return this.parent[value] as Rep;
  }

  public union(a: T, b: T): void {
    const rootA = this.find(a);
    const rootB = this.find(b);

    if (rootA === rootB) return;

    if (this.rank[rootA] < this.rank[rootB]) {
      this.parent[rootA] = rootB;
    } else if (this.rank[rootA] > this.rank[rootB]) {
      this.parent[rootB] = rootA;
    } else {
      this.parent[rootB] = rootA;
      this.rank[rootA] += 1;
    }
  }

  public copy(): DisjointSet<T, Rep> {
    const copy = new DisjointSet<T, Rep>(0);
    copy.parent = [...this.parent];
    copy.rank = [...this.rank];
    return copy;
  }
}

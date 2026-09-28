export interface ProofNode {
  source: string;
  description: string;
  difficulty: number;
  children: Set<ProofNode>;
}

export default class Proof {
  public readonly root: ProofNode;

  protected constructor(root: ProofNode) {
    this.root = root;
  }

  public static create(source: string): Proof {
    return new Proof({
      source,
      description: '',
      difficulty: 0,
      children: new Set<ProofNode>(),
    });
  }

  public difficulty(level: number): this {
    this.root.difficulty = level;
    return this;
  }

  public describe(description: string): this {
    this.root.description = description;
    return this;
  }

  public add(deduction: Proof): this {
    this.root.children.add(deduction.root);
    return this;
  }

  public copy(): Proof {
    return new Proof({
      source: this.root.source,
      description: this.root.description,
      difficulty: this.root.difficulty,
      children: new Set<ProofNode>(this.root.children),
    });
  }

  private nodeToString(node: ProofNode, indent: string): string {
    const childrenStr = Array.from(node.children)
      .map(child => this.nodeToString(child, indent + '  '))
      .join('\n');
    return `${indent}- ${node.source} [${node.difficulty}]:\n${indent}  ${node.description}\n${childrenStr}`;
  }

  public toString(): string {
    return this.nodeToString(this.root, '');
  }
}

export interface ProofNode {
  source: string;
  description: string;
  difficulty: number;
  children: ProofNode[];
}

export default class Proof {
  private readonly root: ProofNode;

  protected constructor(root: ProofNode) {
    this.root = root;
  }

  public static create(source: string): Proof {
    return new Proof({
      source,
      description: '',
      difficulty: 0,
      children: [],
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
    if (deduction instanceof Proof) {
      this.root.children.push(deduction.root);
    } else {
      this.root.children.push(deduction);
    }
    return this;
  }

  private nodeToString(node: ProofNode, indent: string): string {
    const childrenStr = node.children
      .map(child => this.nodeToString(child, indent + '  '))
      .join('\n');
    return `${indent}- ${node.source}:\n${indent}  ${node.description}\n${childrenStr}`;
  }

  public toString(): string {
    return this.nodeToString(this.root, '');
  }
}

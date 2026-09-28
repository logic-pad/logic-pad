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

  /**
   * Returns a copy of this proof with duplicate sub-proofs removed. Proofs form a DAG: the same
   * deduction can be referenced by several parents, which makes rendered trees repetitive.
   * Sub-proofs with identical source, difficulty and description are only kept at their first
   * occurrence in depth-first order.
   */
  public dedupe(): Proof {
    const seen = new Set<string>();
    const dedupeNode = (node: ProofNode): ProofNode | null => {
      const key = `${node.source} [${node.difficulty}]: ${node.description}`;
      if (seen.has(key)) return null;
      seen.add(key);
      const children = new Set<ProofNode>();
      for (const child of node.children) {
        const deduped = dedupeNode(child);
        if (deduped) children.add(deduped);
      }
      return {
        source: node.source,
        description: node.description,
        difficulty: node.difficulty,
        children,
      };
    };
    // The root is always visited first, so it is never a duplicate.
    return new Proof(dedupeNode(this.root)!);
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

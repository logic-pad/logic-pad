export default class InsightError extends Error {
  public constructor(
    /**
     * The ID of the source that caused the error.
     */
    public readonly source: string,
    message: string
  ) {
    super(message);
    this.name = 'InsightError';
    this.source = source;
  }
}

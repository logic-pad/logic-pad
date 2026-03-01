export default class TileConnections {
  [y: number]: {
    [x: number]: boolean;
  };

  public constructor() {
    for (let i = -1; i <= 1; i++) {
      this[i] = {};
      for (let j = -1; j <= 1; j++) {
        this[i][j] = false;
      }
    }
  }

  public get topLeft(): boolean {
    return this[-1][-1];
  }

  public set topLeft(value: boolean) {
    this[-1][-1] = value;
  }

  public get top(): boolean {
    return this[-1][0];
  }

  public set top(value: boolean) {
    this[-1][0] = value;
  }

  public get topRight(): boolean {
    return this[-1][1];
  }

  public set topRight(value: boolean) {
    this[-1][1] = value;
  }

  public get left(): boolean {
    return this[0][-1];
  }

  public set left(value: boolean) {
    this[0][-1] = value;
  }

  public get center(): boolean {
    return this[0][0];
  }

  public set center(value: boolean) {
    this[0][0] = value;
  }

  public get right(): boolean {
    return this[0][1];
  }

  public set right(value: boolean) {
    this[0][1] = value;
  }

  public get bottomLeft(): boolean {
    return this[1][-1];
  }

  public set bottomLeft(value: boolean) {
    this[1][-1] = value;
  }

  public get bottom(): boolean {
    return this[1][0];
  }

  public set bottom(value: boolean) {
    this[1][0] = value;
  }

  public get bottomRight(): boolean {
    return this[1][1];
  }

  public set bottomRight(value: boolean) {
    this[1][1] = value;
  }

  public equals(other: TileConnections): boolean {
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (this[i][j] !== other[i][j]) {
          return false;
        }
      }
    }
    return true;
  }
}

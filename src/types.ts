export interface Ships {
  carrier: {
    start: string,
    end: string,
  },
  battleship: {
    start: string,
    end: string,
  },
  destroyer: {
    start: string,
    end: string,
  },
  submarine: {
    start: string,
    end: string,
  },
  patrol: {
    start: string,
    end: string,
  }
}

export interface ShipDistances {
  carrier: number,
  battleship: number,
  destroyer: number,
  submarine: number,
  patrol: number,
}
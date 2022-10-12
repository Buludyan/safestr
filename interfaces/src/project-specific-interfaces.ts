export namespace InterfacesProjectSpecificInterfaces {
  export interface IGuard<TypeGuard> {
    _guard: TypeGuard;
  }

  export const countersTypeGuard: 'countersTypeGuard' = 'countersTypeGuard';

  export interface ICounters extends IGuard<typeof countersTypeGuard> {
    lastJSON: number;
    lastCount: number;
    lastProc: number;
  }

  export const newCounters = (): ICounters => {
    return {
      _guard: countersTypeGuard,
      lastJSON: 0,
      lastCount: 0,
      lastProc: 0,
    };
  };
}

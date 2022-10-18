export namespace InterfacesProjectSpecificInterfaces {
  export interface IGuard<TypeGuard> {
    _guard: TypeGuard;
  }

  export const counterTypeGuard: 'counterTypeGuard' = 'counterTypeGuard';

  export interface ICounter extends IGuard<typeof counterTypeGuard> {
    lastImageIndexToAdd: number;
  }

  export const newCounter = (): ICounter => {
    return {
      _guard: counterTypeGuard,
      lastImageIndexToAdd: 0,
    };
  };

  export const counterIncrementTypeGuard: 'counterIncrementTypeGuard' =
    'counterIncrementTypeGuard';

  export interface ICounterIncrement
    extends IGuard<typeof counterIncrementTypeGuard> {
    imageIndexIncrement: number;
  }

  export const newCounterIncrement = (increment: {
    imageIndexIncrement: number;
  }): ICounterIncrement => {
    return {
      _guard: counterIncrementTypeGuard,
      imageIndexIncrement: increment.imageIndexIncrement,
    };
  };

  export const imagePayloadTypeGuard: 'imagePayloadTypeGuard' =
    'imagePayloadTypeGuard';

  export interface IImagePayload extends IGuard<typeof imagePayloadTypeGuard> {
    imageContent: string;
  }

  export const newImagePayload = (imageContent: string): IImagePayload => {
    return {
      _guard: imagePayloadTypeGuard,
      imageContent: imageContent,
    };
  };
}

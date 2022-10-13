export namespace InterfacesProjectSpecificInterfaces {
  export interface IGuard<TypeGuard> {
    _guard: TypeGuard;
  }

  export const countersTypeGuard: 'countersTypeGuard' = 'countersTypeGuard';

  export interface ICounters extends IGuard<typeof countersTypeGuard> {
    lastInfoJsonIndex: number;
    lastImageIndexToAdd: number;
    lastProcessedImageIndex: number;
  }

  export const newCounters = (): ICounters => {
    return {
      _guard: countersTypeGuard,
      lastInfoJsonIndex: 0,
      lastImageIndexToAdd: 0,
      lastProcessedImageIndex: 0,
    };
  };

  export const counterIncrementsTypeGuard: 'counterIncrementsTypeGuard' =
    'counterIncrementsTypeGuard';

  export interface ICounterIncrements
    extends IGuard<typeof counterIncrementsTypeGuard> {
    infoJsonIndexIncrement: number;
    imageIndexIncrement: number;
    processedImageIndexIncrement: number;
  }

  export const newCounterIncrements = (increment: {
    infoJsonIndexIncrement: number;
    imageIndexIncrement: number;
    processedImageIndexIncrement: number;
  }): ICounterIncrements => {
    return {
      _guard: counterIncrementsTypeGuard,
      infoJsonIndexIncrement: increment.infoJsonIndexIncrement,
      imageIndexIncrement: increment.imageIndexIncrement,
      processedImageIndexIncrement: increment.processedImageIndexIncrement,
    };
  };

  export const tokenTypeGuard: 'tokenTypeGuard' = 'tokenTypeGuard';

  export interface IToken extends IGuard<typeof tokenTypeGuard> {
    token: string;
  }

  export const newToken = (token: string): IToken => {
    return {
      _guard: tokenTypeGuard,
      token: token,
    };
  };

  export const imagePayloadTypeGuard: 'imagePayloadTypeGuard' =
    'imagePayloadTypeGuard';

  export interface IImageContent {
    content: string;
    name: string;
  }

  export interface IImagePayload extends IGuard<typeof imagePayloadTypeGuard> {
    token: IToken;
    imageContent: IImageContent;
  }

  export const newImagePayload = (
    token: IToken,
    imageContent: IImageContent
  ): IImagePayload => {
    return {
      _guard: imagePayloadTypeGuard,
      token: token,
      imageContent: imageContent,
    };
  };
}

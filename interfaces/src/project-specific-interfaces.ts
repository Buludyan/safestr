export namespace InterfacesProjectSpecificInterfaces {
  export interface IGuard<TypeGuard> {
    _guard: TypeGuard;
  }

  export const videoOriginalNameTypeGuard: 'videoOriginalNameTypeGuard' =
    'videoOriginalNameTypeGuard';

  export interface IVideoOriginalName
    extends IGuard<typeof videoOriginalNameTypeGuard> {
    videoOriginalName: string;
  }

  export const newVideoOriginalName = (
    videoOriginalName: string
  ): IVideoOriginalName => {
    return {
      _guard: videoOriginalNameTypeGuard,
      videoOriginalName: videoOriginalName,
    };
  };

  export const videoHashNameTypeGuard: 'videoHashNameTypeGuard' =
    'videoHashNameTypeGuard';

  export interface IVideoHashName
    extends IGuard<typeof videoHashNameTypeGuard> {
    videoHashName: string;
  }

  export const newVideoHashName = (videoHashName: string): IVideoHashName => {
    return {
      _guard: videoHashNameTypeGuard,
      videoHashName,
    };
  };

  export const subtitleSignedUrlTypeGuard: 'subtitleSignedUrlTypeGuard' =
    'subtitleSignedUrlTypeGuard';

  export interface ISubtitleSignedUrl
    extends IGuard<typeof subtitleSignedUrlTypeGuard> {
    subtitleSignedUrl: string;
  }

  export const newSubtitleSignedUrl = (
    subtitleSignedUrl: string
  ): ISubtitleSignedUrl => {
    return {
      _guard: subtitleSignedUrlTypeGuard,
      subtitleSignedUrl,
    };
  };
}

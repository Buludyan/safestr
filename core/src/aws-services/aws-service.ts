export namespace CoreAwsService {
  export interface AwsService {
    construct: () => void;
    destroy: () => void;
  }
}

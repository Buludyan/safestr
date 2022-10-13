import {APIGatewayProxyResult, APIGatewayEvent} from 'aws-lambda';
import {InterfacesProjectSpecificInterfaces} from 'interfaces';
import {InterfacesProjectSpecificConstants} from 'interfaces';
import {CoreCommonUtils, CoreLog} from 'core';
import {BackEndCounterStore} from '../counterStore';
import {CoreS3Bucket} from 'core';

export namespace BackEndUploadLambda {
  import isNull = CoreCommonUtils.isNull;
  import makeSureThatXIs = CoreCommonUtils.makeSureThatXIs;
  import S3Bucket = CoreS3Bucket.S3Bucket;
  import IImagePayload = InterfacesProjectSpecificInterfaces.IImagePayload;
  import imagePayloadTypeGuard = InterfacesProjectSpecificInterfaces.imagePayloadTypeGuard;
  import newCounterIncrements = InterfacesProjectSpecificInterfaces.newCounterIncrements;
  import CounterStore = BackEndCounterStore.CounterStore;
  import countersDynamoTableName = InterfacesProjectSpecificConstants.countersDynamoTableName;
  import inputBucketName = InterfacesProjectSpecificConstants.inputBucketName;
  import log = CoreLog.log;

  export const uploadLambdaHandler =
    'dist/src/lambdasHandlers/upload-lambda.BackEndUploadLambda.upload';

  export const upload = async (
    event: APIGatewayEvent
  ): Promise<APIGatewayProxyResult> => {
    try {
      if (isNull(event.body)) {
        return {
          statusCode: 400,
          body: 'Invalid input',
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Content-Type': 'application/json',
          },
        };
      }
      const body = JSON.parse(event.body);
      makeSureThatXIs<IImagePayload>(body, imagePayloadTypeGuard);

      const countersDynamoTable = new CounterStore(countersDynamoTableName);
      const counterIncrementsRequestObject = newCounterIncrements({
        imageIndexIncrement: 1,
        infoJsonIndexIncrement: 0,
        processedImageIndexIncrement: 0,
      });

      const counters = await countersDynamoTable.incrementCounters(
        body.token.token,
        counterIncrementsRequestObject
      );

      const inputBucket: S3Bucket = new S3Bucket(inputBucketName);
      inputBucket.sendFileWithContent(
        `${body.token.token}/${counters.lastImageIndexToAdd}.png`,
        body.imageContent,
        'image/png',
        false
      );

      return {
        statusCode: 200,
        body: JSON.stringify(counters.lastImageIndexToAdd),
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Content-Type': 'application/json',
        },
      };
    } catch (err) {
      log.error(JSON.stringify(err));
      return {
        statusCode: 515,
        body: `Internal Server Error\n${err}`,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Content-Type': 'application/json',
        },
      };
    }
  };
}

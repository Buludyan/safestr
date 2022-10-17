import {APIGatewayProxyResult, APIGatewayEvent} from 'aws-lambda';
import {InterfacesProjectSpecificInterfaces} from 'interfaces';
import {InterfacesProjectSpecificConstants} from 'interfaces';
import {CoreCommonUtils, CoreLog} from 'core';
import {BackEndCounterStore} from '../counterStore';
import {CoreS3Bucket} from 'core';
import {CoreRekognition} from 'core';

export namespace BackEndProcessLambda {
  import isNull = CoreCommonUtils.isNull;
  import makeSureThatXIs = CoreCommonUtils.makeSureThatXIs;
  import S3Bucket = CoreS3Bucket.S3Bucket;
  import IImagePayload = InterfacesProjectSpecificInterfaces.IImagePayload;
  import imagePayloadTypeGuard = InterfacesProjectSpecificInterfaces.imagePayloadTypeGuard;
  import newCounterIncrement = InterfacesProjectSpecificInterfaces.newCounterIncrement;
  import CounterStore = BackEndCounterStore.CounterStore;
  import counterDynamoTableName = InterfacesProjectSpecificConstants.counterDynamoTableName;
  import imageBucketName = InterfacesProjectSpecificConstants.imageBucketName;
  import Rekognition = CoreRekognition.Rekognition;
  import log = CoreLog.log;

  export const processLambdaHandler =
    'dist/src/lambdasHandlers/process-lambda.BackEndProcessLambda.process';

  export const process = async (
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

      const counterDynamoTable = new CounterStore(counterDynamoTableName);
      const counterIncrementsRequestObject = newCounterIncrement({
        imageIndexIncrement: 1,
      });

      const counter = await counterDynamoTable.incrementCounter(
        body.token.token,
        counterIncrementsRequestObject
      );

      const imageContent = body.imageContent.replace(
        /^data:image\/png;base64,/,
        ''
      );

      const buff = Buffer.from(imageContent, 'base64').toString('ascii');

      const fileName = `${body.token.token}/${counter.lastImageIndexToAdd}.png`;
      const imageBucket: S3Bucket = new S3Bucket(imageBucketName);
      imageBucket.sendFileWithContent(fileName, buff, 'image/png', false);

      const rekognition = new Rekognition();
      rekognition.construct();
      const detectProtectiveEquipmentResult =
        await rekognition.detectProtectiveEquipment(
          imageBucketName,
          fileName,
          ['FACE_COVER', 'HAND_COVER', 'HEAD_COVER'],
          90
        );
      rekognition.destroy();

      return {
        statusCode: 200,
        body: JSON.stringify(detectProtectiveEquipmentResult),
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

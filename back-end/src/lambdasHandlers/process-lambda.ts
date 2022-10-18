import {APIGatewayProxyResult, APIGatewayEvent} from 'aws-lambda';
import {InterfacesProjectSpecificInterfaces} from 'interfaces';
import {InterfacesProjectSpecificConstants} from 'interfaces';
import {CoreCommonUtils, CoreLog} from 'core';
import {BackEndCounterStore} from '../counterStore';
import {CoreS3Bucket} from 'core';
import {CoreRekognition} from 'core';
import {Logger} from 'tslog';

export namespace BackEndProcessLambda {
  import isNull = CoreCommonUtils.isNull;
  import makeSureThatXIs = CoreCommonUtils.makeSureThatXIs;
  import IImagePayload = InterfacesProjectSpecificInterfaces.IImagePayload;
  import imagePayloadTypeGuard = InterfacesProjectSpecificInterfaces.imagePayloadTypeGuard;
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

      const imageContent = body.imageContent.replace(
        /data:image\/.*;base64,/,
        ''
      );
      const rekognition = new Rekognition();
      rekognition.construct();
      const detectProtectiveEquipmentResult =
        await rekognition.detectProtectiveEquipment(
          Buffer.from(imageContent, 'base64'),
          ['FACE_COVER', 'HAND_COVER', 'HEAD_COVER'],
          60
        );
      log.info(
        `Returned from detectProtectiveEquipment, result=${JSON.stringify(
          detectProtectiveEquipmentResult
        )}`
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

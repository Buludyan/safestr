import {CoreCommonUtils} from 'core';
import {APIGatewayProxyResult, APIGatewayEvent} from 'aws-lambda';
import {CoreDynamoDb} from 'core';
import {InterfacesProjectSpecificInterfaces} from 'interfaces';
import {InterfacesProjectSpecificConstants} from 'interfaces';
import {CoreLog} from 'core';
import * as md5 from 'md5';

export namespace BackEndPrepareLambda {
  import isNull = CoreCommonUtils.isNull;
  import makeSureThatXIs = CoreCommonUtils.makeSureThatXIs;
  import IVideoOriginalName = InterfacesProjectSpecificInterfaces.IVideoOriginalName;
  import videoOriginalNameTypeGuard = InterfacesProjectSpecificInterfaces.videoOriginalNameTypeGuard;
  import newVideoOriginalName = InterfacesProjectSpecificInterfaces.newVideoOriginalName;
  import IVideoHashName = InterfacesProjectSpecificInterfaces.IVideoHashName;
  import newVideoHashName = InterfacesProjectSpecificInterfaces.newVideoHashName;
  import KeyValueStore = CoreDynamoDb.KeyValueStore;
  import hashNameToOriginalNameDynamoTableName = InterfacesProjectSpecificConstants.hashNameToOriginalNameDynamoTableName;
  import log = CoreLog.log;

  export const prepareLambdaHandler =
    'dist/src/lambdasHandlers/prepare-lambda.BackEndPrepareLambda.nameResponse';

  export const nameResponse = async (
    event: APIGatewayEvent
    //context: Context
  ): Promise<APIGatewayProxyResult> => {
    try {
      if (isNull(event.body)) {
        return {
          statusCode: 400,
          body: 'Invalid input, expecting body with \n{\n\t_guard: videoOriginalNameTypeGuard,\n\tvideoOriginalName: <original video name>\n}',
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Content-Type': 'application/json',
          },
        };
      }
      const body = JSON.parse(event.body);
      makeSureThatXIs<IVideoOriginalName>(body, videoOriginalNameTypeGuard);
      const myTable = new KeyValueStore<IVideoOriginalName>(
        hashNameToOriginalNameDynamoTableName,
        videoOriginalNameTypeGuard
      );

      const extention = body.videoOriginalName.substring(
        body.videoOriginalName.lastIndexOf('.') + 1
      );
      const hashedVideoName = `${md5(
        body.videoOriginalName.concat(Date.now().toString())
      )}.${extention}`;

      await myTable.putRecord(
        hashedVideoName,
        newVideoOriginalName(body.videoOriginalName)
      );

      const videoHashName: IVideoHashName = newVideoHashName(hashedVideoName);

      return {
        statusCode: 200,
        body: JSON.stringify(videoHashName),
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

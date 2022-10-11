import {APIGatewayProxyResult, APIGatewayEvent} from 'aws-lambda';
import {
  InterfacesProjectSpecificInterfaces,
  InterfacesProjectSpecificConstants,
} from 'interfaces';
import {CoreCommonUtils} from 'core';
import {CoreTranscribe} from 'core';
import {CoreLog} from 'core';

export namespace BackEndProcessLambda {
  import isNull = CoreCommonUtils.isNull;
  import Transcribe = CoreTranscribe.Transcribe;
  import makeSureThatXIs = CoreCommonUtils.makeSureThatXIs;
  import IVideoHashName = InterfacesProjectSpecificInterfaces.IVideoHashName;
  import videoHashNameTypeGuard = InterfacesProjectSpecificInterfaces.videoHashNameTypeGuard;
  import transcribeOutputStoreName = InterfacesProjectSpecificConstants.transcribeOutputStoreName;
  import videoStoreName = InterfacesProjectSpecificConstants.videoStoreName;
  import log = CoreLog.log;

  export const processLambdaHandler =
    'dist/src/lambdasHandlers/process-lambda.BackEndProcessLambda.transcribeInvoke';

  export const transcribeInvoke = async (
    event: APIGatewayEvent
    //context: Context
  ): Promise<APIGatewayProxyResult> => {
    try {
      if (isNull(event.body)) {
        return {
          statusCode: 400,
          body: 'Invalid input, expecting body with \n{\n\t_guard: videoHashNameTypeGuard,\n\tvideoHashName: <hash video name>\n}',
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Content-Type': 'application/json',
          },
        };
      }
      const body = JSON.parse(event.body);
      makeSureThatXIs<IVideoHashName>(body, videoHashNameTypeGuard);
      const transcribeNewJob = new Transcribe(
        body.videoHashName,
        videoStoreName,
        transcribeOutputStoreName
      );

      await transcribeNewJob.construct();

      return {
        statusCode: 200,
        body: `Transcription job for ${body.videoHashName} started`,
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
        body: `Internal Server Error \n ${err}`,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Content-Type': 'application/json',
        },
      };
    }
  };
}

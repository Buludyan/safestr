import * as AWS from 'aws-sdk';
import {CoreLog} from '../utilities/log';
import {CoreAwsCommonUtils} from './aws-common-utils';
import {CoreAwsService} from './aws-service';

export namespace CoreTranscribe {
  import awsCommand = CoreAwsCommonUtils.awsCommand;
  import log = CoreLog.log;
  import AwsService = CoreAwsService.AwsService;

  const transcribeClient: AWS.TranscribeService = new AWS.TranscribeService({
    apiVersion: '2017-10-26',
    region: 'eu-central-1',
  });

  export class Transcribe implements AwsService {
    constructor(
      private videoName: string,
      private videoStore: string,
      private transcribeOutputStore: string
    ) {}
    readonly construct = async (): Promise<void> => {
      return await awsCommand(
        async (): Promise<void> => {
          const transcriptionJobRequest: AWS.TranscribeService.StartTranscriptionJobRequest =
            {
              TranscriptionJobName: this.videoName,
              Media: {
                MediaFileUri: `s3://${this.videoStore}/${this.videoName}`,
              },
              LanguageCode: 'en-US',
              OutputBucketName: this.transcribeOutputStore,
              Subtitles: {
                Formats: ['srt'],
                OutputStartIndex: 1,
              },
            };
          const response = await transcribeClient
            .startTranscriptionJob(transcriptionJobRequest)
            .promise();
          log.info(
            `Transcription job for ${
              this.videoName
            } started, response = ${JSON.stringify(response)}`
          );
        },
        async (): Promise<void | null> => {
          return null;
        }
      );
    };
    readonly destroy = async (): Promise<void> => {
      return await awsCommand(
        async (): Promise<void> => {
          const deleteTranscriptionJobRequest: AWS.TranscribeService.DeleteTranscriptionJobRequest =
            {
              TranscriptionJobName: this.videoName,
            };
          await transcribeClient
            .deleteTranscriptionJob(deleteTranscriptionJobRequest)
            .promise();
          log.info(`Transcription job ${this.videoName} is deleted`);
        },
        async (): Promise<void | null> => {
          return null;
        }
      );
    };
  }
}

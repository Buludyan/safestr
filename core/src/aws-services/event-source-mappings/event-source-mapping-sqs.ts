import * as AWS from 'aws-sdk';
import {CoreCommonUtils} from '../../utilities/common-utils';
import {CoreLog} from '../../utilities/log';
import {CoreAwsCommonUtils} from '../aws-common-utils';
import {CoreAwsService} from '../aws-service';

export namespace CoreEventSourceMappingSqs {
  import throwIfNull = CoreCommonUtils.throwIfNull;
  import throwIfUndefined = CoreCommonUtils.throwIfUndefined;
  import isNull = CoreCommonUtils.isNull;
  import log = CoreLog.log;
  import awsCommand = CoreAwsCommonUtils.awsCommand;
  import AwsService = CoreAwsService.AwsService;

  const lambdaClient: AWS.Lambda = new AWS.Lambda({
    apiVersion: '2015-03-31',
    region: 'eu-central-1',
  });

  export class EventSourceMappingSQS implements AwsService {
    uuid: string | null = null;
    constructor(private queueARN: string, private lambdaName: string) {}
    readonly construct = async () => {
      log.info(
        `Creating event source mapping between lambda ${this.lambdaName} and queue ${this.queueARN}.`
      );
      this.uuid = await awsCommand(
        async (): Promise<string> => {
          const createEventSourceMappingParams: AWS.Lambda.Types.CreateEventSourceMappingRequest =
            {
              BatchSize: 10,
              MaximumBatchingWindowInSeconds: 1,
              Enabled: true,
              EventSourceArn: this.queueARN,
              FunctionName: this.lambdaName,
            };
          const data = await lambdaClient
            .createEventSourceMapping(createEventSourceMappingParams)
            .promise();
          throwIfUndefined(data.UUID);
          return data.UUID;
        },
        async (err): Promise<string | null> => {
          if (err.code === 'ResourceConflictException') {
            log.info(
              `The EventSourceMapping already exists, or another operation is in progress.`
            );
            const uuid = err.message.match(/[\d\w-]+$/);
            if (isNull(uuid) || uuid.length === 0) {
              const message = `Error message does not contain uuid of EventSourceMapping, AWS error: ${err}`;
              log.rethrow(message, err);
            }
            throwIfNull(uuid);
            return uuid[0];
          }
          return null;
        }
      );
      return this.uuid;
    };
    readonly destroy = async () => {
      const eventSourceMappingUUID = this.uuid;
      throwIfNull(eventSourceMappingUUID);
      log.info(`Deleting event source mapping, UUID=${eventSourceMappingUUID}`);
      return await awsCommand(
        async (): Promise<void> => {
          const deleteEventSourceMappingParams: AWS.Lambda.Types.DeleteEventSourceMappingRequest =
            {
              UUID: eventSourceMappingUUID,
            };
          await lambdaClient
            .deleteEventSourceMapping(deleteEventSourceMappingParams)
            .promise();
          log.info(
            `Event source mapping deleted, UUID=${eventSourceMappingUUID}`
          );
        },
        async (err): Promise<void | null> => {
          if (err.code === 'ResourceNotFoundException') {
            log.info(
              `Event source mapping does not exists, UUID=${eventSourceMappingUUID}`
            );
          }
          return null;
        }
      );
    };
    readonly getUuid = async () => {
      return this.uuid;
    };
  }
}

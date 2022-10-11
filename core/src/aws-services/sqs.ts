import {CoreLog} from './../utilities/log';
import * as AWS from 'aws-sdk';
import {AWSError} from 'aws-sdk/lib/error';
import {CoreCommonUtils} from '../utilities/common-utils';
import {CoreAwsCommonUtils} from './aws-common-utils';
import {CoreAwsService} from './aws-service';

export namespace CoreSqs {
  import sleep = CoreCommonUtils.sleep;
  import TypeGuardOf = CoreCommonUtils.TypeGuardOf;
  import IGuard = CoreCommonUtils.IGuard;
  import throwIfNull = CoreCommonUtils.throwIfNull;
  import throwIfUndefined = CoreCommonUtils.throwIfUndefined;
  import makeSureThatXIs = CoreCommonUtils.makeSureThatXIs;
  import isNull = CoreCommonUtils.isNull;
  import isNotNull = CoreCommonUtils.isNotNull;
  import isUndefined = CoreCommonUtils.isUndefined;
  import awsCommand = CoreAwsCommonUtils.awsCommand;
  import log = CoreLog.log;
  import AwsService = CoreAwsService.AwsService;

  const sqsClient: AWS.SQS = new AWS.SQS({
    apiVersion: '2012-11-05',
    region: 'eu-central-1',
  });

  export class SQS implements AwsService {
    private queueUrl: string | null = null;
    constructor(private queueName: string) {}
    readonly construct = async () => {
      return await awsCommand(
        async (): Promise<void> => {
          const createParams: AWS.SQS.Types.CreateQueueRequest = {
            QueueName: this.queueName,
            Attributes: {
              DelaySeconds: '10',
              MessageRetentionPeriod: '3600',
              VisibilityTimeout: '60',
            },
          };
          const data = await sqsClient.createQueue(createParams).promise();
          await sleep(1000);

          throwIfUndefined(data.QueueUrl);

          this.queueUrl = data.QueueUrl;
        },
        async (): Promise<void | null> => {
          return null;
        }
      );
    };
    readonly destroy = async () => {
      return await awsCommand(
        async (): Promise<void> => {
          if (isNull(this.queueUrl)) {
            return;
          }
          const deleteParams: AWS.SQS.Types.DeleteQueueRequest = {
            QueueUrl: this.queueUrl,
          };
          const data = await sqsClient.deleteQueue(deleteParams).promise();
          await sleep(60000);
          log.info(`Queue ${this.queueName} successfully deleted!`);
        },
        async (): Promise<void | null> => {
          return null;
        }
      );
    };
    static readonly list = async () => {
      return await awsCommand(
        async (): Promise<void> => {
          const createParams: AWS.SQS.Types.ListQueuesRequest = {};

          // TODO: handle several pages of queues
          const data = await sqsClient.listQueues(createParams).promise();
          log.info(`${data.QueueUrls}`);
        },
        async (): Promise<void | null> => {
          return null;
        }
      );
    };
    readonly getArn = async () => {
      return await awsCommand(
        async (): Promise<void> => {
          const getQueueUrlReq: AWS.SQS.Types.GetQueueUrlRequest = {
            QueueName: this.queueName,
          };

          const response = await sqsClient
            .getQueueUrl(getQueueUrlReq)
            .promise();

          throwIfUndefined(response.QueueUrl);

          const queueUrl = response.QueueUrl;

          const queueAttrParams: AWS.SQS.Types.GetQueueAttributesRequest = {
            QueueUrl: queueUrl,
            AttributeNames: ['QueueArn'],
          };

          const queueArn = await sqsClient
            .getQueueAttributes(queueAttrParams)
            .promise();

          log.info(`${queueArn}`);
        },
        async (): Promise<void | null> => {
          return null;
        }
      );
    };
  }
}

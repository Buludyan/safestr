import * as AWS from 'aws-sdk';
import {CoreAwsCommonUtils} from './aws-common-utils';
import {CoreCommonUtils} from '../utilities/common-utils';
import {CoreLog} from '../utilities/log';
import {CoreAwsService} from './aws-service';

export namespace CoreLambda {
  import throwIfNull = CoreCommonUtils.throwIfNull;
  import throwIfUndefined = CoreCommonUtils.throwIfUndefined;
  import awsCommand = CoreAwsCommonUtils.awsCommand;
  import log = CoreLog.log;
  import AwsService = CoreAwsService.AwsService;

  const lambdaClient: AWS.Lambda = new AWS.Lambda({
    apiVersion: '2015-03-31',
    region: 'eu-central-1',
  });

  export class Lambda implements AwsService {
    constructor(
      private functionName: string,
      private s3BucketName: string,
      private codeBaseZipName: string,
      private handlerName: string,
      private timeoutInSeconds: number
    ) {}

    readonly construct = async (): Promise<void> => {
      log.info(`Constructing Lambda ${this.functionName}`);
      return awsCommand(
        async () => {
          const createFunctionRequest: AWS.Lambda.Types.CreateFunctionRequest =
            {
              Code: {
                S3Bucket: this.s3BucketName,
                S3Key: this.codeBaseZipName,
              },
              // Environment: {
              //    Variables: {
              //       string : string
              //    }
              // },
              FunctionName: this.functionName,
              Handler: this.handlerName,
              MemorySize: 128,
              PackageType: 'Zip',
              Publish: true,
              Role: 'arn:aws:iam::642813027215:role/AwsLambdaLevon',
              Runtime: 'nodejs16.x',
              Timeout: this.timeoutInSeconds,
            };
          await lambdaClient.createFunction(createFunctionRequest).promise();
          log.info(`Lambda ${this.functionName} constructed`);
          const arn = await this.getArn();
          throwIfNull(arn);
          log.info(
            `Granting InvokdeFunction permission to lambda ${this.functionName}`
          );
          const addPermisionRequest: AWS.Lambda.Types.AddPermissionRequest = {
            Action: 'lambda:InvokeFunction',
            Principal: 'apigateway.amazonaws.com',
            FunctionName: arn,
            StatementId: 'lambdaApiGatewayAddInvokeFunctionPermission',
          };
          await lambdaClient.addPermission(addPermisionRequest).promise();
          log.info(
            `Permission InvokdeFunction granted to lambda ${this.functionName}`
          );
        },
        async err => {
          if (err.code === 'ResourceConflictException') {
            log.info(
              `Lambda ${this.functionName} is already constructed, skipping construction. Make sure, that lambda is deleted, is you want to update it's source code.`
            );
            return;
          }
          return null;
        }
      );
    };
    readonly destroy = async (): Promise<void> => {
      log.info(`Destroying Lambda ${this.functionName} ARN`);
      return awsCommand(
        async () => {
          const deleteFunctionRequest: AWS.Lambda.Types.DeleteFunctionRequest =
            {
              FunctionName: this.functionName,
            };
          await lambdaClient.deleteFunction(deleteFunctionRequest).promise();
        },
        async () => {
          return null;
        }
      );
    };

    readonly getArn = async (): Promise<string | null> => {
      log.info(`Getting Lambda ${this.functionName} ARN`);
      const arn = await awsCommand(
        async () => {
          const getFunctionParams: AWS.Lambda.Types.GetFunctionRequest = {
            FunctionName: this.functionName,
          };

          const data = await lambdaClient
            .getFunction(getFunctionParams)
            .promise();
          throwIfUndefined(data.Configuration);
          log.info(
            `Lambda ${this.functionName} ARN got: ${JSON.stringify(
              data.Configuration.FunctionArn
            )}`
          );
          return data.Configuration.FunctionArn;
        },
        async err => {
          if (err.code === `ResourceNotFoundException`) {
            return undefined;
          }
          return null;
        }
      );
      return arn ?? null;
    };
    readonly setTag = async (tags: {[key: string]: string}) => {
      log.info(
        `Adding tags ${JSON.stringify(tags)} to Lambda ${this.functionName}`
      );

      return await awsCommand(
        async () => {
          const lambdaArn = await this.getArn();
          throwIfNull(lambdaArn);
          const tagResourceReq: AWS.Lambda.Types.TagResourceRequest = {
            Resource: lambdaArn,
            Tags: {
              ...tags,
            },
          };
          await lambdaClient.tagResource().promise();
          log.info(
            `Tags ${JSON.stringify(tags)} set to Lambda ${this.functionName}`
          );
        },
        async err => {
          if (err.code === 'ResourceConflictException') {
            log.info(
              `The lambda ${this.functionName} tags ${JSON.stringify(
                tags
              )} already exists, or another operation is in progress`
            );
            return;
          }
          return null;
        }
      );
    };
    readonly getTag = async (tagName: string) => {
      return await awsCommand(
        async () => {
          const lambdaARN = await this.getArn();
          throwIfNull(lambdaARN);
          log.info(`Getting tags from Lambda ${lambdaARN}`);
          const data = await lambdaClient
            .listTags({Resource: lambdaARN})
            .promise();
          throwIfUndefined(data.Tags);
          log.info(
            `Got tag from Lambda ${lambdaARN}. ${tagName}=${data.Tags[tagName]}`
          );
          return data.Tags[tagName];
        },
        async err => {
          return null;
        }
      );
    };

    readonly setEventSourceMappingArnInTags = async (
      eventSourceMappingArn: string
    ) => {
      log.info(
        `Adding event source mapping arn in Lambda ${this.functionName} tags`
      );
      await this.setTag({eventSourceMappingArn: eventSourceMappingArn});
    };
    readonly getEventSourceMappingArnInTags = async () => {
      log.info(
        `Getting event source mapping arn from Lambda ${this.functionName} tags`
      );
      return await this.getTag('eventSourceMappingArn');
    };
  }
}

import {CoreLog} from './../utilities/log';
import {AWSError} from 'aws-sdk/lib/error';
import * as AWS from 'aws-sdk';
import {CoreAwsCommonUtils} from './aws-common-utils';
import {CoreCommonUtils} from '../utilities/common-utils';
import {CoreAwsService} from './aws-service';

export namespace CoreDynamoDb {
  import TypeGuardOf = CoreCommonUtils.TypeGuardOf;
  import IGuard = CoreCommonUtils.IGuard;
  import throwIfUndefined = CoreCommonUtils.throwIfUndefined;
  import makeSureThatXIs = CoreCommonUtils.makeSureThatXIs;
  import awsCommand = CoreAwsCommonUtils.awsCommand;
  import log = CoreLog.log;
  import AwsService = CoreAwsService.AwsService;

  const dynamoClient: AWS.DynamoDB = new AWS.DynamoDB({
    apiVersion: '2012-08-10',
    region: 'eu-central-1',
  });

  const dynamoDocClient: AWS.DynamoDB.DocumentClient =
    new AWS.DynamoDB.DocumentClient({
      apiVersion: '2012-08-10',
      region: 'eu-central-1',
    });

  export class KeyValueStore<RecordType extends IGuard<TypeGuardOf<RecordType>>>
    implements AwsService
  {
    constructor(
      private tableName: string,
      private typeGuard: TypeGuardOf<RecordType>
    ) {}

    readonly construct = async (): Promise<void> => {
      return await awsCommand(
        async (): Promise<void> => {
          const createTableReq: AWS.DynamoDB.Types.CreateTableInput = {
            AttributeDefinitions: [
              {
                AttributeName: 'hashKey',
                AttributeType: 'S',
              },
            ],
            BillingMode: 'PROVISIONED',
            KeySchema: [
              {
                AttributeName: 'hashKey',
                KeyType: 'HASH',
              },
            ],
            ProvisionedThroughput: {
              ReadCapacityUnits: 1, //TODO: refine
              WriteCapacityUnits: 1,
            },
            TableClass: 'STANDARD',
            TableName: this.tableName,
          };

          await dynamoClient.createTable(createTableReq).promise();
          log.info(`Table ${this.tableName} is created`);
        },
        async (err: AWSError): Promise<void | null> => {
          if (err.code === 'ResourceInUseException') {
            log.info(`Table ${this.tableName} is already created`);
            return;
          }
          return null;
        }
      );
    };
    readonly destroy = async (): Promise<void> => {
      return await awsCommand(
        async (): Promise<void> => {
          const deleteTableReq: AWS.DynamoDB.Types.DeleteTableInput = {
            TableName: this.tableName,
          };

          await dynamoClient.deleteTable(deleteTableReq).promise();
          log.info(`Table ${this.tableName} is deleted`);
        },
        async (err: AWSError): Promise<void | null> => {
          if (err.code === 'ResourceNotFoundException') {
            log.error(`Table ${this.tableName} is not found`);
            return;
          }
          return null;
        }
      );
    };
    readonly putRecord = async (
      hashKey: string,
      record: RecordType
    ): Promise<void> => {
      return await awsCommand(
        async (): Promise<void> => {
          const putItemInput: AWS.DynamoDB.DocumentClient.PutItemInput = {
            Item: {
              hashKey: hashKey,
              record: record,
            },
            TableName: this.tableName,
            ConditionExpression: 'not (attribute_exists(hashKey))',
          };

          await dynamoDocClient.put(putItemInput).promise();
          log.info(`Item ${hashKey} is inserted`);
        },
        async (err: AWSError): Promise<void | null> => {
          if (err.code === 'ConditionalCheckFailedException') {
            log.error(`Item ${hashKey} is already existed`);
            return;
          }
          return null;
        }
      );
    };
    readonly updateRecord = async (
      hashKey: string,
      record: RecordType
    ): Promise<void> => {
      return await awsCommand(
        async (): Promise<void> => {
          log.info(
            `Updating item ${hashKey} with record ${JSON.stringify(record)}`
          );
          const updateItemReq: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
            TableName: this.tableName,
            Key: {
              hashKey: hashKey,
            },
            UpdateExpression: 'set #record = :record',
            ExpressionAttributeNames: {
              '#record': 'record',
            },
            ExpressionAttributeValues: {
              ':record': record,
            },
            ConditionExpression: 'attribute_exists(hashKey)',
          };

          await dynamoDocClient.update(updateItemReq).promise();
          log.info(`Item ${hashKey} is updated`);
        },
        async (): Promise<void | null> => {
          return null;
        }
      );
    };
    readonly getRecord = async (hashKey: string): Promise<RecordType> => {
      return await awsCommand(
        async (): Promise<RecordType> => {
          const getItemInput: AWS.DynamoDB.DocumentClient.GetItemInput = {
            Key: {
              hashKey: hashKey,
            },
            TableName: this.tableName,
          };

          const response = await dynamoDocClient.get(getItemInput).promise();
          log.info(`Successfully get ${JSON.stringify(response.Item)}`);
          throwIfUndefined(response.Item);
          const record = response.Item.record;
          makeSureThatXIs<RecordType>(record, this.typeGuard);
          return record;
        },
        async (): Promise<RecordType | null> => {
          return null;
        }
      );
    };
    readonly deleteRecord = async (hashKey: string): Promise<void> => {
      return await awsCommand(
        async (): Promise<void> => {
          const deleteItemInput: AWS.DynamoDB.DocumentClient.DeleteItemInput = {
            Key: {
              hashKey: hashKey,
            },
            TableName: this.tableName,
            ConditionExpression: 'attribute_exists(hashKey)',
          };

          await dynamoDocClient.delete(deleteItemInput).promise();
          log.info(`Item ${hashKey} was successfully deleted`);
        },
        async (err: AWSError): Promise<void | null> => {
          if (err.code === 'ResourceNotFoundException') {
            log.error(`Item ${hashKey} not found`);
            return;
          }
          return null;
        }
      );
    };
    readonly getArn = async (): Promise<void> => {
      return await awsCommand(
        async (): Promise<void> => {
          const describeTableInput: AWS.DynamoDB.DocumentClient.DescribeTableInput =
            {
              TableName: this.tableName,
            };

          const data = await dynamoClient
            .describeTable(describeTableInput)
            .promise();

          throwIfUndefined(data.Table);
          throwIfUndefined(data.Table.TableArn);

          log.info(`${this.tableName} arn is ${data.Table.TableArn}`);
        },
        async (): Promise<void | null> => {
          return null;
        }
      );
    };
    readonly cleanup = async (): Promise<void> => {
      // TODO: implement, create table here
      log.throw('Not implemented');
    };
  }
}

import {BackEndHandshakeLambda} from './lambdasHandlers/handshake-lambda';
import {BackEndUploadLambda} from './lambdasHandlers/upload-lambda';
import {CoreS3Bucket} from 'core';
import {CoreDynamoDb} from 'core';
import {CoreCommonUtils} from 'core';
import {
  InterfacesProjectSpecificInterfaces,
  InterfacesProjectSpecificConstants,
} from 'interfaces';
import {CoreApiGateway} from 'core';
import {CoreLog} from 'core';
import {CoreLambda} from 'core';

import sleep = CoreCommonUtils.sleep;
import archiveSourceCodeAndGetPath = CoreCommonUtils.archiveSourceCodeAndGetPath;
import throwIfNull = CoreCommonUtils.throwIfNull;
import handshakeLamdaHandler = BackEndHandshakeLambda.handshakeLambdaHandler;
import uploadLamdaHandler = BackEndUploadLambda.uploadLambdaHandler;
import log = CoreLog.log;
import KeyValueStore = CoreDynamoDb.KeyValueStore;
import ICounters = InterfacesProjectSpecificInterfaces.ICounters;
import countersTypeGuard = InterfacesProjectSpecificInterfaces.countersTypeGuard;
import lambdaZipFileS3BucketName = InterfacesProjectSpecificConstants.lambdaZipFileS3BucketName;
import countersDynamoTableName = InterfacesProjectSpecificConstants.countersDynamoTableName;
import handshakeLambdaName = InterfacesProjectSpecificConstants.handshakeLambdaName;
import uploadLambdaName = InterfacesProjectSpecificConstants.uploadLambdaName;
import inputBucketName = InterfacesProjectSpecificConstants.inputBucketName;
import apiGatewayName = InterfacesProjectSpecificConstants.apiGatewayName;
import S3Bucket = CoreS3Bucket.S3Bucket;
import Lambda = CoreLambda.Lambda;
import ApiGateway = CoreApiGateway.ApiGateway;

log.info(`Compilation passed successfully!`);

const initiate = async () => {
  const LambdaBucket: S3Bucket = new S3Bucket(lambdaZipFileS3BucketName);
  await LambdaBucket.construct();
  const lambdaZipFilePath = await archiveSourceCodeAndGetPath();
  await LambdaBucket.sendFile(
    lambdaZipFilePath,
    lambdaZipFilePath,
    'application/zip',
    false
  );

  const handshakeLambda: Lambda = new Lambda(
    handshakeLambdaName,
    lambdaZipFileS3BucketName,
    lambdaZipFilePath,
    handshakeLamdaHandler,
    60
  );
  await handshakeLambda.construct();
  const handshakeLambdaArn = await handshakeLambda.getArn();
  throwIfNull(handshakeLambdaArn);

  const uploadLambda: Lambda = new Lambda(
    uploadLambdaName,
    lambdaZipFileS3BucketName,
    lambdaZipFilePath,
    uploadLamdaHandler,
    60
  );
  await uploadLambda.construct();
  const uploadLambdaArn = await uploadLambda.getArn();
  throwIfNull(uploadLambdaArn);

  const apiGateway = new ApiGateway(apiGatewayName);
  await apiGateway.construct();
  await apiGateway.createNewResource('handshake', handshakeLambdaArn, 'POST');
  await apiGateway.createNewResource('upload', uploadLambdaArn, 'POST');
  const apiUrl = await apiGateway.createDeployment();

  const countersDynamoTable = new KeyValueStore<ICounters>(
    countersDynamoTableName,
    countersTypeGuard
  );
  await countersDynamoTable.construct();

  const inputBucket: S3Bucket = new S3Bucket(inputBucketName);
  await inputBucket.construct();
  await inputBucket.setCors(['PUT']);

  console.log(apiUrl);
};

const demolish = async () => {
  const handshakeLambda: Lambda = new Lambda(
    handshakeLambdaName,
    // TODO: getRidOfParams
    '/',
    '/',
    handshakeLamdaHandler,
    60
  );
  await handshakeLambda.destroy();

  const apiGateway = new ApiGateway(apiGatewayName);
  await apiGateway.destroy();

  const countersDynamoTable = new KeyValueStore<ICounters>(
    countersDynamoTableName,
    countersTypeGuard
  );
  await countersDynamoTable.destroy();
};

const main = async () => {
  await demolish();
  await sleep(5000);
  await initiate();
  await sleep(600000);
  await demolish();
};

main().catch(err => log.error(`Something bad happened: ${err}`));

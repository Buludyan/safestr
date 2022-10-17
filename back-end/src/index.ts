import {BackEndHandshakeLambda} from './lambdasHandlers/handshake-lambda';
import {BackEndProcessLambda} from './lambdasHandlers/process-lambda';
import {CoreS3Bucket} from 'core';
import {CoreDynamoDb} from 'core';
import {CoreCommonUtils} from 'core';
import {CoreRekognition} from 'core';
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
import processLamdaHandler = BackEndProcessLambda.processLambdaHandler;
import log = CoreLog.log;
import KeyValueStore = CoreDynamoDb.KeyValueStore;
import ICounter = InterfacesProjectSpecificInterfaces.ICounter;
import counterTypeGuard = InterfacesProjectSpecificInterfaces.counterTypeGuard;
import lambdaZipFileS3BucketName = InterfacesProjectSpecificConstants.lambdaZipFileS3BucketName;
import counterDynamoTableName = InterfacesProjectSpecificConstants.counterDynamoTableName;
import handshakeLambdaName = InterfacesProjectSpecificConstants.handshakeLambdaName;
import processLambdaName = InterfacesProjectSpecificConstants.processLambdaName;
import imageBucketName = InterfacesProjectSpecificConstants.imageBucketName;
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

  const processLambda: Lambda = new Lambda(
    processLambdaName,
    lambdaZipFileS3BucketName,
    lambdaZipFilePath,
    processLamdaHandler,
    60
  );
  await processLambda.construct();
  const processLambdaArn = await processLambda.getArn();
  throwIfNull(processLambdaArn);

  const apiGateway = new ApiGateway(apiGatewayName);
  await apiGateway.construct();
  await apiGateway.createNewResource('handshake', handshakeLambdaArn, 'POST');
  await apiGateway.createNewResource('process', processLambdaArn, 'POST');
  const apiUrl = await apiGateway.createDeployment();

  const countersDynamoTable = new KeyValueStore<ICounter>(
    counterDynamoTableName,
    counterTypeGuard
  );
  await countersDynamoTable.construct();

  const imageBucket: S3Bucket = new S3Bucket(imageBucketName);
  await imageBucket.construct();
  await imageBucket.setCors(['PUT']);

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

  const processLambda: Lambda = new Lambda(
    processLambdaName,
    // TODO: getRidOfParams
    '/',
    '/',
    processLamdaHandler,
    60
  );
  await processLambda.destroy();

  const apiGateway = new ApiGateway(apiGatewayName);
  await apiGateway.destroy();

  const countersDynamoTable = new KeyValueStore<ICounter>(
    counterDynamoTableName,
    counterTypeGuard
  );
  await countersDynamoTable.destroy();
};

const main = async () => {
  await demolish();
  await sleep(5000);
  await initiate();
  // await sleep(600000);
  // await demolish();
};

main().catch(err => log.error(`Something bad happened: ${err}`));

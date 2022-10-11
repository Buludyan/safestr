import {BackEndProcessLambda} from './lambdasHandlers/process-lambda';
import {BackEndPrepareLambda} from './lambdasHandlers/prepare-lambda';
import {BackEndDownloadLambda} from './lambdasHandlers/download-lambda';
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
import prepareLambdaHandler = BackEndPrepareLambda.prepareLambdaHandler;
import processLambdaHandler = BackEndProcessLambda.processLambdaHandler;
import downloadLambdaHandler = BackEndDownloadLambda.downloadLambdaHandler;
import log = CoreLog.log;
import KeyValueStore = CoreDynamoDb.KeyValueStore;
import IVideoOriginalName = InterfacesProjectSpecificInterfaces.IVideoOriginalName;
import videoOriginalNameTypeGuard = InterfacesProjectSpecificInterfaces.videoOriginalNameTypeGuard;
import hashNameToOriginalNameDynamoTableName = InterfacesProjectSpecificConstants.hashNameToOriginalNameDynamoTableName;
import lambdaZipFileS3BucketName = InterfacesProjectSpecificConstants.lambdaZipFileS3BucketName;
import transcribeOutputStoreName = InterfacesProjectSpecificConstants.transcribeOutputStoreName;
import prepareLambdaName = InterfacesProjectSpecificConstants.prepareLambdaName;
import processLambdaName = InterfacesProjectSpecificConstants.processLambdaName;
import downloadLambdaName = InterfacesProjectSpecificConstants.downloadLambdaName;
import videoStoreName = InterfacesProjectSpecificConstants.videoStoreName;
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

  const prepareLambda: Lambda = new Lambda(
    prepareLambdaName,
    lambdaZipFileS3BucketName,
    lambdaZipFilePath,
    prepareLambdaHandler,
    60
  );
  await prepareLambda.construct();
  const prepareLambdaArn = await prepareLambda.getArn();
  throwIfNull(prepareLambdaArn);

  const processLambda: Lambda = new Lambda(
    processLambdaName,
    lambdaZipFileS3BucketName,
    lambdaZipFilePath,
    processLambdaHandler,
    60
  );
  await processLambda.construct();
  const processLambdaArn = await processLambda.getArn();
  throwIfNull(processLambdaArn);

  const downloadLambda: Lambda = new Lambda(
    downloadLambdaName,
    lambdaZipFileS3BucketName,
    lambdaZipFilePath,
    downloadLambdaHandler,
    60
  );
  await downloadLambda.construct();
  const downloadLambdaArn = await downloadLambda.getArn();
  throwIfNull(downloadLambdaArn);

  const apiGateway = new ApiGateway(apiGatewayName);
  await apiGateway.construct();
  await apiGateway.createNewResource('prepare', prepareLambdaArn, 'POST');
  await apiGateway.createNewResource('process', processLambdaArn, 'POST');
  await apiGateway.createNewResource('download', downloadLambdaArn, 'POST');
  const apiUrl = await apiGateway.createDeployment();

  const hashNameToOriginalNameDynamoTable =
    new KeyValueStore<IVideoOriginalName>(
      hashNameToOriginalNameDynamoTableName,
      videoOriginalNameTypeGuard
    );
  await hashNameToOriginalNameDynamoTable.construct();

  const videoStore: S3Bucket = new S3Bucket(videoStoreName);
  await videoStore.construct();
  await videoStore.setCors(['PUT']);

  const transcribeOutputStore: S3Bucket = new S3Bucket(
    transcribeOutputStoreName
  );
  await transcribeOutputStore.construct();
  await transcribeOutputStore.setCors(['GET']);

  console.log(apiUrl);
  console.log("Don't forget to change url in front-end in Axios.ts!");
};

const demolish = async () => {
  const nameLambda: Lambda = new Lambda(
    prepareLambdaName,
    // TODO: getRidOfParams
    '/',
    '/',
    prepareLambdaHandler,
    60
  );
  await nameLambda.destroy();

  const transcribeLambda: Lambda = new Lambda(
    processLambdaName,
    '/',
    '/',
    processLambdaHandler,
    60
  );
  await transcribeLambda.destroy();

  const downloadLambda: Lambda = new Lambda(
    downloadLambdaName,
    '/',
    '/',
    downloadLambdaHandler,
    60
  );
  await downloadLambda.destroy();

  const apiGateway = new ApiGateway(apiGatewayName);
  await apiGateway.destroy();

  const hashToVideoDynamoTable = new KeyValueStore<IVideoOriginalName>(
    hashNameToOriginalNameDynamoTableName,
    videoOriginalNameTypeGuard
  );
  await hashToVideoDynamoTable.destroy();
};

const main = async () => {
  // await demolish();
  // await sleep(5000);
  await initiate();
  await sleep(600000);
  //await demolish();
};

main().catch(err => log.error(`Something bad happened: ${err}`));

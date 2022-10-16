import * as AWS from 'aws-sdk';
import {CoreLog} from '../utilities/log';
import {CoreCommonUtils} from '../utilities/common-utils';
import {CoreAwsCommonUtils} from './aws-common-utils';
import {CoreAwsService} from './aws-service';

export namespace CoreRekognition {
  import awsCommand = CoreAwsCommonUtils.awsCommand;
  import log = CoreLog.log;
  import AwsService = CoreAwsService.AwsService;
  import throwIfUndefined = CoreCommonUtils.throwIfUndefined;

  const rekognitionClient: AWS.Rekognition = new AWS.Rekognition({
    apiVersion: '2016-06-27',
    region: 'eu-central-1',
  });

  interface DetectProtectiveEquipmentPersonInfo {
    faceCovered: boolean;
    headCovered: boolean;
    leftHandCovered: boolean;
    rightHandCovered: boolean;
    exists: boolean;
  }

  export interface DetectProtectiveEquipmentResult {
    readonly persons: DetectProtectiveEquipmentPersonInfo[];
  }

  export class Rekognition implements AwsService {
    constructor() {}
    readonly construct = async (): Promise<void> => {};
    readonly destroy = async (): Promise<void> => {};

    readonly detectProtectiveEquipment = async (
      bucketName: string,
      imageName: string,
      requiredEquipmentTypes: ('FACE_COVER' | 'HAND_COVER' | 'HEAD_COVER')[],
      minConfidence: number
    ): Promise<DetectProtectiveEquipmentResult> => {
      return await awsCommand(
        async (): Promise<DetectProtectiveEquipmentResult> => {
          const ppeRequest: AWS.Rekognition.DetectProtectiveEquipmentRequest = {
            Image: {
              S3Object: {
                Bucket: bucketName,
                Name: imageName,
              },
            },
            SummarizationAttributes: {
              RequiredEquipmentTypes: requiredEquipmentTypes,
              MinConfidence: minConfidence,
            },
          };
          const response = await rekognitionClient
            .detectProtectiveEquipment(ppeRequest)
            .promise();
          log.info(
            `Rekognition job for ${bucketName}/${imageName} returned ${JSON.stringify(
              response
            )}`
          );
          throwIfUndefined(response.Persons);
          return {
            persons: response.Persons.map(
              (person): DetectProtectiveEquipmentPersonInfo => {
                const personInfo: DetectProtectiveEquipmentPersonInfo = {
                  faceCovered: false,
                  headCovered: false,
                  leftHandCovered: false,
                  rightHandCovered: false,
                  exists: false,
                };
                throwIfUndefined(person.Confidence);
                if (person.Confidence <= 30) {
                  return personInfo;
                }
                personInfo.exists = true;
                throwIfUndefined(person.BodyParts);
                person.BodyParts.forEach(bodyPart => {
                  throwIfUndefined(bodyPart.Name);
                  throwIfUndefined(bodyPart.EquipmentDetections);
                  if (bodyPart.Name === 'FACE') {
                    personInfo.faceCovered =
                      bodyPart.EquipmentDetections.length > 0;
                  } else if (bodyPart.Name === 'HEAD') {
                    personInfo.headCovered =
                      bodyPart.EquipmentDetections.length > 0;
                  } else if (bodyPart.Name === 'HAND') {
                    personInfo.leftHandCovered = personInfo.rightHandCovered =
                      bodyPart.EquipmentDetections.length > 0;
                  }
                });
                return personInfo;
              }
            ),
          };
        },
        async (): Promise<DetectProtectiveEquipmentResult | null> => {
          return null;
        }
      );
    };
  }
}

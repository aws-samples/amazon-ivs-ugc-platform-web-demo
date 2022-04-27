import { aws_lambda_nodejs as lambda } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { getLambdaEntryPath } from '../utils';
import { UserManagementResourceConfig } from '../constants';

interface UserManagementCognitoTriggersProps
  extends UserManagementResourceConfig {}

export default class UserManagementCognitoTriggers extends Construct {
  public readonly customMessageLambda: lambda.NodejsFunction;
  public readonly preAuthenticationLambda: lambda.NodejsFunction;
  public readonly preSignUpLambda: lambda.NodejsFunction | undefined;

  constructor(
    scope: Construct,
    id: string,
    props: UserManagementCognitoTriggersProps
  ) {
    super(scope, id);

    const { logRetention, enableUserAutoVerify, userManagementClientBaseUrl } =
      props;

    // Default lambda parameters
    const defaultLambdaParams = {
      ...(logRetention ? { logRetention } : {}),
      bundling: { minify: true }
    };

    // Lambda to auto verify new users, not suitable for production
    let preSignUpLambda;

    if (enableUserAutoVerify) {
      preSignUpLambda = new lambda.NodejsFunction(this, 'PreSignUpLambda', {
        ...defaultLambdaParams,
        entry: getLambdaEntryPath('cognitoTriggers/preSignUp'),
        environment: { ENABLE_USER_AUTO_VERIFY: `${enableUserAutoVerify}` }
      });
    }

    this.preSignUpLambda = preSignUpLambda;

    const customMessageLambda = new lambda.NodejsFunction(
      this,
      'CustomMessageLambda',
      {
        ...defaultLambdaParams,
        entry: getLambdaEntryPath('cognitoTriggers/customMessage'),
        environment: {
          USER_MANAGEMENT_CLIENT_BASE_URL: userManagementClientBaseUrl
        }
      }
    );

    this.customMessageLambda = customMessageLambda;

    let preAuthenticationLambda = new lambda.NodejsFunction(
      this,
      'PreAuthenticationLambda',
      {
        ...defaultLambdaParams,
        entry: getLambdaEntryPath('cognitoTriggers/preAuthentication')
      }
    );

    this.preAuthenticationLambda = preAuthenticationLambda;
  }
}

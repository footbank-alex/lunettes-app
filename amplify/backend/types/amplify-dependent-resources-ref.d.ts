export type AmplifyDependentResourcesAttributes = {
    "auth": {
        "cognito704b3e59": {
            "IdentityPoolId": "string",
            "IdentityPoolName": "string",
            "UserPoolId": "string",
            "UserPoolName": "string",
            "AppClientIDWeb": "string",
            "AppClientID": "string",
            "AppClientSecret": "string"
        }
    },
    "function": {
        "lunettesRegister": {
            "Name": "string",
            "Arn": "string",
            "Region": "string",
            "LambdaExecutionRole": "string"
        },
        "lunettesEndpoints": {
            "Name": "string",
            "Arn": "string",
            "Region": "string",
            "LambdaExecutionRole": "string"
        }
    },
    "api": {
        "lunettes": {
            "RootUrl": "string",
            "ApiName": "string",
            "ApiId": "string"
        }
    }
}
// This file is used to override the REST API resources configuration
import {AmplifyApiRestResourceStackTemplate} from '@aws-amplify/cli-extensibility-helper';

const REQUEST_TEMPLATE = `
#set($allParams = $input.params())
{
    "body-json" : $input.json('$'),
    "params" : {
        #foreach($type in $allParams.keySet())
        #set($params = $allParams.get($type))
        "$type" : {
            #foreach($paramName in $params.keySet())
            "$paramName" : "$util.escapeJavaScript($params.get($paramName))"
                #if($foreach.hasNext),#end
            #end
        }
        #if($foreach.hasNext),#end
        #end
    },
    "stage-variables" : {
        #foreach($key in $stageVariables.keySet())
        "$key" : "$util.escapeJavaScript($stageVariables.get($key))"
            #if($foreach.hasNext),#end
        #end
    },
    "context" : {
        "account-id" : "$context.identity.accountId",
        "api-id" : "$context.apiId",
        "api-key" : "$context.identity.apiKey",
        "authorizer-principal-id" : "$context.authorizer.principalId",
        "caller" : "$context.identity.caller",
        "cognito-authentication-provider" : "$context.identity.cognitoAuthenticationProvider",
        "cognito-authentication-type" : "$context.identity.cognitoAuthenticationType",
        "cognito-identity-id" : "$context.identity.cognitoIdentityId",
        "cognito-identity-pool-id" : "$context.identity.cognitoIdentityPoolId",
        "http-method" : "$context.httpMethod",
        "stage" : "$context.stage",
        "source-ip" : "$context.identity.sourceIp",
        "user" : "$context.identity.user",
        "user-agent" : "$context.identity.userAgent",
        "user-arn" : "$context.identity.userArn",
        "request-id" : "$context.requestId",
        "resource-id" : "$context.resourceId",
        "resource-path" : "$context.resourcePath"
    },
    "queryStringParameters": {
        #foreach( $token in $input.path('$').split('&') )
            #set( $keyVal = $token.split('=') )
            #set( $keyValSize = $keyVal.size() )
            #if( $keyValSize >= 1 )
                #set( $key = $util.urlDecode($keyVal[0]) )
                #if( $keyValSize >= 2 )
                    #set( $val = $util.urlDecode($keyVal[1]) )
                #else
                    #set( $val = '' )
                #end
                "$key": "$val"#if($foreach.hasNext),#end
            #end
        #end
    }
}`

export function override(resources: AmplifyApiRestResourceStackTemplate) {
    delete resources.restApi.body.paths['/lunettes/register/{proxy+}'];
    let path = resources.restApi.body.paths['/lunettes/register'];
    path.post = path['x-amazon-apigateway-any-method'];
    delete path['x-amazon-apigateway-any-method'];
    path.post.consumes = ['application/x-www-form-urlencoded'];
    path.post['x-amazon-apigateway-integration'].type = 'aws';
    path.post['x-amazon-apigateway-integration'].requestTemplates = {
        "application/x-www-form-urlencoded": REQUEST_TEMPLATE
    };
}

import * as React from "react"

const Error = (props: [string: any]) => (
    <div>
        {Object.entries(props).map(([err, val]) => (
            <pre>
        <strong>{err}: </strong>
                {JSON.stringify(val)}
                <br/>
        <a href="https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-attributes.html">
          AWS Cognito User Pool documentation.
        </a>
      </pre>
        ))}
    </div>
);

export default Error;

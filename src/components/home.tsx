import * as React from "react"
import {Link} from "gatsby";
import {RouteComponentProps} from "@reach/router";

const Home = (_: RouteComponentProps) => (
    <div>
        <h1>Home</h1>
        <p>
            You are now logged in! <Link to="/app/profile">View profile</Link>
        </p>
        <p>
            Now go build something great and deploy it using the{" "}
            <a href="https://console.amplify.aws">AWS Amplify Console</a>
        </p>
    </div>
);

export default Home;

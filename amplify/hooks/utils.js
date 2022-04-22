const fs = require('fs');
const {execSync} = require("child_process");

exports.executeAmplifyScripts = () => {
    try {
        const parameters = JSON.parse(fs.readFileSync(0, {encoding: 'utf8'}));
        const path = parameters.data.amplify.environment.projectPath;
        execSync("npm-run-all --parallel amplify:*", {cwd: path});
    } catch (err) {
        console.log(err);
    }
}
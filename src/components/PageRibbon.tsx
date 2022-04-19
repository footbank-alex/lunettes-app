import * as React from "react";
import {View} from "@aws-amplify/ui-react";

interface PageRibbonProps {
    env: string
}

export default ({env}: PageRibbonProps) =>
    (
        <View className="ribbon">
            <a href="">{env}</a>
        </View>

    );

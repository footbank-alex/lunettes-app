import * as React from "react";
import {Text} from "@aws-amplify/ui-react";
import {TextProps} from "@aws-amplify/ui-react/dist/types/primitives/types";

export default (props: TextProps) =>
    <Text fontSize="0.5rem" {...props}>Copyright &copy; 2022 Footbank Systems All Rights Reserved.</Text>;

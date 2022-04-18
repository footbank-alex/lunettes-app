import * as React from "react";
import {ReactNode} from "react";
import {Card, View} from "@aws-amplify/ui-react";
import {node} from "prop-types";

interface ModalProps {
    children: ReactNode
}

const Modal = ({children}: ModalProps) =>
    (
        <View className="modal">
            <Card variation="outlined" className="modal-content">
                {children}
            </Card>
        </View>
    );

Modal.propTypes = {
    children: node.isRequired,
};

export default Modal;

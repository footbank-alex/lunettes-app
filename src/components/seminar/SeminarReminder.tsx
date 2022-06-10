import * as React from "react"
import {Button, ButtonGroup, Card, Flex, Icon, Text, useTheme} from "@aws-amplify/ui-react";
import {MdDelete, MdEdit} from "react-icons/md";
import {PortalWithState} from "react-portal";
import {getPortalNode} from "../../utils/portal";
import {Endpoint} from "../../api/endpoint";
import {useI18next} from "gatsby-plugin-react-i18next";
import UpdateReminderModal from "./UpdateReminderModal";
import DeleteReminderModal from "./DeleteReminderModal";

interface SeminarReminderProps {
    index: number;
    endpoint: Endpoint;
    onUpdate: () => void;
}

export default ({index, endpoint, onUpdate}: SeminarReminderProps) => {
    const {tokens} = useTheme();
    const {t} = useI18next();

    return <Card key={index}
                 backgroundColor={index % 2 == 0 ? tokens.colors.background.secondary : undefined}
                 padding="0.5rem">
        <Flex justifyContent="space-between" alignItems="center">
            <Text>{endpoint.toString(t)}</Text>
            <ButtonGroup>
                <PortalWithState node={getPortalNode()} closeOnEsc>
                    {({openPortal, closePortal, portal}) => (
                        <>
                            <Button onClick={openPortal} backgroundColor={tokens.colors.background.info}>
                                <Icon ariaLabel="Update" as={MdEdit}/> {t('update.text')}
                            </Button>
                            {portal(
                                <UpdateReminderModal endpoint={endpoint} close={closePortal} onUpdate={onUpdate}/>
                            )}
                        </>
                    )}
                </PortalWithState>
                <PortalWithState node={getPortalNode()} closeOnEsc>
                    {({openPortal, closePortal, portal}) => (
                        <>
                            <Button onClick={openPortal}
                                    backgroundColor={tokens.colors.background.error}>
                                <Icon ariaLabel="Delete" as={MdDelete}/> {t('delete.text')}
                            </Button>
                            {portal(
                                <DeleteReminderModal endpoint={endpoint} close={closePortal} onDelete={onUpdate}/>
                            )}
                        </>
                    )}
                </PortalWithState>
            </ButtonGroup>
        </Flex>
    </Card>;
}
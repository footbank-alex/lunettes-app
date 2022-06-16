import * as React from "react"
import {Button, ButtonGroup, Collection, Flex, Icon, Text, useTheme} from "@aws-amplify/ui-react";
import {MdDelete, MdEdit} from "react-icons/md";
import {PortalWithState} from "react-portal";
import {getPortalNode} from "../../utils/portal";
import {useI18next} from "gatsby-plugin-react-i18next";
import UpdateReminderModal from "./UpdateReminderModal";
import DeleteReminderModal from "./DeleteReminderModal";
import {Seminar} from "../../api/seminar";
import {itemHasText} from "../../utils/search";

interface SeminarRemindersProps {
    seminars: Seminar[];
    onUpdate: () => void;
}

export default ({seminars, onUpdate}: SeminarRemindersProps) => {
    const {tokens} = useTheme();
    const {t} = useI18next();

    return <Collection type="grid" templateColumns="repeat(3, auto)" autoRows="max-content" items={seminars}
                       isPaginated itemsPerPage={20} gap={0}
                       isSearchable
                       searchFilter={(item, searchText) => itemHasText((item as Seminar).toString(t), searchText)}
                       searchPlaceholder={t('search.result.search.placeholder')}>
        {(item, index) => {
            const backgroundColor = index % 2 == 0 ? tokens.colors.background.secondary : undefined;
            const props = {backgroundColor, alignItems: "center", padding: "0.5rem"};
            return (
                <>
                    <Flex {...props}><Text>{item.itemName}</Text></Flex>
                    <Flex {...props}><Text>{item.dateTimeString(t)}</Text></Flex>
                    <Flex {...props} justifyContent="end">
                        <ButtonGroup>
                            <PortalWithState node={getPortalNode()} closeOnEsc>
                                {({openPortal, closePortal, portal}) => (
                                    <>
                                        <Button onClick={openPortal} backgroundColor={tokens.colors.background.info}>
                                            <Icon ariaLabel="Update" as={MdEdit}/> {t('update.text')}
                                        </Button>
                                        {portal(
                                            <UpdateReminderModal seminar={item} close={closePortal}
                                                                 onUpdate={onUpdate}/>
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
                                            <DeleteReminderModal seminar={item} close={closePortal}
                                                                 onDelete={onUpdate}/>
                                        )}
                                    </>
                                )}
                            </PortalWithState>
                        </ButtonGroup>
                    </Flex>
                </>
            );
        }}
    </Collection>
}
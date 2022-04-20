import * as React from "react"
import {ColorMode, ToggleButton, ToggleButtonGroup, VisuallyHidden} from "@aws-amplify/ui-react";
import {MdBedtime, MdTonality, MdWbSunny} from "react-icons/md";

interface ColorModeSwitcherProps {
    colorMode: ColorMode;
    setColorMode: (value: ColorMode) => void;
}

export default ({colorMode, setColorMode}: ColorModeSwitcherProps) => {
    return (
        <ToggleButtonGroup
            value={colorMode}
            size="small"
            onChange={(value) => setColorMode(value as ColorMode)}
            isExclusive
            isSelectionRequired
            className="color-switcher"
        >
            <ToggleButton value="light">
                <VisuallyHidden>Light mode</VisuallyHidden>
                <MdWbSunny/>
            </ToggleButton>
            <ToggleButton value="dark">
                <VisuallyHidden>Dark mode</VisuallyHidden>
                <MdBedtime/>
            </ToggleButton>
            <ToggleButton value="system">
                <VisuallyHidden>System preference</VisuallyHidden>
                <MdTonality/>
            </ToggleButton>
        </ToggleButtonGroup>
    );
};
/** @typedef {{
 *   close: function(): Promise<void>,
 *   activate: function(module: number | string): void
 * }} BrainSimuSession
 */

import {getBehaviorEventGenerator, setLevelEvent} from "./brain_events.js";
import {delay} from "./global.js";

/** @typedef {{
 *   onEvent: function(SendableEvent): void
 * }} BrainSimuConfig
 */

function workingRegionTick(index, nowWorkLoad) {
    let value = Math.round((100 - nowWorkLoad) * 0.2);
    return value;
}

function relaxingRegionTick(index, nowWorkLoad) {
    let value = Math.round((nowWorkLoad) * 0.05);
    return 0 - value;
}

/**
 * @param {BrainSimuConfig} config
 * @return {BrainSimuSession}
 */
function createSession(config) {

    let brainWorkLevel = [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ];

    let workingBrainRegions = [];

    let stopFlag = false;

    const close = () => {
        stopFlag = true;
        return sessionPromise;
    };

    const activate = (module) => {
        workingBrainRegions = getBehaviorEventGenerator(module);
    };

    const sessionPromise = (async () => {
        while (!stopFlag) {
            await delay(50);
            for (let i = 1; i <= 14; ++i) {
                if (workingBrainRegions.includes(i)) {
                    brainWorkLevel[i] += workingRegionTick(i, brainWorkLevel[i]);
                } else {
                    brainWorkLevel[i] += relaxingRegionTick(i, brainWorkLevel[i]);
                }
                config.onEvent(setLevelEvent(i, brainWorkLevel[i]));
            }
        }
    })();

    return {
        close,
        activate
    }
}

export {createSession}
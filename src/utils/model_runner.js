import {delay} from "./global.js";
import {getTrunkType} from "./models.js";

/**
 * @param {TrunkType} trunktype
 * @param {number} activeTime
 * @param {number} startTime
 * @param {string | undefined} displayContent
 * @param {boolean} hideActiveTime
 * @param {number} viewSleepTime
 * @return {{
 *     tmr: number
 *     trunktype: string
 *     activetime: number
 *     display_content?: string
 *     hide_activetime: boolean
 *     view_sleep_time: number
 * }}
 */
function knowledgeRetrieve(trunktype, activeTime, startTime, displayContent = undefined, hideActiveTime = false, viewSleepTime = 0) {
    activeTime += (Math.random() * 100 - 50) / 1000;
    const tmr = Date.now() - startTime;
    return {
        tmr,
        trunktype: trunktype.name,
        activetime: activeTime,
        display_content: displayContent,
        hide_activetime: hideActiveTime,
        view_sleep_time: viewSleepTime
    }
}


/**
 * @typedef {{
 *     cogcycle: number,
 *     timescale: number,
 *     mbtime: function(trunkType: TrunkType): number,
 *     mweight: function(trunkType: TrunkType): number
 * }} SimulatorParameters
 */


/**
 * @param {CognitiveModel} cognitiveModel
 * @param {function({event: string, value: any}): void} onEvent
 * @param {SimulatorParameters} parameters
 * @param {function(ms: number): number} timeScale
 */
async function createSession(
    cognitiveModel,
    onEvent,
    parameters,
    timeScale
) {

    const startTime = Date.now();

    for (const pk in cognitiveModel.production) {

        for (const c in pk.condition) {
            const trunktype = c.cknowledge.trunktype;
            const activeTime = parameters.mbtime(trunktype);
            const waitTime = timeScale(activeTime);
            onEvent({
                event: "MODULE_ACTION",
                value: knowledgeRetrieve(trunktype, activeTime, startTime, c.cknowledge.title, false, waitTime)
            });

            await delay(waitTime);
        }

        for (const o in pk.outcome) {
            const trunktype = o.cknowledge.trunktype;
            const activeTime = parameters.mbtime(trunktype);
            const waitTime = timeScale(activeTime);
            onEvent({
                event: "MODULE_ACTION",
                value: knowledgeRetrieve(trunktype, activeTime, startTime, o.cknowledge.title, false, waitTime)
            });

            await delay(waitTime);
        }

        const trunktype = getTrunkType("P");
        const activeTime = pk.activetime;
        const waitTime = timeScale(activeTime);
        onEvent({
            event: "MODULE_ACTION",
            value: knowledgeRetrieve(trunktype, activeTime, startTime, undefined, false, waitTime)
        });

        await delay(waitTime);
    }

}
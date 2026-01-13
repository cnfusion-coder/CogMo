import {getTrunkType} from "./models.js";
import {baseServer} from "../plugins/axios.js";

/**
 * @typedef {{
 *     id: number,
 *     username: string
 * }} Creator
 */

/**
 * @typedef {{
 *   created_at: string,
 *   creator: Creator,
 *   description: string,
 *   id: number,
 *   title: string
 * }} ReactorModel
 */

/**
 * @typedef {{
 *    created_at: string,
 *    creator: Creator,
 *    description: string,
 *    id: number,
 *    reactormodel: ReactorModel,
 *    title: string
 * }} Task
 */

/**
 * @typedef {{
 *     created_at: string,
 *     creator: Creator,
 *     desciption: string,
 *     id: number,
 *     purview: number,
 *     task: Task,
 *     title: string,
 *     trunktype: string
 * }} API_DKnowledge
 */

/**
 * @typedef {{
 *     created_at: string,
 *     creator: Creator,
 *     desciption: string,
 *     id: number,
 *     purview: number,
 *     task: Task,
 *     title: string,
 *     trunktype: TrunkType
 * }} DKnowledge
 */

/**
 * @param {API_DKnowledge} target
 * @return {DKnowledge}
 */
function toDKnowledge(target) {
    return Object.assign({}, target, {trunktype: getTrunkType(target.trunktype)});
}

/**
 * @typedef {{
 *     cknowledge: API_DKnowledge,
 *     created_at: string,
 *     creator: Creator,
 *     currentStatusVariable: StatusVariable,
 *     id: number,
 *     operation: any,
 *     prefixmark: any,
 *     purview: number,
 *     suffixmark: any,
 *     task: Task
 * }} API_PCondition
 */

/**
 * @typedef {{
 *     cknowledge: DKnowledge,
 *     created_at: string,
 *     creator: Creator,
 *     currentStatusVariable: StatusVariable,
 *     id: number,
 *     operation: any,
 *     prefixmark: any,
 *     purview: number,
 *     suffixmark: any,
 *     task: Task
 * }} PCondition
 */

/**
 * @param {API_PCondition} target
 * @return {PCondition}
 */
function toPCondition(target) {
    return Object.assign({}, target, {
        cknowledge: toDKnowledge(target.cknowledge)
    });
}

/**
 * @typedef {{
 *     created_at: string,
 *     creator: Creator,
 *     currentStatusVairable: StatusVariable,
 *     id: number,
 *     oknowledge: API_DKnowledge,
 *     opertion: any,
 *     prefixmark: any,
 *     purview: number,
 *     suffixmark: any,
 *     task: Task
 * }} API_POutcome
 */

/**
 * @typedef {{
 *     created_at: string,
 *     creator: Creator,
 *     currentStatusVairable: StatusVariable,
 *     id: number,
 *     oknowledge: DKnowledge,
 *     opertion: any,
 *     prefixmark: any,
 *     purview: number,
 *     suffixmark: any,
 *     task: Task
 * }} POutcome
 */

/**
 * @param {API_POutcome} target
 * @return {POutcome}
 */
function toPOutcome(target) {
    return Object.assign({}, target, {
        oknowledge: toDKnowledge(target.oknowledge)
    });
}

/**
 * @typedef {{
 *     activetime: number,
 *     condition: API_PCondition[],
 *     created_at: string,
 *     creator: Creator,
 *     id: number,
 *     order: number,
 *     outcome: API_POutcome[],
 *     purview: number
 * }} API_PKnowledge
 */

/**
 * @typedef {{
 *     activetime: number,
 *     condition: PCondition[],
 *     created_at: string,
 *     creator: Creator,
 *     id: number,
 *     order: number,
 *     outcome: POutcome[],
 *     purview: number
 * }} PKnowledge
 */

/**
 * @param {API_PKnowledge} target
 * @return {PKnowledge}
 */
function toPKnowledge(target) {
    return Object.assign({}, target, {
        condition: target.condition.map(toPCondition),
        outcome: target.outcome.map(toPOutcome)
    });
}

/**
 * @typedef {{
 *     created_at: string,
 *     creator: Creator,
 *     description: string,
 *     id: number,
 *     name: string,
 *     status: string,
 *     task: Task
 * }} InitStatus
 */

/**
 * @typedef {{
 *     created_at: string,
 *     creator: Creator,
 *     description: string,
 *     id: number,
 *     name: string,
 *     task: Task,
 *     values: string
 * }} StatusVariable
 */


/**
 * @typedef {{
 *     author: string,
 *     created_at: string,
 *     description: string,
 *     creator: number,
 *     id: number,
 *     initstatus: InitStatus[],
 *     name: string,
 *     production: API_PKnowledge[],
 *     purview: number,
 *     statusvariable: StatusVariable[],
 *     task: Task,
 * }} API_CognitiveModel
 */

/**
 * @typedef {{
 *     author: string,
 *     created_at: string,
 *     description: string,
 *     creator: number,
 *     id: number,
 *     initstatus: InitStatus[],
 *     name: string,
 *     production: PKnowledge[],
 *     purview: number,
 *     statusvariable: StatusVariable[],
 *     task: Task,
 * }} CognitiveModel
 */

/**
 * @param {API_CognitiveModel} target
 * @return {CognitiveModel}
 */
function toCognitiveModel(target) {
    return Object.assign({}, target, {
        production: target.production.map(toPKnowledge).filter(item => item.condition.length > 0 && item.outcome.length > 0),
    });
}

/**
 * @template T
 * @typedef {{
 *     get(hard: boolean = false): Promise<T>
 * }} LazyItem
 */

/**
 * @template T
 * @param {string} url
 * @param {T} defaultValue
 * @param {(function(responseData: any): T) | undefined} middleware
 * @return {LazyItem<T>}
 */
function lazyItem(url, defaultValue = null, middleware = undefined) {

    let value = defaultValue;
    let available = false;
    let promiseInstance = null;

    function get(hard = false) {

        if (hard) {
            promiseInstance = null;
            available = false;
        }

        if (!promiseInstance) {
            promiseInstance = new Promise((resolve, reject) => {
                if (available) {
                    resolve(value);
                    return;
                }

                baseServer.get(url)
                    .then(response => {
                        value = middleware ? middleware(response.data) : response.data;
                        available = true;
                        resolve(value);
                    })
                    .catch(err => {
                        promiseInstance = null;
                        reject(err);
                    });
            });
        }

        return promiseInstance;
    }

    return {get};
}

/**
 * @type {LazyItem<ReactorModel[]>}
 */
export const REACTOR_MODEL = lazyItem('/api/coper/reactormodel/', []);

/**
 * @type {LazyItem<Task[]>}
 */
export const TASK = lazyItem('/api/coper/task/', []);

/**
 * @type {LazyItem<DKnowledge[]>}
 */
export const D_KNOWLEDGE = lazyItem('/api/coper/dk/', [],
    /**
     * @param {API_DKnowledge[]} resData
     * @return {DKnowledge[]}
     */
    function (resData) {
        return resData.map(toDKnowledge);
    }
);

/**
 * @type {LazyItem<PCondition[]>}
 */
export const P_CONDITION = lazyItem('/api/coper/pcon/', [],
    /**
     * @param {API_PCondition[]} resData
     * @return {PCondition[]}
     */
    function (resData) {
        return resData.map(toPCondition)
    }
);

/**
 * @type {LazyItem<POutcome[]>}
 */
export const P_OUTCOME = lazyItem('/api/coper/pout/', [],
    /**
     * @param {API_POutcome[]} resData
     * @return {POutcome[]}
     */
    function (resData) {
        return resData.map(toPOutcome)
    }
);

/**
 * @type {LazyItem<PKnowledge[]>}
 */
export const P_KNOWLEDGE = lazyItem('/api/coper/pknow/', [],
    /**
     * @param {API_PKnowledge[]} resData
     * @return {PKnowledge[]}
     */
    function (resData) {
        return resData.map(toPKnowledge).filter(item => item.condition.length > 0 && item.outcome.length > 0)
    }
);

/**
 * @type {LazyItem<CognitiveModel[]>}
 */
export const COGNITIVE_MODEL = lazyItem('/api/coper/cm/', [],
    /**
     * @param {API_CognitiveModel[]} resData
     * @returns {CognitiveModel[]}
     */
    function (resData) {
        return resData.map(toCognitiveModel);
    }
);

/**
 * @type {LazyItem<InitStatus[]>}
 */
export const INIT_STATUS = lazyItem('/api/coper/initstatus/', []);

/**
 * @type {LazyItem<StatusVariable[]>}
 */
export const STATUS_VARIABLE = lazyItem('/api/coper/statusvar/', []);

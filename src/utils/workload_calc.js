/**
 * @typedef {{
 *     tmr: number,
 *     trunktype: string,
 *     activetime: number,
 *     display_content: string?,
 *     hide_activetime: boolean,
 *     view_sleep_time: number
 * }} SimulateEvent
 */

/**
 * @typedef {{tmr: number, workloadSum: number, trunktype: string}} TotalWorkloadPoint
 */

/**
 * @typedef {{tmr: number, workload: number, trunktype: string}} HeatPoint
 */

/**
 * @typedef {{
 *     twRiseArray: TotalWorkloadPoint[],
 *     wHeatLevelArray: HeatPoint[],
 *     trunkActivetimeTotal: Object.<string, number>,
 *     trunkWorkloadTotal: Object.<string, number>,
 *     activetimeTotal: number,
 *     workloadTotal: number
 * }} SimulateCalculateResult
 */

/**
 * @param {function(event: SimulateEvent): number} getWeight
 * @param {Object.<string, string>} trunktypeMapper
 * @return {{calculate: function(SimulateEvent[]): SimulateCalculateResult}}
 */
export function createCalculator(getWeight, trunktypeMapper) {
    let workloadSum = 0; // 总脑力负荷
    let trunkActivetimeTotal = {"G": 0, "D": 0, "P": 0, "I": 0, "M": 0, "V": 0, "S": 0, "A": 0}; // 模块活跃时间
    let trunkWorkloadTotal = {"G": 0, "D": 0, "P": 0, "I": 0, "M": 0, "V": 0, "S": 0, "A": 0}; // 模块活跃时间
    let activetimeTotal = 0;
    const sumLoop = (e) => {
        // 认知事件循环
        const trunk = trunktypeMapper[e.trunktype];

        if (trunk) {
            const deltaW = getWeight(e) * (Math.exp(e.activetime / 1000) - 1 + Math.log(trunkActivetimeTotal[trunk] / 1000 + 1));
            workloadSum += deltaW;
            trunkWorkloadTotal[trunk] += deltaW;
            trunkActivetimeTotal[trunk] += e.activetime;
        }

        activetimeTotal += e.activetime;

        return {tmr: e.tmr, workloadSum, trunktype: e.trunktype};
    }
    const heatLoop = (e) => ({tmr: e.tmr, workload: getWeight(e), trunktype: e.trunktype});

    let result = null;

    /**
     * @param {SimulateEvent[]} eventData
     * @return {SimulateCalculateResult}
     */
    function calculate(eventData) {
        if (result) return result;
        result = {
            twRiseArray: eventData.map(sumLoop),
            wHeatLevelArray: eventData.map(heatLoop),
            trunkActivetimeTotal,
            trunkWorkloadTotal,
            activetimeTotal,
            workloadTotal: workloadSum,
        };
        console.log(JSON.stringify(result));
        return result;
    }

    return {calculate}
}
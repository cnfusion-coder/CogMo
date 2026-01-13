import {TASK} from "./lazyapi.js";


function round(e, prefix = "") {
    return String(Math.round(e * 100) / 100) + prefix;
}

/**
 * @param {string} taskName
 * @param {string} evaluationPurpose
 * @param {string} conditionDescription
 * @param {SimulateCalculateResult} calculationResult
 * @param {number} simulateDate
 * @param {WorkloadReportData | undefined} standardModel
 * @return {WorkloadReportData}
 */
export async function parseWorkloadData(taskName,  evaluationPurpose, conditionDescription,calculationResult, simulateDate, standardModel = undefined) {
    const targetTask = (await TASK.get()).filter(value => (value.title === taskName));
    let description = "";
    if (targetTask.length === 1) {
        description = targetTask[0].description;
    }
    return {
        simulate_date: simulateDate,
        task: {
            name: taskName,
            description,
            evaluationPurpose
        },
        workload: {
            trunk_active_times: Object
                .entries(calculationResult.trunkActivetimeTotal)
                .filter(e => e[1] !== 0)
                .map(([trunk, activetime]) => `${trunk}: ${round(activetime, "ms")}`)
                .join(", "),
            total_active_times: {
                data: round(calculationResult.activetimeTotal, "ms"),
                reference_value: standardModel ? standardModel.workload.total_active_times.data : "无"
            },
            trunk_workload: Object
                .entries(calculationResult.trunkWorkloadTotal)
                .filter(e => e[1] !== 0)
                .map(([trunk, workload]) => `${trunk}: ${round(workload)}`)
                .join(", "),
            total_workload: {
                data: round(calculationResult.workloadTotal),
                reference_value: standardModel ? standardModel.workload.total_workload.data : "无"
            },
            condition_description: conditionDescription,
            performance_chart: calculationResult.wHeatLevelArray
        }
    }
}
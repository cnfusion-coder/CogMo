<script setup>
import {computed, reactive, ref} from "vue";
import {documentIcon, logIcon, machineIcon, refreshIcon, successIcon} from "../assets/icons.js";
import ConnectionHint from "../components/ConnectionHint.vue";
import simu_connector from "../utils/simu_connector.js";
import PdfReport from "./layouts/PdfReport.vue";
import BrainView from "../components/BrainView.vue";
import {dateFormat, delay, mapToArray} from "../utils/global.js";
import Loading from "../components/utils/Loading.vue";
import SimulateResults from "./layouts/SimulateResults.vue";
import {createCalculator} from "../utils/workload_calc.js";
import {useReportSaveStore} from "../plugins/store.js";
import {parseWorkloadData} from "../utils/report_data_parser.js";
import {ElMessage} from "element-plus";

const reportSaveStore = useReportSaveStore();

const taskList = ref([]);

/**
 * @typedef {{
 *     tmr: number,
 *     trunktype: string,
 *     activetime: number,
 *     display_content: string | null,
 *     hide_activetime: boolean,
 *     view_sleep_time: number
 * }} SimulateEvent
 */

/**
 * @type {{value: {
 *   name: string,
 *   version: string,
 *   creator: string,
 *   release_time: string,
 *   paradigm: string
 * } | null}}
 */
const simulatorInfo = ref(null);

const simulatorParameters = ref(null);

const activationModule = ref(null);

const simulatorResults = ref(null);

const brainView = ref();
const connectionStatus = ref(0);
const connectionPanel = ref(false);

const hostInput = ref("");
const portInput = ref("");

/**
 * @type {{value: SimulateEvent | null}}
 */
const realtimeOutput = ref(null);

/**
 * @type {{value: SimulateEvent[]}}
 */
const processValues = ref([]);

let connectSession = null;

/**
 * 0 not open
 * 1 opening
 * 2 open done
 */
const modelOpenedStatus = ref(0);
const taskSelection = ref(null);
const se = (content, loading) => ({content, loading});
const SimulatorStatusEnum = [
  se("就绪", false),
  se("正在刷新认知模型库", true),
  se("正在等待用户选择认知任务", false),
  se("正在读取认知任务知识列表", true),
  se("认知任务知识准备就绪", false),
  se("正在读取仿真参数", true),
  se("仿真已就绪： #1", false),
  se("等待加载脑区仿真视图", true),
  se("正在仿真任务认知过程： #1 ，负荷监视程序已启动", true),
  se("等待负荷监视程序处理仿真结果", false),
  se("等待负荷监视程序处理仿真结果", true),
  se("仿真已结束，结果已收集", false)
];

const simulatorStatus = ref(0);

const simulatorStatusText = computed(() => {
  const res = SimulatorStatusEnum[simulatorStatus.value];
  res.content.replace("#1", taskSelection.value);
  return res;
});

/**
 * @param {SimulateEvent} event
 * @return {number}
 */
function getWeight(event) {
  if (simulatorParameters.value) {
    const res = simulatorParameters.value.mweight[trunktypeMapper[event.trunktype]];
    if (typeof res == "number")
      return res;
  }
  return 0;
}

const trunktypeMapper = {
  "G": "G",
  "D": "D",
  "P": "P",
  "I": "I",
  "M": "M",
  "V": "V",
  "S": "S",
  "A": "A",
  "GOAL": "G",
  "DECLARATIVE": "D",
  "PROCEDURAL": "P",
  "IMAGINE": "I",
  "MOTOR": "M",
  "VISION": "V",
  "SPEECH": "S",
  "AURAL": "A",
}


function resetSimulatorValues() {
  simulatorStatus.value = 0;
  step.value = 0;
  taskSelection.value = null;
  simulatorInfo.value = null;
  simulatorParameters.value = null;
  activationModule.value = null;
  realtimeOutput.value = null;
  modelOpenedStatus.value = 0;
  simulatorResults.value = null;
  processValues.value = [];
  taskList.value = [];
  if (brainView.value) {
    brainView.value.emitStop();
  }
}

const eventHandlers = {
  "HANDSHAKE": (data) => {
    simulatorInfo.value = data;
  },
  "MODEL_LIST": (data) => {
    /**
     * @type {{values?: string[]}}
     */
    const dataValue = data;
    if (Array.isArray(dataValue.values)) {
      taskList.value = dataValue.values;
    }
    simulatorStatus.value = 2;
  },
  "OPEN_MODEL_DONE": () => {
    modelOpenedStatus.value = 2;
    simulatorStatus.value = 4;
  },
  "RUN_MODEL_RESULT": (data) => {
    simulatorResults.value = data;
    const calculator = createCalculator(getWeight, trunktypeMapper);

    otherSaveMaterials.title = taskSelection.value;
    otherSaveMaterials.simulateDate = Date.now();
    workloadCalculateResult.value = calculator.calculate(processValues.value);
    savedFlag.value = false;
  },
  "RUN_MODEL_DONE": () => {
    simulatorStatus.value = 9;
    toProcessResultStep();
  },
  "MODULE_ACTION": (data) => {
    /**
     * @type {{
     *   tmr: number,
     *   trunktype: string,
     *   activetime: number,
     *   display_content: string?,
     *   hide_activetime: boolean,
     *   view_sleep_time: number
     * }}
     */
    const dataValue = data;
    realtimeOutput.value = dataValue;
    processValues.value.push(dataValue);
    brainView.value.emitActivate(dataValue.trunktype);
  },
  "PARAMETER": (data) => {
    simulatorParameters.value = data;
    simulatorStatus.value = 6;
  }
};

const simulatorParametersView = computed(() => {
  const data = simulatorParameters.value;
  if (!data) return null;
  return {
    base: mapToArray({
      "cogcycle": data.cogcycle,
      "timescale": data.timescale,
    }, {
      "cogcycle": "认知周期 (ms)",
      "timescale": "时间缩放因子",
    }),
    mbtime: mapToArray(data.mbtime, {
      "G": "GOAL 活动基础时间 (ms)",
      "D": "DECLARATIVE 活动基础时间 (ms)",
      "P": "PROCEDURAL 活动基础时间 (ms)",
      "I": "IMAGINE 活动基础时间 (ms)",
      "M": "MOTOR 活动基础时间 (ms)",
      "V": "VISION 活动基础时间 (ms)",
      "S": "SPEECH 活动基础时间 (ms)",
      "A": "AURAL 活动基础时间 (ms)",
    }),
    mweight: mapToArray(data.mweight, {
      "G": "GOAL 负荷权重",
      "D": "DECLARATIVE 负荷权重",
      "P": "PROCEDURAL 负荷权重",
      "I": "IMAGINE 负荷权重",
      "M": "MOTOR 负荷权重",
      "V": "VISION 负荷权重",
      "S": "SPEECH 负荷权重",
      "A": "AURAL 负荷权重",
    })
  };
});

const modelSelectPlaceholder = computed(() => {
  return simulatorStatus.value === 1 ? "正在等待远程仿真机加载任务列表" : "请选择任务"
});

const step = ref(0);

function toStartConnect() {
  if (connectSession) return;

  const host = hostInput.value ? hostInput.value : "localhost";
  const port = portInput.value ? Number(portInput.value) : 7642;

  connectSession = simu_connector({
    eventHandlers,
    onClose() {
      connectSession = null;
      connectionStatus.value = 0;
      connectionDestruction();
    },
    onStartConnect() {
      connectionStatus.value = 1;
    },
    onOpen() {
      connectionStatus.value = 2;
      connectionInit();
    },
  }, host, port);
}

function toCloseConnect() {
  if (connectSession) {
    connectSession.emitClose();
  }
}

function connectionInit() {
  resetSimulatorValues();
  freshModelList();
}

function freshModelList() {
  simulatorStatus.value = 1;
  connectSession.emitBroadcast("REFRESH_MODEL_LIST");
}

function connectionDestruction() {
  resetSimulatorValues();
}

function selectModel() {
  simulatorStatus.value = 3;
  connectSession.emitBroadcast("OPEN_MODEL", {name: taskSelection.value});
  modelOpenedStatus.value = 1;
}

function toConfirmParameterStep() {
  step.value = 1;
  simulatorStatus.value = 5;
  (async () => {
    await delay(500); // 读取数据
    connectSession.emitBroadcast("GET_PARAMETER");
  })();
}

function toRunModelStep() {
  step.value = 2;
  simulatorStatus.value = 7;
  (async () => {
    await delay(8000);
    if (brainView.value) {
      simulatorStatus.value = 8;
      connectSession.emitBroadcast("RUN_MODEL");
      brainView.value.emitBegin();
    }
  })();
}

function toProcessResultStep() {
  step.value = 3;
}

// region 保存模块

const saveReportDialog = ref(false);

const reportModels = computed(() => reportSaveStore.reports);

const workloadCalculateResult = ref(null);
const otherSaveMaterials = reactive({
  title: "",
  simulateDate: 0
});
const savedFlag = ref(false);

const simulateResultSavable = computed(() => Boolean(workloadCalculateResult.value) && !(savedFlag.value));

const supplementInfo = reactive({
  saveName: "",
  evaluationPurpose: "",
  conditionDescription: "",
  standardModelSelection: undefined
});

const saving = ref(false);

function toSave() {
  saving.value = true;
  new Promise(async () => {
    const workloadReportData = await parseWorkloadData(
        otherSaveMaterials.title,
        supplementInfo.evaluationPurpose,
        supplementInfo.conditionDescription,
        workloadCalculateResult.value,
        otherSaveMaterials.simulateDate,
        supplementInfo.standardModelSelection ? reportSaveStore.get(supplementInfo.standardModelSelection).data : undefined
    );
    reportSaveStore.save(workloadReportData, supplementInfo.saveName);
    ElMessage({
      message: '已保存！',
      type: 'success',
    });
    savedFlag.value = true;
    saving.value = false;
    saveReportDialog.value = false;
  });
}

// endregion

</script>

<template>
  <div style="width: 100%; display: flex; flex-direction: column">
    <div style="width: 100%; display: flex; justify-content: space-between">
      <div class="machine-status" @click.prevent="connectionPanel = true">
        <el-icon v-html="machineIcon.template"/>
        <div>远程仿真机状态</div>
        <ConnectionHint :status="connectionStatus"/>
        <div style="display: flex; align-items: center; gap: 12px; font-size: small" v-if="simulatorInfo">
          <div>
            {{ simulatorInfo.name }} {{ simulatorInfo.version }}
          </div>
          <el-tag>
            {{ simulatorInfo.paradigm }}
          </el-tag>
        </div>
      </div>
      <div class="machine-status" v-if="connectionStatus === 2">
        <Loading v-if="simulatorStatusText.loading"/>
        <el-icon v-else v-html="successIcon.template" size="20px"/>
        <div>{{ simulatorStatusText.content }}</div>
      </div>
    </div>
    <el-tabs>
      <el-tab-pane label="认知模型仿真">
        <div
            v-if="connectionStatus === 2"

            style="width: 100%; display: flex; flex-direction: column; align-items: center; gap: 12px">
          <el-steps
              style="width: 800px"
              :space="400"
              :active="step"
              finish-status="success">
            <el-step title="认知任务模型选择"/>
            <el-step title="仿真机参数确认"/>
            <el-step title="仿真机监视程序"/>
            <el-step title="任务负荷报告生成"/>
          </el-steps>
          <div style="width: 100%; display: flex; flex-direction: column; align-items: center; gap: 12px">
            <template v-if="step === 0">
              <el-select :placeholder="modelSelectPlaceholder" v-model="taskSelection" style="width: 320px"
                         :disabled="simulatorStatus === 1 || modelOpenedStatus === 1">
                <el-option v-for="taskItem in taskList" :label="taskItem" :key="taskItem" :value="taskItem"/>
              </el-select>
              <div>
                <el-button @click="freshModelList" :disabled="simulatorStatus === 1 || modelOpenedStatus === 1">
                  <div style="display: flex; gap: 4px; align-items: center">
                    <el-icon v-html="refreshIcon.template"/>
                    <div>刷新远程仿真机模型列表</div>
                  </div>
                </el-button>
                <el-button type="primary" plain :disabled="modelOpenedStatus === 1 || !taskSelection"
                           @click="selectModel">
                  选择并打开模型
                </el-button>
                <el-button type="success" :disabled="modelOpenedStatus !== 2" @click="toConfirmParameterStep">
                  下一步
                </el-button>
              </div>

            </template>
            <template v-else-if="step === 1">
              <div
                  style="padding: 12px; border-radius: 12px; border: #4453bf solid 2px; background: rgba(37, 37, 37, 0.16);width: 800px; display: flex; flex-direction: column; gap: 12px; align-items: center;">
                <div style="font-size: large; font-weight: bold">远程仿真机参数</div>
                <template v-if="simulatorParameters">
                  <div style="display: flex; align-items: start; gap: 12px">

                    <div style="display: flex; flex-direction: column; gap: 8px">
                      <div v-for="item in simulatorParametersView.base" style="display: flex; align-items: center">
                        <div style="width: 160px">{{ item.key }}</div>
                        <div class="info-value">{{ item.value }}</div>
                      </div>
                    </div>

                    <div style="width: 1px; height: 240px; background: rgba(255,255,255,0.25);"/>

                    <div style="display: flex; flex-direction: column; gap: 8px">
                      <div v-for="item in simulatorParametersView.mbtime" style="display: flex; align-items: center">
                        <div style="width: 280px">{{ item.key }}</div>
                        <div class="info-value">{{ item.value }}</div>
                      </div>
                    </div>

                    <div style="width: 1px; height: 240px; background: rgba(255,255,255,0.25);"/>

                    <div style="display: flex; flex-direction: column; gap: 8px">
                      <div v-for="item in simulatorParametersView.mweight" style="display: flex; align-items: center">
                        <div style="width: 200px">{{ item.key }}</div>
                        <div class="info-value">{{ item.value }}</div>
                      </div>
                    </div>
                  </div>
                </template>
                <div v-else>读取中...</div>
                <div class="info-value" style="font-size: small">
                  注：仿真机参数基于远程配置设定，部分内容涉及学术研究成果。为确保结果准确，客户端一般无权限自行修改。如需调整，请前往远程实体机操作或联系相关负责人。
                </div>
              </div>
              <div style="width: 800px; display: flex; justify-content: space-between;">
                <el-button type="danger" plain @click="resetSimulatorValues">撤销并重新选择任务</el-button>
                <el-button @click="toRunModelStep" type="success" plain>确认并开始仿真</el-button>
              </div>
            </template>
            <template v-else-if="step === 2">
              <div
                  style="width: calc(100% - 12px); border-radius: 12px; border: #4453bf solid 2px; background: rgba(37, 37, 37, 0.16); padding: 12px 0; display: flex; flex-direction: column; gap: 4px;  align-items: center">
                <div style="display: flex; align-items: center; gap: 8px">
                  <el-icon v-html="logIcon.template"/>
                  <div>仿真机实时日志</div>
                </div>
                <div style="width: 140px; height: 1px; background: rgba(255,255,255,0.3);"/>
                <div v-if="realtimeOutput" style="height: 30px; display: flex; gap: 12px; align-items: center">
                  <div style="display: flex; gap: 8px; align-items: center">
                    <div style="width: 40px">TMR</div>
                    <div style="width: 100px" class="info-value">{{ realtimeOutput.tmr }}</div>
                  </div>
                  <div style="display: flex; gap: 8px; align-items: center">
                    <div style="width: 80px">认知模块</div>
                    <div style="width: 120px" class="info-value">{{ realtimeOutput.trunktype }}</div>
                  </div>
                  <div v-if="!realtimeOutput.hide_activetime" style="display: flex; gap: 8px; align-items: center">
                    <div style="width: 100px">基本活跃时间</div>
                    <div style="width: 100px" class="info-value">{{ realtimeOutput.activetime }}</div>
                  </div>
                  <div v-if="realtimeOutput.display_content" style="display: flex; gap: 8px; align-items: center">
                    <div style="width: 100px">描述</div>
                    <div class="info-value">{{ realtimeOutput.display_content }}</div>
                  </div>
                </div>
                <div v-else class="info-value" style="height: 30px">正在等待仿真日志输出……</div>
              </div>
              <div
                  style="width: calc(100% - 12px); border-radius: 12px; border: #4453bf solid 2px; overflow: hidden; position: relative">
                <div style="position: absolute; left: 12px; top: 8px; color: rgba(255,255,255,0.3)">
                  注：脑区可视化视图仅供参考
                </div>
                <BrainView ref="brainView"/>
              </div>
            </template>
            <template v-else-if="step === 3">
              <SimulateResults v-if="workloadCalculateResult" :result="workloadCalculateResult"/>
            </template>
          </div>
        </div>
        <div v-else style="display: flex; flex-direction: column; align-items: center;">
          <el-empty description="远程仿真机未连接"/>
          <el-button type="primary" plain @click.prevent="toStartConnect">尝试连接</el-button>
        </div>
      </el-tab-pane>
      <el-tab-pane label="任务负荷报告">
        <PdfReport/>
      </el-tab-pane>
    </el-tabs>
  </div>

  <div
      style="position: fixed; bottom: 80px; right: 50px; z-index: 20; display: flex; flex-direction: column; align-items: center; gap: 12px">
    <el-button v-if="simulateResultSavable" round style="width: 100%; margin-left: 0" type="success" @click="saveReportDialog = true">
      <div style="display: flex; align-items: center; gap: 4px">
        <el-icon v-html="logIcon.template"/>
        <div style="font-weight: bold">
          保存本次仿真结果
        </div>
      </div>
    </el-button>
  </div>

  <el-dialog v-model="saveReportDialog" center width="720">
    <template #header>
      <div style="display: flex; align-items: center; font-size: large; gap: 8px">
        <el-icon v-html="documentIcon.template"/>
        <div>报告保存</div>
      </div>
    </template>

    <div style="display: flex; flex-direction: column; gap: 8px">
      <div style="font-weight: bold">基本信息</div>
      <div style="display: flex">
        <div style="width: 180px">任务名称</div>
        <div class="info-value"> {{ otherSaveMaterials.title }} </div>
      </div>
      <div style="display: flex">
        <div style="width: 180px">仿真日期</div>
        <div class="info-value"> {{ dateFormat(otherSaveMaterials.simulateDate) }} </div>
      </div>
      <div style="width: 620px; height: 1px; background: rgba(255,255,255,0.3); align-self: center"/>
      <div style="font-weight: bold">补充信息填写</div>
      <div style="display: flex">
        <div style="width: 180px">保存名称</div>
        <el-input placeholder="本地报告文件显示名称，可留空" v-model="supplementInfo.saveName"/>
      </div>
      <div style="display: flex">
        <div style="width: 180px">评价目的</div>
        <el-input type="textarea" v-model="supplementInfo.evaluationPurpose"/>
      </div>
      <div style="display: flex">
        <div style="width: 180px">工况重要描述</div>
        <el-input type="textarea" v-model="supplementInfo.conditionDescription"/>
      </div>
      <div style="display: flex">
        <div style="width: 180px">评价标准模型选择</div>
        <el-select v-model="supplementInfo.standardModelSelection" clearable>
          <el-option v-for="item in reportModels" :key="item.uuid" :value="item.uuid" :label="item.title ? item.title : item.data.task.name">
            <div style="width: 100%; display: flex; justify-content: space-between; align-items: center">
              <div>{{ item.title ? item.title : item.data.task.name }}</div>
              <div style="color: #9b9b9b">{{ dateFormat(item.data.simulate_date) }}</div>
            </div>
          </el-option>
        </el-select>
      </div>
    </div>

    <template #footer>
      <el-button type="info" plain @click="saveReportDialog = false">取消</el-button>
      <el-button type="primary" @click="toSave" :disabled="saving">保存</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="connectionPanel" center width="520" draggable>
    <template #header>
      <div style="display: flex; align-items: center; font-size: large; gap: 8px">
        <el-icon v-html="machineIcon.template"/>
        <div>远程仿真机</div>
      </div>
    </template>
    <div style="display: flex; gap: 12px; height: 200px">
      <div
          style="display: flex; height: 100%; flex-direction: column; justify-content: center; gap: 8px; align-items: start; font-size: medium">
        <div style="display: flex; align-items: center; gap: 8px">
          <div style="width: 100px">连接状态</div>
          <ConnectionHint :status="connectionStatus"/>
        </div>
        <div style="width: 100%; display: flex; align-items: center">
          <div style="width: 100px">远程地址</div>
          <el-input v-model="hostInput" placeholder="默认（localhost）"/>
        </div>
        <div style="width: 100%; display: flex; align-items: center">
          <div style="width: 100px">远程端口</div>
          <el-input v-model="portInput" placeholder="默认（7642）"/>
        </div>
        <div>
          <el-button type="primary" @click="toStartConnect" plain :disabled="Boolean(connectSession)">尝试连接
          </el-button>
          <el-button type="warning" plain>重连</el-button>
          <el-button type="danger" @click="toCloseConnect" plain :disabled="connectionStatus !== 2">断开连接</el-button>
        </div>
      </div>
      <div style="width: 1px; height: 180px; background: rgba(255,255,255,0.25); align-self: center"/>
      <div v-if="simulatorInfo"
           style="height: 100%; display: flex; flex-direction: column; justify-content: center; gap: 12px">
        <div>
          远程仿真机信息
        </div>

        <div style="display: flex; align-items: center; gap: 8px">
          <div>名称</div>
          <div class="info-value">{{ simulatorInfo.name }}</div>
        </div>

        <div style="display: flex; align-items: center; gap: 8px">
          <div>版本</div>
          <div class="info-value">{{ simulatorInfo.version }}</div>
        </div>

        <div style="display: flex; align-items: center; gap: 8px">
          <div>研制时间</div>
          <div class="info-value">{{ simulatorInfo.release_time }}</div>
        </div>

        <div style="display: flex; align-items: center; gap: 8px">
          <div>仿真范式</div>
          <div class="info-value">{{ simulatorInfo.paradigm }}</div>
        </div>

        <div style="display: flex; align-items: center; gap: 8px">
          <div>研制单位</div>
          <div class="info-value">{{ simulatorInfo.creator }}</div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<style scoped>

.info-value {
  color: #9b9b9b
}

.machine-status {
  cursor: pointer;
  align-self: start;
  display: flex;
  align-items: center;
  gap: 12px;
  height: 50px;
  padding: 0 12px;
  border-radius: 8px;
  border: solid rgba(255, 255, 255, 0.49) 1px;
  transition: all 0.1s;
}

.machine-status:hover {
  background: rgba(255, 255, 255, 0.22);
}

</style>
<script setup>

import {computed, onMounted, reactive, ref, watch} from "vue";
import {baseServer} from "../plugins/axios";
import {trunktypes} from "../utils/models.js";
import {ElDialog, ElMessage, ElMessageBox} from "element-plus";
import ConditionView from "../components/ConditionView.vue";
import OutcomeView from "../components/OutcomeView.vue";
import {DeleteFilled, Plus, Select} from "@element-plus/icons-vue";
import {getId} from "../utils/global.js";
import {cognitiveModelIcon} from "../assets/icons.js";
import * as visual from "../configs/visual.js";
import {
  COGNITIVE_MODEL,
  D_KNOWLEDGE, INIT_STATUS,
  P_CONDITION,
  P_KNOWLEDGE,
  P_OUTCOME,
  REACTOR_MODEL, STATUS_VARIABLE,
  TASK
} from "../utils/lazyapi.js";
import {useIdentityStore} from "../plugins/store.js";

const totalCount = 9;

const successCount = ref(0);
const failedCount = ref(0);

const reactormodels = ref(undefined);
const tasks = ref(undefined);
const dks = ref(undefined);
const pks = ref(undefined);
const pouts = ref(undefined);
const pcons = ref(undefined);
const cogmodel = ref(undefined);
const initStatus = ref(undefined);
const statusVar = ref(undefined);

const dataAvailable = ref(true);
const dataLoading = ref(false);

function updateData(hard = false) {
  dataAvailable.value = false;
  dataLoading.value = true;
  successCount.value = 0;

  reactormodels.value = undefined;
  tasks.value = undefined;
  dks.value = undefined;
  pks.value = undefined;
  pouts.value = undefined;
  pcons.value = undefined;
  cogmodel.value = undefined;
  initStatus.value = undefined;
  statusVar.value = undefined;



  Promise.all([
      REACTOR_MODEL.get(hard)
        .then(data => {
          reactormodels.value = data;
          successCount.value++;
        }),
      TASK.get(hard)
        .then(data => {
          tasks.value = data;
          successCount.value++;
        }),
      D_KNOWLEDGE.get(hard)
        .then(data => {
          dks.value = data;
          successCount.value++;
        }),
      P_KNOWLEDGE.get(hard)
        .then(data => {
          pks.value = data
          successCount.value++;
        }),
      P_OUTCOME.get(hard)
        .then(data => {
          pouts.value = data
          successCount.value++;
        }),
      P_CONDITION.get(hard)
        .then(data => {
          pcons.value = data
          successCount.value++;
        }),
      COGNITIVE_MODEL.get(hard)
        .then(data => {
          cogmodel.value = data
          successCount.value++;
        }),
      INIT_STATUS.get(hard)
        .then(data => {
          initStatus.value = data
          successCount.value++;
        }),
      STATUS_VARIABLE.get(hard)
        .then(data => {
          statusVar.value = data
          successCount.value++;
        }),
  ])
      .then(() => {
        dataAvailable.value = true;
      })
      .catch((e) => {
        ElMessage.error('数据获取失败');
        console.log(e);
      })
      .finally(() => {
        dataLoading.value = false;
      });
}

onMounted(() => {
  updateData();
});

const selectedReactormodel = ref(undefined);

const taskFilterByReactorModel = computed(() => {
  if (dataAvailable.value && selectedReactormodel.value) {
    return tasks.value.filter(e => e.reactormodel.id === selectedReactormodel.value.id)
  } else return undefined
});

const cogmodelFilterByTask = computed(() => {
  if (dataAvailable.value && selectedTask.value) {
    return cogmodel.value.filter(e => e.task.id === selectedTask.value.id)
  } else return undefined
});

const statusVarFilterByTask = computed(() => {
  if (dataAvailable.value && selectedTask.value) {
    return statusVar.value.filter(e => e.task.id === selectedTask.value.id)
  } else return undefined
});

const initStatusFilterByTask = computed(() => {
  if (dataAvailable.value && selectedTask.value) {
    return initStatus.value.filter(e => e.task.id === selectedTask.value.id)
  } else return undefined
});

const selectedTask = ref(undefined);
const selectedCogModel = ref(undefined);

const pksFilterByTask = computed(() => {
  if (dataAvailable.value && selectedTask.value) {
    return pks.value.filter(e => e.condition[0].task.id === selectedTask.value.id)
  } else return undefined
});

const dksFilterByTask = computed(() => {
  if (dataAvailable.value && selectedTask.value) {
    return dks.value.filter(e => e.task.id === selectedTask.value.id)
  } else return undefined
});

const controlStatus = reactive({
  addReactormodelDialog: false,
  addTaskDialog: false,
  addKnowledgeDialog: false,
  addCogmodelDialog: false,
  addInitStatusDialog: false,
  addStatusVarDialog: false,
  addConditionDeclarationKnowledgeDialog: false,
  addOutcomeDeclarationKnowledgeDialog: false,
});

const loadingStatus = reactive({
  commitAddAndUseReactormodel: false,
  commitAddAndUseTask: false,
  commitAddAndUseCogmodel: false,
  commitAddAndUseInitStatus: false,
  commitAddAndUseStatusVar: false,
  commitAddAndUseConditionDeclarationKnowledge: false,
  commitAddAndUseOutcomeDeclarationKnowledge: false,
  commitAddAndActivationKnowledge: false,
  saving: false,
  deletePks: false,
  deleteSelectedCogmodel: false
});

const reactormodelAddForm = reactive({
  title: '',
  description: ''
});

const taskAddForm = reactive({
  title: '',
  description: ''
});

const knowledgeAddForm = reactive({
  activetime: 0,
  order: 0,
  cknowledge: undefined,
  cnot: false,
  oknowledge: undefined,
  onot: false
});

const cogmodelAddForm = reactive({
  name: '',
  author: '',
  description: '',
  initstatus: [],
  statusvar: []
});

const initStatusAddForm = reactive({
  name: '',
  status: '',
  description: ''
});

const statusVarAddForm = reactive({
  name: '',
  values: '',
  description: ''
});

const conditionAddForm = reactive({
  title: '',
  status: '',
  description: '',
  trunktype: undefined
});

const outcomeAddForm = reactive({
  title: '',
  status: '',
  description: '',
  trunktype: undefined
});

const identityStore = useIdentityStore();

const commitAddAndUseReactormodel = () => {
  loadingStatus.commitAddAndUseReactormodel = true;
  baseServer.post('/api/coper/reactormodel/', {
    title: reactormodelAddForm.title,
    description: reactormodelAddForm.description,
    creator: identityStore.identity.id
  })
      .then(async response => {
        const res = (await baseServer.get(`/api/coper/reactormodel/${response.data.id}/`)).data;
        reactormodels.value.push(res);
        selectedReactormodel.value = res;
        ElMessage.success('创建成功！');
        controlStatus.addReactormodelDialog = false;
      })
      .catch(e => {
        console.log(e);
        ElMessage.error('堆型添加失败');
      })
      .finally(() => {
        loadingStatus.commitAddAndUseReactormodel = false;
      })
}

const commitAddAndUseTask = () => {
  loadingStatus.commitAddAndUseTask = true;
  baseServer.post('/api/coper/task/', {
    title: taskAddForm.title,
    description: taskAddForm.description,
    reactormodel: selectedReactormodel.value.id,
    creator: identityStore.identity.id
  })
      .then(async response => {
        const res = (await baseServer.get(`/api/coper/task/${response.data.id}/`)).data;
        tasks.value.push(res);
        selectedTask.value = res;
        ElMessage.success('创建成功！');
        controlStatus.addTaskDialog = false;
      })
      .catch(e => {
        console.log(e);
        ElMessage.error('任务添加失败');
      })
      .finally(() => {
        loadingStatus.commitAddAndUseTask = false;
      });
}

const commitAddAndUseCogmodel = () => {
  loadingStatus.commitAddAndUseCogmodel = true;
  baseServer.post('/api/coper/cm/', {
    name: cogmodelAddForm.name,
    author: cogmodelAddForm.author,
    description: cogmodelAddForm.description,
    initstatus: cogmodelAddForm.initstatus,
    statusvariable: cogmodelAddForm.statusvar,
    task: selectedTask.value.id,
    evaluation: "T",
    creator: identityStore.identity.id
  })
      .then(async (response) => {
        const newCogmodel = (await baseServer.get(`/api/coper/cm/${response.data.id}/`)).data;
        cogmodel.value.push(newCogmodel);
        selectedCogModel.value = newCogmodel;
        ElMessage.success('创建成功！');
        controlStatus.addCogmodelDialog = false;
      })
      .catch(e => {
        console.log(e);
        ElMessage.error('任务添加失败');
      })
      .finally(() => {
        loadingStatus.commitAddAndUseCogmodel = false;
      });
}

const commitAddAndUseInitStatus = () => {
  loadingStatus.commitAddAndUseInitStatus = true;
  baseServer.post('/api/coper/initstatus/', {
    name: initStatusAddForm.name,
    description: initStatusAddForm.description,
    status: initStatusAddForm.status,
    task: selectedTask.value.id,
    creator: identityStore.identity.id
  })
      .then(async response => {
        const res = (await baseServer.get(`/api/coper/initstatus/${response.data.id}/`)).data;
        initStatus.value.push(res);
        cogmodelAddForm.initstatus.push(res.id);
        ElMessage.success('创建成功！');
        controlStatus.addInitStatusDialog = false;
      })
      .catch(e => {
        console.log(e);
        ElMessage.error('初始状态添加添加失败');
      })
      .finally(() => {
        loadingStatus.commitAddAndUseInitStatus = false;
      });
}

const commitAddAndUseStatusVar = () => {
  loadingStatus.commitAddAndUseStatusVar = true;
  baseServer.post('/api/coper/statusvar/', {
    name: statusVarAddForm.name,
    description: statusVarAddForm.description,
    values: statusVarAddForm.values,
    task: selectedTask.value.id,
    creator: identityStore.identity.id
  })
      .then(async response => {
        const res = (await baseServer.get(`/api/coper/statusvar/${response.data.id}/`)).data;
        statusVar.value.push(res);
        cogmodelAddForm.statusvar.push(res.id);
        ElMessage.success('创建成功！');
        controlStatus.addStatusVarDialog = false;
      })
      .catch(e => {
        console.log(e);
        ElMessage.error('状态变量添加添加失败');
      })
      .finally(() => {
        loadingStatus.commitAddAndUseStatusVar = false;
      });
}

const commitAddAndUseConditionDeclarationKnowledge = () => {
  loadingStatus.commitAddAndUseConditionDeclarationKnowledge = true;
  baseServer.post('/api/coper/dk/', {
    title: conditionAddForm.title,
    description: conditionAddForm.description,
    purview: identityStore.identity.role,
    trunktype: conditionAddForm.trunktype.value,
    task: selectedTask.value.id,
    creator: identityStore.identity.id,
  })
      .then(async response => {
        const res = (await baseServer.get(`/api/coper/dk/${response.data.id}/`)).data;
        res.trunktype = conditionAddForm.trunktype
        dks.value.push(res);
        knowledgeAddForm.cknowledge = res;
        ElMessage.success('创建成功！');
        controlStatus.addConditionDeclarationKnowledgeDialog = false;
      })
      .catch(e => {
        console.log(e);
        ElMessage.error('陈述知识添加失败');
      })
      .finally(() => {
        loadingStatus.commitAddAndUseConditionDeclarationKnowledge = false;
      });
}

const commitAddAndUseOutcomeDeclarationKnowledge = () => {
  loadingStatus.commitAddAndUseOutcomeDeclarationKnowledge = true;
  baseServer.post('/api/coper/dk/', {
    title: outcomeAddForm.title,
    description: outcomeAddForm.description,
    purview: identityStore.identity.role,
    trunktype: outcomeAddForm.trunktype.value,
    task: selectedTask.value.id,
    creator: identityStore.identity.id,
  })
      .then(async response => {
        const res = (await baseServer.get(`/api/coper/dk/${response.data.id}/`)).data;
        res.trunktype = outcomeAddForm.trunktype
        dks.value.push(res);
        knowledgeAddForm.oknowledge = res;
        ElMessage.success('创建成功！');
        controlStatus.addOutcomeDeclarationKnowledgeDialog = false;
      })
      .catch(e => {
        console.log(e);
        ElMessage.error('陈述知识添加失败');
      })
      .finally(() => {
        loadingStatus.commitAddAndUseOutcomeDeclarationKnowledge = false;
      });
}

const addWhenActivation = ref(false);

function commitAddKnowledge(createOpposite = false) {

  loadingStatus.commitAddAndActivationKnowledge = true

  const postForm = {
    conditionKnowledge: undefined,
    outcomeKnowledge: undefined,
  };

  baseServer.post('/api/coper/pcon/', {
    opertion: '{',
    prefixmark: knowledgeAddForm.cnot ? 'not' : null,
    suffixmark: '}',
    purview: 0,
    cknowledge: knowledgeAddForm.cknowledge.id,
    task: knowledgeAddForm.cknowledge.task.id,
    currentstatusvariable: [],
    creator: identityStore.identity.id
  })
      .then(async response => {
            postForm.conditionKnowledge = (await baseServer.get(`/api/coper/pcon/${response.data.id}/`)).data;
            return baseServer.post('/api/coper/pout/', {
              opertion: null,
              prefixmark: knowledgeAddForm.onot ? 'not' : null,
              suffixmark: '}',
              purview: 0,
              oknowledge: knowledgeAddForm.oknowledge.id,
              task: knowledgeAddForm.oknowledge.task.id,
              currentstatusvariable: [],
              creator: identityStore.identity.id
            })
          }
      )
      .then(async response => {
            postForm.outcomeKnowledge = (await baseServer.get(`/api/coper/pout/${response.data.id}/`)).data;
            return baseServer.post('/api/coper/pknow/', {
              activetime: knowledgeAddForm.activetime,
              order: knowledgeAddForm.order,
              purview: 0,
              creator: identityStore.identity.id,
              condition: [postForm.conditionKnowledge.id],
              outcome: [postForm.outcomeKnowledge.id]
            })
          }
      )
      .then(async response => {
        const res = (await baseServer.get(`/api/coper/pknow/${response.data.id}/`)).data;
        pks.value.push(res);
        console.log(res)
        ElMessage.success('创建成功！');
        if (addWhenActivation.value && selectedCogModel.value) {
          res.selected = true
        }
        if (createOpposite) {
          knowledgeAddForm.cnot = !knowledgeAddForm.cnot
          knowledgeAddForm.onot = false
          knowledgeAddForm.oknowledge = undefined
        } else {
          controlStatus.addKnowledgeDialog = false;
        }
      })
      .catch(e => {
        ElMessage.error('添加失败！')
        console.log(e)
      })
      .finally(() => {
        loadingStatus.commitAddAndActivationKnowledge = false;
      });
}

const updateSelected = () => {
  if (selectedCogModel.value) {
    const pksId = selectedCogModel.value.production.map(e => getId(e));
    pksFilterByTask.value.forEach(e => {
      e.selected = pksId.includes(getId(e));
    });
  } else {
    pksFilterByTask.value.forEach(e => {
      e.selected = false;
    });
  }
}

const saveCogmodel = () => {
  if (selectedCogModel.value) {
    loadingStatus.saving = true
    baseServer.put(`/api/coper/cm/${getId(selectedCogModel.value)}/`, {
      production: pksFilterByTask.value.filter(e => e.selected).map(e => getId(e)),
      author: selectedCogModel.value.author,
      creator: getId(selectedCogModel.value.creator),
      name: selectedCogModel.value.name,
      task: getId(selectedCogModel.value.task),
      description: selectedCogModel.value.description,
      purview: identityStore.identity.role,
      initstatus: selectedCogModel.value.initstatus.map(getId),
      statusvariable: selectedCogModel.value.initstatus.map(getId),
    })
        .then(async response => {
          ElMessage.success('保存成功！')
          selectedCogModel.value.production = (await baseServer.get(`/api/coper/cm/${response.data.id}/`)).data;
        })
        .catch(e => {
          ElMessage.error('保存失败！')
          console.log(e)
        })
        .finally(() => {
          loadingStatus.saving = false
        })
  }
}

function selectedDks(item) {
  if (selectedCogModel.value)
    item.selected = !item.selected
}

function deletePks(item) {
  loadingStatus.deletePks = true
  baseServer.delete(`/api/coper/pknow/${item.id}/`)
      .then(() => {
        ElMessage.info('已删除');
        pks.value = pks.value.filter(e => (e.id !== item.id));
      })
      .catch(e => {
        ElMessage.error('删除失败！')
        console.log(e)
      })
      .finally(() => {
        loadingStatus.deletePks = false
      });
}

function deleteSelectedCogmodel() {
  ElMessageBox.confirm(`确认要删除 ${selectedCogModel.value.name} 认知模型？`)
      .then(() => {
        loadingStatus.deleteSelectedCogmodel = true
        const targetId = selectedCogModel.value.id;
        baseServer.delete(`/api/coper/cm/${targetId}/`)
            .then(() => {
              ElMessage.info('已删除');
              selectedCogModel.value = undefined;
              cogmodel.value = cogmodel.value.filter(e => (e.id !== targetId));
            })
            .catch(e => {
              ElMessage.error('删除失败！')
              console.log(e)
            })
            .finally(() => {
              loadingStatus.deleteSelectedCogmodel = false
            });
      })
      .catch(() => {
      });
}

watch(selectedTask, () => {
  selectedCogModel.value = undefined;
});

watch(selectedReactormodel, () => {
  selectedTask.value = undefined;
  selectedCogModel.value = undefined;
});

watch(selectedCogModel, updateSelected);

</script>

<template>
  <div v-if="dataAvailable" style="width: 100%; display: flex; flex-direction: column; align-items: center">

    <div style="width: 100%; display: flex; align-items: center; justify-content: space-between">
      <div style="display: flex; align-items: center; gap: 16px">
        <el-breadcrumb>
          <el-breadcrumb-item>
            <el-select style="width: 120px" v-model="selectedReactormodel" filterable value-key="title"
                       placeholder="堆型...">
              <template #header>
                <el-button type="text" plain @click="controlStatus.addReactormodelDialog = true">
                  <template #icon>
                    <el-icon>
                      <Plus/>
                    </el-icon>
                  </template>
                  创建新堆型
                </el-button>
              </template>
              <el-option v-for="rm in reactormodels" :key="rm.id" :value="rm" :label="rm.title"/>
            </el-select>
          </el-breadcrumb-item>
          <el-breadcrumb-item v-if="selectedReactormodel">
            <el-select style="width: 120px" v-model="selectedTask" filterable value-key="title" placeholder="任务...">
              <template #header>
                <el-button type="text" plain @click="controlStatus.addTaskDialog = true">
                  <template #icon>
                    <el-icon>
                      <Plus/>
                    </el-icon>
                  </template>
                  创建新任务
                </el-button>
              </template>
              <el-option v-for="task in taskFilterByReactorModel" :key="task.id" :value="task" :label="task.title"/>
            </el-select>
          </el-breadcrumb-item>
          <el-breadcrumb-item v-if="selectedTask">
            <el-select style="width: 120px" v-model="selectedCogModel" filterable value-key="name"
                       placeholder="认知模型...">
              <template #header>
                <el-button type="text" plain @click="controlStatus.addCogmodelDialog = true">
                  <template #icon>
                    <el-icon>
                      <Plus/>
                    </el-icon>
                  </template>
                  创建新认知模型
                </el-button>
              </template>
              <el-option v-for="cm in cogmodelFilterByTask" :key="cm.id" :value="cm" :label="cm.name"/>
            </el-select>
          </el-breadcrumb-item>
        </el-breadcrumb>
        <el-popover
            v-if="selectedCogModel"
            trigger="click"
            width="320px"
        >
          <template #reference>
            <el-card style="cursor: pointer;" body-style="padding: 4px">
              <div style="display: flex; align-items: center; gap: 4px;">
                <el-icon v-html="cognitiveModelIcon.template"/>
                <el-text>模型信息</el-text>
              </div>
            </el-card>
          </template>
          <div style="width: 100%; display: flex; flex-direction: column; gap: 16px; align-items: start">
            <div style="display: flex; width: 100%; justify-content: space-around; margin-top: 20px">
              <el-statistic
                  title="已选中初始状态数目"
                  :value="selectedCogModel.initstatus.length"
              />
              <el-statistic
                  title="收集状态变量数目"
                  :value="selectedCogModel.statusvariable.length"
              />
            </div>

            <div style="display: flex; gap: 4px">
              <el-text>
                模型作者
              </el-text>
              <el-text style="font-weight: bold">
                {{ selectedCogModel.author }}
              </el-text>
            </div>

            <div style="display: flex; gap: 4px">
              <el-text>
                模型描述
              </el-text>
              <el-text style="font-weight: bold">
                {{ selectedCogModel.description }}
              </el-text>
            </div>

            <div style="display: flex; gap: 4px">
              <el-text>
                权限等级
              </el-text>
              <el-text style="font-weight: bold">
                {{ selectedCogModel.purview }}
              </el-text>
            </div>

            <div style="display: flex; gap: 4px">
              <el-text>
                创建时间
              </el-text>
              <el-text style="font-weight: bold">
                {{ new Date(selectedCogModel.created_at).toLocaleString() }}
              </el-text>
            </div>
            <div style="width: 100%; display: flex; justify-content: right">
              <el-button circle type="danger" @click="deleteSelectedCogmodel" :loading="loadingStatus.deleteSelectedCogmodel">
                <el-icon>
                  <DeleteFilled/>
                </el-icon>
              </el-button>
            </div>
          </div>
        </el-popover>
      </div>
      <el-affix :offset="120">
        <el-button v-if="selectedCogModel" @click="saveCogmodel" :loading="loadingStatus.saving">
          <template #icon>
            <el-icon>
              <Select/>
            </el-icon>
          </template>
          保存
        </el-button>
        <el-popover v-else>
          <template #reference>
            <el-button disabled>
              <template #icon>
                <el-icon>
                  <Select/>
                </el-icon>
              </template>
              保存
            </el-button>
          </template>
          请先完成<b>认知模型的选择</b>再进行知识的选择与保存！
        </el-popover>
      </el-affix>
    </div>

    <el-scrollbar v-if="selectedTask" height="70vh" style="width: 100%;">
      <el-row style="width: 100%">
        <el-col :xl="4" :lg="6" :md="12" :sm="12" :xs="24" v-for="item in pksFilterByTask" :key="item.id">
          <div style="margin: 20px">
            <el-popover
                trigger="contextmenu"
                width="320px"
            >
              <template #reference>
                <el-card shadow="hover" style="cursor: pointer" :class="item.selected ? ['available-card'] : []"
                         @click="selectedDks(item)" body-style="padding: 0; position: relative">
                  <div v-if="item.selected" style="position: absolute; right: 0; bottom: 0">
                    <el-icon size="64px" color="rgba(40,117,188,0.4)">
                      <Select/>
                    </el-icon>
                  </div>
                  <div
                      style="width: 100%; margin: 20px 0; display: flex; align-items: center; justify-content: center;">
                    <svg style="width: 105px; height: 150px" viewBox="0 0 140 200" xmlns="http://www.w3.org/2000/svg">
                      <polygon points="70,20 110,45 70,70 30,45" fill="#0000FF3D" stroke="#0000A0" stroke-width="2"/>
                      <text x="70" y="48" text-anchor="middle" alignment-baseline="middle" font-size="20"
                            fill="#9999FFFF">
                        IF
                      </text>
                      <rect x="40" y="140" width="60" height="40" fill="#00FF003D" stroke="#00A000" stroke-width="2"/>
                      <text x="70" y="163" text-anchor="middle" alignment-baseline="middle" font-size="20"
                            fill="#99FF99FF">
                        THEN
                      </text>
                      <line x1="70" y1="70" x2="70" y2="120" :stroke="visual.color.primary"
                            stroke-width="2"
                            marker-end="url(#arrowhead)"/>
                      <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                          <polygon points="0 0, 10 3.5, 0 7" :fill="visual.color.primary"/>
                        </marker>
                      </defs>
                    </svg>
                    <div style="display: flex; flex-direction: column; height: 150px; justify-content: space-between">
                      <div style="padding-top: 20px">
                        <ConditionView :condition="item.condition[0]"/>
                      </div>
                      <div style="padding-bottom: 20px">
                        <OutcomeView :outcome="item.outcome[0]"/>
                      </div>
                    </div>
                  </div>
                </el-card>
              </template>
              <div style="width: 100%; display: flex; flex-direction: column; gap: 4px; align-items: start">
                <div>
                  创建者: {{ item.creator.username }}
                </div>
                <div>
                  ORDER: {{ item.order }}
                </div>
                <div>
                  PURVIEW: {{ item.purview }}
                </div>
                <div>
                  创建时间: {{ new Date(item.created_at).toLocaleString() }}
                </div>
                <el-button type="danger" circle style="align-self: end" plain @click="deletePks(item)"
                           :loading="loadingStatus.deletePks">
                  <el-icon>
                    <DeleteFilled/>
                  </el-icon>
                </el-button>
              </div>
            </el-popover>
          </div>
        </el-col>
        <el-col :xl="4" :lg="6" :md="12" :sm="12" :xs="24">
          <div style="margin: 20px">
            <el-card style="cursor: pointer;" @click="controlStatus.addKnowledgeDialog = true" body-style="padding: 0">
              <div
                  style="width: 100%; margin: 20px 0; height: 150px; display: flex; flex-direction: column; gap: 12px; justify-content: center; align-items: center">
                <el-icon size="32px">
                  <Plus/>
                </el-icon>
                <el-text>
                  添加知识
                </el-text>
              </div>
            </el-card>
          </div>
        </el-col>
      </el-row>
    </el-scrollbar>
    <el-empty v-else description="请在左上方完成认知模型的选择"/>
  </div>
  <div
      style="width: 100%; height: 200px; display: flex; flex-direction: column; gap: 12px; align-items: center; justify-content: center"
      v-else-if="dataLoading">
    <el-progress type="dashboard" :percentage="Math.round(100 * successCount / totalCount)"/>
    正在获取数据...
  </div>
  <div v-else style="display: flex; flex-direction: column;; width: 100%; align-items: center; gap: 4px">
    <el-empty description="数据加载失败"/>
    <el-button type="primary" plain @click="updateData">
      重试
    </el-button>
  </div>

  <!-- 堆型添加窗口 -->
  <el-dialog
      v-model="controlStatus.addReactormodelDialog"
      title="添加堆型"
  >
    <template #default>
      <el-form :model="reactormodelAddForm">
        <el-form-item prop="title" label="堆型名">
          <el-input v-model="reactormodelAddForm.title"/>
        </el-form-item>
        <el-form-item prop="description" label="描述">
          <el-input v-model="reactormodelAddForm.description" type="textarea"/>
        </el-form-item>
      </el-form>
    </template>
    <template #footer>
      <div style="flex: auto">
        <el-button type="primary" @click="commitAddAndUseReactormodel"
                   :loading="loadingStatus.commitAddAndUseReactormodel">添加并使用堆型
        </el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 任务添加窗口 -->
  <el-dialog
      v-model="controlStatus.addTaskDialog"
      title="添加任务"
  >
    <template #default>
      <el-form :model="taskAddForm">
        <el-form-item prop="title" label="任务名">
          <el-input v-model="taskAddForm.title"/>
        </el-form-item>
        <el-form-item prop="description" label="描述">
          <el-input v-model="taskAddForm.description" type="textarea"/>
        </el-form-item>
      </el-form>
    </template>
    <template #footer>
      <div style="flex: auto">
        <el-button type="primary" @click="commitAddAndUseTask" :loading="loadingStatus.commitAddAndUseTask">
          添加并使用任务
        </el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 认知模型添加窗口 -->
  <el-dialog
      v-model="controlStatus.addCogmodelDialog"
      title="创建认知模型"
  >
    <template #default>
      <el-form :model="cogmodelAddForm">
        <el-form-item prop="name" label="模型名称">
          <el-input v-model="cogmodelAddForm.name"/>
        </el-form-item>
        <el-form-item prop="author" label="作者">
          <el-input v-model="cogmodelAddForm.author"/>
        </el-form-item>
        <el-form-item prop="description" label="描述">
          <el-input v-model="cogmodelAddForm.description"/>
        </el-form-item>

        <el-form-item prop="initstatus" label="初始状态">
          <el-select v-model="cogmodelAddForm.initstatus" multiple filterable placeholder="选择……" value-key="name">
            <template #header>
              <el-button type="text" @click="controlStatus.addInitStatusDialog = true">
                <template #icon>
                  <el-icon>
                    <Plus/>
                  </el-icon>
                </template>
                添加初始状态
              </el-button>
            </template>
            <el-option v-for="item in initStatusFilterByTask" :label="item.name + ' = ' + item.status" :value="item.id"
                       :key="item.id"/>
          </el-select>
        </el-form-item>

        <el-form-item prop="statusvar" label="状态变量">
          <el-select v-model="cogmodelAddForm.statusvar" multiple filterable placeholder="选择……" value-key="name">
            <template #header>
              <el-button type="text" @click="controlStatus.addStatusVarDialog = true">
                <template #icon>
                  <el-icon>
                    <Plus/>
                  </el-icon>
                </template>
                添加状态变量
              </el-button>
            </template>
            <el-option v-for="item in statusVarFilterByTask" :label="item.name + ' = ' + item.values" :value="item.id"
                       :key="item.id"/>
          </el-select>
        </el-form-item>
      </el-form>
    </template>
    <template #footer>
      <div style="flex: auto">
        <el-button type="primary" @click="commitAddAndUseCogmodel" :loading="loadingStatus.commitAddAndUseCogmodel">
          添加并选择认知模型
        </el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 初始状态添加窗口 -->
  <el-dialog
      v-model="controlStatus.addInitStatusDialog"
      title="添加初始状态"
  >
    <template #default>
      <el-form :model="initStatusAddForm">
        <el-form-item prop="name" label="初始状态名">
          <el-input v-model="initStatusAddForm.name"/>
        </el-form-item>
        <el-form-item prop="status" label="初始状态值">
          <el-input v-model="initStatusAddForm.status"/>
        </el-form-item>
        <el-form-item prop="description" label="描述">
          <el-input v-model="initStatusAddForm.description" type="textarea"/>
        </el-form-item>
      </el-form>
    </template>
    <template #footer>
      <div style="flex: auto">
        <el-button type="primary" @click="commitAddAndUseInitStatus" :loading="loadingStatus.commitAddAndUseInitStatus">
          添加并应用
        </el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 状态变量添加窗口 -->
  <el-dialog
      v-model="controlStatus.addStatusVarDialog"
      title="添加初始状态"
  >
    <template #default>
      <el-form :model="statusVarAddForm">
        <el-form-item prop="name" label="状态变量名">
          <el-input v-model="statusVarAddForm.name"/>
        </el-form-item>
        <el-form-item prop="values" label="状态变量值">
          <el-input v-model="statusVarAddForm.values"/>
        </el-form-item>
        <el-form-item prop="description" label="描述">
          <el-input v-model="statusVarAddForm.description" type="textarea" placeholder="该字段不可空"/>
        </el-form-item>
      </el-form>
    </template>
    <template #footer>
      <div style="flex: auto">
        <el-button type="primary" @click="commitAddAndUseStatusVar" :loading="loadingStatus.commitAddAndUseStatusVar">
          添加并应用
        </el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 知识添加窗口 -->
  <el-dialog
      v-model="controlStatus.addKnowledgeDialog"
      title="添加知识"
  >
    <div style="width: 100%; display: flex; flex-direction: column; gap: 8px; align-items: center">
      <el-card style="width: 100%;">
        <template #header>
          <el-text>
            判断
          </el-text>
        </template>
        <el-select v-model="knowledgeAddForm.cknowledge" filterable placeholder="如果" value-key="id">
          <template #header>
            <el-button type="text" @click="controlStatus.addConditionDeclarationKnowledgeDialog = true">
              <template #icon>
                <el-icon>
                  <Plus/>
                </el-icon>
              </template>
              添加陈述性知识
            </el-button>
          </template>
          <el-option v-for="item in dksFilterByTask" :label="item.title" :value="item" :key="item.id"/>
        </el-select>
        <el-checkbox v-model="knowledgeAddForm.cnot" label="NOT"/>
      </el-card>
      <el-card style="width: 100%;">
        <template #header>
          <el-text>
            行为
          </el-text>
        </template>
        <el-select v-model="knowledgeAddForm.oknowledge" value-key="id" placeholder="则进行" filterable>
          <template #header>
            <el-button type="text" @click="controlStatus.addOutcomeDeclarationKnowledgeDialog = true">
              <template #icon>
                <el-icon>
                  <Plus/>
                </el-icon>
              </template>
              添加陈述性知识
            </el-button>
          </template>
          <el-option v-for="item in dksFilterByTask" :label="item.title" :value="item" :key="item.id"/>
        </el-select>
        <el-checkbox v-model="knowledgeAddForm.onot" label="NOT"/>
      </el-card>
      <el-card style="width: 100%;">
        <el-form :model="knowledgeAddForm">
          <el-form-item prop="activetime" label="程序性过程时间（毫秒）">
            <el-input-number :step="500" v-model="knowledgeAddForm.activetime"/>
          </el-form-item>
          <el-form-item prop="order" label="优先级（越低越优先）">
            <el-input-number v-model="knowledgeAddForm.order"/>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
    <template #footer>
      <div style="display: flex; gap: 4px; flex-direction: column; align-items: end;">
        <el-checkbox v-if="selectedCogModel" v-model="addWhenActivation" label="添加时激活"/>
        <el-popover v-else>
          <template #reference>
            <el-checkbox :checked="false" disabled label="添加时激活"/>
          </template>
          请先完成认知模型的选择
        </el-popover>
        <div style="display: flex;">
          <el-button type="primary" @click="commitAddKnowledge(true)"
                     :loading="loadingStatus.commitAddAndActivationKnowledge" plain>
            添加并继续创建反面知识
          </el-button>
          <el-button type="primary" @click="commitAddKnowledge()"
                     :loading="loadingStatus.commitAddAndActivationKnowledge">
            添加知识
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>

  <!-- 条件陈述知识添加窗口 -->
  <el-dialog
      v-model="controlStatus.addConditionDeclarationKnowledgeDialog"
      title="添加陈述性知识"
  >
    <template #default>
      <el-form :model="conditionAddForm">
        <el-form-item prop="title" label="名称">
          <el-input v-model="conditionAddForm.title"/>
        </el-form-item>
        <el-form-item prop="trunktype" label="脑活动">
          <el-select v-model="conditionAddForm.trunktype" value-key="name" placeholder="选择脑活动">
            <el-option v-for="item in trunktypes" :label="item.name" :value="item" :key="item.value">
              <el-tag :color="item.tint + '20'" :style="{color: item.tint, borderColor: item.tint}">
                {{ item.name }}
              </el-tag>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item prop="description" label="描述">
          <el-input v-model="conditionAddForm.description" type="textarea"/>
        </el-form-item>
      </el-form>
    </template>
    <template #footer>
      <div style="flex: auto">
        <el-button type="primary" @click="commitAddAndUseConditionDeclarationKnowledge"
                   :loading="loadingStatus.commitAddAndUseConditionDeclarationKnowledge">添加并应用
        </el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 结果陈述知识添加窗口 -->
  <el-dialog
      v-model="controlStatus.addOutcomeDeclarationKnowledgeDialog"
      title="添加陈述性知识"
  >
    <template #default>
      <el-form :model="outcomeAddForm">
        <el-form-item prop="title" label="名称">
          <el-input v-model="outcomeAddForm.title"/>
        </el-form-item>
        <el-form-item prop="trunktype" label="脑活动">
          <el-select v-model="outcomeAddForm.trunktype" value-key="name" placeholder="选择脑活动">
            <el-option v-for="item in trunktypes" :label="item.name" :value="item" :key="item.value">
              <el-tag :color="item.tint + '20'" :style="{color: item.tint, borderColor: item.tint}">
                {{ item.name }}
              </el-tag>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item prop="description" label="描述">
          <el-input v-model="outcomeAddForm.description" type="textarea"/>
        </el-form-item>
      </el-form>
    </template>
    <template #footer>
      <div style="flex: auto">
        <el-button type="primary" @click="commitAddAndUseOutcomeDeclarationKnowledge"
                   :loading="loadingStatus.commitAddAndUseOutcomeDeclarationKnowledge">添加并应用
        </el-button>
      </div>
    </template>
  </el-dialog>


</template>

<style scoped>

.available-card {
  background-color: #003349 !important;
}

</style>

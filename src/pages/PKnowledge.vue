<script setup>

import {computed, onMounted, reactive, ref, watch} from "vue";
import {baseServer} from "../plugins/axios";
import {ElMessage} from "element-plus";
import ConditionView from "../components/ConditionView.vue";
import OutcomeView from "../components/OutcomeView.vue";
import {DeleteFilled, Plus} from "@element-plus/icons-vue";
import {useIdentityStore} from "../plugins/store.js";
import {D_KNOWLEDGE, P_CONDITION, P_KNOWLEDGE, P_OUTCOME, TASK} from "../utils/lazyapi.js";

const controlStatus = reactive({
  addDrawer: false
});

const addForm = ref({
  activetime: 0,
  order: 0,
  cknowledge: undefined,
  cnot: false,
  oknowledge: undefined,
  onot: false
});

const multipleSelection = ref([]);

const selected = computed(() => multipleSelection.value.length > 0);

function handleSelectionChange(newSelection) {
  multipleSelection.value = newSelection
}

const totalLoadCount = 5;
const loadProgress = ref(0);

const tasks = ref(null);
const dks = ref(null);
const pks = ref(null);
const pouts = ref(null);
const pcons = ref(null);

const dataAvailable = ref(false);
const dataLoading = ref(false);

const expandBadge = ref(false);

const creatorFilter = computed(() => {
  if (!pks.value) return undefined;
  const s = new Set();
  pks.value.forEach(e => {
    s.add(e.creator.username);
  });
  return Array.from(s).map(e => ({text: e, value: e}));
});

const taskFilter = computed(() => {
  if (!pks.value) return undefined;
  const s = new Set();
  pks.value.forEach(e => {
    s.add(e.condition[0].task.title);
  });
  return Array.from(s).map(e => ({text: e, value: e}));
});

function updateData(hard = false) {
  dataAvailable.value = false;
  dataLoading.value = true;
  loadProgress.value = 0;

  tasks.value = null;
  dks.value = null;
  pks.value = null;
  pouts.value = null;
  pcons.value = null;

  Promise.all([
    TASK.get(hard)
        .then(data => {
          tasks.value = data;
          loadProgress.value++;
        }),
    D_KNOWLEDGE.get(hard)
        .then(data => {
          dks.value = data;
          loadProgress.value++;
        }),
    P_KNOWLEDGE.get(hard)
        .then(data => {
          pks.value = data
          loadProgress.value++;
        }),
    P_OUTCOME.get(hard)
        .then(data => {
          pouts.value = data
          loadProgress.value++;
        }),
    P_CONDITION.get(hard)
        .then(data => {
          pcons.value = data
          loadProgress.value++;
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

const identityStore = useIdentityStore();

const adding = ref(false);

function commitAdd(con = false) {
  adding.value = true;

  const postForm = {
    conditionId: null,
    outcomeId: null,
  };

  baseServer.post('/api/coper/pcon/', {
    opertion: '{',
    prefixmark: addForm.value.cnot ? 'not' : null,
    suffixmark: '}',
    purview: identityStore.identity.role,
    cknowledge: addForm.value.cknowledge.id,
    task: addForm.value.cknowledge.task.id,
    currentstatusvariable: [],
    creator: identityStore.identity.id
  })
      .then(response => {
            postForm.conditionId = response.data.id;
            return baseServer.post('/api/coper/pout/', {
              opertion: null,
              prefixmark: addForm.value.onot ? 'not' : null,
              suffixmark: '}',
              purview: identityStore.identity.role,
              oknowledge: addForm.value.oknowledge.id,
              task: addForm.value.oknowledge.task.id,
              currentstatusvariable: [],
              creator: identityStore.identity.id
            })
          }
      )
      .then(response => {
            postForm.outcomeId = response.data.id;
            return baseServer.post('/api/coper/pknow/', {
              activetime: addForm.value.activetime,
              order: addForm.value.order,
              purview: identityStore.identity.role,
              creator: identityStore.identity.id,
              condition: [postForm.conditionId],
              outcome: [postForm.outcomeId]
            })
          }
      )
      .then(() => {
        ElMessage.success('添加成功！')
        updateData(true);
        if (!con) controlStatus.addDrawer = false
      })
      .catch(e => {
        ElMessage.error('添加失败！')
        console.log(e)
      })
      .finally(() => {
        adding.value = false;
      });
}

const deleting = ref(false)

function commitDelete() {
  deleting.value = true;
  (async () => {

    let successCount = 0;
    let failedCount = 0;

    for (const item of multipleSelection.value) {
      try {
        (await baseServer.delete(`/api/coper/pknow/${item.id}/`)).data
        successCount++;
      } catch (e) {
        console.log(e);
        ElMessage.error(`过程知识 ${item.name} 删除失败：${e}`);
        failedCount++;
      }
    }
    ElMessage.info(`删除完毕 ${successCount} 成功；${failedCount} 失败`);
    deleting.value = false;
    updateData(true);
  })()

}


const addDialogSelectedTask = ref(null);

const dksFilter = computed(() => {
  if (!addDialogSelectedTask.value) return [];
  return dks.value.filter((e) => e.task.id === addDialogSelectedTask.value.id);
});

function resetAddForm() {
  addForm.value.cknowledge = undefined;
  addForm.value.cnot = false;
  addForm.value.oknowledge = undefined;
  addForm.value.onot = false;
}

watch(addDialogSelectedTask, resetAddForm, {immediate: true});

</script>

<template>
  <div v-if="dataAvailable" style="display: flex; width: 100%; flex-direction: column; gap: 12px">
    <div style="display: flex; flex-direction: column; align-items: center">
      <el-text style="font-weight: bold; font-size: large">
        过程性知识列表
      </el-text>
      <el-text>
        系统中共有 {{ pks.length }} 个过程性知识
      </el-text>
    </div>
    <el-card style="margin: 24px;">
      <div style="display: flex; flex-direction: column; gap: 12px">
        <div style="display: flex; gap: 8px; align-items: center">
          <el-switch v-model="expandBadge"/>
          <div>展开陈述知识徽章</div>
        </div>

        <el-table
            v-loading="deleting"
            :data="pks"
            element-loading-text="loadDesc"
            height="100%"
            @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection"/>
          <el-table-column label="编号" prop="id" sortable/>
          <el-table-column
              label="任务"
              :filter-method="(value, row) => row.condition[0].task.title === value"
              :filters="taskFilter"
              sortable
          >
            <template #default="scope">
              {{ scope.row.condition[0].task.title }}
            </template>
          </el-table-column>
          <el-table-column label="IF">
            <template #default="scope">
              <ConditionView
                  v-for="c in scope.row.condition"
                  :key="c.id"
                  :condition="c"
                  :expend="expandBadge"
              />
            </template>
          </el-table-column>
          <el-table-column label="THEN">
            <template #default="scope">
              <OutcomeView
                  v-for="o in scope.row.outcome"
                  :key="o.id"
                  :expend="expandBadge"
                  :outcome="o"
              />
            </template>
          </el-table-column>
          <el-table-column label="基础活跃时间(ms)" width="140px" prop="activetime"/>
          <el-table-column label="优先级" prop="order"/>
          <el-table-column label="访问权限" prop="purview"/>
          <el-table-column :sort-by="e => new Date(e).getTime()" label="创建时间" prop="created_at" sortable>
            <template #default="scope">
              {{ new Date(scope.row.created_at).toLocaleString() }}
            </template>
          </el-table-column>
          <el-table-column
              :filter-method="(value, row) => row.creator.username === value"
              :filters="creatorFilter"
              label="创建者"
              sortable
          >
            <template #default="scope">
              {{ scope.row.creator.username }}
            </template>
          </el-table-column>
        </el-table>
      </div>

    </el-card>
    <div
        style="position: fixed; bottom: 120px; right: 50px; width: 100px; z-index: 20; display: flex; flex-direction: column; align-items: center; gap: 12px">

      <el-button v-if="selected" round style="width: 100%; margin-left: 0" type="danger" @click="commitDelete">
        <div style="display: flex; align-items: center; gap: 4px">
          <el-icon>
            <DeleteFilled/>
          </el-icon>
          <div style="font-weight: bold">
            删除所选
          </div>
        </div>
      </el-button>
      <el-button round style="width: 100%; margin-left: 0" type="success" @click="controlStatus.addDrawer = true">
        <div style="display: flex; align-items: center; gap: 4px">
          <el-icon>
            <Plus/>
          </el-icon>
          <div style="font-weight: bold">
            添加
          </div>
        </div>
      </el-button>
    </div>
  </div>
  <div v-else
       style="height: 200px; width: 100%; display: flex; flex-direction: column; gap: 8px; align-items: center; justify-content: center">
    <el-progress :percentage="100 * (loadProgress / totalLoadCount)" type="dashboard"/>
    <div>
      加载中……
    </div>
  </div>

  <el-dialog
      v-model="controlStatus.addDrawer"
      title="添加过程性知识"
  >
    <template #default>
      <div style="display: flex; flex-direction: column; gap: 12px">
        <el-select v-model="addDialogSelectedTask" placeholder="请选择任务" style="font-weight: bold" value-key="id">
          <el-option v-for="item in tasks" :key="item.id" :label="item.title" :value="item"/>
        </el-select>
        <el-form v-if="addDialogSelectedTask !== null" :model="addForm">
          <el-form-item label="条件(IF)" prop="cknowledge">
            <el-select v-model="addForm.cknowledge" filterable placeholder="IF" value-key="id">
              <el-option v-for="item in dksFilter" :key="item.id" :label="item.title" :value="item"/>
            </el-select>
          </el-form-item>
          <el-form-item label="条件前缀" prop="cnot">
            <el-checkbox v-model="addForm.cnot" label="NOT"/>
          </el-form-item>
          <el-form-item label="结果(THEN)" prop="oknowledge">
            <el-select v-model="addForm.oknowledge" filterable placeholder="THEN" value-key="id">
              <el-option v-for="item in dksFilter" :key="item.id" :label="item.title" :value="item"/>
            </el-select>
          </el-form-item>
          <el-form-item label="结果前缀" prop="onot">
            <el-checkbox v-model="addForm.onot" label="NOT"/>
          </el-form-item>
          <el-form-item label="程序性过程时间（毫秒）" prop="activetime">
            <el-input-number :step="500" v-model="addForm.activetime"/>
          </el-form-item>
          <el-form-item label="优先级（越低越优先）" prop="order">
            <el-input-number v-model="addForm.order"/>
          </el-form-item>
        </el-form>
      </div>
    </template>
    <template #footer>
      <div v-show="addDialogSelectedTask !== null" style="flex: auto">
        <el-button :disabled="adding" :loading="adding" plain type="primary" @click="commitAdd(true)">
          添加过程性知识并继续
        </el-button>
        <el-button :disabled="adding" :loading="adding" type="primary" @click="commitAdd()">添加过程性知识</el-button>
      </div>
    </template>
  </el-dialog>

</template>

<style scoped>

</style>
<script setup>

import {computed, onMounted, reactive, ref} from "vue";
import {baseServer} from "../../plugins/axios.js";
import {ElMessage} from "element-plus";
import {DeleteFilled, Plus, Search} from "@element-plus/icons-vue";
import {useIdentityStore} from "../../plugins/store.js";
import {STATUS_VARIABLE, TASK} from "../../utils/lazyapi.js";

const identityStore = useIdentityStore();

const controlStatus = reactive({
  addDrawer: false,
  editDrawer: false
});

const addForm = ref({
  task: undefined,
  name: '',
  values: '',
  description: ''
});

const editForm = ref({
  id: 0,
  task: {},
  name: '',
  values: '',
  description: ''
});

const totalLoadCount = 2;
const loadProgress = ref(0);

const tasks = ref(undefined);
const statusVar = ref(undefined);

function updateData(hard = false) {

  dataAvailable.value = false;
  tasks.value = undefined;
  statusVar.value = undefined;
  loadProgress.value = 0;

  Promise.all([
    TASK.get(hard)
        .then(data => {
          tasks.value = data;
          loadProgress.value++;
        }),
    STATUS_VARIABLE.get(hard)
        .then(data => {
          statusVar.value = data;
          loadProgress.value++;
        })
  ])
      .then(() => {
        dataAvailable.value = true;
        loadProgress.value++;
      })
      .catch(e => {
        console.log(e);
        ElMessage.error('数据获取失败');
      });
}

const searchText = ref('');

const statusVarFilter = computed(() => {
  if (searchText.value.length > 0) {
    return statusVar.value.filter(e => (
        e.name.includes(searchText.value) ||
        e.values.includes(searchText.value) ||
        e.creator.username.includes(searchText.value) ||
        e.task.title.includes(searchText.value) ||
        e.id.toString().includes(searchText.value) ||
        e.description.includes(searchText.value)
    ))
  } else {
    return statusVar.value
  }
});

const taskFilter = computed(() => {
  if (tasks.value) {
    console.log(tasks.value)
    return tasks.value.map(e => ({
      text: e.title,
      value: e.title,
    }))
  } else return null
});

const creatorFilter = computed(() => {
  if (!statusVar.value) return undefined;
  console.log(statusVar.value)
  const s = new Set();
  statusVar.value.forEach(e => {
    s.add(e.creator.username);
  });
  return Array.from(s).map(e => ({text: e, value: e}));
})

const multipleSelection = ref([]);

const selected = computed(() => multipleSelection.value.length > 0);

function handleSelectionChange(newSelection) {
  multipleSelection.value = newSelection
}

function edit(row) {
  editForm.value = row
  controlStatus.editDrawer = true
}

const dataAvailable = ref(false);

onMounted(() => {
  updateData()
});

const addFormRules = reactive({
  task: [
    {
      trigger: "blur",
      message: "请选择任务",
      required: true
    }
  ],
  name: [
    {
      trigger: "blur",
      message: "相同名称的状态变量已存在",
      validator: (rule, value, callback) => {
        if (statusVar.value) {
          return !statusVar.value.some((item) => item.name === value);
        }
        return false;
      }
    },
    {
      trigger: "blur",
      message: "请填写名称",
      required: true
    }
  ],
  values: [
    {
      trigger: "blur",
      message: "请填写状态值",
      required: true
    }
  ]
});

const editFormRules = addFormRules;

const isAdding = ref(false);
const isEditing = ref(false);

const eaf = ref();
const eef = ref();

function resetAddForm() {
  addForm.value.name = "";
  addForm.value.description = "";
  addForm.value.values = "";
}

async function commitAdd(con = false) {
  if (!eaf.value) return;
  isAdding.value = true;
  await eaf.value.validate(async (valid) => {
    if (valid) {
      await baseServer.post('/api/coper/statusvar/', {
        name: addForm.value.name,
        task: addForm.value.task.id,
        values: addForm.value.values,
        description: addForm.value.description,
        creator: identityStore.identity.id,
      })
          .then(() => {
            ElMessage.success('添加成功');
            updateData(true);
            if (con) {
              resetAddForm();
            } else {
              controlStatus.addDrawer = false;
            }
          })
          .catch(e => {
            ElMessage.error(`添加失败：${e}`);
            console.log(e);
          })
    }
  });
  isAdding.value = false;

}

async function commitEdit() {
  if (!eef.value) return;
  isEditing.value = true;
  await eef.value.validate(async (valid) => {
    if (valid) {
      await baseServer.put(`/api/coper/statusvar/${editForm.value.id}/`, {
        name: editForm.value.name,
        task: editForm.value.task.id,
        values: editForm.value.values,
        description: editForm.value.description,
        creator: identityStore.identity.id,
      })
          .then(() => {
            ElMessage.success('编辑成功');
            updateData(true);
          })
          .catch(e => {
            ElMessage.error(`编辑失败：${e}`);
            console.log(e);
          })
    }
  });
  isEditing.value = false;
}

const deleting = ref(false);

async function deleteSingle() {
  deleting.value = true;
  try {
    (await baseServer.delete(`/api/coper/statusvar/${editForm.value.id}/`)).data
  } catch (e) {
    console.log(e);
    ElMessage.error(`初始状态 ${editForm.value.name} 删除失败：${e}`);
  }
  deleting.value = false;
  controlStatus.editDrawer = false;
  updateData(true);
}

function commitDelete() {
  deleting.value = true;
  (async () => {

    let successCount = 0;
    let failedCount = 0;

    for (const item of multipleSelection.value) {
      try {
        (await baseServer.delete(`/api/coper/statusvar/${item.id}/`)).data
        successCount++;
      } catch (e) {
        console.log(e);
        ElMessage.error(`状态变量 ${item.name} 删除失败：${e}`);
        failedCount++;
      }
    }
    ElMessage.info(`删除完毕 ${successCount} 成功；${failedCount} 失败`);
    deleting.value = false;
    updateData(true);
  })()

}


</script>

<template>
  <div v-if="dataAvailable" style="display: flex; width: 100%; flex-direction: column; gap: 12px">
    <div style="display: flex; flex-direction: column; align-items: center">
      <el-text style="font-weight: bold; font-size: large">
        状态变量列表
      </el-text>
      <el-text>
        系统中共有 {{ statusVar.length }} 个状态变量
      </el-text>
    </div>
    <el-card style="margin: 24px;">
      <el-table v-loading="deleting" element-loading-text="正在获取……" :data="statusVarFilter"
                @selection-change="handleSelectionChange"
                height="512px">
        <el-table-column type="selection"/>
        <el-table-column prop="id" label="编号" sortable/>
        <el-table-column label="任务" sortable :filters="taskFilter"
                         :filter-method="(value, row) => row.task.title === value">
          <template #default="scope">
            {{ scope.row.task.title }}
          </template>
        </el-table-column>
        <el-table-column prop="name" label="名称"/>
        <el-table-column prop="values" label="值"/>
        <el-table-column prop="description" label="描述"/>
        <el-table-column prop="created_at" sortable :sort-by="e => new Date(e).getTime()" label="创建时间">
          <template #default="scope">
            {{ new Date(scope.row.created_at).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column
            sortable
            :filters="creatorFilter"
            :filter-method="(value, row) => row.creator.username === value"
            label="创建者"
        >
          <template #default="scope">
            {{ scope.row.creator.username }}
          </template>
        </el-table-column>
        <el-table-column fixed="right" width="200">
          <template #header>
            <el-input placeholder="搜索任意内容" v-model="searchText" clearable>
              <template #prefix>
                <el-icon>
                  <Search/>
                </el-icon>
              </template>
            </el-input>
          </template>
          <template #default="scope">
            <el-button v-if="scope.row.creator.id === identityStore.identity.id" link type="primary" size="small"
                       @click="edit(scope.row)">
              编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <div
        style="position: fixed; bottom: 120px; right: 50px; width: 100px; z-index: 20; display: flex; flex-direction: column; align-items: center; gap: 12px">

      <el-button v-if="selected" type="danger" style="width: 100%; margin-left: 0" round @click="commitDelete">
        <div style="display: flex; align-items: center; gap: 4px">
          <el-icon>
            <DeleteFilled/>
          </el-icon>
          <div style="font-weight: bold">
            删除所选
          </div>
        </div>
      </el-button>
      <el-button style="width: 100%; margin-left: 0" type="success" @click="controlStatus.addDrawer = true" round>
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
    <el-progress type="dashboard" :percentage="100 * (loadProgress / totalLoadCount)"/>
    <div>
      加载中……
    </div>
  </div>
  <el-dialog
      v-model="controlStatus.addDrawer"
      title="添加状态变量"
  >
    <template #default>
      <el-form :model="addForm" ref="eaf" :rules="addFormRules">
        <el-form-item prop="task" label="任务">
          <el-select v-model="addForm.task" value-key="title" placeholder="作用于任务">
            <el-option v-for="item in tasks" :label="item.title" :value="item" :key="item.id"/>
          </el-select>
        </el-form-item>
        <el-form-item prop="name" label="状态变量名">
          <el-input v-model="addForm.name"/>
        </el-form-item>
        <el-form-item prop="values" label="状态变量值">
          <el-input v-model="addForm.values"/>
        </el-form-item>
        <el-form-item prop="description" label="描述">
          <el-input v-model="addForm.description" type="textarea"/>
        </el-form-item>
      </el-form>
    </template>
    <template #footer>
      <div style="flex: auto">
        <el-button type="primary" @click="commitAdd(true)" plain :loading="isAdding">添加状态变量并继续</el-button>
        <el-button type="primary" @click="commitAdd()" :loading="isAdding">添加状态变量</el-button>
      </div>
    </template>
  </el-dialog>

  <el-drawer
      v-model="controlStatus.editDrawer"
      direction="rtl"
  >
    <template #header>
      <h4>编辑状态变量</h4>
    </template>
    <template #default>
      <el-form :model="editForm" ref="eef" :rules="editFormRules">
        <el-form-item prop="task" label="任务">
          <el-select v-model="editForm.task" value-key="title">
            <el-option v-for="item in tasks" :label="item.title" :value="item" :key="item.id"/>
          </el-select>
        </el-form-item>
        <el-form-item prop="name" label="状态变量名">
          <el-input v-model="editForm.name"/>
        </el-form-item>
        <el-form-item prop="values" label="状态变量值">
          <el-input v-model="editForm.values"/>
        </el-form-item>
        <el-form-item prop="description" label="描述">
          <el-input v-model="editForm.description" type="textarea"/>
        </el-form-item>
      </el-form>
    </template>
    <template #footer>
      <div style="flex: auto">
        <el-button type="danger" @click="deleteSingle" :loading="deleting" :disabled="isEditing">删除</el-button>
        <el-button type="primary" @click="commitEdit" :loading="isEditing" :disabled="deleting">完成编辑</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<style scoped>

</style>
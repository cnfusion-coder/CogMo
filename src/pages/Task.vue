<script setup>

import {computed, onMounted, reactive, ref} from "vue";
import {baseServer} from "../plugins/axios";
import {ElMessage} from "element-plus";
import {DeleteFilled, Plus, Search} from "@element-plus/icons-vue";
import {useIdentityStore} from "../plugins/store.js";
import {REACTOR_MODEL, TASK} from "../utils/lazyapi.js";

const selected = computed(() => multipleSelection.value.length !== 0);

const identityStore = useIdentityStore();

const loadFailed = ref(false);
const loadProgress = ref(0);
const totalLoadCount = 2;
const dataAvailable = ref(false);

const tasks = ref(null);
const reactormodels = ref(null);

const searchText = ref('');

const taskFilter = computed(() => {
  if (searchText.value.length > 0) {
    return tasks.value.filter(e => (
        e.title.includes(searchText.value) ||
        e.creator.username.includes(searchText.value) ||
        e.reactormodel.title.includes(searchText.value) ||
        e.id.toString().includes(searchText.value) ||
        e.description.includes(searchText.value)
    ))
  } else {
    return tasks.value
  }
});

const reactorModelFilter = computed(() => {
  if (!reactormodels.value) return undefined;
  return reactormodels.value.map(e => ({
    text: e.title,
    value: e.title
  }));
});

const creatorFilter = computed(() => {
  if (!tasks.value) return undefined;
  const s = new Set();
  tasks.value.forEach(e => {
    s.add(e.creator.username);
  });
  return Array.from(s).map(e => ({text: e, value: e}));
})

function updateData(hard = false) {
  dataAvailable.value = false;
  loadFailed.value = false;
  loadProgress.value = 0;

  Promise.all([
    TASK.get(hard)
        .then(data => {
          tasks.value = data
          loadProgress.value++
        }),
    REACTOR_MODEL.get(hard)
        .then(data => {
          reactormodels.value = data
          loadProgress.value++
        })
  ])
      .then(() => {
        dataAvailable.value = true;
        loadFailed.value = true;
      })
      .catch(e => {
        ElMessage.error('数据获取失败');
        console.log(e);
      })
}

onMounted(() => {
  updateData();
});

const controlStatus = reactive({
  addDrawer: false,
  editDrawer: false
});


const addForm = reactive({
  reactormodel: undefined,
  title: '',
  description: ''
});

const editForm = ref({
  id: 0,
  creator: {},
  title: '',
  description: '',
  reactormodel: undefined,
});

const addFormRules = reactive({
  title: [
    {
      trigger: "blur",
      message: "相同标题的任务已存在",
      validator: (rule, value, callback) => {
        if (tasks.value) {
          return !tasks.value.some((item) => item.title === value);
        }
        return false;
      }
    },
    {
      trigger: "blur",
      message: "任务名称不可为空",
      required: true
    }
  ],
  reactormodel: [
    {
      trigger: "blur",
      message: "请选择对应的堆型",
      required: true
    },
  ],
  description: []
});

const editFormRules = reactive({
  title: [
    {
      trigger: "blur",
      message: "相同标题的任务已存在",
      validator: (rule, value, callback) => {
        if (tasks.value) {
          return !tasks.value.some((item) => item.title === value);
        }
        return false;
      }
    },
    {
      trigger: "blur",
      message: "任务名称不可为空",
      required: true
    }
  ],
  reactormodel: [
    {
      trigger: "blur",
      message: "请选择对应的堆型",
      required: true
    },
  ],
  description: []
});

const isAdding = ref(false);

const eaf = ref();

function resetAddForm() {
  addForm.title = "";
  addForm.description = "";
}

async function commitAdd(con = false) {
  if (!eaf.value) return;
  isAdding.value = true;
  await eaf.value.validate(async (valid) => {
    if (valid) {
      await baseServer.post('/api/coper/task/', {
        title: addForm.title,
        reactormodel: addForm.reactormodel.id,
        description: addForm.description,
        creator: identityStore.identity.id
      })
          .then(() => {
            ElMessage.success('添加成功！');
            updateData(true);
            if (con) {
              resetAddForm();
            } else {
              controlStatus.addDrawer = false;
            }
          })
          .catch(e => {
            ElMessage.error('添加失败！');
            console.log(e);
          })
    }
  });
  isAdding.value = false;
}

const isEditing = ref(false);

const eef = ref();

async function commitEdit() {

  if (!eef.value) return;
  isEditing.value = true;

  await eef.value.validate(async (valid) => {
    if (valid) {
      await baseServer.put(`/api/coper/task/${editForm.value.id}/`, {
        title: editForm.value.title,
        description: editForm.value.description,
        creator: identityStore.identity.id,
        reactormodel: editForm.value.reactormodel.id
      })
          .then(() => {
            ElMessage.success('修改成功！');
            controlStatus.editDrawer = false;
            updateData(true)
          })
          .catch(e => {
            ElMessage.error('修改失败！');
            console.log(e)
          });
    }
  });
  isEditing.value = false;
}

let successCount = 0;
let failedCount = 0;

const deleting = ref(false);

async function deleteTaskById(item) {
  try {
    (await baseServer.delete(`/api/coper/task/${item.id}/`)).data
    successCount++;
  } catch (e) {
    console.log(e);
    ElMessage.error(`陈述知识 ${item.name} 删除失败：${e}`);
    failedCount++;
  }
}

function deleteSingle() {
  (async () => {
    await deleteTaskById(editForm.value);
    controlStatus.editDrawer = false;
    updateData(true);
  })();
}

function commitDelete() {
  deleting.value = true;
  successCount = 0;
  failedCount = 0;
  (async () => {
    for (const item of multipleSelection.value) {
      await deleteTaskById(item);
    }
    ElMessage.info(`删除完毕 ${successCount} 成功；${failedCount} 失败`);
    deleting.value = false;
    updateData(true);
  })();
}

const multipleSelection = ref([]);

function handleSelectionChange(newSelection) {
  multipleSelection.value = newSelection
}

function edit(row) {
  editForm.value = row
  controlStatus.editDrawer = true
}
</script>

<template>

  <div v-if="dataAvailable" style="display: flex; width: 100%; flex-direction: column; gap: 4px">
    <div style="display: flex; flex-direction: column; align-items: center">
      <el-text style="font-weight: bold; font-size: large">
        任务列表
      </el-text>
      <el-text>
        系统中共有 {{ tasks.length }} 项任务
      </el-text>
    </div>
    <el-card style="margin: 24px;">
      <div style="width: 100%; display: flex; flex-direction: column; align-items: center; gap: 8px">
        <el-table v-loading="deleting" :data="taskFilter"
                  height="512px"
                  style="width: 100%"
                  @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="55"/>
          <el-table-column label="编号" prop="id" sortable width="80"/>
          <el-table-column
              :filter-method="(value, row) => row.reactormodel.title === value"
              :filters="reactorModelFilter"
              label="堆型"
              sortable
              width="100"
          >
            <template #default="scope">
              {{ scope.row.reactormodel.title }}
            </template>
          </el-table-column>
          <el-table-column label="任务名" prop="title" width="200"/>
          <el-table-column label="描述" prop="description"/>
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
          <el-table-column :sort-by="e => new Date(e).getTime()" label="创建时间" prop="created_at" sortable>
            <template #default="scope">
              {{ new Date(scope.row.created_at).toLocaleString() }}
            </template>
          </el-table-column>
          <el-table-column fixed="right" width="200">
            <template #header>
              <el-input v-model="searchText" clearable placeholder="搜索任意内容">
                <template #prefix>
                  <el-icon>
                    <Search/>
                  </el-icon>
                </template>
              </el-input>
            </template>
            <template #default="scope">
              <el-button v-if="scope.row.creator.id === identityStore.identity.id" link size="small" type="primary"
                         @click="edit(scope.row)">
                编辑
              </el-button>
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
      title="添加任务"
  >
    <template #default>
      <el-form :model="addForm" ref="eaf" :rules="addFormRules">
        <el-form-item label="任务名" prop="title">
          <el-input v-model="addForm.title"/>
        </el-form-item>
        <el-form-item label="目标堆型" prop="reactormodel">
          <el-select v-model="addForm.reactormodel" placeholder="任务作用的目标堆型" value-key="title">
            <el-option v-for="item in reactormodels" :key="item.id" :label="item.title" :value="item"/>
          </el-select>
        </el-form-item>
        <el-form-item label="任务描述" prop="description">
          <el-input v-model="addForm.description" type="textarea"/>
        </el-form-item>
      </el-form>
    </template>
    <template #footer>
      <div style="flex: auto">
        <el-button plain type="primary" :loading="isAdding" @click="commitAdd(true)">添加任务并继续</el-button>
        <el-button type="primary" :loading="isAdding" @click="commitAdd()">添加任务</el-button>
      </div>
    </template>
  </el-dialog>

  <el-drawer
      v-model="controlStatus.editDrawer"
      direction="rtl"
  >
    <template #header>
      <h4>编辑任务</h4>
    </template>
    <template #default>
      <el-form :model="editForm" ref="eef" :rules="editFormRules">
        <el-form-item label="任务名">
          <el-input v-model="editForm.title"/>
        </el-form-item>
        <el-form-item label="目标堆型" prop="reactormodel">
          <el-select v-model="editForm.reactormodel" placeholder="任务作用的目标堆型" value-key="title">
            <el-option v-for="item in reactormodels" :key="item.id" :label="item.title" :value="item"/>
          </el-select>
        </el-form-item>
        <el-form-item label="任务描述">
          <el-input v-model="editForm.description" type="textarea"/>
        </el-form-item>
      </el-form>
    </template>
    <template #footer>
      <div style="flex: auto">
        <el-button type="danger" :loading="deleting" :disabled="isEditing" @click="deleteSingle">删除</el-button>
        <el-button type="primary" :loading="isEditing" :disabled="deleting" @click="commitEdit">提交编辑</el-button>
      </div>
    </template>
  </el-drawer>

</template>

<style scoped>

</style>
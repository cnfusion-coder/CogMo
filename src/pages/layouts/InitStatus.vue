<script setup>

import {computed, onMounted, reactive, ref} from "vue";
import {baseServer} from "../../plugins/axios.js";
import {ElMessage} from "element-plus";
import {DeleteFilled, Plus, Search} from "@element-plus/icons-vue";
import {useIdentityStore} from "../../plugins/store.js";
import {INIT_STATUS, TASK} from "../../utils/lazyapi.js";

const identityStore = useIdentityStore();

const controlStatus = reactive({
  addDrawer: false,
  editDrawer: false
});

const tasks = ref(undefined);
const initstatus = ref(undefined);

const addForm = ref({
  task: undefined,
  name: '',
  status: '',
  description: ''
});

const editForm = ref({
  id: 0,
  task: {},
  name: '',
  status: '',
  description: ''
});

const totalLoadCount = 2;
const loadProgress = ref(0);

function updateData(hard = false) {

  dataAvailable.value = false;
  tasks.value = undefined;
  initstatus.value = undefined;
  loadProgress.value = 0;

  Promise.all([
    TASK.get(hard)
        .then(data => {
          tasks.value = data;
          loadProgress.value++;
        }),
    INIT_STATUS.get(hard)
        .then(data => {
          initstatus.value = data;
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

const initstatusFilter = computed(() => {
  if (searchText.value.length > 0) {
    return initstatus.value.filter(e => (
        e.name.includes(searchText.value) ||
        e.status.includes(searchText.value) ||
        e.creator.username.includes(searchText.value) ||
        e.task.title.includes(searchText.value) ||
        e.id.toString().includes(searchText.value) ||
        e.description.includes(searchText.value)
    ))
  } else {
    return initstatus.value
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
  if (!initstatus.value) return undefined;
  console.log(initstatus.value)
  const s = new Set();
  initstatus.value.forEach(e => {
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
        if (initstatus.value) {
          return !initstatus.value.some((item) => item.name === value);
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
  status: [
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
  addForm.value.status = "";
}

async function commitAdd(con = false) {
  if (!eaf.value) return;
  isAdding.value = true;
  await eaf.value.validate(async (valid) => {
    if (valid) {
      await baseServer.post('/api/coper/initstatus/', {
        name: addForm.value.name,
        task: addForm.value.task.id,
        status: addForm.value.status,
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
          });
    }
  });
  isAdding.value = false;
}

async function commitEdit() {
  if (!eef.value) return;
  isEditing.value = true;
  await eef.value.validate(async (valid) => {
    if (valid) {
      await baseServer.put(`/api/coper/initstatus/${editForm.value.id}/`, {
        name: editForm.value.name,
        task: editForm.value.task.id,
        status: editForm.value.status,
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
    (await baseServer.delete(`/api/coper/initstatus/${editForm.value.id}/`)).data
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
        (await baseServer.delete(`/api/coper/initstatus/${item.id}/`)).data
        successCount++;
      } catch (e) {
        console.log(e);
        ElMessage.error(`初始状态 ${item.name} 删除失败：${e}`);
        failedCount++;
      }
    }
    ElMessage.info(`删除完毕 ${successCount} 成功；${failedCount} 失败`);
    deleting.value = false;
    updateData(true);
  })();

}


</script>

<template>
  <div v-if="dataAvailable" style="display: flex; width: 100%; flex-direction: column; gap: 12px">
    <div style="display: flex; flex-direction: column; align-items: center">
      <el-text style="font-weight: bold; font-size: large">
        初始状态列表
      </el-text>
      <el-text>
        系统中共有 {{ initstatus.length }} 个初始状态
      </el-text>
    </div>
    <el-card style="margin: 24px;">
      <el-table v-loading="deleting" :data="initstatusFilter" element-loading-text="正在获取……"
                height="512px"
                @selection-change="handleSelectionChange">
        <el-table-column type="selection"/>
        <el-table-column label="编号" prop="id" sortable/>
        <el-table-column :filter-method="(value, row) => row.task.title === value" :filters="taskFilter" label="任务"
                         sortable>
          <template #default="scope">
            {{ scope.row.task.title }}
          </template>
        </el-table-column>
        <el-table-column label="名称" prop="name"/>
        <el-table-column label="状态" prop="status"/>
        <el-table-column label="描述" prop="description"/>
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
      title="添加初始状态"
  >
    <template #default>
      <el-form ref="eaf" :model="addForm" :rules="addFormRules">
        <el-form-item label="任务" prop="task">
          <el-select v-model="addForm.task" placeholder="作用于任务" value-key="title">
            <el-option v-for="item in tasks" :key="item.id" :label="item.title" :value="item"/>
          </el-select>
        </el-form-item>
        <el-form-item label="初始状态名" prop="name">
          <el-input v-model="addForm.name"/>
        </el-form-item>
        <el-form-item label="初始状态值" prop="status">
          <el-input v-model="addForm.status"/>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="addForm.description" type="textarea"/>
        </el-form-item>
      </el-form>
    </template>
    <template #footer>
      <div style="flex: auto">
        <el-button :loading="isAdding" plain type="primary" @click="commitAdd(true)">添加初始状态并继续</el-button>
        <el-button :loading="isAdding" type="primary" @click="commitAdd()">添加初始状态</el-button>
      </div>
    </template>
  </el-dialog>

  <el-drawer
      v-model="controlStatus.editDrawer"
      direction="rtl"
  >
    <template #header>
      <h4>编辑初始状态</h4>
    </template>
    <template #default>
      <el-form ref="eef" :model="editForm" :rules="editFormRules">
        <el-form-item label="任务" prop="task">
          <el-select v-model="editForm.task" value-key="title">
            <el-option v-for="item in tasks" :key="item.id" :label="item.title" :value="item"/>
          </el-select>
        </el-form-item>
        <el-form-item label="初始状态名" prop="name">
          <el-input v-model="editForm.name"/>
        </el-form-item>
        <el-form-item label="初始状态值" prop="status">
          <el-input v-model="editForm.status"/>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="editForm.description" type="textarea"/>
        </el-form-item>
      </el-form>
    </template>
    <template #footer>
      <div style="flex: auto">
        <el-button :disabled="isEditing" :loading="deleting" type="danger" @click="deleteSingle">删除</el-button>
        <el-button :disabled="deleting" :loading="isEditing" type="primary" @click="commitEdit">完成编辑</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<style scoped>

</style>
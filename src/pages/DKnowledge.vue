<script setup>

import {computed, onMounted, reactive, ref} from "vue";
import {baseServer} from "../plugins/axios";
import {ElMessage} from "element-plus";
import {trunkTypeFilters, trunktypes} from "../utils/models.js";
import {DeleteFilled, Plus, Search} from "@element-plus/icons-vue";
import {useIdentityStore} from "../plugins/store.js";
import {D_KNOWLEDGE, TASK} from "../utils/lazyapi.js";

const controlStatus = reactive({
  addDrawer: false,
  editDrawer: false
});

const totalLoadCount = 2;
const loadProgress = ref(0);

const tasks = ref(undefined);
const dks = ref(undefined);

const dataAvailable = ref(false);

const identityStore = useIdentityStore();

function updateData(hard = false) {
  tasks.value = undefined;
  dks.value = undefined;
  loadProgress.value = 0;
  dataAvailable.value = false;

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
        })
  ])
      .then(() => {
        dataAvailable.value = true;
      })
      .catch(e => {
        console.log(e);
        ElMessage.error('数据获取失败');
      });
}

const taskFilter = computed(() => {
  if (tasks.value) {
    console.log(tasks.value)
    return tasks.value.map(e => ({
      text: e.title,
      value: e.title,
    }))
  } else return undefined
});

const creatorFilter = computed(() => {
  if (!dks.value) return undefined;
  console.log(dks.value)
  const s = new Set();
  dks.value.forEach(e => {
    s.add(e.creator.username);
  });
  return Array.from(s).map(e => ({text: e, value: e}));
})

/**
 * @type {{
 *   value: DKnowledge[]
 * }}
 */
const multipleSelection = ref([]);

const selected = computed(() => multipleSelection.value.length > 0);

function handleSelectionChange(newSelection) {
  multipleSelection.value = newSelection
}

function edit(row) {
  editForm.value = row
  controlStatus.editDrawer = true
}

/**
 * @type {{
 *   value: string
 * }}
 */
const searchText = ref('');

const filterKeywordInclude = (e) => (e.title.includes(searchText.value) ||
    e.creator.username.includes(searchText.value) ||
    e.task.title.includes(searchText.value) ||
    e.id.toString().includes(searchText.value) ||
    e.description.includes(searchText.value) ||
    e.trunktype.name.includes(searchText.value));


const dksFilter = computed(() => {
  if (searchText.value.length > 0) {
    if (searchText.value.startsWith("KNO ")) {
      return dks.value.filter(e => filterKeywordInclude(e) || e.id.toString() === (searchText.value.substring(4)));
    } else if (searchText.value.startsWith("KNO")) {
      return dks.value.filter(e => filterKeywordInclude(e) || e.id.toString() === (searchText.value.substring(3)));
    } else {
      return dks.value.filter(e => filterKeywordInclude(e));
    }
  } else {
    return dks.value;
  }
});

onMounted(() => {
  updateData()
});

const addForm = ref({
  task: undefined,
  title: '',
  status: '',
  description: '',
  trunktype: undefined
});

const addFormRules = reactive({
  title: [
    {
      trigger: "blur",
      message: "请填写知识内容",
      required: true
    }
  ],
  trunktype: [
    {
      required: true,
      message: "请选择模块类型",
      trigger: "blur"
    }
  ],
  task: [
    {
      required: true,
      message: "请选择对应任务",
      trigger: "blur"
    }
  ]
});

const editForm = ref({
  id: 0,
  task: undefined,
  title: '',
  status: '',
  description: '',
  trunktype: {}
});

const editFormRules = addFormRules;

const eaf = ref();
const eef = ref();

const isAdding = ref(false);
const isEditing = ref(false);

function resetAddForm() {
  addForm.value.title = "";
  addForm.value.trunktype = undefined;
  addForm.value.description = "";
}

async function commitAdd(con = false) {
  if (!eaf.value) return;

  isAdding.value = true;

  await eaf.value.validate(async (valid) => {
    if (valid) {
      await baseServer.post('/api/coper/dk/', {
        title: addForm.value.title,
        description: addForm.value.description,
        purview: identityStore.identity.role,
        trunktype: addForm.value.trunktype.value,
        task: addForm.value.task.id,
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
      await baseServer.put(`/api/coper/dk/${editForm.value.id}/`, {
        title: editForm.value.title,
        description: editForm.value.description,
        purview: identityStore.identity.role,
        trunktype: editForm.value.trunktype.value,
        task: editForm.value.task.id,
        creator: identityStore.identity.id,
      })
          .then(() => {
            ElMessage.success('编辑成功');
            updateData(true);
          })
          .catch(e => {
            ElMessage.error(`编辑失败：${e}`);
            console.log(e);
          });
    }
  });
  isEditing.value = false;
}

const deleting = ref(false);

async function deleteSingle() {
  deleting.value = true;
  try {
    (await baseServer.delete(`/api/coper/dk/${editForm.value.id}/`)).data
  } catch (e) {
    console.log(e);
    ElMessage.error(`陈述知识 ${editForm.value.title} 删除失败：${e}`);
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
        (await baseServer.delete(`/api/coper/dk/${item.id}/`)).data
        successCount++;
      } catch (e) {
        console.log(e);
        ElMessage.error(`陈述知识 ${item.title} 删除失败：${e}`);
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
        陈述性知识列表
      </el-text>
      <el-text>
        系统中共有 {{ dks.length }} 个陈述性知识
      </el-text>
    </div>
    <el-card style="margin: 24px; height: 100%;">
      <el-table v-loading="deleting" :data="dksFilter" element-loading-text="正在获取……"
                @selection-change="handleSelectionChange" height="100%">
        <el-table-column type="selection"/>
        <el-table-column label="编号" prop="id" sortable/>
        <el-table-column :filter-method="(value, row) => row.task.title === value" :filters="taskFilter" label="任务"
                         sortable>
          <template #default="scope">
            {{ scope.row.task.title }}
          </template>
        </el-table-column>
        <el-table-column label="名称" prop="title"/>
        <el-table-column :filter-method="(value, row) => row.trunktype.value === value" :filters="trunkTypeFilters"
                         label="认知模块"
                         width="140px"
                         prop="trunktype">
          <template #default="scope">
            <el-tag :color="scope.row.trunktype.tint + '20'"
                    :style="{color: scope.row.trunktype.tint, borderColor: scope.row.trunktype.tint}">
              {{ scope.row.trunktype.name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="访问权限" prop="purview"/>
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
        <el-table-column fixed="right" label="操作" width="200">
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
      title="添加陈述性知识"
  >
    <template #default>
      <el-form ref="eaf" :model="addForm" :rules="addFormRules">
        <el-form-item label="名称" prop="title">
          <el-input v-model="addForm.title"/>
        </el-form-item>
        <el-form-item label="目标任务" prop="task">
          <el-select v-model="addForm.task" placeholder="作用于任务" value-key="title">
            <el-option v-for="item in tasks" :key="item.id" :label="item.title" :value="item"/>
          </el-select>
        </el-form-item>
        <el-form-item label="脑活动" prop="trunktype">
          <el-select v-model="addForm.trunktype" placeholder="选择脑活动" value-key="name">
            <el-option v-for="item in trunktypes" :key="item.value" :label="item.name" :value="item">
              <el-tag :color="item.tint + '20'" :style="{color: item.tint, borderColor: item.tint}">
                {{ item.name }}
              </el-tag>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="addForm.description" type="textarea"/>
        </el-form-item>
      </el-form>
    </template>
    <template #footer>
      <div style="flex: auto">
        <el-button :loading="isAdding" plain type="primary" @click="commitAdd(true)">添加陈述性知识并继续</el-button>
        <el-button :loading="isAdding" type="primary" @click="commitAdd()">添加陈述性知识</el-button>
      </div>
    </template>

  </el-dialog>

  <el-drawer
      v-model="controlStatus.editDrawer"
      direction="rtl"
      title="编辑陈述性知识"
  >
    <template #default>
      <el-form ref="eef" :model="editForm" :rules="editFormRules">
        <el-form-item label="任务名" prop="task">
          <el-select v-model="editForm.task" placeholder="作用于任务" value-key="title">
            <el-option v-for="item in tasks" :key="item.id" :label="item.title" :value="item"/>
          </el-select>
        </el-form-item>
        <el-form-item label="名称" prop="title">
          <el-input v-model="editForm.title"/>
        </el-form-item>
        <el-form-item label="脑活动" prop="trunktype">
          <el-select v-model="editForm.trunktype" placeholder="选择脑活动" value-key="name">
            <el-option v-for="item in trunktypes" :key="item.value" :label="item.name" :value="item">
              <el-tag :color="item.tint + '20'" :style="{color: item.tint, borderColor: item.tint}">
                {{ item.name }}
              </el-tag>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="editForm.description" type="textarea"/>
        </el-form-item>
      </el-form>
    </template>
    <template #footer>
      <div style="flex: auto">
        <el-button :loading="deleting" type="danger" @click="deleteSingle" :disabled="isEditing">删除</el-button>
        <el-button :loading="isEditing" type="primary" @click="commitEdit" :disabled="deleting">完成编辑</el-button>
      </div>
    </template>

  </el-drawer>

</template>

<style scoped>

</style>
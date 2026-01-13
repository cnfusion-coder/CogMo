<script setup>

import {computed, onMounted, reactive, ref} from "vue";
import {baseServer} from "../plugins/axios";
import {ElDialog, ElMessage, ElMessageBox} from "element-plus";
import {reactorModelIcon} from "../assets/icons.js";
import {Delete, EditPen, Plus, Search} from "@element-plus/icons-vue";
import {useIdentityStore} from "../plugins/store.js";
import {REACTOR_MODEL} from "../utils/lazyapi.js";

const identityStore = useIdentityStore();

const controlStatus = reactive({
  addDrawer: false,
  editDrawer: false
});

const dataAvailable = ref(false);

function edit(row) {
  editForm.value = row
  controlStatus.editDrawer = true
}

async function updateData(hard = false) {
  dataAvailable.value = false;
  await REACTOR_MODEL.get(hard)
      .then(data => {
        reactormodels.value = data;
      })
      .catch(e => {
        console.log(e);
        ElMessage.error(e);
      });
  dataAvailable.value = true;
}

onMounted(() => {
  updateData()
});

const reactormodels = ref(undefined);

const addForm = ref({
  id: 0,
  title: '',
  description: ''
});

const editForm = ref({
  id: 0,
  title: '',
  description: ''
});

const addFormRules = reactive({
  title: [
    {
      trigger: "blur",
      message: "相同堆型名称已存在",
      validator: (rule, value, callback) => {
        if (reactormodels.value) {
          return !reactormodels.value.some((item) => item.title === value);
        }
        return false;
      }
    },
    {
      trigger: "blur",
      message: "堆型名称不可为空",
      required: true
    }
  ],
  description: []
});

const editFormRules = addFormRules;

const isAdding = ref(false);
const isEditing = ref(false);

const eaf = ref();
const eef = ref();

async function commitAdd(con = false) {
  if (!eaf.value) return;
  isAdding.value = true;
  await eaf.value.validate(async (valid) => {
    if (valid) {
      await baseServer.post('/api/coper/reactormodel/', {
        title: addForm.value.title,
        description: addForm.value.description,
        creator: identityStore.identity.id,
      })
          .then(() => {
            ElMessage.success('添加成功');
            updateData(true);
            if (con) {
              eaf.value.resetFields();
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
      await baseServer.put(`/api/coper/reactormodel/${editForm.value.id}/`, {
        title: editForm.value.title,
        description: editForm.value.description,
        creator: identityStore.identity.id
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

const deleting = ref(false)

function commitDelete(row) {
  ElMessageBox.confirm(`确认删除堆型 ${row.title} ？`, '提示', {
    type: "warning"
  })
      .then(() => {
        deleting.value = true;
        baseServer.delete(`/api/coper/reactormodel/${row.id}/`)
            .then(() => {
              ElMessage.info(`堆型 ${row.title} 已被删除`);
              updateData(true);
            })
            .catch(e => {
              console.log(e)
              ElMessage.error(`堆型 ${row.title} 删除失败：${e}`);
            })
            .finally(() => {
              deleting.value = false;
            });
      })
      .catch(() => {
      });

}

const searchForm = ref('');
const filting = computed(() => searchForm.value.length > 0);

const filteResult = computed(() => {
  if (filting.value) {
    return reactormodels.value.filter(e => (
        e.id.toString().includes(searchForm.value) ||
        e.title.includes(searchForm.value) ||
        e.description.includes(searchForm.value) ||
        e.creator.username.includes(searchForm.value)
    ))
  } else {
    return reactormodels.value
  }
});


</script>

<template>
  <div style="width: 100%; display: flex; flex-direction: column; align-items: center; gap: 12px">
    <div style="width: 100%; display: flex; align-items: center; gap: 12px; justify-content: center">
      <el-text style="font-weight: bold; font-size: large">
        堆型列表
      </el-text>
      <el-input v-model="searchForm" clearable placeholder="搜索" style="width: 160px">
        <template #prefix>
          <el-icon>
            <Search/>
          </el-icon>
        </template>
      </el-input>
    </div>

    <el-scrollbar v-if="dataAvailable" height="70vh" style="width: 100%;">
      <div v-if="reactormodels" style="width: 100%;">
        <el-row style="width: 100%;">
          <el-col v-for="reactormodel in filteResult" :key="reactormodel.id" :lg="4" :md="4" :sm="6" :span="6" :xl="3"
                  :xs="12">
            <el-popover width="200px">
              <template #reference>
                <el-card body-style="padding: 0; margin: 0" shadow="hover" style="margin: 12px; height: 120px">
                  <div
                      style="width: 100%; height: 120px; display: flex; flex-direction: column; gap: 12px; align-items: center; justify-content: center">
                    <el-icon size="40px" v-html="reactorModelIcon.template"/>
                    <el-text>
                      {{ reactormodel.title }}
                    </el-text>
                  </div>
                </el-card>
              </template>
              <div
                  style="width: 100%; display: flex; flex-direction: column; gap: 12px; justify-content: space-between">
                <el-text style="width: 100%; display: flex; flex-direction: column; gap: 4px; align-items: start">
                  <div>
                    ID: {{ reactormodel.id }}
                  </div>
                  <div>
                    创建者: {{ reactormodel.creator.username }}
                  </div>
                  <div>
                    描述: {{ reactormodel.description }}
                  </div>
                  <div style="font-size: small">
                    创建时间: {{ new Date(reactormodel.created_at).toLocaleString() }}
                  </div>
                </el-text>
                <div style="width: 100%; display: flex; justify-content: right">
                  <el-button v-if="reactormodel.creator.id === identityStore.identity.id" circle
                             plain
                             type="primary" @click="edit(reactormodel)">
                    <el-icon>
                      <EditPen/>
                    </el-icon>
                  </el-button>
                  <el-button :disabled="deleting" circle plain type="danger" @click="commitDelete(reactormodel)">
                    <el-icon>
                      <Delete/>
                    </el-icon>
                  </el-button>
                </div>
              </div>

            </el-popover>
          </el-col>
          <el-col v-if="!filting" :lg="4" :md="4" :sm="6" :span="6" :xl="3" :xs="12">
            <el-card body-style="padding: 0" shadow="hover" style="margin: 12px; height: 120px; cursor: pointer;"
                     @click="controlStatus.addDrawer = true">
              <div
                  style="width: 100%; height: 120px; display: flex; flex-direction: column; gap: 12px; align-items: center; justify-content: center">
                <el-icon size="40px">
                  <Plus/>
                </el-icon>
                <el-text>
                  添加堆型
                </el-text>
              </div>
            </el-card>
          </el-col>
        </el-row>
        <div style="width: 100%; display: flex; flex-direction: column; margin-top: 64px">
          <el-text style="text-align: center" type="info">
            当前已展示 {{ filteResult.length }} 个堆型
          </el-text>
          <el-text style="text-align: center" type="info">
            系统中共 {{ reactormodels.length }} 个堆型
          </el-text>
        </div>

      </div>

    </el-scrollbar>
    <el-empty v-else description="正在读取服务器堆型数据库，请稍等。"/>
  </div>

  <el-dialog
      v-model="controlStatus.addDrawer"
      title="添加堆型"
  >
    <template #default>
      <el-form ref="eaf" :model="addForm" :rules="addFormRules">
        <el-form-item label="堆型名" prop="title">
          <el-input v-model="addForm.title"/>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="addForm.description" type="textarea"/>
        </el-form-item>
      </el-form>
    </template>
    <template #footer>
      <div style="flex: auto">
        <el-button :loading="isAdding" plain type="primary" @click="commitAdd(true)">添加堆型并继续</el-button>
        <el-button :loading="isAdding" type="primary" @click="commitAdd()">添加堆型</el-button>
      </div>
    </template>
  </el-dialog>

  <el-drawer
      v-model="controlStatus.editDrawer"
      direction="rtl"
      title="编辑堆型"
  >
    <template #default>
      <el-form ref="eef" :model="editForm" :rules="editFormRules">
        <el-form-item label="堆型名">
          <el-input v-model="editForm.title"/>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editForm.description" type="textarea"/>
        </el-form-item>
      </el-form>
    </template>
    <template #footer>
      <div style="flex: auto">
        <el-button :loading="isEditing" type="primary" @click="commitEdit()">完成编辑</el-button>
      </div>
    </template>

  </el-drawer>

  <el-dialog
      v-model="deleting"
      :before-close="() => void(0)"
      :show-close="false"
      align-center
      center
      title="提示"
      width="200px"
  >
    <div style="width: 100%; display: flex; align-items: center; justify-content: center">
      正在删除堆型，请稍等。
    </div>
  </el-dialog>

</template>

<style scoped>

</style>
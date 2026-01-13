<script setup>

import {onMounted, reactive, ref} from "vue";
import {ElDialog, ElMessage, ElMessageBox} from "element-plus";
import {reactorModelIcon} from "../assets/icons.js";
import {Delete, EditPen, Plus, Search} from "@element-plus/icons-vue";
import {TASK} from "../utils/lazyapi.js";
import {usePerformanceStore} from "../plugins/store.js";
import { performance_pdf } from '../utils/pf_report.js'; // 假设路径是这样

const controlStatus = reactive({
  addDrawer: false,
  editDrawer: false
});

const dataAvailable = ref(false);
const tasks = ref(undefined);
const performanceStore = usePerformanceStore();

const addForm = reactive({
  taskId: null,
  name: '',
  gender: '',
  age: 18,
  educationBackground: '',
  trainingBackground: '',
  cognitiveFeatures: '',
  sleep: '',
  motivation: '',
  emotion: '',
  relationships: '',
  subjectiveFeeling: '',
  workStatus: '',
  workEnvironment: '',
  isTaskCompleted: false,
  seriousErrorCount: 0,
  misoperationCount: 0,
  emotionalAwareness: '',
  teamwork: '',
  workPerformance: '',
  score: 60,
  overallEvaluation: ''
});

const editForm = reactive({...addForm});

const addFormRules = {
  taskId: [{ required: true, message: '请选择目标任务', trigger: 'change' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  age: [
    { required: true, message: '请输入年龄', trigger: 'blur' },
    { type: 'number', min: 0, message: '年龄必须为非负整数', trigger: 'blur' }
  ],
  educationBackground: [{ required: true, message: '请输入教育背景', trigger: 'blur' }],
  trainingBackground: [{ required: true, message: '请输入培训背景', trigger: 'blur' }],
  cognitiveFeatures: [{ required: true, message: '请输入认知特征', trigger: 'blur' }],
  sleep: [{ required: true, message: '请输入睡眠情况', trigger: 'blur' }],
  motivation: [{ required: true, message: '请输入工作动机', trigger: 'blur' }],
  emotion: [{ required: true, message: '请输入情绪状态', trigger: 'blur' }],
  relationships: [{ required: true, message: '请输入人际关系', trigger: 'blur' }],
  subjectiveFeeling: [{ required: true, message: '请输入主观感受', trigger: 'blur' }],
  workStatus: [{ required: true, message: '请输入工作状态', trigger: 'blur' }],
  workEnvironment: [{ required: true, message: '请输入工作环境', trigger: 'blur' }],
  isTaskCompleted: [{ required: true, message: '请选择任务是否完成', trigger: 'change' }],
  seriousErrorCount: [{ required: true, message: '请输入严重错误次数', trigger: 'blur' }],
  misoperationCount: [{ required: true, message: '请输入误操作次数', trigger: 'blur' }],
  emotionalAwareness: [{ required: true, message: '请输入情绪感知能力', trigger: 'blur' }],
  teamwork: [{ required: true, message: '请输入团队协作能力', trigger: 'blur' }],
  workPerformance: [{ required: true, message: '请输入工作绩效表现', trigger: 'blur' }],
  score: [
    { required: true, message: '请输入得分', trigger: 'blur' },
    { type: 'number', min: 0, max: 100, message: '得分必须在 0 到 100 之间', trigger: 'blur' }
  ],
  overallEvaluation: [{ required: true, message: '请输入总体评价', trigger: 'blur' }]
};

const editFormRules = {...addFormRules};

const isAdding = ref(false);
const isEditing = ref(false);
const deleting = ref(false);

async function updateData(hard = false) {
  dataAvailable.value = false;
  await TASK.get(hard)
      .then(data => {
        tasks.value = data;
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

const commitAdd = async () => {
  isAdding.value = true;
  try {
    const newPerformance = { ...addForm };
    performanceStore.performances.push(newPerformance);
    ElMessage.success('绩效添加成功');
    controlStatus.addDrawer = false;
    Object.keys(addForm).forEach(key => {
      if (typeof addForm[key] === 'string') {
        addForm[key] = '';
      } else if (typeof addForm[key] === 'number') {
        addForm[key] = 0;
      } else if (typeof addForm[key] === 'boolean') {
        addForm[key] = false;
      } else {
        addForm[key] = null;
      }
    });
  } catch (error) {
    console.error(error);
    ElMessage.error('绩效添加失败');
  } finally {
    isAdding.value = false;
  }
};

const edit = (performance) => {
  Object.assign(editForm, performance);
  controlStatus.editDrawer = true;
};

const commitEdit = async () => {
  isEditing.value = true;
  try {
    const index = performanceStore.performances.findIndex(p => p.id === editForm.id);
    if (index !== -1) {
      performanceStore.performances[index] = { ...editForm };
      ElMessage.success('绩效编辑成功');
      controlStatus.editDrawer = false;
    }
  } catch (error) {
    console.error(error);
    ElMessage.error('绩效编辑失败');
  } finally {
    isEditing.value = false;
  }
};

const commitDelete = async (performance) => {
  deleting.value = true;
  try {
    await ElMessageBox.confirm('确定要删除该绩效吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    const index = performanceStore.performances.findIndex(p => p.id === performance.id);
    if (index !== -1) {
      performanceStore.performances.splice(index, 1);
      ElMessage.success('绩效删除成功');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error);
      ElMessage.error('绩效删除失败');
    }
  } finally {
    deleting.value = false;
  }
};

const downloadReport = async (performance) => {
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = await performance_pdf(performance);
  link.download = '认知负荷报告.pdf';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
</script>

<template>
  <div style="width: 100%; display: flex; flex-direction: column; align-items: center; gap: 12px">
    <div style="width: 100%; display: flex; align-items: center; gap: 12px; justify-content: center">
      <el-text style="font-weight: bold; font-size: large">
        绩效列表
      </el-text>
    </div>

    <el-scrollbar v-if="dataAvailable" height="70vh" style="width: 100%;">
      <div v-if="tasks" style="width: 100%;">
        <el-row style="width: 100%;">
          <el-col v-for="performance in performanceStore.performances" :key="performance.id" :lg="4" :md="4" :sm="6" :span="6" :xl="3"
                  :xs="12">
            <el-popover width="200px">
              <template #reference>
                <el-card body-style="padding: 0; margin: 0" shadow="hover" style="margin: 12px; height: 120px">
                  <div
                      style="width: 100%; height: 120px; display: flex; flex-direction: column; gap: 12px; align-items: center; justify-content: center">
                    <el-icon size="40px" v-html="reactorModelIcon.template"/>
                    <el-text>
                      {{ performance.name }}
                    </el-text>
                  </div>
                </el-card>
              </template>
              <div
                  style="width: 100%; display: flex; flex-direction: column; gap: 12px; justify-content: space-between">
                <el-text style="width: 100%; display: flex; flex-direction: column; gap: 4px; align-items: start">
                  <!-- 显示详细信息 -->
                  <span>目标任务: {{ tasks.find(task => task.id === performance.taskId)?.title || '无' }}</span>
                  <span>姓名: {{ performance.name }}</span>
                  <span>性别: {{ performance.gender }}</span>
                  <span>年龄: {{ performance.age }}</span>
                  <!-- 可根据需要添加更多字段 -->
                </el-text>
                <div style="width: 100%; display: flex; justify-content: right">
                  <el-button circle
                             plain
                             type="primary" @click="edit(performance)">
                    <el-icon>
                      <EditPen/>
                    </el-icon>
                  </el-button>
                  <el-button :disabled="deleting" circle plain type="danger" @click="commitDelete(performance)">
                    <el-icon>
                      <Delete/>
                    </el-icon>
                  </el-button>
                  <el-button @click="downloadReport(performance)">下载报告</el-button>
                </div>
              </div>

            </el-popover>
          </el-col>
          <el-col :lg="4" :md="4" :sm="6" :span="6" :xl="3" :xs="12">
            <el-card body-style="padding: 0" shadow="hover" style="margin: 12px; height: 120px; cursor: pointer;"
                     @click="controlStatus.addDrawer = true">
              <div
                  style="width: 100%; height: 120px; display: flex; flex-direction: column; gap: 12px; align-items: center; justify-content: center">
                <el-icon size="40px">
                  <Plus/>
                </el-icon>
                <el-text>
                  添加绩效
                </el-text>
              </div>
            </el-card>
          </el-col>
        </el-row>
        <div style="width: 100%; display: flex; flex-direction: column; margin-top: 64px">
          <el-text style="text-align: center" type="info">
            当前已展示 {{ performanceStore.performances.length }} 个绩效
          </el-text>
        </div>

      </div>

    </el-scrollbar>
    <el-empty v-else description="正在读取服务器数据，请稍等。"/>
  </div>

  <el-dialog
      v-model="controlStatus.addDrawer"
      title="添加绩效"
  >
    <template #default>
      <el-form ref="eaf" :model="addForm" :rules="addFormRules" label-width="120px">
        <el-form-item label="目标任务" prop="taskId">
          <el-select v-model="addForm.taskId" placeholder="请选择目标任务">
            <el-option
              v-for="task in tasks"
              :key="task.id"
              :label="task.title"
              :value="task.id">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="addForm.name"></el-input>
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-select v-model="addForm.gender" placeholder="请选择性别">
            <el-option label="男" value="男"></el-option>
            <el-option label="女" value="女"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="年龄" prop="age">
          <el-input-number v-model="addForm.age" :min="0"></el-input-number>
        </el-form-item>
<el-form-item label="教育背景" prop="educationBackground">
  <el-input v-model="addForm.educationBackground"></el-input>
</el-form-item>
<el-form-item label="培训背景" prop="trainingBackground">
  <el-input v-model="addForm.trainingBackground"></el-input>
</el-form-item>
<el-form-item label="认知特征" prop="cognitiveFeatures">
  <el-input v-model="addForm.cognitiveFeatures" type="textarea"></el-input>
</el-form-item>
<el-form-item label="睡眠情况" prop="sleep">
  <el-input v-model="addForm.sleep" type="textarea"></el-input>
</el-form-item>
<el-form-item label="工作动机" prop="motivation">
  <el-input v-model="addForm.motivation" type="textarea"></el-input>
</el-form-item>
<el-form-item label="情绪状态" prop="emotion">
  <el-input v-model="addForm.emotion" type="textarea"></el-input>
</el-form-item>
<el-form-item label="人际关系" prop="relationships">
  <el-input v-model="addForm.relationships" type="textarea"></el-input>
</el-form-item>
<el-form-item label="主观感受" prop="subjectiveFeeling">
  <el-input v-model="addForm.subjectiveFeeling" type="textarea"></el-input>
</el-form-item>
<el-form-item label="工作状态" prop="workStatus">
  <el-input v-model="addForm.workStatus" type="textarea"></el-input>
</el-form-item>
<el-form-item label="工作环境" prop="workEnvironment">
  <el-input v-model="addForm.workEnvironment" type="textarea"></el-input>
</el-form-item>
<el-form-item label="任务是否完成" prop="isTaskCompleted">
  <el-switch v-model="addForm.isTaskCompleted"></el-switch>
</el-form-item>
<el-form-item label="严重错误次数" prop="seriousErrorCount">
  <el-input-number v-model="addForm.seriousErrorCount" :min="0"></el-input-number>
</el-form-item>
<el-form-item label="误操作次数" prop="misoperationCount">
  <el-input-number v-model="addForm.misoperationCount" :min="0"></el-input-number>
</el-form-item>
<el-form-item label="情绪感知能力" prop="emotionalAwareness">
  <el-input v-model="addForm.emotionalAwareness" type="textarea"></el-input>
</el-form-item>
<el-form-item label="团队协作能力" prop="teamwork">
  <el-input v-model="addForm.teamwork" type="textarea"></el-input>
</el-form-item>
<el-form-item label="工作绩效表现" prop="workPerformance">
  <el-input v-model="addForm.workPerformance" type="textarea"></el-input>
</el-form-item>
<el-form-item label="得分" prop="score">
  <el-input-number v-model="addForm.score" :min="0"></el-input-number>
</el-form-item>
<el-form-item label="总体评价" prop="overallEvaluation">
  <el-input v-model="addForm.overallEvaluation" type="textarea"></el-input>
</el-form-item>
      </el-form>
    </template>
    <template #footer>
      <div style="flex: auto">
        <el-button :loading="isAdding" type="primary" @click="commitAdd()">添加绩效</el-button>
      </div>
    </template>
  </el-dialog>

  <el-drawer
      v-model="controlStatus.editDrawer"
      direction="rtl"
      title="编辑绩效"
  >
    <template #default>
      <el-form ref="eef" :model="editForm" :rules="editFormRules" label-width="120px">
        <el-form-item label="目标任务" prop="taskId">
          <el-select v-model="editForm.taskId" placeholder="请选择目标任务">
            <el-option
              v-for="task in tasks"
              :key="task.id"
              :label="task.title"
              :value="task.id">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="editForm.name"></el-input>
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-select v-model="editForm.gender" placeholder="请选择性别">
            <el-option label="男" value="男"></el-option>
            <el-option label="女" value="女"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="年龄" prop="age">
          <el-input-number v-model="editForm.age" :min="0"></el-input-number>
        </el-form-item>
<el-form-item label="教育背景" prop="educationBackground">
  <el-input v-model="editForm.educationBackground"></el-input>
</el-form-item>
<el-form-item label="培训背景" prop="trainingBackground">
  <el-input v-model="editForm.trainingBackground"></el-input>
</el-form-item>
<el-form-item label="认知特征" prop="cognitiveFeatures">
  <el-input v-model="editForm.cognitiveFeatures" type="textarea"></el-input>
</el-form-item>
<el-form-item label="睡眠情况" prop="sleep">
  <el-input v-model="editForm.sleep" type="textarea"></el-input>
</el-form-item>
<el-form-item label="工作动机" prop="motivation">
  <el-input v-model="editForm.motivation" type="textarea"></el-input>
</el-form-item>
<el-form-item label="情绪状态" prop="emotion">
  <el-input v-model="editForm.emotion" type="textarea"></el-input>
</el-form-item>
<el-form-item label="人际关系" prop="relationships">
  <el-input v-model="editForm.relationships" type="textarea"></el-input>
</el-form-item>
<el-form-item label="主观感受" prop="subjectiveFeeling">
  <el-input v-model="editForm.subjectiveFeeling" type="textarea"></el-input>
</el-form-item>
<el-form-item label="工作状态" prop="workStatus">
  <el-input v-model="editForm.workStatus" type="textarea"></el-input>
</el-form-item>
<el-form-item label="工作环境" prop="workEnvironment">
  <el-input v-model="editForm.workEnvironment" type="textarea"></el-input>
</el-form-item>
<el-form-item label="任务是否完成" prop="isTaskCompleted">
  <el-switch v-model="editForm.isTaskCompleted"></el-switch>
</el-form-item>
<el-form-item label="严重错误次数" prop="seriousErrorCount">
  <el-input-number v-model="editForm.seriousErrorCount" :min="0"></el-input-number>
</el-form-item>
<el-form-item label="误操作次数" prop="misoperationCount">
  <el-input-number v-model="editForm.misoperationCount" :min="0"></el-input-number>
</el-form-item>
<el-form-item label="情绪感知能力" prop="emotionalAwareness">
  <el-input v-model="editForm.emotionalAwareness" type="textarea"></el-input>
</el-form-item>
<el-form-item label="团队协作能力" prop="teamwork">
  <el-input v-model="editForm.teamwork" type="textarea"></el-input>
</el-form-item>
<el-form-item label="工作绩效表现" prop="workPerformance">
  <el-input v-model="editForm.workPerformance" type="textarea"></el-input>
</el-form-item>
<el-form-item label="得分" prop="score">
  <el-input-number v-model="editForm.score" :min="0"></el-input-number>
</el-form-item>
<el-form-item label="总体评价" prop="overallEvaluation">
  <el-input v-model="editForm.overallEvaluation" type="textarea"></el-input>
</el-form-item>
      </el-form>
    </template>
    <template #footer>
      <div style="flex: auto">
        <el-button :loading="isEditing" type="primary" @click="commitEdit()">完成编辑</el-button>
      </div>
    </template>

  </el-drawer>

</template>


<style scoped>

</style>
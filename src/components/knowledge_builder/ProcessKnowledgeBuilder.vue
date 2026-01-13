<script setup>

import {
  checkExpressionList,
  inputExpression,
  expressionDataStatistics,
  mergeExpression,
  pushExpression,
  removeExpressionAt,
  splitExpression,
  checkResultExpressionList, fixExpressionListSortIndex,
} from "../../components/knowledge_builder/expression_builder";
import KnowledgeItem from "../../components/knowledge_builder/KnowledgeItem.vue";
import {ElMessage, ElMessageBox} from "element-plus";
import SmallKnowledgeCard from "../../components/knowledge_card/SmallKnowledgeCard.vue";
import {computed, ref, watch, defineModel, defineEmits, reactive, defineExpose, onMounted} from "vue";
import {baseServer} from "../../plugins/axios";
import store from "../../plugins/store";

const display = defineModel('display');

function controllerReset() {
  ElMessageBox
      .confirm('编辑将作废。', '确定要重置吗？', {
        type: "warning",
        confirmButtonText: '重置',
        cancelButtonText: '取消'
      })
      .then(reset)
      .catch(() => {
      });
}

function controllerLeaveHandler(done) {
  ElMessageBox
      .confirm('编辑将不会被应用。', '确定要离开吗？', {
        type: 'warning',
        confirmButtonText: '确认',
        cancelButtonText: '取消'
      })
      .then(() => {
        done()
      })
      .catch(() => {
      });
}

function edit(editRequest, force = false) {
  if (disposable.value || force) {
    applyRequest(editRequest);
    return true;
  } else {
    return false;
  }
}

const emits = defineEmits(['exp-done']);

const controlStatus = reactive({
  workSpaceOpenedPage: '',
  selectSpaceOpenedPage: '',
  dragging: false,
  dragFromIndex: -1,
  dragIndex: 0
});

const ifExpressionList = ref([]);
const thenExpressionList = ref([]);
const thenExpressionErrorList = ref([]);
const incrementalIndex = ref(0);
const saved = ref(false);

function reset() {
  ifExpressionList.value.splice(0, ifExpressionList.value.length);
  thenExpressionList.value.splice(0, thenExpressionList.value.length);
  saved.value = false;
  incrementalIndex.value = 0;
}

const disposable = computed(() => {
  return saved.value ? true : (
      ifExpressionList.value.length === 0 &&
      thenExpressionList.value.length === 0
  );
});

function applyRequest(request) {

  reset();

  request.IF.forEach(item => {
    item.sortIndex = incrementalIndex.value++;
    ifExpressionList.value = pushExpression(ifExpressionList.value, item);
  });
  request.THEN.forEach(item => {
    item.sortIndex = incrementalIndex.value++;
    thenExpressionList.value = pushExpression(thenExpressionList.value, item);
  });

  let middleware0 = fixExpressionListSortIndex(ifExpressionList.value, incrementalIndex.value);
  ifExpressionList.value = middleware0.expressionList;
  incrementalIndex.value = middleware0.sortIndex;

  let middleware1 = fixExpressionListSortIndex(thenExpressionList.value, incrementalIndex.value);
  thenExpressionList.value = middleware1.expressionList;
  incrementalIndex.value = middleware1.sortIndex;
}

watch(thenExpressionList, () => {
  thenExpressionErrorList.value = checkResultExpressionList(thenExpressionList.value, e => e.id);
}, {immediate: true, deep: true});

function done() {
  emits('exp-done', allResult.value);
  display.value = false;
  saved.value = true;
}

function ifMergeAsAndExpression(start) {
  ifExpressionList.value = mergeExpression(
      ifExpressionList.value,
      start,
      'A'
  );
}

function ifMergeAsOrExpression(start) {
  ifExpressionList.value = mergeExpression(
      ifExpressionList.value,
      start,
      'O'
  );
}

function ifMergeAsNotExpression(start) {
  ifExpressionList.value = mergeExpression(
      ifExpressionList.value,
      start,
      'N'
  );
}

function ifRemoveExpression(index) {
  ifExpressionList.value = removeExpressionAt(ifExpressionList.value, index)
}

function ifSplitExpression(index) {
  ifExpressionList.value = splitExpression(ifExpressionList.value, index)
}

function ifExpressionDragStart(ev, i) {
  ev.stopPropagation()
  ev.target.classList.add('moving')
  controlStatus.dragging = true
  controlStatus.dragIndex = i
  ifExpressionList.value[i].isDragging = true
}

function ifExpressionDragEnd(ev) {
  ev.target.classList.remove('moving')
  controlStatus.dragging = false
  ifExpressionList.value = checkExpressionList(ifExpressionList.value)
  ifExpressionList.value.forEach((e) => e.isDragging = false)
}

function ifExpressionDragOver(ev, i) {
  ev.preventDefault()
  if (i !== controlStatus.dragIndex && i !== controlStatus.dragFromIndex) {
    controlStatus.dragFromIndex = controlStatus.dragIndex
    const source = ifExpressionList.value[controlStatus.dragIndex]
    ifExpressionList.value.splice(controlStatus.dragIndex, 1)
    ifExpressionList.value.splice(i, 0, source)
    controlStatus.dragIndex = i
    setTimeout(() => {
      controlStatus.dragFromIndex = -1
    }, 210)
  }
}

function thenRemoveExpression(index) {
  thenExpressionList.value = removeExpressionAt(thenExpressionList.value, index)
}

function thenMergeAsNotExpression(start) {
  thenExpressionList.value = mergeExpression(
      thenExpressionList.value,
      start,
      'N'
  )
}

function addStatementKnowledge(dk) {
  switch (controlStatus.workSpaceOpenedPage) {
    case 'IF': {
      ifExpressionList.value = pushExpression(
          ifExpressionList.value,
          inputExpression(dk, incrementalIndex.value++)
      );
      break;
    }
    case 'THEN': {
      thenExpressionList.value = pushExpression(
          thenExpressionList.value,
          inputExpression(dk, incrementalIndex.value++)
      );
      break;
    }
  }
}

const loadingStatementKnowledge = ref(false);
const statementKnowledge = ref(null);

onMounted(() => {
  loadingStatementKnowledge.value = true;
  baseServer.get('/api/coper/dk/', {
    headers: {
      Authorization: `TOKEN ${store.state.identity.auth_token}`
    }
  })
      .then(response => {
        statementKnowledge.value = response.data
      })
      .catch(e => {
        ElMessage.error('陈述性知识列表获取失败');
        console.log(e);
      })
      .finally(() => {
        loadingStatementKnowledge.value = false;
      });
});

const addDisable = computed(() => {
  let availablePage = controlStatus.workSpaceOpenedPage;
  return availablePage === undefined || availablePage == null || availablePage === '';
});

const metaInfo = computed(() => expressionDataStatistics(ifExpressionList.value));

const checkIfList = computed(() => {
  let errorList = [];
  if (ifExpressionList.value.length === 0) {
    errorList.push('为空');
  } else if (ifExpressionList.value.length !== 1) {
    errorList.push('只能有一条表达式');
  }
  return {
    good: errorList.length === 0,
    msg: errorList.length === 0 ? '合法' : errorList.join('，')
  };
});

const checkThenList = computed(() => {
  let errorList = [];
  if (thenExpressionList.value.length === 0) {
    errorList.push('为空');
  } else if (thenExpressionErrorList.value.some(e => e)) {
    errorList.push('包含重复或不合法的知识节点');
  }
  return {
    good: errorList.length === 0,
    msg: errorList.length === 0 ? '合法' : errorList.join('，')
  };
});

const allGood = computed(() => checkIfList.value.good && checkThenList.value.good);

const allResult = computed(() => {
  if (allGood.value) return {
    IF: ifExpressionList.value[0],
    THEN: thenExpressionList.value
  };
  return {};
});

defineExpose({
  edit, disposable
});

</script>

<template>
  <el-dialog
      v-model="display"
      title="知识组建器"
      width="1000px"
      :before-close="controllerLeaveHandler"
  >
    <el-row>
      <el-col :span="16" style="text-align: center">
        <el-collapse v-model="controlStatus.workSpaceOpenedPage" accordion>
          <el-collapse-item name="IF" style="text-align: center">
            <template #title>
              <el-space direction="horizontal">
                <el-text>
                  IF
                </el-text>
                <el-text :class="checkIfList.good ? 'good-text' : 'error-text'">
                  {{ checkIfList.msg }}
                </el-text>
              </el-space>
            </template>
            <el-empty v-if="ifExpressionList.length === 0" description="点击右侧知识列表中的知识以添加条件"/>
            <div v-else>
              <TransitionGroup name="ifList" tag="div" class="container">
                <div
                    v-for="item in ifExpressionList.map((element, index) => ({element, index}))"
                    :key="item.element.sortIndex"

                    draggable="true"
                    @dragstart="ifExpressionDragStart($event, item.index)"
                    @dragover="ifExpressionDragOver($event, item.index)"
                    @dragend="ifExpressionDragEnd($event)"
                >
                  <KnowledgeItem
                      :show-between="!controlStatus.dragging && !item.element.last"
                      :expression="item.element"
                      :separable="item.element.separable"
                      :dragging="item.element.isDragging === true"

                      @click-and="ifMergeAsAndExpression(item.index)"
                      @click-not="ifMergeAsNotExpression(item.index)"
                      @click-or="ifMergeAsOrExpression(item.index)"
                      @click-del="ifRemoveExpression(item.index)"
                      @click-split="ifSplitExpression(item.index)"
                  />
                </div>
                <div style="height: 160px; flex: auto; align-items: center;">
                  <el-divider>
                    <el-text>
                      共 {{ metaInfo.kindSum }} 种 {{ metaInfo.sum }} 个知识构成的 {{ metaInfo.expressionSum }} 个表达式
                    </el-text>
                  </el-divider>
                </div>
              </TransitionGroup>
            </div>
          </el-collapse-item>
          <el-collapse-item name="THEN" style="text-align: center">
            <template #title>
              <el-space direction="horizontal">
                <el-text>
                  THEN
                </el-text>
                <el-text :class="checkThenList.good ? 'good-text' : 'error-text'">
                  {{ checkThenList.msg }}
                </el-text>
              </el-space>
            </template>
            <el-empty v-if="thenExpressionList.length === 0" description="点击右侧知识列表中的知识以添加条件"/>
            <div v-else>
              <KnowledgeItem
                  v-for="item in thenExpressionList.map((element, index) => ({element, index}))"
                  :key="item.element.sortIndex"

                  :expression="item.element"
                  :error="thenExpressionErrorList[item.index]"

                  @click-not="thenMergeAsNotExpression(item.index)"
                  @click-del="thenRemoveExpression(item.index)"
              />
            </div>
          </el-collapse-item>
        </el-collapse>
      </el-col>
      <el-col :span="1">
        <el-divider direction="vertical" style="height: 100%; float: right"/>
      </el-col>

      <el-col :span="7" style="text-align: center">
        <el-text style="font-size: large">
          陈述性知识
        </el-text>
        <div style="height: 20px;"/>
        <el-scrollbar v-if="statementKnowledge" max-height="400px">
          <div style="display: flex; flex-direction: column; width: 100%; align-items: center; gap: 8px">
            <el-card v-for="statementItem in statementKnowledge" :key="statementItem.id"
                     style="width: calc(100% - 12px)">
              <template #header>
                <SmallKnowledgeCard :knowledge="statementItem"/>
              </template>
              <el-button
                  icon="Plus"
                  style="float: right; margin-bottom: 12px"
                  :disabled="addDisable"
                  @click="addStatementKnowledge(statementItem)"
              >
                添加
              </el-button>
            </el-card>
          </div>
        </el-scrollbar>
        <el-empty v-loading v-else-if="loadingStatementKnowledge"/>
      </el-col>
    </el-row>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="controllerReset">重置</el-button>
        <el-button type="primary" @click="done" :disabled="!allGood">
          确认
        </el-button>
      </div>
    </template>
  </el-dialog>

</template>

<style lang="scss" scoped>

.ifList-move, .ifList-enter-active, .ifList-leave-active {
  transition: all 0.1s ease;
}

.error-text {
  color: #ff9c9c
}

.good-text {
  color: #6aecb1;
}

</style>
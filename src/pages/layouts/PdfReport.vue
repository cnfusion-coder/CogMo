<script setup>

import {documentIcon, downloadIcon, printIcon, refreshIcon} from "../../assets/icons.js";
import VuePdfEmbed from "vue-pdf-embed";
import {workload_pdf} from "../../utils/wl_report.js";
import printJS from "print-js";
import {computed, ref, watch} from "vue";
import {useReportSaveStore} from "../../plugins/store.js";
import {dateFormat} from "../../utils/global.js";
import {CloseBold, WarningFilled} from "@element-plus/icons-vue";

const reportSaveStore = useReportSaveStore();

const target = ref(undefined);

const pdfUrl = ref(null);

watch(target, (newValue) => {
  if (newValue) {
    refreshPdf(newValue);
  } else {
    pdfUrl.value = null;
  }
}, {immediate: true})


function refreshPdf(uuid) {
  pdfUrl.value = null;
  workload_pdf(reportSaveStore.get(uuid).data).then((url) => {
    pdfUrl.value = url;
  });
}

function deleteSelectedReport() {
  const deleteTarget = target.value;
  target.value = undefined;
  reportSaveStore.remove(deleteTarget);
}

const showToolArea = computed(() => !!target.value);

function printPdf() {
  printJS(pdfUrl.value);
}

function downloadPdf() {
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = pdfUrl.value;
  link.download = '认知负荷报告.pdf';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const reportModels = computed(() => reportSaveStore.reports.toSorted((a, b) => b.data.simulate_date - a.data.simulate_date));

</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 12px; align-items: center">
    <div style="width: calc(100% - 12px); padding-right: 12px; display: flex; justify-content: space-between; align-items: center">
      <div style="width: 400px; display: flex; gap: 4px; align-items: center">
        <div style="width: 100px">仿真记录</div>
        <el-select v-model="target" style="width: 300px" placeholder="选择仿真记录">
          <el-option v-for="item in reportModels" :key="item.uuid" :value="item.uuid" :label="item.title ? item.title : item.data.task.name">
            <div style="width: 100%; display: flex; justify-content: space-between; align-items: center">
              <div>{{ item.title ? item.title : item.data.task.name }}</div>
              <div style="color: #9b9b9b">{{ dateFormat(item.data.simulate_date) }}</div>
            </div>
          </el-option>
        </el-select>
      </div>
      <div v-if="showToolArea">
        <el-button @click="refreshPdf" :icon="refreshIcon">刷新</el-button>
        <el-button @click="downloadPdf" :icon="downloadIcon">下载</el-button>
        <el-button @click="printPdf" :icon="printIcon">打印</el-button>
        <el-popover width="300" trigger="click">
          <template #reference>
            <el-button type="danger" plain :icon="CloseBold">
              删除记录
            </el-button>
          </template>
          <div style="width: 100%; display: flex; flex-direction: column; gap: 12px">
            <div style="font-size: large; font-weight: bold; display: flex; align-items: center; gap: 4px">
              <el-icon color="#ff4b65"><WarningFilled/></el-icon>
              <div>确认删除当前选中的报告？</div>
            </div>
            <el-button @click="deleteSelectedReport" type="danger" style="align-self: end">确认删除</el-button>
          </div>
        </el-popover>
      </div>
    </div>
    <VuePdfEmbed
        style="width: 480px"
        v-if="pdfUrl"
        :source="pdfUrl"
    />
  </div>
</template>

<style scoped>

.info-value {
  color: #9b9b9b
}

</style>
<script setup>

import {onMounted, onUnmounted, ref} from "vue";
import * as echarts from "echarts";


/**
 * @type {{
 *   result: SimulateCalculateResult,
 *   simulateConfig: Object.<string, number>
 * }}
 */
const props = defineProps({
  result: Object
});

const refModuleActivetimePieChart = ref();
const refModuleActivetimeBarChart = ref();

const refModuleWorkloadPieChart = ref();
const refModuleWorkloadBarChart = ref();

const refWorkloadDerivativesLineChart = ref();
const refTotalWorkloadLineChart = ref();

/**
 * @type {null | EChartsType}
 */
let activetimeBarChart = null;
/**
 * @type {null | EChartsType}
 */
let activetimePieChart = null;
/**
 * @type {null | EChartsType}
 */
let workloadBarChart = null;
/**
 * @type {null | EChartsType}
 */
let workloadPieChart = null;
/**
 * @type {null | EChartsType}
 */
let workloadDerivativesLineChart = null;
/**
 * @type {null | EChartsType}
 */
let totalWorkloadLineChart = null;

function getAccountOption(dataObj, title) {
  const barData = Object.entries(dataObj).map(([name, value]) => ({name, value}));

  const barOption = {
    title: {
      text: `${title}指标柱状图`
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: barData.map(item => item.name),
      axisLabel: {
        rotate: 30
      }
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      data: barData.map(item => item.value),
      type: 'bar',
      itemStyle: {
        color: '#73C0DE'
      }
    }]
  };

  const pieData = barData.filter(item => item.value > 0);

  const pieOption = {
    title: {
      text: `${title}占比饼状图`,
      left: 'center'
    },
    tooltip: {
      trigger: 'item'
    },
    legend: {
      bottom: 10,
      left: 'center'
    },
    series: [
      {
        name: '激活值',
        type: 'pie',
        radius: '50%',
        data: pieData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  };

  return [barOption, pieOption]
}

const styleModifier = (e) => {
  e.backgroundColor = "rgba(0,0,0,0)";
  return e;
};

onMounted(() => {
  const [activetimeBarOption, activetimePieOption] = getAccountOption(props.result.trunkActivetimeTotal, "认知模块活跃时间").map(styleModifier);
  const [workloadBarOption, workloadPieOption] = getAccountOption(props.result.trunkWorkloadTotal, "认知模块任务负荷").map(styleModifier);

  const workloadDerivativesLineOption = styleModifier(
      getHeatLevelOption(
          props.result.wHeatLevelArray,
          e => [e.tmr, e.workload, e.trunktype],
          (e) => `时间节点 (ms)：${e[0]}<br\>脑力负荷指数：${e[1]}<br\>活跃认知模块：${e[2]}`,
          "实时负荷热力值"
      )
  );

  const totalWorkloadLineOption = styleModifier(
      getHeatLevelOption(
          props.result.twRiseArray,
          e => [e.tmr, e.workloadSum, e.trunktype],
          (e) => `时间节点 (ms)：${e[0]}<br\>总脑力负荷：${e[1]}<br\>时间节点活跃认知模块：${e[2]}`,
          "脑力负荷增长曲线",
          "脑力总负荷"
      )
  );

  activetimeBarChart = echarts.init(refModuleActivetimeBarChart.value, 'dark');
  activetimePieChart = echarts.init(refModuleActivetimePieChart.value, 'dark');
  workloadBarChart = echarts.init(refModuleWorkloadBarChart.value, 'dark');
  workloadPieChart = echarts.init(refModuleWorkloadPieChart.value, 'dark');
  workloadDerivativesLineChart = echarts.init(refWorkloadDerivativesLineChart.value, 'dark');
  totalWorkloadLineChart = echarts.init(refTotalWorkloadLineChart.value, 'dark');


  activetimeBarChart.setOption(activetimeBarOption);
  activetimePieChart.setOption(activetimePieOption);
  workloadBarChart.setOption(workloadBarOption);
  workloadPieChart.setOption(workloadPieOption);
  workloadDerivativesLineChart.setOption(workloadDerivativesLineOption);
  totalWorkloadLineChart.setOption(totalWorkloadLineOption);
});

function disposeCharts(...charts) {
  charts.forEach(c => {
    if (c) c.dispose();
  });
}

onUnmounted(() => {
  disposeCharts(
      activetimeBarChart,
      activetimePieChart,
      workloadBarChart,
      workloadPieChart,
      workloadDerivativesLineChart,
      totalWorkloadLineChart
  )
});

/**
 * @template T, R
 * @param {R[]} data
 * @param {function(R): T} eachLoop
 * @param {function(T): string} tooltipMapper
 * @param {string} title
 * @param yName
 * @return {object}
 */
function getHeatLevelOption(data, eachLoop, tooltipMapper, title, yName = '脑力负荷程度') {
  const chartData = data.map(eachLoop);
  return {
    title: {
      text: title
    },
    tooltip: {
      trigger: 'axis',
      formatter: function (params) {
        return tooltipMapper(params[0].value);
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: '时间 (ms)',
      axisLabel: {
        formatter: '{value}'
      },
      splitLine: {
        show: true
      }
    },
    yAxis: {
      type: 'value',
      name: yName,
      splitLine: {show: true}
    },
    series: [{
      name: '事件值',
      type: 'line',
      showSymbol: false,
      smooth: true,
      lineStyle: {
        width: 3,
        color: '#5470C6'
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          {offset: 0, color: 'rgba(84, 112, 198, 0.5)'},
          {offset: 1, color: 'rgba(84, 112, 198, 0.1)'}
        ])
      },
      emphasis: {
        focus: 'series'
      },
      data: chartData
    }],
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100
      },
      {
        start: 0,
        end: 100
      }
    ]
  };
}


</script>

<template>
  <div class="theme-bg" style="display: flex; flex-direction: column; gap: 4px; padding: 12px; align-items: center">
    <div>
      仿真负荷监视报告
    </div>
    <div style="width: 100px; height: 1px; background: rgba(255,255,255,0.3);"/>
    <div style="display: flex; flex-direction: column; gap: 24px; padding-top: 24px">
      <div style="display: flex;">
        <div ref="refModuleActivetimeBarChart" style="width: 500px; height: 300px"/>
        <div ref="refModuleActivetimePieChart" style="width: 500px; height: 300px"/>
      </div>
      <div style="display: flex;">
        <div ref="refModuleWorkloadBarChart" style="width: 500px; height: 300px"/>
        <div ref="refModuleWorkloadPieChart" style="width: 500px; height: 300px"/>
      </div>
    </div>
  </div>
  <div class="theme-bg" style="display: flex; flex-direction: column; gap: 4px; padding: 12px; align-items: center">
    <div>
      热力图
    </div>
    <div style="width: 100px; height: 1px; background: rgba(255,255,255,0.3);"/>
    <div style="display: flex; flex-direction: column; gap: 24px; padding-top: 24px">
      <div ref="refWorkloadDerivativesLineChart" style="width: 1000px; height: 300px"/>
      <div ref="refTotalWorkloadLineChart" style="width: 1000px; height: 300px"/>
    </div>
  </div>
</template>

<style scoped>

</style>
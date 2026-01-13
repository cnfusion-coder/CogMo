<script setup>

import {computed} from "vue";

const props = defineProps({status: Number});

const color = computed(() => {
  switch (props.status) {
    case -1:
    case 0:
      return "#ff4747"
    case 1:
      return "#ff9a47"
    case 2:
      return "#a9ff3c"
  }
});

const title = computed(() => {
  switch (props.status) {
    case -1:
      return "连接错误"
    case 0:
      return "连接断开"
    case 1:
      return "连接尝试"
    case 2:
      return "连接正常"
  }
});

const backgroundColorStyle = computed(() => ({backgroundColor: color.value}));
const colorStyle = computed(() => ({color: color.value}));

</script>

<template>
  <div style="display: flex; align-items: center; gap: 8px">
    <div style="width: 8px; height: 8px; border-radius: 4px" :style="backgroundColorStyle"/>
    <div :style="colorStyle">{{ title }}</div>
  </div>
</template>

<style scoped>

</style>
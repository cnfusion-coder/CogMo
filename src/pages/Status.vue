<script setup>

import {ref} from "vue";
import InitStatus from "./layouts/InitStatus.vue";
import StatusVariable from "./layouts/StatusVariable.vue";

const selected = ref("InitStatus");

</script>

<template>
  <div>
    <el-radio-group v-model="selected">
      <el-radio-button value="InitStatus">
        初始状态
      </el-radio-button>
      <el-radio-button value="StatusVariable">
        状态变量
      </el-radio-button>
    </el-radio-group>

    <InitStatus v-if="selected === 'InitStatus'"/>

    <StatusVariable v-else-if="selected === 'StatusVariable'" />

  </div>
</template>

<style scoped>

</style>
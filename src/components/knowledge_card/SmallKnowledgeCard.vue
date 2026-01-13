<script setup>
import {defineProps} from "vue";

const props = defineProps({
  knowledge: {
    default: {
      id: 0,
      title: 'KNOWN'
    }
  }
});

</script>

<template>
  <div class="small-knowledge-card-container">
    <el-text style="margin-left: 4px; font-size: small">
      {{ props.knowledge.title }}
    </el-text>
  </div>
</template>

<style scoped>

.small-knowledge-card-container {
  margin: 2px;
  padding: 2px;
  box-shadow: #141414 1px 1px 1px;
  border-radius: 4px;
  border: white solid 1px;
  background-color: rgba(24, 37, 101, 0.74);
  text-align: center;
}

</style>
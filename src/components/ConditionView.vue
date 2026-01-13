<script setup>

import {computed, defineProps} from "vue";
import {parseTrunkType} from "../utils/models.js";
import ScrollingBadge from "./ScrollingBadge.vue";
import {useI18nStore} from "../plugins/store.js";

/**
 * @type {{
 *   condition: PCondition,
 *   expend: boolean
 * }}
 */
const props = defineProps({
  condition: Object,
  expend: Boolean
});

const i18nStore = useI18nStore();

const conditionPrefix = computed(() => {
  const c = props.condition;
  let res = '';
  switch (c.prefixmark) {
    case '{':
    case 'LEFT': {
      res += '{ ';
      break;
    }
    case '}':
    case 'RIGHT': {
      res += '} ';
      break;
    }
    case 'not':
    case '!': {
      res += 'NOT ';
      break;
    }
    default:
      break;
  }
  return res;
});

const idText = computed(() => `KNO ${props.condition.cknowledge.id}`);

const conditionText = computed(() => {
  if (props.expend) {
    return props.condition.cknowledge.title;
  } else {
    return idText.value;
  }
});

const tagColor = computed(() => parseTrunkType(props.condition.cknowledge).tint)

</script>

<template>
  <div style="display: flex; align-items: center; gap: 8px">
    <div v-if="conditionPrefix !== ''">
      {{ conditionPrefix }}
    </div>
    <el-popover width="180px">
      <template #reference>
        <ScrollingBadge :label="conditionText" :color="tagColor"/>
      </template>
      <div style="display: flex; flex-direction: column; gap: 2px; align-items: start">
        <div style="font-weight: bold">
          {{ i18nStore.t('600.title') || '标题' }}：
        </div>
        <div>
          {{ props.condition.cknowledge.title }}
        </div>
        <div style="height: 6px"/>
        <div style="font-weight: bold">
          {{ i18nStore.t('600.description') || '描述' }}：
        </div>
        <div>
          {{ props.condition.cknowledge.description }}
        </div>
        <div style="height: 6px"/>
        <div :style="{color: tagColor}" style="font-weight: bold; align-self: center">
          {{ props.condition.cknowledge.trunktype.name }} {{ i18nStore.t('600.module') || '模块' }}
        </div>
        <div style="height: 6px"/>
        <div style="font-size: smaller; align-self: end">
          {{ i18nStore.t('600.declarativeKnowledgeId') || '陈述知识编号' }}：
          <span style="font-weight: bold">{{ idText }}</span>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<style scoped>

</style>

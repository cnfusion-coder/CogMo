<script setup>

import {Delete} from "@element-plus/icons-vue";
import {
  expressionViewPart,
  isKno,
  isSym, isSymBracket, isSymLB, isSymRB,
  symToString
} from "../../components/knowledge_builder/expression_builder";
import SmallKnowledgeCard from "../../components/knowledge_card/SmallKnowledgeCard.vue";
import {bracketColor} from "../../utils/global.js";
import {computed, ref, defineProps, watch} from "vue";

const isDragging = ref(false);
const expressionView = ref([]);

const props = defineProps({
  expression: {
    default: {}
  },
  showBetween: {
    type: Boolean,
    default: false
  },
  separable: {
    type: Boolean,
    default: false
  },
  error: {
    type: Boolean,
    default: false
  }
});

const cardClass = computed(() => {
  if (props.error) {
    return ['error-card']
  } else if (isDragging.value)
    return ['dragging-card']
  else
    return ['base-card']
});

function bracketStyle(symbol) {
  return {
    width: '100px',
    height: '30px',
    borderRadius: '15px',
    borderTop: `${bracketColor(symbol.meta.depth)} solid ${isSymLB(symbol) ? '2px' : '0'}`,
    borderBottom: `${bracketColor(symbol.meta.depth)} solid ${isSymRB(symbol) ? '2px' : '0'}`,
    overflow: 'hidden',
    bottom: isSymLB(symbol) ? '-15px' : '0',
    top: isSymRB(symbol) ? '-15px' : '0'
  }
}

watch(() => props.expression, (newValue) => {
  expressionView.value = expressionViewPart(newValue)
}, {immediate: true, deep: true});

</script>

<template>
  <div>
    <el-space direction="vertical">
      <el-card :class="cardClass">
        <el-row>
          <el-col :span="18" style="text-align: center; height: 100%">
            <el-space direction="vertical">
              <div v-for="part in expressionView.map((item, index) => ({item, index}))" :key="part.index">
                <div v-if="isSymBracket(part.item)" :style="bracketStyle(part.item)"/>
                <el-text v-else-if="isSym(part.item)">{{ symToString(part.item) }}</el-text>
                <div v-else-if="isKno(part.item)">
                  <SmallKnowledgeCard :knowledge="part.item.value"/>
                </div>
              </div>
              <el-button v-if="props.separable" @click="$emit('click-split')">
                拆分
              </el-button>
            </el-space>
          </el-col>
          <el-col :span="6" style="text-align: center">
            <el-space direction="horizontal">
              <el-button type="danger" @click="$emit('click-not')" plain>
                非
              </el-button>
              <el-icon @click="$emit('click-del')">
                <Delete/>
              </el-icon>
            </el-space>
          </el-col>
        </el-row>
      </el-card>

      <div v-if="props.showBetween" class="between">
        <el-button-group>
          <el-button @click="$emit('click-and')">且</el-button>
          <el-button @click="$emit('click-or')">或</el-button>
        </el-button-group>
      </div>
    </el-space>
  </div>
</template>

<style scoped>

.between {
  width: 100%;
}

.base-card {
  margin: 8px;
  min-width: 400px;
  box-shadow: #141414 2px 2px 6px;
}

.dragging-card {
  margin: 8px;
  min-width: 400px;
  box-shadow: white 2px 2px 6px;
}

.error-card {
  margin: 8px;
  min-width: 400px;
  box-shadow: white 2px 2px 6px;
  border: red solid 2px;
}
</style>
<script setup>
import {ref, watch} from 'vue';

const props = defineProps({
  label: String,
  color: String
});

const scrollContent = ref(null);
const scrollContainer = ref(null);
let scrollAnimationFrame = null;

const scrollSpeed = 1;

let aRoundComplete = false;

const startScrolling = () => {
  if (!scrollContent.value || !scrollContainer.value) return;

  const contentWidth = scrollContent.value.offsetWidth;
  const containerWidth = scrollContainer.value.offsetWidth;

  // 判断内容是否超过容器宽度
  if (contentWidth > containerWidth) {
    let scrollLeft = containerWidth;
    scrollContent.value.style.transition = "transition: transform 0.1s ease-in-out";

    const animateScroll = () => {
      scrollLeft -= scrollSpeed;
      if (aRoundComplete === true) {
        aRoundComplete = false;
        scrollContent.value.style.transition = "transition: transform 0.1s ease-in-out";
      }
      if (scrollLeft <= -contentWidth) {
        scrollContent.value.style.transition = 'none';
        aRoundComplete = true;
        scrollLeft = containerWidth;
      }
      scrollContent.value.style.transform = `translateX(${scrollLeft}px)`;
      scrollAnimationFrame = requestAnimationFrame(animateScroll);
    };

    if (!scrollAnimationFrame) animateScroll();
  } else {
    if (scrollAnimationFrame) {
      cancelAnimationFrame(scrollAnimationFrame);
      scrollAnimationFrame = null;
      scrollContent.value.style.transition = 'none';
      scrollContent.value.style.transform = 'translateX(0)';
    }
  }
};

watch(() => props.label, () => {
  requestAnimationFrame(startScrolling);
}, {immediate: true});
</script>

<template>
  <el-tag :color="props.color + '20'" :style="{color: props.color, borderColor: props.color}" style="height: 30px">
    <div class="scroll-container" ref="scrollContainer">
      <div class="scroll-content content-text" ref="scrollContent">
        {{ props.label }}
      </div>
    </div>
  </el-tag>
</template>

<style scoped>

.content-text {
  font-size: small;
  font-weight: bold;
}

.scroll-container {
  position: relative;
  max-width: 100px;
  height: 20px;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.scroll-content {
  white-space: nowrap;
  display: inline-block;
  transition: transform 0.1s ease-in-out;
}
</style>

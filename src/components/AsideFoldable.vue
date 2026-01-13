<template>
  <el-menu
      :default-active="props.thisPath"
      class="aside-menu"
      :collapse="isCollapse"
      active-text-color="#95a2ff"
      popper-effect="dark"
      background-color="transparent"
      router
  >
    <el-menu-item @click="switchCollapse">
      <el-icon color="#e1e1e1" class="no-inherit">
        <div v-if="isCollapse">
          <Expand/>
        </div>
        <div v-else>
          <Fold/>
        </div>
      </el-icon>
      <template #title>{{ i18nStore.t('900.menuTitle') || '功能菜单' }}</template>
    </el-menu-item>

    <el-menu-item :index="item.path" v-for="item in identityStore.availableAsideFunctions" v-bind:key="item.key">
      <el-icon v-html="item.icon.template">
      </el-icon>
      <template #title>{{ i18nStore.t(item.titleKey) || item.title }}</template>
    </el-menu-item>
  </el-menu>
</template>

<script setup>
import {Expand, Fold} from "@element-plus/icons-vue";
import {computed, ref, defineProps} from "vue";
import {useI18nStore, useIdentityStore} from "../plugins/store.js";

const identityStore = useIdentityStore();
const i18nStore = useI18nStore();

const isCollapse = ref(false);

function switchCollapse() {
  isCollapse.value = !isCollapse.value;
}

const props = defineProps({
  thisPath: {
    type: String,
    default: ''
  }
});

</script>

<style>

.aside-menu {
  border-right: 0 #141414;
}

.aside-menu:not(.el-menu--collapse) {
  width: 200px;
}

</style>

<script>
import HeaderMenu from "./components/HeaderMenu.vue";
import AsideFoldable from "./components/AsideFoldable.vue";
import {useThemeStore} from "./plugins/store.js";

// 解决 ERROR ResizeObserver loop completed with undelivered notifications.
const debounce = (fn, delay) => {
  let timer = null;
  return function () {
    let context = this;
    let args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function () {
      fn.apply(context, args);
    }, delay);
  }
}

const _ResizeObserver = window.ResizeObserver;
window.ResizeObserver = class ResizeObserver extends _ResizeObserver {
  constructor(callback) {
    callback = debounce(callback, 16);
    super(callback);
  }
}

export default {
  name: 'App',
  components: {AsideFoldable, HeaderMenu},
  mounted() {
    useThemeStore();
  },
}
</script>

<template>

  <div class="background-mask"/>
  <div class="background-image"/>

  <el-container class="main-container">
    <el-header class="styled-fragment">
      <HeaderMenu/>
    </el-header>

    <el-container style="height: 100%; display: flex;">

      <el-aside class="styled-fragment aside scrollable" style="height: calc(100vh - 110px);">
        <AsideFoldable :this-path="this.$route.path"/>
      </el-aside>

      <el-main class="styled-fragment scrollable"
               style="width: 100%; height: calc(100vh - 110px)">
        <el-scrollbar>
          <router-view>
          </router-view>
        </el-scrollbar>
      </el-main>
    </el-container>
  </el-container>
</template>

<style>


#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--color-text);
}

.aside {
  flex: fit-content;
}

.main-container {
  z-index: 1;
  height: 100%;

}

.background-image {
  z-index: -2;
  background: url("./assets/bg.jpg");
  background-size: cover;
  width: 100%;
  height: 100%;
  position: fixed;
}

.background-mask {
  z-index: -1;
  background-color: var(--color-mask);
  background-size: cover;
  width: 100%;
  height: 100%;
  position: fixed;
}

.styled-fragment {
  margin: 12px;
  background-color: var(--color-surface);
  border: var(--color-border) solid 2px;
  border-radius: 12px;
  box-shadow: var(--color-shadow) 0 0 12px;
}

.styled-module {
  margin: 4px;
  background-color: var(--color-surface);
  border: var(--color-border) solid 2px;
  border-radius: 12px;
}

</style>

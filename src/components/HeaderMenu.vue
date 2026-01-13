<script setup>
import { computed, ref } from 'vue'
import router from "../plugins/router";
import {User, UserFilled} from "@element-plus/icons-vue";
import {generalMode} from "../configs/global.js";
import * as visual from "../configs/visual.js";
import {useI18nStore, useIdentityStore, useThemeStore} from "../plugins/store.js";

const activeIndex = ref('1')

const i18nStore = useI18nStore();
const title = computed(() => generalMode
  ? (i18nStore.t('900.titleActr') || 'ACT-R认知模型建模与仿真科研平台')
  : (i18nStore.t('900.titleCgn') || '中广核认知模型建模与仿真科研平台'));

const identityStore = useIdentityStore();
const themeStore = useThemeStore();

const handleSelect = (key, keyPath) => {
  console.log(key, keyPath)
}

const logout = () => {
  identityStore.clearIdentify();
  router.push('/home')
}

</script>

<style>
.flex-grow {
  flex-grow: 1;
}

.menu-framework > el-menu-item {
  border-bottom: none;
  text-decoration: none;
}


  .theme-select {
    width: 160px;
  }
</style>

<template>
  <el-menu
      :default-active="activeIndex"
      class="menu-framework"
      mode="horizontal"
      :active-text-color="visual.color.primary"
      :ellipsis="false"
      @select="handleSelect"
      background-color="transparent"
  >
    <el-menu-item>
      <img v-if="!generalMode" style="width: 180px" src="../assets/cgn_logo.png" alt="Element logo" />
      <span style="width: 12px"></span>
      <h2 style="font-size: x-large">{{title}}</h2>
    </el-menu-item>
    <div class="flex-grow" />
    <el-menu-item index="2">
      <template #title>
        <div style="display: flex; align-items: center; gap: 8px">
          <el-text>{{ i18nStore.t('900.language') || '语言' }}</el-text>
          <el-select
            v-model="i18nStore.language"
            size="small"
            class="theme-select"
            popper-class="theme-select-popper"
            :placeholder="i18nStore.t('900.selectLanguage') || '选择语言'"
          >
            <el-option
              v-for="languageOption in i18nStore.availableLanguages"
              :key="languageOption.value"
              :label="languageOption.label"
              :value="languageOption.value"
            />
          </el-select>
        </div>
      </template>
    </el-menu-item>
    <el-menu-item index="3">
      <template #title>
        <div style="display: flex; align-items: center; gap: 8px">
          <el-text>{{ i18nStore.t('900.uiStyle') || 'UI风格' }}</el-text>
          <el-select
            v-model="themeStore.theme"
            size="small"
            class="theme-select"
            popper-class="theme-select-popper"
            :placeholder="i18nStore.t('900.selectTheme') || '选择主题'"
          >
            <el-option
              v-for="theme in themeStore.availableThemes"
              :key="theme.value"
              :label="i18nStore.t(theme.labelKey) || theme.label"
              :value="theme.value"
            />
          </el-select>
        </div>
      </template>
    </el-menu-item>
    <el-menu-item index="4">
      <template #title>
        <el-popover>
          <template #reference>
            <div style="display: flex; align-items: center; gap: 4px">
              <el-icon>
                <User/>
              </el-icon>
              <div>
                {{ i18nStore.t('900.userCenter') || '用户中心' }}
              </div>
            </div>
          </template>
          <div v-if="identityStore.isLogin" style="width: 100%; display: flex; flex-direction: column; gap: 4px; align-items: center">
            <el-avatar :icon="UserFilled" />
            <el-text>
              {{ identityStore.identity.username }}
            </el-text>
            <el-text type="info">
              {{ identityStore.roleName }}
            </el-text>
            <el-button type="text" @click="logout">
              {{ i18nStore.t('900.logout') || '退出登录' }}
            </el-button>
          </div>
          <div v-else style="width: 100%; display: flex; flex-direction: column; gap: 4px; align-items: center">
            <el-text>
              {{ i18nStore.t('900.notLoggedIn') || '未登录' }}
            </el-text>
            <el-button type="text" @click="router.push('/login')">
              {{ i18nStore.t('900.login') || '登录' }}
            </el-button>
            <el-button type="text" style="margin-left: 0" @click="router.push('/register')">
              {{ i18nStore.t('900.register') || '注册' }}
            </el-button>
          </div>

        </el-popover>

      </template>
    </el-menu-item>
  </el-menu>
</template>



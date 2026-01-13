<!-- src/pages/Home.vue -->

<template>
  <div class="home-content">
    <img v-if="!generalMode" src="../assets/cgn_logo.png" style="width: 200px;" alt="CGN Logo"/>
    <el-text>
      <h2>{{ welcomeTitle }}</h2>
    </el-text>

    <el-text v-if="identityStore.isLogin">
      {{ greetingMessage }}
    </el-text>
    <el-text v-else>
      {{ i18nStore.t('900.homePlease') || '请' }}
      <router-link to="/login" class="primary-text">
        {{ i18nStore.t('900.login') || '登录' }}
      </router-link>
      {{ i18nStore.t('900.homeUseMoreFeatures') || '以使用更多系统功能' }}
    </el-text>
    <el-row style="width: 90%;">
      <el-col :xs="24" :sm="8" :md="6" :lg="4" v-for="fun in identityStore.availableAsideFunctions" :key="fun.key">
        <el-card style="margin: 12px; cursor: pointer;" shadow="hover" @click="router.push(fun.path)">
          <div style="width: 100%; display: flex; flex-direction: column; align-items: center; gap: 16px">
            <el-icon v-html="fun.icon.template" size="32px"/>
            <el-text>
              {{ fun.title }}
            </el-text>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import {computed} from "vue";
import router from "../plugins/router";
import {generalMode} from "../configs/global.js";
import {useI18nStore, useIdentityStore} from "../plugins/store.js";

const identityStore = useIdentityStore();
const i18nStore = useI18nStore();
const userNickname = computed(() => identityStore.identity.username);
const welcomeTitle = computed(() => (generalMode
  ? (i18nStore.t('900.homeWelcomeActr') || '欢迎登录ACT-R认知模型建模平台')
  : (i18nStore.t('900.homeWelcomeCgn') || '欢迎登录中广核认知模型建模平台')));

const greet = computed(() => {
  const nowHour = new Date().getHours();
  if (nowHour < 6 || nowHour >= 22) {
    return i18nStore.t('900.greetingLateNight') || '夜深了';
  } else if (nowHour < 12) {
    return i18nStore.t('900.greetingNoon') || '中午好';
  } else if (nowHour < 2) {
    return i18nStore.t('900.greetingNoon') || '中午好';
  } else if (nowHour < 19) {
    return i18nStore.t('900.greetingAfternoon') || '下午好';
  } else {
    return i18nStore.t('900.greetingEvening') || '晚上好';
  }
});


const roleView = computed(() => {
  switch (identityStore.identity.role) {
    case 2:
      return i18nStore.t('900.roleAdminPlain') || '管理员'
    case 3:
      return i18nStore.t('900.roleSuperAdmin') || '超级管理员'
    default:
      return i18nStore.t('900.roleEmployee') || '员工'
  }
})

const greetingMessage = computed(() => {
  const template = i18nStore.t('900.homeGreetingMessage') || '{greet}，尊敬的 {role} {name}';
  return template
    .replace('{greet}', greet.value)
    .replace('{role}', roleView.value)
    .replace('{name}', userNickname.value);
});
</script>

<style scoped>

.home-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.horizontal-center-container {
  text-align: center;
  width: 100%;
}

.primary-text {
  color: var(--color-primary);
  text-decoration-line: none;
}

</style>

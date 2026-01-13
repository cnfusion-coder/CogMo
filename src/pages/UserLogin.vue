<script setup>
import {Check} from "@element-plus/icons-vue";
import {computed, ref} from "vue";
import router from "../plugins/router";
import {baseServer} from "../plugins/axios";
import {ElMessage} from "element-plus";
import * as visual from "../configs/visual.js";
import {useIdentityStore} from "../plugins/store.js";

const inputForm = ref({
  role: 1,
  username: '',
  password: '',
});

const loginLoading = ref(false);
const userPermissions = ref(['模型运行']);
const normalAdminPermissions = ref(['模型运行', '模型创建', '知识录入', '用户管理']);
const superAdminPermissions = ref(['模型运行', '模型创建', '知识录入', '用户管理', '管理员管理']);

const userChoiceClass = computed(() => ({
  'active-choice': inputForm.value.role === 1,
  'disable-choice': inputForm.value.role !== 1,
  'img-father': true
}));

const normalAdminChoiceClass = computed(() => ({
  'active-choice': inputForm.value.role === 2,
  'disable-choice': inputForm.value.role !== 2,
  'img-father': true
}));

const superAdminChoiceClass = computed(() => ({
  'active-choice': inputForm.value.role === 3,
  'disable-choice': inputForm.value.role !== 3,
  'img-father': true
}));

const loginBtnHint = computed(() => ('登录到' + activeRoleName()));

const registerable = computed(() => (inputForm.value.role === 1));

function register() {
  if (inputForm.value.role === 1) {
    router.push('/register')
  }
}

function switchToRole(index) {
  if (loginLoading.value) return;
  inputForm.value.role = index;
}

function activeRoleName() {
  switch (inputForm.value.role) {
    case 1:
      return '用户';
    case 2:
      return '普通管理员';
    case 3:
      return '超级管理员';
  }
}

const identityStore = useIdentityStore();

function login() {
  loginLoading.value = true;
  baseServer.post('/api/user/login/', inputForm.value)
      .then(response => {
        identityStore.updateIdentifyToken(response.data.token)
        identityStore.loadIdentify();
        router.push('/home')
      })
      .catch(e => {
        ElMessage.error(e);
        console.log(e);
      })
      .finally(() => {
        loginLoading.value = false;
      });
}

</script>

<template>
  <el-row class="top-tag">
    <el-col :span="16" class="vertical-center horizontal-container">
      <div :class="userChoiceClass" @click="switchToRole(1)">
        <div class="user-choice-img">
          <div>
            <el-space direction="vertical">
              <el-text><h2>注册用户</h2></el-text>
              <el-text v-for="item in userPermissions.map((value, index) => ({ value, index }))"
                       v-bind:key="item.index">
                <el-icon size="16px">
                  <Check/>
                </el-icon>
                {{ item.value }}
              </el-text>
            </el-space>
          </div>
          <div class="hint-icon">
            <el-icon size="54px" color="white">
              <svg class="hint-icon-svg" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M748.352 609.152a32 32 0 0 1-20.288-7.232 384.32 384.32 0 0 0-71.424-46.4 32 32 0 0 1 28.48-57.28c29.44 14.656 57.536 32.896 83.584 54.208a32 32 0 0 1-20.352 56.704zM78.784 983.36a32 32 0 0 1-32-32v-57.728A441.28 441.28 0 0 1 314.88 487.424a32.064 32.064 0 0 1 25.216 58.88 377.216 377.216 0 0 0-229.312 347.328v57.728a32 32 0 0 1-32 32z"/>
                <path
                    d="M505.728 609.024a286.848 286.848 0 0 1-286.528-286.528A286.848 286.848 0 0 1 505.728 35.968a286.848 286.848 0 0 1 286.528 286.528 286.848 286.848 0 0 1-286.528 286.528z m0-509.056a222.784 222.784 0 0 0-222.528 222.528c0 122.688 99.84 222.528 222.528 222.528s222.528-99.84 222.528-222.528a222.784 222.784 0 0 0-222.528-222.528zM809.408 988.032a32 32 0 0 1-22.656-54.592l113.152-113.152-113.152-113.152a32 32 0 0 1 45.248-45.248l135.744 135.744a32 32 0 0 1 0 45.248L832 978.624a31.68 31.68 0 0 1-22.592 9.408z"/>
                <path d="M909.76 852.224h-254.016a32 32 0 0 1 0-64h254.016a32 32 0 0 1 0 64z"/>
              </svg>
            </el-icon>
          </div>
        </div>
      </div>
      <div :class="normalAdminChoiceClass" @click="switchToRole(2)">
        <div class="normal-admin-choice-img">
          <div>
            <el-space direction="vertical">
              <el-text><h2>普通管理员</h2></el-text>
              <el-text v-for="item in normalAdminPermissions.map((value, index) => ({ value, index }))"
                       v-bind:key="item.index">
                <el-icon size="16px">
                  <Check/>
                </el-icon>
                {{ item.value }}
              </el-text>
            </el-space>
          </div>
          <div class="hint-icon">
            <el-icon size="54px" color="white">
              <svg class="hint-icon-svg" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M537.216 1003.776h-427.52c-27.072 0-52.8-11.456-70.592-31.296a76.352 76.352 0 0 1-19.904-58.88l-0.192-60.16a32 32 0 0 1 64 0v63.872c-0.384 5.44 0.576 8.832 3.968 12.608a30.656 30.656 0 0 0 22.72 9.856h427.52a32 32 0 0 1 0 64z"/>
                <path
                    d="M50.752 934.144a32 32 0 0 1-32-32v-60.032a457.536 457.536 0 0 1 277.952-421.12 32.192 32.192 0 0 1 42.048 16.832 32.128 32.128 0 0 1-16.896 42.112 393.408 393.408 0 0 0-239.104 362.24v60.032a32 32 0 0 1-32 31.936z"/>
                <path
                    d="M460.736 514.496a247.36 247.36 0 0 1-247.104-247.104A247.424 247.424 0 0 1 460.736 20.224a247.424 247.424 0 0 1 247.168 247.168 247.36 247.36 0 0 1-247.168 247.104z m0-430.272a183.36 183.36 0 0 0-183.104 183.168 183.296 183.296 0 0 0 183.104 183.104 183.36 183.36 0 0 0 183.168-183.104 183.36 183.36 0 0 0-183.168-183.168zM778.56 829.376c-42.944 0-77.888-34.944-77.888-77.888s34.944-77.888 77.888-77.888 77.888 34.944 77.888 77.888-34.944 77.888-77.888 77.888z m0-110.976a33.216 33.216 0 1 0 0.064 66.368 33.216 33.216 0 0 0-0.064-66.368z"/>
                <path
                    d="M834.56 960.384a22.4 22.4 0 0 1-22.144-19.2 35.2 35.2 0 0 0-34.56-30.208c-17.152 0-32 12.864-34.624 30.016a22.272 22.272 0 0 1-28.736 17.984 217.536 217.536 0 0 1-84.352-49.344 22.4 22.4 0 0 1 1.28-33.728 35.136 35.136 0 0 0 8.32-44.864 35.84 35.84 0 0 0-42.88-15.04 22.4 22.4 0 0 1-29.76-15.936c-3.712-16.448-5.632-32.768-5.632-48.64s1.92-32.192 5.632-48.64a22.144 22.144 0 0 1 11.2-14.72 22.528 22.528 0 0 1 18.496-1.216 34.944 34.944 0 1 0 34.56-59.968 22.336 22.336 0 0 1-8.192-16.64 21.248 21.248 0 0 1 6.976-16.96 217.472 217.472 0 0 1 84.352-49.28 22.4 22.4 0 0 1 28.672 18.048 35.328 35.328 0 0 0 34.624 29.952 35.2 35.2 0 0 0 34.56-30.208 22.4 22.4 0 0 1 28.608-18.304 217.6 217.6 0 0 1 85.248 49.088 22.336 22.336 0 0 1-1.472 34.048 34.88 34.88 0 0 0-8.896 45.056 35.84 35.84 0 0 0 43.776 14.784 22.592 22.592 0 0 1 30.208 15.552 214.336 214.336 0 0 1 0 98.816 22.592 22.592 0 0 1-30.336 15.552 35.456 35.456 0 0 0-43.648 14.72 35.008 35.008 0 0 0 8.96 45.184 22.4 22.4 0 0 1 1.408 34.048 218.368 218.368 0 0 1-85.312 49.024 19.584 19.584 0 0 1-6.336 1.024z m-56.768-94.144c30.144 0 57.024 17.216 70.592 42.752 10.624-4.736 20.864-10.624 30.528-17.536a79.232 79.232 0 0 1-1.728-82.56 81.024 81.024 0 0 1 72.832-39.744 164.16 164.16 0 0 0 0-35.264 81.28 81.28 0 0 1-72.768-39.68 80.128 80.128 0 0 1 1.792-82.496 166.336 166.336 0 0 0-30.656-17.664c-13.504 25.6-40.448 42.816-70.592 42.816-29.824 0-56.64-17.024-70.336-42.304a179.072 179.072 0 0 0-30.336 17.792c15.104 24.384 16.256 55.68 1.28 81.792-14.528 25.216-43.008 42.432-71.296 39.872a147.776 147.776 0 0 0 0 35.008 83.84 83.84 0 0 1 71.296 39.744c15.04 26.24 13.888 57.536-1.216 81.92 9.472 6.976 19.648 12.928 30.336 17.792 13.696-25.216 40.512-42.24 70.272-42.24z"/>
              </svg>
            </el-icon>
          </div>
        </div>
      </div>
      <div :class="superAdminChoiceClass" @click="switchToRole(3)">
        <div class="super-admin-choice-img">
          <div>
            <el-space direction="vertical">
              <el-text><h2>超级管理员</h2></el-text>
              <el-text v-for="item in superAdminPermissions.map((value, index) => ({ value, index }))"
                       v-bind:key="item.index">
                <el-icon size="16px">
                  <Check/>
                </el-icon>
                {{ item.value }}
              </el-text>
            </el-space>
          </div>
          <div class="hint-icon">
            <el-icon size="54px" color="white">
              <svg class="hint-icon-svg" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M512 552.128c-140.352 0-254.528-114.176-254.528-254.528S371.648 43.136 512 43.136c140.288 0 254.528 114.176 254.528 254.528S652.288 552.128 512 552.128z m0-444.992c-105.024 0-190.528 85.44-190.528 190.528S406.976 488.128 512 488.128c105.088 0 190.528-85.44 190.528-190.528S617.088 107.136 512 107.136zM525.376 980.864a32.064 32.064 0 0 1-25.216-12.224L424.96 872.512a32.32 32.32 0 0 1-6.464-24.704l31.68-204.032a32 32 0 0 1 31.616-27.072h79.232a32 32 0 0 1 31.616 27.136l31.68 204.032a32 32 0 0 1-5.44 23.232l-67.264 96.128a32.128 32.128 0 0 1-25.344 13.632h-0.896z m-41.472-136.896l40.064 51.2 35.136-50.176-25.472-164.224h-24.384l-25.344 163.2z"/>
                <path
                    d="M957.824 972.288a32 32 0 0 1-31.872-35.328 416.064 416.064 0 0 0-279.872-436.544 31.872 31.872 0 0 1-20.032-40.512 31.872 31.872 0 0 1 40.64-19.968 479.936 479.936 0 0 1 322.88 503.744 31.936 31.936 0 0 1-31.744 28.608zM66.24 972.288a32 32 0 0 1-31.808-28.672 480.512 480.512 0 0 1 322.688-503.68 32 32 0 0 1 20.608 60.544 416 416 0 0 0-279.616 436.416 32 32 0 0 1-31.872 35.392z"/>
              </svg>
            </el-icon>
          </div>
        </div>
      </div>
    </el-col>
    <el-col :span="8">
      <el-space class="full-width" direction="vertical">

        <el-text class="full-width" size="large">
          <h2>用户登录</h2>
        </el-text>

        <el-row class="full-width">
          <el-col :span="6" style="display: flex; align-items: center; justify-content: right">
            <el-text class="input-title">用户名</el-text>
          </el-col>
          <el-col :span="18">
            <el-input :disabled="loginLoading" v-model="inputForm.username" style="width: 200px;"></el-input>
          </el-col>
        </el-row>
        <el-row class="full-width">
          <el-col :span="6" style="display: flex; align-items: center; justify-content: right">
            <el-text class="input-title">密码</el-text>
          </el-col>
          <el-col :span="18">
            <el-input :disabled="loginLoading" v-model="inputForm.password" style="width: 200px;"
                      show-password></el-input>
          </el-col>
        </el-row>
        <el-button
            class="full-width"
            :loading="loginLoading"
            :disabled="loginLoading"
            @click="login"
            type="primary"
            :color="visual.color.primary"
            dark
        >{{ loginBtnHint }}
        </el-button>
        <el-button
            class="full-width"
            @click="register"
            :disabled="(!registerable) || loginLoading"
            type="primary"
            :color="visual.color.primary"
            plain dark>注册
        </el-button>
      </el-space>
    </el-col>
  </el-row>
</template>

<style scoped>

.active-choice {
  width: 40%;
  height: 300px;
  border-radius: 12px;
  border: #4453bf solid 2px;
  margin: 5px;
  display: inline-flex;
  transition: all 0.2s;
  text-align: center;
  overflow: hidden;
}

.disable-choice {
  width: 25%;
  height: 300px;
  border-radius: 12px;
  border: #00000000 solid 2px;
  margin: 5px;
  display: inline-flex;
  transition: all 0.2s;
  text-align: center;
  overflow: hidden;
}

.img-father {
  justify-content: center;
}

.full-width {
  width: 300px;
}

.input-title {
  float: right;
  padding-right: 12px;
}

.content-text {
  text-align: left;
}

.user-choice-img {
  background: radial-gradient(circle at bottom right, #8ab229, #0c7e1f);
  position: relative;
  width: 100%;
  height: 100%;
}

.normal-admin-choice-img {
  background: radial-gradient(circle at bottom right, #3cb4e8, #235177);
  position: relative;
  width: 100%;
  height: 100%;
}

.super-admin-choice-img {
  background: radial-gradient(circle at bottom right, #af85d9, #a842ce);
  position: relative;
  width: 100%;
  height: 100%;
}

.horizontal-container {
  display: flex;
}

.dark-content {
  color: #141414;
}

.hint-icon {
  position: absolute;
  right: 20px;
  bottom: 20px;
}

.hint-icon-svg {
  position: relative;
  fill: currentColor;
}

.top-tag {
  text-align: center;
}

</style>
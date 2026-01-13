<script setup>
import {onMounted, ref} from "vue";
import {baseServer} from "../plugins/axios";
import {ElMessage} from "element-plus";

const loading = ref(false);

const users = ref(undefined);

function updateData() {
  loading.value = true;
  users.value = undefined;
  baseServer.get('/api/user/users')
      .then(response => {
        users.value = response.data;
      })
      .catch(e => {
        ElMessage.error('数据获取失败！');
        console.log(e);
      })
      .finally(() => {
        loading.value = false;
      })
}

const roleFilter = [
  {text: '普通用户', value: 'staff'},
  {text: '普通管理员', value: 'admin'},
  {text: '超级管理员', value: 'super'},
]

onMounted(() => {
  updateData();
});

</script>

<template>
  <div style="display: flex; width: 100%; flex-direction: column; gap: 4px">
    <div style="display: flex; flex-direction: column; align-items: center">
      <el-text style="font-weight: bold; font-size: large">
        用户列表
      </el-text>
      <el-text v-if="users">
        系统中共有 {{ users.length }} 个用户账号
      </el-text>
    </div>
    <el-card style="margin: 24px;">
      <div style="width: 100%; display: flex; flex-direction: column; align-items: center; gap: 8px">
        <el-table :data="users" style="width: 100%"
                  v-loading="loading"
                  height="512px">
          <el-table-column sortable prop="id" label="编号" width="80"/>
          <el-table-column
              sortable
              :filters="roleFilter"
              prop="role"
              :filter-method="(value, row) => row.role === value"
              label="角色"
              width="100"
          />
          <el-table-column sortable prop="username" label="用户名" width="200"/>
          <el-table-column sortable prop="email" label="邮箱"/>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<style scoped>

</style>
<script setup>
import {onMounted, ref} from "vue";
import axios from "axios";

const text = ref("");

onMounted(() => {
  axios.get("document.md")
      .then(response => {
        text.value = response.data.replaceAll("(doc_assets", "(/doc_assets")
      })
      .catch(e => console.error(e));
})

</script>

<template>
  <el-scrollbar height="80vh">
    <v-md-preview :text="text"/>
  </el-scrollbar>

</template>

<style scoped>

</style>
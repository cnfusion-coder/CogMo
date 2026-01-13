import {createApp} from 'vue';
import App from './App.vue';
import './assets/index.css';

const app = createApp(App);

// region ElementPlus
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/dark/css-vars.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
}
app.use(ElementPlus, {locale: zhCn});
// endregion

// region kangc's Vue Markdown Preview
import VMdPreview from '@kangc/v-md-editor/lib/preview';
import '@kangc/v-md-editor/lib/style/preview.css';

import githubTheme from '@kangc/v-md-editor/lib/theme/github';
import '@kangc/v-md-editor/lib/theme/style/github.css';
import './assets/theme_fix.css';

import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.min.css'
VMdPreview.use(githubTheme, {
    Hljs: hljs,
});

app.component("VMdPreview", VMdPreview);
// endregion

// region Pinia
import {createPinia} from "pinia";
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import {useI18nStore, useIdentityStore} from "./plugins/store.js";

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
app.use(pinia);
useIdentityStore().loadIdentify();
useI18nStore().loadTranslations();
// endregion

// region Router
import router from "./plugins/router";
app.use(router);
// endregion

app.mount('#app');

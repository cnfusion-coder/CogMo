<script setup>

import {onBeforeUnmount, onMounted, ref} from "vue";
import {createSession} from "../utils/brain_simu_session.js";

let unityInstance = null;

/**
 * @type {{value: HTMLCanvasElement}}
 */
const unityCanvas = ref(null);

const progressValue = ref(0);
const available = ref(false);

function unityShowBanner(msg, type) {
  console.error(msg, type);
}

onMounted(() => {
  available.value = false;
  const buildUrl = "brain_webgl";
  const loaderUrl = `${buildUrl}/WebGLBuild.loader.js`;

  const config = {
    dataUrl: `${buildUrl}/WebGLBuild.data.gz`,
    frameworkUrl: `${buildUrl}/WebGLBuild.framework.js.gz`,
    codeUrl: `${buildUrl}/WebGLBuild.wasm.gz`,
    streamingAssetsUrl: "StreamingAssets",
    companyName: "ZSTU CCIS Laboratory",
    productName: "Brain View",
    productVersion: "0.1",
    devicePixelRatio: 1.8,
    showBanner: unityShowBanner,
    compressed: true
  };

  const script = document.createElement("script");
  script.src = loaderUrl;
  script.onload = () => {
    createUnityInstance(unityCanvas.value, config, (progress) => {
      progressValue.value = Math.round(progress * 100);
    }).then((instance) => {
      available.value = true;
      unityInstance = instance;
    }).catch((message) => {
      alert(message)
    });
  }
  document.body.appendChild(script)
});

onBeforeUnmount(() => {
  if (unityInstance) {
    unityInstance.Quit().then(() => {
      unityInstance = null;
      available.value = false;
    })
  }
});

/**
 * @param {{event: string, data: any} | {event: string,data: any}[]} msg
 */
function sendEventToUnity(msg) {
  if (Array.isArray(msg)) {
    msg.forEach(sendEventToUnity)
  } else {
    if (unityInstance) {
      const msg_json = JSON.stringify(msg);
      unityInstance.SendMessage("GlobalScope", "Receive", msg_json)
    }
  }
}

/**
 * @type {BrainSimuSession |  null}
 */
let session = null;

function emitBegin() {
  session = createSession({onEvent: sendEventToUnity});
}

const stopping = ref(false);

function emitStop() {
  if (session) {
    stopping.value = true;
    session.close().then(() => {
      session = null;
      stopping.value = false;
    });
  }
}

/**
 * @param {string | number} module
 */
function emitActivate(module) {
  if (session) {
    session.activate(module);
  }
}

defineExpose({
  sendEventToUnity,
  emitBegin,
  emitStop,
  emitActivate
});

</script>

<template>
  <div style="width: 100%; height: 600px; display: flex; align-items: center; justify-content: center"
       v-show="!available">
    <el-progress type="dashboard" :percentage="progressValue">
      <template #default="{ percentage }">
        <div style="display: flex; flex-direction: column; align-items: center">
          <div style="font: x-large italic bold;">{{ percentage }}%</div>
          <div style="font-size: small">加载中</div>

        </div>
      </template>
    </el-progress>
    <!--    <div style="font: xxx-large italic bold;">{{ progressString }}</div>-->
  </div>
  <canvas ref="unityCanvas" id="unity-brain" width="1920" height="1080" class="unity-canvas"
          style="width: 100%; height: 600px"/>
</template>

<style scoped>

</style>
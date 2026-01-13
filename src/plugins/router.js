import {createRouter, createWebHashHistory} from 'vue-router';
import {functionIsAvailable} from "../configs/functions.js";
import {useIdentityStore} from "./store.js";


const routes = [
    {
        path: '/',
        redirect: '/home'
    },
    {
        path: '/register',
        name: 'register',
        component: () => import("../pages/UserRegister.vue")
    },
    {
        path: '/home',
        name: 'home',
        component: () => import("../pages/Home.vue")
    },
    {
        path: '/login',
        name: 'login',
        component: () => import("../pages/UserLogin.vue")
    },
    {
        path: '/reactor_model',
        name: 'reactor_model',
        component: () => import("../pages/ReactorModel.vue")
    },
    {
        path: '/task',
        name: 'task',
        component: () => import("../pages/Task.vue")
    },
    {
        path: '/declarative_knowledge',
        name: 'declarative_knowledge',
        component: () => import("../pages/DKnowledge.vue")
    },
    {
        path: '/procedural_knowledge',
        name: 'procedural_knowledge',
        component: () => import("../pages/PKnowledge.vue")
    },
    {
        path: '/cognitive_model',
        name: 'cognitive_model',
        component: () => import("../pages/CognitiveModel.vue")
    },
    {
        path: '/simulate',
        name: 'simulate',
        component: () => import("../pages/Simulate.vue")
    },
    {
        path: '/performance',
        name: 'performance',
        component: () => import("../pages/Performance.vue")
    },
    {
        path: '/parameter',
        name: 'parameter',
        component: () => import("../pages/Status.vue")
    },
    {
        path: '/user_manage',
        name: 'user_manage',
        component: () => import("../pages/User.vue")
    },
    {
        path: '/doc',
        name: 'doc',
        component: () => import("../pages/Document.vue")
    },
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

/**
 * @return {number}
 */
function getRole() {
    try {
        return useIdentityStore().identity.role;
    } catch (e) {
        console.error(e);
        return 0;
    }
}

router.beforeEach((to, from, next) => {
    if (functionIsAvailable(to.name, getRole())) {
        next();
    } else {
        next("/");
    }
});

export default router;
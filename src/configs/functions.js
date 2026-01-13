import {
    cognitiveModelIcon,
    declarativeKnowledgeIcon,
    homeIcon, documentIcon,
    loginIcon, machineIcon,
    manageIcon, performanceIcon,
    proceduralKnowledgeIcon,
    reactorModelIcon,
    taskIcon, typeIcon
} from "../assets/icons.js";

/**
 * @typedef {{
 *      key: number,
 *      title: string,
 *      titleKey: string,
 *      path: string,
 *      name: string,
 *      icon: {template: string},
 *      isAvailable(role: number): boolean
 *  }} FunctionEntity
 */

/**
 * @type {FunctionEntity[]}
 */
export const asideFunctions = [
    {
        key: 0,
        titleKey: '900.menuHome',
        title: '主页',
        path: '/home',
        name: 'home',
        icon: homeIcon,
        isAvailable() {
            return true;
        }
    },
    {
        key: 1,
        titleKey: '900.menuLogin',
        title: '登录',
        path: '/login',
        name: 'login',
        icon: loginIcon,
        isAvailable(role) {
            return role === 0;
        }
    },
    {
        key: 2,
        titleKey: '500.menuReactorModel',
        title: '堆型管理',
        path: '/reactor_model',
        name: 'reactor_model',
        icon: reactorModelIcon,
        isAvailable(role) {
            return role >= 3;
        }
    },
    {
        key: 3,
        titleKey: '500.menuTask',
        title: '任务管理',
        path: '/task',
        name: 'task',
        icon: taskIcon,
        isAvailable(role) {
            return role >= 2;
        }
    },
    {
        key: 4,
        titleKey: '500.menuDeclarativeKnowledge',
        title: '陈述知识管理',
        path: '/declarative_knowledge',
        name: 'declarative_knowledge',
        icon: declarativeKnowledgeIcon,
        isAvailable(role) {
            return role >= 2;
        }
    },
    {
        key: 5,
        titleKey: '500.menuProceduralKnowledge',
        title: '过程知识管理',
        path: '/procedural_knowledge',
        name: 'procedural_knowledge',
        icon: proceduralKnowledgeIcon,
        isAvailable(role) {
            return role >= 2;
        }
    },
    {
        key: 6,
        titleKey: '500.menuParameter',
        title: '参数变量管理',
        path: '/parameter',
        name: 'parameter',
        icon: typeIcon,
        isAvailable(role) {
            return role >= 2;
        }
    },
    {
        key: 7,
        titleKey: '500.menuCognitiveModel',
        title: '认知模型',
        path: '/cognitive_model',
        name: 'cognitive_model',
        icon: cognitiveModelIcon,
        isAvailable(role) {
            return role >= 2;
        }
    },
    {
        key: 8,
        titleKey: '500.menuSimulate',
        title: "仿真与负荷量化",
        path: "/simulate",
        name: 'simulate',
        icon: machineIcon,
        isAvailable(role) {
            return role >= 1;
        }
    },
    {
        key: 9,
        titleKey: '500.menuPerformance',
        title: "绩效评价",
        path: "/performance",
        name: 'performance',
        icon: performanceIcon,
        isAvailable(role) {
            return role >= 1;
        }
    },
    {
        key: 10,
        titleKey: '500.menuUserManage',
        title: '用户管理',
        path: '/user_manage',
        name: 'user_manage',
        icon: manageIcon,
        isAvailable(role) {
            return role >= 2;
        }
    },
    {
        key: 11,
        titleKey: '900.menuDocument',
        title: '使用文档',
        path: '/doc',
        name: 'doc',
        icon: documentIcon,
        isAvailable() {
            return true;
        }
    }
]

/**
 * @param {string} name
 * @param {number} role
 * @return {boolean}
 */
export function functionIsAvailable(name, role) {
    if (name === "register") return true;
    const target = asideFunctions.filter(e => (e.name === name));
    if (target.length === 1) {
        return target[0].isAvailable(role)
    } else {
        console.error(`Unknown Function Name: ${name}`);
        return false;
    }
}

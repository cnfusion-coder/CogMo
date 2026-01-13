import {baseServer, setTokenHeader} from "./axios.js";
import {asideFunctions} from "../configs/functions.js";
import {defineStore} from "pinia";
import {computed, ref, watch} from "vue";
import {v4 as uuidv4} from "uuid"
import {defaultTheme, getThemeByValue, themeCatalog} from "../configs/themes.js";

function identityStoreSetup() {
    const i18nStore = useI18nStore();

    /**
     * @typedef {{
     *     role: number,
     *     username: string,
     *     auth_token: string,
     *     nickname: string | undefined,
     *     id: number,
     *     email: string
     * }} Identity
     */

    /**
     * @return {Identity}
     */
    function defaultIdentity() {
        return {
            role: 0,
            username: '',
            auth_token: '',
            nickname: undefined,
            id: 0,
            email: ''
        }
    }


    const identity = ref(defaultIdentity());

    /**
     * @param {Identity} iden
     */
    function setIdentity(iden) {
        identity.value = iden;
    }

    function resetIdentity() {
        setIdentity(defaultIdentity())
    }

    const availableAsideFunctions = computed(() => asideFunctions.filter(item => item.isAvailable(identity.value.role)))

    const isLogin = computed(() => (identity.value.role !== 0));

    const roleName = computed(() => {
        switch (identity.value.role) {
            case 1:
                return i18nStore.t('900.roleStaff') || '普通用户'
            case 2:
                return i18nStore.t('900.roleAdmin') || '普通管理员'
            case 3:
                return i18nStore.t('900.roleSuperAdmin') || '超级管理员'
            default:
                return i18nStore.t('900.roleUnknown') || '未知角色'
        }
    });

    /**
     * @param {string} token
     */
    function updateIdentifyToken(token) {
        localStorage.setItem('identify_token', token)
    }

    function resetToken() {
        localStorage.removeItem('identify_token');
        setTokenHeader({});
    }

    async function loadIdentify() {
        const identifyToken = localStorage.getItem('identify_token');
        if (identifyToken) {
            setTokenHeader({Authorization: `TOKEN ${identifyToken}`});
            const iden = defaultIdentity();
            /**
             * @type {[{
             *     id: number,
             *     email: string,
             *     username: string,
             *     role: "guest" | "staff" | "admin" | "super"
             * }]}
             */
            const responseData = await baseServer.get('/api/user/me/')
                .then(response => response.data)
                .catch(resetToken);
            if (responseData.length === 1) {
                iden.id = responseData[0].id
                iden.email = responseData[0].email
                iden.username = responseData[0].username
                iden.auth_token = identifyToken
                switch (responseData[0].role.toLowerCase()) {
                    case 'staff':
                        iden.role = 1;
                        break;

                    case 'admin':
                        iden.role = 2;
                        break;

                    case 'super':
                        iden.role = 3;
                        break;
                }
                console.log(iden);
                setIdentity(iden);
            } else resetToken();
        }
    }

    function clearIdentify() {
        localStorage.removeItem('identify_token');
        baseServer.post('/api/user/logout/', undefined, {
            headers: {
                Authorization: `TOKEN ${identity.value.auth_token}`
            }
        })
            .catch(() => {
            });
        resetIdentity();
    }

    return {
        identity,
        availableAsideFunctions,
        isLogin,
        roleName,
        updateIdentifyToken,
        loadIdentify,
        clearIdentify
    }
}

export const useIdentityStore = defineStore("identity", identityStoreSetup, {});

function reportSaveStoreSetup() {
    /**
     * @type {{value: {
     *     uuid: string,
     *     title: string,
     *     data: WorkloadReportData
     * }[]}}
     */
    const reports = ref([]);

    /**
     * @param {WorkloadReportData} data
     * @param {string} title
     */
    function save(data, title = "") {
        const uuid = String(uuidv4());
        reports.value.push({data, uuid, title});
        return uuid;
    }

    /**
     * @param {string} uuid
     */
    function remove(uuid) {
        reports.value = reports.value.filter(e => e.uuid !== uuid);
    }

    /**
     * @param {string} uuid
     */
    function get(uuid) {
        const res = reports.value.filter(e => e.uuid === uuid);
        if (res.length !== 0) return res[0];
        return undefined;
    }

    return {reports, save, remove, get};
}

export const useReportSaveStore = defineStore("report", reportSaveStoreSetup, { persist: true });

export const usePerformanceStore = defineStore("performance", () => {
    const performances = ref([]);
    return { performances };
}, { persist: true });

export const useThemeStore = defineStore("theme", () => {
    const theme = ref(defaultTheme);

    const availableThemes = computed(() => themeCatalog);

    function applyTheme(value) {
        const themeInfo = getThemeByValue(value);
        const htmlElement = document.documentElement;
        htmlElement.setAttribute('data-theme', value);
        if (themeInfo?.useDark) {
            htmlElement.classList.add('dark');
        } else {
            htmlElement.classList.remove('dark');
        }
    }

    function setTheme(value) {
        theme.value = value;
    }

    watch(theme, (value) => {
        applyTheme(value);
    }, { immediate: true });

    return {
        theme,
        availableThemes,
        setTheme
    };
}, { persist: true });

export const useI18nStore = defineStore("i18n", () => {
    const language = ref('zh-CN');
    const translations = ref({});

    const availableLanguages = [
        { value: 'zh-CN', label: '中文' },
        { value: 'en', label: 'English' }
    ];

    function t(key) {
        return translations.value?.[key];
    }

    async function loadTranslations(targetLanguage = language.value) {
        const response = await baseServer.get('/api/locales/translations', {
            params: { language: targetLanguage }
        }).then(res => res.data).catch(() => ({ translations: {} }));
        translations.value = response.translations ?? {};
        return translations.value;
    }

    function setLanguage(value) {
        language.value = value;
    }

    watch(language, (value) => {
        loadTranslations(value);
    }, { immediate: true });

    return {
        language,
        translations,
        availableLanguages,
        t,
        setLanguage,
        loadTranslations
    };
}, { persist: true });

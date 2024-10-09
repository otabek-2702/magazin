<script setup>
import { VForm } from 'vuetify/components/VForm';
import { useGenerateImageVariant } from '@/@core/composable/useGenerateImageVariant';
import { useAppAbility } from '@/plugins/casl/useAppAbility';
// eslint-disable-next-line import/no-duplicates
import axios from '@axios';
import boyWithRocketDark from '@images/illustrations/boy-with-rocket-dark.png';
import boyWithRocketLight from '@images/illustrations/boy-with-rocket-light.png';
import { VNodeRenderer } from '@layouts/components/VNodeRenderer';
import { themeConfig } from '@themeConfig';
import { requiredValidator } from '@validators';
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const boyWithRocket = useGenerateImageVariant(boyWithRocketLight, boyWithRocketDark);
const isPasswordVisible = ref(false);
const route = useRoute();
const router = useRouter();
const ability = useAppAbility();

const errors = ref({
  username: undefined,
  password: undefined,
});

const refVForm = ref();
const username = ref();
const password = ref();
const error = ref(false);

const login = () => {
  axios
    .post('/auth/login', {
      login: username.value,
      password: password.value,
    })
    .then((r) => {
      const { access_token, permissions, role, full_name } = r.data;

      const datas = {
        role: role,
        full_name: full_name,
      };

      let userAbilities = permissions.map((item) => {
        const [action, subject] = item.split('-');
        return {
          action: action,
          subject: subject,
        };
      });

      localStorage.setItem('userAbilities', JSON.stringify(userAbilities));
      ability.update(userAbilities);
      localStorage.setItem('userData', JSON.stringify(datas));
      // localStorage.setItem('accessToken', JSON.stringify(access_token))
      localStorage.setItem('accessToken', access_token);

      // Redirect to `to` query if exist or redirect to index route
      router.replace(route.query.to ? String(route.query.to) : '/');
    })
    .catch((e) => {
      error.value = true;

      console.error(e);
    });
};

const onSubmit = () => {
  refVForm.value?.validate().then(({ valid: isValid }) => {
    if (isValid) login();
  });
};
</script>
<template>
  <VRow no-gutters class="auth-wrapper">
    <VCol lg="8" class="d-none d-lg-flex">
      <!-- иллюстрация -->
      <div class="position-relative w-100 pa-8">
        <div class="d-flex align-center justify-center w-100 h-100">
          <VImg max-width="700" :src="boyWithRocket" class="auth-illustration" />
        </div>
      </div>
    </VCol>

    <VCol
      cols="12"
      lg="4"
      class="auth-card-v2 d-flex align-center justify-center"
      style="background-color: rgb(var(--v-theme-surface))"
    >
      <VCard flat :max-width="500" class="mt-12 mt-sm-0 pa-6">
        <VCardItem class="justify-start">
          <template #prepend>
            <div class="d-flex">
              <VNodeRenderer :nodes="themeConfig.app.logo" />
            </div>
          </template>

          <VCardTitle class="auth-title">
            {{ themeConfig.app.title }}
          </VCardTitle>
        </VCardItem>

        <VCardText style="width: 400px">
          <VSnackbar
            v-model="error"
            location="top right"
            variant="flat"
            transition="fade-transition"
            color="error"
          >
            Логин или пароль не совпадают
          </VSnackbar>

          <VForm ref="refVForm" @submit.prevent="onSubmit">
            <VRow>
              <!-- логин -->
              <VCol cols="12">
                <VTextField
                  v-model="username"
                  label="Логин"
                  type="text"
                  autofocus
                  :error-messages="errors.username"
                />
              </VCol>

              <!-- пароль -->
              <VCol cols="12">
                <VTextField
                  v-model="password"
                  label="Пароль"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  :error-messages="errors.password"
                  :append-inner-icon="isPasswordVisible ? 'bx-hide' : 'bx-show'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                />
                <VBtn block type="submit" class="mb-1 mt-3"> Войти </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<style lang="scss">
@use '@core/scss/template/pages/page-auth.scss';
</style>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
  redirectIfLoggedIn: true
</route>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
  redirectIfLoggedIn: true
</route>

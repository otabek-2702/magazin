<script setup>
import { PerfectScrollbar } from 'vue3-perfect-scrollbar';
import { requiredValidator } from '@validators';
import { nextTick, ref, watch, watchEffect } from 'vue';
import AppDrawerHeaderSection from '@core/components/AppDrawerHeaderSection.vue';
import axios from '@axios';
import { toast } from 'vue3-toastify';

const props = defineProps({
  isDrawerOpen: {
    type: Boolean,
    required: true,
  },
  id: {
    required: true,
  },
});

const languages_list = ref([]);

const emit = defineEmits(['update:isDrawerOpen', 'fetchDatas']);

const isFormValid = ref(false);
const isFetching = ref(false);
const refForm = ref();
const full_name = ref();
const phone_number = ref();
const age = ref();
const address = ref();
const gender = ref('man');
const positive_skills = ref();
const apps_text = ref();
const apps = ref();
const languages = ref([]);

// 👉 drawer close
const closeNavigationDrawer = () => {
  emit('update:isDrawerOpen', false);
  nextTick(() => {
    refForm.value?.reset();
    refForm.value?.resetValidation();
  });
};

const onSubmit = () => {
  refForm.value?.validate().then(async ({ valid }) => {
    if (valid) {
      isFetching.value = true;
      try {
        await axios.put(`/candidates/${props.id}`, {
          full_name: full_name.value,
          age: age.value,
          apps_text: apps_text.value,
          apps: apps.value,
          gender: gender.value,
          phone_number: phone_number.value,
          address: address.value,
          positive_skills: positive_skills.value,
          languages: Array.from(languages.value),
        });

        toast('Успешно', {
          theme: 'auto',
          type: 'success',
          dangerouslyHTMLString: true,
        });
        // Убедитесь, что fetchCandidates вызывается только после успешного обновления
        emit('fetchDatas');
        emit('update:isDrawerOpen', false);
        nextTick(() => {
          refForm.value?.reset();
          refForm.value?.resetValidation();
        });
      } catch (error) {
        console.error('Ошибка при обновлении кандидата:', error);
      } finally {
        isFetching.value = false;
      }
    }
  });
};

const handleDrawerModelValueUpdate = (val) => {
  emit('update:isDrawerOpen', val);
  if (!val) {
    nextTick(() => {
      refForm.value?.reset();
      refForm.value?.resetValidation();
    });
  }
};

const fetchLanguages = async function () {
  try {
    const response = await axios.get('/languages');
    languages_list.value = response.data;
  } catch (error) {
    console.error('Ошибка :', error);
  }
};

watchEffect(fetchLanguages);

watch(
  () => props.isDrawerOpen,
  async (newVal) => {
    if (newVal) {
      let candidate = await axios.get('/candidates/' + props.id);

      full_name.value = candidate.data.full_name;
      address.value = candidate.data.address;
      gender.value = candidate.data.gender_slug;
      age.value = candidate.data.age;
      phone_number.value = candidate.data.phone_number;
      positive_skills.value = candidate.data.positive_skills;
      apps.value = candidate.data.apps;
      apps_text.value = candidate.data.apps_text;

      languages.value = candidate.data.languages
        .split(',') // Разбиваем строку по запятой
        .filter(Boolean)
        .map(Number);
    }
  },
);
</script>

<template>
  <VNavigationDrawer
    temporary
    :width="400"
    location="end"
    class="scrollable-content"
    :model-value="props.isDrawerOpen"
    @update:model-value="handleDrawerModelValueUpdate"
  >
    <!-- 👉 Заголовок -->
    <AppDrawerHeaderSection title="Добавить кандидата" @cancel="closeNavigationDrawer" />

    <PerfectScrollbar :options="{ wheelPropagation: false }">
      <VCard flat>
        <VCardText>
          <!-- 👉 Форма -->
          <VForm ref="refForm" v-model="isFormValid" @submit.prevent="onSubmit">
            <VRow>
              <VCol cols="12">
                <VTextField v-model="full_name" :rules="[requiredValidator]" label="Полное имя" />
              </VCol>

              <VCol cols="12">
                <VTextField
                  v-model="phone_number"
                  :rules="[requiredValidator]"
                  label="Номер телефона"
                />
              </VCol>
              <VCol cols="12">
                <VTextField
                  type="number"
                  v-model="age"
                  :rules="[requiredValidator]"
                  label="Возраст"
                />
              </VCol>
              <VCol cols="12">
                <VTextField v-model="address" :rules="[requiredValidator]" label="Адрес" />
              </VCol>

              <VCol cols="12">
                <VRadioGroup v-model="gender" inline :rules="[requiredValidator]">
                  <VRadio label="Мужчина" value="man" density="compact" />
                  <VRadio label="Женщина" value="woman" density="compact" />
                </VRadioGroup>
              </VCol>

              <VCol cols="12">
                <VTextField
                  v-model="positive_skills"
                  :rules="[requiredValidator]"
                  label="Положительные качества"
                />
              </VCol>

              <VCol cols="12">
                <VTextField
                  v-model="apps_text"
                  :rules="[requiredValidator]"
                  label="Описание приложений"
                />
              </VCol>

              <VCol cols="12">
                <VTextField v-model="apps" :rules="[requiredValidator]" label="Приложения" />
              </VCol>

              <VCol cols="12">
                <VSelect
                  no-data-text="Нет данных"
                  multiple
                  persistent-hint
                  v-model="languages"
                  label="Выберите язык"
                  :rules="[requiredValidator]"
                  :items="languages_list"
                  item-title="name_ru"
                  item-value="id"
                />
              </VCol>

              <!-- 👉 Отправить и Отмена -->
              <VCol cols="12">
                <VBtn :loading="isFetching" :disabled="isFetching" type="submit" class="me-3">
                  Отправить
                </VBtn>
                <VBtn type="reset" variant="tonal" color="secondary" @click="closeNavigationDrawer">
                  Отмена
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </PerfectScrollbar>
  </VNavigationDrawer>
</template>

<script setup>
import { PerfectScrollbar } from 'vue3-perfect-scrollbar';
import { nextTick, ref, watchEffect } from 'vue';
import AppDrawerHeaderSection from '@core/components/AppDrawerHeaderSection.vue';
import axios from '@axios';
import { toast } from 'vue3-toastify';

const props = defineProps({
  isDrawerOpen: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(['update:isDrawerOpen', 'fetchDatas']);

const isFetching = ref(false);
const isFormValid = ref(false);
const refForm = ref();
const name = ref();
const description = ref();

// 👉 drawer close
const closeNavigationDrawer = () => {
  nextTick(() => {
    emit('update:isDrawerOpen', false);
    refForm.value?.reset();
    refForm.value?.resetValidation();
  });
};

const onSubmit = () => {
  refForm.value?.validate().then(async ({ valid }) => {
    if (valid) {
      isFetching.value = true;
      try {
        const response = await axios.post('/categories', {
          name: name.value,
          description: description.value,
        });

        if (response.status == 201) {
          toast('Успешно', {
            
            type: 'success',
            
          });
          emit('fetchDatas');

          closeNavigationDrawer();
        }
      } catch (error) {
        console.error('Ошибка:', error);
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
    <!-- Раздел заголовка -->
    <AppDrawerHeaderSection title="Добавить категорию" @cancel="closeNavigationDrawer" />

    <PerfectScrollbar :options="{ wheelPropagation: false }">
      <VCard flat>
        <VCardText>
          <!-- Раздел формы -->
          <VForm
            ref="refForm"
            v-model="isFormValid"
            @submit.prevent="onSubmit"
            :disabled="isFetching"
          >
            <VRow>
              <VCol cols="12">
                <VTextField v-model="name" label="Имя"  autofocus/>
              </VCol>

              <VCol cols="12">
                <VTextarea label="Описание" v-model="description" />
              </VCol>

              <!-- Кнопки "Отправить" и "Отмена" -->
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

<script setup>
import { PerfectScrollbar } from 'vue3-perfect-scrollbar';
import { nextTick, ref, watch } from 'vue';
import AppDrawerHeaderSection from '@core/components/AppDrawerHeaderSection.vue';
import axios from '@axios';
import { toast } from 'vue3-toastify';
import { VProgressCircular } from 'vuetify/components';

const props = defineProps({
  isDrawerOpen: {
    type: Boolean,
    required: true,
  },

  id: {
    required: true,
  },
});

const emit = defineEmits(['update:isDrawerOpen', 'fetchDatas']);
const isFetching = ref(false);
const isFetchingStart = ref(true);
const isFormValid = ref(false);
const refForm = ref();
const name = ref();
const address = ref();
const phone_number = ref();

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
        const response = await axios.patch(`/suppliers/${props.id}`, {
          name: name.value,
          phone_number: phone_number.value,
          address: address.value,
        });
        if (response.status == 200) {
          emit('fetchDatas');
          toast('Успешно', {
            
            type: 'success',
            
          });
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

const fetchDataById = async () => {
  isFetchingStart.value = true;
  try {
    const {
      data: { supplier },
    } = await axios.get(`/suppliers/${props.id}`);

    name.value = supplier.name;
    phone_number.value = supplier.phone_number;
    address.value = supplier.address;
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    isFetchingStart.value = false;
  }
};

watch(
  () => props.isDrawerOpen,
  (newVal) => newVal && fetchDataById(),
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
    <AppDrawerHeaderSection title="Обновить компанию" @cancel="closeNavigationDrawer" />

    <PerfectScrollbar :options="{ wheelPropagation: false }">
      <VCard flat>
        <VCardText>
          <!-- 👉 Форма -->

          <VForm
            ref="refForm"
            v-model="isFormValid"
            @submit.prevent="onSubmit"
            :disabled="isFetching"
            v-if="!isFetchingStart"
          >
            <VRow>
              <VCol cols="12">
                <VTextField v-model="name" label="Имя" />
              </VCol>

              <VCol cols="12">
                <VTextField v-model="phone_number" label="Номер телефона" />
              </VCol>
              <VCol cols="12">
                <VTextField v-model="address" label="Адрес" />
              </VCol>
              <!-- 👉 Кнопки отправки и отмены -->
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

          <div v-if="isFetchingStart" class="d-flex h-screen align-center justify-center">
            <VProgressCircular color="primary" indeterminate></VProgressCircular>
          </div>
        </VCardText>
      </VCard>
    </PerfectScrollbar>
  </VNavigationDrawer>
</template>

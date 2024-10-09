<script setup>
import { PerfectScrollbar } from 'vue3-perfect-scrollbar';
import { nextTick, ref } from 'vue';
import axios from '@axios';
import { toast } from 'vue3-toastify';

const emit = defineEmits(['fetchDatas']);
const props = defineProps({
  variant_id: { required: true, type: Number || String },
});

const isDialogVisible = ref(false);
const isFetching = ref(false);
const isFormValid = ref(false);
const refForm = ref();
const product_variant = ref();
const batch_id = ref();
const exchange_id = ref();
const purchase_price = ref('');
const quantity = ref();

// 👉 drawer close
const closeNavigationDrawer = () => {
  isDialogVisible.value = false;
  nextTick(() => {
    refForm.value?.reset();
    refForm.value?.resetValidation();
  });
};

const removeSpaces = (input) => {
  return input.replace(/\s+/g, '');
};

const onSubmit = () => {
  refForm.value?.validate().then(async ({ valid }) => {
    if (valid) {
    console.log('clicked', valid)
      isFetching.value = true;
      try {
        await axios.post('/batch_product_variants', {
          variant_id: product_variant.value.id,
          batch_id: batch_id.value ?? 0,
          purchase_exchange_rate_id: exchange_id.value ?? 0,
          purchase_price: removeSpaces(purchase_price.value ?? 0),
          quantity: quantity.value,
        });
        emit('fetchDatas');
        toast('Успешно добавлено', {
          theme: 'auto',
          type: 'success',
          dangerouslyHTMLString: true,
        });
        handleDrawerModelValueUpdate(false);
      } catch (error) {
        console.error(error);
      } finally {
        isFetching.value = false;
      }
    }
  });
};

const handleDrawerModelValueUpdate = (val) => {
  isDialogVisible.value = val;
  if (!val) {
    nextTick(() => {
      refForm.value?.reset();
      refForm.value?.resetValidation();
    });
  }
};

const fetchOptions = async (url, dataState, key, customization = { is: false }) => {
  try {
    const response = await axios.get(url);

    if (response.status === 200) {
      if (customization.is) {
        dataState.value = response.data[key].map(customization.method);
      } else {
        dataState.value = response.data[key];
      }
    }
  } catch (error) {
    console.log(error);
  }
};
const batches_list = ref([]);
const exchanges_list = ref([]);

watch(
  isDialogVisible,
  () => {
    fetchOptions(`/product_variants/${props.variant_id}`, product_variant, 'products_variant');

    fetchOptions('/batches', batches_list, 'batches');
    fetchOptions('/exchange_rates', exchanges_list, 'exchange_rates', {
      is: true,
      method: (v) => ({
        ...v,
        name: `${v.symbol} ${v.rate}`,
      }),
    });
  },
  { once: true },
);

// format
const formatPrice = (price) => {
  let formattedPrice = price
    .toString()
    .replace(/\s/g, '')
    .replace(/[^\d\s]/g, '')
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return formattedPrice.trim();
};
const handlePriceInput = (e) => {
  purchase_price.value = formatPrice(e.target.value);
};
</script>

<template>
  <VDialog v-model="isDialogVisible" max-width="600">
    <!-- Dialog Activator -->
    <template #activator="{ props }">
      <VIcon
        @click="isDialogVisible = true"
        v-bind="props"
        size="30"
        icon="mdi-package-variant-closed-plus"
        style="color: rgb(var(--v-theme-success))"
      ></VIcon>
    </template>

    <!-- Dialog Content -->
    <VCard title="Добавить">
      <DialogCloseBtn variant="text" size="small" @click="isDialogVisible = false" />
      <PerfectScrollbar :options="{ wheelPropagation: false }">
        <h3 class="px-6 pt-3">
          {{ product_variant?.product.name }} | {{ product_variant?.color.name }} |
          {{ product_variant?.size.name }}
        </h3>
        <VCardText>
          <VForm ref="refForm" v-model="isFormValid" @submit.prevent="onSubmit">
            <VRow>
              <VCol cols="6">
                <VAutocomplete
                  v-model="batch_id"
                  label="Выберите партию"
                  :items="batches_list"
                  item-title="name"
                  item-value="id"
                />
              </VCol>
              <VCol cols="6">
                <VTextField v-model="quantity" label="Количество" type="number" />
              </VCol>

              <VCol cols="6">
                <VSelect
                  v-model="exchange_id"
                  label="Валюта"
                  :items="exchanges_list"
                  item-title="name"
                  item-value="id"
                />
              </VCol>
              <VCol cols="6">
                <VTextField
                  :value="formatPrice(purchase_price)"
                  @input="handlePriceInput"
                  label="Себестоимость"
                  type="text"
                />
              </VCol>
            </VRow>
            <VCardText class="d-flex justify-end gap-2 pt-2">
              <VBtn :loading="isFetching" :disabled="isFetching" type="submit" class="me-3">
                Отправить
              </VBtn>
              <VBtn type="reset" variant="tonal" color="secondary" @click="closeNavigationDrawer">
                Отмена
              </VBtn>
            </VCardText>
          </VForm>
        </VCardText>
      </PerfectScrollbar>
    </VCard>
  </VDialog>
</template>

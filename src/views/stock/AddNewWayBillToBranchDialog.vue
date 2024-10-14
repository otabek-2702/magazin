<script setup>
import { PerfectScrollbar } from 'vue3-perfect-scrollbar';
import { nextTick, ref, watch } from 'vue';
import axios from '@axios';
import { toast } from 'vue3-toastify';
import { transformPrice } from '@/helpers';

const emit = defineEmits(['fetchDatas']);

const isDialogVisible = ref(false);
const isFetching = ref(false);
const isFormValid = ref(false);
const refForm = ref();
const branch_id = ref();
const sku_input = ref();
const product_variant_sku = ref();
const product_variant_data = ref();
const quantity_input = ref();
const quantity = ref();
const quantity_inline_input = ref();
const product_variants = ref([]);

const removeSpaces = (input) => {
  return input.replace(/\s+/g, '');
};

const onSubmit = () => {
  refForm.value?.validate().then(async ({ valid }) => {
    if (valid) {
      isFetching.value = true;
      try {
        await axios.post('/invoices', {
          branch_id: branch_id.value ?? 0,

          items: product_variants.value.map((el) => ({
            product_variant_id: el.variant.id,
            price: removeSpaces(el.price),
            quantity: el.quantity,
          })),
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
const product_variants_list = ref([]);
const branches_list = ref([]);

watch(
  isDialogVisible,
  () => {
    fetchOptions('/product_variants', product_variants_list, 'products_variants', {
      method: (el) => ({ ...el, name: `${el.product.name} | ${el.color.name} | ${el.size.name}` }),
      is: true,
    });
    fetchOptions('/branches', branches_list, 'branches');
  },
  { once: true },
);
const findProductVariant = (sku) => {
  product_variant_data.value = product_variants_list.value.find(
    (e) => e.sku == product_variant_sku.value,
  );
  if (!product_variant_data.value) {
    toast('Товар не найден', {
      theme: 'auto',
      type: 'error',
      dangerouslyHTMLString: true,
    });
    return;
  }
  quantity_input.value.focus();
  quantity.value = product_variant_data.value.amount_remainder;
  product_variant_sku.value = null;
};

const addToList = () => {
  if (!product_variant_data.value) {
    toast('Товар не найден', {
      theme: 'auto',
      type: 'error',
      dangerouslyHTMLString: true,
    });
    product_variant_data.value = null;
    quantity.value = null;
    sku_input.value.focus();
    return;
  } else if (product_variants.value.find((el) => el.variant.id == product_variant_data.value.id)) {
    toast('Дубликат', {
      theme: 'auto',
      type: 'error',
      dangerouslyHTMLString: true,
    });
    product_variant_data.value = null;
    quantity.value = null;
    sku_input.value.focus();
    return;
  }

  product_variants.value.push({
    variant: product_variant_data.value,
    quantity: quantity.value,
  });
  product_variant_data.value = null;
  quantity.value = null;
  sku_input.value.focus();
};

// Edit
const editingId = ref(null);

const showEditInput = (id) => {
  editingId.value = id;
};

const hideEditInput = async (exchange) => {
  if (editingId.value === exchange.id) {
  }
  editingId.value = null;
};

const deleteListItem = (id) => {
  product_variants.value = product_variants.value.filter((el) => el.variant.id != id);
};

const calculateCount = computed(() => {
  return product_variants.value.reduce(
    (accumulator, el) => accumulator + parseFloat(el.quantity),
    0,
  );
});
</script>

<template>
  <VDialog fullscreen v-model="isDialogVisible">
    <!-- Dialog Activator -->
    <template #activator="{ props }">
      <VBtn @click="isDialogVisible = true" v-bind="props">Накладная для филиала</VBtn>
    </template>

    <!-- Dialog Content -->
    <VCard title="Накладная">
      <DialogCloseBtn variant="text" size="small" @click="isDialogVisible = false" />
      <PerfectScrollbar :options="{ wheelPropagation: false }">
        <VCardText>
          <VForm ref="refForm" v-model="isFormValid" @submit.prevent="onSubmit">
            <VRow>
              <VCol cols="4">
                <VAutocomplete
                  v-model="branch_id"
                  label="Выберите филиал"
                  :items="branches_list"
                  item-title="name"
                  item-value="id"
                  autofocus
                />
              </VCol>

              <VDivider />

              <VCol cols="12">
                <VTable class="text-no-wrap">
                  <thead>
                    <tr>
                      <th style="width: 48px">ID</th>
                      <th>ТОВАР</th>
                      <th>КОЛИЧЕСТВО</th>
                      <th>ДЕЙСТВИЯ</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr v-for="(variant, i) in product_variants" :key="variant.id">
                      <td>{{ i + 1 }}</td>
                      <td>{{ variant.variant.name }}</td>
                      <td>
                        <VTextField
                          v-model="variant.quantity"
                          :readonly="editingId != variant.variant.id"
                          :class="{ 'text-input': editingId != variant.variant.id }"
                          @keyup.enter="hideEditInput(variant.variant.id)"
                          :autofocus="editingId == variant.variant.id"
                          class="custom-input"
                          density="compact"
                          type="number"
                        />
                      </td>
                      <td class="text-center" :style="{ width: '80px', zIndex: '10' }">
                        <VIcon
                          v-if="editingId == variant.variant?.id"
                          @click.stop="hideEditInput(variant.variant.id)"
                          size="30"
                          icon="bx-check"
                          style="color: rgb(var(--v-theme-success))"
                          class="mx-2"
                        />
                        <VIcon
                          v-else
                          @click.stop="showEditInput(variant.variant.id)"
                          size="30"
                          icon="bx-edit-alt"
                          style="color: rgb(var(--v-global-theme-primary))"
                          class="mx-2"
                        />
                        <VIcon
                          size="30"
                          icon="mdi-minus-circle-outline"
                          style="color: red"
                          @click="deleteListItem(variant.variant.id)"
                        ></VIcon>
                      </td>
                    </tr>
                  </tbody>

                  <tfoot v-show="product_variants.length">
                    <tr>
                      <td colspan="2"></td>
                      <td class="text-body-1">Общая количество: {{ calculateCount }}</td>
                      <td></td>
                      <td></td>
                    </tr>
                  </tfoot>
                  <tfoot v-show="!product_variants.length">
                    <tr>
                      <td colspan="9" class="text-center text-body-1">Нет доступных данных</td>
                    </tr>
                  </tfoot>
                </VTable>
              </VCol>

              <VDivider />

              <VForm class="pt-3 w-100">
                <VRow>
                  <VCol cols="3">
                    <VTextField
                      v-model="product_variant_sku"
                      ref="sku_input"
                      @keyup.enter="findProductVariant(product_variant_sku)"
                      label="Штрих код товара"
                      :items="product_variants_list"
                      item-title="name"
                      item-value="id"
                      :rules="[]"
                    />
                  </VCol>

                  <VCol cols="3">
                    <h4 class="pt-1">Товар: {{ product_variant_data?.name }}</h4>
                    <p class="pt-2 mb-0">
                      На складе: <b>{{ product_variant_data?.amount_remainder }}</b>
                    </p>
                  </VCol>

                  <VCol cols="3">
                    <VTextField
                      v-model="quantity"
                      ref="quantity_input"
                      @keyup.enter="addToList"
                      label="Количество"
                      type="number"
                      :rules="[]"
                    />
                  </VCol>
                  <VCol cols="1" class="d-flex justify-center align-center">
                    <VIcon
                      size="30"
                      icon="bx-plus"
                      @click="addToList"
                      style="color: white; background-color: #4caf50; border-radius: 5px"
                    ></VIcon>
                  </VCol>
                </VRow>
              </VForm>
            </VRow>
            <VCardText class="d-flex justify-end gap-2 pt-2">
              <VBtn :loading="isFetching" :disabled="isFetching" type="submit" class="me-3">
                Отправить
              </VBtn>
            </VCardText>
          </VForm>
        </VCardText>
      </PerfectScrollbar>
    </VCard>
  </VDialog>
</template>

<style scoped>
.text-input {
  background-color: transparent !important;
}

.text-input :deep(.v-field__outline) {
  opacity: 0 !important;
}

/* .text-input :deep(.v-field__input) {
  padding-inline-start: 0 !important;
  padding-inline-end: 0 !important;
} */

.text-input :deep(.v-label) {
  opacity: 0 !important;
}

.custom-input {
  margin: 1px;
  width: 50%
}
</style>

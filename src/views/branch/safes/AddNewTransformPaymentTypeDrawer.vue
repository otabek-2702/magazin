<script setup>
import { nextTick, ref } from "vue";
import { useRoute } from "vue-router";
import { PerfectScrollbar } from "vue3-perfect-scrollbar";
import AppDrawerHeaderSection from "@core/components/AppDrawerHeaderSection.vue";
import axios from "@axios";
import { toast } from "vue3-toastify";
import { removeSpaces, transformPrice } from "@/helpers";
import { computed } from "vue";
import { watch } from "vue";

const props = defineProps({
  isDrawerVisible: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(["update:isDrawerVisible", "fetchDatas"]);
const route = useRoute();

const isPasswordVisible = ref(false);
const isFetching = ref(false);
const refForm = ref();
const amount_ref = ref();
const amount = ref();
const transform_from = ref("bank");
const transform_to = ref("cash");
const comission = ref();
const password = ref();

const onSubmit = () => {
  refForm.value?.validate().then(async ({ valid }) => {
    if (valid) {
      isFetching.value = true;
      try {
        await axios.post(`/safes/${route?.params?.id}/exchange`, {
          from: transform_from.value,
          to: transform_to.value,
          sum: removeSpaces(amount.value),
          expense: removeSpaces(comission.value),
          password: password.value,
        });
        emit("fetchDatas");
        toast("Успешно добавлено", {
          type: "success",
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
  emit("update:isDrawerVisible", val);
  transform_from.value = "bank";
  transform_to.value = "cash";
  refForm.value?.reset();
  nextTick(() => {
    refForm.value?.resetValidation();
  });
};

const transformLabel = computed(() => {
  let translates = { cash: "Налычные", bank: "Банк" };
  return {
    from: translates[transform_from.value],
    to: translates[transform_to.value],
  };
});

const swapTransformType = () => {
  let beforeChange = transform_from.value;
  transform_from.value = transform_to.value;
  transform_to.value = beforeChange;
};

watch(
  () => props.isDrawerVisible,
  (newVal) => newVal && nextTick(() => amount_ref.value?.focus())
);
</script>

<template>
  <VNavigationDrawer
    temporary
    :width="400"
    location="end"
    class="scrollable-content"
    :model-value="props.isDrawerVisible"
    @update:model-value="handleDrawerModelValueUpdate"
  >
    <!-- 👉 Заголовок -->
    <AppDrawerHeaderSection
      title="Добавить"
      @cancel="handleDrawerModelValueUpdate(false)"
    />

    <PerfectScrollbar :options="{ wheelPropagation: false }">
      <VCard flat>
        <VCardText>
          <!-- 👉 Форма -->
          <VForm ref="refForm" @submit.prevent="onSubmit" autocomplete="off">
            <VRow>
              <VCol cols="5" class="d-flex align-center">
                <h3>{{ transformLabel.from }}</h3>
              </VCol>
              <VCol cols="1">
                <VIcon
                  icon="mdi-swap-horizontal"
                  size="32"
                  class="cursor-pointer"
                  @click="swapTransformType"
                />
              </VCol>
              <VCol cols="6" class="d-flex align-center justify-end">
                <h3>{{ transformLabel.to }}</h3>
              </VCol>

              <VCol cols="12">
                <VTextField
                  v-model="amount"
                  label="Сумма"
                  :model-value="transformPrice(amount, true)"
                  ref="amount_ref"
                  autofocus
                />
              </VCol>

              <VCol cols="12">
                <VTextField
                  v-model="comission"
                  label="Комиссия"
                  :model-value="transformPrice(comission, true)"
                  autofocus
                  autocomplete="off"
                />
              </VCol>

              <VCol cols="12">
                <VTextField
                  :type="isPasswordVisible ? 'text' : 'password'"
                  label="Пароль для подтверждения"
                  v-model="password"
                  :append-inner-icon="isPasswordVisible ? 'bx-hide' : 'bx-show'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                  autocomplete="off"
                  name="one-time-password"
                />
              </VCol>

              <!-- 👉 Отправить и Отмена -->
              <VCol cols="12">
                <VBtn
                  :loading="isFetching"
                  :disabled="isFetching"
                  type="submit"
                  class="me-3"
                >
                  Отправить
                </VBtn>
                <VBtn
                  type="reset"
                  variant="tonal"
                  color="secondary"
                  @click="handleDrawerModelValueUpdate(false)"
                >
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

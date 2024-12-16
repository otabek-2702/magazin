<script setup>
import { nextTick,  ref } from "vue";
import { useRoute } from "vue-router";
import { PerfectScrollbar } from "vue3-perfect-scrollbar";
import AppDrawerHeaderSection from "@core/components/AppDrawerHeaderSection.vue";
import axios from "@axios";
import { toast } from "vue3-toastify";
import {
  removeSpaces,
  transformPrice,
} from "@/helpers";
import { requiredValidator } from "@/@core/utils/validators";

const props = defineProps({
  isDrawerVisible: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(["update:isDrawerVisible", "fetchDatas"]);
const route = useRoute()

const isPasswordVisible = ref(false);
const isFetching = ref(false);
const refForm = ref();
const amount = ref();
const transaction_type = ref('cash')
const comment = ref();
const password = ref();

const onSubmit = () => {
  refForm.value?.validate().then(async ({ valid }) => {
    if (valid) {
      isFetching.value = true;
      try {
        await axios.post(`/safes/${route?.params?.id}/outputs`, {
          sum: removeSpaces(amount.value),
          transaction_type: transaction_type.value,
          password: password.value,
          comment: comment.value,
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
  if (!val) {
    nextTick(() => {
      refForm.value?.reset();
      refForm.value?.resetValidation();
      transaction_type.value = "cash"
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
              <VCol cols="12">
                <VTextField
                  v-model="amount"
                  label="Сумма"
                  :model-value="transformPrice(amount, true)"
                  autofocus
                />
                <VRadioGroup v-model="transaction_type" inline class="pt-2">
                  <VRadio label="Наличные" value="cash" density="compact" />
                  <VRadio label="Банк" value="bank" density="compact" />
                </VRadioGroup>
              </VCol>

              <VCol cols="12">
                <VTextField
                  :type="isPasswordVisible ? 'text' : 'password'"
                  label="Пароль для подтверждения"
                  v-model="password"
                  autocomplete="off"
                  :append-inner-icon="isPasswordVisible ? 'bx-hide' : 'bx-show'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                  name="one-time-password"
                />
              </VCol>

              <VCol cols="12">
                <VTextarea
                  label="Комментарий"
                  v-model="comment"
                  :rules="[requiredValidator]"
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

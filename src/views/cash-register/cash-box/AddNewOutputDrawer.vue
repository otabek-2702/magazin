<script setup>
import { PerfectScrollbar } from "vue3-perfect-scrollbar";
import { nextTick, ref } from "vue";
import AppDrawerHeaderSection from "@core/components/AppDrawerHeaderSection.vue";
import axios from "@axios";
import { toast } from "vue3-toastify";
import { autoSelectInputValue, removeSpaces, transformPrice } from "@/helpers";
import { requiredValidator } from "@/@core/utils/validators";

const props = defineProps({
  isDrawerOpen: {
    type: Boolean,
    required: true,
  },
  cashbox_id: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(["update:isDrawerOpen", "fetchDatas"]);

const isDrawerOpen = ref(false);
const isFetching = ref(false);
const isFormValid = ref(false);
const refForm = ref();
const sum = ref();
const password = ref();
const comment = ref();

const onSubmit = () => {
  refForm.value?.validate().then(async ({ valid }) => {
    if (valid) {
      isFetching.value = true;
      try {
        await axios.post(`/cashboxes/${props.cashbox_id}/outputs`, {
          sum: removeSpaces(sum.value),
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
  emit("update:isDrawerOpen", val);
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
    <!-- 👉 Заголовок -->
    <AppDrawerHeaderSection
      title="Добавить"
      @cancel="handleDrawerModelValueUpdate(false)"
    />

    <PerfectScrollbar :options="{ wheelPropagation: false }">
      <VCard flat>
        <VCardText>
          <!-- 👉 Форма -->
          <VForm ref="refForm" v-model="isFormValid" @submit.prevent="onSubmit">
            <VRow>
              <!-- 👉 Полное имя -->
              <VCol cols="12">
                <VTextField
                  v-model="sum"
                  label="Сумма"
                  autofocus
                  :value="transformPrice(sum, true)"
                  @focus="autoSelectInputValue"
                />
              </VCol>

              <VCol cols="12">
                <VTextField
                  type="password"
                  label="Пароль для подтверждения"
                  v-model="password"
                />
              </VCol>

              <VCol cols="12">
                <VTextarea label="Комментарий" v-model="comment" :rules="[requiredValidator]" />
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

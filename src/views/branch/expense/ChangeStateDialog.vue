<script setup>
import { ref, watchEffect } from "vue";
import axios from "@axios";
import DialogCloseBtn from "@core/components/DialogCloseBtn.vue";
import { toast } from "vue3-toastify";

const props = defineProps({
  id: {
    type: [String, Number], // Указываем допустимые типы данных
    required: true, // Делаем обязательным
  },
});

const emit = defineEmits(["fetchDatas"]);

const isDialogVisible = ref(false);
const isPasswordVisible = ref(false);
const isFetching = ref("");
const password = ref();

const handleDialogModelUpdate = (val) => {
  isDialogVisible.value = val;
  if (!val) {
    nextTick(() => {
      refForm.value?.reset();
      refForm.value?.resetValidation();
    });
  }
};

const onSubmit = async (toState) => {
  isFetching.value = toState;
  try {
    await axios.post(`/branches/expenses/${props.id}/update_state/${toState}`, {
      password: password.value,
    });

    toast("Успешно обновлено", {
      theme: "auto",
      type: "success",
      dangerouslyHTMLString: true,
    });
    emit("fetchDatas");
    handleDialogModelUpdate(false);
  } catch (error) {
    console.error(error);
  } finally {
    isFetching.value = "";
  }
};
</script>

<template>
  <VDialog v-model="isDialogVisible" max-width="500">
    <!-- Dialog Activator -->
    <template #activator="{ props }">
      <VIcon
        v-bind="props"
        @click="handleDialogModelUpdate(true)"
        size="30"
        icon="bx-comment"
      ></VIcon>
    </template>

    <!-- Dialog Content -->
    <VCard title="Изменение статуса">
      <DialogCloseBtn
        variant="text"
        size="small"
        @click="handleDialogModelUpdate(false)"
      />

      <VCardText>
        <VRow class="justify-center">
          <VCol cols="12">
            <VTextField
              :type="isPasswordVisible ? 'text' : 'password'"
              label="Пароль для подтверждения"
              v-model="password"
              autocomplete="new-password"
              :append-inner-icon="isPasswordVisible ? 'bx-hide' : 'bx-show'"
              @click:append-inner="isPasswordVisible = !isPasswordVisible"
            />
          </VCol>
          <VCol cols="4">
            <VBtn
            color="secondary"
            class="w-100"
            @click="onSubmit('reject')"
            :loading="isFetching === 'reject'"
            :disabled="isFetching.length"
            >
              Отменить
            </VBtn>
          </VCol>
          <VCol cols="4">
            <VBtn
            color="success"
            class="w-100"
            @click="onSubmit('confirm')"
            :loading="isFetching === 'confirm'"
            :disabled="isFetching.length"
            >
              Подтвердить
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>
  </VDialog>
</template>

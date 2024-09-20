<script setup>
import { ref, watchEffect } from 'vue';
import axios from '@axios';
import DialogCloseBtn from '@core/components/DialogCloseBtn.vue';
import { computed } from 'vue';
import { toast } from 'vue3-toastify';

const props = defineProps({
  id: {
    type: [String, Number], // Указываем допустимые типы данных
    required: true, // Делаем обязательным
  },
  state_slug: {
    type: String,
    required: true,
  },
  states: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['fetchDatas']);

const isDialogVisible = ref(false);
const isFetching1 = ref(false);
const isFetching2 = ref(false);
const isFetching3 = ref(false);
const isFetching4 = ref(false);
const comment = ref();

const onCancel = async () => {
  isFetching1.value = true;
  try {
    await axios.post(`/candidates/${props.id}/update_state/cancel`, {
      comment: comment.value,
    });

    toast('Успешно обновлено', {
      theme: 'auto',
      type: 'success',
      dangerouslyHTMLString: true,
    });
    emit('fetchDatas')
    comment.value = '';
    isDialogVisible.value = false;
  } catch (error) {
    console.error('Ошибка :', error);
  } finally {
    isFetching1.value = false;
  }
};

const onBlock = async () => {
  isFetching2.value = true;
  try {
    await axios.post(`/candidates/${props.id}/update_state/block`, {
      comment: comment.value,
    });

    toast('Успешно обновлено', {
      theme: 'auto',
      type: 'success',
      dangerouslyHTMLString: true,
    });
    emit('fetchDatas')
    comment.value = '';
    isDialogVisible.value = false;
  } catch (error) {
    console.error('Ошибка :', error);
  } finally {
    isFetching2.value = false;
  }
};

const onArchive = async () => {
  isFetching3.value = true;
  try {
    let url = `/candidates/${props.id}/update_state/`;
    if (props.state_slug === 'archive') url = url + 'un_archive';
    else url = url + 'archive';
    await axios.post(url, { comment: comment.value });

    toast('Успешно обновлено', {
      theme: 'auto',
      type: 'success',
      dangerouslyHTMLString: true,
    });
    emit('fetchDatas')
    comment.value = '';
    isDialogVisible.value = false;
  } catch (error) {
    console.error('Ошибка :', error);
  } finally {
    isFetching3.value = false;
  }
};

const onNextState = async () => {
  isFetching4.value = true;
  try {
    await axios.post(`/candidates/${props.id}/update_state/invite_to_interview`, {
      comment: comment.value,
    });
    
    toast('Успешно обновлено', {
      theme: 'auto',
      type: 'success',
      dangerouslyHTMLString: true,
    });
    emit('fetchDatas')
    comment.value = '';
    isDialogVisible.value = false;
  } catch (error) {
    console.error('Ошибка :', error);
  } finally {
    isFetching4.value = false;
  }
};

const archiveLabel = computed(() => (props.state_slug === 'archive' ? 'Разархивировать' : 'Архивировать'));
</script>

<template>
  <VDialog v-model="isDialogVisible" max-width="600">
    <!-- Dialog Activator -->
    <template #activator="{ props }">
      <VIcon
        v-bind="props"
        @click="
          (event) => {
            event.stopPropagation();
          }
        "
        size="30"
        icon="bx-comment"
      ></VIcon>
    </template>

    <!-- Dialog Content -->
    <VCard title="Профиль пользователя">
      <DialogCloseBtn variant="text" size="small" @click="isDialogVisible = false" />

      <VCardText>
        <VRow class="justify-center">
          <VCol cols="12">
            <VTextarea label="Комментарий" v-model="comment" />
          </VCol>
          <VCol cols="4" class="px-1">
            <VBtn :loading="isFetching1" :disabled="(isFetching1 || isFetching2 || isFetching3 || isFetching4)" class="w-100" @click="onCancel" color="warning">
              Отменить
              <VIcon icon="bx-minus-circle" class="ml-1 mr-0" />
            </VBtn>
          </VCol>
          <VCol cols="4" class="px-1">
            <VBtn :loading="isFetching2" :disabled="(isFetching1 || isFetching2 || isFetching3 || isFetching4)" class="w-100" color="error" @click="onBlock">
              Заблокировать
              <VIcon icon="bx-block" class="ml-1 mr-0" />
            </VBtn>
          </VCol>
          <VCol cols="4" class="px-1">
            <VBtn :loading="isFetching3" :disabled="(isFetching1 || isFetching2 || isFetching3 || isFetching4)" class="w-100" color="secondary" @click="onArchive">
              {{ archiveLabel }}
              <VIcon icon="bx-archive-in" class="ml-1 mr-0" />
            </VBtn>
          </VCol>
          <VCol cols="12" class="px-1" v-if="props.state_slug != 'archive'">
            <VBtn :loading="isFetching4" :disabled="(isFetching1 || isFetching2 || isFetching3 || isFetching4)" class="w-100" color="success" @click="onNextState">
              Далее
              <VIcon icon="bx-right-arrow-alt" class="ml-1 mr-0" />
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>

      <!-- <VCardText class="d-flex justify-end gap-2">
        <VBtn color="secondary" variant="tonal" @click="isDialogVisible = false"> Закрыть </VBtn>
        <VBtn @click="isDialogVisible = false"> Сохранить </VBtn>
      </VCardText> -->
    </VCard>
  </VDialog>
</template>


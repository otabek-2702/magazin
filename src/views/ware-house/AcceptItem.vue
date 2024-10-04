<script setup>
import { ref } from 'vue';
import axios from '@axios';
import DialogCloseBtn from '@core/components/DialogCloseBtn.vue';
import { toast } from 'vue3-toastify';
import { watch } from 'vue';
import { onMounted } from 'vue';

const props = defineProps({
  id: {
    type: [String, Number], // Указываем допустимые типы данных
    required: true, // Делаем обязательным
  },
});

const emit = defineEmits(['fetchDatas']);

const isDialogVisible = ref(false);
const isFetching = ref(false);
const isFetchingVacancy = ref(false);
const comment = ref();
const selectedCompany = ref();
const selectedVacancy = ref();

const onFormCancel = () => {
  comment.value = '';
  isDialogVisible.value = false;
};

const onSubmit = async () => {
  isFetching.value = true;
  try {
    await axios.post(`/candidates/${props.id}/update_state/accept`, {
      vacancy_id: selectedVacancy.value,
      company_id: selectedCompany.value,
      comment: comment.value,
    });

    toast('Успешно обновлено', {
      theme: 'auto',
      type: 'success',
      dangerouslyHTMLString: true,
    });
    emit('fetchDatas');
    onFormCancel();
  } catch (error) {
    console.error('Ошибка :', error);
  } finally {
    isFetching.value = false;
  }
};

const companies_list = ref([]);

const fetchCompanies = async () => {
  try {
    const response = await axios.get('/companies');
    companies_list.value = await response.data.companies;
  } catch (error) {
    console.error('Ошибка :', error);
  }
};

const vacancies_list = ref([]);

const fetchVacancies = async () => {
  try {
    vacancies_list.value = [];
    isFetchingVacancy.value = true;
    const response = await axios.get(`/vacancies?company_id=${selectedCompany.value}`);
    const vacancies = await response.data?.vacancies;
    if (vacancies.length) {
      selectedVacancy.value = null;
      vacancies_list.value = vacancies
        ?.map((el) => {
          if (el.state.id == 7) {
            return {
              id: el.id,
              job_position_name_ru: el.job_position.name_ru,
            };
          }
        })
        .filter(Boolean);
      if (!vacancies_list.value.length) {
        selectedVacancy.value = 0;
        vacancies_list.value = [
          {
            id: 0,
            job_position_name_ru: 'Нет открытых вакансий в этой компании.',
          },
        ];
      }
    } else {
      selectedVacancy.value = 0;
      vacancies_list.value = [
        {
          id: 0,
          job_position_name_ru: 'Нет открытых вакансий в этой компании.',
        },
      ];
    }
  } catch (error) {
    console.error('Ошибка :', error);
  } finally {
    isFetchingVacancy.value = false;
  }
};
watch(selectedCompany, (newVal) => {
  if (newVal) {
    fetchVacancies();
  } else {
    vacancies_list.value = [];
  }
});

onMounted(() => fetchCompanies());

const isFetching1 = ref(false);
const isFetching2 = ref(false);
const isFetching3 = ref(false);

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
    emit('fetchDatas');
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
    emit('fetchDatas');
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
    emit('fetchDatas');
    comment.value = '';
    isDialogVisible.value = false;
  } catch (error) {
    console.error('Ошибка :', error);
  } finally {
    isFetching3.value = false;
  }
};
</script>
<template>
  <VDialog v-model="isDialogVisible" max-width="600">
    <!-- Активатор диалога -->
    <template #activator="{ props }">
      <VIcon
        v-bind="props"
        @click="
          (event) => {
            event.stopPropagation();
          }
        "
        size="30"
        icon="bx-check"
      ></VIcon>
    </template>

    <!-- Содержимое диалога -->
    <VCard title="Профиль пользователя">
      <DialogCloseBtn variant="text" size="small" @click="onFormCancel" />

      <VCardText>
        <VRow class="justify-center">
          <VCol cols="12">
            <VTextarea label="Комментарий" v-model="comment" />
          </VCol>
          <VCol cols="6">
            <VSelect
              no-data-text="Нет данных"
              v-model="selectedCompany"
              label="Выберите компанию"
              :items="companies_list"
              item-title="title"
              item-value="id"
              clearable
              clear-icon="bx-x"
            />
          </VCol>
          <VCol cols="6" class="d-flex justify-center align-center">
            <VSelect
              no-data-text="Нет данных"
              v-if="vacancies_list.length && !isFetchingVacancy"
              v-model="selectedVacancy"
              label="Выберите вакансию"
              :items="vacancies_list"
              item-title="job_position_name_ru"
              item-value="id"
              clearable
              clear-icon="bx-x"
              aria-selected="true"
            />
            <VProgressCircular
              v-if="isFetchingVacancy && !vacancies_list.length"
              color="primary"
              indeterminate
            ></VProgressCircular>
            <span
              v-if="!isFetchingVacancy && !vacancies_list.length"
              style="font-weight: 700; margin-inline-end: 4px"
              >Компания не выбрана</span
            >
          </VCol>

          <!-- 👉 Отправить и Отмена -->

          <VCol cols="4" class="px-1">
            <VBtn
              :loading="isFetching1"
              :disabled="isFetching1 || isFetching2 || isFetching3"
              class="w-100"
              color="warning"
              @click="onCancel"
            >
              Отменить
              <VIcon icon="bx-minus-circle" class="ml-1 mr-0" />
            </VBtn>
          </VCol>
          <VCol cols="4" class="px-1">
            <VBtn
              :loading="isFetching2"
              :disabled="isFetching1 || isFetching2 || isFetching3"
              class="w-100"
              color="error"
              @click="onBlock"
            >
              Заблокировать
              <VIcon icon="bx-block" class="ml-1 mr-0" />
            </VBtn>
          </VCol>
          <VCol cols="4" class="px-1">
            <VBtn
              :loading="isFetching3"
              :disabled="isFetching1 || isFetching2 || isFetching3"
              class="w-100"
              color="secondary"
              @click="onArchive"
            >
              Архивировать
              <VIcon icon="bx-archive-in" class="ml-1 mr-0" />
            </VBtn>
          </VCol>
          <VCol cols="12" class="px-1">
            <VBtn @click="onSubmit" :loading="isFetching" :disabled="isFetching" class="w-100">
              Отправить
              <VIcon icon="mdi-file-document-arrow-right-outline" class="ml-1 mr-0" />
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>
  </VDialog>
</template>

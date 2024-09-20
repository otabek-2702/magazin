<script setup>
import { computed, onMounted, ref, watch, watchEffect } from 'vue';
import axios from '@axios';
import AddNewCandidateDrawer from '@/views/candidate/AddNewCandidateDrawer.vue';
import UpdateCandidateDrawer from '@/views/candidate/UpdateCandidateDrawer.vue';
import ChangeStateCandidate from '@/views/candidate/ChangeStateCandidate.vue';
import Skeleton from '@/views/skeleton/Skeleton.vue';
import CandidateInfo from '@/views/candidate/CandidateInfo.vue';
import CandidateAccept from '@/views/candidate/CandidateAccept.vue';

const searchQuery = ref('');
const finalSearch = ref('');
const rowPerPage = ref(10);
const currentPage = ref(1);
const totalPage = ref(1);
const totalCandidates = ref(0);
const candidates = ref([]);
const updateID = ref(0);

const selectedState = ref();
const selectedGender = ref();

const states_list = ref([]);
const gender_list = ref([
  {
    name_ru: 'Мужчина',
    slug: 'man',
  },
  {
    name_ru: 'Женщина',
    slug: 'woman',
  },
]);

// Get main datas start
const lastFetchedPage = ref(null);
const isFetching = ref(false);
const filtersChanged = ref(false);

const fetchData = async (force = false) => {
  if (
    !force &&
    (isFetching.value || (currentPage.value === lastFetchedPage.value && !filtersChanged.value))
  ) {
    return; // Если запрос уже выполняется или страница не изменилась и фильтры не изменялись
  }

  isFetching.value = true;
  let g = '';
  let state = '';

  if (selectedGender.value) {
    g = '&gender=' + selectedGender.value;
  }

  if (selectedState.value) {
    state = '&state=' + selectedState.value;
  }

  try {
    const candidates_r = await axios.get(
      `/candidates?page=${currentPage.value}${g}${state}&search=${finalSearch.value}`,
    );

    candidates.value = candidates_r.data['candidates'];
    lastFetchedPage.value = currentPage.value;
    currentPage.value = candidates_r.data['meta']['current_page'];
    totalCandidates.value = candidates_r.data['meta']['total'];
    totalPage.value = candidates_r.data['meta']['last_page'];
    rowPerPage.value = candidates_r.data['meta']['per_page'];

    filtersChanged.value = false; // Сбрасываем флаг изменений фильтров после загрузки
  } catch (error) {
    console.error('Ошибка загрузки кандидатов:', error);
  } finally {
    isFetching.value = false;
  }
};

// Get main datas end

// 👉 watching selected filters
watch([selectedState, selectedGender], () => {
  // Сбрасываем на первую страницу при изменении фильтров
  filtersChanged.value = true; // Устанавливаем флаг, что фильтры изменились
  currentPage.value = 1;
  fetchData(true);
});

// search
const searchElements = () => {
  finalSearch.value = searchQuery.value;
  currentPage.value = 1;
  fetchData(true);
};

watch(searchQuery, (newVal) => {
  if (!newVal) {
    finalSearch.value = '';
    currentPage.value = 1;
    fetchData(true);
  }
});

const fetchStates = async () => {
  try {
    const states_r = await axios.get(`/states`);
    states_list.value = states_r.data.states.filter((el) => el.table === 'candidates');
  } catch (error) {
    console.error('Ошибка :', error);
  }
};

onMounted(() => {
  fetchData();
  fetchStates();
});

const resolveUserRoleVariant = (state) => {
  const roleLowerCase = state.toLowerCase();
  const roleMap = {
    new: { color: 'primary', icon: 'bx-user' },
    cancel: { color: 'warning', icon: 'bx-cog' },
    archive: { color: 'secondary', icon: 'bx-cog' },
    success: { color: 'success', icon: 'bx-doughnut-chart' },
    invite: { color: 'info', icon: 'bx-pencil' },
    block: { color: 'error', icon: 'bx-laptop' },
  };

  return roleMap[roleLowerCase] || { color: 'primary', icon: 'bx-user' };
};

const isAddNewCandidateDrawerVisible = ref(false);
const isUpdateCandidateDrawerVisible = ref(false);
const isCandidateInfoDialogVisible = ref(false);

// Pages start

// 👉 watching current page
watch(currentPage, () => {
  if (!isFetching.value) {
    fetchData();
  }
});

// 👉 Watching current page
watchEffect(() => {
  if (currentPage.value > totalPage.value) currentPage.value = totalPage.value;
});

// 👉 Computing pagination data
const paginationData = computed(() => {
  const firstIndex = candidates.value.length ? (currentPage.value - 1) * rowPerPage.value + 1 : 0;
  const lastIndex = candidates.value.length + (currentPage.value - 1) * rowPerPage.value;

  return `${firstIndex}-${lastIndex} of ${totalCandidates.value}`;
});

// Pages end

// Edit
const openEditDrawer = (id) => {
  updateID.value = id;
  isUpdateCandidateDrawerVisible.value = true;
};

const candidateViewId = ref(0);

const handleCandidateOpen = (id) => {
  candidateViewId.value = id;
  isCandidateInfoDialogVisible.value = true;
};
</script>

<template>
  <section>
    <VRow>
      <VCol cols="12">
        <VCard title="Фильтры поиска">
          <VDivider />

          <VCardText class="d-flex flex-wrap">
            <VCol cols="3" sm="3">
              <VSelect
                v-model="selectedState"
                label="Выберите статус"
                :items="states_list"
                item-title="name_ru"
                item-value="id"
                clearable
                clear-icon="bx-x"
              />
            </VCol>

            <VCol cols="3" sm="3">
              <VSelect
                v-model="selectedGender"
                label="Выберите пол"
                :items="gender_list"
                clearable
                clear-icon="bx-x"
                item-title="name_ru"
                item-value="slug"
              />
            </VCol>

            <!-- <VSpacer /> -->

            <!-- <div class="app-user-search-filter d-flex align-center"> -->
            <VCol cols="6" class="app-user-search-filter d-flex align-center">
              <VTextField
                v-model="searchQuery"
                @keyup.enter="searchElements"
                placeholder="Поиск кандидата"
                density="compact"
                class="me-6"
              />
              <VBtn @click="isAddNewCandidateDrawerVisible = true"> Добавить кандидата </VBtn>
            </VCol>

            <!-- </div> -->
          </VCardText>

          <VDivider />

          <VTable class="text-no-wrap">
            <thead>
              <tr>
                <th style="width: 48px">ID</th>
                <th>ПОЛНОЕ ИМЯ</th>
                <th>ВОЗРАСТ</th>
                <th>АДРЕС</th>
                <th>НОМЕР ТЕЛЕФОНА</th>
                <th>СТАТУС</th>
                <th>ДЕЙСТВИЯ</th>
              </tr>
            </thead>

            <tbody>
              <tr
                @click="() => handleCandidateOpen(candidate.id)"
                :style="{ cursor: 'pointer' }"
                v-for="candidate in candidates"
                :key="candidate.id"
              >
                <td>{{ candidate.id }}</td>
                <td>
                  {{ candidate.full_name }}
                </td>
                <td>{{ candidate.age }}</td>
                <td>{{ candidate.address }}</td>
                <td>{{ candidate.phone_number }}</td>
                <td>
                  <VChip
                    :color="resolveUserRoleVariant(candidate.state.slug).color"
                    density="compact"
                    label
                    class="text-uppercase"
                  >
                    {{ candidate.state.name_ru }}
                  </VChip>
                </td>
                <td class="text-center" :style="{ width: '80px', zIndex: '10' }">
                  <VIcon
                    @click="
                      (event) => {
                        event.stopPropagation();
                        openEditDrawer(candidate.id);
                      }
                    "
                    v-if="!(candidate.state.slug === 'cancel' || candidate.state.slug === 'block')"
                    size="30"
                    icon="bx-edit-alt"
                    style="color: rgb(var(--v-global-theme-primary))"
                  ></VIcon>

                  <ChangeStateCandidate
                    v-if="
                      !(
                        candidate.state.slug === 'cancel' ||
                        candidate.state.slug === 'block' ||
                        candidate.state.slug === 'invite' ||
                        candidate.state.slug === 'success'
                      )
                    "
                    @fetchDatas="() => fetchData(true)"
                    :isDialogVisible="true"
                    :id="candidate.id"
                    :state_slug="candidate.state.slug"
                  />
                  <CandidateAccept
                    v-if="candidate.state.slug === 'invite'"
                    @fetchDatas="() => fetchData(true)"
                    :isDialogVisible="true"
                    :id="candidate.id"
                  />
                </td>
              </tr>
            </tbody>
            <Skeleton :count="7" v-show="isFetching && !candidates.length" />

            <tfoot v-show="!isFetching && !candidates.length">
              <tr>
                <td colspan="7" class="text-center text-body-1">Нет доступных данных</td>
              </tr>
            </tfoot>
          </VTable>

          <VDivider />

          <VCardText class="d-flex flex-wrap justify-end gap-4 pa-2">
            <div class="d-flex align-center" style="width: 300px">
              <h6 class="text-sm font-weight-regular">{{ paginationData }}</h6>
            </div>

            <VPagination
              v-if="candidates.length"
              v-model="currentPage"
              size="small"
              :total-visible="1"
              :length="totalPage"
            />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <AddNewCandidateDrawer
      v-model:isDrawerOpen="isAddNewCandidateDrawerVisible"
      @fetchDatas="() => fetchData(true)"
    />
    <UpdateCandidateDrawer
      :id="updateID"
      v-model:isDrawerOpen="isUpdateCandidateDrawerVisible"
      @fetchDatas="() => fetchData(true)"
    />

    <CandidateInfo
      v-model:isDrawerOpen="isCandidateInfoDialogVisible"
      :candidateId="candidateViewId"
      @fetchDatas="() => fetchData(true)"
    />
  </section>
</template>

<style lang="scss">
.app-user-search-filter {
  inline-size: 385px;
}

.text-capitalize {
  text-transform: capitalize;
}
</style>

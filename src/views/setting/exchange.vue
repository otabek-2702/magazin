<script setup>
import { ref, onMounted } from "vue";
import axios from "@axios";
import Skeleton from "@/views/skeleton/Skeleton.vue";
import DeleteItemDialog from "@/@core/components/DeleteItemDialog.vue";
import { toast } from "vue3-toastify";
import { useAppAbility } from "@/plugins/casl/useAppAbility";

const { can } = useAppAbility();

const exchange_rates = ref([]);
const isFetchingStart = ref(false);
const isFetching = ref(false);
const finalSearch = ref("");
const newElem = ref({
  name: "",
  symbol: "",
  rate: "",
});
const editingId = ref(null);
const isDialogVisible = ref(false);
const isDeleting = ref(false);
const deleteData = ref({ id: null, name: null });

const fetchData = async (force = false) => {
  if (!force && isFetchingStart.value) return;

  try {
    isFetchingStart.value = true;
    const { data } = await axios.get(
      `/exchange_rates?search=${finalSearch.value}`
    );
    exchange_rates.value = data["exchange_rates"];
  } catch (error) {
    console.error("Ошибка загрузки:", error);
  } finally {
    isFetchingStart.value = false;
  }
};

// Add
const onAddSubmit = async () => {
  try {
    isFetching.value = true;
    await axios.post("/exchange_rates", {
      ...newElem.value,
    });
    fetchData(true);

    toast("Успешно добавлено", {
      type: "success",
    });
    finalSearch.value = "";
    newElem.value = {
      name: "",
      symbol: "",
      rate: "",
    };
  } catch (error) {
    console.error(error);
  } finally {
    isFetching.value = false;
  }
};

// Edit
const showEditInput = (id) => {
  editingId.value = id;
};

const hideEditInput = async (exchange) => {
  if (editingId.value === exchange.id) {
    try {
      await axios.put(`/exchange_rates/${exchange.id}`, {
        rate: exchange.rate,
        name: exchange.name,
        symbol: exchange.symbol,
      });
      await fetchData(true);
      toast("Успешно обновлено", { type: "success" });
    } catch (error) {
      console.error("Ошибка при обновлении:", error);
      toast("Ошибка при обновлении", { type: "error" });
    }
  }
  editingId.value = null;
};

// Delete
const confirmDelete = (id, name) => {
  deleteData.value = { id, name };
  isDialogVisible.value = true;
};

const deleteItem = async (id) => {
  try {
    isDeleting.value = true;
    await axios.delete(`/exchange_rates/${id}`);
    toast("Успешно удалено", { type: "success" });
    await fetchData(true);
  } catch (error) {
    console.error("Ошибка при удалении:", error);
    toast("Ошибка при удалении", { type: "error" });
  } finally {
    isDeleting.value = false;
    isDialogVisible.value = false;
  }
};

// search
const handleSearch = async () => {
  finalSearch.value = newElem.value.name;
  fetchData(true);
};

watch(
  () => newElem.value.name,
  (newVal) => {
    if (!newVal) {
      finalSearch.value = "";
      fetchData(true);
    }
  }
);

onMounted(fetchData);
</script>
<template>
  <VCard title="Курсы валют">
    <DeleteItemDialog
      @confirm="deleteItem"
      :isDialogVisible="isDialogVisible"
      @update:isDialogVisible="isDialogVisible = $event"
      :role="deleteData"
      :isDeleting="isDeleting"
    />
    <VCardText class="d-flex flex-wrap">
      <VSpacer />
      <VCol cols="8">
        <VTextField
          :disabled="isFetching"
          label="Имя"
          @keyup.enter="handleSearch"
          :rules="[]"
          v-model="newElem.name"
          density="compact"
        />
      </VCol>
      <VCol cols="4" class="app-user-search-filter d-flex align-center">
        <Can I="create" a="Exchangerates">
          <VBtn :disabled="isFetching" :loader="isFetching" @click="onAddSubmit"
            >Добавить</VBtn
          >
        </Can>
      </VCol>
      <Can I="create" a="Exchangerates">
        <VCol cols="6">
          <VTextField
            :disabled="isFetching"
            label="Символ"
            :rules="[]"
            v-model="newElem.symbol"
            density="compact"
          />
        </VCol>
        <VCol cols="6">
          <VTextField
            :disabled="isFetching"
            type="number"
            label="Курс"
            :rules="[]"
            v-model="newElem.rate"
            density="compact"
          />
        </VCol>
      </Can>
    </VCardText>

    <VDivider />

    <VTable>
      <thead>
        <tr>
          <th data-column="id">ID</th>
          <th>ИМЯ</th>
          <th>СИМВОЛ</th>
          <th>КУРС</th>
          <th
            data-column="actions"
            v-if="
              can('update', 'Exchangerate') || can('delete', 'Exchangerate')
            "
          >
            ДЕЙСТВИЯ
          </th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="exchange in exchange_rates"
          :key="exchange.id"
          class="cursor-pointer"
        >
          <td>{{ exchange.id }}</td>
          <td>
            <VTextField
              v-model="exchange.name"
              :readonly="editingId !== exchange.id"
              :class="{ 'text-input': editingId !== exchange.id }"
              class="custom-input"
              density="compact"
            />
          </td>
          <td>
            <VTextField
              v-model="exchange.symbol"
              :readonly="editingId !== exchange.id"
              :class="{ 'text-input': editingId !== exchange.id }"
              class="custom-input"
              density="compact"
            />
          </td>
          <td>
            <VTextField
              v-model="exchange.rate"
              :readonly="editingId !== exchange.id"
              :class="{ 'text-input': editingId !== exchange.id }"
              class="custom-input"
              density="compact"
            />
          </td>
          <td data-column="actions">
            <Can I="update" a="Exchangerate">
              <VIcon
                v-if="editingId === exchange.id"
                @click.stop="hideEditInput(exchange)"
                size="30"
                icon="bx-check"
                style="color: rgb(var(--v-theme-success))"
                class="mx-2"
              />
              <VIcon
                v-else
                @click.stop="showEditInput(exchange.id)"
                size="30"
                icon="bx-edit-alt"
                color="primary"
                class="mx-2"
              />
            </Can>
            <!-- <Can I="delete" a="Exchangerate">
              <VIcon
                size="30"
                icon="bx-trash"
                color="error"
                @click.stop="confirmDelete(exchange.id, exchange.name)"
              />
            </Can> -->
          </td>
        </tr>
      </tbody>
      <Skeleton :count="4" v-if="isFetchingStart && !exchange_rates.length" />

      <tfoot v-if="!isFetchingStart && !exchange_rates.length">
        <tr>
          <td colspan="4" class="text-center text-body-1">
            Нет доступных данных
          </td>
        </tr>
      </tfoot>
    </VTable>

    <VDivider />
  </VCard>
</template>
<style scoped>
.app-user-search-filter {
  inline-size: 385px;
}

.text-input {
  background-color: transparent !important;
}

.text-input :deep(.v-field__outline) {
  opacity: 0 !important;
}

.text-input :deep(.v-field__input) {
  padding-inline-start: 0 !important;
  padding-inline-end: 0 !important;
}

.text-input :deep(.v-label) {
  opacity: 0 !important;
}

.custom-input {
  margin: 1px;
}
</style>

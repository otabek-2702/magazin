// composables/usePagination.ts
import { ref, computed, watch } from "vue";
import axios from "axios";
import { debounce } from "lodash-es"; // If you're using lodash

interface PaginationMeta {
  current_page: number;
  total: number;
  total_pages: number;
  per_page: number;
}

interface FetchOptions {
  baseUrl: string;
  searchQuery?: string;
  additionalParams?: Record<string, any>;
}

export function usePagination() {
  // State refs
  const items = ref([]);
  const currentPage = ref(1);
  const totalPages = ref(1);
  const rowsPerPage = ref(10);
  const totalItems = ref(0);
  const searchQuery = ref("");
  const finalSearch = ref("");
  const isFetching = ref(false);
  const lastFetchedPage = ref(null);

  // Computed for pagination display
  const paginationData = computed(() => {
    const firstIndex = items.value.length
      ? (currentPage.value - 1) * rowsPerPage.value + 1
      : 0;
    const lastIndex =
      items.value.length + (currentPage.value - 1) * rowsPerPage.value;

    return `${firstIndex}-${lastIndex} of ${totalItems.value}`;
  });

  const fetchData = async (force = false) => {
    if (
      !force &&
      (isFetching.value || currentPage.value === lastFetchedPage.value)
    ) {
      return;
    }

    try {
      isFetching.value = true;
      const { data } = await axios.get(
        `/batches?paginate=${rowsPerPage.value}&page=${currentPage.value}&search=${finalSearch.value}`
      );

      items.value = data.batches;
      lastFetchedPage.value = currentPage.value;
      currentPage.value = data.meta.pagination.current_page;
      totalItems.value = data.meta.pagination.total;
      totalPages.value = data.meta.pagination.total_pages;
      rowsPerPage.value = data.meta.pagination.per_page;
    } catch (error) {
      console.error("Failed to fetch data:", error);
      items.value = [];
    } finally {
      isFetching.value = false;
    }
  };

  // Debounced fetch with 300ms delay
  const debouncedFetch = debounce(fetchData, 300);

  // Search handler
  const handleSearch = () => {
    finalSearch.value = searchQuery.value;
    currentPage.value = 1;
    fetchData(true);
  };

  // Watch search query
  watch(searchQuery, (newVal) => {
    if (!newVal) {
      finalSearch.value = "";
      currentPage.value = 1;
      fetchData(true);
    }
  });

  // Watch current page
  watch(currentPage, () => {
    if (!isFetching.value) {
      debouncedFetch();
    }
  });

  // Watch total pages to ensure current page is valid
  watch(totalPages, (newTotalPages) => {
    if (currentPage.value > newTotalPages && newTotalPages > 0) {
      currentPage.value = newTotalPages;
    }
  });

  return {
    // State
    items,
    currentPage,
    totalPages,
    rowsPerPage,
    totalItems,
    isFetching,
    searchQuery,

    // Computed
    paginationData,

    // Methods
    fetchData,
    handleSearch,
  };
}

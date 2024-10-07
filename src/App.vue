<script setup>
import { useTheme } from 'vuetify';
import ScrollToTop from '@core/components/ScrollToTop.vue';
import { useThemeConfig } from '@core/composable/useThemeConfig';
import { hexToRgb } from '@layouts/utils';

const {
  syncInitialLoaderTheme,
  syncVuetifyThemeWithTheme: syncConfigThemeWithVuetifyTheme,
  isAppRtl,
  handleSkinChanges,
} = useThemeConfig();

const { global } = useTheme();

// ℹ️ Sync current theme with initial loader theme
syncInitialLoaderTheme();
syncConfigThemeWithVuetifyTheme();
handleSkinChanges();

let scannedText = '';
let scanning = false;

document.addEventListener('keydown', (event) => {
  // Check if the currently focused element is an input or a textarea
  const activeElement = document.activeElement;
  const isInputField = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA';

  // If the user is not focused on an input/textarea, capture the scanner input
  if (!isInputField) {
    if (!scanning) {
      // Start capturing input
      scanning = true;
      scannedText = ''; // Reset the scanned text
    }

    // Check if the key pressed is Enter (to end the scan)
    if (event.key === 'Enter') {
      scanning = false;
      console.log('Scanned code:', scannedText);

      // Process the scanned text (e.g., fetch product details based on code)
      handleScannedCode(scannedText);

      // Reset the scanned text for the next scan
      scannedText = '';
    } else {
      // Append the character to scannedText
      scannedText += event.key;
    }
  }
});


function handleScannedCode(code) {
  // This function handles the scanned code
  // You can use it to call an API or update the UI based on the scanned code
  alert(code);
}
</script>

<template>
  <VLocaleProvider :rtl="isAppRtl">
    <!-- ℹ️ This is required to set the background color of active nav link based on currently active global theme's primary -->
    <VApp :style="`--v-global-theme-primary: ${hexToRgb(global.current.value.colors.primary)}`">
      <RouterView />
      <ScrollToTop />
    </VApp>
  </VLocaleProvider>
</template>

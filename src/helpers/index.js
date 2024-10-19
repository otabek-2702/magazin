export const transformPrice = (price) => {
    let formattedPrice = price
        ?.toString()
        .replace('.00', '')
        .replace(/\s/g, '')
        .replace(/[^\d\s]/g, '')
        .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return formattedPrice?.trim() ?? '';
}

export const removeSpaces = (input) => {
    let newVal = input.replace(/\s+/g, "")
    let newValNumeric = Number(newVal)
    return newValNumeric ? newValNumeric : newVal;
  };
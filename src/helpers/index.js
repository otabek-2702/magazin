export const transformPrice = (price) => {
    let formattedPrice = price
        ?.toString()
        .replace('.00', '')
        .replace(/\s/g, '')
        .replace(/[^\d\s]/g, '')
        .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return formattedPrice?.trim() ?? '';
}
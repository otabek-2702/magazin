export const transformPrice = (price) => {
    let formattedPrice = Number(price)
        ?.toString()
        .replace(/\s/g, '')
        .replace(/[^\d\s]/g, '')
        .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return formattedPrice?.trim() ?? '';
}
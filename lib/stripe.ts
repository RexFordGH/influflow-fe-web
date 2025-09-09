// 处理 Stripe Checkout 跳转 - 直接使用服务端返回的 URL
export const redirectToCheckout = (checkoutUrl: string) => {
  window.location.href = checkoutUrl;
};

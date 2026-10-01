/**
 * Kromic Store – API Service barrel
 * Import feature APIs from here.
 */
export { apiClient, tokenStore, ApiError, NetworkError } from "./client";
export type { ApiResult } from "./client";
export { storeApi } from "./store";
export { authApi } from "./auth";
export { cartApi, cartTokenStore } from "./cart";
export { checkoutApi } from "./checkout";
export { addressesApi } from "./addresses";
export { customerApi } from "./customer";
export { ordersApi } from "./orders";
export { otpApi, normalisePhone, isValidIndianMobile, formatIndianMobile, maskPhone, describeOtpError } from "./otp";
export type { OtpErrorDescriptor, OtpErrorTone } from "./otp";

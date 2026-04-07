/**
 * Returns a user-safe error message. Never exposes raw Axios messages like
 * "Request failed with status code 429" or internal details.
 * @param {Error} err - Caught error from api call
 * @param {string} fallback - Message when no server error body is present
 * @returns {string}
 */
export function getUserFriendlyApiError(err, fallback = 'Something went wrong. Please try again.') {
  const status = err.response?.status;
  if (status === 429) {
    return 'Too many requests. Please try again in a few minutes.';
  }
  const isNetwork =
    !err.response &&
    (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error'));
  if (isNetwork) {
    return 'Connection problem. Please try again.';
  }
  const dataError = err.response?.data?.error;
  if (dataError === 'Validation failed' && Array.isArray(err.response?.data?.details)) {
    return err.response.data.details.map((d) => d.message).join('. ');
  }
  return dataError || fallback;
}

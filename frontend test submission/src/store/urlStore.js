// urlStore.js
const store = JSON.parse(localStorage.getItem("urlMap") || "{}");

export const urlStore = {
  set: (shortcode, data) => {
    store[shortcode] = data;
    localStorage.setItem("urlMap", JSON.stringify(store));
  },
  get: (shortcode) => {
    return store[shortcode];
  },
  has: (shortcode) => {
    return shortcode in store;
  },
  all: () => Object.entries(store),
  clear: () => localStorage.removeItem("urlMap"),
};

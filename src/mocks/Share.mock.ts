// src/mocks/Share.debug.ts

const Share = {
    /**
     * Debug/mock Share.open method.
     * Just logs the call and resolves (or rejects if you want to simulate errors).
     */
    open: async (options: any) => {
      console.log('[DEBUG] Share.open called with:', options);
      // Simulate success:
      return Promise.resolve();
      // Or, to simulate error:
      // return Promise.reject(new Error("Share is unavailable in debug/mock mode."));
    },
  };

  export default Share;

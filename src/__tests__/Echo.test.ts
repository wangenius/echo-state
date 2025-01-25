import { Echo } from "../Echo";

describe("Echo", () => {
  interface TestState {
    count: number;
    text: string;
  }

  const initialState: TestState = {
    count: 0,
    text: "",
  };

  let echo: Echo<TestState>;

  beforeEach(() => {
    echo = new Echo<TestState>("test", initialState, { persist: false });
  });

  // 基础功能测试
  describe("basic functionality", () => {
    it("should initialize with default state", () => {
      expect(echo.current).toEqual(initialState);
    });

    it("should update partial state", () => {
      echo.set({ count: 1 });
      expect(echo.current.count).toBe(1);
      expect(echo.current.text).toBe("");
    });

    it("should update state with function", () => {
      echo.set((state) => ({ ...state, count: state.count + 1 }));
      expect(echo.current.count).toBe(1);
    });

    it("should replace entire state", () => {
      echo.set({ count: 1, text: "hello" }, true);
      expect(echo.current).toEqual({ count: 1, text: "hello" });
    });
  });

  // 持久化测试
  describe("persistence", () => {
    it("should persist state to localStorage", () => {
      const persistentEcho = new Echo<TestState>("persistent-test", initialState, {
        storage: "localStorage",
        persist: true,
      });
      
      persistentEcho.set({ count: 1 });
      
      // 验证 localStorage
      const stored = localStorage.getItem("persistent-test");
      expect(JSON.parse(stored || "{}").state.count).toBe(1);
    });
  });

  // 订阅测试
  describe("subscription", () => {
    it("should notify subscribers of state changes", () => {
      const mockCallback = jest.fn();
      echo.subscribe((state) => mockCallback(state));

      echo.set({ count: 1 });
      
      expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({
        count: 1,
      }));
    });
  });

  // 选择器测试
  describe("selectors", () => {
    it("should select specific state with selector", () => {
      const count = echo.use((state) => state.count);
      expect(count).toBe(0);
    });
  });

  // 错误处理测试
  describe("error handling", () => {
    it("should handle invalid state updates gracefully", () => {
      expect(() => {
        echo.set(null as any);
      }).not.toThrow();
    });
  });

  // 回调测试
  describe("callbacks", () => {
    it("should call onChange when state changes", () => {
      const onChange = jest.fn();
      const echoWithCallback = new Echo<TestState>("test-callback", initialState, {
        persist: false,
        onChange,
      });

      echoWithCallback.set({ count: 1 });
      
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ count: 1 }),
        initialState
      );
    });
  });
}); 
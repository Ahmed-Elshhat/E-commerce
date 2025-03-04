import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

type WindowContextType = {
  windowSize: number;
};

// 2️⃣ إنشاء Context مع قيمة ابتدائية مناسبة
const WindowContext = createContext<WindowContextType | null>(null);

function WindowProvider({ children }: { children: ReactNode }) {
  const [windowSize, setWindowSize] = useState(window.innerWidth);

  useEffect(() => {
    function setWindowWidth() {
      setWindowSize(window.innerWidth);
    }

    window.addEventListener("resize", setWindowWidth);

    // CleanUp Function
    return () => {
      window.removeEventListener("resize", setWindowWidth);
    };
  }, []);

  return (
    <WindowContext.Provider value={{ windowSize }}>
      {children}
    </WindowContext.Provider>
  );
}

export default WindowProvider;

export const useWindow = () => {
  const context = useContext(WindowContext);
  if (!context) {
    throw new Error("useWindow must be used within a WindowProvider");
  }
  return context;
};

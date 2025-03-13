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
  return useContext(WindowContext);
};

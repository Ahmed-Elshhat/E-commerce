import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "react-loading-skeleton/dist/skeleton.css";
import { BrowserRouter as Router } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./Redux/app/store.ts";
import App from "./App.tsx";
import WindowProvider from "./context/windowContext.tsx";
import "./i18n";  

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router>
      <Provider store={store}>
        <WindowProvider>
          <App />
        </WindowProvider>
      </Provider>
    </Router>
  </StrictMode>
);

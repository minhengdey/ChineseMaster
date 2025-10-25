import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Import silence module first so it runs before other app modules that may log during module evaluation
import "./console-silence";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")!).render(
   <StrictMode>
      <App />
   </StrictMode>
);

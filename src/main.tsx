import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "@/types/index";

createRoot(document.getElementById("root")!).render(<App />);

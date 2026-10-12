import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import RootRoute from "./root-route";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootRoute />
  </StrictMode>,
);

import React from "react";
import ReactDOM from "react-dom/client";
import { LazyMotion, domAnimation } from "framer-motion";
import "./styles.css";
import DiagnosticoPage from "./diagnostic/DiagnosticoPage";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LazyMotion features={domAnimation}>
      <DiagnosticoPage />
    </LazyMotion>
  </React.StrictMode>,
);

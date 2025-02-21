import { AnimatedSquare } from "./AnimatedSquare";

const initApp = () => {
  const canvas = document.getElementById("mainCanvas") as HTMLCanvasElement;

  if (!canvas) {
    console.error("Canvas element not found!");
    return;
  }

  new AnimatedSquare(canvas);
};

// Запускаем после полной загрузки страницы
if (document.readyState === "complete") {
  initApp();
} else {
  window.addEventListener("load", initApp);
}

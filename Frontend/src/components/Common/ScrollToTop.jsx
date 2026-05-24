import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    // Reset page scroll and known custom scroll containers on route change.
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      const root = document.getElementById("root");
      if (root) {
        root.scrollTop = 0;
      }

      document.querySelectorAll('[data-scroll-container="true"]').forEach((node) => {
        node.scrollTop = 0;
      });
    });
  }, [pathname, search]);

  return null;
};

export default ScrollToTop;

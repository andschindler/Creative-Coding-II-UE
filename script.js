const sky = document.querySelector("#mysky");
      const button = document.querySelector("#toggleSkyBtn");

      button.addEventListener("click", () => {
        const isVisible = sky.getAttribute("visible");
        sky.setAttribute("visible", !isVisible);
      });

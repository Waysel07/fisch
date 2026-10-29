   document.addEventListener('click', () => {
     new Audio('/fish.mp3').play().catch(() => {});
   });

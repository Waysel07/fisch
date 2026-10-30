   document.addEventListener('click', () => {
     new Audio('/fish.mp3').play().catch(() => {});
   });

   // Fish favicon and fish cursor on every page
   document.head.insertAdjacentHTML('beforeend', `
     <link rel="icon" href="/fish.svg" type="image/svg+xml">
     <link rel="apple-touch-icon" href="/apple-touch-icon.png">
     <style>* { cursor: url("/fish-cursor.png") 1 16, auto !important; }</style>
   `);

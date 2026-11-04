   document.addEventListener('click', () => {
     new Audio('/sounds/fish.mp3').play().catch(() => {});
   });

   // Fish favicon and fish cursor on every page
   document.head.insertAdjacentHTML('beforeend', `
     <link rel="icon" href="/img/fish-icon.png" type="image/png">
     <link rel="apple-touch-icon" href="/apple-touch-icon.png">
     <style>* { cursor: url("/img/fish-cursor.png") 0 2, auto !important; }</style>
   `);

// Visitor statistics, see datenschutz.html section 3
document.head.appendChild(Object.assign(document.createElement('script'), { src: '/js/analytics.js', defer: true }));

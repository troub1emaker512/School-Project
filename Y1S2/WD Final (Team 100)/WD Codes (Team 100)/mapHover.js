let currentImage;

function showImage(elemId, imgSrc) {
const elem = document.getElementById(elemId);
    
    
  if(!currentImage){
    const popImage = new Image();
        popImage.src = imgSrc;
        popImage.style.position = "absolute";
        popImage.style.left = event.clientX + 'px';
        popImage.style.top = event.clientY + 'px'; 
        popImage.style.zIndex = "1";
        popImage.style.width = '500px';
    
    elem.appendChild(popImage);
    
    currentImage = popImage;
}
}
function hideImage(elemId) {
  const elem = document.getElementById(elemId);
    if (currentImage) {
        elem.removeChild(currentImage); 
        currentImage = null;
    }
}
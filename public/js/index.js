const gallery = document.getElementById("imageGallery");
const leftArrow = document.querySelector(".left-arrow");
const rightArrow = document.querySelector(".right-arrow");

// -------------------------
//global variables for image carousel
// -------------------------
let isMoving = false;
const CLONE_COUNT = 3;
let index = CLONE_COUNT;
let slideWidth = 0;
let wrapperWidth = 0;

// -------------------------
//IMAGE CAROUSEL
// -------------------------
const images = [
  {
    src: "https://people.com/thmb/JeX3Zm0C8LpUeM12Oa3LzQS6snI=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():focal(764x229:766x231)/Blackpink-2023-members-01-9d67ffe25a474456b4be77adedb057b0.jpg",
    caption: "BLACKPINK"
  },
  {
    src: "https://www.pinkvilla.com/images/2025-01/133995648_aespa-6-2.jpg",
    caption: "aespa"
  },
  {
    src: "https://preview.redd.it/which-members-of-le-sserafim-are-these-v0-rd0ifuc9pkme1.jpg?width=1548&format=pjpg&auto=webp&s=902e8d0b0384c92fbafba9a319344fe0aff9d89b",
    caption: "LE SSERAFIM"
  },
  {
    src: "https://preview.redd.it/my-10-favorite-twice-songs-of-2024-from-with-you-th-dive-v0-qbmosoqq9s9e1.png?width=640&crop=smart&auto=webp&s=d5fff1f2f5874a2aaeaaa1dbc1624721b88500c0",
    caption: "TWICE"
  },
  {
    src: "https://nolae.eu/cdn/shop/articles/gi-dle-beginnt-2024-mit-dem-zweiten-studio-album-2-889229.jpg?v=1704927358&width=1200",
    caption: "I-DLE"
  },
  {
    src: "https://www.rollingstone.com/wp-content/uploads/2025/04/XG-exclusive.jpg?w=1581&h=1054&crop=1",
    caption: "XG"
  },
  {
    src: "https://afosto-cdn-01.afosto.com/atefn/slide/1809243322-Everglow.pngfit10242C768ssl1",
    caption: "Everglow"
  },
  {
    src: "https://kpopisforeveryone.wordpress.com/wp-content/uploads/2023/04/loona.jpg?w=1024",
    caption: "LOONA"
  },
  {
    src: "https://bataclan-medias.s3.eu-west-3.amazonaws.com/paris_1920_x_1080_no_text_0_bd62b24b71.jpg",
    caption: "ARTMS"
  },
  {
    src: "https://kpopsingers.com/wp-content/uploads/2024/05/loossemble-members-1-1.jpg",
    caption: "Loossemble"
  },
  {
    src: "https://i.redd.it/itzy-japan-2nd-album-collector-concept-photo-2-v0-cfiyfbx435nf1.jpg?width=2048&format=pjpg&auto=webp&s=0c1737a3869be138c9efdc1f34e3f70918fcdfe3",
    caption: "ITZY"
  },
  {
    src: "https://i.redd.it/happy-3rd-anniversary-to-nmixx-v0-o9e3eqxebike1.jpg?width=4096&format=pjpg&auto=webp&s=9d6227a81d35d4283dbefb562b248fbb148bebbe",
    caption: "NMIXX"
  },
  {
    src: "https://newsimg.koreatimes.co.kr/2024/10/30/551b5e4b-8339-44a8-8578-80102485d996.jpg?w=728",
    caption: "Kep1er"
  },
  {
    src: "https://www.nme.com/wp-content/uploads/2024/11/NME-HERO-KISS-OF-LIFE-CREDIT-AHN-HONGJE@2560x1625-2136x1356.jpg",
    caption: "Kiss of Life"
  },
  {
    src: "https://mediaproxy.tvtropes.org/width/1200/https://static.tvtropes.org/pmwiki/pub/images/1718750010_header_photo.jpg",
    caption: "Mamamoo"
  },
  {
    src: "https://cassette.sphdigital.com.sg/image/straitstimes/666e2ba701fba9f0249cd2e51ec4d63bd1d334216d7091e6223c4102b5c1ec5d",
    caption: "BABYMONSTER"
  },
  {
    src: "https://assets.teenvogue.com/photos/6a8c42d8a80ddb941c41b72e/4:3/w_3600,h_2700,c_limit/WE%20PLAY_TUIDE%2004.jpg",
    caption: "Tuide"
  },
  {
    src: "https://thebiaslist.com/wp-content/uploads/2022/03/red-velvet-feel-my-rhythm.jpg",
    caption: "Red Velvet"
  },
  {
    src: "https://www.hollywoodreporter.com/wp-content/uploads/2026/02/H2H.jpg?w=2000&h=1126&crop=1",
    caption: "Hearts2Hearts"
  },
  {
    src: "https://www.nme.com/wp-content/uploads/2025/07/rescene-dearest-interview-credit-the-muze-entertainment-image1.jpg",
    caption: "RESCENE"
  },
  {
    src: "https://cdn.kpopping.com/kpics/2026/06/1782501476588-jo2gpd-0.jpg",
    caption: "Baby Don't Cry"
  },
  {
    src: "https://www.katseye.world/wp-content/uploads/sites/2863/2024/06/06.25.Katseye_slide01-compressed.jpg",
    caption: "Katseye"
  },
    {
    src: "https://biasroomcdn.com/no-watermarked/haerisk/uploads/260818_kiiikiii_twitter_update_mszbmmlo_j146f9.jpg",
    caption: "KiiiKiii"
  }
];

// -------------------------
//helper functions
// -------------------------
function addImage({ src, caption }) {
  const figure = document.createElement("figure");
  figure.className = "gallery-item";

  const img = document.createElement("img");
  img.src = src;
  img.alt = caption;

  const figcaption = document.createElement("figcaption");
  figcaption.textContent = caption;

  figure.appendChild(img);
  figure.appendChild(figcaption);
  gallery.appendChild(figure);
}

function updateSlideWidth() {
  const firstSlide = gallery.querySelector(".gallery-item");
  if (!firstSlide) return;

  const style = getComputedStyle(firstSlide);
  const marginRight = parseFloat(style.marginRight) || 0;
  const marginLeft = parseFloat(style.marginLeft) || 0;

  slideWidth = firstSlide.offsetWidth + marginLeft + marginRight;

  const wrapper = gallery.parentElement;
  wrapperWidth = wrapper.getBoundingClientRect().width;
}

function getTranslateXForIndex(i) {
  return i * slideWidth - wrapperWidth / 2 + slideWidth / 2;
}


// -------------------------
//carousel initialization
// -------------------------
function initCarousel() {
  gallery.innerHTML = "";

  images.slice(-CLONE_COUNT).forEach(addImage);
  images.forEach(addImage);
  images.slice(0, CLONE_COUNT).forEach(addImage);

  requestAnimationFrame(() => {
    updateSlideWidth();

    index = CLONE_COUNT;

    gallery.style.transition = "none";
    gallery.style.transform =
      `translateX(-${getTranslateXForIndex(index)}px)`;

    updateActiveClass();
  });
}


initCarousel();

// -------------------------
//carousel movement function
// -------------------------
function move(direction) {
  if (isMoving) return;
  isMoving = true;

  index += direction;

  gallery.style.transition = "transform 0.3s ease-in-out";
  gallery.style.transform =
    `translateX(-${getTranslateXForIndex(index)}px)`;

  updateActiveClass();
}

// -------------------------
//function handling image transition
// -------------------------
gallery.addEventListener("transitionend", () => {
  const total = images.length;

  // wrapped past END
  if (index >= total + CLONE_COUNT) {
    index = CLONE_COUNT;
  }

  // wrapped past START
  if (index < CLONE_COUNT) {
    index = total + CLONE_COUNT - 1;
  }
  
  gallery.style.transition = "none";
  gallery.style.transform = `translateX(-${getTranslateXForIndex(index)}px)`;

  // ✅ update highlighting after reset
  activeIndex = (index - CLONE_COUNT + total) % total;
  updateActiveClass();

  isMoving = false;
});


// -------------------------
//updates the active image in the carousel
// -------------------------
function updateActiveClass() {
  const items = gallery.querySelectorAll(".gallery-item");

  items.forEach(el => el.classList.remove("active"));

  const activeItem = items[index];
  if (activeItem) activeItem.classList.add("active");
}


// -------------------------
//listeners for button clicking in carousel
// -------------------------
rightArrow.addEventListener("click", () => move(1));
leftArrow.addEventListener("click", () => move(-1));

// -------------------------
//change image sizes based on which image is active in the carousel
// -------------------------
window.addEventListener("resize", () => {
  updateSlideWidth();

  gallery.style.transition = "none";
  gallery.style.transform =
    `translateX(-${getTranslateXForIndex(index)}px)`;
});
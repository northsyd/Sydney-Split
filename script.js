const SUPABASE_URL = "https://sznrntmaboezpwtiikfx.supabase.co";
const SUPABASE_KEY = "sb_publishable_1N2eQRZ3sP8gQefc7BLF-g_QtBxm01e";

const SYDNEY_BOUNDS = [
  [-34.25, 150.55],
  [-33.35, 151.45]
];

const sampleBoundaries = [
  [
    [-33.55, 151.03],
    [-33.67, 151.04],
    [-33.78, 151.05],
    [-33.88, 151.08],
    [-33.98, 151.10],
    [-34.09, 151.12],
    [-34.20, 151.14]
  ],
  [
    [-33.50, 151.15],
    [-33.63, 151.14],
    [-33.75, 151.15],
    [-33.87, 151.16],
    [-33.99, 151.18],
    [-34.10, 151.19],
    [-34.21, 151.20]
  ],
  [
    [-33.52, 150.92],
    [-33.64, 150.94],
    [-33.76, 150.96],
    [-33.88, 150.98],
    [-34.00, 151.00],
    [-34.11, 151.02],
    [-34.22, 151.04]
  ],
  [
    [-33.60, 151.22],
    [-33.70, 151.21],
    [-33.81, 151.20],
    [-33.91, 151.21],
    [-34.02, 151.23],
    [-34.12, 151.25],
    [-34.22, 151.26]
  ]
];

let map;
let resultMap;

let drawnLine = null;
let drawnPoints = [];
let pointMarkers = [];

const $ = (id) => document.getElementById(id);


/* -------------------------
   INITIALISE MAP
------------------------- */

function initMap() {

  map = L.map("map", {
    zoomControl: true,
    minZoom: 9,
    maxZoom: 16
  }).fitBounds(SYDNEY_BOUNDS);


  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors"
    }
  ).addTo(map);


  map.on("click", handleMapClick);
}


/* -------------------------
   ADD A POINT
------------------------- */

function handleMapClick(e) {

  drawnPoints.push([
    e.latlng.lat,
    e.latlng.lng
  ]);


  const marker = L.circleMarker(e.latlng, {
    radius: 5,
    weight: 2,
    color: "#101114",
    fillColor: "#ffffff",
    fillOpacity: 1
  }).addTo(map);


  pointMarkers.push(marker);


  if (drawnLine) {
    map.removeLayer(drawnLine);
  }


  drawnLine = L.polyline(
    drawnPoints,
    {
      color: "#e83d24",
      weight: 5,
      opacity: 0.95,
      lineCap: "round",
      lineJoin: "round"
    }
  ).addTo(map);


  updateControls();
}


/* -------------------------
   UPDATE BUTTONS / COUNTER
------------------------- */

function updateControls() {

  $("pointCount").textContent =
    drawnPoints.length;


  $("undoBtn").disabled =
    drawnPoints.length === 0;


  $("clearBtn").disabled =
    drawnPoints.length === 0;


  $("submitBtn").disabled =
    drawnPoints.length < 2;
}


/* -------------------------
   CLEAR EVERYTHING
------------------------- */

function clearDrawing() {

  drawnPoints = [];


  pointMarkers.forEach((marker) => {
    map.removeLayer(marker);
  });


  pointMarkers = [];


  if (drawnLine) {
    map.removeLayer(drawnLine);

    drawnLine = null;
  }


  updateControls();
}


/* -------------------------
   UNDO LAST POINT
------------------------- */

function undoPoint() {

  if (drawnPoints.length === 0) {
    return;
  }


  drawnPoints.pop();


  const marker = pointMarkers.pop();

  if (marker) {
    map.removeLayer(marker);
  }


  if (drawnLine) {
    map.removeLayer(drawnLine);
  }


  if (drawnPoints.length > 0) {

    drawnLine = L.polyline(
      drawnPoints,
      {
        color: "#e83d24",
        weight: 5,
        opacity: 0.95,
        lineCap: "round",
        lineJoin: "round"
      }
    ).addTo(map);

  } else {

    drawnLine = null;

  }


  updateControls();
}


/* -------------------------
   SHOW DRAWING SECTION
------------------------- */

function showDrawingSection() {

  $("drawSection").classList.remove("hidden");

  $("resultSection").classList.add("hidden");


  setTimeout(() => {

    if (!map) {
      initMap();
    } else {
      map.invalidateSize();
    }


    $("drawSection").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }, 50);
}


/* -------------------------
   RESULTS MAP
------------------------- */

function renderResults() {

  $("drawSection").classList.add("hidden");

  $("resultSection").classList.remove("hidden");


  setTimeout(() => {

    if (!resultMap) {

      resultMap = L.map(
        "resultMap",
        {
          zoomControl: true,
          minZoom: 9,
          maxZoom: 16
        }
      ).fitBounds(SYDNEY_BOUNDS);


      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap contributors"
        }
      ).addTo(resultMap);


      /*
        SAMPLE BOUNDARIES

        These are just placeholders so we can
        see what the final visualiser might look like.
      */

      sampleBoundaries.forEach((points) => {

        L.polyline(
          points,
          {
            color: "#101114",
            weight: 3,
            opacity: 0.22,
            lineCap: "round",
            lineJoin: "round"
          }
        ).addTo(resultMap);

      });

    } else {

      resultMap.invalidateSize();

    }


    /*
      YOUR BOUNDARY
    */

    L.polyline(
      drawnPoints,
      {
        color: "#e83d24",
        weight: 6,
        opacity: 1,
        lineCap: "round",
        lineJoin: "round"
      }
    ).addTo(resultMap);


    /*
      YOUR POINTS
    */

    drawnPoints.forEach((point) => {

      L.circleMarker(
        point,
        {
          radius: 4,
          weight: 1,
          color: "#e83d24",
          fillColor: "#ffffff",
          fillOpacity: 1
        }
      ).addTo(resultMap);

    });


    $("resultSection").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }, 50);
}

async function submitBoundary() {

  if (drawnPoints.length < 2) {
    return;
  }

  const submitButton = $("submitBtn");

  submitButton.disabled = true;
  submitButton.textContent = "SUBMITTING…";


  try {

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/responses`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Prefer": "return=minimal"
        },

        body: JSON.stringify({
          boundary: drawnPoints
        })
      }
    );


    if (!response.ok) {

      const errorText = await response.text();

      console.error(
        "Supabase submission failed:",
        errorText
      );

      throw new Error(
        "Submission failed"
      );
    }


    submitButton.textContent = "SUBMITTED ✓";

    setTimeout(() => {
      renderResults();
    }, 500);


  } catch (error) {

    console.error(error);

    alert(
      "Something went wrong submitting your boundary. Please try again."
    );

    submitButton.disabled = false;
    submitButton.textContent = "SUBMIT BOUNDARY →";
  }
}

/* -------------------------
   BUTTONS
------------------------- */

$("startBtn").addEventListener(
  "click",
  showDrawingSection
);


$("undoBtn").addEventListener(
  "click",
  undoPoint
);


$("clearBtn").addEventListener(
  "click",
  clearDrawing
);


$("submitBtn").addEventListener(
  "click",
  submitBoundary
);

$("againBtn").addEventListener(
  "click",
  () => {

    clearDrawing();

    showDrawingSection();

  }
);

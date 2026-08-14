const SUPABASE_URL = "https://sznrntmaboezpwtiikfx.supabase.co";
const SUPABASE_KEY = "[YOUR_PUBLISHABLE_KEY]";

const SYDNEY_BOUNDS = [
  [-34.25, 150.55],
  [-33.35, 151.45]
];

let map = null;
let resultMap = null;

let drawnPoints = [];
let drawnLine = null;
let pointMarkers = [];

const $ = (id) => document.getElementById(id);


/* =========================================================
   MAP
========================================================= */

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


/* =========================================================
   DRAWING
========================================================= */

function handleMapClick(event) {

  drawnPoints.push([
    event.latlng.lat,
    event.latlng.lng
  ]);

  const marker = L.circleMarker(
    event.latlng,
    {
      radius: 5,
      weight: 2,
      color: "#101114",
      fillColor: "#ffffff",
      fillOpacity: 1
    }
  ).addTo(map);

  pointMarkers.push(marker);

  redrawUserLine();

  updateControls();
}


function redrawUserLine() {

  if (drawnLine) {
    map.removeLayer(drawnLine);
    drawnLine = null;
  }

  if (drawnPoints.length < 2) {
    return;
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
}


function updateControls() {

  $("pointCount").textContent = drawnPoints.length;

  $("undoBtn").disabled =
    drawnPoints.length === 0;

  $("clearBtn").disabled =
    drawnPoints.length === 0;

  $("submitBtn").disabled =
    drawnPoints.length < 2;
}


/* =========================================================
   UNDO
========================================================= */

function undoPoint() {

  if (drawnPoints.length === 0) {
    return;
  }

  drawnPoints.pop();

  const marker = pointMarkers.pop();

  if (marker) {
    map.removeLayer(marker);
  }

  redrawUserLine();

  updateControls();
}


/* =========================================================
   CLEAR
========================================================= */

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


/* =========================================================
   SHOW DRAWING SCREEN
========================================================= */

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

  }, 100);
}


/* =========================================================
   SUPABASE — LOAD SUBMISSIONS
========================================================= */

async function loadLiveBoundaries() {

  const endpoint =
    `${SUPABASE_URL}/rest/v1/responses?select=boundary`;

  console.log(
    "Loading live boundaries from:",
    endpoint
  );

  try {

    const response = await fetch(
      endpoint,
      {
        method: "GET",

        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Accept": "application/json"
        }
      }
    );

    const responseText =
      await response.text();

    console.log(
      "Live results response:",
      response.status,
      responseText
    );

    if (!response.ok) {

      throw new Error(
        `Supabase returned ${response.status}: ${responseText}`
      );

    }

    return JSON.parse(responseText);

  } catch (error) {

    console.error(
      "Could not load live boundaries:",
      error
    );

    return [];
  }
}


/* =========================================================
   RESULTS MAP
========================================================= */

async function renderResults() {

  $("drawSection").classList.add("hidden");

  $("resultSection").classList.remove("hidden");

  setTimeout(async () => {

    /*
      CREATE RESULTS MAP
    */

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

    } else {

      resultMap.invalidateSize();

    }


    /*
      LOAD REAL SUBMISSIONS
    */

    const boundaries =
      await loadLiveBoundaries();


    console.log(
      "Boundaries loaded:",
      boundaries.length
    );


    /*
      DRAW ALL SUBMISSIONS
    */

    boundaries.forEach((submission) => {

      if (
        !submission.boundary ||
        submission.boundary.length < 2
      ) {
        return;
      }

      L.polyline(
        submission.boundary,
        {
          color: "#101114",
          weight: 2,
          opacity: 0.18,
          lineCap: "round",
          lineJoin: "round"
        }
      ).addTo(resultMap);

    });


    /*
      DRAW CURRENT USER'S BOUNDARY
    */

    if (drawnPoints.length >= 2) {

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
    }


    /*
      RESPONSE COUNT
    */

    if ($("resultTitle")) {

      $("resultTitle").textContent =
        `${boundaries.length} Sydney Split ${
          boundaries.length === 1
            ? "response"
            : "responses"
        }`;

    }


    /*
      SCROLL TO RESULTS
    */

    $("resultSection").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }, 100);
}


/* =========================================================
   SUPABASE — SUBMIT
========================================================= */

async function submitBoundary() {

  if (drawnPoints.length < 2) {
    return;
  }

  const submitButton =
    $("submitBtn");

  submitButton.disabled = true;

  submitButton.textContent =
    "SUBMITTING…";


  const endpoint =
    `${SUPABASE_URL}/rest/v1/responses`;

  console.log(
    "Submitting to:",
    endpoint
  );


  try {

    const response = await fetch(
      endpoint,
      {
        method: "POST",

        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Prefer": "return=minimal"
        },

        body: JSON.stringify({
          boundary: drawnPoints
        })
      }
    );


    const responseText =
      await response.text();


    console.log(
      "Supabase response:",
      response.status,
      responseText
    );


    if (!response.ok) {

      throw new Error(
        `Supabase returned ${response.status}: ${responseText}`
      );

    }


    submitButton.textContent =
      "SUBMITTED ✓";


    setTimeout(() => {
      renderResults();
    }, 500);


  } catch (error) {

    console.error(
      "Supabase submission failed:",
      error
    );


    alert(
      "Something went wrong submitting your boundary. Check the browser console for details."
    );


    submitButton.disabled = false;

    submitButton.textContent =
      "SUBMIT BOUNDARY →";
  }
}


/* =========================================================
   BUTTONS
========================================================= */

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


/* =========================================================
   INITIAL STATE
========================================================= */

updateControls();

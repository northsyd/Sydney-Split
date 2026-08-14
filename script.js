const SUPABASE_URL =
  "https://sznrntmaboezpwtiikfx.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_1N2eQRZ3sP8gQefc7BLF-g_QtBxm01e";


const SYDNEY_BOUNDS = [
  [-34.25, 150.55],
  [-33.35, 151.45]
];


let map = null;
let resultMap = null;

let drawnPoints = [];
let drawnLine = null;
let pointMarkers = [];

let densityLayer = null;
let boundaryLayers = [];
let myBoundaryLayer = null;
let myPointLayers = [];

let currentView = "all";

let submissions = [];

const $ = (id) =>
  document.getElementById(id);


/* =========================================================
   DRAWING MAP
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
      attribution:
        "&copy; OpenStreetMap contributors"
    }
  ).addTo(map);


  map.on(
    "click",
    handleMapClick
  );
}


/* =========================================================
   DRAWING
========================================================= */

function handleMapClick(event) {

  drawnPoints.push([
    event.latlng.lat,
    event.latlng.lng
  ]);


  const marker =
    L.circleMarker(
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

    map.removeLayer(
      drawnLine
    );

    drawnLine = null;
  }


  if (
    drawnPoints.length < 2
  ) {
    return;
  }


  drawnLine =
    L.polyline(
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

  if ($("pointCount")) {

    $("pointCount").textContent =
      drawnPoints.length;
  }


  if ($("undoBtn")) {

    $("undoBtn").disabled =
      drawnPoints.length === 0;
  }


  if ($("clearBtn")) {

    $("clearBtn").disabled =
      drawnPoints.length === 0;
  }


  if ($("submitBtn")) {

    $("submitBtn").disabled =
      drawnPoints.length < 2;
  }
}


/* =========================================================
   UNDO
========================================================= */

function undoPoint() {

  if (
    drawnPoints.length === 0
  ) {
    return;
  }


  drawnPoints.pop();


  const marker =
    pointMarkers.pop();


  if (marker) {

    map.removeLayer(
      marker
    );
  }


  redrawUserLine();

  updateControls();
}


/* =========================================================
   CLEAR
========================================================= */

function clearDrawing() {

  drawnPoints = [];


  pointMarkers.forEach(
    (marker) => {

      map.removeLayer(
        marker
      );

    }
  );


  pointMarkers = [];


  if (drawnLine) {

    map.removeLayer(
      drawnLine
    );

    drawnLine = null;
  }


  updateControls();
}


/* =========================================================
   DRAWING SECTION
========================================================= */

function showDrawingSection() {

  $("drawSection")
    .classList
    .remove("hidden");


  $("detailsSection")
    .classList
    .add("hidden");


  $("resultSection")
    .classList
    .add("hidden");


  setTimeout(() => {

    if (!map) {

      initMap();

    } else {

      map.invalidateSize();

    }


    $("drawSection")
      .scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

  }, 100);
}


/* =========================================================
   DETAILS
========================================================= */

function showDetails() {

  if (
    drawnPoints.length < 2
  ) {
    return;
  }


  $("drawSection")
    .classList
    .add("hidden");


  $("detailsSection")
    .classList
    .remove("hidden");


  $("resultSection")
    .classList
    .add("hidden");


  $("detailsSection")
    .scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
}


function showDrawingAgain() {

  $("detailsSection")
    .classList
    .add("hidden");


  $("drawSection")
    .classList
    .remove("hidden");


  setTimeout(() => {

    if (map) {
      map.invalidateSize();
    }

    $("drawSection")
      .scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

  }, 100);
}


/* =========================================================
   SUPABASE — LOAD
========================================================= */

async function loadLiveBoundaries() {

  const endpoint =
    `${SUPABASE_URL}/rest/v1/responses?select=*`;


  console.log(
    "Loading live boundaries from:",
    endpoint
  );


  try {

    const response =
      await fetch(
        endpoint,
        {
          method: "GET",

          headers: {
            "apikey":
              SUPABASE_KEY,

            "Authorization":
              `Bearer ${SUPABASE_KEY}`,

            "Accept":
              "application/json"
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


    return JSON.parse(
      responseText
    );

  } catch (error) {

    console.error(
      "Could not load live boundaries:",
      error
    );

    return null;
  }
}


/* =========================================================
   RESULTS VISIBILITY
========================================================= */

function updateResultVisibility() {

  const showLines =
    currentView === "all" ||
    currentView === "lines";


  const showDensity =
    currentView === "all" ||
    currentView === "density";


  const showMine =
    currentView === "all" ||
    currentView === "mine";


  boundaryLayers.forEach(
    (layer) => {

      if (showLines) {

        layer.addTo(
          resultMap
        );

      } else {

        resultMap.removeLayer(
          layer
        );

      }

    }
  );


  if (densityLayer) {

    if (showDensity) {

      densityLayer.addTo(
        resultMap
      );

    } else {

      resultMap.removeLayer(
        densityLayer
      );

    }
  }


  if (myBoundaryLayer) {

    if (showMine) {

      myBoundaryLayer.addTo(
        resultMap
      );

    } else {

      resultMap.removeLayer(
        myBoundaryLayer
      );

    }
  }


  myPointLayers.forEach(
    (layer) => {

      if (showMine) {

        layer.addTo(
          resultMap
        );

      } else {

        resultMap.removeLayer(
          layer
        );

      }

    }
  );
}


/* =========================================================
   FILTER BUTTONS
========================================================= */

function setupFilters() {

  document
    .querySelectorAll(
      ".result-filter"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            currentView =
              button.dataset.view;


            document
              .querySelectorAll(
                ".result-filter"
              )
              .forEach(
                (other) => {

                  other.classList
                    .remove(
                      "active"
                    );

                }
              );


            button.classList
              .add("active");


            updateResultVisibility();
          }
        );

      }
    );
}


/* =========================================================
   RESULTS MAP
========================================================= */

async function renderResults() {

  $("drawSection")
    .classList
    .add("hidden");


  $("detailsSection")
    .classList
    .add("hidden");


  $("resultSection")
    .classList
    .remove("hidden");


  setTimeout(
    async () => {

      if (!resultMap) {

        resultMap =
          L.map(
            "resultMap",
            {
              zoomControl: true,
              minZoom: 9,
              maxZoom: 16
            }
          ).fitBounds(
            SYDNEY_BOUNDS
          );


        L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            maxZoom: 19,
            attribution:
              "&copy; OpenStreetMap contributors"
          }
        ).addTo(
          resultMap
        );

      } else {

        resultMap.invalidateSize();

      }


      /*
        REMOVE OLD LAYERS
      */

      boundaryLayers.forEach(
        (layer) => {

          resultMap.removeLayer(
            layer
          );

        }
      );


      boundaryLayers = [];


      if (densityLayer) {

        resultMap.removeLayer(
          densityLayer
        );

        densityLayer = null;
      }


      if (myBoundaryLayer) {

        resultMap.removeLayer(
          myBoundaryLayer
        );

        myBoundaryLayer = null;
      }


      myPointLayers.forEach(
        (layer) => {

          resultMap.removeLayer(
            layer
          );

        }
      );


      myPointLayers = [];


      /*
        LOAD DATA
      */

      const data =
        await loadLiveBoundaries();


      if (!data) {

        $("resultTitle")
          .textContent =
          "Couldn't load results";


        $("resultDescription")
          .textContent =
          "Something went wrong loading the latest responses. Try refreshing the page.";


        return;
      }


      submissions =
        data;


      /*
        COUNT
      */

      $("resultTitle")
        .textContent =
        `${data.length} Sydney Split ${
          data.length === 1
            ? "response"
            : "responses"
        }`;


      $("resultDescription")
        .textContent =
        "Your boundary is shown in red. Other submissions are anonymous.";


      /*
        DENSITY
      */

      const heatPoints = [];


      /*
        OTHER BOUNDARIES
      */

      data.forEach(
        (submission) => {

          if (
            !submission.boundary ||
            submission.boundary.length < 2
          ) {
            return;
          }


          const layer =
            L.polyline(
              submission.boundary,
              {
                color: "#101114",
                weight: 2,
                opacity: 0.22,
                lineCap: "round",
                lineJoin: "round"
              }
            );


          boundaryLayers.push(
            layer
          );


          submission.boundary
            .forEach(
              (point) => {

                heatPoints.push([
                  point[0],
                  point[1],
                  0.4
                ]);

              }
            );

        }
      );


      /*
        DENSITY LAYER
      */

      if (
        heatPoints.length > 0 &&
        typeof L.heatLayer ===
          "function"
      ) {

        densityLayer =
          L.heatLayer(
            heatPoints,
            {
              radius: 28,
              blur: 22,
              maxZoom: 13,
              minOpacity: 0.22
            }
          );

      }


      /*
        YOUR LINE
      */

      if (
        drawnPoints.length >= 2
      ) {

        myBoundaryLayer =
          L.polyline(
            drawnPoints,
            {
              color: "#e83d24",
              weight: 6,
              opacity: 1,
              lineCap: "round",
              lineJoin: "round"
            }
          );


        drawnPoints.forEach(
          (point) => {

            const marker =
              L.circleMarker(
                point,
                {
                  radius: 4,
                  weight: 1,
                  color: "#e83d24",
                  fillColor: "#ffffff",
                  fillOpacity: 1
                }
              );


            myPointLayers.push(
              marker
            );

          }
        );

      }


      /*
        FILTERS
      */

      currentView =
        "all";


      document
        .querySelectorAll(
          ".result-filter"
        )
        .forEach(
          (button) => {

            button.classList
              .toggle(
                "active",
                button.dataset.view ===
                  "all"
              );

          }
        );


      updateResultVisibility();


      /*
        SCROLL
      */

      $("resultSection")
        .scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

    },
    100
  );
}


/* =========================================================
   SUBMIT
========================================================= */

async function submitBoundary() {

  if (
    drawnPoints.length < 2
  ) {
    return;
  }


  const submitButton =
    $("finalSubmitBtn");


  submitButton.disabled =
    true;


  submitButton.textContent =
    "SUBMITTING…";


  const endpoint =
    `${SUPABASE_URL}/rest/v1/responses`;


  const area =
    $("areaSelect").value;


  const transport =
    $("transportSelect").value;


  const comment =
    $("commentInput").value
      .trim();


  console.log(
    "Submitting to:",
    endpoint
  );


  try {

    const response =
      await fetch(
        endpoint,
        {
          method: "POST",

          headers: {

            "apikey":
              SUPABASE_KEY,

            "Authorization":
              `Bearer ${SUPABASE_KEY}`,

            "Content-Type":
              "application/json",

            "Accept":
              "application/json",

            "Prefer":
              "return=minimal"
          },

          body:
            JSON.stringify({
              boundary:
                drawnPoints,

              area:
                area || null,

              transport:
                transport || null,

              comment:
                comment || null
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


    setTimeout(
      () => {

        renderResults();

      },
      500
    );


  } catch (error) {

    console.error(
      "Supabase submission failed:",
      error
    );


    alert(
      "Something went wrong submitting your response. Check the browser console for details."
    );


    submitButton.disabled =
      false;


    submitButton.textContent =
      "SUBMIT RESPONSE →";
  }
}


/* =========================================================
   RESET
========================================================= */

function startAgain() {

  clearDrawing();


  $("areaSelect").value =
    "";

  $("transportSelect").value =
    "";

  $("commentInput").value =
    "";


  currentView =
    "all";


  $("resultSection")
    .classList
    .add("hidden");


  showDrawingSection();
}


/* =========================================================
   BUTTONS
========================================================= */

$("startBtn")
  .addEventListener(
    "click",
    showDrawingSection
  );


$("undoBtn")
  .addEventListener(
    "click",
    undoPoint
  );


$("clearBtn")
  .addEventListener(
    "click",
    clearDrawing
  );


$("submitBtn")
  .addEventListener(
    "click",
    showDetails
  );


$("backBtn")
  .addEventListener(
    "click",
    showDrawingAgain
  );


$("finalSubmitBtn")
  .addEventListener(
    "click",
    submitBoundary
  );


$("againBtn")
  .addEventListener(
    "click",
    startAgain
  );


/* =========================================================
   START
========================================================= */

setupFilters();

updateControls();

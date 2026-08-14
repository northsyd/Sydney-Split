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

let submissions = [];

let responseLayers = [];
let densityLayers = [];

let myBoundaryLayer = null;
let myPointLayers = [];

let currentArea = "all";
let currentTransport = "all";
let currentView = "all";


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


  redrawDrawing();
  updateControls();
}


function redrawDrawing() {

  if (drawnLine) {

    map.removeLayer(
      drawnLine
    );

    drawnLine = null;
  }


  if (drawnPoints.length < 2) {
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


/* =========================================================
   CONTROLS
========================================================= */

function updateControls() {

  if ($("pointCount")) {

    $("pointCount")
      .textContent =
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


  redrawDrawing();
  updateControls();
}


/* =========================================================
   CLEAR
========================================================= */

function clearDrawing() {

  drawnPoints = [];


  pointMarkers.forEach(
    (marker) => {

      if (map) {

        map.removeLayer(
          marker
        );
      }

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

  if ($("drawSection")) {

    $("drawSection")
      .classList
      .remove("hidden");
  }


  if ($("resultSection")) {

    $("resultSection")
      .classList
      .add("hidden");
  }


  if ($("detailsSection")) {

    $("detailsSection")
      .classList
      .add("hidden");
  }


  setTimeout(() => {

    if (!map) {

      initMap();

    } else {

      map.invalidateSize();
    }


    if ($("drawSection")) {

      $("drawSection")
        .scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
    }

  }, 100);
}


/* =========================================================
   OPTIONAL DETAILS SECTION
========================================================= */

function showDetails() {

  if (
    drawnPoints.length < 2
  ) {
    return;
  }


  if (
    !$("detailsSection")
  ) {

    submitBoundary();
    return;
  }


  if ($("drawSection")) {

    $("drawSection")
      .classList
      .add("hidden");
  }


  $("detailsSection")
    .classList
    .remove("hidden");


  if ($("resultSection")) {

    $("resultSection")
      .classList
      .add("hidden");
  }


  $("detailsSection")
    .scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
}


/* =========================================================
   SUPABASE — LOAD
========================================================= */

async function loadLiveBoundaries() {

  const endpoint =
    `${SUPABASE_URL}/rest/v1/responses?select=*`;


  console.log(
    "Loading responses:",
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
      "Results response:",
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
      "Could not load responses:",
      error
    );


    return [];
  }
}


/* =========================================================
   DEMOGRAPHIC FILTERS
========================================================= */

function createDemographicFilters() {

  if (
    $("demographicFilters")
  ) {
    return;
  }


  const resultsMapWrap =
    document.querySelector(
      ".result-map-wrap"
    );


  if (!resultsMapWrap) {
    return;
  }


  const filterBox =
    document.createElement(
      "div"
    );


  filterBox.id =
    "demographicFilters";


  filterBox.innerHTML = `

    <div class="demographic-filter-heading">
      FILTER RESPONSES
    </div>

    <div class="demographic-filter-row">

      <label>

        AREA

        <select id="areaFilter">

          <option value="all">
            Everyone
          </option>

          <option value="eastern">
            Eastern Sydney
          </option>

          <option value="inner">
            Inner Sydney
          </option>

          <option value="northern">
            Northern Sydney
          </option>

          <option value="western">
            Western Sydney
          </option>

          <option value="southern">
            Southern Sydney
          </option>

          <option value="other">
            Somewhere else in Sydney
          </option>

          <option value="prefer-not">
            Prefer not to say
          </option>

        </select>

      </label>


      <label>

        TRANSPORT

        <select id="transportFilter">

          <option value="all">
            Everyone
          </option>

          <option value="train">
            Train / Metro
          </option>

          <option value="bus">
            Bus
          </option>

          <option value="light-rail">
            Light rail
          </option>

          <option value="ferry">
            Ferry
          </option>

          <option value="car">
            Car
          </option>

          <option value="walking">
            Walking
          </option>

          <option value="cycling">
            Cycling
          </option>

          <option value="mixed">
            Mixed / varies
          </option>

          <option value="prefer-not">
            Prefer not to say
          </option>

        </select>

      </label>

    </div>
  `;


  resultsMapWrap.parentNode.insertBefore(
    filterBox,
    resultsMapWrap
  );


  $("areaFilter")
    .addEventListener(
      "change",
      (event) => {

        currentArea =
          event.target.value;

        renderFilteredResults();
      }
    );


  $("transportFilter")
    .addEventListener(
      "change",
      (event) => {

        currentTransport =
          event.target.value;

        renderFilteredResults();
      }
    );
}


/* =========================================================
   MAP VIEW BUTTONS
========================================================= */

function createMapViewControls() {

  if (
    $("resultFilters")
  ) {
    return;
  }


  const resultsMapWrap =
    document.querySelector(
      ".result-map-wrap"
    );


  if (!resultsMapWrap) {
    return;
  }


  const box =
    document.createElement(
      "div"
    );


  box.id =
    "resultFilters";


  box.innerHTML = `

    <div class="result-filter-label">
      MAP VIEW
    </div>

    <div class="result-filter-buttons">

      <button
        class="result-filter active"
        data-view="all"
        type="button"
      >
        ALL
      </button>

      <button
        class="result-filter"
        data-view="density"
        type="button"
      >
        DENSITY
      </button>

      <button
        class="result-filter"
        data-view="lines"
        type="button"
      >
        LINES
      </button>

      <button
        class="result-filter"
        data-view="mine"
        type="button"
      >
        YOUR LINE
      </button>

    </div>
  `;


  resultsMapWrap.parentNode.insertBefore(
    box,
    resultsMapWrap
  );


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

                  other.classList.toggle(
                    "active",
                    other === button
                  );

                }
              );


            updateResultVisibility();
          }
        );

      }
    );
}


/* =========================================================
   FILTER DATA
========================================================= */

function getFilteredSubmissions() {

  return submissions.filter(
    (submission) => {

      const area =
        submission.area ||
        "";


      const transport =
        submission.transport ||
        "";


      const areaMatches =
        currentArea === "all" ||
        area === currentArea;


      const transportMatches =
        currentTransport === "all" ||
        transport === currentTransport;


      return (
        areaMatches &&
        transportMatches
      );
    }
  );
}


/* =========================================================
   RESULT TITLE
========================================================= */

function updateResultTitle(
  filtered
) {

  if (!$("resultTitle")) {
    return;
  }


  let title =
    `${filtered.length} Sydney Split `;


  title +=
    filtered.length === 1
      ? "response"
      : "responses";


  $("resultTitle")
    .textContent =
    title;
}


/* =========================================================
   REMOVE RESULT LAYERS
========================================================= */

function removeResultLayers() {

  responseLayers.forEach(
    (layer) => {

      resultMap.removeLayer(
        layer
      );

    }
  );


  responseLayers = [];


  densityLayers.forEach(
    (layer) => {

      resultMap.removeLayer(
        layer
      );

    }
  );


  densityLayers = [];
}


/* =========================================================
   BUILD RESULT LAYERS
========================================================= */

function buildResultLayers() {

  removeResultLayers();


  const filtered =
    getFilteredSubmissions();


  filtered.forEach(
    (submission) => {

      if (
        !Array.isArray(
          submission.boundary
        )
      ) {
        return;
      }


      if (
        submission.boundary.length < 2
      ) {
        return;
      }


      /*
        NORMAL LINE
      */

      const line =
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


      responseLayers.push(
        line
      );


      /*
        SIMPLE DENSITY VISUALISATION

        Instead of needing another plugin,
        we draw faint circles at every
        submitted point.
      */

      submission.boundary.forEach(
        (point) => {

          const circle =
            L.circle(
              point,
              {
                radius: 900,
                stroke: false,
                fillColor: "#e83d24",
                fillOpacity: 0.035
              }
            );


          densityLayers.push(
            circle
          );

        }
      );

    }
  );


  updateResultTitle(
    filtered
  );
}


/* =========================================================
   SHOW / HIDE MAP LAYERS
========================================================= */

function updateResultVisibility() {

  if (!resultMap) {
    return;
  }


  const showLines =
    currentView === "all" ||
    currentView === "lines";


  const showDensity =
    currentView === "all" ||
    currentView === "density";


  const showMine =
    currentView === "all" ||
    currentView === "mine";


  /*
    OTHER RESPONSE LINES
  */

  responseLayers.forEach(
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


  /*
    DENSITY
  */

  densityLayers.forEach(
    (layer) => {

      if (showDensity) {

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


  /*
    YOUR LINE
  */

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
   RENDER FILTERED RESULTS
========================================================= */

function renderFilteredResults() {

  if (!resultMap) {
    return;
  }


  buildResultLayers();


  updateResultVisibility();
}


/* =========================================================
   CREATE YOUR LINE
========================================================= */

function createMyLine() {

  /*
    Remove old version
  */

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


  if (
    drawnPoints.length < 2
  ) {
    return;
  }


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


/* =========================================================
   RESULTS PAGE
========================================================= */

async function renderResults() {

  if ($("drawSection")) {

    $("drawSection")
      .classList
      .add("hidden");
  }


  if ($("detailsSection")) {

    $("detailsSection")
      .classList
      .add("hidden");
  }


  if ($("resultSection")) {

    $("resultSection")
      .classList
      .remove("hidden");
  }


  setTimeout(
    async () => {

      /*
        CREATE RESULT MAP
      */

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
        LOAD DATA
      */

      submissions =
        await loadLiveBoundaries();


      /*
        FILTER CONTROLS
      */

      createDemographicFilters();

      createMapViewControls();


      /*
        RESET FILTERS
      */

      currentArea =
        "all";

      currentTransport =
        "all";

      currentView =
        "all";


      if ($("areaFilter")) {

        $("areaFilter").value =
          "all";
      }


      if ($("transportFilter")) {

        $("transportFilter").value =
          "all";
      }


      document
        .querySelectorAll(
          ".result-filter"
        )
        .forEach(
          (button) => {

            button.classList.toggle(
              "active",
              button.dataset.view ===
                "all"
            );

          }
        );


      /*
        CREATE USER LINE
      */

      createMyLine();


      /*
        DRAW RESULTS
      */

      renderFilteredResults();


      /*
        SCROLL
      */

      if ($("resultSection")) {

        $("resultSection")
          .scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
      }

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
    $("finalSubmitBtn") ||
    $("submitBtn");


  if (submitButton) {

    submitButton.disabled =
      true;

    submitButton.textContent =
      "SUBMITTING…";
  }


  const endpoint =
    `${SUPABASE_URL}/rest/v1/responses`;


  /*
    Optional demographic info
  */

  const areaElement =
    $("areaSelect");


  const transportElement =
    $("transportSelect");


  const commentElement =
    $("commentInput");


  const area =
    areaElement
      ? areaElement.value
      : null;


  const transport =
    transportElement
      ? transportElement.value
      : null;


  const comment =
    commentElement
      ? commentElement.value.trim()
      : null;


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


    if (submitButton) {

      submitButton.textContent =
        "SUBMITTED ✓";
    }


    setTimeout(
      renderResults,
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


    if (submitButton) {

      submitButton.disabled =
        false;

      submitButton.textContent =
        "SUBMIT RESPONSE →";
    }
  }
}


/* =========================================================
   AGAIN
========================================================= */

function startAgain() {

  clearDrawing();


  if ($("areaSelect")) {

    $("areaSelect").value =
      "";
  }


  if ($("transportSelect")) {

    $("transportSelect").value =
      "";
  }


  if ($("commentInput")) {

    $("commentInput").value =
      "";
  }


  if ($("resultSection")) {

    $("resultSection")
      .classList
      .add("hidden");
  }


  showDrawingSection();
}


/* =========================================================
   BUTTON EVENTS
========================================================= */

if ($("startBtn")) {

  $("startBtn")
    .addEventListener(
      "click",
      showDrawingSection
    );
}


if ($("undoBtn")) {

  $("undoBtn")
    .addEventListener(
      "click",
      undoPoint
    );
}


if ($("clearBtn")) {

  $("clearBtn")
    .addEventListener(
      "click",
      clearDrawing
    );
}


if ($("submitBtn")) {

  $("submitBtn")
    .addEventListener(
      "click",
      showDetails
    );
}


if ($("finalSubmitBtn")) {

  $("finalSubmitBtn")
    .addEventListener(
      "click",
      submitBoundary
    );
}


if ($("againBtn")) {

  $("againBtn")
    .addEventListener(
      "click",
      startAgain
    );
}


if ($("backBtn")) {

  $("backBtn")
    .addEventListener(
      "click",
      showDrawingSection
    );
}


/* =========================================================
   INITIALISE
========================================================= */

updateControls();

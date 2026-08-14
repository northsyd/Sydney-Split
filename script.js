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


/* =====================================================
   DRAWING MAP
===================================================== */

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


/* =====================================================
   DRAWING
===================================================== */

function handleMapClick(e) {

  drawnPoints.push([
    e.latlng.lat,
    e.latlng.lng
  ]);


  const marker =
    L.circleMarker(
      e.latlng,
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


/* =====================================================
   CONTROLS
===================================================== */

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


/* =====================================================
   CLEAR / UNDO
===================================================== */

function clearDrawing() {

  drawnPoints = [];


  pointMarkers.forEach(
    marker => {

      if (map) {
        map.removeLayer(marker);
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


/* =====================================================
   SECTIONS
===================================================== */

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


/* =====================================================
   LOAD SUPABASE RESPONSES
===================================================== */

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


    const text =
      await response.text();


    console.log(
      "Results response:",
      response.status,
      text
    );


    if (!response.ok) {

      throw new Error(
        text
      );
    }


    return JSON.parse(text);

  } catch (error) {

    console.error(
      "Could not load responses:",
      error
    );


    return [];
  }
}


/* =====================================================
   DEMOGRAPHIC FILTERS
===================================================== */

function createDemographicFilters() {

  const container =
    $("demographicFilters");


  if (!container) {
    return;
  }


  container.innerHTML = `

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


  $("areaFilter")
    .addEventListener(
      "change",
      e => {

        currentArea =
          e.target.value;

        renderFilteredResults();
      }
    );


  $("transportFilter")
    .addEventListener(
      "change",
      e => {

        currentTransport =
          e.target.value;

        renderFilteredResults();
      }
    );
}


/* =====================================================
   MAP VIEW
===================================================== */

function createMapViewControls() {

  const container =
    $("resultFilters");


  if (!container) {
    return;
  }


  container.innerHTML = `

    <div class="result-filter-label">
      MAP VIEW
    </div>

    <div class="result-filter-buttons">

      <button
        type="button"
        class="result-filter active"
        data-view="all"
      >
        ALL
      </button>

      <button
        type="button"
        class="result-filter"
        data-view="density"
      >
        DENSITY
      </button>

      <button
        type="button"
        class="result-filter"
        data-view="lines"
      >
        LINES
      </button>

      <button
        type="button"
        class="result-filter"
        data-view="mine"
      >
        YOUR LINE
      </button>

    </div>
  `;


  container
    .querySelectorAll(
      ".result-filter"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          currentView =
            button.dataset.view;


          container
            .querySelectorAll(
              ".result-filter"
            )
            .forEach(
              other =>
                other.classList.toggle(
                  "active",
                  other === button
                )
            );


          updateResultVisibility();
        }
      );

    });
}


/* =====================================================
   FILTER
===================================================== */

function getFilteredSubmissions() {

  return submissions.filter(
    submission => {

      const area =
        submission.area || "";


      const transport =
        submission.transport || "";


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


/* =====================================================
   RESULT TITLE
===================================================== */

function updateResultTitle(
  filtered
) {

  $("resultTitle")
    .textContent =
    `${filtered.length} Sydney Split ${
      filtered.length === 1
        ? "response"
        : "responses"
    }`;
}


/* =====================================================
   REMOVE LAYERS
===================================================== */

function clearResultLayers() {

  responseLayers.forEach(
    layer =>
      resultMap.removeLayer(
        layer
      )
  );


  densityLayers.forEach(
    layer =>
      resultMap.removeLayer(
        layer
      )
  );


  responseLayers = [];
  densityLayers = [];
}


/* =====================================================
   BUILD RESULT LAYERS
===================================================== */

function buildResultLayers() {

  clearResultLayers();


  const filtered =
    getFilteredSubmissions();


  filtered.forEach(
    submission => {

      if (
        !Array.isArray(
          submission.boundary
        ) ||
        submission.boundary.length < 2
      ) {
        return;
      }


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


      submission.boundary.forEach(
        point => {

          const circle =
            L.circle(
              point,
              {
                radius: 850,
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


/* =====================================================
   YOUR BOUNDARY
===================================================== */

function createMyLine() {

  if (myBoundaryLayer) {

    resultMap.removeLayer(
      myBoundaryLayer
    );
  }


  myPointLayers.forEach(
    layer =>
      resultMap.removeLayer(
        layer
      )
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
        opacity: 1
      }
    );


  drawnPoints.forEach(
    point => {

      myPointLayers.push(
        L.circleMarker(
          point,
          {
            radius: 4,
            weight: 1,
            color: "#e83d24",
            fillColor: "#ffffff",
            fillOpacity: 1
          }
        )
      );

    }
  );
}


/* =====================================================
   VISIBILITY
===================================================== */

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


  responseLayers.forEach(
    layer => {

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


  densityLayers.forEach(
    layer => {

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
    layer => {

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


/* =====================================================
   FILTERED RESULTS
===================================================== */

function renderFilteredResults() {

  buildResultLayers();

  updateResultVisibility();
}


/* =====================================================
   RESULTS PAGE
===================================================== */

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


      submissions =
        await loadLiveBoundaries();


      currentArea =
        "all";

      currentTransport =
        "all";

      currentView =
        "all";


      createDemographicFilters();

      createMapViewControls();

      createMyLine();

      renderFilteredResults();


      $("resultSection")
        .scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

    },
    100
  );
}


/* =====================================================
   SUBMIT
===================================================== */

async function submitBoundary() {

  if (
    drawnPoints.length < 2
  ) {
    return;
  }


  const button =
    $("finalSubmitBtn");


  button.disabled =
    true;

  button.textContent =
    "SUBMITTING…";


  const endpoint =
    `${SUPABASE_URL}/rest/v1/responses`;


  const area =
    $("areaSelect").value;


  const transport =
    $("transportSelect").value;


  const comment =
    $("commentInput").value.trim();


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


    const text =
      await response.text();


    console.log(
      "Supabase response:",
      response.status,
      text
    );


    if (!response.ok) {

      throw new Error(
        text
      );
    }


    button.textContent =
      "SUBMITTED ✓";


    setTimeout(
      renderResults,
      500
    );


  } catch (error) {

    console.error(
      "Submission failed:",
      error
    );


    alert(
      "Something went wrong submitting your response."
    );


    button.disabled =
      false;

    button.textContent =
      "SUBMIT RESPONSE";
  }
}


/* =====================================================
   AGAIN
===================================================== */

function startAgain() {

  clearDrawing();


  $("areaSelect").value =
    "";

  $("transportSelect").value =
    "";

  $("commentInput").value =
    "";


  showDrawingSection();
}


/* =====================================================
   BUTTONS
===================================================== */

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
    showDrawingSection
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


updateControls();

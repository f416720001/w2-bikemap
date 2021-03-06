/* 用這辦法處理手機網址列影響height */
/* https://css-tricks.com/the-trick-to-viewport-units-on-mobile/ */
// First we get the viewport height and we multiple it by 1% to get a value for a vh unit
let vh = window.innerHeight * 0.01;
// Then we set the value in the --vh custom property to the root of the document
document.documentElement.style.setProperty("--vh", `${vh}px`);

var usrLocation = [];

var greenIcon = new L.Icon({
  iconUrl: "./icons/bikePosition-green.svg",
  shadowUrl: "",
  iconSize: [62, 75],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
var grayIcon = new L.Icon({
  iconUrl: "./icons/bikePosition-gray.svg",
  shadowUrl: "",
  iconSize: [62, 75],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
var foodIcon = new L.Icon({
  iconUrl: "./icons/foodmarker.svg",
  shadowUrl: "",
  iconSize: [62, 75],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
var tourIcon = new L.Icon({
  iconUrl: "./icons/tour.svg",
  shadowUrl: "",
  iconSize: [62, 75],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// 地圖宣告
var map = L.map("map", {
  center: [25.045, 121.516],
  zoom: 12,
  zoomControl: false,
  tap: false
});

// 地圖API設定
function GetAuthorizationHeader() {
  let AppID = "69121a1d8f714a5faa4f54c512bb459e";
  let AppKey = "nYALaDjx1Au-PYCnZOnL-InFIZI";

  let GMTString = new Date().toGMTString();
  let ShaObj = new jsSHA("SHA-1", "TEXT");
  ShaObj.setHMACKey(AppKey, "TEXT");
  ShaObj.update("x-date: " + GMTString);
  let HMAC = ShaObj.getHMAC("B64");
  let Authorization =
    'hmac username="' +
    AppID +
    '", algorithm="hmac-sha1", headers="x-date", signature="' +
    HMAC +
    '"';
  return { Authorization: Authorization, "X-Date": GMTString };
}

// 搜尋API設定
var searchOptions = {
  // 定義 EasyAutocomplete 的選取項目來源
  url: function (phrase) {
    return (
      "https://autosuggest.search.hereapi.com/v1/autosuggest?" + // Autosuggest 的 API URL
      "q=" +
      phrase + // 接收使用者輸入的字串做搜尋
      "&limit=5" + // 最多限定五筆回傳
      "&lang=zh_TW" + // 限定台灣正體中文
      "&at=" +
      map.getCenter().lat +
      "," +
      map.getCenter().lng + // 使用目前地圖的中心點作為搜尋起始點
      "&apikey=UoF0AQIZ-nGwU5R3UkPlq3xPxQ7r6gx9XFnuQ476tEo"
    ); // 您的 HERE API KEY
  },
  listLocation: "items", // 使用回傳的 item 作為選取清單
  getValue: "title", // 在選取清單中顯示 title
  list: {
    onClickEvent: function () {
      // 按下選取項目之後的動作
      var data = $("#searchTerm").getSelectedItemData();
      map.flyTo(data.position, 18);
    }
  },
  requestDelay: 500, // 延遲 100 毫秒再送出請求
  placeholder: "今天要去哪兒？" // 預設顯示的字串
};
$("#searchTerm").easyAutocomplete(searchOptions); // 啟用 EasyAutocomplete 到 inpupbox 這個元件

// 圖層 1
// L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
//     attribution: '&copy; <a href="https://2021.thef2e.com/works">我們就是要組隊</a> contributors',
//     minZoom: 1,
//     maxZoom: 19
// }).addTo(map);

// 圖層 2
L.tileLayer(
  "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}",
  {
    attribution:
      '&copy; <a href="https://2021.thef2e.com/users/6296432819610584370?week=2&type=3">我們就是要組隊</a> contributors',
    maxZoom: 18,
    id: "mapbox/streets-v11",
    tileSize: 512,
    zoomOffset: -1,
    accessToken:
      "pk.eyJ1IjoiZjQxNjcyMDAwMSIsImEiOiJja3Z0M204aWk0dWwyMnBtbHcxN2dhZXQ2In0.h-kh_BfN5WhhL0kQdGbqYQ"
  }
).addTo(map);

// 使用 navigator web api 獲取當下位置(經緯度)
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    function (position) {
      const longitude = position.coords.longitude; // 經度
      const latitude = position.coords.latitude; // 緯度

      // 重新設定 view 的位置
      map.setView([latitude, longitude], 13);
      // 將經緯度當作參數傳給 getData 執行
      getStationData(longitude, latitude);
    },
    // 錯誤訊息
    function (e) {
      const msg = e.code;
      const dd = e.message;
      console.error(msg);
      console.error(dd);
    }
  );
}

// 標記 icon
var markers = new L.MarkerClusterGroup().addTo(map).on("click", function (e) {
  sidebar.show();

  // console.log(e);
  // 這邊暴力解，直接card值綁到sidebar上，
  // 但是會出現連續點擊marker，值會出現之前marker上card的值，沒有同步
  // 所以延遲執行function，確保card內的值已經改變
  setTimeout(renderSidebar, 500);
});

function renderSidebar() {
  try {
    document.getElementById("s-title").innerHTML =
      document.getElementById("StationName").innerHTML;
    document.getElementById("s-address").innerHTML =
      document.getElementById("StationAddress").innerHTML;
    document.getElementById("s-AvailableRentBikes").innerHTML =
      document.getElementById("AvailableRentBikes").innerHTML;
    document.getElementById("s-AvailableReturnBikes").innerHTML =
      document.getElementById("AvailableReturnBikes").innerHTML;
  } catch {}
  getFoodData();
  getTourismData();
}

function setMarker(data, type) {
  if (type == "bike") {
    console.log("自行車marker渲染");

    data.forEach((item) => {
      // console.log(item);
      var StationName = item.StationName.Zh_tw.replace("YouBike", "")
        .replace("2.0_", "")
        .replace("1.0_", "");

      if (item.AvailableRentBikes > 0) {
        mask = greenIcon;
        markers.addLayer(
          L.marker(
            [
              item.StationPosition.PositionLat,
              item.StationPosition.PositionLon
            ],
            {
              icon: mask,
              title: StationName
            }
          )
            .bindPopup(
              `<div id="card">
                  <div class="card-body">
                  <h1 class="card-title" id="StationName">${StationName}</h1>
                  <h6 class="card-subtitle mb-2 text-muted" id="StationAddress">${item.StationAddress.Zh_tw}</h6>
                  <p class="card-text mb-0">可租借車數：<span id="AvailableRentBikes">${item.AvailableRentBikes}</span></p>
                  <p class="card-text mt-0">可歸還車數：<span id="AvailableReturnBikes">${item.AvailableReturnBikes}</span></p>
                  <p class="card-text mt-0">更新時間：<span id="UpdateTime">${item.UpdateTime}</span></p>
                  </div>
                </div>`,
              {
                closeButton: false
              }
            )
            .bindTooltip(StationName, {
              permanent: true,
              direction: "center",
              className: "mytooltip"
            })
        );
      } else {
        mask = grayIcon;
        markers.addLayer(
          L.marker(
            [
              item.StationPosition.PositionLat,
              item.StationPosition.PositionLon
            ],
            {
              icon: mask,
              title: StationName
            }
          )
            .bindPopup(
              `<div id="card" class="noBikePopUp">
                抱歉！本站已無車輛租借
                  <div class="card-body" style="display:none;">
                    <h1 class="card-title" id="StationName">${StationName}</h1>
                    <h6 class="card-subtitle mb-2 text-muted" id="StationAddress">${item.StationAddress.Zh_tw}</h6>
                    <p class="card-text mb-0">可租借車數：<span id="AvailableRentBikes">${item.AvailableRentBikes}</span></p>
                    <p class="card-text mt-0">可歸還車數：<span id="AvailableReturnBikes">${item.AvailableReturnBikes}</span></p>
                    <p class="card-text mt-0">更新時間：<span id="UpdateTime">${item.UpdateTime}</span></p>
                  </div>
              </div>`,
              {
                closeButton: false
              }
            )
            .bindTooltip(StationName, {
              permanent: true,
              direction: "center",
              className: "mytooltip"
            })
        );
      }
    });
  } else if (type == "food") {
    console.log("食物marker渲染");

    data.forEach((item) => {
      mask = foodIcon;
      // console.log(item);
      markers.addLayer(
        L.marker([item.lat, item.lng], {
          icon: mask,
          title: item.name
        })
          .bindPopup(
            `<div id="card">
              <div class="card-body">
                <h1 class="card-title" id="StationName">${item.name}</h1>
                <h6 class="card-subtitle mb-2 text-muted" id="StationAddress">${item.add}</h6>
                <p class="card-text mt-0">${item.web}</p>
                <p class="card-text mt-0">${item.tel}</p>
              </div>
            </div>`,
            {
              closeButton: false
            }
          )
          .bindTooltip(item.name, {
            permanent: true,
            direction: "center",
            className: "mytooltip"
          })
      );
    });
  } else if (type == "tourism") {
    console.log("景點marker渲染");

    data.forEach((item) => {
      mask = tourIcon;
      // console.log(item);
      // console.log(item.Position.PositionLat, item.Position.PositionLon);
      markers.addLayer(
        L.marker([item.Position.PositionLat, item.Position.PositionLon], {
          icon: mask,
          title: item.Name
        })
          .bindPopup(
            `<div id="card">
            <div class="card-body">
              <h1 class="card-title" id="StationName">${item.Name}</h1>
              <h6 class="card-subtitle mb-2 text-muted" id="StationAddress">${item.WebsiteUrl}</h6>
              <p class="card-text mb-0">${item.DescriptionDetail}</p>
            </div>
          </div>`,
            {
              closeButton: false
            }
          )
          .bindTooltip(item.Name, {
            permanent: true,
            direction: "center",
            className: "mytooltip"
          })
      );
    });
  }
  map.addLayer(markers);
}

// 串接附近的景點資料
let tourism = [];
function getTourismData(longitude, latitude) {
  if (tourism.length > 0) {
    console.log("已有景點資料");
    showTourismData();
  } else {
    console.log("取得景點API資料");

    axios({
      method: "get",
      url: "https://ptx.transportdata.tw/MOTC/v2/Tourism/ScenicSpot/Taipei?$top=30&$format=JSON",
      // url: `https://ptx.transportdata.tw/MOTC/v2/Bike/Station/NearBy?$spatialFilter=nearby(${latitude},${longitude},1000)`,
      headers: GetAuthorizationHeader()
    })
      .then((response) => {
        // console.log("景點資料", response);
        tourism = response.data;
        showTourismData();
        setMarker(tourism, "tourism");

        // console.log(tourism);
        // getAvailableData(longitude, latitude);
      })
      .catch((error) => console.log("error", error));
  }
}

function showTourismData() {
  let random1 = Math.floor(Math.random() * tourism.length);
  let random2 = Math.floor(Math.random() * tourism.length);
  let random3 = Math.floor(Math.random() * tourism.length);

  document.getElementById("tourism").innerHTML = `
      <!--Pixabay 上的免費圖片-->
      <div class="food-detail">
          <img src="./images/tour1.webp" alt="" class="food-img">
          <h1>${tourism[random1].Name}</h1>
          <p style="display: inline;">4.0</p><span>★★★★☆</span>
          <p style="display: inline;">120則評論</p>
          <p>${tourism[random1].DescriptionDetail}</p>
      </div>
      <div class="food-detail">
          <img src="./images/tour2.webp" alt="" class="food-img">
          <h1>${tourism[random2].Name}</h1>
          <p style="display: inline;">4.0</p><span>★★★★☆</span>
          <p style="display: inline;">120則評論</p>
          <p>${tourism[random2].DescriptionDetail}</p>
      </div>
      <div class="food-detail">
          <img src="./images/tour3.webp" alt="" class="food-img">
          <h1>${tourism[random3].Name}</h1>
          <p style="display: inline;">4.0</p><span>★★★★☆</span>
          <p style="display: inline;">120則評論</p>
          <p>${tourism[random3].DescriptionDetail}</p>
      </div>`;
}

// 串接美食資料
let foods = [];
function getFoodData(longitude, latitude) {
  if (foods.length > 0) {
    // console.log("已有餐廳資料");
    showFoodData();
  } else {
    // console.log("取得餐廳API資料");

    axios({
      method: "get",
      // 美食API 台北資料錯誤，另改來源 https://data.gov.tw/dataset/132491
      // url: "https://ptx.transportdata.tw/MOTC/v2/Tourism/Restaurant/Taipei?$format=JSON",
      // url: `https://ptx.transportdata.tw/MOTC/v2/Bike/Station/NearBy?$spatialFilter=nearby(${latitude},${longitude},1000)`,
      url: "./data/109taipei.json"
      // headers: GetAuthorizationHeader()
    })
      .then((response) => {
        // console.log(response);
        // console.log("美食資料", response.data);
        foods = response.data;
        showFoodData();
        // getAvailableData(longitude, latitude);
        setMarker(foods, "food");
      })
      .catch((error) => console.log("error", error));
  }
}

function showFoodData() {
  let random1 = Math.floor(Math.random() * foods.length);
  let random2 = Math.floor(Math.random() * foods.length);
  let random3 = Math.floor(Math.random() * foods.length);

  document.getElementById("restaurant").innerHTML = `
      <!--Pixabay 上的免費圖片-->
      <div class="food-detail">
          <img src="./images/food1.webp" alt="" class="food-img">
          <h1>${foods[random1].name}</h1>
          <p style="display: inline;">4.0</p><span>★★★★☆</span>
          <p style="display: inline;">120則評論</p>
          <p>${foods[random1].web}</p>
      </div>
      <div class="food-detail">
          <img src="./images/food2.webp" alt="" class="food-img">
          <h1>${foods[random2].name}</h1>
          <p style="display: inline;">4.0</p><span>★★★★☆</span>
          <p style="display: inline;">120則評論</p>
          <p>${foods[random2].web}</p>
      </div>
      <div class="food-detail">
          <img src="./images/food3.webp" alt="" class="food-img">
          <h1>${foods[random3].name}</h1>
          <p style="display: inline;">4.0</p><span>★★★★☆</span>
          <p style="display: inline;">120則評論</p>
          <p>${foods[random3].web}</p>
      </div>`;
}

// 串接附近的自行車租借站位資料
let data = [];
function getStationData(longitude, latitude) {
  axios({
    method: "get",
    url: "https://ptx.transportdata.tw/MOTC/v2/Bike/Station/Taipei",
    // url: `https://ptx.transportdata.tw/MOTC/v2/Bike/Station/NearBy?$spatialFilter=nearby(${latitude},${longitude},1000)`,
    headers: GetAuthorizationHeader()
  })
    .then((response) => {
      // console.log("租借站位資料", response);
      data = response.data;

      getAvailableData(longitude, latitude);
    })
    .catch((error) => console.log("error", error));
}
// 串接附近的即時車位資料
let filterData = [];
function getAvailableData(longitude, latitude) {
  axios({
    method: "get",
    url: "https://ptx.transportdata.tw/MOTC/v2/Bike/Availability/Taipei",
    // url: `https://ptx.transportdata.tw/MOTC/v2/Bike/Availability/NearBy?$spatialFilter=nearby(${latitude},${longitude},1000)`,
    headers: GetAuthorizationHeader()
  })
    .then((response) => {
      // console.log("車位資料", response);
      const availableData = response.data;

      // 比對
      availableData.forEach((availableItem) => {
        data.forEach((stationItem) => {
          if (availableItem.StationUID === stationItem.StationUID) {
            availableItem.StationName = stationItem.StationName;
            availableItem.StationAddress = stationItem.StationAddress;
            availableItem.StationPosition = stationItem.StationPosition;
            filterData.push(availableItem);
          }
        });
      });
      // console.log('filterData', filterData)

      setMarker(filterData, "bike");
    })
    .catch((error) => console.log("error", error));
}

// 選取自行車的路線
const bikeRoute = document.querySelector("#bikeRoute");
function getRoutesData() {
  axios({
    method: "get",
    url: "https://ptx.transportdata.tw/MOTC/v2/Cycling/Shape/Taipei",
    headers: GetAuthorizationHeader()
  })
    .then((response) => {
      // console.log("自行車的路線", response);
      const routeData = response.data;

      // console.log(routeData);
      var filter = routeData.filter((item) => {
        if (
          item.RouteName.includes("河濱") ||
          item.RouteName.includes("淡水河") ||
          item.RouteName.includes("基隆河") ||
          item.RouteName.includes("新店溪") ||
          item.RouteName.includes("景美溪") ||
          item.RouteName.includes("環社子島") ||
          item.RouteName.includes("貴子坑溪") ||
          item.RouteName.includes("關渡") ||
          item.RouteName.includes("河濱自行車道")
        ) {
          return true;
        }
        return false;
      });
      // console.log(filter);

      let str = `<option value=選擇路線>選擇路線</option>`;
      filter.forEach((item) => {
        str += `<option value="${item.RouteName}">${item.RouteName}</option>`;
      });
      bikeRoute.innerHTML = str;

      bikeRoute.addEventListener("change", (e) => {
        const value = e.target.value;
        // console.log(value)

        if (myLayer) {
          map.removeLayer(myLayer);
        }

        filter.forEach((item) => {
          if (item.RouteName === value) {
            geo = item.Geometry;

            // 畫線的方法
            polyLine(geo);
          }
        });
      });
    })
    .catch((error) => console.log("error", error));
}
getRoutesData();

// 畫出自行車的路線
let myLayer = null;

function polyLine(geo) {
  // 建立一個 wkt 的實體
  const wicket = new Wkt.Wkt();
  const geojsonFeature = wicket.read(geo).toJson();

  // 預設樣式
  // myLayer = L.geoJSON(geojsonFeature).addTo(map);

  const myStyle = {
    color: "#FF4F4F",
    weight: 10,
    opacity: 0.65,
    dashArray: "10, 15" // 路線點點style https://developer.mozilla.org/zh-TW/docs/Web/SVG/Tutorial/Fills_and_Strokes
  };
  myLayer = L.geoJSON(geojsonFeature, {
    style: myStyle
  }).addTo(map);
  // console.log(myLayer);

  myLayer.addData(geojsonFeature);
  // zoom the map to the layer
  map.fitBounds(myLayer.getBounds());
}

// 定位按鈕
L.control
  .locate({
    position: "bottomright",
    flyTo: true,
    initialZoomLevel: 17,
    strings: {
      popup: "您的位置"
    }
  })
  .addTo(map);

// side bar設定
// 起始畫面設定
var device = "";
if (window.innerWidth > 767) {
  var sidebar = L.control.sidebar("sidebar", {
    position: "left"
  });
  device = "pc";
} else {
  var sidebar = L.control.sidebar("sidebar", {
    position: "bottom"
  });
  device = "mobile";
}

// 畫面尺寸變動監聽
window.addEventListener("resize", function (e) {
  var checkDevice = "";
  if (window.innerWidth > 767) {
    checkDevice = "pc";
  } else {
    checkDevice = "mobile";
  }

  // console.log(window.innerWidth, device, checkDevice, device == checkDevice);

  if (device != checkDevice) {
    window.location.reload();
  }
});

map.addControl(sidebar);

map.on("click", function () {
  sidebar.hide();
});

sidebar.on("show", function () {
  console.log("Sidebar will be visible.");
});

sidebar.on("shown", function () {
  console.log("Sidebar is visible.");
});

sidebar.on("hide", function () {
  console.log("Sidebar will be hidden.");
});

sidebar.on("hidden", function () {
  console.log("Sidebar is hidden.");
});

L.DomEvent.on(sidebar.getCloseButton(), "click", function () {
  console.log("Close button clicked.");
});

// image slider.js

var slide_index = 1;
displaySlides(slide_index);
function nextSlide(n) {
  displaySlides((slide_index += n));
}
function currentSlide(n) {
  displaySlides((slide_index = n));
}
function displaySlides(n) {
  var i;
  var slides = document.getElementsByClassName("showSlide");
  if (n > slides.length) {
    slide_index = 1;
  }
  if (n < 1) {
    slide_index = slides.length;
  }
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  slides[slide_index - 1].style.display = "block";
}

// 手勢判定
var gesture = {
    x: [],
    y: [],
    match: ""
  },
  tolerance = 200; //手勢滑動寬容值;

window.addEventListener("touchstart", function (e) {
  e.preventDefault();
  for (i = 0; i < e.touches.length; i++) {
    var dot = document.createElement("div");
    dot.id = i;
    dot.style.top = e.touches[i].clientY - 25 + "px";
    dot.style.left = e.touches[i].clientX - 25 + "px";
    document.body.appendChild(dot);
    gesture.x.push(e.touches[i].clientX);
    gesture.y.push(e.touches[i].clientY);
  }
});
window.addEventListener("touchmove", function (e) {
  e.preventDefault();
  for (var i = 0; i < e.touches.length; i++) {
    var dot = document.getElementById(i);
    dot.style.top = e.touches[i].clientY - 25 + "px";
    dot.style.left = e.touches[i].clientX - 25 + "px";
    gesture.x.push(e.touches[i].clientX);
    gesture.y.push(e.touches[i].clientY);
  }
});
window.addEventListener("touchend", function (e) {
  var xTravel = gesture.x[gesture.x.length - 1] - gesture.x[0],
    yTravel = gesture.y[gesture.y.length - 1] - gesture.y[0];
  if (xTravel < tolerance && xTravel > -tolerance && yTravel < -tolerance) {
    gesture.match = "Swiped Up";
    // 上滑 full sidebar for mobile
    var element = document.getElementsByClassName("leaflet-sidebar")[0];
    element.classList.add("full-sidebar-mobile");
  }
  if (xTravel < tolerance && xTravel > -tolerance && yTravel > tolerance) {
    gesture.match = "Swiped Down";
    //下滑就隱藏sidebar
    var element = document.getElementsByClassName("leaflet-sidebar")[0];
    element.classList.remove("full-sidebar-mobile");
    sidebar.hide();
  }
  if (yTravel < tolerance && yTravel > -tolerance && xTravel < -tolerance) {
    gesture.match = "Swiped Left";
  }
  if (yTravel < tolerance && yTravel > -tolerance && xTravel > tolerance) {
    gesture.match = "Swiped Right";
  }

  gesture.x = [];
  gesture.y = [];
  gesture.match = xTravel = yTravel = "";
});

function removePath() {
  if (myLayer) {
    map.removeLayer(myLayer);
  }
}

window.onload = function () {
  getFoodData();
  getTourismData();
};

var maxSentiment = 0;
var avgSentiment = 0.0;
var prop = {
  id: '0SA2_Code_',
  names: '6feature_n',
  employment: '1Employmen',
  education: '2Education',
  income: '3Income_va',
  government: '4Governmen',
  tweet: 'sentiment',
};
var selection = 'tweet';
var positiveColor = '#0007ff';
var negativeColor = '#FBFF00';

// tweets sentiment fetching logic
function loadCouchData() {
  $.ajax({
    url:'http://' + document.location.hostname +
    ':5984/tweets_polygons_relational/_design/stats/_view/count_polygons?group=true',
    dataType: 'jsonp',
    success: function (data) {
      console.log(data);

      // update the max and average sentiment sample size
      data.rows.forEach(function (dp) {
        var total = dp.value.positive + dp.value.negative + dp.value.neutral;
        avgSentiment += total / data.rows.length;
        if (total > maxSentiment) {
          maxSentiment = total;
        }
      });

      // iterate over the sentiments and attach them to the map
      data.rows.forEach(function (dataPoint) {
        // update the map features
        map.data
          .getFeatureById(dataPoint.key)
          .setProperty(prop.tweet, dataPoint.value);

      });
    },

    error: function () {
      alert('failed to load tweets');
    },
  });
}

// map logic
var map;
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: -37.814107, lng: 144.963280 },
    zoom: 8,
  });

  // style of the features
  map.data.setStyle(styleFunction);

  // logic to get polygon location
  featureLookup = {};
  google.maps.event.addListener(map.data, 'addfeature', function (e) {
    if (e.feature.getGeometry().getType() === 'Polygon') {
      // add it for easy lookup later when we have the tweets downloaded
      featureLookup[e.feature.getProperty(prop.id)] = e.feature;

      // work out the bounds of the property
      var bounds = new google.maps.LatLngBounds();

      e.feature.getGeometry().getArray().forEach(function (path) {
        path.getArray().forEach(function (latLng) {
          bounds.extend(latLng);
        });
      });

      e.feature.setProperty('bounds', bounds);
    }
  });

  // what to dow hen mousing over a feature
  map.data.addListener('mouseover', function (event) {
    map.data.revertStyle();
    map.data.overrideStyle(event.feature, { strokeWeight: 2 });
    if (event.feature) {
      infowindow.setContent(getContent(event.feature));
      infowindow.setPosition(event.feature.getProperty('bounds').getCenter());
      infowindow.setOptions({ pixelOffset: new google.maps.Size(0, -10) });
      infowindow.open(map);
    }
  });

  map.data.loadGeoJson('sa2_economic_index.json', { idPropertyName: prop.id }, function () {
    // geojson loaded, now load tweet information
    loadCouchData();
  });

  // info window to move around
  var infowindow = new google.maps.InfoWindow({
    content: 'Unset',
  });
}

function styleFunction(feature) {
  var opacity = 0;
  var color = '#ff0000';
  var strokeColor = '#ff7700';
  var sentiment = feature.getProperty('sentiment');
  if (sentiment) {
    // flip the opacity based on tweet sentiment availability
    var total = sentiment.positive + sentiment.negative + sentiment.neutral;
    opacity = Math.min((total / avgSentiment) + 0.1, 0.8);

    // change color based on data type selected
    if (selection == 'tweet') {
      var middle = sentiment.positive - sentiment.negative;
      var spectrumAmount = 0.5 + (middle /
                           Math.max(sentiment.positive, sentiment.negative) || 0) / 2;
      color = tinycolor(positiveColor).spin(spectrumAmount * -180)
                                      .toHexString();
      strokeColor = tinycolor(color).darken(10);
    }
  }

  return {
    fillOpacity: opacity,
    fillColor: color,
    strokeColor: strokeColor,
    strokeWeight: 1,
    title: feature.getProperty('1Employmen') || null,
  };
}

function getContent(feature) {
  console.log(feature);
  content = '<div>';
  content += '<h4>' + feature.getProperty(prop.names) + '</h4>';
  content += '<b>Employment Idx:</b> ' +
             tryFormat(feature.getProperty(prop.employment), 2) || 'NOT AVAILABLE';
  content += '<br/><b>Education Idx:</b> ' +
             tryFormat(feature.getProperty(prop.education), 2) || 'NOT AVAILABLE';
  content += '<br/><b>Income Idx:</b> ' +
             tryFormat(feature.getProperty(prop.income), 2) || 'NOT AVAILABLE';
  content += '<br/><b>Government Benefits Idx:</b> ' +
             tryFormat(feature.getProperty(prop.government), 2) || 'NOT AVAILABLE';
  var sentiment = feature.getProperty('sentiment');
  if (sentiment) {
    content += '<br/><b>Sentiment:</b> ' +
               JSON.stringify(sentiment);
  }

  content += '</div>';
  return content;
}

function changeSelection(sel) {
  selection = sel;

  map.data.setStyle(styleFunction);
}

function tryFormat(variable, decimalPlaces) {
  if (variable) {
    return variable.toFixed(decimalPlaces);
  } else {
    return variable;
  }
}

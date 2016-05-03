var map;
var idProperty = '0SA2_Code_';
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: -37.814107, lng: 144.963280 },
    zoom: 8,
  });

  // style of the features
  map.data.setStyle(function (feature) {
    return {
      fillColor: '#ffcc00',
      strokeColor: '#ff7700',
      strokeWeight: 1,
      title: feature.getProperty('1Employmen') || null,
    };
  });

  // logic to get polygon location
  featureLookup = {};
  google.maps.event.addListener(map.data, 'addfeature', function (e) {
    if (e.feature.getGeometry().getType() === 'Polygon') {
      // add it for easy lookup later when we have the tweets downloaded
      featureLookup[e.feature.getProperty(idProperty)] = e.feature;

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
    map.data.overrideStyle(event.feature, { fillColor: '#ff6600' });
    if (event.feature) {
      infowindow.setContent(getContent(event.feature));
      infowindow.setPosition(event.feature.getProperty('bounds').getCenter());
      infowindow.setOptions({ pixelOffset: new google.maps.Size(0, -10) });
      infowindow.open(map);
    }
  });

  map.data.loadGeoJson('sa2_economic_index.json', { idPropertyName: idProperty });

  // info window to move around
  var infowindow = new google.maps.InfoWindow({
    content: 'Unset',
  });
}

function getContent(feature) {
  console.log(feature);
  content = '<div>';
  content += '<h4>' + feature.getProperty('6feature_n') + '</h4>';
  content += '<b>Employment Idx:</b> ' +
             tryFormat(feature.getProperty('1Employmen'), 2) || 'NOT AVAILABLE';
  content += '<br/><b>Education Idx:</b> ' +
             tryFormat(feature.getProperty('2Education'), 2) || 'NOT AVAILABLE';
  content += '<br/><b>Income Idx:</b> ' +
             tryFormat(feature.getProperty('3Income_va'), 2) || 'NOT AVAILABLE';
  content += '<br/><b>Government Benefits Idx:</b> ' +
             tryFormat(feature.getProperty('4Governmen'), 2) || 'NOT AVAILABLE';
  content += '</div>';
  return content;
}

function tryFormat(variable, decimalPlaces) {
  if (variable) {
    return variable.toFixed(decimalPlaces);
  } else {
    return variable;
  }
}

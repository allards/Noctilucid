(function() {
  var additionalCatalogs, catalogs, constelations, types,
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  $(document).bind("mobileinit", ($.mobile.touchOverflowEnabled = true));

  $(window).ready(function() {
    var ReprObj, abr, activeObject, allCats, alt, az, back, backPage, cat, con, dbFindByNumber, dec, distance, dsSortByD, dst, dte, filterObject, findNearBy, getGPS, getOptions, goToPage, handleMotion, handlePositionError, handlePositionFound, html, lat, log, lon, moveSwitch, options, ra, saveOptions, searchResults, selectedCatalog, selectedConstelation, selectedType, switchValue, type, tzone, uiDarkNebula, uiDarkVision, uiFindNearBy, uiGoBack, uiLimitingMagnitude, uiLogObject, uiMakeTarget, uiNavDSC, uiNavLog, uiNavObjects, uiNavSettings, uiNearByField, uiSelectConstelation, uiSelectType, uiShowObject, uiShowResults, uiUnknownMagnitude, updateRaDec, updateTime, zone;
    az = 181.92;
    alt = 29.58;
    ra = 0;
    dec = 0;
    back = uiNavDSC;
    $('#alt').text(rnd(alt, 1).toString());
    $('#az').text(rnd(az, 1).toString());
    moveSwitch = function(query, toggle) {
      var slider;
      slider = $(query);
      if (toggle) {
        slider[0].selectedIndex = 0;
      } else {
        slider[0].selectedIndex = 1;
      }
      return slider.slider("refresh");
    };
    switchValue = function(query) {
      var slider;
      slider = $(query);
      if (slider[0].selectedIndex === 0) {
        return true;
      } else {
        return false;
      }
    };
    getOptions = function() {
      var options;
      options = localStorage.getItem('options');
      if (options) {
        options = JSON.parse(localStorage.getItem('options'));
        moveSwitch('#dark-vision', options.darkvision);
        moveSwitch('#include-dnbl', options.darkNebula);
        moveSwitch('#include-unknown', options.unknownMagnitude);
        $('#field-nearby').val(options.nearByField).slider('refresh');
        $('#limiting-magnitude').val(options.limitingMagnitude).slider('refresh');
      } else {
        options = {};
        options.darkvision = true;
        options.lon = 0.0;
        options.lat = 0.0;
        options.darkNebula = true;
        options.unknownMagnitude = true;
        options.limitingMagnitude = 8;
        options.nearByField = 15;
        moveSwitch('#dark-vision', true);
        moveSwitch('#include-dnbl', false);
        moveSwitch('#include-unknown', false);
        localStorage.setItem('options', JSON.stringify(options));
      }
      return options;
    };
    saveOptions = function() {
      return localStorage.setItem('options', JSON.stringify(options));
    };
    options = getOptions();
    if (!options.darkvision) {
      $('#theme-css').attr('href', 'jquery.mobile-1.0.1.css');
    }
    lon = options.lon;
    lat = options.lat;
    dte = new Date();
    dst = (dte.getTimezoneOffset() / 60) - (getStandardTimezoneOffset() / 60);
    zone = (dte.getTimezoneOffset() / 60) - dst;
    tzone = dst + zone;
    handlePositionError = function(error) {
      var message;
      switch (error) {
        case error.PERMISSION_DENIED:
          message = 'Permission denied';
          break;
        case error.POSITION_UNAVAILABLE:
          message = 'Position unavailable';
          break;
        case error.TIMEOUT:
          message = 'GPS timeout';
          break;
        default:
          message = 'unknown error';
      }
      message = 'Location: ' + message;
      $('#lat').text(message);
      return $('#lon').text('');
    };
    handlePositionFound = function(position) {
      lat = position.coords.latitude;
      lon = position.coords.longitude;
      $('#lat').text(lat.toString());
      $('#lon').text(lon.toString());
      options.lat = lat;
      return options.lon = lon;
    };
    getGPS = function() {
      if (navigator.geolocation) {
        return navigator.geolocation.getCurrentPosition(handlePositionFound, handlePositionError);
      } else {
        $('#lat').text('GPS not enabled');
        return $('#lon').text('');
      }
    };
    getGPS();
    updateTime = function() {
      var timestamp;
      dte = new Date();
      timestamp = dateFormat(dte, "longTime", true);
      $('#timestamp').text(timestamp);
      return setTimeout(updateTime, 5000);
    };
    updateTime();
    updateRaDec = function() {
      var azFromSouth, decString, raString, rd;
      azFromSouth = az + 180;
      if (azFromSouth > 360) azFromSouth = azFromSouth - 360;
      rd = ra_dec(dte, zone, lon, lat, az, alt);
      ra = rd[0];
      dec = rd[1];
      raString = DMST(ra);
      decString = DMST(dec);
      $('#ra').html(raString);
      $('#dec').html(decString.replace(':', '&deg;'));
      return setTimeout(updateRaDec, 30000);
    };
    updateRaDec();
    handleMotion = function(event) {
      var accuracy;
      if (event.webkitCompassHeading) {
        az = event.webkitCompassHeading + window.orientation;
        accuracy = event.webkitCompassAccuracy;
        if (accuracy === -1) {
          $('#compass-accuracy').text('Compass inaccurate, needs calibration');
        } else {
          $('#compass-accuracy').text('+/-' + rnd(accuracy, 2).toString() + ' degrees');
        }
      } else {
        az = 360 - event.alpha;
      }
      if (Math.abs(event.beta - alt) > 0.05) alt = event.beta;
      $('#alt').text(rnd(alt, 2).toString());
      $('#az').text(rnd(az, 2).toString());
      return updateRaDec();
    };
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleMotion);
    }
    filterObject = function(o) {
      if (o.typ === "DRKNB" && options.darkNebula) return true;
      if (o.mag === 99.9 && options.unknownMagnitude) return true;
      if (o.mag <= options.limitingMagnitude) return true;
      return false;
    };
    dbFindByNumber = function(needle) {
      var i, n, name, num, o, other, results, _i, _j, _len, _len2;
      results = [];
      i = 0;
      for (_i = 0, _len = dsDbJSON.length; _i < _len; _i++) {
        o = dsDbJSON[_i];
        if (filterObject(o)) {
          name = [];
          name[0] = o.obj;
          if (o.oth != null) {
            other = o.oth.split(";");
            name = name.concat(other);
          }
          for (_j = 0, _len2 = name.length; _j < _len2; _j++) {
            n = name[_j];
            num = n.match(/\d+/g);
            if (num && __indexOf.call(num, needle) >= 0) results.push(i);
          }
        }
        i++;
        if (results.length > 99) break;
      }
      return results;
    };
    distance = function(o) {
      var lat1, lat2, lon1, lon2;
      lat1 = ra * 15;
      lon1 = dec;
      lat2 = o.ra * 15;
      lon2 = o.dec;
      return dacs(dsin(lat1) * dsin(lat2) + dcos(lat1) * dcos(lat2) * dcos(lon2 - lon1)) * 1;
    };
    dsSortByD = function(a, b) {
      return a.d - b.d;
    };
    findNearBy = function() {
      var d, i, maxD, o, results, _i, _len;
      results = [];
      i = 0;
      maxD = options.nearByField / 2;
      for (_i = 0, _len = dsDbJSON.length; _i < _len; _i++) {
        o = dsDbJSON[_i];
        if (filterObject(o)) {
          d = distance(o);
          if (d < maxD) {
            o.d = d;
            o.number = i;
            results.push(o);
          }
        }
        i++;
      }
      results.sort(dsSortByD);
      return results;
    };
    ReprObj = (function() {

      function ReprObj(obj) {
        this.obj = obj;
        if (this.obj.oth != null) {
          this.name = this.obj.obj + ', ' + this.obj.oth.replace(';', ', ');
        } else {
          this.name = this.obj.obj;
        }
        this.mag = this.obj.mag;
        if (this.obj.mag === 99.9) this.mag = 'unknown';
        if (this.obj.mag === 79.9) this.mag = 'dark nebula';
        this.constelation = constelations[obj.con];
        this.type = types[this.obj.typ];
      }

      ReprObj.prototype.setAsTarget = function() {
        var azal, decString;
        $('#ra-obj').html(DMST(this.obj.ra));
        decString = DMST(this.obj.dec);
        decString.replace(':', '&deg;');
        $('#dec-obj').html(decString);
        azal = az_al(dte, zone, lon, lat, this.obj.ra, this.obj.dec);
        $('#alt-obj').html(rnd(azal[1], 2));
        $('#az-obj').html(rnd(azal[0], 2));
        $('#target').html('<br /><b>' + this.obj.obj + '</b>');
        $('#show-target-object').attr('objectnumber', this.obj.number);
        console.log($('#show-target-object .ui-btn-text'));
        return $('#show-target-object').show();
      };

      ReprObj.prototype.listView = function() {
        var html;
        if (options.darkvision) {
          html = '<li data-theme="a" data-icon="false"><a href="" class="linkToObject" objectNumber="' + this.obj.number + '"><p><strong>' + this.name + '</p></strong><p>' + this.type + ' in ' + this.constelation + ' (' + this.mag + ')</p></a></li>';
        } else {
          html = '<li data-theme="c"><a href="" class="linkToObject" objectNumber="' + this.obj.number + '"><p><strong>' + this.name + '</p></strong><p>' + this.type + ' in ' + this.constelation + ' (' + this.mag + ')</p></a></li>';
        }
        return html;
      };

      ReprObj.prototype.detailView = function() {
        var azal, bchm, cat, decString, html, _i, _len, _ref, _ref2;
        html = '<strong>' + this.name + '</strong><br />';
        html += this.type + ' in ' + this.constelation + ' (Magnitude: ' + this.mag + ')<br />';
        if (this.obj.bchm != null) {
          bchm = [];
          console.log(this.obj.bchm);
          _ref = this.obj.bchm;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            cat = _ref[_i];
            if (additionalCatalogs[cat]) {
              bchm.push(additionalCatalogs[cat]);
              console.log(cat, additionalCatalogs[cat], bchm);
            }
          }
          html += 'Also in: ' + bchm.join(', ') + '<br />';
        }
        html += '<br />';
        if (this.obj.d != null) {
          html += 'Distance from where you are now: ' + rnd(this.obj.d, 2) + ' degrees<br />';
        } else {
          html += 'Distance from where you are now: ' + rnd(distance(this.obj), 2) + ' degrees<br />';
        }
        if (this.obj.ra != null) html += 'RA: ' + DMST(this.obj.ra) + '<br />';
        if (this.obj.dec != null) {
          decString = DMST(this.obj.dec);
          decString.replace(':', '&deg;');
          html += 'Dec: ' + decString + '<br />';
        }
        azal = az_al(dte, zone, lon, lat, this.obj.ra, this.obj.dec);
        html += 'Azimuth: ' + rnd(azal[0], 2) + '<br />';
        html += 'Altitude: ' + rnd(azal[1], 2) + '<br />';
        if (this.obj.u2k != null) {
          html += 'Uranometria 2000.0: ' + this.obj.u2k + '<br />';
        }
        if (this.obj.ti != null) {
          html += 'Tirion Sky Atlas 2000.0: ' + this.obj.ti + '<br />';
        }
        html += '<br />';
        if (this.obj.sub != null) {
          if ((_ref2 = this.obj.sub) !== 79.9 && _ref2 !== 99.9) {
            html += 'Surface brightness: ' + this.obj.sub + '<br />';
          }
        }
        if (this.obj.smin != null) {
          html += 'Minimal dimension: ' + this.obj.smin + '<br />';
        }
        if (this.obj.smax != null) {
          html += 'Maximum dimension: ' + this.obj.smax + '<br />';
        }
        if (this.obj.pa != null) {
          html += 'Position angle degrees from North: ' + this.obj.pa + '<br />';
        }
        if (this.obj.cls != null) {
          html += 'Object class: ' + this.obj.cls + '<br />';
        }
        if (this.obj.nsts != null) {
          html += 'Number of stars: ' + this.obj.nsts + '<br />';
        }
        if (this.obj.brts != null) {
          html += 'Magnitude brightest star: ' + this.obj.brts + '<br />';
        }
        if (this.obj.ngcd != null) {
          html += 'NGC description: ' + this.obj.ngcd + '<br />';
        }
        if (this.obj.notes != null) {
          html += 'Notes: ' + this.obj.notes + '<br />\n';
        }
        if (this.obj.logTime != null) {
          html += 'Logged on: ' + this.obj.logTime + '<br />\n';
        } else {
          console.log('obj has no logTime');
        }
        return html;
      };

      return ReprObj;

    })();
    uiFindNearBy = function() {
      var o, r, results, _i, _len, _results;
      $('#object-list').empty();
      goToPage('page-nearby-listing');
      results = findNearBy();
      if (results) {
        _results = [];
        for (_i = 0, _len = results.length; _i < _len; _i++) {
          r = results[_i];
          o = new ReprObj(r);
          $('#object-list').append(o.listView());
          _results.push($('#object-list').listview("refresh"));
        }
        return _results;
      } else {
        return $('#page-nearby-listing').html('No object found nearby. Consider opening up the limiting magnitude and field considered near by in the settings');
      }
    };
    uiNavDSC = function() {
      $('div.ui-content').hide();
      $('#page-DSC').show();
      $('#back').hide();
      return $('#header').text('DSC');
    };
    allCats = {};
    $.extend(allCats, catalogs, additionalCatalogs);
    for (abr in allCats) {
      cat = allCats[abr];
      if (options.darkvision) {
        html = '<li data-theme="a" data-icon="false"><a href="" class="catalogLink" catalog="' + abr + '"><p>' + abr + ': ' + cat + '</p></a></li>';
      } else {
        html = '<li data-theme="c" data-icon="false"><a href="" class="catalogLink" catalog="' + abr + '"><p>' + abr + ': ' + cat + '</p></a></li>';
      }
      $('#catalog-list').append(html);
      $('#catalog-list').listview("refresh");
    }
    for (abr in constelations) {
      con = constelations[abr];
      if (options.darkvision) {
        html = '<li data-theme="a" data-icon="false"><a href="" class="constelationLink" constelation="' + abr + '"><p>' + con + '</p></a></li>';
      } else {
        html = '<li data-theme="c" data-icon="false"><a href="" class="constelationLink" constelation="' + abr + '"><p>' + con + '</p></a></li>';
      }
      $('#constelation-list').append(html);
      $('#constelation-list').listview("refresh");
    }
    for (abr in types) {
      type = types[abr];
      if (options.darkvision) {
        html = '<li data-theme="a" data-icon="false"><a href="" class="typeLink" type="' + abr + '"><p>' + type + '</p></a></li>';
      } else {
        html = '<li data-theme="c" data-icon="false"><a href="" class="typeLink" type="' + abr + '"><p>' + type + '</p></a></li>';
      }
      $('#type-list').append(html);
      $('#type-list').listview("refresh");
    }
    uiNavObjects = function() {
      var backPage;
      $('div.ui-content').hide();
      if (searchResults) {
        $('#page-results').show();
        backPage = 'page-types';
        $('#back').show();
      } else {
        $('#page-Objects').show();
        $('#back').hide();
      }
      return $('#header').text('Objects');
    };
    uiNavLog = function() {
      var l, o, _i, _len, _results;
      goToPage('page-Log');
      if (log) {
        $('#log-help').text(log.length + ' entries');
        $('#log-list').empty();
        _results = [];
        for (_i = 0, _len = log.length; _i < _len; _i++) {
          l = log[_i];
          o = new ReprObj(l);
          $('#log-list').append(o.listView());
          _results.push($('#log-list').listview("refresh"));
        }
        return _results;
      }
    };
    uiNavSettings = function() {
      $('.ui-content').hide();
      $('#page-Settings').show();
      $('#back').hide();
      return $('#header').text('Settings');
    };
    uiDarkVision = function() {
      options.darkvision = switchValue('#dark-vision');
      if (options.darkvision) {
        $('#theme-css').attr('href', 'themes/nocturnal.css');
        $('#object-list').attr('data-theme', 'a');
      } else {
        $('#theme-css').attr('href', 'jquery.mobile-1.0.1.css');
        $('#object-list').attr('data-theme', 'c');
      }
      return saveOptions();
    };
    uiDarkNebula = function() {
      options.darkNebula = switchValue('#include-dnbl');
      return saveOptions();
    };
    uiUnknownMagnitude = function() {
      options.unknownMagnitude = switchValue('#include-unknown');
      return saveOptions();
    };
    uiNearByField = function() {
      options.nearByField = $('#field-nearby').val();
      return saveOptions();
    };
    uiLimitingMagnitude = function() {
      options.limitingMagnitude = $('#limiting-magnitude').val();
      return saveOptions();
    };
    uiGoBack = function() {
      console.log(backPage);
      return goToPage(backPage);
    };
    backPage = 'page-DSC';
    goToPage = function(page) {
      var fromPage, toPage;
      fromPage = $('[data-role=content]').filter(':visible');
      fromPage.hide();
      switch (page) {
        case 'page-nearby-listing':
          backPage = 'page-DSC';
          break;
        case 'page-constelations':
          backPage = 'page-Objects';
          break;
        case 'page-types':
          backPage = 'page-constelations';
          break;
        case 'page-results':
          backPage = 'page-types';
          break;
        default:
          backPage = fromPage.attr('id');
      }
      if (page === 'page-DSC' || page === 'page-Objects' || page === 'page-Settings' || page === 'page-Log') {
        $('#back').hide();
      } else {
        $('#back').show();
      }
      toPage = '#' + page;
      $('#header').html($(toPage).attr('data-header'));
      return $(toPage).show();
    };
    activeObject = '';
    uiShowObject = function(event) {
      var o, object;
      goToPage('page-object');
      activeObject = parseInt($(this).attr('objectnumber'));
      object = dsDbJSON[activeObject];
      o = new ReprObj(object);
      $('#object-holder').html(o.detailView());
      return $('#make-target').attr('objectnumber', activeObject);
    };
    log = localStorage.getItem('log');
    if (log) {
      log = JSON.parse(localStorage.getItem('log'));
      console.log('log: ', log);
    } else {
      log = [];
    }
    uiLogObject = function() {
      var object;
      object = dsDbJSON[activeObject];
      object.logTime = dateFormat();
      log.unshift(object);
      console.log('in uiLogObject: ', object);
      console.log('stringed object for log: ', JSON.stringify(object));
      return localStorage.setItem('log', JSON.stringify(log));
    };
    uiMakeTarget = function() {
      var o, object;
      activeObject = parseInt($(this).attr('objectnumber'));
      object = dsDbJSON[activeObject];
      o = new ReprObj(object);
      o.setAsTarget();
      return goToPage('page-DSC');
    };
    selectedCatalog = 'ALL';
    selectedType = 'ALL';
    selectedConstelation = 'ALL';
    console.log(selectedCatalog, selectedConstelation, selectedType);
    uiSelectConstelation = function(event) {
      goToPage('page-constelations');
      console.log('in uiSelectConstelation', $(this));
      selectedCatalog = $(this).attr('catalog');
      console.log(selectedCatalog, selectedConstelation, selectedType);
      return $('#search-help-constelations').text(allCats[selectedCatalog]);
    };
    uiSelectType = function(event) {
      goToPage('page-types');
      selectedConstelation = $(this).attr('constelation');
      console.log($(this));
      console.log(selectedCatalog, selectedConstelation, selectedType);
      return $('#search-help-types').text(allCats[selectedCatalog] + ' > ' + constelations[selectedConstelation]);
    };
    searchResults = false;
    uiShowResults = function(event) {
      var i, o, r, results, _i, _j, _len, _len2;
      goToPage('page-results');
      selectedType = $(this).attr('type');
      results = [];
      i = 0;
      for (_i = 0, _len = dsDbJSON.length; _i < _len; _i++) {
        o = dsDbJSON[_i];
        if (filterObject(o)) {
          if (selectedType === 'ALL' || o.typ === selectedType) {
            if (selectedConstelation === 'ALL' || o.con === selectedConstelation) {
              if (selectedCatalog === 'ALL' || __indexOf.call(o.obj.split(' '), selectedCatalog) >= 0 || ((o.oth != null) && __indexOf.call(o.oth.split(' '), selectedCatalog) >= 0) || ((o.bchm != null) && __indexOf.call(o.bchm.split(''), selectedCatalog) >= 0)) {
                o.number = i;
                results.push(o);
              }
            }
          }
        }
        i++;
      }
      if (results) {
        $('#result-list').empty();
        for (_j = 0, _len2 = results.length; _j < _len2; _j++) {
          r = results[_j];
          o = new ReprObj(r);
          $('#result-list').append(o.listView());
          $('#result-list').listview("refresh");
        }
      }
      $('#search-help-results').text(allCats[selectedCatalog] + ' > ' + constelations[selectedConstelation] + ' > ' + types[selectedType] + ' > Found: ' + results.length.toString());
      return searchResults = true;
    };
    $('#nav-DSC').bind('click', uiNavDSC);
    $('#nav-Objects').bind('click', uiNavObjects);
    $('#nav-Log').bind('click', uiNavLog);
    $('#nav-Settings').bind('click', uiNavSettings);
    $('#find-near-by').bind('click', uiFindNearBy);
    $('#dark-vision').bind('change', uiDarkVision);
    $('#include-dnbl').bind('change', uiDarkNebula);
    $('#include-unknown').bind('change', uiUnknownMagnitude);
    $('#field-nearby').bind('change', uiNearByField);
    $('#limiting-magnitude').bind('change', uiLimitingMagnitude);
    $('#back').bind('click', uiGoBack);
    $('body').delegate('a.linkToObject', 'click', uiShowObject);
    $('body').delegate('a.catalogLink', 'click', uiSelectConstelation);
    $('body').delegate('a.constelationLink', 'click', uiSelectType);
    $('body').delegate('a.typeLink', 'click', uiShowResults);
    $('#log-object').bind('click', uiLogObject);
    $('#make-target').bind('click', uiMakeTarget);
    return $('#show-target-object').bind('click', uiShowObject);
  });

  additionalCatalogs = {
    "B": "Best of the NGC from SAC",
    "C": "Caldwell catalog",
    "H": "Herschel 400 from Astronomical League",
    "M": "Messier"
  };

  catalogs = {
    "ALL": "All catalogs",
    "3C": "Third Cambridge Catalog of Radio Wave Sources",
    "Abell": "George Abell (planetary nebulae and galaxy clusters)",
    "ADS": "Aitken Double Star catalog",
    "AM": "Arp-Madore (globular clusters)",
    "Antalova": "(open clusters)",
    "Ap": "Apriamasvili (planetary nebulae)",
    "Arp": "Halton Arp (interacting galaxies)",
    "Bark": "Barkhatova (open clusters)",
    "B": "Barnard (dark nebulae)",
    "Basel": "(open clusters)",
    "BD": "Bonner Durchmusterung (stars)",
    "Berk": "Berkeley (open clusters)",
    "Be": "Bernes (dark nebulae)",
    "Biur": "Biurakan (open clusters)",
    "Blanco": "(open clusters)",
    "Bochum": "(open clusters)",
    "Ced": "Cederblad (bright nebulae)",
    "CGCG": "Catalog of Galaxies and Clusters of Galaxies",
    "Cr": "Collinder (open clusters)",
    "Czernik": "(open clusters)",
    "DDO": "David Dunlap Observatory (dwarf galaxies)",
    "Do": "Dolidze (open clusters)",
    "DoDz": "Dolidze-Dzimselejsvili (open clusters)",
    "Dun": "Dunlop (Southern objects of all types)",
    "ESO": "European Southern Observatory (Southern objects)",
    "Fein": "Feinstein (open clusters)",
    "Frolov": "(open clusters)",
    "Gum": "(bright nebulae)",
    "H": "William Herschel (globular clusters)",
    "Haffner": "(open clusters)",
    "Harvard": "(open clusters)",
    "Hav-Moffat": "Havermeyer and Moffat (open clusters)",
    "He": "Henize (planetary nebulae)",
    "Hogg": "(open clusters)",
    "Ho": "Holmberg (galaxies)",
    "HP": "Haute Provence (globular clusters)",
    "Hu": "Humason (planetary nebulae)",
    "IC": "1st and 2nd Index Catalogs to the NGC (All types of objects except dark nebulae)",
    "Isk": "Iskudarian (open clusters)",
    "J": "Jonckheere (planetary nebulae)",
    "K": "Kohoutek (planetary nebulae)",
    "Kemble": "Father Lucian Kemble (asterisms)",
    "King": "(open clusters)",
    "Kr": "Krasnogorskaja (planetary nebulae)",
    "Lac": "Lacaille (globular clusters)",
    "Loden": "(open clusters)",
    "LBN": "Lynds (bright nebula)",
    "LDN": "Lynds (dark nebulae)",
    "NPM1G": "Northern Proper Motion, 1st part, Galaxies",
    "Lynga": "(open clusters)",
    "M": "Messier (all types of objects except dark nebula)",
    "MCG": "Morphological Catalog of Galaxies",
    "Me": "Merrill (plantary nebulae)",
    "Mrk": "Markarian (open clusters and galaxies)",
    "Mel": "Melotte (open clusters)",
    "M1 thru M4": "Minkowski (planetary nebulae)",
    "New": "'New' galaxies in the Revised Shapley-Ames Catalog",
    "NGC": "New General Catalog of Nebulae & Clusters of Stars. (All types of objects except dark nebulae)",
    "Pal": "Palomar (globular clusters)",
    "PB": "Peimbert and Batiz (planetary nebulae)",
    "PC": "Peimbert and Costero (planetary nebulae)",
    "Pismis": "(open clusters)",
    "PK": "Perek & Kohoutek (planetary nebulae)",
    "RCW": "Rodgers, Campbell, & Whiteoak (bright nebulae)",
    "Roslund": "(open clusters)",
    "Ru": "Ruprecht (open clusters)",
    "Sa": "Sandqvist (dark nebulae)",
    "Sher": "(open clusters)",
    "Sh": "Sharpless (bright nebulae)",
    "SL": "Sandqvist & Lindroos (dark nebulae)",
    "SL": "Shapley & Lindsay (clusters in LMC)",
    "Steph": "Stephenson (open clusters)",
    "Stock": "(open clusters)",
    "Ter": "Terzan (globular clusters)",
    "Tombaugh": "(open clusters)",
    "Ton": "Tonantzintla (globular clusters)",
    "Tr": "Trumpler (open clusters)",
    "UGC": "Uppsala General Catalog (galaxies)",
    "UGCA": "Uppsala General Catalog, Addendum (galaxies)",
    "UKS": "United Kingdom Schmidt (globular clusters)",
    "Upgren": "(open clusters)",
    "V V": "Vorontsov-Velyaminov (interacting galaxies)",
    "vdB": "van den Bergh (open clusters, bright nebulae)",
    "vdBH": "van den Bergh & Herbst (bright nebulae)",
    "vdB-Ha": "van den Bergh-Hagen (open clusters)",
    "Vy": "Vyssotsky (planetary nebulae)",
    "Waterloo": "(open clusters)",
    "Winnecke": "Double Star (Messier 40)",
    "ZwG": "Zwicky (galaxies)"
  };

  types = {
    "ALL": "All types of objects",
    "BRTNB": "Bright Nebula",
    "CL+NB": "Cluster with Nebulosity",
    "DRKNB": "Dark Nebula",
    "GALCL": "Galaxy cluster",
    "GALXY": "Galaxy",
    "GLOCL": "Globular Cluster",
    "GX+DN": "Diffuse Nebula in a Galaxy",
    "GX+GC": "Globular Cluster in a Galaxy",
    "G+C+N": "Cluster with Nebulosity in a Galaxy",
    "LMCCN": "Cluster with Nebulosity in the LMC",
    "LMCDN": "Diffuse Nebula in the LMC",
    "LMCGC": "Globular Cluster in the LMC",
    "LMCOC": "Open cluster in the LMC",
    "NONEX": "Nonexistent",
    "OPNCL": "Open Cluster",
    "PLNNB": "Planetary Nebula",
    "SMCCN": "Cluster with Nebulosity in the SMC",
    "SMCDN": "Diffuse Nebula in the SMC",
    "SMCGC": "Globular Cluster in the SMC",
    "SMCOC": "Open cluster in the SMC",
    "SNREM": "Supernova Remnant",
    "QUASR": "Quasar",
    "1STAR": "1 Star",
    "2STAR": "2 Stars",
    "3STAR": "3 Stars",
    "4STAR": "4 Stars",
    "8STAR": "8 Stars"
  };

  constelations = {
    "ALL": "All constelations",
    "AND": "Andromeda",
    "ANT": "Antlia",
    "APS": "Apus",
    "AQR": "Aquarius",
    "AQL": "Aquila",
    "ARA": "Ara",
    "ARI": "Aries",
    "AUR": "Auriga",
    "BOO": "Bootes",
    "CAE": "Caelum",
    "CAM": "Camelopardalis",
    "CNC": "Cancer",
    "CVN": "Canes Venatici",
    "CMA": "Canis Major",
    "CMI": "Canis Minor",
    "CAP": "Capricornus",
    "CAR": "Carina",
    "CAS": "Cassiopeia",
    "CEN": "Centaurus",
    "CEP": "Cepheus",
    "CET": "Cetus",
    "CHA": "Chamaeleon",
    "CIR": "Circinus",
    "COL": "Columba",
    "COM": "Coma Berenices",
    "CRA": "Corona Australis",
    "CRB": "Corona Borealis",
    "CRV": "Corvus",
    "CRT": "Crater",
    "CRU": "Crux",
    "CYG": "Cygnus",
    "DEL": "Delphinus",
    "DOR": "Dorado",
    "DRA": "Draco",
    "EQU": "Equuleus",
    "ERI": "Eridanus",
    "FOR": "Fornax",
    "GEM": "Gemini",
    "GRU": "Grus",
    "HER": "Hercules",
    "HOR": "Horologium",
    "HYA": "Hydra",
    "HYI": "Hydrus",
    "IND": "Indus",
    "LAC": "Lacerta",
    "LEO": "Leo",
    "LMI": "Leo Minor",
    "LEP": "Lepus",
    "LIB": "Libra",
    "LUP": "Lupus",
    "LYN": "Lynx",
    "LYR": "Lyra",
    "MEN": "Mensa",
    "MIC": "Microscopium",
    "MON": "Monoceros",
    "MUS": "Musca",
    "NOR": "Norma",
    "OCT": "Octans",
    "OPH": "Ophiuchus",
    "ORI": "Orion",
    "PAV": "Pavo",
    "PEG": "Pegasus",
    "PER": "Perseus",
    "PHE": "Phoenix",
    "PIC": "Pictor",
    "PSC": "Pisces",
    "PSA": "Pisces Austrinus",
    "PUP": "Puppis",
    "PYX": "Pyxis",
    "RET": "Reticulum",
    "SGE": "Sagitta",
    "SGR": "Sagittarius",
    "SCO": "Scorpius",
    "SCL": "Sculptor",
    "SCT": "Scutum",
    "SER": "Serpens",
    "SEX": "Sextans",
    "TAU": "Taurus",
    "TEL": "Telescopium",
    "TRA": "Triangulum Australe",
    "TRI": "Triangulum",
    "TUC": "Tucana",
    "UMA": "Ursa Major",
    "UMI": "Ursa Minor",
    "VEL": "Vela",
    "VIR": "Virgo",
    "VOL": "Volans",
    "VUL": "Vulpecula"
  };

}).call(this);

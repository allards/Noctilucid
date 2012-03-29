(function() {
  var deg, dms, doy, dtor, epoch, intr, nutation, precess, root, rtod, sgn, sideral;

  root = typeof exports !== "undefined" && exports !== null ? exports : this;

  epoch = 2000;

  root.getStandardTimezoneOffset = function() {
    var dte, j, msec, offset;
    dte = new Date();
    msec = dte.getTime();
    offset = -999999;
    for (j = 0; j <= 3; j++) {
      dte.setTime(msec + j * 7884000000);
      offset = Math.max(offset, dte.getTimezoneOffset());
    }
    return offset;
  };

  root.rnd = function(num, dec) {
    num = Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);
    return num;
  };

  intr = function(num) {
    var n;
    n = Math.floor(Math.abs(num));
    if (num < 0) n = n * -1;
    return n;
  };

  sgn = function(num) {
    if (num < 0) return -1;
    if (num > 0) return 1;
    return 0;
  };

  dtor = function(num) {
    num = num / 57.29577951;
    return num;
  };

  rtod = function(num) {
    return num * 57.29577951;
  };

  root.dsin = function(num) {
    return Math.sin(dtor(num));
  };

  root.dcos = function(num) {
    return Math.cos(dtor(num));
  };

  root.dtan = function(num) {
    return Math.tan(dtor(num));
  };

  root.dasn = function(num) {
    var y;
    if (num > 1) num = 1;
    if (num < -1) num = -1;
    if (num === 1) {
      y = 1.570796327;
    } else {
      y = Math.atan(num / Math.sqrt(-1 * num * num + 1));
    }
    return rtod(y);
  };

  root.dacs = function(num) {
    var y;
    if (num > 1) num = 1;
    if (num < -1) num = -1;
    if (num === 1) {
      y = 0;
    } else {
      y = 1.570796327 - Math.atan(num / Math.sqrt(-1 * num * num + 1));
    }
    return rtod(y);
  };

  deg = function(a) {
    var a1, a2, a3, mm, sign, ss;
    sign = 1;
    if (a < 0) {
      a = -1 * a;
      sign = -1;
    }
    a1 = intr(a);
    mm = (a - a1) * 100;
    mm = rnd(mm, 6);
    a2 = intr(mm);
    ss = (mm - a2) * 100;
    ss = rnd(ss, 6);
    a3 = ss;
    return sign * (a1 + a2 / 60 + a3 / 3600);
  };

  dms = function(a) {
    var a1, a2, a3, mm, sign, ss;
    sign = 1;
    if (a < 0) {
      a = -1 * a;
      sign = -1;
    }
    a1 = intr(a);
    mm = (a - a1) * 60;
    mm = rnd(mm, 6);
    a2 = intr(mm);
    ss = (mm - a2) * 60;
    ss = rnd(ss, 6);
    a3 = intr(ss);
    return sign * (a1 + a2 / 100 + a3 / 10000);
  };

  root.DMST = function(x) {
    var hr, mn, sc, temp, tmp;
    temp = dms(Math.abs(x));
    hr = intr(temp);
    temp = (temp - hr) * 100;
    temp = rnd(temp, 6);
    mn = intr(temp);
    temp = (temp - mn) * 100;
    temp = rnd(temp, 6);
    if (mn < 10) mn = "0" + mn;
    sc = intr(temp);
    if (sc < 10) sc = "0" + sc;
    tmp = sgn(x) === -1 ? "-" : "";
    return tmp + hr + ":" + mn + ":" + sc;
  };

  doy = function(dte) {
    var dy, j, mo, y, _ref;
    j = 0;
    for (mo = 1, _ref = dte.getMonth() + 1; 1 <= _ref ? mo <= _ref : mo >= _ref; 1 <= _ref ? mo++ : mo--) {
      dy = 31;
      if (mo === 2) {
        dy = 28;
        y = dte.getYear() + 1900;
        if (y >= 3900) y = y - 1900;
        if (intr(y / 4) === y / 4) dy = 29;
      }
      if (mo === 4 || mo === 6 || mo === 9 || mo === 11) dy = 30;
      j = j + dy;
    }
    return j + dte.getDate();
  };

  root.ut = function(dte, zone) {
    var ut, ut_flag;
    ut = dte.getHours() + dte.getMinutes() / 100 + dte.getSeconds() / 10000;
    ut = deg(ut) + zone;
    ut_flag = 0;
    if (ut > 24) {
      ut = ut - 24;
      ut_flag = 1;
    }
    return rnd(ut, 4);
  };

  precess = function(dte) {
    var p, r, s, t, y;
    y = dte.getYear() + 1900;
    if (y >= 3900) y = y - 1900;
    p = y - 1;
    r = intr(p / 100);
    s = 2 - r + intr(r / 4);
    t = intr(365.25 * p);
    r = (s + t - 693597.5) / 36525;
    s = 6.646 + 2400.051 * r;
    return 24 - s + (24 * (y - 1900));
  };

  nutation = function(dte) {
    var ad, ar, dec, k, l, mm, r, ra, y;
    y = dte.getYear() + 1900;
    if (y >= 3900) y = y - 1900;
    mm = (y - epoch) / 360000;
    r = (epoch - 1900) / 100;
    k = 4608.5 + 2.8 * r;
    l = 2004.7 - .8 * r;
    ar = (k + l * dsin(ra) * dtan(dec)) * mm;
    ad = (l * dcos(ra)) * mm;
    ra = ra + ar;
    return dec = dec + ad;
  };

  sideral = function(dte, zone, lon) {
    var gst, lst, uct, ut_flag;
    ut_flag = 0;
    uct = ut(dte, zone);
    gst = (doy(dte) + ut_flag) * .0657098 - precess(dte) + uct * 1.002738;
    if (gst > 24) gst = gst - 24;
    if (gst < 0) gst = gst + 24;
    lst = gst + lon / 15;
    if (lst > 24) lst = lst - 24;
    if (lst < 0) lst = lst + 24;
    return lst;
  };

  root.az_al = function(dte, zone, lon, lat, ra, dec) {
    var al, az, j, s;
    if (epoch !== 2000) nutation(dte);
    s = calcLST() - ra;
    if (s < 0) s = s + 24;
    s = 15 * s;
    j = dsin(dec) * dsin(lat) + dcos(dec) * dcos(lat) * dcos(s);
    al = dasn(j);
    j = (dsin(dec) - dsin(lat) * dsin(al)) / (dcos(lat) * dcos(al));
    az = dacs(j);
    j = dsin(s);
    if (j > 0) az = 360 - az;
    return [az, al];
  };

  root.ra_dec = function(dte, zone, lon, lat, az, al) {
    var dec, j, ra, s;
    j = dsin(al) * dsin(lat) + dcos(al) * dcos(lat) * dcos(az);
    dec = dasn(j);
    j = (dsin(al) - dsin(lat) * dsin(dec)) / (dcos(lat) * dcos(dec));
    s = dacs(j);
    j = dsin(az);
    if (j > 0) s = 360 - s;
    ra = calcLST() - s / 15;
    if (ra < 0) ra = ra + 24;
    return [ra, dec];
  };

}).call(this);

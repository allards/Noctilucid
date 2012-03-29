/* inspired by: http://www.iiap.res.in/people/personnel/reks/software/javascript/calclst.php */
/* Some variables are global */
var day = 0;
var month = 0;
var year = 0;
var hr = 0;
var lst = 0;
var tzone = -4.0;
var lon = 79.38;
var hemi = "W";
var lsign = 1;
function setSysTime()
{
    var sysTime = new Date();
    hr          = sysTime.getHours() + sysTime.getMinutes()/60.0;
    month       = sysTime.getMonth() + 1;
    day         = sysTime.getDate();
    year        = sysTime.getFullYear();
    if (tzone < 0.0)
    {
        hemi = "W";
        lsign = -1;
    }
    else
    {
        hemi = "E";
        lsign = 1;
    }
}
function calcLST()
{
    setSysTime();
    var ut  = modDay(hr - tzone);
    var dno = getDayno2K(year, month, day, hr);
    var ws  = mod2pi(282.9404 + 4.70935*Math.pow(10.0, -5)*dno);
    var ms  = mod2pi(356.0470 + 0.9856002585*dno);
    var meanlong = mod2pi(ms + ws);
    var gmst0 = (meanlong)/15.0;
    lst       = modDay(gmst0 + ut + lsign*lon/15.0) + 11.0 + 56.0/60.0;
    if (lst >= 24.0) lst = lst - 24.0;
    return lst;
}

function getDayno2K(yy, mm, dd, hr)
{
    var jd = julianDay(yy, mm, dd, hr);
    return parseFloat(jd) - 2451543.5;
}
function modDay(val)
{
    var b = val/24.0;
    var a = 24.0*(b - absFloor(b));
    if (a < 0) a = a + 24.0;
    return a;
}
function absFloor(val)
{
    if (val >= 0.0) return Math.floor(val);
    else return Math.ceil(val);
}
function mod2pi(angle)
{
    var b = angle/360.0;
    var a = 360.0*(b - absFloor(b));
    if (a < 0) a = 360.0 + a;
    return a;
}
function getDaysinMonth(mm, yy)
{
    mm = parseFloat(mm);
    yy = parseFloat(yy);
    var ndays = 31;
    if ((mm == 4)||(mm == 6)||(mm == 9)||(mm == 11)) ndays = 30;
    if  (mm == 2)
    {
        ndays = 28;
        if ((yy %   4) == 0) ndays = 29;
        if ((yy % 100) == 0) ndays = 28;
        if ((yy % 400) == 0) ndays = 29;
    }
    return ndays;
}
function julianDay(yy, mm, dd, hh)
{
    mm = parseFloat(mm);
    yy = parseFloat(yy);
    dd = parseFloat(dd);
    hh = parseFloat(hh);
    var extra = (100.0*yy + mm) - 190002.5;
    var jday  = 367.0*yy;
    jday -= Math.floor(7.0*(yy+Math.floor((mm+9.0)/12.0))/4.0);
    jday += Math.floor(275.0*mm/9.0);
    jday += dd;
    jday += hh/24.0;
    jday += 1721013.5;
    jday -= 0.5*extra/Math.abs(extra);
    jday += 0.5;
    return jday;
}


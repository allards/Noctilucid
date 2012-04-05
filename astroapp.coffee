$(document).bind("mobileinit", (
    $.mobile.touchOverflowEnabled = true
    )
)

$(window).ready () ->

    az = 181.92
    alt = 29.58
    ra = 0
    dec = 0
    back = uiNavDSC
    $('#alt').text(rnd(alt,1).toString())
    $('#az').text(rnd((az),1).toString())

    moveSwitch = (query, toggle) ->
        slider = $(query)
        if toggle
            slider[0].selectedIndex = 0
        else
            slider[0].selectedIndex = 1
        slider.slider("refresh")

    switchValue = (query) ->
        slider = $(query)
        if slider[0].selectedIndex == 0
            return true
        else
            return false
    
    getOptions = () ->
        options = localStorage.getItem('options')
        if options
            options = JSON.parse(localStorage.getItem('options'))
            moveSwitch '#dark-vision', options.darkvision
            moveSwitch '#include-dnbl', options.darkNebula
            moveSwitch '#include-unknown', options.unknownMagnitude
            $('#field-nearby').val(options.nearByField).slider('refresh')            	    
            $('#limiting-magnitude').val(options.limitingMagnitude).slider('refresh')            	    
        else
            options = {}
            options.darkvision = true
            options.lon = 0.0
            options.lat = 0.0
            options.darkNebula = true
            options.unknownMagnitude = true
            options.limitingMagnitude = 8
            options.nearByField = 15
            moveSwitch '#dark-vision', true
            moveSwitch '#include-dnbl', false
            moveSwitch '#include-unknown', false
            localStorage.setItem('options', JSON.stringify(options))
        return options
    	
    saveOptions = () ->
        localStorage.setItem('options', JSON.stringify(options))

    options = getOptions()
    if not options.darkvision
        $('#theme-css').attr('href', 'jquery.mobile-1.0.1.css')    
    lon = options.lon
    lat = options.lat

    
    dte = new Date()
    dst = (dte.getTimezoneOffset() / 60) - (getStandardTimezoneOffset() / 60)
    zone = (dte.getTimezoneOffset() / 60) - dst
    tzone = dst + zone

    handlePositionError = (error) ->
        switch error
            when error.PERMISSION_DENIED then message = 'Permission denied'
            when error.POSITION_UNAVAILABLE then message = 'Position unavailable'
            when error.TIMEOUT then message = 'GPS timeout'
            else message = 'unknown error'
        message = 'Location: ' + message
        $('#lat').text(message)
        $('#lon').text('')

    handlePositionFound = (position) ->
        lat = position.coords.latitude
        lon = position.coords.longitude
        $('#lat').text(lat.toString())
        $('#lon').text(lon.toString())
        options.lat = lat
        options.lon = lon

    getGPS = () ->    
        if navigator.geolocation
            # get location
            navigator.geolocation.getCurrentPosition(handlePositionFound, handlePositionError)
        else
            $('#lat').text('GPS not enabled')
            $('#lon').text('')
    
    getGPS()
    
    updateTime = () ->    
        dte = new Date()
        timestamp = dateFormat(dte, "longTime", true); # this is a UTC date
        # see also: http://blog.stevenlevithan.com/archives/date-time-format
        $('#timestamp').text(timestamp)
        setTimeout(updateTime, 5000)
    
    updateTime()
    
    updateRaDec = () ->
        azFromSouth = az + 180
        if azFromSouth > 360
            azFromSouth = azFromSouth - 360
        rd = ra_dec(dte, zone, lon, lat, az, alt)
        ra = rd[0]
        dec = rd[1]
        raString = DMST(ra)
        decString = DMST(dec)
        $('#ra').html(raString)
        $('#dec').html(decString.replace(':','&deg;'))
        setTimeout(updateRaDec, 30000)
    
    updateRaDec()

    handleMotion = (event) ->

        if event.webkitCompassHeading
            # this only works in iOS5 and up...
            az = event.webkitCompassHeading + window.orientation
            console.log 'ori:', window.orientation
            accuracy = event.webkitCompassAccuracy
            if accuracy == -1
                $('#compass-accuracy').text('Compass inaccurate, needs calibration')
            else
                $('#compass-accuracy').text('+/-' + rnd(accuracy,2).toString() + ' degrees')
        else
            az = 360 - event.alpha
        alt = event.beta

        $('#alt').text(rnd(alt,2).toString())
        $('#az').text(rnd((az),2).toString())
        updateRaDec()
    
    if window.DeviceOrientationEvent
        window.addEventListener('deviceorientation', handleMotion)  
    
    filterObject = (o) ->
        if o.typ == "DRKNB" and options.darkNebula
            return true
        if o.mag == 99.9 and options.unknownMagnitude
            return true
        if o.mag <= options.limitingMagnitude
            return true
        return false
    
    dbFindByNumber = (needle) ->
        results = []
        i = 0
        for o in dsDbJSON
            if filterObject(o)
                name = []
                name[0] = o.obj
                if o.oth?
                    other = o.oth.split(";")
                    name = name.concat(other)
                for n in name
                    # if n[0..2] == "ESO" or n[0..2] == "MCG"
                    #     break
                    num = n.match(/\d+/g)
                    if num and needle in num                  
                            results.push(i)
            i++
            if results.length > 99
                break
        return results
      
    distance = (o) ->
        # using Spherical Law of Cosines from: http://www.movable-type.co.uk/scripts/latlong.html
        lat1 = ra * 15
        lon1 = dec
        lat2 = o.ra * 15
        lon2 = o.dec
        dacs(dsin(lat1)*dsin(lat2) + dcos(lat1)*dcos(lat2) * dcos(lon2-lon1)) * 1;
        
    dsSortByD = (a, b) ->
        return a.d - b.d

    findNearBy = () ->
        results = []
        i = 0
        maxD = options.nearByField / 2
        for o in dsDbJSON
            if filterObject(o)
                d = distance(o)
                if d < maxD
                    o.d = d
                    o.number = i
                    results.push(o)
            i++
        results.sort(dsSortByD)
        return results
        
    class ReprObj
        constructor: (obj) ->
            @obj = obj
            if @obj.oth?
                @name = @obj.obj + ', ' + @obj.oth.replace(';', ', ')
            else
                @name = @obj.obj
            @mag = @obj.mag
            if @obj.mag == 99.9
                @mag = 'unknown'
            if @obj.mag == 79.9
                @mag = 'dark nebula'
            @constelation = constelations[obj.con]
            @type = types[@obj.typ]
        setAsTarget: () ->
            $('#ra-obj').html(DMST(@obj.ra))
            decString = DMST(@obj.dec)
            decString.replace(':','&deg;')
            $('#dec-obj').html(decString)
            azal = az_al(dte, zone, lon, lat, @obj.ra, @obj.dec)
            $('#alt-obj').html(rnd(azal[1],2))
            $('#az-obj').html(rnd(azal[0],2))
            $('#target').html('<br /><b>' + @obj.obj + '</b>')
            $('#show-target-object').attr('objectnumber', @obj.number)
            console.log $('#show-target-object .ui-btn-text')
            $('#show-target-object').show()
        listView: () ->
            if options.darkvision
                html = '<li data-theme="a" data-icon="false"><a href="" class="linkToObject" objectNumber="'+ @obj.number + '"><p><strong>' + @name + '</p></strong><p>' + @type + ' in ' + @constelation + ' (' + @mag + ')</p></a></li>'
            else
                html = '<li data-theme="c"><a href="" class="linkToObject" objectNumber="'+ @obj.number + '"><p><strong>' + @name + '</p></strong><p>' + @type + ' in ' + @constelation + ' (' + @mag + ')</p></a></li>'
            return html
        detailView: () ->
            html =  '<strong>' + @name + '</strong><br />'

            html += @type + ' in ' + @constelation + ' (Magnitude: ' + @mag + ')<br />'
            if @obj.bchm?
                bchm = []
                console.log @obj.bchm
                for cat in @obj.bchm
                    if additionalCatalogs[cat]
                        bchm.push(additionalCatalogs[cat])
                        console.log cat, additionalCatalogs[cat], bchm
                html += 'Also in: ' + bchm.join(', ') + '<br />'
            html += '<br />'
            if @obj.d?
                html += 'Distance from where you are now: ' + rnd(@obj.d, 2) + ' degrees<br />'
            else
                html += 'Distance from where you are now: ' + rnd(distance(@obj), 2) + ' degrees<br />'
            if @obj.ra?
                html += 'RA: ' + DMST(@obj.ra) + '<br />'
            if @obj.dec?
                decString = DMST(@obj.dec)
                decString.replace(':','&deg;')
                html += 'Dec: ' + decString + '<br />'
            azal = az_al(dte, zone, lon, lat, @obj.ra, @obj.dec)
            html += 'Azimuth: ' + rnd(azal[0],2) + '<br />'
            html += 'Altitude: ' + rnd(azal[1],2) + '<br />'
            html += '<br />'
            if @obj.sub?
                if @obj.sub not in [79.9, 99.9]
                    html += 'Surface brightness: ' + @obj.sub + '<br />'
            if @obj.smin?
                html += 'Minimal dimension: ' + @obj.smin + '<br />'
            if @obj.smax?
                html += 'Maximum dimension: ' + @obj.smax + '<br />'
            if @obj.pa?
                html += 'Position angle degrees from North: ' + @obj.pa + '<br />'
            if @obj.cls?
                html += 'Object class: ' + @obj.cls + '<br />'
            if @obj.nsts?
                html += 'Number of stars: ' + @obj.nsts + '<br />'
            if @obj.brts?
                html += 'Magnitude brightest star: ' + @obj.brts + '<br />'
            if @obj.ngcd?
                html += 'NGC description: ' + @obj.ngcd + '<br />'
            if @obj.notes?
                html += 'Notes: ' + @obj.notes + '<br />\n'
            return html
    
    uiFindNearBy = () ->
        $('#object-list').empty()
        goToPage('page-nearby-listing')
        results = findNearBy()
        if results
            for r in results
                o = new ReprObj (r)
                $('#object-list').append(o.listView())
                $('#object-list').listview("refresh")
        else
            $('#page-nearby-listing').html('No object found nearby. Consider opening up the limiting magnitude and field considered near by in the settings')
                      
    uiNavDSC = () ->
        $('div.ui-content').hide()
        $('#page-DSC').show()
        $('#back').hide()
        $('#header').text('DSC')
        
    allCats = {}
    $.extend(allCats, catalogs, additionalCatalogs)
    for abr, cat of allCats
        if options.darkvision
            html = '<li data-theme="a" data-icon="false"><a href="" class="catalogLink" catalog="'+ abr + '"><p>' + abr + ': ' + cat + '</p></a></li>'
        else
            html = '<li data-theme="c" data-icon="false"><a href="" class="catalogLink" catalog="'+ abr + '"><p>' + abr + ': ' + cat + '</p></a></li>'
        $('#catalog-list').append(html)
        $('#catalog-list').listview("refresh")

    for abr, con of constelations
        if options.darkvision
            html = '<li data-theme="a" data-icon="false"><a href="" class="constelationLink" constelation="'+ abr + '"><p>' + con + '</p></a></li>'
        else
            html = '<li data-theme="c" data-icon="false"><a href="" class="constelationLink" constelation="'+ abr + '"><p>' + con + '</p></a></li>'
        $('#constelation-list').append(html)
        $('#constelation-list').listview("refresh")

    for abr, type of types
        if options.darkvision
            html = '<li data-theme="a" data-icon="false"><a href="" class="typeLink" type="'+ abr + '"><p>' + type + '</p></a></li>'
        else
            html = '<li data-theme="c" data-icon="false"><a href="" class="typeLink" type="'+ abr + '"><p>' + type + '</p></a></li>'
        $('#type-list').append(html)
        $('#type-list').listview("refresh")

    uiNavObjects = () ->
        $('div.ui-content').hide()
        if searchResults
            $('#page-results').show()
            backPage = 'page-types'
            $('#back').show()
        else
            $('#page-Objects').show()
            $('#back').hide()
        $('#header').text('Objects')

    uiNavLog = () ->
        $('.ui-content').hide()
        $('#page-Log').show()
        $('#back').hide()
        $('#header').text('Log')      
                   
    uiNavSettings = () ->
        $('.ui-content').hide()
        $('#page-Settings').show()
        $('#back').hide()
        $('#header').text('Settings')

    uiDarkVision = () ->
        options.darkvision = switchValue('#dark-vision')
        if options.darkvision
            $('#theme-css').attr('href', 'themes/nocturnal.css')
            $('#object-list').attr('data-theme','a')
        else
            $('#theme-css').attr('href', 'jquery.mobile-1.0.1.css')
            $('#object-list').attr('data-theme','c')
        saveOptions()
    
    uiDarkNebula = () ->
        options.darkNebula = switchValue('#include-dnbl')
        saveOptions()
    
    uiUnknownMagnitude = () ->
        options.unknownMagnitude = switchValue('#include-unknown')
        saveOptions()
    
    uiNearByField = () ->
        options.nearByField = $('#field-nearby').val()
        saveOptions()
    
    uiLimitingMagnitude = () ->
        options.limitingMagnitude = $('#limiting-magnitude').val()
        saveOptions()
    
    uiGoBack = () ->
        console.log backPage
        goToPage(backPage)
        # if back?
        #     back()
    
    # global var containing id of page to go back to
    backPage = 'page-DSC'
    
    goToPage = (page) ->
        fromPage = $('[data-role=content]').filter(':visible')
        fromPage.hide()
        console.log 'in goToPage: ', fromPage, page
        switch page
            when 'page-nearby-listing' then backPage = 'page-DSC'
            when 'page-constelations' then backPage = 'page-Objects'
            when 'page-types' then backPage = 'page-constelations'
            when 'page-results' then backPage = 'page-types'
            else backPage =  fromPage.attr('id')
        if page in ['page-DSC', 'page-Objects', 'page-Settings', 'page-Log']
            $('#back').hide()
        else
            $('#back').show()        
        toPage = '#' + page
        $('#header').html($(toPage).attr('data-header'))
        $(toPage).show()
    
    activeObject = '' # global
    
    uiShowObject = (event) ->
        goToPage ('page-object')
        activeObject = parseInt($(this).attr('objectnumber'))
        object = dsDbJSON[activeObject]
        o = new ReprObj (object)
        $('#object-holder').html(o.detailView())
        $('#make-target').attr('objectnumber',activeObject)
        
    uiLogObject = () ->
        console.log 'in uiLogObject'
        
    uiMakeTarget = () ->
        activeObject = parseInt($(this).attr('objectnumber'))
        object = dsDbJSON[activeObject]
        o = new ReprObj (object)
        o.setAsTarget()
        goToPage('page-DSC')
            
    selectedCatalog = 'ALL'
    selectedType = 'ALL'
    selectedConstelation = 'ALL'
    console.log selectedCatalog, selectedConstelation, selectedType
    
    uiSelectConstelation = (event) ->
        goToPage('page-constelations')
        console.log 'in uiSelectConstelation', $(this)
        selectedCatalog = $(this).attr('catalog')
        console.log selectedCatalog, selectedConstelation, selectedType
        $('#search-help-constelations').text(allCats[selectedCatalog])
        
    uiSelectType = (event) ->
        goToPage('page-types')
        selectedConstelation = $(this).attr('constelation')
        console.log $(this)
        console.log selectedCatalog, selectedConstelation, selectedType
        $('#search-help-types').text(allCats[selectedCatalog] + ' > ' + constelations[selectedConstelation])
        
    
    searchResults = false
    
    uiShowResults = (event) ->
        goToPage('page-results')
        selectedType = $(this).attr('type')
        console.log $(this)
        console.log selectedCatalog, selectedConstelation, selectedType
        results = []
        i = 0
        for o in dsDbJSON
            if filterObject(o)
                if selectedType == 'ALL' or o.typ == selectedType
                    if selectedConstelation == 'ALL' or o.con == selectedConstelation
                        if selectedCatalog == 'ALL' or o.obj.indexOf(selectedCatalog) or o.oth.indexOf(selectedCatalog)
                            o.number = i
                            results.push(o)
            i++
        if results
            for r in results
                o = new ReprObj (r)
                $('#result-list').append(o.listView())
                $('#result-list').listview("refresh")
        $('#search-help-results').text(allCats[selectedCatalog] + ' > ' + constelations[selectedConstelation] + ' > ' + types[selectedType] + ' > Found: ' + results.length.toString() )
        searchResults = true
         
    $('#nav-DSC').bind('click', uiNavDSC)
    $('#nav-Objects').bind('click', uiNavObjects)
    $('#nav-Log').bind('click', uiNavLog)
    $('#nav-Settings').bind('click', uiNavSettings)
    
    $('#find-near-by').bind('click',uiFindNearBy)
    $('#dark-vision').bind('change',uiDarkVision)
    $('#include-dnbl').bind('change',uiDarkNebula)    
    $('#include-unknown').bind('change',uiUnknownMagnitude)    
    $('#field-nearby').bind('change',uiNearByField)    
    $('#limiting-magnitude').bind('change',uiLimitingMagnitude)
    $('#back').bind('click', uiGoBack)  
    # $("#aside1").delegate("div.person-block", 'click', uiGetProfile)
    $('body').delegate('a.linkToObject', 'click', uiShowObject)
    $('body').delegate('a.catalogLink', 'click', uiSelectConstelation)
    $('body').delegate('a.constelationLink', 'click', uiSelectType)
    $('body').delegate('a.typeLink', 'click', uiShowResults)
    
    $('#log-object').bind('click', uiLogObject)
    $('#make-target').bind('click', uiMakeTarget)
    $('#show-target-object').bind('click', uiShowObject)


additionalCatalogs = {
    "B":"Best of the NGC from SAC",
    "C":"Caldwell catalog",
    "H":"Herschel 400 from Astronomical League",
    "M":"Messier"
}

catalogs = {
    "ALL":"All catalogs",
    "3C":"Third Cambridge Catalog of Radio Wave Sources",
    "Abell":"George Abell (planetary nebulae and galaxy clusters)",
    "ADS":"Aitken Double Star catalog",
    "AM":"Arp-Madore (globular clusters)",
    "Antalova":"(open clusters)",
    "Ap":"Apriamasvili (planetary nebulae)",
    "Arp":"Halton Arp (interacting galaxies)",
    "Bark":"Barkhatova (open clusters)",
    "B":"Barnard (dark nebulae)",
    "Basel":"(open clusters)",
    "BD":"Bonner Durchmusterung (stars)",
    "Berk":"Berkeley (open clusters)",
    "Be":"Bernes (dark nebulae)",
    "Biur":"Biurakan (open clusters)",
    "Blanco":"(open clusters)",
    "Bochum":"(open clusters)",
    "Ced":"Cederblad (bright nebulae)",
    "CGCG":"Catalog of Galaxies and Clusters of Galaxies",
    "Cr":"Collinder (open clusters)",
    "Czernik":"(open clusters)",
    "DDO":"David Dunlap Observatory (dwarf galaxies)",
    "Do":"Dolidze (open clusters)",
    "DoDz":"Dolidze-Dzimselejsvili (open clusters)",
    "Dun":"Dunlop (Southern objects of all types)",
    "ESO":"European Southern Observatory (Southern objects)",
    "Fein":"Feinstein (open clusters)",
    "Frolov":"(open clusters)",
    "Gum":"(bright nebulae)",
    "H":"William Herschel (globular clusters)",
    "Haffner":"(open clusters)",
    "Harvard":"(open clusters)",
    "Hav-Moffat":"Havermeyer and Moffat (open clusters)",
    "He":"Henize (planetary nebulae)",
    "Hogg":"(open clusters)",
    "Ho":"Holmberg (galaxies)",
    "HP":"Haute Provence (globular clusters)",
    "Hu":"Humason (planetary nebulae)",
    "IC":"1st and 2nd Index Catalogs to the NGC (All types of objects except dark nebulae)",
    "Isk":"Iskudarian (open clusters)",
    "J":"Jonckheere (planetary nebulae)",
    "K":"Kohoutek (planetary nebulae)",
    "Kemble":"Father Lucian Kemble (asterisms)",
    "King":"(open clusters)",
    "Kr":"Krasnogorskaja (planetary nebulae)",
    "Lac":"Lacaille (globular clusters)",
    "Loden":"(open clusters)",
    "LBN":"Lynds (bright nebula)",
    "LDN":"Lynds (dark nebulae)",
    "NPM1G":"Northern Proper Motion, 1st part, Galaxies",
    "Lynga":"(open clusters)",
    "M":"Messier (all types of objects except dark nebula)",
    "MCG":"Morphological Catalog of Galaxies",
    "Me":"Merrill (plantary nebulae)",
    "Mrk":"Markarian (open clusters and galaxies)",
    "Mel":"Melotte (open clusters)",
    "M1 thru M4":"Minkowski (planetary nebulae)",
    "New":"'New' galaxies in the Revised Shapley-Ames Catalog",
    "NGC":"New General Catalog of Nebulae & Clusters of Stars. (All types of objects except dark nebulae)",
    "Pal":"Palomar (globular clusters)",
    "PB":"Peimbert and Batiz (planetary nebulae)",
    "PC":"Peimbert and Costero (planetary nebulae)",
    "Pismis":"(open clusters)",
    "PK":"Perek & Kohoutek (planetary nebulae)",
    "RCW":"Rodgers, Campbell, & Whiteoak (bright nebulae)",
    "Roslund":"(open clusters)",
    "Ru":"Ruprecht (open clusters)",
    "Sa":"Sandqvist (dark nebulae)",
    "Sher":"(open clusters)",
    "Sh":"Sharpless (bright nebulae)",
    "SL":"Sandqvist & Lindroos (dark nebulae)",
    "SL":"Shapley & Lindsay (clusters in LMC)",
    "Steph":"Stephenson (open clusters)",
    "Stock":"(open clusters)",
    "Ter":"Terzan (globular clusters)",
    "Tombaugh":"(open clusters)",
    "Ton":"Tonantzintla (globular clusters)",
    "Tr":"Trumpler (open clusters)",
    "UGC":"Uppsala General Catalog (galaxies)",
    "UGCA":"Uppsala General Catalog, Addendum (galaxies)",
    "UKS":"United Kingdom Schmidt (globular clusters)",
    "Upgren":"(open clusters)",
    "V V":"Vorontsov-Velyaminov (interacting galaxies)",
    "vdB":"van den Bergh (open clusters, bright nebulae)",
    "vdBH":"van den Bergh & Herbst (bright nebulae)",
    "vdB-Ha":"van den Bergh-Hagen (open clusters)",
    "Vy":"Vyssotsky (planetary nebulae)",
    "Waterloo":"(open clusters)",
    "Winnecke":"Double Star (Messier 40)",
    "ZwG":"Zwicky (galaxies)"
};

types = {
    "ALL":"All types of objects",
    "BRTNB":"Bright Nebula",
    "CL+NB":"Cluster with Nebulosity",
    "DRKNB":"Dark Nebula",
    "GALCL":"Galaxy cluster",
    "GALXY":"Galaxy",
    "GLOCL":"Globular Cluster",
    "GX+DN":"Diffuse Nebula in a Galaxy",
    "GX+GC":"Globular Cluster in a Galaxy",
    "G+C+N":"Cluster with Nebulosity in a Galaxy",
    "LMCCN":"Cluster with Nebulosity in the LMC",
    "LMCDN":"Diffuse Nebula in the LMC",
    "LMCGC":"Globular Cluster in the LMC",
    "LMCOC":"Open cluster in the LMC",
    "NONEX":"Nonexistent",
    "OPNCL":"Open Cluster",
    "PLNNB":"Planetary Nebula",
    "SMCCN":"Cluster with Nebulosity in the SMC",
    "SMCDN":"Diffuse Nebula in the SMC",
    "SMCGC":"Globular Cluster in the SMC",
    "SMCOC":"Open cluster in the SMC",
    "SNREM":"Supernova Remnant",
    "QUASR":"Quasar",
    "1STAR":"1 Star",
    "2STAR":"2 Stars",
    "3STAR":"3 Stars",
    "4STAR":"4 Stars"
    "8STAR":"8 Stars"
}


constelations = {
    "ALL":"All constelations",
    "AND":"Andromeda",
    "ANT":"Antlia",
    "APS":"Apus",
    "AQR":"Aquarius",
    "AQL":"Aquila",
    "ARA":"Ara",
    "ARI":"Aries",
    "AUR":"Auriga",
    "BOO":"Bootes",
    "CAE":"Caelum",
    "CAM":"Camelopardalis",
    "CNC":"Cancer",
    "CVN":"Canes Venatici",
    "CMA":"Canis Major",
    "CMI":"Canis Minor",
    "CAP":"Capricornus",
    "CAR":"Carina",
    "CAS":"Cassiopeia",
    "CEN":"Centaurus",
    "CEP":"Cepheus",
    "CET":"Cetus",
    "CHA":"Chamaeleon",
    "CIR":"Circinus",
    "COL":"Columba",
    "COM":"Coma Berenices",
    "CRA":"Corona Australis",
    "CRB":"Corona Borealis",
    "CRV":"Corvus",
    "CRT":"Crater",
    "CRU":"Crux",
    "CYG":"Cygnus",
    "DEL":"Delphinus",
    "DOR":"Dorado",
    "DRA":"Draco",
    "EQU":"Equuleus",
    "ERI":"Eridanus",
    "FOR":"Fornax",
    "GEM":"Gemini",
    "GRU":"Grus",
    "HER":"Hercules",
    "HOR":"Horologium",
    "HYA":"Hydra",
    "HYI":"Hydrus",
    "IND":"Indus",
    "LAC":"Lacerta",
    "LEO":"Leo",
    "LMI":"Leo Minor",
    "LEP":"Lepus",
    "LIB":"Libra",
    "LUP":"Lupus",
    "LYN":"Lynx",
    "LYR":"Lyra",
    "MEN":"Mensa",
    "MIC":"Microscopium",
    "MON":"Monoceros",
    "MUS":"Musca",
    "NOR":"Norma",
    "OCT":"Octans",
    "OPH":"Ophiuchus",
    "ORI":"Orion",
    "PAV":"Pavo",
    "PEG":"Pegasus",
    "PER":"Perseus",
    "PHE":"Phoenix",
    "PIC":"Pictor",
    "PSC":"Pisces",
    "PSA":"Pisces Austrinus",
    "PUP":"Puppis",
    "PYX":"Pyxis",
    "RET":"Reticulum",
    "SGE":"Sagitta",
    "SGR":"Sagittarius",
    "SCO":"Scorpius",
    "SCL":"Sculptor",
    "SCT":"Scutum",
    "SER":"Serpens",
    "SEX":"Sextans",
    "TAU":"Taurus",
    "TEL":"Telescopium",
    "TRA":"Triangulum Australe",
    "TRI":"Triangulum",
    "TUC":"Tucana",
    "UMA":"Ursa Major",
    "UMI":"Ursa Minor",
    "VEL":"Vela",
    "VIR":"Virgo",
    "VOL":"Volans",
    "VUL":"Vulpecula"
}

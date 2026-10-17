export const CAR_MAKES = [
  "Acura","Alfa Romeo","AMC","Aston Martin","Audi","Austin","BMW","Buick","Cadillac",
  "Chevrolet","Chrysler","Daewoo","Daihatsu","Dodge","Eagle","Fiat","Ford","Geo","GMC","Honda",
  "Hummer","Hyundai","Infiniti","Isuzu","Jaguar","Jeep","Kia","Land Rover","Lexus",
  "Lincoln","Mazda","Mercedes-Benz","Mercury","Mini","Mitsubishi","Nissan","Oldsmobile",
  "Opel","Peugeot","Plymouth","Pontiac","Porsche","Renault","Saab","Saturn","Scion",
  "Subaru","Suzuki","Toyota","Triumph","Volkswagen","Volvo"
]

export const CAR_MODELS: Record<string, string[]> = {
  "Acura": ["CL","CSX","EL","ILX","Integra","Legend","MDX","NSX","RDX","RL","RLX","RSX","SLX","TL","TLX","TSX","Vigor","ZDX"],
  "Alfa Romeo": ["147","156","159","164","166","4C","Giulia","Giulietta","GTV","MiTo","Spider","Stelvio","Tonale"],
  "AMC": ["AMX","Concord","Eagle","Gremlin","Hornet","Javelin","Matador","Pacer","Rambler","Spirit"],
  "Aston Martin": ["DB7","DB9","DB11","DBS","Rapide","V8 Vantage","V12 Vantage","Vanquish","Virage","Zagato"],
  "Audi": ["80","90","100","200","A3","A4","A5","A6","A7","A8","Allroad","Cabriolet","Coupe","Q3","Q4 e-tron","Q5","Q7","Q8","R8","RS3","RS4","RS5","RS6","RS7","S3","S4","S5","S6","S7","S8","TT","e-tron","e-tron GT"],
  "Austin": ["A40","A55","Cambridge","Healey","Healey 100","Healey 3000","Marina","Maxi","Mini","Montego","Princess"],
  "BMW": ["128i","228i","230i","318i","320i","323i","325i","328i","330i","335i","340i","428i","430i","440i","525i","528i","530i","535i","540i","545i","550i","640i","645i","650i","740i","745i","750i","760i","840i","850i","M2","M3","M4","M5","M6","M8","X1","X2","X3","X4","X5","X6","X7","Z3","Z4","Z8","i3","i4","i8","iX"],
  "Buick": ["Century","Electra","Enclave","Encore","Encore GX","Envision","LaCrosse","LeSabre","Lucerne","Park Avenue","Rainier","Regal","Rendezvous","Riviera","Roadmaster","Skylark","Somerset","Terraza","Verano"],
  "Cadillac": ["Allante","ATS","Brougham","Catera","Cimarron","CT4","CT5","CT6","CTS","DeVille","DTS","Eldorado","Escalade","Escalade ESV","Escalade EXT","Fleetwood","Lyriq","Seville","SRX","STS","XT4","XT5","XT6","XTS","XLR"],
  "Chevrolet": ["Astro","Avalanche","Aveo","Beretta","Blazer","Bolt","Camaro","Caprice","Cavalier","Celebrity","Cobalt","Colorado","Corsica","Corvette","Cruze","El Camino","Epica","Equinox","Express","HHR","Impala","Lumina","Malibu","Metro","Monte Carlo","Nova","Optra","S-10","Silverado 1500","Silverado 2500","Silverado 3500","Sonic","Spark","Sprint","SSR","Suburban","Tahoe","Tracker","TrailBlazer","Traverse","Trax","Uplander","Venture"],
  "Chrysler": ["200","300","300M","Aspen","Cirrus","Concorde","Conquest","Crossfire","Fifth Avenue","Imperial","Intrepid","LeBaron","LHS","Neon","New Yorker","Pacifica","PT Cruiser","Sebring","Town & Country","Voyager"],
  "Daewoo": ["Lanos","Leganza","Matiz","Nubira","Tacuma"],
  "Dodge": ["Aries","Avenger","Caliber","Caravan","Challenger","Charger","Colt","D150","D250","D350","Dakota","Dart","Daytona","Durango","Dynasty","Grand Caravan","Intrepid","Journey","Magnum","Monaco","Neon","Nitro","Omni","RAM 1500","RAM 2500","RAM 3500","Ramcharger","Shadow","Spirit","Sprinter","Stealth","Stratus","Viper"],
  "Eagle": ["Medallion","Premier","Summit","Talon","Vision"],
  "Fiat": ["124 Spider","500","500L","500X","Brava","Bravo","Coupe","Panda","Punto","Strada","Tipo","Uno","X1/9"],
  "Ford": ["Aerostar","Aspire","Bronco","Bronco II","Bronco Sport","Contour","Crown Victoria","E-150","E-250","E-350","EcoSport","Edge","Escape","Escort","Excursion","Expedition","Explorer","Explorer Sport Trac","F-150","F-250","F-350","F-450","Festiva","Fiesta","Five Hundred","Flex","Focus","Freestar","Freestyle","Fusion","Galaxie","Granada","LTD","Maverick","Mustang","Pinto","Probe","Ranger","Taurus","Tempo","Thunderbird","Transit","Transit Connect","Windstar"],
  "Geo": ["Metro","Prizm","Spectrum","Storm","Tracker"],
  "GMC": ["Acadia","C1500","C2500","C3500","Canyon","Denali","Envoy","Jimmy","K1500","K2500","K3500","Safari","Savana","Sierra 1500","Sierra 2500","Sierra 3500","Sonoma","Suburban","Terrain","Typhoon","Yukon","Yukon XL"],
  "Honda": ["Accord","Civic","Clarity","CR-V","CR-Z","Crosstour","CRX","Del Sol","Element","Fit","HR-V","Insight","Odyssey","Passport","Pilot","Prelude","Prologue","Ridgeline","S2000"],
  "Hummer": ["H1","H2","H3","H3T"],
  "Hyundai": ["Accent","Azera","Elantra","Entourage","Excel","Genesis","Genesis Coupe","Ioniq","Ioniq 5","Ioniq 6","Kona","Palisade","Pony","Santa Cruz","Santa Fe","Scoupe","Sonata","Tiburon","Tucson","Veloster","Venue","XG300","XG350"],
  "Infiniti": ["EX35","EX37","FX35","FX37","FX45","FX50","G20","G25","G35","G37","I30","I35","J30","M30","M35","M37","M45","M56","Q40","Q45","Q50","Q60","Q70","QX4","QX30","QX50","QX55","QX56","QX60","QX70","QX80"],
  "Isuzu": ["Amigo","Ascender","Axiom","Hombre","i-280","i-290","i-350","i-370","Impulse","Oasis","Pickup","Rodeo","Rodeo Sport","Stylus","Trooper","VehiCROSS"],
  "Jaguar": ["E-Pace","F-Pace","F-Type","I-Pace","S-Type","Vanden Plas","X-Type","XE","XF","XJ","XJ6","XJ8","XJR","XJS","XK","XK8","XKR"],
  "Jeep": ["Cherokee","CJ","CJ-5","CJ-7","Commander","Compass","Gladiator","Grand Cherokee","Grand Cherokee L","Grand Wagoneer","J-10","J-20","Liberty","Patriot","Renegade","Scrambler","Wagoneer","Wrangler","Wrangler JK"],
  "Kia": ["Amanti","Borrego","Cadenza","Carnival","EV6","EV9","Forte","K5","K900","Magentis","Niro","Optima","Rio","Rondo","Sedona","Seltos","Sephia","Sorento","Soul","Spectra","Sportage","Stinger","Telluride"],
  "Land Rover": ["Defender","Discovery","Discovery Sport","Freelander","LR2","LR3","LR4","Range Rover","Range Rover Classic","Range Rover Evoque","Range Rover Sport","Range Rover Velar"],
  "Lexus": ["CT","ES","GS","GX","HS","IS","LC","LFA","LS","LX","NX","RC","RX","RZ","SC","TX","UX"],
  "Lincoln": ["Aviator","Blackwood","Continental","Corsair","LS","Mark III","Mark IV","Mark V","Mark VI","Mark VII","Mark VIII","Mark LT","MKC","MKS","MKT","MKX","MKZ","Nautilus","Navigator","Town Car","Zephyr"],
  "Mazda": ["2","3","5","6","323","626","929","B-Series","CX-3","CX-30","CX-5","CX-50","CX-7","CX-9","CX-90","GLC","Millenia","MPV","MX-3","MX-5 Miata","MX-6","Navajo","Protege","RX-3","RX-4","RX-7","RX-8","Tribute"],
  "Mercedes-Benz": ["190","A-Class","AMG GT","B-Class","C-Class","CL-Class","CLA","CLS","E-Class","EQB","EQC","EQE","EQS","G-Class","GL-Class","GLA","GLB","GLC","GLE","GLK","GLS","M-Class","Metris","R-Class","S-Class","SL","SLC","SLK","SLR","Sprinter"],
  "Mercury": ["Bobcat","Capri","Colony Park","Cougar","Grand Marquis","LN7","Lynx","Mariner","Marquis","Milan","Montego","Monterey","Mountaineer","Mystique","Sable","Topaz","Tracer","Villager"],
  "Mitsubishi": ["3000GT","Cordia","Diamante","Eclipse","Eclipse Cross","Endeavor","Expo","Galant","Lancer","Mighty Max","Mirage","Montero","Montero Sport","Outlander","Outlander Sport","Precis","Raider","Sigma","Starion","Tredia"],
  "Nissan": ["200SX","240SX","240Z","260Z","280Z","280ZX","300ZX","350Z","370Z","Altima","Armada","Cube","D21","Frontier","GT-R","Juke","Kicks","Leaf","Maxima","Murano","NV200","NX","Pathfinder","Pulsar","Quest","Rogue","Rogue Sport","Sentra","Stanza","Titan","Titan XD","Versa","Xterra"],
  "Oldsmobile": ["442","88","98","Achieva","Alero","Aurora","Bravada","Calais","Ciera","Cutlass","Cutlass Ciera","Cutlass Supreme","Delta 88","Firenza","Intrigue","Omega","Silhouette","Toronado"],
  "Plymouth": ["Acclaim","Arrow","Barracuda","Breeze","Caravelle","Colt","Duster","Fury","Gran Fury","Grand Voyager","GTX","Horizon","Laser","Neon","Prowler","Reliant","Road Runner","Satellite","Scamp","Sundance","Valiant","Volare","Voyager"],
  "Pontiac": ["6000","Aztek","Bonneville","Catalina","Fiero","Firebird","G3","G5","G6","G8","Grand Am","Grand Prix","GTO","J2000","LeMans","Montana","Phoenix","Solstice","Sunbird","Sunfire","Tempest","Torrent","Trans Am","Trans Sport","Vibe"],
  "Saab": ["9-2X","9-3","9-4X","9-5","9-7X","900","9000","96","99","Sonett"],
  "Saturn": ["Astra","Aura","Ion","L-Series","Outlook","Relay","S-Series","SC","Sky","SL","SW","VUE"],
  "Scion": ["FR-S","iA","iM","iQ","tC","xA","xB","xD"],
  "Subaru": ["Ascent","Baja","Brat","BRZ","Crosstrek","DL","Forester","GL","Impreza","Justy","Legacy","Loyale","Outback","Solterra","SVX","Tribeca","WRX","WRX STI","XT","XV Crosstrek"],
  "Suzuki": ["Aerio","Alto","Equator","Esteem","Forenza","Grand Vitara","Kizashi","Reno","Samurai","Sidekick","Swift","SX4","Verona","Vitara","X-90","XL-7"],
  "Toyota": ["4Runner","86","Avalon","C-HR","Camry","Celica","Corolla","Corolla Cross","Corona","Cressida","Crown","Echo","FJ Cruiser","GR86","GR Corolla","GR Supra","Highlander","Land Cruiser","Matrix","MR2","Paseo","Pickup","Previa","Prius","Prius Prime","RAV4","RAV4 Prime","Sequoia","Sienna","Solara","Starlet","Supra","T100","Tacoma","Tercel","Tundra","Van","Venza","Yaris"],
  "Volkswagen": ["Arteon","Atlas","Atlas Cross Sport","Beetle","Cabrio","Cabriolet","CC","Corrado","Dasher","Eos","Fox","Golf","Golf GTI","Golf R","ID.4","Jetta","Karmann Ghia","New Beetle","Passat","Phaeton","Quantum","Rabbit","Routan","Scirocco","Taos","Thing","Tiguan","Touareg","Vanagon"],
  "Volvo": ["122","142","144","164","240","242","244","245","262","264","740","745","760","780","850","940","960","C30","C40","C70","S40","S60","S70","S80","S90","V40","V50","V60","V70","V90","XC40","XC60","XC70","XC90"],
  "Daihatsu": ["Charade","Charmant","Cuore","Feroza","Hijet","Materia","Move","Rocky","Sirion","Terios","YRV"],
  "Mini": ["Clubman","Clubvan","Convertible","Cooper","Cooper S","Countryman","Coupe","Hardtop","John Cooper Works","Paceman","Roadster"],
  "Opel": ["Agila","Antara","Astra","Calibra","Cascada","Corsa","Crossland","Frontera","Grandland","Insignia","Kadett","Meriva","Mokka","Omega","Signum","Tigra","Vectra","Vivaro","Zafira"],
  "Peugeot": ["106","107","108","205","206","207","208","306","307","308","405","406","407","408","508","607","806","Expert","Partner","Traveller","2008","3008","4007","4008","5008"],
  "Porsche": ["356","911","912","914","918","924","928","930","944","959","962","968","Boxster","Carrera","Cayenne","Cayman","Macan","Panamera","Spyder","Taycan"],
  "Renault": ["4","5","9","11","12","14","18","19","21","25","Captur","Clio","Duster","Espace","Fluence","Kadjar","Kangoo","Koleos","Laguna","Latitude","Master","Megane","Modus","Safrane","Scenic","Symbol","Talisman","Twingo","Twizy","Vel Satis","Wind","Zoe"],
  "Triumph": ["Bonneville","GT6","Herald","Spitfire","Stag","TR2","TR3","TR4","TR5","TR6","TR7","TR8","Vitesse"],
}

// Model year ranges for all brands (start year - end year, 0 = still in production)
export const MODEL_YEAR_RANGES: Record<string, Record<string, [number, number]>> = {
  "Acura": {
    "CL": [1997, 2003], "CSX": [2006, 2011], "EL": [1997, 2005], "ILX": [2013, 2022],
    "Integra": [1986, 2006], "Legend": [1986, 1995], "MDX": [2001, 0], "NSX": [1991, 2022],
    "RDX": [2007, 0], "RL": [1996, 2012], "RLX": [2013, 2020], "RSX": [2002, 2006],
    "SLX": [1996, 1999], "TL": [1996, 2014], "TLX": [2015, 0], "TSX": [2004, 2014],
    "Vigor": [1992, 1994], "ZDX": [2010, 2013],
  },
  "Alfa Romeo": {
    "147": [2001, 2010], "156": [1997, 2007], "159": [2005, 2011], "164": [1991, 1995], "166": [1998, 2007],
    "4C": [2014, 2020], "Giulia": [2017, 0], "Giulietta": [2010, 2020], "GTV": [1995, 2006],
    "MiTo": [2008, 2018], "Spider": [1966, 1993], "Stelvio": [2018, 0], "Tonale": [2023, 0],
  },
  "AMC": {
    "AMX": [1968, 1970], "Concord": [1978, 1983], "Eagle": [1980, 1988], "Gremlin": [1970, 1978],
    "Hornet": [1970, 1977], "Javelin": [1968, 1974], "Matador": [1971, 1978], "Pacer": [1975, 1980],
    "Rambler": [1958, 1969], "Spirit": [1979, 1983],
  },
  "Aston Martin": {
    "DB7": [1994, 2004], "DB9": [2004, 2016], "DB11": [2017, 0], "DBS": [2008, 2012],
    "Rapide": [2010, 2020], "V8 Vantage": [2006, 2017], "V12 Vantage": [2010, 2018],
    "Vanquish": [2001, 2018], "Virage": [2011, 2012], "Zagato": [2012, 2013],
  },
  "Audi": {
    "80": [1966, 1996], "90": [1987, 1995], "100": [1968, 1994], "200": [1979, 1991],
    "A3": [1996, 0], "A4": [1994, 0], "A5": [2007, 0], "A6": [1994, 0], "A7": [2010, 0], "A8": [1994, 0],
    "Allroad": [2001, 0], "Cabriolet": [1991, 1998], "Coupe": [1980, 1996],
    "Q3": [2012, 0], "Q4 e-tron": [2022, 0], "Q5": [2009, 0], "Q7": [2006, 0], "Q8": [2019, 0],
    "R8": [2007, 0], "RS3": [2017, 0], "RS4": [2000, 0], "RS5": [2010, 0], "RS6": [2003, 0], "RS7": [2014, 0],
    "S3": [2015, 0], "S4": [1992, 0], "S5": [2008, 0], "S6": [1995, 0], "S7": [2013, 0], "S8": [1996, 0],
    "TT": [1998, 0], "e-tron": [2019, 0], "e-tron GT": [2022, 0],
  },
  "Austin": {
    "A40": [1947, 1967], "A55": [1957, 1961], "Cambridge": [1954, 1969], "Healey": [1952, 1972],
    "Healey 100": [1953, 1956], "Healey 3000": [1959, 1967], "Marina": [1971, 1980],
    "Maxi": [1969, 1981], "Mini": [1959, 2000], "Montego": [1984, 1994], "Princess": [1975, 1981],
  },
  "BMW": {
    "128i": [2008, 2013], "228i": [2014, 0], "230i": [2017, 0], "318i": [1984, 1999],
    "320i": [1977, 0], "323i": [1998, 2012], "325i": [1987, 2013], "328i": [1996, 2016],
    "330i": [2001, 0], "335i": [2007, 2015], "340i": [2016, 0],
    "428i": [2014, 2016], "430i": [2017, 0], "440i": [2017, 0],
    "525i": [1991, 2010], "528i": [1997, 2016], "530i": [2001, 0], "535i": [2008, 2016],
    "540i": [1997, 0], "545i": [2004, 2005], "550i": [2006, 0],
    "640i": [2012, 0], "645i": [2004, 2005], "650i": [2006, 0],
    "740i": [1995, 0], "745i": [2002, 2005], "750i": [1988, 0], "760i": [2003, 0],
    "840i": [2019, 0], "850i": [1990, 1999],
    "M2": [2016, 0], "M3": [1988, 0], "M4": [2015, 0], "M5": [1985, 0], "M6": [1983, 0], "M8": [2020, 0],
    "X1": [2010, 0], "X2": [2018, 0], "X3": [2004, 0], "X4": [2015, 0], "X5": [2000, 0], "X6": [2008, 0], "X7": [2019, 0],
    "Z3": [1996, 2002], "Z4": [2003, 0], "Z8": [2000, 2003],
    "i3": [2014, 2021], "i4": [2022, 0], "i8": [2014, 2020], "iX": [2022, 0],
  },
  "Buick": {
    "Century": [1936, 2005], "Electra": [1959, 1990], "Enclave": [2008, 0], "Encore": [2013, 0],
    "Encore GX": [2020, 0], "Envision": [2016, 0], "LaCrosse": [2005, 2019], "LeSabre": [1959, 2005],
    "Lucerne": [2006, 2011], "Park Avenue": [1991, 2005], "Rainier": [2004, 2007],
    "Regal": [1973, 2020], "Rendezvous": [2002, 2007], "Riviera": [1963, 1999],
    "Roadmaster": [1991, 1996], "Skylark": [1954, 1998], "Somerset": [1985, 1987],
    "Terraza": [2005, 2007], "Verano": [2012, 2017],
  },
  "Cadillac": {
    "Allante": [1987, 1993], "ATS": [2013, 2019], "Brougham": [1987, 1992], "Catera": [1997, 2001],
    "Cimarron": [1982, 1988], "CT4": [2020, 0], "CT5": [2020, 0], "CT6": [2016, 2020],
    "CTS": [2003, 2019], "DeVille": [1959, 2005], "DTS": [2006, 2011], "Eldorado": [1953, 2002],
    "Escalade": [1999, 0], "Escalade ESV": [2003, 0], "Escalade EXT": [2002, 2013],
    "Fleetwood": [1985, 1996], "Lyriq": [2023, 0], "Seville": [1956, 2004],
    "SRX": [2004, 2016], "STS": [2005, 2011], "XT4": [2019, 0], "XT5": [2017, 0],
    "XT6": [2020, 0], "XTS": [2013, 2019], "XLR": [2004, 2009],
  },
  "Chevrolet": {
    "Astro": [1985, 2005], "Avalanche": [2002, 2013], "Aveo": [2004, 2011], "Beretta": [1987, 1996],
    "Blazer": [1969, 0], "Bolt": [2017, 0], "Camaro": [1967, 0], "Caprice": [1966, 1996],
    "Cavalier": [1982, 2005], "Celebrity": [1982, 1990], "Cobalt": [2005, 2010],
    "Colorado": [2004, 0], "Corsica": [1987, 1996], "Corvette": [1953, 0], "Cruze": [2011, 2019],
    "El Camino": [1959, 1987], "Epica": [2004, 2006], "Equinox": [2005, 0], "Express": [1996, 0],
    "HHR": [2006, 2011], "Impala": [1958, 2020], "Lumina": [1990, 2001], "Malibu": [1964, 0],
    "Metro": [1998, 2001], "Monte Carlo": [1970, 2007], "Nova": [1962, 1988], "Optra": [2004, 2008],
    "S-10": [1982, 2004], "Silverado 1500": [1999, 0], "Silverado 2500": [1999, 0], "Silverado 3500": [2001, 0],
    "Sonic": [2012, 2020], "Spark": [2013, 2022], "Sprint": [1985, 1991], "SSR": [2003, 2006],
    "Suburban": [1935, 0], "Tahoe": [1995, 0], "Tracker": [1989, 2004], "TrailBlazer": [2002, 0],
    "Traverse": [2009, 0], "Trax": [2015, 0], "Uplander": [2005, 2009], "Venture": [1997, 2005],
  },
  "Chrysler": {
    "200": [2011, 2017], "300": [2005, 0], "300M": [1999, 2004], "Aspen": [2007, 2009],
    "Cirrus": [1995, 2000], "Concorde": [1993, 2004], "Conquest": [1987, 1989],
    "Crossfire": [2004, 2008], "Fifth Avenue": [1990, 1993], "Imperial": [1990, 1993],
    "Intrepid": [1993, 2004], "LeBaron": [1977, 1995], "LHS": [1994, 2001], "Neon": [1995, 2005],
    "New Yorker": [1939, 1996], "Pacifica": [2004, 0], "PT Cruiser": [2001, 2010],
    "Sebring": [1995, 2010], "Town & Country": [1990, 2016], "Voyager": [2020, 0],
  },
  "Daewoo": {
    "Lanos": [1999, 2002], "Leganza": [1999, 2002], "Matiz": [1998, 2005], "Nubira": [1999, 2002], "Tacuma": [2000, 2008],
  },
  "Dodge": {
    "Aries": [1981, 1989], "Avenger": [1995, 2014], "Caliber": [2007, 2012], "Caravan": [1984, 2020],
    "Challenger": [1970, 0], "Charger": [1966, 0], "Colt": [1971, 1994],
    "D150": [1977, 1993], "D250": [1981, 1993], "D350": [1981, 1993], "Dakota": [1987, 2011],
    "Dart": [2013, 2016], "Daytona": [1984, 1993], "Durango": [1998, 0], "Dynasty": [1988, 1993],
    "Grand Caravan": [1987, 2020], "Intrepid": [1993, 2004], "Journey": [2009, 2020],
    "Magnum": [2005, 2008], "Monaco": [1990, 1992], "Neon": [1995, 2005], "Nitro": [2007, 2011],
    "Omni": [1978, 1990], "RAM 1500": [1994, 0], "RAM 2500": [1994, 0], "RAM 3500": [1994, 0],
    "Ramcharger": [1974, 1993], "Shadow": [1987, 1994], "Spirit": [1989, 1995],
    "Sprinter": [2003, 2009], "Stealth": [1991, 1996], "Stratus": [1995, 2006], "Viper": [1992, 2017],
  },
  "Eagle": {
    "Medallion": [1988, 1989], "Premier": [1988, 1992], "Summit": [1989, 1996], "Talon": [1990, 1998], "Vision": [1993, 1997],
  },
  "Fiat": {
    "124 Spider": [2017, 2020], "500": [2012, 0], "500L": [2014, 2020], "500X": [2016, 0],
    "Brava": [1995, 2002], "Bravo": [1995, 2014], "Coupe": [1993, 2000], "Panda": [1980, 0],
    "Punto": [1993, 2018], "Strada": [1978, 1982], "Tipo": [1988, 0], "Uno": [1983, 1995], "X1/9": [1972, 1989],
  },
  "Ford": {
    "Aerostar": [1986, 1997], "Aspire": [1994, 1997], "Bronco": [1966, 0], "Bronco II": [1984, 1990],
    "Bronco Sport": [2021, 0], "Contour": [1995, 2000], "Crown Victoria": [1992, 2011],
    "E-150": [1975, 2014], "E-250": [1975, 2014], "E-350": [1975, 0],
    "EcoSport": [2018, 2022], "Edge": [2007, 0], "Escape": [2001, 0], "Escort": [1981, 2003],
    "Excursion": [2000, 2005], "Expedition": [1997, 0], "Explorer": [1991, 0],
    "Explorer Sport Trac": [2001, 2010], "F-150": [1948, 0], "F-250": [1953, 0], "F-350": [1953, 0], "F-450": [1999, 0],
    "Festiva": [1988, 1993], "Fiesta": [2011, 2019], "Five Hundred": [2005, 2007],
    "Flex": [2009, 2019], "Focus": [2000, 2018], "Freestar": [2004, 2007], "Freestyle": [2005, 2007],
    "Fusion": [2006, 2020], "Galaxie": [1959, 1974], "Granada": [1975, 1982], "LTD": [1965, 1986],
    "Maverick": [2022, 0], "Mustang": [1964, 0], "Pinto": [1971, 1980], "Probe": [1989, 1997],
    "Ranger": [1983, 0], "Taurus": [1986, 2019], "Tempo": [1984, 1994], "Thunderbird": [1955, 2005],
    "Transit": [2015, 0], "Transit Connect": [2010, 0], "Windstar": [1995, 2003],
  },
  "Geo": {
    "Metro": [1989, 1997], "Prizm": [1989, 1997], "Spectrum": [1985, 1988], "Storm": [1990, 1993], "Tracker": [1989, 1997],
  },
  "GMC": {
    "Acadia": [2007, 0], "C1500": [1988, 1999], "C2500": [1988, 2000], "C3500": [1988, 2002],
    "Canyon": [2004, 0], "Denali": [1999, 0], "Envoy": [1998, 2009], "Jimmy": [1970, 2001],
    "K1500": [1988, 1999], "K2500": [1988, 2000], "K3500": [1988, 2000], "Safari": [1985, 2005],
    "Savana": [1996, 0], "Sierra 1500": [1999, 0], "Sierra 2500": [1999, 0], "Sierra 3500": [2001, 0],
    "Sonoma": [1991, 2004], "Suburban": [1967, 1999], "Terrain": [2010, 0], "Typhoon": [1992, 1993],
    "Yukon": [1992, 0], "Yukon XL": [2000, 0],
  },
  "Honda": {
    "Accord": [1976, 0], "Civic": [1973, 0], "Clarity": [2017, 2021], "CR-V": [1997, 0],
    "CR-Z": [2011, 2016], "Crosstour": [2010, 2015], "CRX": [1984, 1991], "Del Sol": [1993, 1997],
    "Element": [2003, 2011], "Fit": [2007, 2020], "HR-V": [2016, 0], "Insight": [2000, 0],
    "Odyssey": [1995, 0], "Passport": [1994, 0], "Pilot": [2003, 0], "Prelude": [1979, 2001],
    "Prologue": [2024, 0], "Ridgeline": [2006, 0], "S2000": [2000, 2009],
  },
  "Hummer": {
    "H1": [1992, 2006], "H2": [2003, 2009], "H3": [2006, 2010], "H3T": [2009, 2010],
  },
  "Hyundai": {
    "Accent": [1995, 0], "Azera": [2006, 2017], "Elantra": [1992, 0], "Entourage": [2007, 2009],
    "Excel": [1986, 1994], "Genesis": [2009, 2016], "Genesis Coupe": [2010, 2016],
    "Ioniq": [2017, 2022], "Ioniq 5": [2022, 0], "Ioniq 6": [2023, 0],
    "Kona": [2018, 0], "Palisade": [2020, 0], "Pony": [1975, 1990], "Santa Cruz": [2022, 0],
    "Santa Fe": [2001, 0], "Scoupe": [1991, 1995], "Sonata": [1989, 0], "Tiburon": [1997, 2008],
    "Tucson": [2005, 0], "Veloster": [2012, 2021], "Venue": [2020, 0], "XG300": [2001, 2001], "XG350": [2002, 2005],
  },
  "Infiniti": {
    "EX35": [2008, 2012], "EX37": [2013, 2013], "FX35": [2003, 2012], "FX37": [2013, 2013],
    "FX45": [2003, 2008], "FX50": [2009, 2013], "G20": [1991, 2002], "G25": [2011, 2012],
    "G35": [2003, 2008], "G37": [2008, 2013], "I30": [1996, 2001], "I35": [2002, 2004],
    "J30": [1993, 1997], "M30": [1990, 1992], "M35": [2006, 2010], "M37": [2011, 2013],
    "M45": [2003, 2010], "M56": [2011, 2013], "Q40": [2015, 2015], "Q45": [1990, 2006],
    "Q50": [2014, 0], "Q60": [2014, 0], "Q70": [2014, 2019],
    "QX4": [1997, 2003], "QX30": [2017, 2019], "QX50": [2014, 0], "QX55": [2022, 0],
    "QX56": [2004, 2013], "QX60": [2014, 0], "QX70": [2014, 2017], "QX80": [2014, 0],
  },
  "Isuzu": {
    "Amigo": [1989, 2000], "Ascender": [2003, 2008], "Axiom": [2002, 2004], "Hombre": [1996, 2000],
    "i-280": [2006, 2006], "i-290": [2007, 2008], "i-350": [2006, 2006], "i-370": [2007, 2008],
    "Impulse": [1990, 1993], "Oasis": [1996, 1999], "Pickup": [1981, 1995],
    "Rodeo": [1991, 2004], "Rodeo Sport": [2001, 2003], "Stylus": [1991, 1993],
    "Trooper": [1984, 2002], "VehiCROSS": [1999, 2001],
  },
  "Jaguar": {
    "E-Pace": [2018, 0], "F-Pace": [2017, 0], "F-Type": [2014, 0], "I-Pace": [2019, 0],
    "S-Type": [2000, 2008], "Vanden Plas": [1998, 2009], "X-Type": [2002, 2008],
    "XE": [2017, 0], "XF": [2009, 0], "XJ": [1968, 2019], "XJ6": [1968, 1997], "XJ8": [1998, 2009],
    "XJR": [1995, 2009], "XJS": [1976, 1996], "XK": [2007, 2015], "XK8": [1997, 2006], "XKR": [1998, 2015],
  },
  "Jeep": {
    "Cherokee": [1974, 0], "CJ": [1944, 1986], "CJ-5": [1955, 1983], "CJ-7": [1976, 1986],
    "Commander": [2006, 2010], "Compass": [2007, 0], "Gladiator": [2020, 0],
    "Grand Cherokee": [1993, 0], "Grand Cherokee L": [2021, 0], "Grand Wagoneer": [2022, 0],
    "J-10": [1974, 1988], "J-20": [1974, 1988], "Liberty": [2002, 2012], "Patriot": [2007, 2017],
    "Renegade": [2015, 0], "Scrambler": [1981, 1986], "Wagoneer": [2022, 0],
    "Wrangler": [1987, 0], "Wrangler JK": [2007, 2018],
  },
  "Kia": {
    "Amanti": [2004, 2009], "Borrego": [2009, 2009], "Cadenza": [2014, 2020], "Carnival": [2022, 0],
    "EV6": [2022, 0], "EV9": [2024, 0], "Forte": [2010, 0], "K5": [2021, 0], "K900": [2015, 2020],
    "Magentis": [2001, 2010], "Niro": [2017, 0], "Optima": [2001, 2020], "Rio": [2001, 0],
    "Rondo": [2007, 2010], "Sedona": [2002, 2021], "Seltos": [2021, 0], "Sephia": [1994, 2001],
    "Sorento": [2003, 0], "Soul": [2010, 0], "Spectra": [2001, 2009], "Sportage": [1995, 0],
    "Stinger": [2018, 0], "Telluride": [2020, 0],
  },
  "Land Rover": {
    "Defender": [1983, 0], "Discovery": [1994, 0], "Discovery Sport": [2015, 0], "Freelander": [2002, 2005],
    "LR2": [2008, 2015], "LR3": [2005, 2009], "LR4": [2010, 2016],
    "Range Rover": [1970, 0], "Range Rover Classic": [1970, 1995], "Range Rover Evoque": [2012, 0],
    "Range Rover Sport": [2006, 0], "Range Rover Velar": [2018, 0],
  },
  "Lexus": {
    "CT": [2011, 2017], "ES": [1990, 0], "GS": [1993, 2020], "GX": [2003, 0], "HS": [2010, 2012],
    "IS": [1999, 0], "LC": [2018, 0], "LFA": [2012, 2012], "LS": [1990, 0], "LX": [1996, 0],
    "NX": [2015, 0], "RC": [2015, 0], "RX": [1999, 0], "RZ": [2023, 0], "SC": [1992, 2010],
    "TX": [2024, 0], "UX": [2019, 0],
  },
  "Lincoln": {
    "Aviator": [2003, 0], "Blackwood": [2002, 2002], "Continental": [1961, 2020], "Corsair": [2020, 0],
    "LS": [2000, 2006], "Mark III": [1969, 1971], "Mark IV": [1972, 1976], "Mark V": [1977, 1979],
    "Mark VI": [1980, 1983], "Mark VII": [1984, 1992], "Mark VIII": [1993, 1998], "Mark LT": [2006, 2008],
    "MKC": [2015, 2019], "MKS": [2009, 2016], "MKT": [2010, 2019], "MKX": [2007, 2018],
    "MKZ": [2006, 2020], "Nautilus": [2019, 0], "Navigator": [1998, 0], "Town Car": [1981, 2011], "Zephyr": [2006, 2006],
  },
  "Mazda": {
    "2": [2011, 2014], "3": [2004, 0], "5": [2006, 2015], "6": [2003, 0], "323": [1986, 1994],
    "626": [1979, 2002], "929": [1988, 1995], "B-Series": [1972, 2009],
    "CX-3": [2016, 2021], "CX-30": [2020, 0], "CX-5": [2013, 0], "CX-50": [2023, 0],
    "CX-7": [2007, 2012], "CX-9": [2007, 0], "CX-90": [2024, 0], "GLC": [1977, 1986],
    "Millenia": [1995, 2002], "MPV": [1989, 2006], "MX-3": [1992, 1995], "MX-5 Miata": [1990, 0],
    "MX-6": [1988, 1997], "Navajo": [1991, 1994], "Protege": [1990, 2003],
    "RX-3": [1972, 1978], "RX-4": [1974, 1978], "RX-7": [1979, 2002], "RX-8": [2004, 2012], "Tribute": [2001, 2011],
  },
  "Mercedes-Benz": {
    "190": [1984, 1993], "A-Class": [2019, 0], "AMG GT": [2016, 0], "B-Class": [2014, 2019],
    "C-Class": [1994, 0], "CL-Class": [1998, 2014], "CLA": [2014, 0], "CLS": [2006, 0],
    "E-Class": [1986, 0], "EQB": [2022, 0], "EQC": [2020, 0], "EQE": [2023, 0], "EQS": [2022, 0],
    "G-Class": [1979, 0], "GL-Class": [2007, 2016], "GLA": [2015, 0], "GLB": [2020, 0],
    "GLC": [2016, 0], "GLE": [2016, 0], "GLK": [2010, 2015], "GLS": [2017, 0],
    "M-Class": [1998, 2015], "Metris": [2016, 0], "R-Class": [2006, 2013],
    "S-Class": [1972, 0], "SL": [1954, 0], "SLC": [2017, 2020], "SLK": [1997, 2016], "SLR": [2005, 2009], "Sprinter": [2001, 0],
  },
  "Mercury": {
    "Bobcat": [1975, 1980], "Capri": [1991, 1994], "Colony Park": [1957, 1991], "Cougar": [1967, 2002],
    "Grand Marquis": [1975, 2011], "LN7": [1982, 1983], "Lynx": [1981, 1987], "Mariner": [2005, 2011],
    "Marquis": [1967, 1986], "Milan": [2006, 2011], "Montego": [2005, 2007], "Monterey": [2004, 2007],
    "Mountaineer": [1997, 2010], "Mystique": [1995, 2000], "Sable": [1986, 2009],
    "Topaz": [1984, 1994], "Tracer": [1988, 1999], "Villager": [1993, 2002],
  },
  "Mitsubishi": {
    "3000GT": [1991, 1999], "Cordia": [1983, 1988], "Diamante": [1992, 2004], "Eclipse": [1990, 2012],
    "Eclipse Cross": [2018, 0], "Endeavor": [2004, 2011], "Expo": [1992, 1995], "Galant": [1985, 2012],
    "Lancer": [2002, 2017], "Mighty Max": [1983, 1996], "Mirage": [1985, 0],
    "Montero": [1983, 2006], "Montero Sport": [1997, 2004], "Outlander": [2003, 0],
    "Outlander Sport": [2011, 0], "Precis": [1987, 1994], "Raider": [2006, 2009],
    "Sigma": [1989, 1990], "Starion": [1983, 1989], "Tredia": [1983, 1988],
  },
  "Nissan": {
    "200SX": [1984, 1998], "240SX": [1989, 1998], "240Z": [1970, 1973], "260Z": [1974, 1975],
    "280Z": [1975, 1978], "280ZX": [1979, 1983], "300ZX": [1984, 1996],
    "350Z": [2003, 2009], "370Z": [2009, 2020], "Altima": [1993, 0], "Armada": [2004, 0],
    "Cube": [2009, 2014], "D21": [1986, 1997], "Frontier": [1998, 0], "GT-R": [2009, 0],
    "Juke": [2011, 2017], "Kicks": [2018, 0], "Leaf": [2011, 0], "Maxima": [1981, 0],
    "Murano": [2003, 0], "NV200": [2013, 2021], "NX": [1991, 1993], "Pathfinder": [1987, 0],
    "Pulsar": [1983, 1990], "Quest": [1993, 2017], "Rogue": [2008, 0], "Rogue Sport": [2017, 0],
    "Sentra": [1982, 0], "Stanza": [1982, 1992], "Titan": [2004, 0], "Titan XD": [2016, 0],
    "Versa": [2007, 0], "Xterra": [2000, 2015],
  },
  "Oldsmobile": {
    "442": [1964, 1971], "88": [1950, 1999], "98": [1941, 1996], "Achieva": [1992, 1998],
    "Alero": [1999, 2004], "Aurora": [1995, 2003], "Bravada": [1991, 2004], "Calais": [1985, 1991],
    "Ciera": [1982, 1996], "Cutlass": [1961, 1999], "Cutlass Ciera": [1982, 1996],
    "Cutlass Supreme": [1966, 1997], "Delta 88": [1965, 1999], "Firenza": [1982, 1988],
    "Intrigue": [1998, 2002], "Omega": [1973, 1984], "Silhouette": [1990, 2004], "Toronado": [1966, 1992],
  },
  "Plymouth": {
    "Acclaim": [1989, 1995], "Arrow": [1976, 1980], "Barracuda": [1964, 1974], "Breeze": [1996, 2000],
    "Caravelle": [1985, 1988], "Colt": [1971, 1994], "Duster": [1970, 1976],
    "Fury": [1956, 1978], "Gran Fury": [1975, 1989], "Grand Voyager": [1987, 2000],
    "GTX": [1967, 1971], "Horizon": [1978, 1990], "Laser": [1990, 1994], "Neon": [1995, 2001],
    "Prowler": [1997, 2002], "Reliant": [1981, 1989], "Road Runner": [1968, 1980],
    "Satellite": [1965, 1974], "Scamp": [1971, 1976], "Sundance": [1987, 1994],
    "Valiant": [1960, 1976], "Volare": [1976, 1980], "Voyager": [1974, 2000],
  },
  "Pontiac": {
    "6000": [1982, 1991], "Aztek": [2001, 2005], "Bonneville": [1958, 2005], "Catalina": [1959, 1981],
    "Fiero": [1984, 1988], "Firebird": [1967, 2002], "G3": [2009, 2010], "G5": [2007, 2010],
    "G6": [2005, 2010], "G8": [2008, 2009], "Grand Am": [1973, 2005], "Grand Prix": [1962, 2008],
    "GTO": [1964, 2006], "J2000": [1982, 1986], "LeMans": [1962, 1993], "Montana": [1999, 2009],
    "Phoenix": [1977, 1984], "Solstice": [2006, 2010], "Sunbird": [1976, 1994], "Sunfire": [1995, 2005],
    "Tempest": [1961, 1970], "Torrent": [2006, 2009], "Trans Am": [1969, 2002],
    "Trans Sport": [1990, 1998], "Vibe": [2003, 2010],
  },
  "Saab": {
    "9-2X": [2005, 2006], "9-3": [1999, 2011], "9-4X": [2011, 2011], "9-5": [1999, 2011],
    "9-7X": [2005, 2009], "900": [1979, 1998], "9000": [1986, 1998], "96": [1960, 1980], "99": [1969, 1984], "Sonett": [1966, 1974],
  },
  "Saturn": {
    "Astra": [2008, 2009], "Aura": [2007, 2009], "Ion": [2003, 2007], "L-Series": [2000, 2005],
    "Outlook": [2007, 2010], "Relay": [2005, 2007], "S-Series": [1991, 2002], "SC": [1997, 2002],
    "Sky": [2007, 2010], "SL": [1991, 2002], "SW": [1993, 2001], "VUE": [2002, 2010],
  },
  "Scion": {
    "FR-S": [2013, 2016], "iA": [2016, 2016], "iM": [2016, 2016], "iQ": [2012, 2015],
    "tC": [2005, 2016], "xA": [2004, 2006], "xB": [2004, 2015], "xD": [2008, 2014],
  },
  "Subaru": {
    "Ascent": [2019, 0], "Baja": [2003, 2006], "Brat": [1978, 1987], "BRZ": [2013, 0],
    "Crosstrek": [2013, 0], "DL": [1980, 1989], "Forester": [1998, 0], "GL": [1980, 1989],
    "Impreza": [1993, 0], "Justy": [1987, 1994], "Legacy": [1990, 0], "Loyale": [1990, 1994],
    "Outback": [1996, 0], "Solterra": [2023, 0], "SVX": [1992, 1997], "Tribeca": [2006, 2014],
    "WRX": [2002, 0], "WRX STI": [2004, 2021], "XT": [1985, 1991], "XV Crosstrek": [2013, 2015],
  },
  "Suzuki": {
    "Aerio": [2002, 2007], "Alto": [1979, 0], "Equator": [2009, 2012], "Esteem": [1995, 2002],
    "Forenza": [2004, 2008], "Grand Vitara": [1999, 2013], "Kizashi": [2010, 2013],
    "Reno": [2005, 2008], "Samurai": [1986, 1995], "Sidekick": [1989, 1998], "Swift": [1989, 2001],
    "SX4": [2007, 2013], "Verona": [2004, 2006], "Vitara": [1999, 0], "X-90": [1996, 1998], "XL-7": [2001, 2009],
  },
  "Toyota": {
    "4Runner": [1984, 0], "86": [2017, 0], "Avalon": [1995, 2022], "C-HR": [2018, 0],
    "Camry": [1983, 0], "Celica": [1971, 2005], "Corolla": [1966, 0], "Corolla Cross": [2022, 0],
    "Corona": [1957, 1982], "Cressida": [1978, 1992], "Crown": [2023, 0], "Echo": [2000, 2005],
    "FJ Cruiser": [2007, 2014], "GR86": [2022, 0], "GR Corolla": [2023, 0], "GR Supra": [2020, 0],
    "Highlander": [2001, 0], "Land Cruiser": [1958, 0], "Matrix": [2003, 2013], "MR2": [1985, 2005],
    "Paseo": [1992, 1997], "Pickup": [1964, 1995], "Previa": [1991, 1997],
    "Prius": [2001, 0], "Prius Prime": [2017, 0], "RAV4": [1996, 0], "RAV4 Prime": [2021, 0],
    "Sequoia": [2001, 0], "Sienna": [1998, 0], "Solara": [1999, 2008], "Starlet": [1973, 1999],
    "Supra": [1979, 2002], "T100": [1993, 1998], "Tacoma": [1995, 0], "Tercel": [1978, 1999],
    "Tundra": [2000, 0], "Van": [1984, 1989], "Venza": [2009, 0], "Yaris": [2007, 2020],
  },
  "Volkswagen": {
    "Arteon": [2019, 0], "Atlas": [2018, 0], "Atlas Cross Sport": [2020, 0], "Beetle": [1938, 2019],
    "Cabrio": [1995, 2002], "Cabriolet": [1985, 1993], "CC": [2009, 2017], "Corrado": [1990, 1995],
    "Dasher": [1974, 1981], "Eos": [2007, 2016], "Fox": [1987, 1993],
    "Golf": [1974, 0], "Golf GTI": [1983, 0], "Golf R": [2012, 0], "ID.4": [2021, 0],
    "Jetta": [1980, 0], "Karmann Ghia": [1955, 1974], "New Beetle": [1998, 2010],
    "Passat": [1990, 0], "Phaeton": [2004, 2006], "Quantum": [1982, 1988], "Rabbit": [1975, 2009],
    "Routan": [2009, 2014], "Scirocco": [1974, 2017], "Taos": [2022, 0], "Thing": [1973, 1974],
    "Tiguan": [2009, 0], "Touareg": [2004, 0], "Vanagon": [1980, 1991],
  },
  "Volvo": {
    "122": [1956, 1970], "142": [1967, 1974], "144": [1967, 1974], "164": [1969, 1975],
    "240": [1975, 1993], "242": [1975, 1984], "244": [1975, 1993], "245": [1975, 1993],
    "262": [1977, 1981], "264": [1975, 1982], "740": [1985, 1992], "745": [1985, 1990],
    "760": [1983, 1990], "780": [1987, 1991], "850": [1993, 1997], "940": [1991, 1998], "960": [1991, 1998],
    "C30": [2008, 2013], "C40": [2022, 0], "C70": [1998, 2013], "S40": [1996, 2012], "S60": [2001, 0],
    "S70": [1998, 2000], "S80": [1999, 2016], "S90": [2017, 0], "V40": [2000, 2004], "V50": [2005, 2011],
    "V60": [2011, 0], "V70": [1998, 2016], "V90": [2017, 0],
    "XC40": [2019, 0], "XC60": [2010, 0], "XC70": [2003, 2016], "XC90": [2003, 0],
  },
}

export interface PartCategory {
  id: string
  label: string
  icon: string
  parts: string[]
}

export const PART_CATEGORIES: PartCategory[] = [
  { id: "engines", label: "Engines", icon: "engine", parts: ["Complete Engine","Long Block Engine","Short Block Engine","Cylinder Head","Engine Block","Crankshaft","Camshaft","Pistons","Timing Chain Kit","Oil Pump","Valve Cover","Intake Manifold","Exhaust Manifold","Flywheel","Fuel Pump","Fuel Injector","Throttle Body","Timing Cover","Oil Pan Engine","Turbo Charger"] },
  { id: "transmissions", label: "Transmissions", icon: "transmission", parts: ["Automatic Transmission","Manual Transmission","CVT Transmission","Transfer Case","Torque Converter","Transaxle","Clutch Kit","Clutch Master Cylinder","Bell Housing","Flywheel","Transmission Pan"] },
  { id: "drivetrain", label: "Drivetrain", icon: "drivetrain", parts: ["Axle Assembly Front","Axle Assembly Rear","Axle Beam","Axle Shaft","CV Axle","Drive Shaft Front","Drive Shaft Rear","Front Differential","Rear Differential","Differential Assembly","Carrier Assembly","Wheel Hub Assembly","U-Joint"] },
  { id: "electrical", label: "Electrical", icon: "electrical", parts: ["Alternator","Starter Motor","ECU / PCM Module","ABS Control Module","Body Control Module","Ignition Coil","Mass Air Flow Sensor","Air Flow Meter","Oxygen Sensor","Column Switch","Speedometer","Instrument Cluster","GPS Screen","Wiper Motor","Convertible Top Motor","Electric Door Motor"] },
  { id: "cooling", label: "Cooling & Climate", icon: "cooling", parts: ["Radiator","AC Compressor","AC Condenser","AC Evaporator","Intercooler","Supercharger","Water Pump","Heater Core","Heater Controls","Blower Motor","Fan Blade","Fan Clutch","Expansion Valve"] },
  { id: "brakes", label: "Brakes & Safety", icon: "brakes", parts: ["ABS","ABS Pump","Anti Lock Braking System","Brake Caliper","Power Brake Booster","Brake Master Cylinder","Brake Rotor","Brake Pad Set"] },
  { id: "suspension", label: "Suspension & Steering", icon: "suspension", parts: ["Control Arm Front","Control Arm Rear","Strut","Coil Spring","Sway Bar","Steering Rack","Steering Column","Power Steering Pump","Tie Rod","Ball Joint","Wheel Bearing","Spindle","Rear Knuckle","Torsion Bar"] },
  { id: "body", label: "Body & Interior", icon: "body", parts: ["Door Assembly","Hood","Front Bumper","Rear Bumper","Fender","Quarter Panel","Tailgate","Dashboard","Seat Assembly","Door Mirror","Headlight Assembly","Tail Light Assembly","Airbag Module","Window Regulator Front","Window Regulator Rear","Window Regulator Quarter"] },
  { id: "exhaust", label: "Exhaust System", icon: "exhaust", parts: ["Catalytic Converter","Exhaust Manifold","Muffler","Exhaust Pipe","Resonator","Oxygen Sensor"] },
]

export const YEARS = Array.from({ length: 36 }, (_, i) => String(new Date().getFullYear() - i))

export const US_STATES = [
  { abbr: "AL", name: "Alabama" }, { abbr: "AK", name: "Alaska" }, { abbr: "AZ", name: "Arizona" }, { abbr: "AR", name: "Arkansas" },
  { abbr: "CA", name: "California" }, { abbr: "CO", name: "Colorado" }, { abbr: "CT", name: "Connecticut" }, { abbr: "DE", name: "Delaware" },
  { abbr: "FL", name: "Florida" }, { abbr: "GA", name: "Georgia" }, { abbr: "HI", name: "Hawaii" }, { abbr: "ID", name: "Idaho" },
  { abbr: "IL", name: "Illinois" }, { abbr: "IN", name: "Indiana" }, { abbr: "IA", name: "Iowa" }, { abbr: "KS", name: "Kansas" },
  { abbr: "KY", name: "Kentucky" }, { abbr: "LA", name: "Louisiana" }, { abbr: "ME", name: "Maine" }, { abbr: "MD", name: "Maryland" },
  { abbr: "MA", name: "Massachusetts" }, { abbr: "MI", name: "Michigan" }, { abbr: "MN", name: "Minnesota" }, { abbr: "MS", name: "Mississippi" },
  { abbr: "MO", name: "Missouri" }, { abbr: "MT", name: "Montana" }, { abbr: "NE", name: "Nebraska" }, { abbr: "NV", name: "Nevada" },
  { abbr: "NH", name: "New Hampshire" }, { abbr: "NJ", name: "New Jersey" }, { abbr: "NM", name: "New Mexico" }, { abbr: "NY", name: "New York" },
  { abbr: "NC", name: "North Carolina" }, { abbr: "ND", name: "North Dakota" }, { abbr: "OH", name: "Ohio" }, { abbr: "OK", name: "Oklahoma" },
  { abbr: "OR", name: "Oregon" }, { abbr: "PA", name: "Pennsylvania" }, { abbr: "RI", name: "Rhode Island" }, { abbr: "SC", name: "South Carolina" },
  { abbr: "SD", name: "South Dakota" }, { abbr: "TN", name: "Tennessee" }, { abbr: "TX", name: "Texas" }, { abbr: "UT", name: "Utah" },
  { abbr: "VT", name: "Vermont" }, { abbr: "VA", name: "Virginia" }, { abbr: "WA", name: "Washington" }, { abbr: "WV", name: "West Virginia" },
  { abbr: "WI", name: "Wisconsin" }, { abbr: "WY", name: "Wyoming" },
]

export interface Yard {
  name: string
  city: string
  state: string
  rating: number
  reviews: number
}

export const YARDS: Yard[] = [
  { name: "Pacific Auto Recycling", city: "Los Angeles", state: "CA", rating: 5, reviews: 312 },
  { name: "Desert Sun Salvage", city: "Phoenix", state: "AZ", rating: 4, reviews: 187 },
  { name: "Midwest Auto Parts", city: "Chicago", state: "IL", rating: 5, reviews: 241 },
  { name: "East Coast Recyclers", city: "Philadelphia", state: "PA", rating: 4, reviews: 156 },
]

export interface SearchResult {
  id: number
  yard: Yard
  price: number
  miles: number
  condition: string
  warranty: string
  shipping: number
  inStock: boolean
}

export function generateResults(year: string, make: string, model: string, part: string): SearchResult[] {
  if (!make) return []
  const base = part.toLowerCase().includes("engine") ? 1200
    : part.toLowerCase().includes("transmission") ? 900
    : part.toLowerCase().includes("turbo") ? 650
    : part.toLowerCase().includes("alternator") || part.toLowerCase().includes("starter") ? 150
    : part.toLowerCase().includes("radiator") ? 280
    : 400
  return [
    { id: 1, yard: YARDS[0], price: base, miles: 32000, condition: "Excellent", warranty: "90 Days", shipping: 5, inStock: true },
    { id: 2, yard: YARDS[1], price: Math.round(base * 0.88), miles: 78000, condition: "Good", warranty: "90 Days", shipping: 7, inStock: true },
    { id: 3, yard: YARDS[2], price: Math.round(base * 0.95), miles: 51000, condition: "Very Good", warranty: "90 Days", shipping: 8, inStock: true },
    { id: 4, yard: YARDS[3], price: Math.round(base * 1.1), miles: 94000, condition: "Good", warranty: "90 Days", shipping: 10, inStock: false },
  ]
}

export const NAV_LINKS = [
  { label: "Home",             href: "/" },
  { label: "All Parts",        href: "/parts" },
  { label: "About",            href: "/about" },
  { label: "Contact",          href: "/contact" },
]

export const PHONE_SALES = "1-888-887-4199"
export const PHONE_DISPLAY = "1-888-887-4199"
export const CONTACT_EMAIL = "auapworld@gmail.com"
export const COMPANY_TAGLINE = "Trusted Partner for Automotive Services and Solutions"

// Brand colors for background tints
export const BRAND_COLORS: Record<string, string> = {
  "Acura":         "#000000", "Alfa Romeo":    "#8B0000", "AMC":           "#1a3c5e",
  "Aston Martin":  "#005A30", "Audi":          "#000000", "Austin":        "#2C5E1A",
  "BMW":           "#0066B1", "Buick":         "#6C7A89", "Cadillac":      "#9B7B3B",
  "Chevrolet":     "#D1A00C", "Chrysler":      "#1C1C1C", "Daewoo":        "#003087",
  "Dodge":         "#BA0C2F", "Eagle":         "#2C3E50", "Fiat":          "#8B0000",
  "Ford":          "#003399", "Geo":           "#2E86C1", "GMC":           "#CC0000",
  "Honda":         "#CC0000", "Hummer":        "#3D3D3D", "Hyundai":       "#002C5F",
  "Infiniti":      "#5C5C5C", "Isuzu":         "#CC0000", "Jaguar":        "#336633",
  "Jeep":          "#3B5322", "Kia":           "#05141F", "Land Rover":    "#005A2B",
  "Lexus":         "#1A1A1A", "Lincoln":       "#2C2C2C", "Mazda":         "#920000",
  "Mercedes-Benz": "#333333", "Mercury":       "#4A4A4A", "Mitsubishi":    "#CC0000",
  "Nissan":        "#C3002F", "Oldsmobile":    "#1C3A5F", "Plymouth":      "#003087",
  "Pontiac":       "#CC0000", "Saab":          "#003366", "Saturn":        "#1B4F72",
  "Scion":         "#4A0080", "Subaru":        "#003399", "Suzuki":        "#004D9A",
  "Toyota":        "#CC0000", "Volkswagen":    "#001E50", "Volvo":         "#003057",
}

// Local luxury chrome logo images (generated, stored in /public/logos/)
// All brands covered - using .png format for new generated logos
export const BRAND_LOGO_URLS: Record<string, string> = {
  "Acura":         "/logos/acura.png",
  "Alfa Romeo":    "/logos/alfa-romeo.png",
  "AMC":           "/logos/amc.png",
  "Aston Martin":  "/logos/aston-martin.jpg",
  "Audi":          "/logos/audi.png",
  "Austin":        "/logos/austin.jpg",
  "BMW":           "/logos/bmw.png",
  "Buick":         "/logos/buick.png",
  "Cadillac":      "/logos/cadillac.png",
  "Chevrolet":     "/logos/chevrolet.png",
  "Chrysler":      "/logos/chrysler.png",
  "Daewoo":        "/logos/daewoo.png",
  "Dodge":         "/logos/dodge.png",
  "Eagle":         "/logos/eagle.png",
  "Fiat":          "/logos/fiat.png",
  "Ford":          "/logos/ford.png",
  "Geo":           "/logos/geo.png",
  "GMC":           "/logos/gmc.jpg",
  "Honda":         "/logos/honda.jpg",
  "Hummer":        "/logos/hummer.png",
  "Hyundai":       "/logos/hyundai.jpg",
  "Infiniti":      "/logos/infiniti.jpg",
  "Isuzu":         "/logos/isuzu.png",
  "Jaguar":        "/logos/jaguar.jpg",
  "Jeep":          "/logos/jeep.jpg",
  "Kia":           "/logos/kia.jpg",
  "Land Rover":    "/logos/land-rover.jpg",
  "Lexus":         "/logos/lexus.jpg",
  "Lincoln":       "/logos/lincoln.jpg",
  "Mazda":         "/logos/mazda.jpg",
  "Mercedes-Benz": "/logos/mercedes-benz.jpg",
  "Mercury":       "/logos/mercury.png",
  "Mitsubishi":    "/logos/mitsubishi.jpg",
  "Nissan":        "/logos/nissan.jpg",
  "Oldsmobile":    "/logos/oldsmobile.png",
  "Plymouth":      "/logos/plymouth.png",
  "Pontiac":       "/logos/pontiac.png",
  "Saab":          "/logos/saab.jpg",
  "Saturn":        "/logos/saturn.png",
  "Scion":         "/logos/scion.png",
  "Subaru":        "/logos/subaru.jpg",
  "Suzuki":        "/logos/suzuki.png",
  "Toyota":        "/logos/toyota.jpg",
  "Volkswagen":    "/logos/volkswagen.jpg",
  "Volvo":         "/logos/volvo.jpg",
  "Daihatsu":      "/logos/daihatsu.png",
  "Mini":          "/logos/mini.png",
  "Opel":          "/logos/opel.png",
  "Peugeot":       "/logos/peugeot.png",
  "Porsche":       "/logos/porsche.png",
  "Renault":       "/logos/renault.png",
  "Triumph":       "/logos/triumph.png",
}

export function getBrandLogoUrl(brand: string): string {
  return BRAND_LOGO_URLS[brand] ?? ""
}

// Car images for brand banner backgrounds (using Unsplash for high-quality car images)
export const BRAND_CAR_IMAGES: Record<string, string> = {
  "Acura":         "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1600&h=900&fit=crop",
  "Alfa Romeo":    "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1600&h=900&fit=crop",
  "AMC":           "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1600&h=900&fit=crop",
  "Aston Martin":  "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1600&h=900&fit=crop",
  "Audi":          "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1600&h=900&fit=crop",
  "Austin":        "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1600&h=900&fit=crop",
  "BMW":           "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1600&h=900&fit=crop",
  "Buick":         "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1600&h=900&fit=crop",
  "Cadillac":      "https://images.unsplash.com/photo-1616422285623-13ff0162193c?w=1600&h=900&fit=crop",
  "Chevrolet":     "https://images.unsplash.com/photo-1612544448445-b8232cff3b6c?w=1600&h=900&fit=crop",
  "Chrysler":      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1600&h=900&fit=crop",
  "Daewoo":        "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1600&h=900&fit=crop",
  "Dodge":         "https://images.unsplash.com/photo-1594950195050-d27d0ccb8e1e?w=1600&h=900&fit=crop",
  "Eagle":         "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1600&h=900&fit=crop",
  "Fiat":          "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1600&h=900&fit=crop",
  "Ford":          "https://images.unsplash.com/photo-1551830820-330a71b99659?w=1600&h=900&fit=crop",
  "Geo":           "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1600&h=900&fit=crop",
  "GMC":           "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1600&h=900&fit=crop",
  "Honda":         "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=1600&h=900&fit=crop",
  "Hummer":        "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1600&h=900&fit=crop",
  "Hyundai":       "https://images.unsplash.com/photo-1629897048514-3dd7414fe72a?w=1600&h=900&fit=crop",
  "Infiniti":      "https://images.unsplash.com/photo-1580274455191-1c62238fa333?w=1600&h=900&fit=crop",
  "Isuzu":         "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1600&h=900&fit=crop",
  "Jaguar":        "https://images.unsplash.com/photo-1618843479619-f3d0d81e4d10?w=1600&h=900&fit=crop",
  "Jeep":          "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1600&h=900&fit=crop",
  "Kia":           "https://images.unsplash.com/photo-1609286059189-50d5e0f33d0b?w=1600&h=900&fit=crop",
  "Land Rover":    "https://images.unsplash.com/photo-1606611013016-969c19ba27bb?w=1600&h=900&fit=crop",
  "Lexus":         "https://images.unsplash.com/photo-1621993202323-f438eec934ff?w=1600&h=900&fit=crop",
  "Lincoln":       "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1600&h=900&fit=crop",
  "Mazda":         "https://images.unsplash.com/photo-1626668893632-6f3a4466d22f?w=1600&h=900&fit=crop",
  "Mercedes-Benz": "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1600&h=900&fit=crop",
  "Mercury":       "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1600&h=900&fit=crop",
  "Mitsubishi":    "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=1600&h=900&fit=crop",
  "Nissan":        "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1600&h=900&fit=crop",
  "Oldsmobile":    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1600&h=900&fit=crop",
  "Plymouth":      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1600&h=900&fit=crop",
  "Pontiac":       "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1600&h=900&fit=crop",
  "Saab":          "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1600&h=900&fit=crop",
  "Saturn":        "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1600&h=900&fit=crop",
  "Scion":         "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1600&h=900&fit=crop",
  "Subaru":        "https://images.unsplash.com/photo-1626668893632-6f3a4466d22f?w=1600&h=900&fit=crop",
  "Suzuki":        "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1600&h=900&fit=crop",
  "Toyota":        "https://images.unsplash.com/photo-1621993202323-f438eec934ff?w=1600&h=900&fit=crop",
  "Volkswagen":    "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1600&h=900&fit=crop",
  "Volvo":         "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1600&h=900&fit=crop",
}

export function getBrandCarImageUrl(brand: string): string {
  return BRAND_CAR_IMAGES[brand] ?? "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1600&h=900&fit=crop"
}

// Legacy lookup for backward compat
export const BRAND_LOGOS = BRAND_COLORS

export const TESTIMONIALS = [
  { text: "Found a complete engine for my F-150 at a fraction of dealer price. The process was seamless and the part arrived in perfect condition.", name: "Michael R.", location: "Austin, TX", rating: 5 },
  { text: "Called on a Monday, had a quote by Tuesday morning. Transmission arrived Wednesday. Exactly what was described. Outstanding service.", name: "Sandra L.", location: "Phoenix, AZ", rating: 5 },
  { text: "Second time using AUAPW. First was a transfer case, now a cylinder head. Both times faultless. The 90-day warranty gives real peace of mind.", name: "James T.", location: "Atlanta, GA", rating: 5 },
  { text: "I was skeptical about buying a used engine online. Their team confirmed fitment and the part came with full paperwork. Couldn't ask for more.", name: "Patricia M.", location: "Seattle, WA", rating: 5 },
]

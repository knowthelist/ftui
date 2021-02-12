/*
  19 intermediates:
  CLOUDLESS, SUNNY, FAIR, PARTLY_CLOUDY, MOSTLY_CLOUDY, CLOUDY, VERY_CLOUDY, OVERCAST,
  FOGGY, DRIZZLE, LIGHT_SHOWERS, SHOWERS, RAIN_SNOW, SNOW_SHOWER, THUNDERSTORM, SNOW,
  SCATTERED_THUNDERSTORM, NA, CLEAR
*/

export const providerSet = {
  proplanta: {
    wolkenlos: 'CLOUDLESS',
    sonnig: 'SUNNY',
    heiter: 'FAIR',
    'leicht bewölkt': 'PARTLY_CLOUDY',
    wolkig: 'MOSTLY_CLOUDY',
    'bewölkt': 'CLOUDY',
    'stark bewölkt': 'VERY_CLOUDY',
    bedeckt: 'OVERCAST',
    Nebel: 'FOGGY',
    'Sprühregen': 'DRIZZLE',
    Regenschauer: 'LIGHT_SHOWERS',
    Regen: 'SHOWERS',
    Schneeregen: 'RAIN_SNOW',
    Schneeschauer: 'SNOW_SHOWER',
    Gewitter: 'THUNDERSTORM',
    Schneefall: 'SNOW',
    'unterschiedlich bewölkt, vereinzelt Schauer und Gewitter': 'SCATTERED_THUNDERSTORM',
    nb: 'NA',
    klar: 'CLEAR',
  }
}

export const iconSet = {
  kleinklima: {
    CLOUDLESS: './icons/weather/kleinklima/sunny.svg',
    SUNNY: './icons/weather/kleinklima/sunny.svg',
    FAIR: './icons/weather/kleinklima/mostly_sunny.svg',
    PARTLY_CLOUDY: './icons/weather/kleinklima/mostly_cloudy.svg',
    MOSTLY_CLOUDY: './icons/weather/kleinklima/mostly_cloudy.svg',
    CLOUDY: './icons/weather/kleinklima/mostly_cloudy.svg',
    VERY_CLOUDY: './icons/weather/kleinklima/mostly_cloudy.svg',
    OVERCAST: './icons/weather/kleinklima/overcast.svg',
    FOGGY: './icons/weather/kleinklima/haze.svg',
    DRIZZLE: './icons/weather/kleinklima/mist.svg',
    LIGHT_SHOWERS: './icons/weather/kleinklima/showers.svg',
    SHOWERS: './icons/weather/kleinklima/rain.svg',
    RAIN_SNOW: './icons/weather/kleinklima/rainsnow.svg',
    SNOW_SHOWER: './icons/weather/kleinklima/chance_of_snow.svg',
    THUNDERSTORM: './icons/weather/kleinklima/thunderstorm.svg',
    SNOW: './icons/weather/kleinklima/heavysnow.svg',
    SCATTERED_THUNDERSTORM: './icons/weather/kleinklima/scatteredthunderstorms.svg',
    NA: './icons/weather/kleinklima/na.svg',
    CLEAR: './icons/weather/kleinklima/clear.png',
  },
  meteocons: {
    CLOUDLESS: './icons/sun.svg',
    SUNNY: './icons/sun.svg',
    FAIR: './icons/sun.svg',
    PARTLY_CLOUDY: './icons/cloudy.svg',
    MOSTLY_CLOUDY: './icons/cloudy.svg',
    CLOUDY: './icons/cloud.svg',
    VERY_CLOUDY: './icons/cloudy1.svg',
    OVERCAST: './icons/cloudy1.svg',
    FOGGY: './icons/lines.svg',
    DRIZZLE: './icons/rainy.svg',
    LIGHT_SHOWERS: './icons/rainy.svg',
    SHOWERS: './icons/rainy1.svg',
    RAIN_SNOW: './icons/weather3.svg',
    SNOW_SHOWER: './icons/snowy.svg',
    THUNDERSTORM: './icons/lightning1.svg',
    SNOW: './icons/snowy2.svg',
    SCATTERED_THUNDERSTORM: './icons/sunny-sleet-storm.svg',
    NA: './icons/none.svg',
    CLEAR: './icons/moon.svg',
  }
}

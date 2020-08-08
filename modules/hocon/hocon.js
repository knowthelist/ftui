/* 
* HOCON module for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
* 
* https://github.com/knowthelist/ftui
* 
* adapted from https://github.com/yellowblood/hocon-js
* Copyright (c) 2017 Maor
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
* 
*/

export function parseHocon(text, ignoreDots = false) {
  let index = 0;
  if (!text) return null;
  const result = readHocon(text);
  return handleSubtitutions(result);

  function hoconException(message) {
    this.name = 'parseHoconException';
    this.message = message;
    this.toString = function() {
      return this.name + ': ' + this.message;
    }
  }

  function readHocon(hoconText) {
    let isInQuotes = false;
    let isKeyInQuotes = false;
    let quotesType = '';
    let isEscaping = false;

    let isInCurly = false;
    let isInArray = false;
    let isReadingValue = false;
    let isReadSeperator = false;
    let isInlineComment = false;
    let possibleComment = false;
    let isInMultilineString = false;
    let currentKey = '';
    let currentValue = '';
    let obj = {};

    while (index < hoconText.length) {
      const c = hoconText[index];
      index++;

      if (isInlineComment && !isInMultilineString) {
        if (c === '\r' || c === '\n') {
          isInlineComment = false;
        }
        continue;
      }

      if (!isEscaping && c === '"') {
        if ((index + 1 < hoconText.length) && hoconText[index] === '"' &&
          hoconText[index + 1] === '"') {
          if (isInMultilineString) {
            setValue();
            isInMultilineString = false;
            isInQuotes = false;
            isReadingValue = false;
            index += 2;
            // TODO: if this is followed by another quote, then it's not over..
            continue;
          }

          isInMultilineString = true;
          isInQuotes = true;
          isReadingValue = true;
          index += 2;
          continue;
        }
      }

      if (!isEscaping && !isInMultilineString && c === '"') {
        if (isInQuotes && quotesType === c) {
          if (isReadingValue) {
            setValue();
          }
          else {
            isKeyInQuotes = true;
            isReadingValue = true;
          }
          isInQuotes = false;
          continue;
        }

        isInQuotes = true;
        quotesType = c;
        continue;
      }

      if (isInMultilineString && escapeInMultiLine(c)) {
        currentValue += c;
        continue;
      }

      if (isInQuotes && c === '\\') {
        isEscaping = true;
        continue;
      }

      isEscaping = false;

      if (!isInQuotes) {
        switch (c) {
          case ' ':
            {
              if (currentKey !== '' && !isReadingValue) {
                currentKey += c;
                continue;
              }
              if (currentValue === '')
                continue;
              if (isInArray && isReadingValue) {
                currentValue += c;
                continue;
              }
            }
            break;
          case '\t':
          case '\r':
          case '\n':
          {
            if (isInArray && isReadingValue) {
              if (currentValue === '')
                continue;

              setValue();
              continue;
            }

            if (!currentKey)
              continue;

            if (!isReadingValue) {
              isReadingValue = true;
              continue;
            }

            if (isReadingValue && currentValue) {
              setValue();
              continue;
            }

            continue;
          }
          case '{':
          {
            if (isInCurly || isInArray || currentKey) {
              index--;
              currentKey = currentKey.trim();
              currentValue = readHocon(hoconText);
              setValue();
              continue;
            }

            isInCurly = true;
            continue;
          }
          case '}':
          {
            if (!isInCurly)
              throw new hoconException('closing curl unexpected');

            if (currentValue)
              setValue();
            else if (currentKey)
              return currentKey;

            return obj;
          }
          case ':':
          case '=':
          {
            if (isReadSeperator)
              throw new hoconException('Already met seperator');
            isReadingValue = true;
            isReadSeperator = true;

            currentKey = currentKey.trim();

            continue;
          }
          case ',':
          {
            if (isReadingValue && currentValue)
              setValue();
            continue;
          }
          case '[':
          {
            if (isInCurly || isInArray || currentKey) {
              index--;
              currentValue = readHocon(hoconText);
              setValue();
              continue;
            }
            isReadingValue = true;
            isInArray = true;
            obj = [];
            continue;
          }
          case ']':
          {
            if (!isInArray)
              throw new hoconException('not in an array');

            if (currentValue) {
              currentValue = currentValue.trim();
              setValue();
            }

            return obj;
          }
          case '$':
          {
            if (!currentValue) {
              currentValue = '${' + readHocon(hoconText) + '}';
              setValue();
              continue;
            }
            break;
          }
          case '#':
          {
            isInlineComment = true;
            continue;
          }
          case '/':
          {
            if (possibleComment) {
              isInlineComment = true;
              possibleComment = false;
              continue;
            }
            possibleComment = true;
            continue;
          }
        }
      }
      if (isReadingValue) {
        currentValue += c;
      } else {
        currentKey += c;
      }
    }
    if (isInCurly)
      throw new hoconException('Expected closing curly bracket');

    if (isInArray)
      throw new hoconException('Expected closing square bracket');

    if (isReadingValue) {
      setValue();
    }
    return obj;

    function escapeInMultiLine(char) {
      return ['"', '\\'].indexOf(char) !== -1;
    }

    function setValue(key = currentKey, objt = obj) {
      if (!isInArray && !isKeyInQuotes && !ignoreDots) {
        const dotIndex = key.indexOf('.');
        if (dotIndex > 0) {
          const partKey = key.substring(0, dotIndex);
          objt[partKey] = objt[partKey] || {};
          setValue(key.substring(dotIndex + 1), objt[partKey]);
          return;
        }
      }

      if (!isInQuotes && typeof currentValue === 'string') {
        currentValue = currentValue.trim();
        if (/^\d+$/.test(currentValue))
          currentValue = parseInt(currentValue);
        else if (/^\d+\.\d+$/.test(currentValue))
          currentValue = parseFloat(currentValue);
        else if (currentValue === 'true')
          currentValue = true;
        else if (currentValue === 'false')
          currentValue = false;
        else if (currentValue === 'null')
          currentValue = null;
      }

      if (isInArray) {
        objt.push(currentValue);
      } else {
        if (typeof objt[key] === 'object' && typeof currentValue === 'object')
          extend(objt[key], currentValue)
        else {
          objt[key] = currentValue;

        }
        isKeyInQuotes = false;
        isReadingValue = false;
      }
      isReadSeperator = false;
      currentKey = '';
      currentValue = '';
    }
  }

  function handleSubtitutions(mainObj, intermidiateObj, loops) {
    loops = loops || 0;
    if (loops > 8)
      return null;

    intermidiateObj = typeof intermidiateObj === 'undefined' ? mainObj :
      intermidiateObj;
    if (intermidiateObj == null)
      return intermidiateObj;

    if (Array.isArray(intermidiateObj)) {
      intermidiateObj.forEach(function (element, index) {
        intermidiateObj[index] = handleSubtitutions(mainObj, element);
      });
    } else if (typeof intermidiateObj === 'string') {
      const match = /^\$\{(.+?)\}$/.exec(intermidiateObj);
      if (match && match.length == 2) {
        const val = eval('mainObj.' + match[1]);
        if (typeof val === 'undefined')
          return null;
        return handleSubtitutions(mainObj, val, loops + 1);
      }
    } else if (typeof intermidiateObj === 'object') {
      Object.keys(intermidiateObj).forEach(function (key) {
        intermidiateObj[key] = handleSubtitutions(mainObj, intermidiateObj[
          key]);
      });
    }

    return intermidiateObj;
  }

  function extend() {
    for (let i = 1; i < arguments.length; i++)
      for (const key in arguments[i])
        if (arguments[i].hasOwnProperty(key)) {
          if (typeof arguments[0][key] === 'object' && typeof arguments[i][key] ===
            'object')
            extend(arguments[0][key], arguments[i][key]);
          else
            arguments[0][key] = arguments[i][key];
        }
    return arguments[0];
  }
}
